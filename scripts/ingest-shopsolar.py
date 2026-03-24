"""
Shop Solar Kits price ingestion for OffGridEmpire.

Fetches current pricing from shopsolarkits.com Shopify API for approved
mappings in shopsolar_registry.json. Upserts into PostgreSQL.
Designed to run on cron every 6 hours.

Usage:
  python3 scripts/ingest-shopsolar.py              # full run
  python3 scripts/ingest-shopsolar.py --dry-run    # fetch only, no DB writes
  python3 scripts/ingest-shopsolar.py --handle ecoflow-delta-pro  # single product
"""

import json
import hashlib
import os
import sys
import uuid
import argparse
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

# ── Config ──────────────────────────────────────────────────────────────────────

_raw_db_url = os.environ.get("OFFGRID_DATABASE_URL", "")
DATABASE_URL = _raw_db_url
REGISTRY_PATH = Path(__file__).resolve().parent / "shopsolar_registry.json"
BASE_URL = "https://shopsolarkits.com"
RETAILER_SLUG = "shop-solar-kits"
USER_AGENT = "OffGridEmpire-Ingestion/1.0"


def load_registry():
    """Load Shop Solar registry with approved mappings."""
    with open(REGISTRY_PATH) as f:
        return json.load(f)


def fetch_product(handle: str) -> dict | None:
    """Fetch a single product from Shopify JSON API."""
    url = f"{BASE_URL}/products/{handle}.json"
    try:
        req = Request(url, headers={"User-Agent": USER_AGENT})
        with urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
        return data.get("product")
    except (URLError, HTTPError) as e:
        print(f"  ERROR fetching {handle}: {e}")
        return None


def fetch_collection_products(collection: str) -> dict:
    """Fetch all products from a collection, keyed by handle."""
    url = f"{BASE_URL}/collections/{collection}/products.json?limit=250"
    try:
        req = Request(url, headers={"User-Agent": USER_AGENT})
        with urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
        products = data.get("products", [])
        return {p["handle"]: p for p in products}
    except (URLError, HTTPError) as e:
        print(f"  ERROR fetching collection {collection}: {e}")
        return {}


def extract_variant_price(product: dict, variant_id: str) -> dict | None:
    """Extract price data for a specific variant."""
    for variant in product.get("variants", []):
        if str(variant["id"]) == variant_id:
            price_str = variant.get("price", "0")
            compare_at = variant.get("compare_at_price")
            available = variant.get("available", True)

            price_cents = int(float(price_str) * 100)
            if price_cents <= 0:
                return None

            source_url = f"{BASE_URL}/products/{product['handle']}?variant={variant['id']}"

            return {
                "title": f"{product.get('title', '')} - {variant.get('title', '')}".strip(" -"),
                "price_cents": price_cents,
                "compare_at_cents": int(float(compare_at) * 100) if compare_at else None,
                "shipping_cents": 0,  # Shop Solar typically offers free shipping on kits
                "in_stock": available,
                "source_url": source_url,
                "sku": variant.get("sku", ""),
                "variant_title": variant.get("title", ""),
            }

    return None


def payload_hash(data: dict) -> str:
    """Compute a stable hash for deduplication."""
    hashable = {
        "price_cents": data.get("price_cents"),
        "shipping_cents": data.get("shipping_cents"),
        "in_stock": data.get("in_stock"),
    }
    return hashlib.sha256(json.dumps(hashable, sort_keys=True).encode()).hexdigest()[:16]


def get_db():
    """Get database connection."""
    if not DATABASE_URL:
        print("ERROR: OFFGRID_DATABASE_URL must be set")
        sys.exit(1)
    return psycopg2.connect(DATABASE_URL)


def ensure_retailer(cur) -> str:
    """Get or create Shop Solar Kits retailer, return ID."""
    cur.execute("SELECT id FROM retailers WHERE slug = %s", (RETAILER_SLUG,))
    row = cur.fetchone()
    if row:
        return row[0]
    retailer_id = str(uuid.uuid4())
    cur.execute(
        "INSERT INTO retailers (id, name, slug, retailer_type) VALUES (%s, 'Shop Solar Kits', %s, 'direct')",
        (retailer_id, RETAILER_SLUG),
    )
    return retailer_id


def ensure_brand(cur, brand_name: str) -> str:
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


def ensure_kit(cur, entry: dict, brand_id: str, image_url: str | None = None) -> str:
    """Get or create kit record, return ID."""
    slug = entry.get("kit_slug") or entry.get("proposed_slug")
    cur.execute("SELECT id FROM kits WHERE slug = %s", (slug,))
    row = cur.fetchone()
    if row:
        # Update image_url if we have one and it's missing
        if image_url:
            cur.execute("UPDATE kits SET image_url = %s WHERE id = %s AND image_url IS NULL", (image_url, row[0]))
        return row[0]

    # New kit — create as inactive draft
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


def upsert_kit_offer(cur, kit_id: str, retailer_id: str, entry: dict, price_data: dict, run_id: str):
    """Upsert kit offer and record price event for Shop Solar."""
    now = datetime.now(timezone.utc)
    source_url = price_data["source_url"]
    canonical_url = source_url
    shopify_product_id = entry.get("shopify_product_id", "")
    shopify_variant_id = entry.get("shopify_variant_id", "")

    # Upsert offer — unique on retailer + canonical URL
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
         price_data.get("title"), shopify_product_id, shopify_variant_id, now),
    )
    offer_id = cur.fetchone()[0]

    if price_data["price_cents"] is None:
        print(f"    No price data, skipping price event")
        return offer_id

    # Compute hash for dedup
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

        # Upsert current price snapshot
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
        print(f"    Price: ${price_data['price_cents'] / 100:.2f} ({'in stock' if price_data['in_stock'] else 'out of stock'})")

    except Exception as e:
        print(f"    ERROR recording price: {e}")

    return offer_id


def main():
    parser = argparse.ArgumentParser(description="Ingest Shop Solar Kits pricing for OffGridEmpire")
    parser.add_argument("--dry-run", action="store_true", help="Fetch data but don't write to DB")
    parser.add_argument("--handle", type=str, help="Fetch a single product handle only")
    parser.add_argument("--new-kits", action="store_true", help="Also process new_kits (creates draft kits)")
    parser.add_argument("--tunnel", action="store_true", help="Use local SSH tunnel (port 15433)")
    args = parser.parse_args()

    global DATABASE_URL
    if args.tunnel:
        DATABASE_URL = _raw_db_url.replace(":5433/", ":15433/")
        print("Using SSH tunnel on port 15433")

    print("=" * 60)
    print(f"OffGridEmpire Shop Solar Ingestion — {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)

    registry = load_registry()
    collections = registry.get("collections", ["solar-power-systems", "solar-generators"])

    # Collect all approved entries to process
    entries = []

    # Approved mappings (existing kits with Shop Solar offers)
    for mapping in registry.get("mappings", []):
        if mapping.get("status") != "approved":
            continue
        if args.handle and mapping.get("shopify_handle") != args.handle:
            continue
        entries.append({"type": "mapping", **mapping})

    # New kits (only if --new-kits flag)
    if args.new_kits:
        for new_kit in registry.get("new_kits", []):
            if new_kit.get("status") != "approved":
                continue
            if args.handle and new_kit.get("shopify_handle") != args.handle:
                continue
            entries.append({"type": "new_kit", **new_kit})

    if not entries:
        print("\nNo approved entries to process.")
        print("Run discover-shopsolar.py first, then set status to 'approved' in the registry.")
        return

    print(f"\nProcessing {len(entries)} approved entries...")

    # Fetch all products from collections (batch, more efficient than per-product)
    print("\nFetching product data from Shopify API...")
    all_products = {}
    for col in collections:
        products = fetch_collection_products(col)
        all_products.update(products)
    print(f"  Loaded {len(all_products)} products from {len(collections)} collections\n")

    if args.dry_run:
        print("DRY RUN — extracted price data:\n")
        for entry in entries:
            handle = entry["shopify_handle"]
            variant_id = entry["shopify_variant_id"]
            product = all_products.get(handle)
            if not product:
                print(f"  {handle}: NOT FOUND in Shopify API")
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
        return

    # Write to DB
    conn = get_db()
    cur = conn.cursor()

    # Create ingestion run
    run_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    handles = [e["shopify_handle"] for e in entries]
    cur.execute(
        """
        INSERT INTO ingestion_runs (id, source_name, source_type, scheduled_at, item_count, metadata)
        VALUES (%s, 'shop-solar-kits', 'api', %s, %s, %s)
        """,
        (run_id, now, len(entries), json.dumps({"handles": handles})),
    )

    retailer_id = ensure_retailer(cur)
    succeeded = 0
    failed = 0

    for entry in entries:
        handle = entry["shopify_handle"]
        variant_id = entry["shopify_variant_id"]
        slug = entry.get("kit_slug") or entry.get("proposed_slug", handle)

        print(f"Processing {slug} ({handle}:{variant_id})...")

        product = all_products.get(handle)
        if not product:
            # Try individual fetch as fallback
            print(f"  Not in collection, fetching individually...")
            product = fetch_product(handle)

        if not product:
            print(f"  SKIP — product not found")
            failed += 1
            cur.execute(
                """
                INSERT INTO ingestion_run_items (run_id, source_key, target_kind, payload_hash, observed_at, status, error_message)
                VALUES (%s, %s, 'kit', 'no-data', %s, 'failed', 'Product not found in Shopify API')
                """,
                (run_id, f"{handle}:{variant_id}", now),
            )
            continue

        price_data = extract_variant_price(product, variant_id)
        if not price_data:
            print(f"  SKIP — variant {variant_id} not found in product")
            failed += 1
            cur.execute(
                """
                INSERT INTO ingestion_run_items (run_id, source_key, target_kind, payload_hash, observed_at, status, error_message)
                VALUES (%s, %s, 'kit', 'no-variant', %s, 'failed', 'Variant not found in product')
                """,
                (run_id, f"{handle}:{variant_id}", now),
            )
            continue

        # Determine brand from vendor or entry
        vendor = entry.get("vendor") or product.get("vendor", "Unknown")
        brand_id = ensure_brand(cur, vendor)

        # Extract first product image
        product_images = product.get("images", [])
        image_url = product_images[0].get("src") if product_images else None

        try:
            cur.execute("SAVEPOINT item_sp")

            kit_id = ensure_kit(cur, entry, brand_id, image_url=image_url)
            offer_id = upsert_kit_offer(cur, kit_id, retailer_id, entry, price_data, run_id)

            p_hash = payload_hash(price_data)
            cur.execute(
                """
                INSERT INTO ingestion_run_items (run_id, source_key, target_kind, target_offer_id, payload_hash, observed_at, status, processed_at)
                VALUES (%s, %s, 'kit', %s, %s, %s, 'succeeded', %s)
                """,
                (run_id, f"{handle}:{variant_id}", offer_id, p_hash, now, now),
            )
            cur.execute("RELEASE SAVEPOINT item_sp")
            succeeded += 1

        except Exception as e:
            print(f"  ERROR: {e}")
            cur.execute("ROLLBACK TO SAVEPOINT item_sp")
            failed += 1
            cur.execute(
                """
                INSERT INTO ingestion_run_items (run_id, source_key, target_kind, payload_hash, observed_at, status, error_message)
                VALUES (%s, %s, 'kit', 'error', %s, 'failed', %s)
                """,
                (run_id, f"{handle}:{variant_id}", now, str(e)[:500]),
            )

    # Finalize run
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

    print(f"\n{'=' * 60}")
    print(f"Done! {succeeded} succeeded, {failed} failed ({status})")
    print(f"Run ID: {run_id}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
