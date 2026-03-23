"""
Amazon Creators API ingestion for OffGridEmpire.

Fetches current pricing for tracked ASINs, upserts into PostgreSQL.
Designed to run on cron via n8n (every 6 hours).

Usage:
  pip install -r scripts/requirements.txt
  python scripts/ingest-amazon.py              # full run
  python scripts/ingest-amazon.py --dry-run    # fetch only, no DB writes
  python scripts/ingest-amazon.py --asin B07CTKT56Y  # single ASIN
"""

import json
import hashlib
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# Load env from central .env
env_path = Path.home() / "google-drive" / "0-AI" / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    # Running on droplet — env vars already set
    load_dotenv()

# ── Config ──────────────────────────────────────────────────────────────────────

# Use OFFGRID_-prefixed credentials first, fall back to shared
CREDENTIAL_ID = os.environ.get("OFFGRID_AMAZON_CREDENTIAL_ID") or os.environ.get("AMAZON_PA_ACCESS_KEY", "")
CREDENTIAL_SECRET = os.environ.get("OFFGRID_AMAZON_CREDENTIAL_SECRET") or os.environ.get("AMAZON_PA_SECRET_KEY", "")
PARTNER_TAG = os.environ.get("OFFGRID_AMAZON_PARTNER_TAG") or os.environ.get("AMAZON_PA_PARTNER_TAG", "fidohikes-20")
DATABASE_URL = os.environ.get("OFFGRID_DATABASE_URL", "")

REGISTRY_PATH = Path(__file__).resolve().parent / "asin_registry.json"

# Amazon Creators API resources to request (camelCase, offersV2)
ITEM_RESOURCES = [
    "itemInfo.title",
    "itemInfo.byLineInfo",
    "itemInfo.features",
    "itemInfo.manufactureInfo",
    "itemInfo.productInfo",
    "images.primary.large",
    "offersV2.listings.price",
    "offersV2.listings.availability",
    "offersV2.listings.merchantInfo",
    "offersV2.listings.condition",
]


def get_api():
    """Initialize Amazon Creators API client."""
    try:
        from amazon_creatorsapi import AmazonCreatorsApi, Country
        from amazon_creatorsapi.models import GetItemsResource
    except ImportError:
        print("ERROR: amazon_creatorsapi not installed. Run: pip install python-amazon-paapi>=6.0.0")
        sys.exit(1)

    if not CREDENTIAL_ID or not CREDENTIAL_SECRET:
        print("ERROR: AMAZON_PA_ACCESS_KEY and AMAZON_PA_SECRET_KEY must be set")
        sys.exit(1)

    return AmazonCreatorsApi(
        credential_id=CREDENTIAL_ID,
        credential_secret=CREDENTIAL_SECRET,
        version="3.1",
        tag=PARTNER_TAG,
        country=Country.US,
    )


def load_registry():
    """Load ASIN registry from JSON."""
    with open(REGISTRY_PATH) as f:
        return json.load(f)


def fetch_items(api, asins: list[str]) -> dict:
    """Fetch item data from Amazon, batching in groups of 10 (API limit)."""
    from amazon_creatorsapi.models import GetItemsResource

    all_items = {}
    # Map string resource names to enum values
    resources = [GetItemsResource(r) for r in ITEM_RESOURCES]

    for i in range(0, len(asins), 10):
        batch = asins[i : i + 10]
        print(f"  Fetching batch {i // 10 + 1}: {len(batch)} ASINs...")
        try:
            items = api.get_items(batch, resources=resources)
            for item in items:
                all_items[item.asin] = item
        except Exception as e:
            print(f"  ERROR fetching batch: {e}")
            # Continue with remaining batches
            continue

    return all_items


def extract_price(item) -> dict:
    """Extract price data from an Amazon item response."""
    result = {
        "title": None,
        "price_cents": None,
        "shipping_cents": 0,
        "in_stock": False,
        "seller_name": None,
        "availability_text": None,
        "source_url": f"https://www.amazon.com/dp/{item.asin}",
        "affiliate_url": item.detail_page_url if hasattr(item, "detail_page_url") else None,
    }

    # Title
    if hasattr(item, "item_info") and item.item_info:
        if hasattr(item.item_info, "title") and item.item_info.title:
            result["title"] = item.item_info.title.display_value

    # Offers — try offers_v2 first (Creators API), then offers (legacy)
    offers = getattr(item, "offers_v2", None) or getattr(item, "offers", None)

    if offers:
        listings = getattr(offers, "listings", None) or []
        if listings:
            listing = listings[0]

            # Price — nested under price.money in Creators API v2/v3
            price_obj = getattr(listing, "price", None)
            if price_obj:
                money = getattr(price_obj, "money", None)
                if money:
                    amount = getattr(money, "amount", None)
                    if amount is not None:
                        result["price_cents"] = int(float(amount) * 100)
                    else:
                        display = getattr(money, "display_amount", None)
                        if display:
                            try:
                                clean = display.replace("$", "").replace(",", "")
                                result["price_cents"] = int(float(clean) * 100)
                            except (ValueError, AttributeError):
                                pass

            # Availability
            avail = getattr(listing, "availability", None)
            if avail:
                msg = getattr(avail, "message", None)
                result["availability_text"] = msg
                result["in_stock"] = "in stock" in (msg or "").lower()

            # Seller
            merchant = getattr(listing, "merchant_info", None)
            if merchant:
                result["seller_name"] = getattr(merchant, "name", None)

    return result


def payload_hash(data: dict) -> str:
    """Compute a stable hash for deduplication."""
    # Only hash price-relevant fields
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


def ensure_retailer_amazon(cur) -> str:
    """Get or create Amazon retailer, return ID."""
    cur.execute("SELECT id FROM retailers WHERE slug = 'amazon'")
    row = cur.fetchone()
    if row:
        return row[0]
    retailer_id = str(uuid.uuid4())
    cur.execute(
        "INSERT INTO retailers (id, name, slug, retailer_type) VALUES (%s, 'Amazon', 'amazon', 'amazon')",
        (retailer_id,),
    )
    return retailer_id


def upsert_kit_offer(cur, kit_id: str, retailer_id: str, asin: str, price_data: dict, run_id: str):
    """Upsert kit offer and record price event."""
    now = datetime.now(timezone.utc)
    source_url = price_data["source_url"]
    canonical_url = source_url
    affiliate_url = price_data.get("affiliate_url")

    # Upsert offer
    cur.execute(
        """
        INSERT INTO kit_offers (kit_id, retailer_id, asin, source_url, canonical_url, affiliate_url, title_on_page, last_seen_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (retailer_id, canonical_url) DO UPDATE SET
            asin = EXCLUDED.asin,
            affiliate_url = EXCLUDED.affiliate_url,
            title_on_page = EXCLUDED.title_on_page,
            last_seen_at = EXCLUDED.last_seen_at,
            is_active = true
        RETURNING id
        """,
        (kit_id, retailer_id, asin, source_url, canonical_url, affiliate_url, price_data.get("title"), now),
    )
    offer_id = cur.fetchone()[0]

    if price_data["price_cents"] is None:
        print(f"    No price data available, skipping price event")
        return offer_id

    # Compute hash for dedup
    p_hash = payload_hash(price_data)

    # Insert price event (idempotent via unique constraint)
    raw_payload = {
        "price_cents": price_data["price_cents"],
        "shipping_cents": price_data["shipping_cents"],
        "in_stock": price_data["in_stock"],
        "seller_name": price_data.get("seller_name"),
        "availability_text": price_data.get("availability_text"),
    }
    try:
        cur.execute(
            """
            INSERT INTO kit_price_events (offer_id, observed_at, source_type, source_run_id, price_cents, shipping_cents, in_stock, raw_payload_hash, raw_payload)
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
            INSERT INTO kit_current_prices (offer_id, kit_id, retailer_id, latest_event_id, observed_at, currency_code, price_cents, shipping_cents, total_known_cents, in_stock)
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


def upsert_product_offer(cur, product_id: str, retailer_id: str, asin: str, price_data: dict, run_id: str):
    """Upsert product offer and record price event."""
    now = datetime.now(timezone.utc)
    source_url = price_data["source_url"]
    canonical_url = source_url
    affiliate_url = price_data.get("affiliate_url")

    cur.execute(
        """
        INSERT INTO product_offers (product_id, retailer_id, asin, source_url, canonical_url, affiliate_url, title_on_page, last_seen_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (retailer_id, canonical_url) DO UPDATE SET
            asin = EXCLUDED.asin,
            affiliate_url = EXCLUDED.affiliate_url,
            title_on_page = EXCLUDED.title_on_page,
            last_seen_at = EXCLUDED.last_seen_at,
            is_active = true
        RETURNING id
        """,
        (product_id, retailer_id, asin, source_url, canonical_url, affiliate_url, price_data.get("title"), now),
    )
    offer_id = cur.fetchone()[0]

    if price_data["price_cents"] is None:
        print(f"    No price data available, skipping price event")
        return offer_id

    p_hash = payload_hash(price_data)
    raw_payload = {
        "price_cents": price_data["price_cents"],
        "shipping_cents": price_data["shipping_cents"],
        "in_stock": price_data["in_stock"],
        "seller_name": price_data.get("seller_name"),
    }

    try:
        cur.execute(
            """
            INSERT INTO product_price_events (offer_id, observed_at, source_type, source_run_id, price_cents, shipping_cents, in_stock, seller_name, raw_payload_hash, raw_payload)
            VALUES (%s, %s, 'api', %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (offer_id, observed_at, raw_payload_hash) DO NOTHING
            RETURNING id
            """,
            (
                offer_id, now, run_id,
                price_data["price_cents"], price_data["shipping_cents"],
                price_data["in_stock"], price_data.get("seller_name"),
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
            INSERT INTO product_current_prices (offer_id, product_id, retailer_id, latest_event_id, observed_at, currency_code, price_cents, shipping_cents, total_known_cents, in_stock)
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
                offer_id, product_id, retailer_id, event_id, now,
                price_data["price_cents"], price_data["shipping_cents"],
                total_known_cents, price_data["in_stock"],
            ),
        )
        print(f"    Price: ${price_data['price_cents'] / 100:.2f} ({'in stock' if price_data['in_stock'] else 'out of stock'})")

    except Exception as e:
        print(f"    ERROR recording price: {e}")

    return offer_id


def ensure_kit(cur, entry: dict, brand_id: str) -> str:
    """Get or create kit record, return ID."""
    cur.execute("SELECT id FROM kits WHERE slug = %s", (entry["slug"],))
    row = cur.fetchone()
    if row:
        return row[0]

    kit_id = str(uuid.uuid4())
    cur.execute(
        """
        INSERT INTO kits (id, brand_id, title, slug)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (slug) DO NOTHING
        RETURNING id
        """,
        (kit_id, brand_id, entry["title"], entry["slug"]),
    )
    row = cur.fetchone()
    return row[0] if row else kit_id


def ensure_product(cur, entry: dict, brand_id: str) -> str:
    """Get or create product record, return ID."""
    cur.execute("SELECT id FROM products WHERE slug = %s", (entry["slug"],))
    row = cur.fetchone()
    if row:
        return row[0]

    product_id = str(uuid.uuid4())
    cur.execute(
        """
        INSERT INTO products (id, brand_id, category, title, slug)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (slug) DO NOTHING
        RETURNING id
        """,
        (product_id, brand_id, entry["category"], entry["title"], entry["slug"]),
    )
    row = cur.fetchone()
    return row[0] if row else product_id


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Ingest Amazon pricing for OffGridEmpire")
    parser.add_argument("--dry-run", action="store_true", help="Fetch data but don't write to DB")
    parser.add_argument("--asin", type=str, help="Fetch a single ASIN only")
    parser.add_argument("--kits-only", action="store_true", help="Only process kit ASINs")
    parser.add_argument("--products-only", action="store_true", help="Only process product ASINs")
    args = parser.parse_args()

    print("=" * 60)
    print(f"OffGridEmpire Amazon Ingestion — {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)

    # Load registry
    registry = load_registry()

    # Collect ASINs to fetch
    all_asins = []
    asin_to_entry = {}

    if not args.products_only:
        for entry in registry["kits"]:
            if args.asin and entry["asin"] != args.asin:
                continue
            all_asins.append(entry["asin"])
            asin_to_entry[entry["asin"]] = {"type": "kit", **entry}

    if not args.kits_only:
        for entry in registry["products"]:
            if args.asin and entry["asin"] != args.asin:
                continue
            all_asins.append(entry["asin"])
            asin_to_entry[entry["asin"]] = {"type": "product", **entry}

    print(f"\nFetching {len(all_asins)} ASINs from Amazon Creators API...")

    # Fetch from Amazon
    api = get_api()
    items = fetch_items(api, all_asins)
    print(f"  Got {len(items)} items back\n")

    if args.dry_run:
        print("DRY RUN — extracted price data:\n")
        for asin, item in items.items():
            price_data = extract_price(item)
            entry = asin_to_entry.get(asin, {})
            print(f"  {asin} ({entry.get('slug', '?')})")
            print(f"    Title: {price_data['title']}")
            print(f"    Price: ${(price_data['price_cents'] or 0) / 100:.2f}")
            print(f"    In stock: {price_data['in_stock']}")
            print(f"    Seller: {price_data['seller_name']}")
            print()
        return

    # Write to DB
    conn = get_db()
    cur = conn.cursor()

    # Create ingestion run
    run_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    cur.execute(
        """
        INSERT INTO ingestion_runs (id, source_name, source_type, scheduled_at, item_count, metadata)
        VALUES (%s, 'amazon-creators-api', 'api', %s, %s, %s)
        """,
        (run_id, now, len(all_asins), json.dumps({"asins": all_asins})),
    )

    amazon_retailer_id = ensure_retailer_amazon(cur)
    succeeded = 0
    failed = 0

    for asin in all_asins:
        entry = asin_to_entry[asin]
        item = items.get(asin)

        print(f"Processing {asin} ({entry['slug']})...")

        if not item:
            print(f"  SKIP — no data returned from API")
            failed += 1
            cur.execute(
                """
                INSERT INTO ingestion_run_items (run_id, source_key, target_kind, payload_hash, observed_at, status, error_message)
                VALUES (%s, %s, %s, 'no-data', %s, 'failed', 'No data returned from API')
                """,
                (run_id, asin, entry["type"], now),
            )
            continue

        price_data = extract_price(item)
        brand_id = ensure_brand(cur, entry["brand"])

        try:
            cur.execute("SAVEPOINT item_sp")
            if entry["type"] == "kit":
                kit_id = ensure_kit(cur, entry, brand_id)
                offer_id = upsert_kit_offer(cur, kit_id, amazon_retailer_id, asin, price_data, run_id)
            else:
                product_id = ensure_product(cur, entry, brand_id)
                offer_id = upsert_product_offer(cur, product_id, amazon_retailer_id, asin, price_data, run_id)

            p_hash = payload_hash(price_data)
            cur.execute(
                """
                INSERT INTO ingestion_run_items (run_id, source_key, target_kind, target_offer_id, payload_hash, observed_at, status, processed_at)
                VALUES (%s, %s, %s, %s, %s, %s, 'succeeded', %s)
                """,
                (run_id, asin, entry["type"], offer_id, p_hash, now, now),
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
                VALUES (%s, %s, %s, 'error', %s, 'failed', %s)
                """,
                (run_id, asin, entry["type"], now, str(e)[:500]),
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
