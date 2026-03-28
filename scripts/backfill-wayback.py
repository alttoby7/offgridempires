"""
Wayback Machine historical price backfill for OffGridEmpire.

Fetches archived snapshots of Shopify product pages from the Wayback Machine,
extracts variant prices, and inserts into kit_price_events as historical data.
Samples ~every 6 months. Supports Shop Solar (default) and brand direct retailers.

Re-runnable: uses ON CONFLICT DO NOTHING for idempotency.

Usage:
  python scripts/backfill-wayback.py                              # all Shop Solar handles
  python scripts/backfill-wayback.py --handle ecoflow-delta-pro   # single handle
  python scripts/backfill-wayback.py --retailer ecoflow-us        # brand direct retailer
  python scripts/backfill-wayback.py --retailer ecoflow-us --all  # (same — all handles for retailer)
  python scripts/backfill-wayback.py --dry-run                    # fetch + preview, no DB writes
  python scripts/backfill-wayback.py --force                      # re-backfill already done handles
  python scripts/backfill-wayback.py --tunnel                     # use local SSH tunnel (port 15433)
"""

import json
import hashlib
import os
import re
import sys
import uuid
import argparse
import time
import gzip
from datetime import datetime, timezone
from io import BytesIO
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
SCRIPTS_DIR = Path(__file__).resolve().parent
REGISTRY_PATH = SCRIPTS_DIR / "shopsolar_registry.json"
BRAND_REGISTRY_DIR = SCRIPTS_DIR / "brand_registries"
BASE_URL = "https://shopsolarkits.com"
RETAILER_SLUG = "shop-solar-kits"
CDX_URL = "https://web.archive.org/cdx/search/cdx"
WAYBACK_RAW = "https://web.archive.org/web/{ts}id_/{url}"
USER_AGENT = "OffGridEmpire-Backfill/1.0"

# Rate limiting
CDX_DELAY = 1.0        # seconds between CDX queries
PAGE_DELAY = 1.2       # seconds between page fetches
RETRY_429_BASE = 30    # initial backoff for 429
RETRY_503_DELAY = 10   # retry delay for 503
MAX_503_RETRIES = 3


def load_registry():
    with open(REGISTRY_PATH) as f:
        return json.load(f)


def load_brand_registry(retailer_slug):
    """Load a brand direct registry and return (registry, base_url, retailer_slug)."""
    path = BRAND_REGISTRY_DIR / f"{retailer_slug}.json"
    if not path.exists():
        print(f"ERROR: No registry file at {path}")
        sys.exit(1)
    with open(path) as f:
        reg = json.load(f)
    return reg


def get_unique_handles(registry):
    """Get unique shopify handles with their registry entries grouped."""
    handle_map = {}  # handle -> [entries]
    for mapping in registry.get("mappings", []):
        if mapping.get("status") != "approved":
            continue
        h = mapping["shopify_handle"]
        handle_map.setdefault(h, []).append(mapping)
    for new_kit in registry.get("new_kits", []):
        if new_kit.get("status") != "approved":
            continue
        h = new_kit["shopify_handle"]
        handle_map.setdefault(h, []).append(new_kit)
    return handle_map


# ── CDX Discovery ──────────────────────────────────────────────────────────────

def fetch_cdx_snapshots(handle):
    """Query Wayback CDX API for archived snapshots of a product page."""
    url = (
        f"{CDX_URL}?url={BASE_URL}/products/{handle}"
        f"&output=json&fl=timestamp,statuscode,mimetype"
        f"&filter=statuscode:200&collapse=timestamp:6&limit=500"
    )
    req = Request(url, headers={"User-Agent": USER_AGENT})

    for attempt in range(MAX_503_RETRIES + 1):
        try:
            with urlopen(req, timeout=30) as resp:
                raw = resp.read()
                # Handle gzip
                if resp.headers.get("Content-Encoding") == "gzip":
                    raw = gzip.decompress(raw)
                data = json.loads(raw)
            if len(data) <= 1:
                return []
            # data[0] is header row, rest are results
            return [{"timestamp": row[0], "status": row[1]} for row in data[1:]]
        except HTTPError as e:
            if e.code == 429:
                wait = RETRY_429_BASE * (2 ** attempt)
                print(f"    429 rate limited, waiting {wait}s...")
                time.sleep(wait)
                if attempt >= 2:
                    print(f"    Aborting CDX query for {handle} after 429s")
                    return []
            elif e.code == 503:
                if attempt < MAX_503_RETRIES:
                    print(f"    503 from CDX, retrying in {RETRY_503_DELAY}s...")
                    time.sleep(RETRY_503_DELAY)
                else:
                    print(f"    503 persistent for {handle}, skipping")
                    return []
            else:
                print(f"    CDX error {e.code} for {handle}: {e}")
                return []
        except Exception as e:
            print(f"    CDX error for {handle}: {e}")
            return []

    return []


def select_semiannual(snapshots):
    """From monthly-collapsed CDX results, pick ~2 per year (Jan + Jul)."""
    if not snapshots:
        return []

    years = sorted(set(s["timestamp"][:4] for s in snapshots))
    targets = []
    for year in years:
        targets.append(f"{year}01")
        targets.append(f"{year}07")

    selected = []
    used_ts = set()
    for target in targets:
        target_int = int(target)
        best = min(snapshots, key=lambda s: abs(int(s["timestamp"][:6]) - target_int))
        if best["timestamp"] not in used_ts:
            selected.append(best)
            used_ts.add(best["timestamp"])

    return selected


# ── Page Fetching ──────────────────────────────────────────────────────────────

def fetch_archived_page(timestamp, handle):
    """Fetch raw archived page from Wayback Machine."""
    page_url = f"{BASE_URL}/products/{handle}"
    url = WAYBACK_RAW.format(ts=timestamp, url=page_url)
    req = Request(url, headers={
        "User-Agent": USER_AGENT,
        "Accept-Encoding": "gzip",
    })

    for attempt in range(MAX_503_RETRIES + 1):
        try:
            with urlopen(req, timeout=60) as resp:
                raw = resp.read()
                encoding = resp.headers.get("Content-Encoding", "")
                if "gzip" in encoding:
                    raw = gzip.decompress(raw)
                return raw.decode("utf-8", errors="replace")
        except HTTPError as e:
            if e.code == 429:
                wait = RETRY_429_BASE * (2 ** attempt)
                print(f"      429 rate limited, waiting {wait}s...")
                time.sleep(wait)
                if attempt >= 2:
                    return None
            elif e.code == 503:
                if attempt < MAX_503_RETRIES:
                    time.sleep(RETRY_503_DELAY)
                else:
                    return None
            elif e.code == 404:
                return None
            else:
                print(f"      HTTP {e.code} fetching snapshot")
                return None
        except Exception as e:
            if attempt < MAX_503_RETRIES:
                time.sleep(5)
            else:
                print(f"      Error fetching snapshot: {e}")
                return None

    return None


# ── Price Extraction ───────────────────────────────────────────────────────────

def extract_variants_from_html(html):
    """
    Extract variant price data from archived Shopify product page.
    Returns list of {id, title, price, sku, available} dicts.
    """
    variants = []

    # Strategy 1: Parse Shopify product JSON embedded in the page
    # Shopify pages embed full product data in various script patterns
    patterns = [
        # var meta = {product: {variants: [...]}}
        r'var\s+meta\s*=\s*(\{.*?\});\s*</script>',
        # product JSON in data attribute
        r'data-product-json["\']?\s*>\s*(\{.*?\})\s*<',
        # ShopifyAnalytics.meta or similar
        r'"product"\s*:\s*(\{[^{}]*"variants"\s*:\s*\[.*?\]\s*[^{}]*\})',
    ]

    for pattern in patterns:
        for match in re.finditer(pattern, html, re.DOTALL):
            try:
                blob = match.group(1)
                data = json.loads(blob)
                # Navigate to variants
                product = data.get("product", data)
                vlist = product.get("variants", [])
                if vlist:
                    for v in vlist:
                        vid = v.get("id")
                        price_raw = v.get("price")
                        if vid and price_raw is not None:
                            # Shopify meta prices can be cents (int) or dollars (string)
                            price_val = float(str(price_raw).replace(",", ""))
                            if price_val > 500:
                                price_cents = int(price_val)
                            else:
                                price_cents = int(price_val * 100)
                            variants.append({
                                "id": str(vid),
                                "title": v.get("name") or v.get("public_title") or v.get("title", ""),
                                "price_cents": price_cents,
                                "sku": v.get("sku", ""),
                                "available": v.get("available", True),
                            })
                    if variants:
                        return variants
            except (json.JSONDecodeError, ValueError, TypeError):
                continue

    # Strategy 2: Look for variants JSON array directly
    variant_array = re.search(r'"variants"\s*:\s*(\[\s*\{.*?\}\s*\])', html, re.DOTALL)
    if variant_array:
        try:
            vlist = json.loads(variant_array.group(1))
            for v in vlist:
                vid = v.get("id")
                price_raw = v.get("price")
                if vid and price_raw is not None:
                    price_val = float(str(price_raw).replace(",", ""))
                    if price_val > 500:
                        price_cents = int(price_val)
                    else:
                        price_cents = int(price_val * 100)
                    variants.append({
                        "id": str(vid),
                        "title": v.get("name") or v.get("public_title") or v.get("title", ""),
                        "price_cents": price_cents,
                        "sku": v.get("sku", ""),
                        "available": v.get("available", True),
                    })
            if variants:
                return variants
        except (json.JSONDecodeError, ValueError):
            pass

    return variants


def extract_og_price(html):
    """Fallback: extract og:price:amount meta tag."""
    match = re.search(
        r'<meta[^>]*property=["\'](?:og:|product:)price:amount["\'][^>]*content=["\']([^"\']+)',
        html, re.IGNORECASE,
    )
    if not match:
        match = re.search(
            r'<meta[^>]*content=["\']([^"\']+)["\'][^>]*property=["\'](?:og:|product:)price:amount',
            html, re.IGNORECASE,
        )
    if match:
        try:
            price = float(match.group(1).replace(",", ""))
            return int(price * 100)
        except ValueError:
            pass
    return None


def normalize_title(title):
    """Normalize a variant title for fuzzy matching."""
    return re.sub(r'[^a-z0-9]+', ' ', title.lower()).strip()


def match_variant(variants, entry):
    """
    Match a registry entry to an extracted variant using tiered strategy.
    Returns (variant_dict, match_method) or (None, None).
    """
    target_vid = str(entry.get("shopify_variant_id", ""))
    target_sku = (entry.get("sku") or "").strip()
    target_title = entry.get("variant_title", "")

    # Tier 1: Exact variant ID
    for v in variants:
        if v["id"] == target_vid:
            return v, "variant_id"

    # Tier 2: SKU match
    if target_sku:
        for v in variants:
            if v.get("sku") and v["sku"].strip() == target_sku:
                return v, "sku"

    # Tier 3: Fuzzy title match
    if target_title:
        norm_target = normalize_title(target_title)
        for v in variants:
            norm_v = normalize_title(v.get("title", ""))
            if norm_v and norm_target and (norm_v in norm_target or norm_target in norm_v):
                return v, "title_fuzzy"

    # Tier 4: Single variant fallback
    if len(variants) == 1:
        return variants[0], "single_variant"

    return None, None


# ── Database ───────────────────────────────────────────────────────────────────

def payload_hash_fn(price_cents, shipping_cents, in_stock):
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


def get_offer_ids_for_handle(cur, handle):
    """Get offer_ids for a handle's variants from kit_offers. Returns {variant_id: offer_id}."""
    canonical_pattern = f"%/products/{handle}%"
    cur.execute("""
        SELECT ko.id, ko.external_variant_id, ko.canonical_url
        FROM kit_offers ko
        JOIN retailers r ON r.id = ko.retailer_id
        WHERE r.slug = %s
          AND ko.canonical_url LIKE %s
    """, (RETAILER_SLUG, canonical_pattern))
    result = {}
    for row in cur.fetchall():
        offer_id, variant_id, url = row
        if variant_id:
            result[str(variant_id)] = offer_id
        # Also key by URL for fallback
        result[url] = offer_id
    return result


def get_already_backfilled_handles(cur):
    """Get handles that already have Wayback-sourced events."""
    cur.execute("""
        SELECT DISTINCT ko.canonical_url
        FROM kit_price_events kpe
        JOIN kit_offers ko ON ko.id = kpe.offer_id
        WHERE kpe.source_type = 'scrape'
          AND kpe.raw_payload ->> 'source' = 'wayback'
    """)
    handles = set()
    for (url,) in cur.fetchall():
        match = re.search(r'/products/([^?/]+)', url)
        if match:
            handles.add(match.group(1))
    return handles


def cdx_timestamp_to_datetime(ts):
    """Convert CDX timestamp (YYYYMMDDHHmmss) to datetime."""
    return datetime.strptime(ts[:14].ljust(14, "0"), "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc)


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Backfill historical prices from Wayback Machine")
    parser.add_argument("--handle", help="Backfill single product handle")
    parser.add_argument("--retailer", help="Brand direct retailer slug (e.g., ecoflow-us, renogy)")
    parser.add_argument("--dry-run", action="store_true", help="Fetch + extract but don't write to DB")
    parser.add_argument("--force", action="store_true", help="Re-backfill handles that already have Wayback data")
    parser.add_argument("--tunnel", action="store_true", help="Use local SSH tunnel (port 15433)")
    parser.add_argument("--save-extract", help="Save extracted data to JSON file (skip DB insert)")
    parser.add_argument("--load-extract", help="Load extracted data from JSON file (skip CDX + fetch)")
    args = parser.parse_args()

    global DATABASE_URL, BASE_URL, RETAILER_SLUG
    if args.tunnel:
        DATABASE_URL = _raw_db_url.replace(":5433/", ":15433/")
        print("Using SSH tunnel on port 15433")

    # If --retailer is specified, load brand registry and override globals
    if args.retailer:
        brand_reg = load_brand_registry(args.retailer)
        BASE_URL = brand_reg["base_url"]
        RETAILER_SLUG = brand_reg["retailer_slug"]
        print(f"Retailer: {brand_reg['retailer']} ({BASE_URL})")

    print("=" * 60)
    print(f"OffGridEmpire Wayback Machine Backfill — {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)

    # ── Load from saved extract (skip CDX + fetch) ─────────────────────────
    if args.load_extract:
        print(f"\nLoading extracted data from: {args.load_extract}")
        with open(args.load_extract) as f:
            saved = json.load(f)
        print(f"Loaded {len(saved)} price points")

        # Convert to the format expected by Phase 3
        # We need a minimal entry dict for each record
        extracted = []
        for s in saved:
            extracted.append({
                "handle": s["handle"],
                "timestamp": s["timestamp"],
                "entry": {
                    "kit_slug": s.get("kit_slug"),
                    "proposed_slug": s.get("kit_slug"),
                    "shopify_variant_id": s.get("shopify_variant_id"),
                },
                "price_cents": s["price_cents"],
                "in_stock": s["in_stock"],
                "match_method": s["match_method"],
                "matched_variant_id": s.get("matched_variant_id"),
                "variant_count": s.get("variant_count", 0),
                "og_price_cents": s.get("og_price_cents"),
            })

        # Jump straight to Phase 3
        conn = get_db()
        cur = conn.cursor()
        # (Phase 3 code is below — we'll fall through to it)
        # Skip to DB insert section
        work_queue = []  # not used but referenced in metadata
        _do_insert(cur, conn, extracted, work_queue)
        return

    if args.retailer:
        registry = load_brand_registry(args.retailer)
    else:
        registry = load_registry()
    handle_map = get_unique_handles(registry)

    if args.handle:
        if args.handle not in handle_map:
            print(f"ERROR: handle '{args.handle}' not in registry")
            sys.exit(1)
        handle_map = {args.handle: handle_map[args.handle]}

    print(f"Registry: {len(handle_map)} unique handles to process")

    # Check which are already done (skip DB check for extract-only mode)
    if not args.dry_run and not args.save_extract:
        conn = get_db()
        cur = conn.cursor()

        if not args.force:
            already_done = get_already_backfilled_handles(cur)
            skipped_handles = [h for h in handle_map if h in already_done]
            handle_map = {h: v for h, v in handle_map.items() if h not in already_done}
            if skipped_handles:
                print(f"Skipping {len(skipped_handles)} handles with existing Wayback data (use --force)")
        else:
            print("Force mode: re-backfilling all handles")

        if not handle_map:
            print("Nothing to backfill!")
            conn.close()
            return
    else:
        conn = None
        cur = None

    # ── Phase 1: CDX Discovery ─────────────────────────────────────────────
    print(f"\n--- Phase 1: CDX Discovery ({len(handle_map)} handles) ---\n")

    work_queue = []  # [(handle, timestamp, entries)]
    total_snapshots = 0

    for i, (handle, entries) in enumerate(sorted(handle_map.items())):
        print(f"  [{i+1}/{len(handle_map)}] {handle}...", end=" ", flush=True)

        snapshots = fetch_cdx_snapshots(handle)
        if not snapshots:
            print("no snapshots")
            time.sleep(CDX_DELAY)
            continue

        selected = select_semiannual(snapshots)
        total_snapshots += len(selected)
        dates = [s["timestamp"][:6] for s in selected]
        print(f"{len(snapshots)} archived → {len(selected)} selected ({', '.join(dates)})")

        for snap in selected:
            work_queue.append((handle, snap["timestamp"], entries))

        time.sleep(CDX_DELAY)

    print(f"\nCDX discovery complete: {total_snapshots} snapshots to fetch")

    if not work_queue:
        print("No snapshots found. Wayback Machine may be temporarily unavailable.")
        if conn:
            conn.close()
        return

    # ── Phase 2: Page Fetch + Price Extraction ─────────────────────────────
    print(f"\n--- Phase 2: Fetch & Extract ({len(work_queue)} pages) ---\n")

    extracted = []  # [{handle, timestamp, entry, price_cents, in_stock, match_method, raw}]
    fetch_success = 0
    fetch_fail = 0

    for i, (handle, timestamp, entries) in enumerate(work_queue):
        date_str = f"{timestamp[:4]}-{timestamp[4:6]}-{timestamp[6:8]}"
        print(f"  [{i+1}/{len(work_queue)}] {handle} @ {date_str}...", end=" ", flush=True)

        html = fetch_archived_page(timestamp, handle)
        if not html:
            print("fetch failed")
            fetch_fail += 1
            time.sleep(PAGE_DELAY)
            continue

        variants = extract_variants_from_html(html)
        og_price = extract_og_price(html)

        if not variants and og_price is None:
            print("no price data")
            fetch_fail += 1
            time.sleep(PAGE_DELAY)
            continue

        matches_found = 0
        for entry in entries:
            variant_id = str(entry.get("shopify_variant_id", ""))

            if variants:
                matched_v, method = match_variant(variants, entry)
                if matched_v:
                    extracted.append({
                        "handle": handle,
                        "timestamp": timestamp,
                        "entry": entry,
                        "price_cents": matched_v["price_cents"],
                        "in_stock": matched_v.get("available", True),
                        "match_method": method,
                        "matched_variant_id": matched_v["id"],
                        "variant_count": len(variants),
                        "og_price_cents": og_price,
                    })
                    matches_found += 1
                    continue

            # Fallback to og:price for this entry
            if og_price and len(entries) == 1:
                extracted.append({
                    "handle": handle,
                    "timestamp": timestamp,
                    "entry": entry,
                    "price_cents": og_price,
                    "in_stock": True,
                    "match_method": "og_meta_fallback",
                    "matched_variant_id": None,
                    "variant_count": len(variants) if variants else 0,
                    "og_price_cents": og_price,
                })
                matches_found += 1

        if matches_found:
            print(f"{matches_found} price(s) extracted ({len(variants)} variants on page)")
            fetch_success += 1
        else:
            print(f"no variant match ({len(variants)} variants on page)")
            fetch_fail += 1

        time.sleep(PAGE_DELAY)

    print(f"\nExtraction complete: {len(extracted)} price points from {fetch_success} pages ({fetch_fail} failed)")

    # Save extracted data if requested
    if args.save_extract:
        # Make entries JSON-serializable (remove non-serializable registry entries)
        save_data = []
        for e in extracted:
            save_data.append({
                "handle": e["handle"],
                "timestamp": e["timestamp"],
                "kit_slug": e["entry"].get("kit_slug") or e["entry"].get("proposed_slug"),
                "shopify_variant_id": str(e["entry"].get("shopify_variant_id", "")),
                "price_cents": e["price_cents"],
                "in_stock": e["in_stock"],
                "match_method": e["match_method"],
                "matched_variant_id": e["matched_variant_id"],
                "variant_count": e["variant_count"],
                "og_price_cents": e["og_price_cents"],
            })
        with open(args.save_extract, "w") as f:
            json.dump(save_data, f, indent=2)
        print(f"\nExtracted data saved to: {args.save_extract}")
        print("Run with --load-extract to insert into DB.")
        return

    if not extracted:
        print("No price data extracted.")
        if conn:
            conn.close()
        return

    # ── Dry run summary ────────────────────────────────────────────────────
    if args.dry_run:
        print(f"\n--- Dry Run Results ---\n")
        by_handle = {}
        for e in extracted:
            slug = e["entry"].get("kit_slug") or e["entry"].get("proposed_slug", e["handle"])
            by_handle.setdefault(slug, []).append(e)

        for slug, points in sorted(by_handle.items()):
            print(f"  {slug}:")
            for p in sorted(points, key=lambda x: x["timestamp"]):
                date_str = f"{p['timestamp'][:4]}-{p['timestamp'][4:6]}-{p['timestamp'][6:8]}"
                price_str = f"${p['price_cents'] / 100:.2f}"
                print(f"    {date_str}: {price_str} ({p['match_method']})")
        print(f"\nDry run complete. {len(extracted)} price points would be inserted.")
        return

    # ── Phase 3: DB Insert ─────────────────────────────────────────────────
    _do_insert(cur, conn, extracted, work_queue)


def _do_insert(cur, conn, extracted, work_queue):
    """Insert extracted price points into kit_price_events."""
    print(f"\n--- Phase 3: DB Insert ({len(extracted)} price points) ---\n")

    run_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    handles_processed = list(set(e["handle"] for e in extracted))

    source_name = f"wayback-{RETAILER_SLUG}"
    cur.execute("""
        INSERT INTO ingestion_runs (id, source_name, source_type, scheduled_at, item_count, metadata)
        VALUES (%s, %s, 'scrape', %s, %s, %s)
    """, (run_id, source_name, now, len(extracted), json.dumps({
        "handles": handles_processed,
        "snapshot_count": len(work_queue) if work_queue else 0,
    })))

    offer_cache = {}
    total_inserted = 0
    total_skipped = 0

    for e in extracted:
        handle = e["handle"]
        entry = e["entry"]
        variant_id = str(entry.get("shopify_variant_id", ""))
        slug = entry.get("kit_slug") or entry.get("proposed_slug", handle)

        if handle not in offer_cache:
            offer_cache[handle] = get_offer_ids_for_handle(cur, handle)

        offers = offer_cache[handle]
        offer_id = offers.get(variant_id)

        if not offer_id:
            canonical = f"{BASE_URL}/products/{handle}?variant={variant_id}"
            offer_id = offers.get(canonical)

        if not offer_id:
            total_skipped += 1
            continue

        observed_at = cdx_timestamp_to_datetime(e["timestamp"])
        phash = payload_hash_fn(e["price_cents"], 0, e["in_stock"])

        raw_payload = {
            "source": "wayback",
            "wayback_timestamp": e["timestamp"],
            "match_method": e["match_method"],
            "matched_variant_id": e["matched_variant_id"],
            "variant_count": e["variant_count"],
            "og_price_cents": e["og_price_cents"],
        }

        try:
            cur.execute("SAVEPOINT wb_event")
            cur.execute("""
                INSERT INTO kit_price_events
                    (id, offer_id, observed_at, source_type, source_run_id,
                     price_cents, shipping_cents, in_stock, raw_payload_hash, raw_payload)
                VALUES (%s, %s, %s, 'scrape', %s, %s, 0, %s, %s, %s)
                ON CONFLICT (offer_id, observed_at, raw_payload_hash) DO NOTHING
            """, (
                str(uuid.uuid4()),
                offer_id,
                observed_at,
                run_id,
                e["price_cents"],
                e["in_stock"],
                phash,
                json.dumps(raw_payload),
            ))
            if cur.rowcount > 0:
                total_inserted += 1
            cur.execute("RELEASE SAVEPOINT wb_event")
        except Exception as exc:
            cur.execute("ROLLBACK TO SAVEPOINT wb_event")
            print(f"    DB error for {slug} @ {e['timestamp']}: {exc}")
            total_skipped += 1

    status = "succeeded" if total_skipped == 0 else ("partially_failed" if total_inserted > 0 else "failed")
    cur.execute("""
        UPDATE ingestion_runs
        SET finished_at = %s, status = %s, succeeded_count = %s, failed_count = %s
        WHERE id = %s
    """, (datetime.now(timezone.utc), status, total_inserted, total_skipped, run_id))

    conn.commit()
    cur.close()
    conn.close()

    print(f"\n{'=' * 60}")
    print(f"Backfill complete: {total_inserted} events inserted, {total_skipped} skipped")
    print(f"Run ID: {run_id}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
