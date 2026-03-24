"""
One-time backfill: fetch product images from Shop Solar Shopify API
and update kits.image_url for all active Shop Solar kits.
"""

import json
import os
import sys
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

import psycopg2
from dotenv import load_dotenv

env_path = Path.home() / "google-drive" / "0-AI" / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()

DATABASE_URL = os.environ.get("OFFGRID_DATABASE_URL", "")
if "--tunnel" in sys.argv:
    DATABASE_URL = DATABASE_URL.replace("@localhost:5433", "@localhost:15433")

BASE_URL = "https://shopsolarkits.com"
USER_AGENT = "OffGridEmpire-Ingestion/1.0"


def fetch_product_image(handle: str) -> str | None:
    """Fetch first product image from Shopify."""
    url = f"{BASE_URL}/products/{handle}.json"
    try:
        req = Request(url, headers={"User-Agent": USER_AGENT})
        with urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
        product = data.get("product", {})
        images = product.get("images", [])
        if images:
            return images[0].get("src")
    except (URLError, HTTPError) as e:
        print(f"  ERROR fetching {handle}: {e}")
    return None


def main():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Get all Shop Solar kits missing image_url, with their source_url to derive handle
    cur.execute("""
        SELECT DISTINCT k.id, ko.source_url
        FROM kits k
        JOIN kit_offers ko ON ko.kit_id = k.id
        JOIN retailers r ON r.id = ko.retailer_id
        WHERE r.slug = 'shop-solar-kits'
          AND (k.image_url IS NULL OR k.image_url = '')
          AND ko.source_url IS NOT NULL
    """)
    rows = cur.fetchall()
    print(f"Found {len(rows)} kits needing images")

    # Extract handles from source URLs and deduplicate by product
    seen_handles = {}
    kit_handles = []
    for kit_id, source_url in rows:
        # source_url like: https://shopsolarkits.com/products/ecoflow-delta-pro?variant=123
        parts = source_url.split("/products/")
        if len(parts) < 2:
            continue
        handle = parts[1].split("?")[0]
        kit_handles.append((kit_id, handle))
        seen_handles[handle] = None  # will fill with image URL

    # Fetch images for each unique handle
    unique_handles = list(seen_handles.keys())
    print(f"Fetching images for {len(unique_handles)} unique products...")
    for i, handle in enumerate(unique_handles):
        img = fetch_product_image(handle)
        seen_handles[handle] = img
        status = "OK" if img else "NO IMAGE"
        print(f"  [{i+1}/{len(unique_handles)}] {handle}: {status}")

    # Update kits
    updated = 0
    for kit_id, handle in kit_handles:
        img = seen_handles.get(handle)
        if img:
            cur.execute("UPDATE kits SET image_url = %s WHERE id = %s AND image_url IS NULL", (img, kit_id))
            updated += cur.rowcount

    conn.commit()
    cur.close()
    conn.close()
    print(f"Updated {updated} kits with image URLs")


if __name__ == "__main__":
    main()
