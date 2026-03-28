"""
Keepa historical price backfill for OffGridEmpire.

Fetches years of Amazon price history for all ASINs in the registry,
inserts into kit_price_events / product_price_events as historical data.

Re-runnable: skips ASINs that already have Keepa data, safe to add new ASINs
and run again during the subscription month.

Usage:
  pip install keepa
  python scripts/backfill-keepa.py                     # all ASINs
  python scripts/backfill-keepa.py --asin B07CTKT56Y   # single ASIN
  python scripts/backfill-keepa.py --dry-run            # fetch + preview, no DB writes
  python scripts/backfill-keepa.py --force              # re-backfill even if already done
"""

import json
import hashlib
import os
import sys
import uuid
import argparse
from datetime import datetime, timezone
from pathlib import Path

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# Load env
env_path = Path.home() / "google-drive" / "0-AI" / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()

DATABASE_URL = os.environ.get("OFFGRID_DATABASE_URL", "")
KEEPA_API_KEY = os.environ.get("OFFGRID_KEEPA_API_KEY", "")
REGISTRY_PATH = Path(__file__).resolve().parent / "asin_registry.json"

# Keepa time epoch: minutes since 2011-01-01 00:00 UTC
KEEPA_EPOCH_MS = 1293840000000  # 2011-01-01T00:00:00Z in milliseconds


def keepa_time_to_datetime(keepa_minutes: int) -> datetime:
    """Convert Keepa timestamp (minutes since 2011-01-01) to Python datetime."""
    unix_ms = KEEPA_EPOCH_MS + keepa_minutes * 60_000
    return datetime.fromtimestamp(unix_ms / 1000, tz=timezone.utc)


def parse_csv_history(csv_data: list) -> list[dict]:
    """
    Parse Keepa's flat CSV array [time, price, time, price, ...] into records.
    Prices are in cents. -1 means out of stock / no offer.
    """
    if not csv_data:
        return []

    records = []
    for i in range(0, len(csv_data) - 1, 2):
        keepa_time = csv_data[i]
        price_raw = csv_data[i + 1]

        if price_raw is None:
            continue

        dt = keepa_time_to_datetime(keepa_time)
        price_cents = int(price_raw) if price_raw >= 0 else None
        in_stock = price_raw >= 0

        records.append({
            "observed_at": dt,
            "price_cents": price_cents,
            "in_stock": in_stock,
        })

    return records


def payload_hash(price_cents, shipping_cents, in_stock) -> str:
    """Compute dedup hash matching the existing ingestion format."""
    hashable = {
        "price_cents": price_cents,
        "shipping_cents": shipping_cents,
        "in_stock": in_stock,
    }
    return hashlib.sha256(json.dumps(hashable, sort_keys=True).encode()).hexdigest()[:16]


def get_db():
    if not DATABASE_URL:
        print("ERROR: OFFGRID_DATABASE_URL must be set")
        sys.exit(1)
    return psycopg2.connect(DATABASE_URL)


def load_registry():
    with open(REGISTRY_PATH) as f:
        return json.load(f)


def get_already_backfilled(cur) -> set:
    """Get ASINs that already have Keepa-sourced price events."""
    cur.execute("""
        SELECT DISTINCT COALESCE(ko.asin, po.asin) AS asin
        FROM (
            SELECT DISTINCT kpe.offer_id
            FROM kit_price_events kpe
            WHERE kpe.source_type = 'feed'
              AND kpe.raw_payload ->> 'source' = 'keepa'
            UNION
            SELECT DISTINCT ppe.offer_id
            FROM product_price_events ppe
            WHERE ppe.source_type = 'feed'
              AND ppe.raw_payload ->> 'source' = 'keepa'
        ) backfilled
        LEFT JOIN kit_offers ko ON ko.id = backfilled.offer_id
        LEFT JOIN product_offers po ON po.id = backfilled.offer_id
    """)
    return {row[0] for row in cur.fetchall() if row[0]}


def ensure_retailer_amazon(cur) -> str:
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


def get_offer_id(cur, asin: str, retailer_id: str, entry: dict, kind: str) -> str | None:
    """Find the existing offer for this ASIN, or return None."""
    table = "kit_offers" if kind == "kit" else "product_offers"
    cur.execute(f"SELECT id FROM {table} WHERE retailer_id = %s AND asin = %s", (retailer_id, asin))
    row = cur.fetchone()
    return row[0] if row else None


def insert_price_events(cur, offer_id: str, records: list[dict], kind: str, run_id: str) -> int:
    """Bulk-insert historical price events. Returns count of rows inserted."""
    table = "kit_price_events" if kind == "kit" else "product_price_events"
    inserted = 0

    for rec in records:
        if rec["price_cents"] is None:
            continue

        phash = payload_hash(rec["price_cents"], 0, rec["in_stock"])

        try:
            cur.execute(f"""
                INSERT INTO {table}
                    (id, offer_id, observed_at, source_type, source_run_id,
                     price_cents, shipping_cents, in_stock, raw_payload_hash, raw_payload)
                VALUES (%s, %s, %s, 'feed', %s, %s, 0, %s, %s, %s)
                ON CONFLICT (offer_id, observed_at, raw_payload_hash) DO NOTHING
            """, (
                str(uuid.uuid4()),
                offer_id,
                rec["observed_at"],
                run_id,
                rec["price_cents"],
                rec["in_stock"],
                phash,
                json.dumps({
                    "source": "keepa",
                    "original_keepa_price": rec["price_cents"],
                }),
            ))
            if cur.rowcount > 0:
                inserted += 1
        except Exception as e:
            # Skip duplicates or constraint violations
            cur.execute("ROLLBACK TO SAVEPOINT keepa_event")
            continue

    return inserted


def fetch_keepa_products(api_key: str, asins: list[str]) -> dict:
    """
    Fetch price history from Keepa API. Returns {asin: product_data}.
    Uses raw HTTP API (the keepa Python lib sends invalid params).
    Respects token limits — waits for refill when tokens are low.
    29€ plan: ~1 token/min refill, 1 token per ASIN.
    """
    import time
    import requests as _requests

    API_BASE = "https://api.keepa.com"

    def check_tokens():
        r = _requests.get(f"{API_BASE}/token", params={"key": api_key})
        data = r.json()
        return data.get("tokensLeft", 0), data.get("refillRate", 1)

    all_products = {}

    # Process one ASIN at a time to respect the tight token budget
    # (1 token/min means we can only do ~1 per minute)
    total = len(asins)

    for idx, asin in enumerate(asins):
        # Check tokens before each request
        tokens, refill_rate = check_tokens()
        if tokens < 1:
            wait_secs = int(60 / max(refill_rate, 1)) + 5
            print(f"  [{idx+1}/{total}] Waiting {wait_secs}s for token refill...", flush=True)
            time.sleep(wait_secs)

        print(f"  [{idx+1}/{total}] {asin}...", end=" ", flush=True)
        try:
            r = _requests.get(f"{API_BASE}/product", params={
                "key": api_key,
                "domain": "1",  # US
                "asin": asin,
            })
            data = r.json()

            if r.status_code != 200 or "error" in data:
                err = data.get("error", {}).get("message", f"HTTP {r.status_code}")
                print(f"ERROR: {err}")
                continue

            products = data.get("products", [])
            if products:
                p = products[0]
                csv = p.get("csv", [])
                amazon_pts = len(csv[0]) // 2 if len(csv) > 0 and csv[0] else 0
                new_pts = len(csv[1]) // 2 if len(csv) > 1 and csv[1] else 0
                all_products[asin] = {
                    "asin": asin,
                    "title": p.get("title"),
                    "data": {
                        "AMAZON": csv[0] if len(csv) > 0 else [],
                        "NEW": csv[1] if len(csv) > 1 else [],
                    },
                }
                print(f"OK ({amazon_pts} Amazon + {new_pts} New/3P points)")
            else:
                print(f"no data")

            tokens_left = data.get("tokensLeft", 0)
            if tokens_left < 1 and idx < total - 1:
                # Wait before next request
                wait_secs = int(60 / max(refill_rate, 1)) + 2
                time.sleep(wait_secs)

        except Exception as e:
            print(f"ERROR: {e}")
            continue

    tokens_left, _ = check_tokens()
    print(f"\n  Keepa tokens remaining: {tokens_left}")
    return all_products


def main():
    parser = argparse.ArgumentParser(description="Backfill historical prices from Keepa")
    parser.add_argument("--asin", help="Backfill single ASIN")
    parser.add_argument("--dry-run", action="store_true", help="Fetch but don't write to DB")
    parser.add_argument("--force", action="store_true", help="Re-backfill even if already done")
    args = parser.parse_args()

    if not KEEPA_API_KEY:
        print("ERROR: OFFGRID_KEEPA_API_KEY must be set in .env")
        sys.exit(1)

    registry = load_registry()
    run_id = str(uuid.uuid4())

    # Build ASIN → entry mapping
    asin_map = {}
    for entry in registry.get("kits", []):
        asin_map[entry["asin"]] = {"entry": entry, "kind": "kit"}
    for entry in registry.get("products", []):
        asin_map[entry["asin"]] = {"entry": entry, "kind": "product"}

    if args.asin:
        if args.asin not in asin_map:
            print(f"ERROR: ASIN {args.asin} not in registry")
            sys.exit(1)
        target_asins = [args.asin]
    else:
        target_asins = list(asin_map.keys())

    print(f"{'=' * 60}")
    print(f"OffGridEmpire Keepa Backfill — {datetime.now(timezone.utc).isoformat()}")
    print(f"{'=' * 60}")
    print(f"Registry: {len(target_asins)} ASINs to process")

    # Check which are already done
    conn = get_db()
    cur = conn.cursor()

    if not args.force:
        already_done = get_already_backfilled(cur)
        skipped = [a for a in target_asins if a in already_done]
        target_asins = [a for a in target_asins if a not in already_done]
        if skipped:
            print(f"Skipping {len(skipped)} ASINs with existing Keepa data (use --force to re-run)")
    else:
        print("Force mode: re-backfilling all ASINs")

    if not target_asins:
        print("Nothing to backfill!")
        conn.close()
        return

    print(f"Fetching Keepa data for {len(target_asins)} ASINs...\n")

    # Fetch from Keepa
    keepa_data = fetch_keepa_products(KEEPA_API_KEY, target_asins)
    print(f"\nReceived data for {len(keepa_data)} ASINs\n")

    if args.dry_run:
        # Preview mode
        for asin, product in keepa_data.items():
            csv_amazon = product.get("data", {}).get("AMAZON", [])
            csv_new = product.get("data", {}).get("NEW", [])
            records_amazon = parse_csv_history(csv_amazon)
            records_new = parse_csv_history(csv_new)
            in_stock_amazon = [r for r in records_amazon if r["in_stock"]]
            in_stock_new = [r for r in records_new if r["in_stock"]]
            kind = asin_map.get(asin, {}).get("kind", "?")
            entry = asin_map.get(asin, {}).get("entry", {})
            print(f"  {asin} ({entry.get('slug', '?')}, {kind})")
            print(f"    Amazon price points: {len(in_stock_amazon)} (of {len(records_amazon)} total)")
            print(f"    New/3P price points: {len(in_stock_new)} (of {len(records_new)} total)")
            if in_stock_amazon:
                first = in_stock_amazon[0]
                last = in_stock_amazon[-1]
                print(f"    Amazon range: {first['observed_at'].date()} → {last['observed_at'].date()}, ${first['price_cents']/100:.2f} → ${last['price_cents']/100:.2f}")
            if in_stock_new:
                first = in_stock_new[0]
                last = in_stock_new[-1]
                print(f"    New range: {first['observed_at'].date()} → {last['observed_at'].date()}, ${first['price_cents']/100:.2f} → ${last['price_cents']/100:.2f}")
        print(f"\nDry run complete. No data written.")
        conn.close()
        return

    # Insert into DB
    retailer_id = ensure_retailer_amazon(cur)
    total_inserted = 0
    total_skipped = 0

    for asin, product in keepa_data.items():
        info = asin_map.get(asin)
        if not info:
            continue
        kind = info["kind"]
        entry = info["entry"]

        # Get the offer ID for this ASIN
        offer_id = get_offer_id(cur, asin, retailer_id, entry, kind)
        if not offer_id:
            print(f"  {asin} ({entry.get('slug', '?')}): no offer in DB, skipping")
            total_skipped += 1
            continue

        # Parse Keepa price history — use Amazon price (index 0), fall back to New (index 1)
        csv_amazon = product.get("data", {}).get("AMAZON", [])
        csv_new = product.get("data", {}).get("NEW", [])

        # Prefer Amazon's own price, supplement with 3P new where Amazon is absent
        records = parse_csv_history(csv_amazon)
        new_records = parse_csv_history(csv_new)

        # Build date set of Amazon prices to avoid duplicates
        amazon_dates = {r["observed_at"].date() for r in records if r["in_stock"]}

        # Add 3P new records for dates where Amazon has no price
        for nr in new_records:
            if nr["in_stock"] and nr["observed_at"].date() not in amazon_dates:
                records.append(nr)

        # Sort chronologically
        records.sort(key=lambda r: r["observed_at"])

        # Filter to in-stock only for cleaner history
        records = [r for r in records if r["in_stock"] and r["price_cents"]]

        if not records:
            print(f"  {asin} ({entry.get('slug', '?')}): no price history from Keepa")
            total_skipped += 1
            continue

        # Insert with savepoints for safety
        cur.execute("SAVEPOINT keepa_asin")
        try:
            cur.execute("SAVEPOINT keepa_event")
            inserted = insert_price_events(cur, offer_id, records, kind, run_id)
            cur.execute("RELEASE SAVEPOINT keepa_asin")
            conn.commit()
            total_inserted += inserted
            date_range = f"{records[0]['observed_at'].date()} → {records[-1]['observed_at'].date()}"
            print(f"  {asin} ({entry.get('slug', '?')}): {inserted} events inserted ({date_range})")
        except Exception as e:
            cur.execute("ROLLBACK TO SAVEPOINT keepa_asin")
            conn.commit()
            print(f"  {asin} ({entry.get('slug', '?')}): ERROR — {e}")
            total_skipped += 1

    conn.commit()
    conn.close()

    print(f"\n{'=' * 60}")
    print(f"Backfill complete: {total_inserted} events inserted, {total_skipped} ASINs skipped")
    print(f"Run ID: {run_id}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
