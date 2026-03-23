"""
Manual price ingestion for OffGridEmpire.

Reads asin_registry.json and manually-specified prices, writes to PostgreSQL.
Use this when Amazon Creators API credentials aren't available yet.

Usage:
  python3 scripts/ingest-manual.py                # Use prices from manual_prices.json
  python3 scripts/ingest-manual.py --from-registry # Use estimated prices from asin_registry
"""

import json
import hashlib
import os
import sys
import uuid
from datetime import datetime, timezone
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
MANUAL_PRICES_PATH = SCRIPTS_DIR / "manual_prices.json"


def payload_hash(price_cents: int, shipping_cents: int, in_stock: bool) -> str:
    hashable = {"price_cents": price_cents, "shipping_cents": shipping_cents, "in_stock": in_stock}
    return hashlib.sha256(json.dumps(hashable, sort_keys=True).encode()).hexdigest()[:16]


def main():
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--from-registry", action="store_true", help="Use estimated prices from registry")
    args = parser.parse_args()

    if not DATABASE_URL:
        print("ERROR: OFFGRID_DATABASE_URL not set")
        sys.exit(1)

    registry = json.loads(REGISTRY_PATH.read_text())

    # Load manual prices or use registry estimates
    if args.from_registry:
        # Build prices from registry (requires estimated_price field)
        prices = {}
        for entry in registry["kits"] + registry.get("products", []):
            if "estimated_price" in entry:
                prices[entry["asin"]] = {
                    "price_cents": int(entry["estimated_price"] * 100),
                    "shipping_cents": 0,
                    "in_stock": True,
                }
    elif MANUAL_PRICES_PATH.exists():
        prices = json.loads(MANUAL_PRICES_PATH.read_text())
    else:
        print(f"ERROR: No manual_prices.json found at {MANUAL_PRICES_PATH}")
        print("Create it with format: {\"B07CTKT56Y\": {\"price_cents\": 49900, \"shipping_cents\": 0, \"in_stock\": true}}")
        print("Or use --from-registry to use estimated prices from asin_registry.json")
        sys.exit(1)

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    now = datetime.now(timezone.utc)

    # Create ingestion run
    run_id = str(uuid.uuid4())
    all_asins = list(prices.keys())
    cur.execute(
        """
        INSERT INTO ingestion_runs (id, source_name, source_type, scheduled_at, item_count, metadata)
        VALUES (%s, 'manual-entry', 'manual', %s, %s, %s)
        """,
        (run_id, now, len(all_asins), json.dumps({"source": "manual"})),
    )

    # Get Amazon retailer
    cur.execute("SELECT id FROM retailers WHERE slug = 'amazon'")
    row = cur.fetchone()
    if not row:
        retailer_id = str(uuid.uuid4())
        cur.execute("INSERT INTO retailers (id, name, slug, retailer_type) VALUES (%s, 'Amazon', 'amazon', 'amazon')", (retailer_id,))
    else:
        retailer_id = row[0]

    succeeded = 0
    failed = 0

    for entry_list, entry_type in [(registry["kits"], "kit"), (registry.get("products", []), "product")]:
        for entry in entry_list:
            asin = entry["asin"]
            if asin not in prices:
                continue

            price_data = prices[asin]
            price_cents = price_data["price_cents"]
            shipping_cents = price_data.get("shipping_cents", 0)
            in_stock = price_data.get("in_stock", True)
            total_known_cents = price_cents + shipping_cents

            print(f"  {asin} ({entry['slug']}) — ${price_cents / 100:.2f}")

            # Ensure brand
            brand_name = entry["brand"]
            brand_slug = brand_name.lower().replace(" ", "-").replace(".", "")
            cur.execute("SELECT id FROM brands WHERE slug = %s", (brand_slug,))
            brand_row = cur.fetchone()
            if brand_row:
                brand_id = brand_row[0]
            else:
                brand_id = str(uuid.uuid4())
                cur.execute("INSERT INTO brands (id, name, slug) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING", (brand_id, brand_name, brand_slug))

            source_url = f"https://www.amazon.com/dp/{asin}"
            p_hash = payload_hash(price_cents, shipping_cents, in_stock)
            raw_payload = json.dumps({"price_cents": price_cents, "shipping_cents": shipping_cents, "in_stock": in_stock})

            try:
                if entry_type == "kit":
                    # Ensure kit
                    cur.execute("SELECT id FROM kits WHERE slug = %s", (entry["slug"],))
                    kit_row = cur.fetchone()
                    if kit_row:
                        entity_id = kit_row[0]
                    else:
                        entity_id = str(uuid.uuid4())
                        cur.execute(
                            "INSERT INTO kits (id, brand_id, title, slug) VALUES (%s, %s, %s, %s) ON CONFLICT (slug) DO NOTHING RETURNING id",
                            (entity_id, brand_id, entry["title"], entry["slug"]),
                        )
                        r = cur.fetchone()
                        if r:
                            entity_id = r[0]

                    # Upsert offer
                    cur.execute(
                        """
                        INSERT INTO kit_offers (kit_id, retailer_id, asin, source_url, canonical_url, title_on_page, last_seen_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (retailer_id, canonical_url) DO UPDATE SET
                            asin = EXCLUDED.asin, title_on_page = EXCLUDED.title_on_page, last_seen_at = EXCLUDED.last_seen_at, is_active = true
                        RETURNING id
                        """,
                        (entity_id, retailer_id, asin, source_url, source_url, entry["title"], now),
                    )
                    offer_id = cur.fetchone()[0]

                    # Price event
                    cur.execute(
                        """
                        INSERT INTO kit_price_events (offer_id, observed_at, source_type, source_run_id, price_cents, shipping_cents, in_stock, raw_payload_hash, raw_payload)
                        VALUES (%s, %s, 'manual', %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (offer_id, observed_at, raw_payload_hash) DO NOTHING
                        RETURNING id
                        """,
                        (offer_id, now, run_id, price_cents, shipping_cents, in_stock, p_hash, raw_payload),
                    )
                    event_row = cur.fetchone()
                    if event_row:
                        event_id = event_row[0]
                        cur.execute(
                            """
                            INSERT INTO kit_current_prices (offer_id, kit_id, retailer_id, latest_event_id, observed_at, currency_code, price_cents, shipping_cents, total_known_cents, in_stock)
                            VALUES (%s, %s, %s, %s, %s, 'USD', %s, %s, %s, %s)
                            ON CONFLICT (offer_id) DO UPDATE SET
                                latest_event_id = EXCLUDED.latest_event_id, observed_at = EXCLUDED.observed_at,
                                price_cents = EXCLUDED.price_cents, shipping_cents = EXCLUDED.shipping_cents,
                                total_known_cents = EXCLUDED.total_known_cents, in_stock = EXCLUDED.in_stock, updated_at = now()
                            """,
                            (offer_id, entity_id, retailer_id, event_id, now, price_cents, shipping_cents, total_known_cents, in_stock),
                        )

                else:  # product
                    cur.execute("SELECT id FROM products WHERE slug = %s", (entry["slug"],))
                    prod_row = cur.fetchone()
                    if prod_row:
                        entity_id = prod_row[0]
                    else:
                        entity_id = str(uuid.uuid4())
                        cur.execute(
                            "INSERT INTO products (id, brand_id, category, title, slug) VALUES (%s, %s, %s, %s, %s) ON CONFLICT (slug) DO NOTHING RETURNING id",
                            (entity_id, brand_id, entry["category"], entry["title"], entry["slug"]),
                        )
                        r = cur.fetchone()
                        if r:
                            entity_id = r[0]

                    cur.execute(
                        """
                        INSERT INTO product_offers (product_id, retailer_id, asin, source_url, canonical_url, title_on_page, last_seen_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (retailer_id, canonical_url) DO UPDATE SET
                            asin = EXCLUDED.asin, title_on_page = EXCLUDED.title_on_page, last_seen_at = EXCLUDED.last_seen_at, is_active = true
                        RETURNING id
                        """,
                        (entity_id, retailer_id, asin, source_url, source_url, entry["title"], now),
                    )
                    offer_id = cur.fetchone()[0]

                    cur.execute(
                        """
                        INSERT INTO product_price_events (offer_id, observed_at, source_type, source_run_id, price_cents, shipping_cents, in_stock, raw_payload_hash, raw_payload)
                        VALUES (%s, %s, 'manual', %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (offer_id, observed_at, raw_payload_hash) DO NOTHING
                        RETURNING id
                        """,
                        (offer_id, now, run_id, price_cents, shipping_cents, in_stock, p_hash, raw_payload),
                    )
                    event_row = cur.fetchone()
                    if event_row:
                        event_id = event_row[0]
                        cur.execute(
                            """
                            INSERT INTO product_current_prices (offer_id, product_id, retailer_id, latest_event_id, observed_at, currency_code, price_cents, shipping_cents, total_known_cents, in_stock)
                            VALUES (%s, %s, %s, %s, %s, 'USD', %s, %s, %s, %s)
                            ON CONFLICT (offer_id) DO UPDATE SET
                                latest_event_id = EXCLUDED.latest_event_id, observed_at = EXCLUDED.observed_at,
                                price_cents = EXCLUDED.price_cents, shipping_cents = EXCLUDED.shipping_cents,
                                total_known_cents = EXCLUDED.total_known_cents, in_stock = EXCLUDED.in_stock, updated_at = now()
                            """,
                            (offer_id, entity_id, retailer_id, event_id, now, price_cents, shipping_cents, total_known_cents, in_stock),
                        )

                succeeded += 1
            except Exception as e:
                print(f"    ERROR: {e}")
                failed += 1

    # Finalize run
    status = "succeeded" if failed == 0 else ("partially_failed" if succeeded > 0 else "failed")
    cur.execute(
        "UPDATE ingestion_runs SET finished_at = %s, status = %s, succeeded_count = %s, failed_count = %s WHERE id = %s",
        (datetime.now(timezone.utc), status, succeeded, failed, run_id),
    )

    conn.commit()
    cur.close()
    conn.close()

    print(f"\nDone! {succeeded} succeeded, {failed} failed ({status})")


if __name__ == "__main__":
    main()
