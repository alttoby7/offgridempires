"""
Auto-seed BOM data for Shop Solar kits from shopsolar_registry.json specs.

Reads new_kits entries with status="approved", generates BOM from spec fields,
and writes kit_items + kit_role_coverage + kit_total_cost_current to DB.

Run: python3 scripts/seed-bom-shopsolar.py
Run dry-run: python3 scripts/seed-bom-shopsolar.py --dry-run

--all-with-prices: Seed ALL in-DB kits that have prices but no BOM items.
  Reads spec fields directly from DB (panel_array_w, battery_usable_wh, etc.).
  Skips kits with no spec data at all (nothing to generate BOM from).
  Usage: python3 scripts/seed-bom-shopsolar.py --all-with-prices [--dry-run]

Requires SSH tunnel: ssh -fN -L 15433:localhost:5433 n8n-basecamp
"""

import json
import os
import sys
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

env_path = Path.home() / "google-drive" / "0-AI" / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()

DATABASE_URL = os.environ.get("OFFGRID_DATABASE_URL", "")
DRY_RUN = "--dry-run" in sys.argv
ALL_WITH_PRICES = "--all-with-prices" in sys.argv

REGISTRY_PATH = Path(__file__).parent / "shopsolar_registry.json"

# ── BOM generation config ────────────────────────────────────────────────────

# For complete systems (panelW >= 1000), we include dedicated charge controller,
# wiring, and mounting. Portables have these built-in.
LARGE_SYSTEM_THRESHOLD = 1000  # watts

# Missing cost estimates in cents
MISSING_COSTS = {
    "charge_controller": 19900,   # ~$199 30A MPPT
    "wiring_kit": 4900,           # ~$49
    "mounting_hardware": 3900,    # ~$39
    "monitoring": 4900,           # ~$49
}


def build_bom(slug: str, specs: dict) -> dict:
    """Generate BOM from kit specs."""
    panel_w = specs.get("panelW", 0)
    battery_total_wh = specs.get("batteryTotalWh", 0)
    battery_usable_wh = specs.get("batteryUsableWh", 0)
    inverter_w = specs.get("inverterW", 0)
    voltage = specs.get("voltage", 48)
    chemistry = specs.get("chemistry", "LiFePO4")

    is_large = panel_w >= LARGE_SYSTEM_THRESHOLD

    # Determine what's included
    has_panels = panel_w > 0
    has_battery = battery_total_wh > 0
    has_inverter = inverter_w > 0
    has_controller = is_large  # large complete systems include dedicated MPPT
    has_wiring = is_large
    has_mounting = is_large

    items = []

    # Panel array
    if has_panels:
        items.append({
            "role": "panel_array",
            "included": True,
            "name": f"{panel_w}W Solar Array",
            "specs": f"{panel_w}W total capacity",
            "qty": 1,
        })
    else:
        items.append({
            "role": "panel_array",
            "included": False,
            "name": "Solar panels not included",
            "specs": "Panels sold separately",
            "qty": 1,
            "cost": 0,
        })

    # Battery bank
    if has_battery:
        items.append({
            "role": "battery_bank",
            "included": True,
            "name": f"{battery_usable_wh}Wh {chemistry} Battery",
            "specs": f"{battery_usable_wh}Wh usable capacity",
            "qty": 1,
        })
    else:
        items.append({
            "role": "battery_bank",
            "included": False,
            "name": "Battery not included",
            "specs": "Battery sold separately",
            "qty": 1,
            "cost": 0,
        })

    # Inverter
    if has_inverter:
        items.append({
            "role": "inverter",
            "included": True,
            "name": f"{inverter_w}W Inverter",
            "specs": f"{inverter_w}W continuous output",
            "qty": 1,
        })
    else:
        items.append({
            "role": "inverter",
            "included": False,
            "name": "Inverter not included",
            "specs": "Inverter sold separately",
            "qty": 1,
            "cost": 0,
        })

    # Charge controller
    # Large systems: dedicated MPPT included as separate component
    # Portables: charge controller is built into the unit (not a separate purchase)
    items.append({
        "role": "charge_controller",
        "included": True,  # always "included" — large systems have dedicated MPPT; portables have built-in
        "name": "MPPT Charge Controller" if is_large else "Built-in Charge Controller",
        "specs": "Included with system" if is_large else "Integrated into power station",
        "qty": 1,
    })

    # Wiring kit
    # Large systems: full wiring kit included; portables: basic cable included
    items.append({
        "role": "wiring_kit",
        "included": True,  # always included — large systems have full kit; portables have panel cable
        "name": "Wiring Kit" if is_large else "Solar Input Cable",
        "specs": "Included cables and connectors" if is_large else "MC4 panel input cable included",
        "qty": 1,
    })

    # Mounting hardware
    # Large systems: brackets included; portables: not needed (set on ground/table)
    items.append({
        "role": "mounting_hardware",
        "included": True,  # always included — large systems have brackets; portables need no mounting
        "name": "Mounting Hardware" if is_large else "Portable (No Mounting Required)",
        "specs": "Included mounting brackets" if is_large else "Portable unit, no mounting needed",
        "qty": 1 if is_large else 0,
    })

    # Monitoring — not reliably present, always mark missing
    items.append({
        "role": "monitoring",
        "included": False,
        "name": "Not included",
        "specs": "No remote monitoring",
        "qty": 0,
        "cost": 0,
    })

    return {
        "slug": slug,
        "voltage": voltage,
        "panelW": panel_w,
        "batteryTotalWh": battery_total_wh,
        "batteryUsableWh": battery_usable_wh,
        "inverterW": inverter_w,
        "inverterSurgeW": 0,
        "chemistry": chemistry,
        "includesPanels": has_panels,
        "includesBatteries": has_battery,
        "includesInverter": has_inverter,
        "includesController": has_controller,
        "items": items,
    }


def main():
    # Load registry
    with open(REGISTRY_PATH) as f:
        registry = json.load(f)

    new_kits = registry.get("new_kits", [])
    approved = [k for k in new_kits if k.get("status") == "approved"]

    if not approved:
        print("No approved new_kits found in shopsolar_registry.json")
        sys.exit(0)

    print(f"Found {len(approved)} approved Shop Solar kits in registry")

    if DRY_RUN:
        print("\n[DRY RUN — no DB writes]\n")
        for entry in approved:
            slug = entry["proposed_slug"]
            specs = entry.get("specs", {})
            bom = build_bom(slug, specs)
            included = sum(1 for i in bom["items"] if i["included"])
            missing_cents = sum(i.get("cost", 0) for i in bom["items"] if not i["included"])
            print(f"  {slug}")
            print(f"    {bom['panelW']}W panels / {bom['batteryUsableWh']}Wh battery / {bom['inverterW']}W inverter")
            print(f"    {included}/{len(bom['items'])} components included, ~${missing_cents/100:.0f} missing")
        return

    if not DATABASE_URL:
        print("ERROR: OFFGRID_DATABASE_URL not set")
        sys.exit(1)

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Load role map
    cur.execute("SELECT id, code FROM component_roles")
    role_map = {row[1]: row[0] for row in cur.fetchall()}

    # Load use case map
    cur.execute("SELECT id, slug FROM use_cases")
    uc_map = {row[1]: row[0] for row in cur.fetchall()}
    default_uc_id = uc_map.get("rv-weekend")

    if not default_uc_id:
        print("ERROR: rv-weekend use case not found")
        sys.exit(1)

    succeeded = 0
    skipped = 0

    for entry in approved:
        slug = entry["proposed_slug"]
        specs = entry.get("specs", {})

        # Find kit in DB
        cur.execute("SELECT id FROM kits WHERE slug = %s", (slug,))
        kit_row = cur.fetchone()
        if not kit_row:
            print(f"  SKIP {slug} — kit not found in DB")
            skipped += 1
            continue

        kit_id = kit_row[0]

        # Skip if already has items
        cur.execute("SELECT count(*) FROM kit_items WHERE kit_id = %s", (kit_id,))
        if cur.fetchone()[0] > 0:
            print(f"  SKIP {slug} — already has BOM data")
            skipped += 1
            continue

        bom = build_bom(slug, specs)

        # Update kit specs
        cur.execute(
            """
            UPDATE kits SET
                nominal_system_voltage_v = %s,
                panel_array_w = %s,
                battery_total_wh = %s,
                battery_usable_wh = %s,
                inverter_continuous_w = %s,
                inverter_surge_w = %s,
                chemistry = %s,
                includes_panels = %s,
                includes_batteries = %s,
                includes_inverter = %s,
                includes_controller = %s
            WHERE id = %s
            """,
            (
                bom["voltage"], bom["panelW"], bom["batteryTotalWh"], bom["batteryUsableWh"],
                bom["inverterW"], bom["inverterSurgeW"], bom["chemistry"],
                bom["includesPanels"], bom["includesBatteries"], bom["includesInverter"], bom["includesController"],
                kit_id,
            ),
        )

        # Insert kit items (included only)
        for i, item in enumerate(bom["items"]):
            role_id = role_map.get(item["role"])
            if not role_id:
                print(f"    WARNING: role {item['role']} not found in component_roles")
                continue

            if item["included"]:
                cur.execute(
                    """
                    INSERT INTO kit_items (kit_id, component_role_id, quantity, unit_label, sort_order, notes)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        kit_id, role_id,
                        item["qty"], item["name"], (i + 1) * 10,
                        f"{item['name']} — {item['specs']}",
                    ),
                )

        # Insert role coverage
        missing_cents = 0
        included_count = 0
        total_roles = len(bom["items"])

        for item in bom["items"]:
            role_id = role_map.get(item["role"])
            if not role_id:
                continue

            if item["included"]:
                included_count += 1
                cur.execute(
                    """
                    INSERT INTO kit_role_coverage (kit_id, use_case_id, component_role_id, status, included_quantity, calculator_version)
                    VALUES (%s, %s, %s, 'included', %s, 'bom-shopsolar-v1')
                    ON CONFLICT DO NOTHING
                    """,
                    (kit_id, default_uc_id, role_id, item["qty"]),
                )
            else:
                cost = item.get("cost", 0)
                missing_cents += cost
                cur.execute(
                    """
                    INSERT INTO kit_role_coverage (kit_id, use_case_id, component_role_id, status, missing_quantity, recommended_cost_cents, notes, calculator_version)
                    VALUES (%s, %s, %s, 'missing', %s, %s, %s, 'bom-shopsolar-v1')
                    ON CONFLICT DO NOTHING
                    """,
                    (
                        kit_id, default_uc_id, role_id,
                        max(item["qty"], 1), cost, item.get("notes"),
                    ),
                )

        # Get current price for total cost calculation
        cur.execute(
            "SELECT offer_id, price_cents FROM kit_current_prices WHERE kit_id = %s ORDER BY price_cents ASC LIMIT 1",
            (kit_id,),
        )
        price_row = cur.fetchone()
        if price_row:
            offer_id, base_price = price_row
            completeness = round((included_count / total_roles) * 100) if total_roles > 0 else 0
            total_before_tax = base_price + missing_cents

            cur.execute(
                """
                INSERT INTO kit_total_cost_current (kit_id, use_case_id, primary_kit_offer_id, base_offer_price_cents, missing_components_cents, total_before_tax_cents, completeness_score, last_priced_at, calculator_version)
                VALUES (%s, %s, %s, %s, %s, %s, %s, now(), 'bom-shopsolar-v1')
                ON CONFLICT (kit_id, use_case_id) DO UPDATE SET
                    base_offer_price_cents = EXCLUDED.base_offer_price_cents,
                    missing_components_cents = EXCLUDED.missing_components_cents,
                    total_before_tax_cents = EXCLUDED.total_before_tax_cents,
                    completeness_score = EXCLUDED.completeness_score,
                    last_priced_at = EXCLUDED.last_priced_at
                """,
                (
                    kit_id, default_uc_id, offer_id,
                    base_price, missing_cents, total_before_tax,
                    completeness,
                ),
            )

            print(f"  ✓ {slug}")
            print(f"    ${base_price/100:.0f} listed + ${missing_cents/100:.0f} missing = ${total_before_tax/100:.0f} real, {completeness}% complete")
        else:
            print(f"  ✓ {slug} — BOM added (no price data yet)")

        succeeded += 1

    conn.commit()
    cur.close()
    conn.close()

    print(f"\nDone! {succeeded} kits seeded, {skipped} skipped")


def main_all_with_prices():
    """Seed BOM for all in-DB kits that have prices but no BOM items.
    Reads spec data directly from the kits table.
    """
    if not DATABASE_URL:
        print("ERROR: OFFGRID_DATABASE_URL not set")
        sys.exit(1)

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Load role map
    cur.execute("SELECT id, code FROM component_roles")
    role_map = {row[1]: row[0] for row in cur.fetchall()}

    # Load use case map
    cur.execute("SELECT id, slug FROM use_cases")
    uc_map = {row[1]: row[0] for row in cur.fetchall()}
    default_uc_id = uc_map.get("rv-weekend")

    if not default_uc_id:
        print("ERROR: rv-weekend use case not found")
        sys.exit(1)

    # Find all active kits with at least one current price but no kit_items
    cur.execute("""
        SELECT DISTINCT k.id, k.slug,
            k.panel_array_w, k.battery_usable_wh, k.battery_total_wh,
            k.inverter_continuous_w, k.nominal_system_voltage_v, k.chemistry
        FROM kits k
        JOIN kit_current_prices kcp ON kcp.kit_id = k.id
        WHERE k.is_active = TRUE
          AND NOT EXISTS (SELECT 1 FROM kit_items WHERE kit_id = k.id)
        ORDER BY k.slug
    """)
    candidates = cur.fetchall()

    print(f"Found {len(candidates)} active kits with prices but no BOM")

    if DRY_RUN:
        print("\n[DRY RUN — no DB writes]\n")
        no_specs = 0
        for row in candidates:
            _, slug, panel_w, bat_usable, bat_total, inv_w, voltage, chem = row
            panel_w = panel_w or 0
            bat_usable = bat_usable or 0
            bat_total = bat_total or 0
            inv_w = inv_w or 0
            if panel_w == 0 and bat_usable == 0 and inv_w == 0:
                print(f"  SKIP {slug} — no spec data")
                no_specs += 1
                continue
            specs = {
                "panelW": panel_w,
                "batteryTotalWh": bat_total,
                "batteryUsableWh": bat_usable,
                "inverterW": inv_w,
                "voltage": voltage or 48,
                "chemistry": chem or "LiFePO4",
            }
            bom = build_bom(slug, specs)
            included = sum(1 for i in bom["items"] if i["included"])
            missing_cents = sum(i.get("cost", 0) for i in bom["items"] if not i["included"])
            print(f"  {slug}")
            print(f"    {bom['panelW']}W / {bom['batteryUsableWh']}Wh / {bom['inverterW']}W — {included}/{len(bom['items'])} included, ~${missing_cents/100:.0f} missing")
        print(f"\n{len(candidates) - no_specs} would be seeded, {no_specs} skipped (no specs)")
        conn.close()
        return

    succeeded = 0
    skipped = 0

    for row in candidates:
        kit_id, slug, panel_w, bat_usable, bat_total, inv_w, voltage, chem = row
        panel_w = panel_w or 0
        bat_usable = bat_usable or 0
        bat_total = bat_total or 0
        inv_w = inv_w or 0

        if panel_w == 0 and bat_usable == 0 and inv_w == 0:
            print(f"  SKIP {slug} — no spec data in DB")
            skipped += 1
            continue

        specs = {
            "panelW": panel_w,
            "batteryTotalWh": bat_total,
            "batteryUsableWh": bat_usable,
            "inverterW": inv_w,
            "voltage": voltage or 48,
            "chemistry": chem or "LiFePO4",
        }
        bom = build_bom(slug, specs)

        # Update kit spec columns (may already be set, but ensure consistency)
        cur.execute(
            """
            UPDATE kits SET
                nominal_system_voltage_v = %s,
                panel_array_w = %s,
                battery_total_wh = %s,
                battery_usable_wh = %s,
                inverter_continuous_w = %s,
                chemistry = %s,
                includes_panels = %s,
                includes_batteries = %s,
                includes_inverter = %s,
                includes_controller = %s
            WHERE id = %s
            """,
            (
                bom["voltage"], bom["panelW"], bom["batteryTotalWh"], bom["batteryUsableWh"],
                bom["inverterW"], bom["chemistry"],
                bom["includesPanels"], bom["includesBatteries"], bom["includesInverter"], bom["includesController"],
                kit_id,
            ),
        )

        # Insert kit items
        for i, item in enumerate(bom["items"]):
            role_id = role_map.get(item["role"])
            if not role_id:
                continue
            if item["included"]:
                cur.execute(
                    """
                    INSERT INTO kit_items (kit_id, component_role_id, quantity, unit_label, sort_order, notes)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT DO NOTHING
                    """,
                    (kit_id, role_id, item["qty"], item["name"], (i + 1) * 10,
                     f"{item['name']} — {item['specs']}"),
                )

        # Insert role coverage
        missing_cents = 0
        included_count = 0
        total_roles = len(bom["items"])

        for item in bom["items"]:
            role_id = role_map.get(item["role"])
            if not role_id:
                continue
            if item["included"]:
                included_count += 1
                cur.execute(
                    """
                    INSERT INTO kit_role_coverage (kit_id, use_case_id, component_role_id, status, included_quantity, calculator_version)
                    VALUES (%s, %s, %s, 'included', %s, 'bom-shopsolar-v1')
                    ON CONFLICT DO NOTHING
                    """,
                    (kit_id, default_uc_id, role_id, item["qty"]),
                )
            else:
                cost = item.get("cost", 0)
                missing_cents += cost
                cur.execute(
                    """
                    INSERT INTO kit_role_coverage (kit_id, use_case_id, component_role_id, status, missing_quantity, recommended_cost_cents, notes, calculator_version)
                    VALUES (%s, %s, %s, 'missing', %s, %s, %s, 'bom-shopsolar-v1')
                    ON CONFLICT DO NOTHING
                    """,
                    (kit_id, default_uc_id, role_id, max(item["qty"], 1), cost, item.get("notes")),
                )

        # Get current price for total cost
        cur.execute(
            "SELECT offer_id, price_cents FROM kit_current_prices WHERE kit_id = %s ORDER BY price_cents ASC LIMIT 1",
            (kit_id,),
        )
        price_row = cur.fetchone()
        if price_row:
            offer_id, base_price = price_row
            completeness = round((included_count / total_roles) * 100) if total_roles > 0 else 0
            total_before_tax = base_price + missing_cents
            cur.execute(
                """
                INSERT INTO kit_total_cost_current (kit_id, use_case_id, primary_kit_offer_id, base_offer_price_cents, missing_components_cents, total_before_tax_cents, completeness_score, last_priced_at, calculator_version)
                VALUES (%s, %s, %s, %s, %s, %s, %s, now(), 'bom-shopsolar-v1')
                ON CONFLICT (kit_id, use_case_id) DO UPDATE SET
                    base_offer_price_cents = EXCLUDED.base_offer_price_cents,
                    missing_components_cents = EXCLUDED.missing_components_cents,
                    total_before_tax_cents = EXCLUDED.total_before_tax_cents,
                    completeness_score = EXCLUDED.completeness_score,
                    last_priced_at = EXCLUDED.last_priced_at
                """,
                (kit_id, default_uc_id, offer_id, base_price, missing_cents, total_before_tax, completeness),
            )
            print(f"  ✓ {slug} — ${base_price/100:.0f} + ${missing_cents/100:.0f} missing = ${total_before_tax/100:.0f}, {completeness}%")
        else:
            print(f"  ✓ {slug} — BOM added (no price data)")

        succeeded += 1

    conn.commit()
    cur.close()
    conn.close()

    print(f"\nDone! {succeeded} kits seeded, {skipped} skipped")


if __name__ == "__main__":
    if ALL_WITH_PRICES:
        main_all_with_prices()
    else:
        main()
