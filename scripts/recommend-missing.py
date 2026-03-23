"""
Recommend specific products for missing kit components.

For each kit with missing roles in kit_role_coverage, matches to a compatible
product from the ASIN registry based on role, voltage, and kit size.
Updates kit_role_coverage.recommended_product_id and recommended_offer_id.

Usage:
  python3 scripts/recommend-missing.py          # Dry run
  python3 scripts/recommend-missing.py --apply   # Write to DB
"""

import json
import os
import sys
import uuid
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

env_path = Path.home() / "google-drive" / "0-AI" / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()

DATABASE_URL = os.environ.get("OFFGRID_DATABASE_URL", "")
SCRIPTS_DIR = Path(__file__).resolve().parent
REGISTRY_PATH = SCRIPTS_DIR / "asin_registry.json"

# ── Recommendation mapping ───────────────────────────────────────────────────
# For each missing role, map to the best product ASIN from the registry.
# Criteria: same-brand preference, voltage match, appropriate size.
#
# Role codes → product categories:
#   battery_bank → battery
#   inverter → inverter
#   monitoring → monitor (enum) / monitoring (registry)
#   charge_controller → charge_controller
#   mounting_hardware → skip (most are portable panels, no products in registry)

RECOMMENDATIONS = {
    # ── eco-worthy-200w-starter: small 12V starter kit ──
    ("eco-worthy-200w-starter", "battery_bank"): {
        "asin": "B09L89LW3P",  # ECO-WORTHY 12V 100Ah LiFePO4
        "specs": "12V 100Ah LiFePO4, 1280Wh, Bluetooth BMS, 3000+ cycles",
    },
    ("eco-worthy-200w-starter", "inverter"): {
        "asin": "B07XYR1BS3",  # BESTEK 1000W Pure Sine
        "specs": "1000W pure sine wave, 12V DC to 120V AC, dual USB, LCD display",
    },
    ("eco-worthy-200w-starter", "monitoring"): {
        "asin": "B0856PHNLX",  # Victron SmartShunt 500A
        "specs": "500A shunt, Bluetooth, VictronConnect app, SOC/voltage/current",
    },

    # ── eco-worthy-200w-complete: has battery+inverter, needs monitoring+mounting ──
    ("eco-worthy-200w-complete", "monitoring"): {
        "asin": "B0856PHNLX",  # Victron SmartShunt 500A
        "specs": "500A shunt, Bluetooth, VictronConnect app, SOC/voltage/current",
    },
    # mounting_hardware skipped — $35 generic brackets

    # ── renogy-400w-bluetooth-kit: mid-size 12V ──
    ("renogy-400w-bluetooth-kit", "battery_bank"): {
        "asin": "B0DMW7H3SB",  # Renogy 12V 100Ah Core Mini
        "specs": "12V 100Ah LiFePO4, 100A BMS, 5000+ cycles, 23.4 lbs",
    },
    ("renogy-400w-bluetooth-kit", "inverter"): {
        "asin": "B07JMQ27WJ",  # Renogy 1000W Pure Sine
        "specs": "1000W pure sine wave, 12V DC to 120V AC, USB ports, remote control",
    },

    # ── renogy-400w-premium-mppt: mid-size 12V, premium ──
    ("renogy-400w-premium-mppt", "battery_bank"): {
        "asin": "B0DMW7H3SB",  # Renogy 12V 100Ah Core Mini
        "specs": "12V 100Ah LiFePO4, 100A BMS, 5000+ cycles, 23.4 lbs",
    },
    ("renogy-400w-premium-mppt", "inverter"): {
        "asin": "B07JMQ27WJ",  # Renogy 1000W Pure Sine
        "specs": "1000W pure sine wave, 12V DC to 120V AC, USB ports, remote control",
    },

    # ── renogy-800w-cabin-kit: large 12V cabin system ──
    ("renogy-800w-cabin-kit", "battery_bank"): {
        "asin": "B09GK8DWQY",  # Renogy 12V 200Ah LiFePO4 Bluetooth
        "specs": "12V 200Ah LiFePO4, 2560Wh, Bluetooth BMS, self-heating available",
    },
    ("renogy-800w-cabin-kit", "inverter"): {
        "asin": "B07PQR8HVQ",  # Renogy 2000W Inverter Charger
        "specs": "2000W pure sine wave, 6000W surge, 12V, built-in charger, remote",
    },

    # ── windynation-400w-mono-kit: mid-size 12V ──
    ("windynation-400w-mono-kit", "battery_bank"): {
        "asin": "B0B5WTZZRP",  # BougeRV 12V 100Ah
        "specs": "12V 100Ah LiFePO4, low-temp protection, Group 24, 1280Wh",
    },
    ("windynation-400w-mono-kit", "inverter"): {
        "asin": "B01KUASPS8",  # WindyNation VertaMax 1500W
        "specs": "1500W pure sine wave, 3000W surge, 12V, 3 AC outlets, remote",
    },
    ("windynation-400w-mono-kit", "monitoring"): {
        "asin": "B0856PHNLX",  # Victron SmartShunt 500A
        "specs": "500A shunt, Bluetooth, VictronConnect app, SOC/voltage/current",
    },

    # ── windynation-400w-complete: has battery+inverter, needs monitoring+mounting ──
    ("windynation-400w-complete", "monitoring"): {
        "asin": "B0856PHNLX",  # Victron SmartShunt 500A
        "specs": "500A shunt, Bluetooth, VictronConnect app, SOC/voltage/current",
    },
    # mounting_hardware — $80, skip

    # ── windynation-400w-complete-inverter: has inverter, needs battery+monitoring ──
    ("windynation-400w-complete-inverter", "battery_bank"): {
        "asin": "B0B5WTZZRP",  # BougeRV 12V 100Ah
        "specs": "12V 100Ah LiFePO4, low-temp protection, Group 24, 1280Wh",
    },
    ("windynation-400w-complete-inverter", "monitoring"): {
        "asin": "B0856PHNLX",  # Victron SmartShunt 500A
        "specs": "500A shunt, Bluetooth, VictronConnect app, SOC/voltage/current",
    },
}


def main():
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Write changes to DB (default is dry run)")
    args = parser.parse_args()

    if not DATABASE_URL:
        print("ERROR: OFFGRID_DATABASE_URL not set")
        sys.exit(1)

    registry = json.loads(REGISTRY_PATH.read_text())
    # Build ASIN → registry entry lookup (products only)
    asin_lookup = {p["asin"]: p for p in registry.get("products", [])}

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Get Amazon retailer ID
    cur.execute("SELECT id FROM retailers WHERE slug = 'amazon'")
    retailer_id = cur.fetchone()[0]

    # Get all missing coverage rows
    cur.execute("""
        SELECT krc.id, k.slug as kit_slug, cr.code as role_code,
               krc.recommended_product_id, krc.recommended_offer_id,
               krc.recommended_cost_cents, krc.notes
        FROM kit_role_coverage krc
        JOIN kits k ON k.id = krc.kit_id
        JOIN component_roles cr ON cr.id = krc.component_role_id
        WHERE krc.status = 'missing'
        ORDER BY k.slug, cr.code
    """)
    missing_rows = cur.fetchall()

    updated = 0
    skipped = 0

    for row in missing_rows:
        krc_id, kit_slug, role_code, existing_prod, existing_offer, cost_cents, notes = row
        key = (kit_slug, role_code)

        if key not in RECOMMENDATIONS:
            print(f"  SKIP  {kit_slug} / {role_code} — no recommendation defined")
            skipped += 1
            continue

        rec = RECOMMENDATIONS[key]
        asin = rec["asin"]
        specs = rec["specs"]

        if asin not in asin_lookup:
            print(f"  ERROR {kit_slug} / {role_code} — ASIN {asin} not in registry")
            skipped += 1
            continue

        reg_entry = asin_lookup[asin]
        title = reg_entry["title"]
        brand_name = reg_entry["brand"]
        # Map registry categories to DB enum values
        category_map = {"monitoring": "monitor"}
        category = category_map.get(reg_entry["category"], reg_entry["category"])

        # Ensure product exists in DB
        cur.execute("SELECT id FROM products WHERE slug = %s", (reg_entry["slug"],))
        prod_row = cur.fetchone()
        if prod_row:
            product_id = prod_row[0]
        else:
            # Need to create product — get brand_id first
            brand_slug = brand_name.lower().replace(" ", "-").replace(".", "")
            cur.execute("SELECT id FROM brands WHERE slug = %s", (brand_slug,))
            brand_row = cur.fetchone()
            if brand_row:
                brand_id = brand_row[0]
            else:
                brand_id = str(uuid.uuid4())
                cur.execute(
                    "INSERT INTO brands (id, name, slug) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING",
                    (brand_id, brand_name, brand_slug),
                )
            product_id = str(uuid.uuid4())
            cur.execute(
                "INSERT INTO products (id, brand_id, category, title, slug) VALUES (%s, %s, %s, %s, %s) ON CONFLICT (slug) DO NOTHING RETURNING id",
                (product_id, brand_id, category, title, reg_entry["slug"]),
            )
            r = cur.fetchone()
            if r:
                product_id = r[0]
            else:
                cur.execute("SELECT id FROM products WHERE slug = %s", (reg_entry["slug"],))
                product_id = cur.fetchone()[0]
            print(f"  + Created product: {title}")

        # Ensure product_offer exists (for ASIN link)
        source_url = f"https://www.amazon.com/dp/{asin}"
        cur.execute("SELECT id FROM product_offers WHERE product_id = %s AND retailer_id = %s AND asin = %s", (product_id, retailer_id, asin))
        offer_row = cur.fetchone()
        if offer_row:
            offer_id = offer_row[0]
        else:
            offer_id = str(uuid.uuid4())
            cur.execute(
                """INSERT INTO product_offers (id, product_id, retailer_id, asin, source_url, canonical_url, title_on_page, is_active)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, true)
                   ON CONFLICT (retailer_id, canonical_url) DO UPDATE SET asin = EXCLUDED.asin
                   RETURNING id""",
                (offer_id, product_id, retailer_id, asin, source_url, source_url, title),
            )
            r = cur.fetchone()
            if r:
                offer_id = r[0]
            print(f"  + Created offer: {asin}")

        # Update kit_role_coverage
        print(f"  ✓ {kit_slug} / {role_code} → {title[:50]}... [{asin}]")

        if args.apply:
            cur.execute(
                """UPDATE kit_role_coverage
                   SET recommended_product_id = %s,
                       recommended_offer_id = %s,
                       notes = %s
                   WHERE id = %s""",
                (product_id, offer_id, specs, krc_id),
            )

        updated += 1

    print(f"\n{'Applied' if args.apply else 'Dry run'}: {updated} updated, {skipped} skipped")

    if args.apply:
        conn.commit()
        print("Changes committed.")
    else:
        conn.rollback()
        print("No changes written. Use --apply to write.")

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
