"""
Discover products on brand direct Shopify stores and match to existing OGE kits.

Fetches the Shopify product catalog for a brand's website, matches products
against the ASIN registry by brand + title keywords, and generates a registry
JSON for ingestion.

Usage:
  python3 scripts/discover-brand-products.py --brand ecoflow-us       # single brand
  python3 scripts/discover-brand-products.py --all                    # all brands
  python3 scripts/discover-brand-products.py --brand ecoflow-us --write  # write registry file
"""

import json
import re
import argparse
import time
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

SCRIPTS_DIR = Path(__file__).resolve().parent
REGISTRY_DIR = SCRIPTS_DIR / "brand_registries"
ASIN_REGISTRY = SCRIPTS_DIR / "asin_registry.json"
SHOPSOLAR_REGISTRY = SCRIPTS_DIR / "shopsolar_registry.json"

USER_AGENT = "OffGridEmpire-Discovery/1.0"

# Brand configurations
BRANDS = {
    "ecoflow-us": {
        "retailer": "EcoFlow US",
        "retailer_slug": "ecoflow-us",
        "base_url": "https://us.ecoflow.com",
        "brand_match": "EcoFlow",
        "collections": ["solar-generators", "portable-power-stations", "all"],
    },
    "bluetti": {
        "retailer": "Bluetti",
        "retailer_slug": "bluetti",
        "base_url": "https://www.bluettipower.com",
        "brand_match": "Bluetti",
        "collections": ["power-stations", "solar-generators", "all"],
    },
    "jackery": {
        "retailer": "Jackery",
        "retailer_slug": "jackery",
        "base_url": "https://www.jackery.com",
        "brand_match": "Jackery",
        "collections": ["solar-generators", "all"],
    },
    "goalzero": {
        "retailer": "Goal Zero",
        "retailer_slug": "goalzero",
        "base_url": "https://www.goalzero.com",
        "brand_match": "Goal Zero",
        "collections": ["all-products", "power-stations", "all"],
    },
    "renogy": {
        "retailer": "Renogy",
        "retailer_slug": "renogy",
        "base_url": "https://www.renogy.com",
        "brand_match": "Renogy",
        "collections": ["solar-panel-kits", "all"],
    },
    "bougerv": {
        "retailer": "BougeRV",
        "retailer_slug": "bougerv",
        "base_url": "https://www.bougerv.com",
        "brand_match": "BougeRV",
        "collections": ["solar-kits", "all"],
    },
    "outbound-power": {
        "retailer": "Outbound Power",
        "retailer_slug": "outbound-power",
        "base_url": "https://outboundpower.com",
        "brand_match": "Outbound Power",
        "collections": ["all"],
    },
}


def fetch_collection(base_url, collection, page=1):
    """Fetch products from a Shopify collection."""
    url = f"{base_url}/collections/{collection}/products.json?limit=250&page={page}"
    req = Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
        return data.get("products", [])
    except (URLError, HTTPError) as e:
        return []


def fetch_all_products(base_url, collections):
    """Fetch all products from a brand's Shopify store."""
    seen_ids = set()
    all_products = []

    for collection in collections:
        page = 1
        while True:
            products = fetch_collection(base_url, collection, page)
            if not products:
                break
            for p in products:
                if p["id"] not in seen_ids:
                    seen_ids.add(p["id"])
                    all_products.append(p)
            if len(products) < 250:
                break
            page += 1
            time.sleep(0.5)
        time.sleep(0.5)

    return all_products


def load_oge_kits():
    """Load existing OGE kits from ASIN registry + Shop Solar registry."""
    kits = []

    with open(ASIN_REGISTRY) as f:
        asin_reg = json.load(f)
    for k in asin_reg.get("kits", []):
        kits.append({
            "slug": k["slug"],
            "title": k["title"],
            "brand": k.get("brand", ""),
            "asin": k["asin"],
        })

    return kits


def normalize(text):
    """Normalize text for matching."""
    return re.sub(r'[^a-z0-9]+', ' ', text.lower()).strip()


def extract_model_name(title):
    """Extract core model identifiers from a product title (e.g., 'deltapro', 'delta2max', 'explorer1000v2')."""
    norm = normalize(title)
    # Multi-word model names, longest first to avoid partial matches
    model_patterns = [
        r'delta\s*pro\s*3',
        r'delta\s*pro',
        r'delta\s*2\s*max',
        r'delta\s*2',
        r'delta\s*3\s*max',
        r'delta\s*3',
        r'delta\s*mini',
        r'river\s*2\s*pro',
        r'river\s*2\s*max',
        r'river\s*2',
        r'river\s*3\s*plus',
        r'river\s*3',
        r'river\s*pro',
        r'explorer\s*\d+\s*(?:v2|plus|pro)?',
        r'ac\s*300',
        r'ac\s*200',
        r'ac\s*500',
        r'b\s*300\s*k',
        r'yeti\s*\d+x?',
        r'\d+w\s*(?:mono|starter|premium|rv|cabin|complete)',
    ]
    found = []
    for pat in model_patterns:
        m = re.search(pat, norm)
        if m:
            found.append(re.sub(r'\s+', '', m.group()))
    return found


def match_product_to_kits(product, kits, brand_match):
    """Try to match a Shopify product to existing OGE kits by model name."""
    brand_kits = [k for k in kits if k["brand"].lower() == brand_match.lower()]
    if not brand_kits:
        return []

    product_title = product.get("title", "")
    product_models = extract_model_name(product_title)

    if not product_models:
        return []

    matches = []
    for kit in brand_kits:
        kit_models = extract_model_name(kit["title"])
        if not kit_models:
            continue

        # Check if any model name overlaps
        overlap = set(product_models) & set(kit_models)
        if overlap:
            matches.append({
                "kit": kit,
                "overlap": sorted(overlap),
                "score": len(overlap) + (1 if product_models[0] == kit_models[0] else 0),
            })

    matches.sort(key=lambda m: m["score"], reverse=True)
    return matches


def discover_brand(brand_key, write=False):
    """Discover and match products for a brand."""
    if brand_key not in BRANDS:
        print(f"ERROR: Unknown brand '{brand_key}'. Available: {', '.join(BRANDS.keys())}")
        return

    config = BRANDS[brand_key]
    print(f"\n{'=' * 60}")
    print(f"Discovering: {config['retailer']} ({config['base_url']})")
    print(f"{'=' * 60}\n")

    # Fetch products
    print("Fetching Shopify catalog...")
    products = fetch_all_products(config["base_url"], config["collections"])
    print(f"Found {len(products)} products\n")

    if not products:
        print("No products found. The site may block API access or use different collection names.")
        return

    # Load OGE kits
    kits = load_oge_kits()

    # Match products
    registry = {
        "retailer": config["retailer"],
        "retailer_slug": config["retailer_slug"],
        "base_url": config["base_url"],
        "discovery_stats": {
            "total_products": len(products),
            "total_variants": sum(len(p.get("variants", [])) for p in products),
            "matched": 0,
            "unmatched": 0,
        },
        "mappings": [],
        "unmatched_products": [],
    }

    # Filter keywords — skip accessories, bags, cables, parts
    skip_keywords = [
        'bag', 'cable', 'adapter', 'hub', 'trolley', 'stand', 'bracket',
        'mount', 'cover', 'case', 'charger', 'converter', 'tip', 'plug',
        'ev ', 'wave', 'glacier', 'blade', 'foldable handtruck', 'monitor',
        'extra battery', 'smart extra', 'double voltage', 'transfer switch',
        'power pulse', 'alternator', 'refurbished', 'special offer',
        'flash sale', 'app only', 'subscriber only', 'livestream',
        'recommended accessory', 'web exclusive',
    ]

    for product in products:
        handle = product.get("handle", "")
        title = product.get("title", "")
        variants = product.get("variants", [])

        # Skip accessories and non-kit products
        title_lower = title.lower()
        if any(kw in title_lower for kw in skip_keywords):
            registry["unmatched_products"].append({
                "handle": handle, "title": title,
                "variant_count": len(variants), "skip_reason": "accessory/promo",
                "price_range": f"${min(float(v.get('price', 0)) for v in variants):.0f}-${max(float(v.get('price', 0)) for v in variants):.0f}" if variants else "N/A",
            })
            registry["discovery_stats"]["unmatched"] += 1
            continue

        matches = match_product_to_kits(product, kits, config["brand_match"])

        if matches:
            best = matches[0]
            kit = best["kit"]

            for variant in variants:
                price_str = variant.get("price", "0")
                try:
                    price_cents = int(float(price_str) * 100)
                except ValueError:
                    price_cents = 0

                mapping = {
                    "shopify_handle": handle,
                    "shopify_product_id": str(product["id"]),
                    "shopify_variant_id": str(variant["id"]),
                    "variant_title": variant.get("title", "Default Title"),
                    "price_cents": price_cents,
                    "available": variant.get("available", True),
                    "sku": variant.get("sku", ""),
                    "kit_slug": kit["slug"],
                    "kit_asin": kit.get("asin", ""),
                    "match_confidence": "high" if best["score"] >= 3 else "medium",
                    "overlap_tokens": best["overlap"],
                    "status": "pending",
                }
                registry["mappings"].append(mapping)

            registry["discovery_stats"]["matched"] += 1
            print(f"  MATCH: {title}")
            print(f"         → {kit['slug']} (score={best['score']}, tokens={best['overlap']})")
        else:
            registry["unmatched_products"].append({
                "handle": handle,
                "title": title,
                "variant_count": len(variants),
                "price_range": f"${min(float(v.get('price', 0)) for v in variants):.0f}-${max(float(v.get('price', 0)) for v in variants):.0f}" if variants else "N/A",
            })
            registry["discovery_stats"]["unmatched"] += 1

    print(f"\n--- Results ---")
    print(f"Matched: {registry['discovery_stats']['matched']} products → {len(registry['mappings'])} variant mappings")
    print(f"Unmatched: {registry['discovery_stats']['unmatched']} products")

    if registry["unmatched_products"]:
        print(f"\nUnmatched products (potential new kits):")
        for up in registry["unmatched_products"][:20]:
            print(f"  {up['handle']} — {up['title']} ({up['variant_count']} variants, {up['price_range']})")
        if len(registry["unmatched_products"]) > 20:
            print(f"  ... and {len(registry['unmatched_products']) - 20} more")

    if write:
        out_path = REGISTRY_DIR / f"{brand_key}.json"
        with open(out_path, "w") as f:
            json.dump(registry, f, indent=2)
        print(f"\nRegistry written to: {out_path}")
    else:
        print(f"\nDry run. Use --write to save registry to {REGISTRY_DIR / f'{brand_key}.json'}")

    return registry


def main():
    parser = argparse.ArgumentParser(description="Discover brand direct Shopify products for OGE")
    parser.add_argument("--brand", help="Brand key to discover (e.g., ecoflow-us)")
    parser.add_argument("--all", action="store_true", help="Discover all brands")
    parser.add_argument("--write", action="store_true", help="Write registry JSON files")
    parser.add_argument("--list", action="store_true", help="List available brand keys")
    args = parser.parse_args()

    if args.list:
        print("Available brands:")
        for key, config in BRANDS.items():
            print(f"  {key:20s}  {config['retailer']:20s}  {config['base_url']}")
        return

    if args.all:
        for brand_key in BRANDS:
            discover_brand(brand_key, write=args.write)
            time.sleep(2)
    elif args.brand:
        discover_brand(args.brand, write=args.write)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
