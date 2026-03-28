"""
ASIN Discovery for OffGridEmpire.

Finds top-selling Amazon solar/off-grid ASINs using Keepa's bestseller lists,
cross-references against existing registry, and fetches product details for
new candidates. Outputs a ranked candidates file for human review.

Two-phase design to conserve Keepa tokens (1/min on 29€ plan):
  Phase 1: Fetch bestseller lists (~50 tokens/category, returns thousands of ASINs)
  Phase 2: Fetch product details for top N new ASINs (1 token each)

Usage:
  python scripts/discover-asins.py                       # full discovery
  python scripts/discover-asins.py --phase1              # bestseller lists only (saves tokens)
  python scripts/discover-asins.py --phase2              # details for saved candidates
  python scripts/discover-asins.py --top 100             # limit details to top N per category
  python scripts/discover-asins.py --approve             # merge approved candidates into registry
  python scripts/discover-asins.py --status              # show token status + progress
"""

import json
import os
import re
import sys
import time
import argparse
from datetime import datetime, timezone
from pathlib import Path

import requests
from dotenv import load_dotenv

# Load env
env_path = Path.home() / "google-drive" / "0-AI" / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()

KEEPA_API_KEY = os.environ.get("OFFGRID_KEEPA_API_KEY", "")
KEEPA_BASE = "https://api.keepa.com"
REGISTRY_PATH = Path(__file__).resolve().parent / "asin_registry.json"
CANDIDATES_PATH = Path(__file__).resolve().parent / "asin_candidates.json"
BESTSELLERS_CACHE = Path(__file__).resolve().parent / ".bestsellers_cache.json"

# Amazon category IDs for solar/off-grid products (US domain)
CATEGORIES = {
    "solar_panels": {
        "id": 2236628011,
        "name": "Solar Panels",
        "default_kind": "product",
        "default_category": "solar_panel",
    },
    "solar_wind_power": {
        "id": 3180291,
        "name": "Solar & Wind Power",
        "default_kind": "kit",
        "default_category": "solar_panel",
    },
    "power_inverters": {
        "id": 10967601,
        "name": "Power Inverters",
        "default_kind": "product",
        "default_category": "inverter",
    },
    "portable_power_stations": {
        "id": 17819338011,
        "name": "Portable Power Stations",
        "default_kind": "kit",
        "default_category": "battery",
    },
    "charge_controllers": {
        "id": 14329764011,
        "name": "Solar Charge Controllers",
        "default_kind": "product",
        "default_category": "charge_controller",
    },
    "deep_cycle_batteries": {
        "id": 15745581,
        "name": "Deep Cycle Batteries",
        "default_kind": "product",
        "default_category": "battery",
    },
}


def check_tokens() -> tuple[int, int]:
    """Returns (tokens_left, refill_rate)."""
    r = requests.get(f"{KEEPA_BASE}/token", params={"key": KEEPA_API_KEY})
    data = r.json()
    return data.get("tokensLeft", 0), data.get("refillRate", 1)


def wait_for_tokens(needed: int):
    """Wait until we have enough tokens."""
    tokens, rate = check_tokens()
    if tokens >= needed:
        return
    wait_secs = int(((needed - tokens) / max(rate, 1)) * 60) + 10
    print(f"  Waiting {wait_secs}s for {needed} tokens (have {tokens}, rate {rate}/min)...")
    time.sleep(wait_secs)


def load_existing_asins() -> set:
    """Load ASINs already in the registry."""
    with open(REGISTRY_PATH) as f:
        registry = json.load(f)
    asins = set()
    for entry in registry.get("kits", []):
        asins.add(entry["asin"])
    for entry in registry.get("products", []):
        asins.add(entry["asin"])
    return asins


def slugify(title: str, brand: str) -> str:
    """Generate a URL-friendly slug from product title."""
    # Remove brand from start of title if present
    t = title.lower()
    b = brand.lower()
    if t.startswith(b):
        t = t[len(b):].strip(" -,")
    # Remove common suffixes
    for noise in ["for rv", "for home", "for camping", "solar panel", "with", "and"]:
        t = t.replace(noise, " ")
    # Keep only alphanumeric + spaces, collapse
    t = re.sub(r"[^a-z0-9\s]", "", t)
    t = re.sub(r"\s+", "-", t.strip())
    # Prepend brand
    slug = f"{b.replace(' ', '-')}-{t}"
    # Truncate
    return slug[:60].rstrip("-")


def guess_kind(title: str, category_key: str) -> str:
    """Guess if product is a kit or individual product."""
    title_lower = title.lower()
    kit_signals = ["kit", "system", "bundle", "complete", "all-in-one", "combo", "package"]
    if any(s in title_lower for s in kit_signals):
        return "kit"
    return CATEGORIES.get(category_key, {}).get("default_kind", "product")


# ── Phase 1: Fetch Bestseller Lists ─────────────────────────────────────────

def phase1_bestsellers(categories: list[str] | None = None):
    """Fetch bestseller ASIN lists from Keepa. Costs ~50 tokens per category."""
    existing = load_existing_asins()
    target_cats = categories or list(CATEGORIES.keys())

    # Load cache if exists
    cache = {}
    if BESTSELLERS_CACHE.exists():
        with open(BESTSELLERS_CACHE) as f:
            cache = json.load(f)

    print(f"Phase 1: Fetching bestseller lists for {len(target_cats)} categories")
    print(f"Already tracking: {len(existing)} ASINs\n")

    for cat_key in target_cats:
        cat = CATEGORIES[cat_key]

        # Skip if recently cached (within 24h)
        cached = cache.get(cat_key)
        if cached and (time.time() - cached.get("fetched_at", 0)) < 86400:
            print(f"  {cat['name']}: cached ({len(cached['asins'])} ASINs, {cached['new_count']} new)")
            continue

        wait_for_tokens(50)
        print(f"  {cat['name']} (category {cat['id']})...", end=" ", flush=True)

        r = requests.get(f"{KEEPA_BASE}/bestsellers", params={
            "key": KEEPA_API_KEY,
            "domain": "1",
            "category": str(cat["id"]),
        })
        data = r.json()

        if r.status_code != 200 or "bestSellersList" not in data:
            err = data.get("error", {}).get("message", f"HTTP {r.status_code}")
            print(f"ERROR: {err}")
            continue

        asins = data["bestSellersList"].get("asinList", [])
        new_asins = [a for a in asins if a not in existing]
        print(f"{len(asins)} total, {len(new_asins)} new")

        cache[cat_key] = {
            "category_id": cat["id"],
            "name": cat["name"],
            "asins": asins,
            "new_asins": new_asins,
            "new_count": len(new_asins),
            "total_count": len(asins),
            "fetched_at": time.time(),
        }

    # Save cache
    with open(BESTSELLERS_CACHE, "w") as f:
        json.dump(cache, f, indent=2)

    # Summary
    total_new = sum(c.get("new_count", 0) for c in cache.values())
    print(f"\nTotal new ASINs across all categories: {total_new}")
    print(f"Cache saved to {BESTSELLERS_CACHE}")
    return cache


# ── Phase 2: Fetch Product Details ───────────────────────────────────────────

def phase2_details(top_n: int = 50):
    """Fetch product details for top N new ASINs per category. 1 token each."""
    if not BESTSELLERS_CACHE.exists():
        print("ERROR: Run --phase1 first to fetch bestseller lists")
        sys.exit(1)

    with open(BESTSELLERS_CACHE) as f:
        cache = json.load(f)

    # Load existing candidates to skip already-fetched
    existing_candidates = {}
    if CANDIDATES_PATH.exists():
        with open(CANDIDATES_PATH) as f:
            for c in json.load(f):
                existing_candidates[c["asin"]] = c

    existing_asins = load_existing_asins()

    # Collect top N new ASINs per category (by bestseller rank = list position)
    to_fetch = []
    seen = set()
    for cat_key, cat_data in cache.items():
        new_asins = cat_data.get("new_asins", [])[:top_n]
        for rank, asin in enumerate(new_asins):
            if asin in seen or asin in existing_asins:
                continue
            if asin in existing_candidates:
                # Already have details
                seen.add(asin)
                continue
            to_fetch.append({
                "asin": asin,
                "category_key": cat_key,
                "bestseller_rank": rank + 1,
            })
            seen.add(asin)

    print(f"Phase 2: Fetching details for {len(to_fetch)} new ASINs")
    print(f"(Skipping {len(existing_candidates)} already fetched)\n")

    if not to_fetch:
        print("Nothing new to fetch!")
        return

    candidates = list(existing_candidates.values())
    fetched = 0

    for item in to_fetch:
        asin = item["asin"]
        cat_key = item["category_key"]

        # Check tokens
        tokens, rate = check_tokens()
        if tokens < 1:
            wait_secs = int(60 / max(rate, 1)) + 5
            print(f"  [{fetched+1}/{len(to_fetch)}] Waiting {wait_secs}s for token...", flush=True)
            time.sleep(wait_secs)

        print(f"  [{fetched+1}/{len(to_fetch)}] {asin}...", end=" ", flush=True)

        try:
            r = requests.get(f"{KEEPA_BASE}/product", params={
                "key": KEEPA_API_KEY,
                "domain": "1",
                "asin": asin,
            })
            data = r.json()

            if r.status_code != 200 or "products" not in data or not data["products"]:
                print(f"skip (no data)")
                continue

            p = data["products"][0]
            title = p.get("title", "Unknown")
            brand = p.get("brand", "Unknown")

            # Current price from csv[0] (Amazon) or csv[1] (New/3P) — last entry
            price_cents = None
            for csv_idx in [0, 1]:
                csv = p.get("csv", [])
                if len(csv) > csv_idx and csv[csv_idx]:
                    arr = csv[csv_idx]
                    # Last price entry (second-to-last element)
                    if len(arr) >= 2:
                        last_price = arr[-1]
                        if last_price and last_price > 0:
                            price_cents = int(last_price)
                            break

            sales_rank = p.get("salesRanks", {})
            # Get the primary sales rank
            primary_rank = None
            for cat_id, rank_history in sales_rank.items():
                if rank_history and len(rank_history) >= 2:
                    primary_rank = rank_history[-1]  # Last recorded rank
                    break

            candidate = {
                "asin": asin,
                "title": title,
                "brand": brand,
                "category": CATEGORIES[cat_key]["default_category"],
                "categoryKey": cat_key,
                "bestseller_rank_in_category": item["bestseller_rank"],
                "salesRank": primary_rank,
                "priceCents": price_cents,
                "suggestedSlug": slugify(title, brand),
                "suggestedKind": guess_kind(title, cat_key),
                "status": "new",
                "fetchedAt": datetime.now(timezone.utc).isoformat(),
            }
            candidates.append(candidate)
            fetched += 1

            price_str = f"${price_cents/100:.2f}" if price_cents else "N/A"
            print(f"{brand} — {title[:50]}... ({price_str}, rank #{item['bestseller_rank']})")

            # Save incrementally every 10 fetches
            if fetched % 10 == 0:
                _save_candidates(candidates)

        except Exception as e:
            print(f"ERROR: {e}")
            continue

    _save_candidates(candidates)
    print(f"\nFetched {fetched} new candidates. Total: {len(candidates)}")
    print(f"Saved to {CANDIDATES_PATH}")


def _save_candidates(candidates):
    """Save candidates sorted by bestseller rank."""
    # Sort: approved first, then by bestseller rank
    status_order = {"approved": 0, "new": 1, "rejected": 2}
    candidates.sort(key=lambda c: (
        status_order.get(c.get("status", "new"), 1),
        c.get("bestseller_rank_in_category", 9999),
    ))
    with open(CANDIDATES_PATH, "w") as f:
        json.dump(candidates, f, indent=2)


# ── Approve: Merge into Registry ─────────────────────────────────────────────

def approve_candidates():
    """Merge candidates with status='approved' into asin_registry.json."""
    if not CANDIDATES_PATH.exists():
        print("ERROR: No candidates file. Run discovery first.")
        sys.exit(1)

    with open(CANDIDATES_PATH) as f:
        candidates = json.load(f)

    approved = [c for c in candidates if c.get("status") == "approved"]
    if not approved:
        print("No approved candidates. Edit asin_candidates.json and set status to 'approved'.")
        print(f"\nCurrent status counts:")
        from collections import Counter
        counts = Counter(c.get("status", "new") for c in candidates)
        for status, count in counts.items():
            print(f"  {status}: {count}")
        return

    with open(REGISTRY_PATH) as f:
        registry = json.load(f)

    existing_asins = set()
    for entry in registry.get("kits", []):
        existing_asins.add(entry["asin"])
    for entry in registry.get("products", []):
        existing_asins.add(entry["asin"])

    added = 0
    for c in approved:
        if c["asin"] in existing_asins:
            print(f"  Skip {c['asin']} — already in registry")
            continue

        entry = {
            "asin": c["asin"],
            "slug": c["suggestedSlug"],
            "title": c["title"],
            "brand": c.get("brand", "Unknown"),
            "category": c.get("category", "unknown"),
        }

        if c.get("priceCents"):
            entry["estimated_price"] = c["priceCents"] / 100

        kind = c.get("suggestedKind", "product")
        registry.setdefault(kind + "s", []).append(entry)
        existing_asins.add(c["asin"])
        added += 1
        print(f"  Added {c['asin']} ({c['title'][:50]}...) as {kind}")

    with open(REGISTRY_PATH, "w") as f:
        json.dump(registry, f, indent=2)

    print(f"\nAdded {added} ASINs to registry.")
    print(f"Registry now has {len(existing_asins)} total ASINs.")
    print(f"\nNext steps:")
    print(f"  1. python scripts/ingest-amazon.py   # create offer records")
    print(f"  2. python scripts/backfill-keepa.py   # get price history")


# ── Status ────────────────────────────────────────────────────────────────────

def show_status():
    """Show token status and discovery progress."""
    tokens, rate = check_tokens()
    print(f"Keepa tokens: {tokens} (refill: {rate}/min)")

    existing = load_existing_asins()
    print(f"Registry ASINs: {len(existing)}")

    if BESTSELLERS_CACHE.exists():
        with open(BESTSELLERS_CACHE) as f:
            cache = json.load(f)
        print(f"\nBestseller cache:")
        for cat_key, cat_data in cache.items():
            age_hrs = (time.time() - cat_data.get("fetched_at", 0)) / 3600
            print(f"  {cat_data['name']}: {cat_data['total_count']} total, {cat_data['new_count']} new ({age_hrs:.1f}h old)")
    else:
        print("\nNo bestseller cache yet. Run --phase1")

    if CANDIDATES_PATH.exists():
        with open(CANDIDATES_PATH) as f:
            candidates = json.load(f)
        from collections import Counter
        counts = Counter(c.get("status", "new") for c in candidates)
        print(f"\nCandidates: {len(candidates)} total")
        for status, count in counts.items():
            print(f"  {status}: {count}")
    else:
        print("\nNo candidates yet. Run --phase2")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Discover new ASINs for OffGridEmpire")
    parser.add_argument("--phase1", action="store_true", help="Fetch bestseller lists only (~50 tokens/category)")
    parser.add_argument("--phase2", action="store_true", help="Fetch product details for new ASINs (1 token each)")
    parser.add_argument("--top", type=int, default=50, help="Limit details to top N per category (default: 50)")
    parser.add_argument("--category", help="Single category key (e.g., solar_panels)")
    parser.add_argument("--approve", action="store_true", help="Merge approved candidates into registry")
    parser.add_argument("--status", action="store_true", help="Show token status and progress")
    args = parser.parse_args()

    if not KEEPA_API_KEY:
        print("ERROR: OFFGRID_KEEPA_API_KEY must be set in .env")
        sys.exit(1)

    if args.status:
        show_status()
        return

    if args.approve:
        approve_candidates()
        return

    cats = [args.category] if args.category else None

    if args.phase1:
        phase1_bestsellers(cats)
    elif args.phase2:
        phase2_details(args.top)
    else:
        # Full run: phase1 then phase2
        print("=" * 60)
        print(f"OffGridEmpire ASIN Discovery — {datetime.now(timezone.utc).isoformat()}")
        print("=" * 60)
        phase1_bestsellers(cats)
        print()
        phase2_details(args.top)


if __name__ == "__main__":
    main()
