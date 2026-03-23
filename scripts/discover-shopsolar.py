"""
Shop Solar Kits catalog discovery for OffGridEmpire.

Fetches all products from shopsolarkits.com Shopify API, parses specs,
and attempts to match against existing kits in asin_registry.json.
Outputs a proposed shopsolar_registry.json for human review.

Usage:
  python3 scripts/discover-shopsolar.py                # discover + output registry
  python3 scripts/discover-shopsolar.py --collection solar-generators  # single collection
  python3 scripts/discover-shopsolar.py --json         # raw JSON dump of all products
"""

import json
import re
import sys
import argparse
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import urlopen, Request

BASE_URL = "https://shopsolarkits.com"
COLLECTIONS = ["solar-power-systems", "solar-generators"]
REGISTRY_PATH = Path(__file__).resolve().parent / "asin_registry.json"
OUTPUT_PATH = Path(__file__).resolve().parent / "shopsolar_registry.json"


# ── HTML → plain text ────────────────────────────────────────────────────────

class HTMLTextExtractor(HTMLParser):
    """Strip HTML tags, keep text."""
    def __init__(self):
        super().__init__()
        self.parts = []
    def handle_data(self, data):
        self.parts.append(data)
    def get_text(self):
        return " ".join(self.parts)


def html_to_text(html: str) -> str:
    extractor = HTMLTextExtractor()
    extractor.feed(html or "")
    return extractor.get_text()


# ── Spec parsing from body_html ──────────────────────────────────────────────

def parse_specs(body_html: str, title: str, variants: list) -> dict:
    """Extract kit specs from body_html + title + variants."""
    text = html_to_text(body_html)
    specs = {
        "panelW": None,
        "batteryTotalWh": None,
        "batteryUsableWh": None,
        "inverterW": None,
        "voltage": None,
        "chemistry": None,
        "confidence": "low",
    }

    combined = f"{title} {text}"

    # Panel wattage — look for patterns like "400W", "4.4kW", "4,400W" in solar context
    panel_patterns = [
        r"(\d{1,3}(?:,\d{3})*)\s*[Ww]\s*(?:of\s+)?(?:solar|panel)",
        r"(\d+(?:\.\d+)?)\s*kW\s*(?:of\s+)?(?:solar|panel|Complete Solar)",
        r"(\d+)\s*x\s*(\d+)\s*[Ww]\s*(?:panel|solar)",
        r"Solar:\s*(\d{1,3}(?:,\d{3})*)\s*[Ww]",
        r"(\d{1,3}(?:,\d{3})*)\s*[Ww]\s*(?:Off-Grid|Complete|Solar Kit)",
    ]
    for pat in panel_patterns:
        m = re.search(pat, combined, re.IGNORECASE)
        if m:
            groups = m.groups()
            if len(groups) == 2 and groups[1]:
                # NxW pattern
                specs["panelW"] = int(groups[0]) * int(groups[1])
            elif "kW" in pat or "kw" in m.group(0).lower():
                specs["panelW"] = int(float(groups[0]) * 1000)
            else:
                specs["panelW"] = int(groups[0].replace(",", ""))
            break

    # Battery capacity — look for kWh or Wh
    battery_patterns = [
        r"(\d+(?:,\d{3})*)\s*[Ww]h\b",
        r"(\d+(?:\.\d+)?)\s*kWh",
        r"Battery.*?(\d+(?:\.\d+)?)\s*kWh",
        r"(\d+)\s*[Aa]h.*?(\d+(?:\.\d+)?)\s*[Vv]",  # Ah × V = Wh
    ]
    for pat in battery_patterns:
        m = re.search(pat, combined, re.IGNORECASE)
        if m:
            groups = m.groups()
            if "kWh" in pat or "kwh" in m.group(0).lower():
                wh = int(float(groups[0]) * 1000)
            elif len(groups) == 2 and groups[1]:
                # Ah × V
                wh = int(float(groups[0]) * float(groups[1]))
            else:
                wh = int(groups[0].replace(",", ""))
            specs["batteryTotalWh"] = wh
            specs["batteryUsableWh"] = wh  # Assume LiFePO4 ~90% DoD
            break

    # Inverter wattage
    inverter_patterns = [
        r"[Ii]nverter.*?(\d{1,3}(?:,\d{3})*)\s*[Ww]",
        r"(\d{1,3}(?:,\d{3})*)\s*[Ww]\s*[Ii]nverter",
        r"(\d{1,3}(?:,\d{3})*)\s*[Ww]\s*(?:AC|continuous|output)",
        r"AC [Oo]utput:?\s*(\d{1,3}(?:,\d{3})*)\s*[Ww]",
        r"(\d+(?:\.\d+)?)\s*kW\s*[Ii]nverter",
    ]
    for pat in inverter_patterns:
        m = re.search(pat, combined, re.IGNORECASE)
        if m:
            val = m.group(1).replace(",", "")
            if "kW" in pat or "kw" in m.group(0).lower():
                specs["inverterW"] = int(float(val) * 1000)
            else:
                specs["inverterW"] = int(val)
            break

    # System voltage
    voltage_patterns = [
        r"(\d+)\s*[Vv]\s*(?:system|nominal|battery system)",
        r"System\s*(?:Voltage)?:?\s*(\d+)\s*[Vv]",
    ]
    for pat in voltage_patterns:
        m = re.search(pat, combined, re.IGNORECASE)
        if m:
            v = int(m.group(1))
            if v in (12, 24, 48):
                specs["voltage"] = v
                break

    # If no explicit voltage, infer from title or context
    if not specs["voltage"]:
        if "48V" in combined or "48v" in combined:
            specs["voltage"] = 48
        elif "24V" in combined or "24v" in combined:
            specs["voltage"] = 24
        elif "12V" in combined or "12v" in combined:
            specs["voltage"] = 12

    # Chemistry
    chem_lower = combined.lower()
    if "lifepo4" in chem_lower or "lfp" in chem_lower or "lithium iron" in chem_lower:
        specs["chemistry"] = "LiFePO4"
    elif "agm" in chem_lower:
        specs["chemistry"] = "AGM"
    elif "lithium" in chem_lower:
        specs["chemistry"] = "LiFePO4"  # Most modern kits use LFP

    # Confidence scoring
    filled = sum(1 for k in ["panelW", "batteryTotalWh", "inverterW", "voltage"] if specs[k])
    if filled >= 3:
        specs["confidence"] = "high"
    elif filled >= 2:
        specs["confidence"] = "medium"

    return specs


# ── Shopify API fetching ─────────────────────────────────────────────────────

def fetch_collection_products(collection: str) -> list:
    """Fetch all products from a Shopify collection."""
    url = f"{BASE_URL}/collections/{collection}/products.json?limit=250"
    print(f"  Fetching {url}...")
    req = Request(url, headers={"User-Agent": "OffGridEmpire-Discovery/1.0"})
    with urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    products = data.get("products", [])
    print(f"  Got {len(products)} products")
    return products


def fetch_all_products(collections: list[str]) -> list:
    """Fetch products from multiple collections, deduplicate by ID."""
    seen = set()
    all_products = []
    for col in collections:
        products = fetch_collection_products(col)
        for p in products:
            if p["id"] not in seen:
                seen.add(p["id"])
                all_products.append(p)
    return all_products


# ── Matching against existing registry ───────────────────────────────────────

# Known model name patterns for major brands
MODEL_PATTERNS = [
    # EcoFlow models — order matters, most specific first
    # \b or (?=\s|$|[^A-Za-z0-9]) to prevent "DELTA PRO 3600Wh" → "DELTA PRO 3"
    r"(DELTA\s+PRO\s+3\s+ULTRA\s+PLUS)\b",
    r"(DELTA\s+PRO\s+3\s+ULTRA)\b",
    r"(DELTA\s+PRO\s+3)(?=\s*[-\s,;]|\s*$)",  # "DELTA PRO 3" but not "DELTA PRO 3600"
    r"(DELTA\s+PRO\s+ULTRA)\b",
    r"(DELTA\s+PRO)(?!\s*(?:3|ULTRA)\b)",  # "DELTA PRO" but not "DELTA PRO 3" or "DELTA PRO ULTRA"
    r"(DELTA\s+3\s+ULTRA\s+PLUS)\b",
    r"(DELTA\s+3\s+ULTRA)\b",
    r"(DELTA\s+3\s+MAX\s+PLUS)\b",
    r"(DELTA\s+3\s+MAX)\b",
    r"(DELTA\s+3\s+PLUS)\b",
    r"(DELTA\s+3)(?=\s*[-\s,;]|\s*$)",
    r"(DELTA\s+2\s+MAX)\b",
    r"(DELTA\s+2)(?!\s*MAX)(?=\s|$|[^A-Za-z0-9])",
    r"(DELTA\s+MAX)\b",
    r"(DELTA\s+1000)\b",
    r"(DELTA)(?!\s*(?:PRO|MAX|\d|[A-Z]))",
    r"(RIVER\s+3\s+MAX)\b",
    r"(RIVER\s+3\s+PLUS)\b",
    r"(RIVER\s+3)(?=\s*[-\s,;]|\s*$)",
    r"(RIVER\s+2\s+PRO)\b",
    r"(RIVER\s+2\s+MAX)\b",
    r"(RIVER\s+2)(?!\s*(?:PRO|MAX))(?=\s|$|[^A-Za-z0-9])",
    r"(RIVER\s+PRO)\b",
    r"(RIVER)(?!\s*(?:PRO|\d|[A-Z]))",
    r"(OCEAN\s*PRO)",
    # Bluetti models
    r"(AC\s*\d+\w*)",
    r"(APEX\s*\d+)",
    r"(EB\s*\d+)",
    # Anker models
    r"(SOLIX\s*\w+\d+)",
    r"(C\d{3,4}\w*)",
    r"(F\d{3,4}\w*)",
    # Rich Solar
    r"(ALPHA\s*\d+)",
    # Generic model number
    r"([A-Z]{2,}\d{3,}[A-Z]*)",
]


def extract_model_name(title: str, brand: str) -> str | None:
    """Extract the model identifier from a product title."""
    # Remove brand name from title for cleaner matching
    clean = title.replace(brand, "").strip()

    for pat in MODEL_PATTERNS:
        m = re.search(pat, clean, re.IGNORECASE)
        if m:
            model = re.sub(r"\s+", " ", m.group(1).strip().upper())
            return model

    return None


def normalize(s: str) -> str:
    """Normalize string for fuzzy matching."""
    return re.sub(r"[^a-z0-9]", "", s.lower())


def load_existing_kits() -> list:
    """Load kits from asin_registry.json."""
    with open(REGISTRY_PATH) as f:
        registry = json.load(f)
    return registry.get("kits", [])


def find_match(product: dict, variant: dict, specs: dict, existing_kits: list) -> dict | None:
    """Try to match a Shop Solar product+variant to an existing kit.

    Strict matching: requires model name match (e.g., "DELTA PRO", "AC300"),
    not just brand overlap. Battery Wh must match within 10% when both are known.
    """
    vendor = normalize(product.get("vendor", ""))
    title = product.get("title", "")
    title_norm = normalize(title)
    variant_title = variant.get("title", "")

    # Extract model identifiers from Shop Solar product
    # e.g., "DELTA PRO", "AC300", "River 2 Pro", "DELTA 2 Max"
    ss_model = extract_model_name(title, vendor)

    for kit in existing_kits:
        kit_brand = normalize(kit.get("brand", ""))
        kit_title = kit.get("title", "")
        kit_title_norm = normalize(kit_title)

        # Brand must match
        if kit_brand not in vendor and vendor not in kit_brand:
            continue

        # Model name must match (strict)
        kit_model = extract_model_name(kit_title, kit.get("brand", ""))
        if not ss_model or not kit_model:
            continue
        if normalize(ss_model) != normalize(kit_model):
            continue

        # Battery Wh cross-check: if both have Wh in title, they must be close
        ss_wh = specs.get("batteryTotalWh")
        kit_wh_match = re.search(r"(\d+)\s*[Ww]h", kit_title)
        if ss_wh and kit_wh_match:
            kit_wh = int(kit_wh_match.group(1))
            # Must be within 15%
            if abs(ss_wh - kit_wh) / max(ss_wh, kit_wh, 1) > 0.15:
                continue
            confidence = "high"
        elif ss_wh and kit_wh_match:
            confidence = "low"
        else:
            confidence = "medium"

        return {
            "kit_slug": kit["slug"],
            "kit_asin": kit.get("asin"),
            "match_confidence": confidence,
            "overlap_tokens": [ss_model, kit_model],
        }

    return None


# ── Main ─────────────────────────────────────────────────────────────────────

def generate_slug(vendor: str, title: str, variant_title: str, specs: dict) -> str:
    """Generate a slug for a new kit."""
    parts = []
    # Brand
    brand = re.sub(r"[^a-z0-9]", "-", vendor.lower()).strip("-")
    if brand:
        parts.append(brand)

    # Key spec from title
    watt_match = re.search(r"(\d+(?:\.\d+)?)\s*kW", title)
    if watt_match:
        parts.append(f"{watt_match.group(1)}kw")
    elif specs.get("panelW"):
        parts.append(f"{specs['panelW']}w")

    # Product line from title (e.g., "CORE PLUS", "DELTA PRO")
    line_match = re.search(r"\[([\w\s]+)\]", title)
    if line_match:
        line = re.sub(r"\s+", "-", line_match.group(1).lower().strip())
        parts.append(line)
    else:
        # Try first significant words
        words = re.findall(r"[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?", title)
        if words:
            parts.append(re.sub(r"\s+", "-", words[0].lower()))

    # Variant differentiator
    if variant_title and variant_title.lower() != "default title":
        vslug = re.sub(r"[^a-z0-9]", "-", variant_title.lower()).strip("-")
        vslug = re.sub(r"-+", "-", vslug)[:40]
        parts.append(vslug)

    slug = "-".join(parts)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug[:80]


def main():
    parser = argparse.ArgumentParser(description="Discover Shop Solar Kits catalog")
    parser.add_argument("--collection", type=str, help="Fetch single collection only")
    parser.add_argument("--json", action="store_true", help="Dump raw product JSON")
    parser.add_argument("--output", type=str, default=str(OUTPUT_PATH), help="Output registry path")
    args = parser.parse_args()

    collections = [args.collection] if args.collection else COLLECTIONS

    print("=" * 60)
    print("Shop Solar Kits — Catalog Discovery")
    print("=" * 60)

    # Fetch products
    products = fetch_all_products(collections)
    print(f"\nTotal unique products: {len(products)}")

    if args.json:
        json.dump(products, sys.stdout, indent=2)
        return

    # Load existing kits for matching
    existing_kits = load_existing_kits()
    print(f"Existing kits in registry: {len(existing_kits)}")

    # Process each product + variant
    mappings = []
    new_kits = []
    stats = {"total_variants": 0, "matched": 0, "new": 0, "skipped": 0}

    for product in products:
        handle = product["handle"]
        vendor = product.get("vendor", "Unknown")
        title = product.get("title", "")
        body_html = product.get("body_html", "")
        product_type = product.get("product_type", "")
        shopify_product_id = str(product["id"])

        variants = product.get("variants", [])
        if not variants:
            continue

        for variant in variants:
            stats["total_variants"] += 1
            variant_id = str(variant["id"])
            variant_title = variant.get("title", "Default Title")
            price_str = variant.get("price", "0")
            compare_at = variant.get("compare_at_price")
            available = variant.get("available", True)
            sku = variant.get("sku", "")

            price_cents = int(float(price_str) * 100)

            # Skip variants with no price or very low price (likely error)
            if price_cents < 5000:  # < $50
                stats["skipped"] += 1
                continue

            # Parse specs (use product-level body_html + variant info)
            variant_spec_text = f"{variant_title} {title}"
            specs = parse_specs(body_html, variant_spec_text, variants)

            # Try to match against existing kit
            match = find_match(product, variant, specs, existing_kits)

            entry_base = {
                "shopify_handle": handle,
                "shopify_product_id": shopify_product_id,
                "shopify_variant_id": variant_id,
                "variant_title": variant_title,
                "vendor": vendor,
                "product_type": product_type,
                "price_cents": price_cents,
                "compare_at_price_cents": int(float(compare_at) * 100) if compare_at else None,
                "available": available,
                "sku": sku,
            }

            if match:
                stats["matched"] += 1
                mappings.append({
                    **entry_base,
                    "kit_slug": match["kit_slug"],
                    "kit_asin": match["kit_asin"],
                    "match_confidence": match["match_confidence"],
                    "overlap_tokens": match["overlap_tokens"],
                    "status": "proposed",
                    "notes": f"Auto-matched to {match['kit_slug']} ({match['match_confidence']} confidence)",
                })
            else:
                stats["new"] += 1
                proposed_slug = generate_slug(vendor, title, variant_title, specs)
                new_kits.append({
                    **entry_base,
                    "proposed_slug": proposed_slug,
                    "proposed_title": f"{vendor} {title}" + (f" - {variant_title}" if variant_title != "Default Title" else ""),
                    "specs": {k: v for k, v in specs.items() if k != "confidence"},
                    "spec_confidence": specs["confidence"],
                    "status": "draft",
                })

    # Build registry
    registry = {
        "retailer": "Shop Solar Kits",
        "retailer_slug": "shop-solar-kits",
        "base_url": BASE_URL,
        "collections": collections,
        "discovery_stats": stats,
        "mappings": mappings,
        "new_kits": new_kits,
    }

    output_path = Path(args.output)
    with open(output_path, "w") as f:
        json.dump(registry, f, indent=2)

    print(f"\n{'=' * 60}")
    print(f"Discovery complete!")
    print(f"  Total variants scanned: {stats['total_variants']}")
    print(f"  Matched to existing kits: {stats['matched']}")
    print(f"  New kit candidates: {stats['new']}")
    print(f"  Skipped (low price): {stats['skipped']}")
    print(f"\nRegistry written to: {output_path}")
    print(f"Review and set status to 'approved' for items you want to ingest.")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
