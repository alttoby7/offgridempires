"""
Generic Shopify brand direct price ingestion for OffGridEmpire.

Fetches current pricing from any Shopify-based brand website using registry
files in scripts/brand_registries/. Upserts into PostgreSQL.
Designed to run on cron every 6 hours alongside Amazon and Shop Solar ingestion.

Usage:
  python3 scripts/ingest-brand-direct.py --retailer ecoflow-us           # single brand
  python3 scripts/ingest-brand-direct.py --all                           # all brand registries
  python3 scripts/ingest-brand-direct.py --retailer ecoflow-us --dry-run # fetch only
  python3 scripts/ingest-brand-direct.py --retailer ecoflow-us --tunnel  # SSH tunnel
  python3 scripts/ingest-brand-direct.py --list                          # list available registries
"""

import json
import hashlib
import os
import sys
import uuid
import argparse
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# Load env from central .env
env_path = Path.home() / "google-drive" / "0-AI" / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()

_raw_db_url = os.environ.get("OFFGRID_DATABASE_URL", "")
DATABASE_URL = _raw_db_url
REGISTRY_DIR = Path(__file__).resolve().parent / "brand_registries"
USER_AGENT = "OffGridEmpire-Ingestion/1.0"


def load_registry(retailer_slug):
    """Load a brand registry JSON by retailer slug."""
    path = REGISTRY_DIR / f"{retailer_slug}.json"
    if not path.exists():
        print(f"ERROR: Registry not found: {path}")
        sys.exit(1)
    with open(path) as f:
        return json.load(f)


def list_registries():
    """List available brand registries."""
    if not REGISTRY_DIR.exists():
        print("No brand_registries directory found.")
        return []
    registries = []
    for f in sorted(REGISTRY_DIR.glob("*.json")):
        try:
            with open(f) as fh:
                reg = json.load(fh)
            mappings = [m for m in reg.get("mappings", []) if m.get("status") == "approved"]
            registries.append({
                "slug": f.stem,
                "retailer": reg.get("retailer", f.stem),
                "base_url": reg.get("base_url", "?"),
                "total_mappings": len(reg.get("mappings", [])),
                "approved": len(mappings),
            })
        except Exception:
            pass
    return registries


def fetch_product(base_url, handle):
    """Fetch a single product from Shopify JSON API."""
    url = f"{base_url}/products/{handle}.json"
    req = Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
        return data.get("product")
    except (URLError, HTTPError) as e:
        print(f"  ERROR fetching {handle}: {e}")
        return None


def fetch_collection_products(base_url, collection):
    """Fetch all products from a Shopify collection, keyed by handle."""
    all_products = {}
    page = 1
    while True:
        url = f"{base_url}/collections/{collection}/products.json?limit=250&page={page}"
        try:
            req = Request(url, headers={"User-Agent": USER_AGENT})
            with urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read())
            products = data.get("products", [])
            if not products:
                break
            for p in products:
                all_products[p["handle"]] = p
            if len(products) < 250:
                break
            page += 1
            time.sleep(0.5)
        except (URLError, HTTPError) as e:
            print(f"  ERROR fetching collection {collection} page {page}: {e}")
            break
    return all_products


def extract_variant_price(product, variant_id):
    """Extract price data for a specific variant."""
    for variant in product.get("variants", []):
        if str(variant["id"]) == variant_id:
            price_str = variant.get("price", "0")
            compare_at = variant.get("compare_at_price")
            available = variant.get("available", True)

            price_cents = int(float(price_str) * 100)
            if price_cents <= 0:
                return None

            return {
                "title": f"{product.get('title', '')} - {variant.get('title', '')}".strip(" -"),
                "price_cents": price_cents,
                "compare_at_cents": int(float(compare_at) * 100) if compare_at else None,
                "shipping_cents": 0,
                "in_stock": available,
                "sku": variant.get("sku", ""),
                "variant_title": variant.get("title", ""),
            }
    return None


def payload_hash(data):
    """Compute a stable hash for deduplication."""
    hashable = {
        "price_cents": data.get("price_cents"),
        "shipping_cents": data.get("shipping_cents"),
        "in_stock": data.get("in_stock"),
    }
    return hashlib.sha256(json.dumps(hashable, sort_keys=True).encode()).hexdigest()[:16]


def get_db():
    if not DATABASE_URL:
        print("ERROR: OFFGRID_DATABASE_URL must be set")
        sys.exit(1)
    return psycopg2.connect(DATABASE_URL)


def ensure_retailer(cur, registry):
    """Get or create retailer from registry config, return ID."""
    slug = registry["retailer_slug"]
    cur.execute("SELECT id FROM retailers WHERE slug = %s", (slug,))
    row = cur.fetchone()
    if row:
        return row[0]
    retailer_id = str(uuid.uuid4())
    cur.execute(
        "INSERT INTO retailers (id, name, slug, retailer_type) VALUES (%s, %s, %s, 'direct')",
        (retailer_id, registry["retailer"], slug),
    )
    return retailer_id


def ensure_brand(cur, brand_name):
    """Get or create brand, return ID."""
    slug = brand_name.lower().replace(" ", "-").replace(".", "")
    cur.execute("SELECT id FROM brands WHERE slug = %s", (slug,))
    row = cur.fetchone()
    if row:
        return row[0]
    brand_id = str(uuid.uuid4())
    cur.execute(
        "INSERT INTO brands (id, name, slug) VALUES (%s, %s, %s) ON CONFLICT (slug) DO NOTHING RETURNING id",
        (brand_id, brand_name, slug),
    )
    row = cur.fetchone()
    return row[0] if row else brand_id


def ensure_kit(cur, entry, brand_id, image_url=None):
    """Get or create kit record, return ID."""
    slug = entry.get("kit_slug") or entry.get("proposed_slug")
    cur.execute("SELECT id FROM kits WHERE slug = %s", (slug,))
    row = cur.fetchone()
    if row:
        if image_url:
            cur.execute("UPDATE kits SET image_url = %s WHERE id = %s AND image_url IS NULL", (image_url, row[0]))
        return row[0]

    kit_id = str(uuid.uuid4())
    title = entry.get("proposed_title", entry.get("variant_title", slug))
    specs = entry.get("specs", {})

    cur.execute(
        """
        INSERT INTO kits (id, brand_id, title, slug, is_active, image_url,
                         nominal_system_voltage_v, panel_array_w,
                         battery_total_wh, battery_usable_wh,
                         inverter_continuous_w, chemistry)
        VALUES (%s, %s, %s, %s, false, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (slug) DO NOTHING
        RETURNING id
        """,
        (
            kit_id, brand_id, title, slug, image_url,
            specs.get("voltage"),
            specs.get("panelW"),
            specs.get("batteryTotalWh"),
            specs.get("batteryUsableWh"),
            specs.get("inverterW"),
            specs.get("chemistry"),
        ),
    )
    row = cur.fetchone()
    return row[0] if row else kit_id


def upsert_kit_offer(cur, kit_id, retailer_id, base_url, entry, price_data, run_id):
    """Upsert kit offer and record price event."""
    now = datetime.now(timezone.utc)
    handle = entry.get("shopify_handle", "")
    variant_id = entry.get("shopify_variant_id", "")
    source_url = f"{base_url}/products/{handle}?variant={variant_id}"
    canonical_url = source_url

    cur.execute(
        """
        INSERT INTO kit_offers (kit_id, retailer_id, source_url, canonical_url,
                               title_on_page, external_product_id, external_variant_id,
                               last_seen_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (retailer_id, canonical_url) DO UPDATE SET
            title_on_page = EXCLUDED.title_on_page,
            external_product_id = EXCLUDED.external_product_id,
            external_variant_id = EXCLUDED.external_variant_id,
            last_seen_at = EXCLUDED.last_seen_at,
            is_active = true
        RETURNING id
        """,
        (kit_id, retailer_id, source_url, canonical_url,
         price_data.get("title"), entry.get("shopify_product_id", ""), variant_id, now),
    )
    offer_id = cur.fetchone()[0]

    if price_data["price_cents"] is None:
        return offer_id

    p_hash = payload_hash(price_data)
    raw_payload = {
        "price_cents": price_data["price_cents"],
        "shipping_cents": price_data["shipping_cents"],
        "in_stock": price_data["in_stock"],
        "compare_at_cents": price_data.get("compare_at_cents"),
        "sku": price_data.get("sku"),
        "variant_title": price_data.get("variant_title"),
    }

    try:
        cur.execute(
            """
            INSERT INTO kit_price_events (offer_id, observed_at, source_type, source_run_id,
                                         price_cents, shipping_cents, in_stock,
                                         raw_payload_hash, raw_payload)
            VALUES (%s, %s, 'api', %s, %s, %s, %s, %s, %s)
            ON CONFLICT (offer_id, observed_at, raw_payload_hash) DO NOTHING
            RETURNING id
            """,
            (
                offer_id, now, run_id,
                price_data["price_cents"], price_data["shipping_cents"],
                price_data["in_stock"],
                p_hash, json.dumps(raw_payload),
            ),
        )
        event_row = cur.fetchone()
        if not event_row:
            print(f"    Price unchanged (dedup)")
            return offer_id

        event_id = event_row[0]
        total_known_cents = (price_data["price_cents"] or 0) + (price_data["shipping_cents"] or 0)

        cur.execute(
            """
            INSERT INTO kit_current_prices (offer_id, kit_id, retailer_id, latest_event_id,
                                           observed_at, currency_code, price_cents, shipping_cents,
                                           total_known_cents, in_stock)
            VALUES (%s, %s, %s, %s, %s, 'USD', %s, %s, %s, %s)
            ON CONFLICT (offer_id) DO UPDATE SET
                latest_event_id = EXCLUDED.latest_event_id,
                observed_at = EXCLUDED.observed_at,
                price_cents = EXCLUDED.price_cents,
                shipping_cents = EXCLUDED.shipping_cents,
                total_known_cents = EXCLUDED.total_known_cents,
                in_stock = EXCLUDED.in_stock,
                updated_at = now()
            """,
            (
                offer_id, kit_id, retailer_id, event_id, now,
                price_data["price_cents"], price_data["shipping_cents"],
                total_known_cents, price_data["in_stock"],
            ),
        )
        print(f"    Price: ${price_data['price_cents'] / 100:.2f} ({'in stock' if price_data['in_stock'] else 'OOS'})")

    except Exception as e:
        print(f"    ERROR recording price: {e}")

    return offer_id


def ingest_retailer(registry, args):
    """Run ingestion for a single brand retailer."""
    retailer_name = registry["retailer"]
    retailer_slug = registry["retailer_slug"]
    base_url = registry["base_url"]

    print(f"\n{'=' * 60}")
    print(f"Ingesting: {retailer_name} ({base_url})")
    print(f"{'=' * 60}")

    # Collect approved entries
    entries = []
    for mapping in registry.get("mappings", []):
        if mapping.get("status") != "approved":
            continue
        if args.handle and mapping.get("shopify_handle") != args.handle:
            continue
        entries.append(mapping)

    if not entries:
        print(f"\nNo approved entries for {retailer_name}.")
        print("Run discover-brand-products.py and set status to 'approved' in the registry.")
        return 0, 0

    print(f"\nProcessing {len(entries)} approved entries...")

    # Fetch products — group by handle to minimize API calls
    handles_needed = list(set(e["shopify_handle"] for e in entries))
    print(f"Fetching {len(handles_needed)} products from Shopify API...")

    all_products = {}
    for handle in handles_needed:
        product = fetch_product(base_url, handle)
        if product:
            all_products[handle] = product
        time.sleep(0.3)

    print(f"  Loaded {len(all_products)} products\n")

    if args.dry_run:
        print("DRY RUN — extracted price data:\n")
        for entry in entries:
            handle = entry["shopify_handle"]
            variant_id = entry["shopify_variant_id"]
            product = all_products.get(handle)
            if not product:
                print(f"  {handle}: NOT FOUND")
                continue
            price_data = extract_variant_price(product, variant_id)
            if not price_data:
                print(f"  {handle} (variant {variant_id}): variant not found")
                continue
            slug = entry.get("kit_slug") or entry.get("proposed_slug", "?")
            print(f"  {slug}")
            print(f"    Handle: {handle} / Variant: {variant_id}")
            print(f"    Title: {price_data['title']}")
            print(f"    Price: ${price_data['price_cents'] / 100:.2f}")
            print(f"    In stock: {price_data['in_stock']}")
            print()
        return len(entries), 0

    # Write to DB
    conn = get_db()
    cur = conn.cursor()

    run_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    cur.execute(
        """
        INSERT INTO ingestion_runs (id, source_name, source_type, scheduled_at, item_count, metadata)
        VALUES (%s, %s, 'api', %s, %s, %s)
        """,
        (run_id, retailer_slug, now, len(entries), json.dumps({
            "handles": handles_needed,
            "retailer": retailer_name,
        })),
    )

    retailer_id = ensure_retailer(cur, registry)
    succeeded = 0
    failed = 0

    for entry in entries:
        handle = entry["shopify_handle"]
        variant_id = entry["shopify_variant_id"]
        slug = entry.get("kit_slug") or entry.get("proposed_slug", handle)

        print(f"Processing {slug} ({handle}:{variant_id})...")

        product = all_products.get(handle)
        if not product:
            print(f"  SKIP — product not found")
            failed += 1
            continue

        price_data = extract_variant_price(product, variant_id)
        if not price_data:
            print(f"  SKIP — variant {variant_id} not found")
            failed += 1
            continue

        vendor = entry.get("vendor") or product.get("vendor", "Unknown")
        brand_id = ensure_brand(cur, vendor)

        product_images = product.get("images", [])
        image_url = product_images[0].get("src") if product_images else None

        try:
            cur.execute("SAVEPOINT item_sp")
            kit_id = ensure_kit(cur, entry, brand_id, image_url=image_url)
            upsert_kit_offer(cur, kit_id, retailer_id, base_url, entry, price_data, run_id)
            cur.execute("RELEASE SAVEPOINT item_sp")
            succeeded += 1
        except Exception as e:
            print(f"  ERROR: {e}")
            cur.execute("ROLLBACK TO SAVEPOINT item_sp")
            failed += 1

    status = "succeeded" if failed == 0 else ("partially_failed" if succeeded > 0 else "failed")
    cur.execute(
        """
        UPDATE ingestion_runs
        SET finished_at = %s, status = %s, succeeded_count = %s, failed_count = %s
        WHERE id = %s
        """,
        (datetime.now(timezone.utc), status, succeeded, failed, run_id),
    )

    conn.commit()
    cur.close()
    conn.close()

    print(f"\n  Done: {succeeded} succeeded, {failed} failed ({status})")
    print(f"  Run ID: {run_id}")
    return succeeded, failed


def main():
    parser = argparse.ArgumentParser(description="Ingest brand direct Shopify pricing for OffGridEmpire")
    parser.add_argument("--retailer", help="Retailer slug (e.g., ecoflow-us)")
    parser.add_argument("--all", action="store_true", help="Run all brand registries")
    parser.add_argument("--dry-run", action="store_true", help="Fetch data but don't write to DB")
    parser.add_argument("--handle", help="Single product handle to process")
    parser.add_argument("--tunnel", action="store_true", help="Use local SSH tunnel (port 15433)")
    parser.add_argument("--list", action="store_true", help="List available registries")
    args = parser.parse_args()

    global DATABASE_URL
    if args.tunnel:
        DATABASE_URL = _raw_db_url.replace(":5433/", ":15433/")
        print("Using SSH tunnel on port 15433")

    if args.list:
        registries = list_registries()
        if not registries:
            print("No registries found.")
            return
        print(f"{'Slug':<20} {'Retailer':<20} {'Approved':>8} {'Total':>8}  URL")
        print("-" * 80)
        for r in registries:
            print(f"{r['slug']:<20} {r['retailer']:<20} {r['approved']:>8} {r['total_mappings']:>8}  {r['base_url']}")
        return

    print("=" * 60)
    print(f"OffGridEmpire Brand Direct Ingestion — {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)

    if args.all:
        registries = list_registries()
        total_ok = total_fail = 0
        for r in registries:
            if r["approved"] == 0:
                print(f"\nSkipping {r['slug']} — no approved mappings")
                continue
            registry = load_registry(r["slug"])
            ok, fail = ingest_retailer(registry, args)
            total_ok += ok
            total_fail += fail
        print(f"\n{'=' * 60}")
        print(f"All done: {total_ok} succeeded, {total_fail} failed")
        print(f"{'=' * 60}")
    elif args.retailer:
        registry = load_registry(args.retailer)
        ingest_retailer(registry, args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
