#!/usr/bin/env python3
"""
Price drop alert checker.
Runs after export-data.ts in the pipeline.
Detects price drops > 5%, emails subscribers via Resend.
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

SCRIPT_DIR = Path(__file__).parent
KITS_JSON = SCRIPT_DIR / "../src/lib/data/kits.json"
SNAPSHOT_FILE = SCRIPT_DIR / ".price_snapshot.json"

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SITE_URL = "https://offgridempire.com"
FROM_EMAIL = os.environ.get("RESEND_FROM_EMAIL", "OffGridEmpire <onboarding@resend.dev>")
DROP_THRESHOLD = 0.05  # 5%
DAILY_SEND_LIMIT = 95  # Leave buffer under Resend's 100/day


def load_kits() -> dict[str, dict]:
    """Load current kits.json, return {slug: {name, brand, listedPrice}}."""
    with open(KITS_JSON) as f:
        kits = json.load(f)
    return {
        k["slug"]: {
            "name": k.get("name", ""),
            "brand": k.get("brand", ""),
            "price": k.get("listedPrice", 0),
        }
        for k in kits
        if k.get("listedPrice")
    }


def load_snapshot() -> dict[str, int]:
    """Load previous price snapshot {slug: price_cents}."""
    if not SNAPSHOT_FILE.exists():
        return {}
    with open(SNAPSHOT_FILE) as f:
        return json.load(f)


def save_snapshot(kits: dict[str, dict]):
    """Save current prices as snapshot for next run."""
    snapshot = {slug: int(k["price"] * 100) for slug, k in kits.items()}
    with open(SNAPSHOT_FILE, "w") as f:
        json.dump(snapshot, f)


def detect_drops(kits: dict[str, dict], prev: dict[str, int]) -> list[dict]:
    """Find kits with price drops > threshold."""
    drops = []
    for slug, kit in kits.items():
        new_cents = int(kit["price"] * 100)
        old_cents = prev.get(slug)
        if not old_cents or old_cents <= 0:
            continue
        pct = (old_cents - new_cents) / old_cents
        if pct >= DROP_THRESHOLD:
            drops.append({
                "slug": slug,
                "name": f"{kit['brand']} {kit['name']}",
                "old_cents": old_cents,
                "new_cents": new_cents,
                "pct": pct,
            })
    # Sort by largest drop first (prioritize for daily limit)
    drops.sort(key=lambda d: d["pct"], reverse=True)
    return drops


def get_subscribers(kit_slug: str) -> list[dict]:
    """Query Supabase for active subscribers for a kit."""
    url = f"{SUPABASE_URL}/rest/v1/price_alert_subscribers"
    resp = requests.get(
        url,
        params={
            "kit_slug": f"eq.{kit_slug}",
            "unsubscribed_at": "is.null",
            "select": "id,email,unsubscribe_token",
        },
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        },
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def send_email(to: str, kit: dict, unsub_token: str) -> bool:
    """Send price drop email via Resend."""
    old_price = f"${kit['old_cents'] / 100:,.0f}"
    new_price = f"${kit['new_cents'] / 100:,.0f}"
    savings_pct = f"{kit['pct'] * 100:.0f}"
    kit_url = f"{SITE_URL}/kits/{kit['slug']}/"
    unsub_url = f"{SITE_URL}/api/alerts/unsubscribe?token={unsub_token}"

    html = f"""
    <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; background: #0a0f1a; color: #e2e8f0; padding: 24px; border-radius: 8px;">
      <h2 style="color: #f97316; margin: 0 0 16px;">Price Drop Alert</h2>
      <p style="margin: 0 0 8px; font-size: 18px; font-weight: 600;">{kit['name']}</p>
      <p style="margin: 0 0 16px;">
        <span style="color: #94a3b8; text-decoration: line-through;">{old_price}</span>
        <span style="color: #22c55e; font-size: 24px; font-weight: 700; margin-left: 8px;">{new_price}</span>
        <span style="color: #22c55e; font-size: 14px; margin-left: 4px;">(-{savings_pct}%)</span>
      </p>
      <a href="{kit_url}" style="display: inline-block; background: #f97316; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">View Kit</a>
      <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
      <p style="font-size: 12px; color: #64748b; margin: 0;">
        You received this because you subscribed to price alerts on OffGridEmpire.<br/>
        <a href="{unsub_url}" style="color: #64748b;">Unsubscribe</a>
      </p>
    </div>
    """

    resp = requests.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "from": FROM_EMAIL,
            "to": [to],
            "subject": f"Price drop: {kit['name']} is now {new_price} (was {old_price})",
            "html": html,
            "headers": {
                "List-Unsubscribe": f"<{unsub_url}>",
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
        },
        timeout=10,
    )

    if resp.status_code in (200, 201):
        return True
    print(f"  Resend error ({resp.status_code}): {resp.text}", file=sys.stderr)
    return False


def log_sent(subscriber_id: str, kit_slug: str, old_cents: int, new_cents: int):
    """Log notification to Supabase."""
    url = f"{SUPABASE_URL}/rest/v1/price_alert_sent"
    requests.post(
        url,
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "subscriber_id": subscriber_id,
            "kit_slug": kit_slug,
            "old_price_cents": old_cents,
            "new_price_cents": new_cents,
        },
        timeout=10,
    )


def main():
    if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY]):
        print("Alert check skipped: missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or RESEND_API_KEY")
        return

    if not KITS_JSON.exists():
        print("Alert check skipped: kits.json not found")
        return

    kits = load_kits()
    prev = load_snapshot()

    # Always save snapshot for next run
    save_snapshot(kits)

    if not prev:
        print(f"Alert check: first run, saved snapshot of {len(kits)} kits. No comparison yet.")
        return

    drops = detect_drops(kits, prev)
    if not drops:
        print("Alert check: no price drops > 5% detected.")
        return

    print(f"Alert check: {len(drops)} kit(s) with price drops > 5%:")
    total_sent = 0

    for kit in drops:
        if total_sent >= DAILY_SEND_LIMIT:
            print(f"  Daily send limit ({DAILY_SEND_LIMIT}) reached. Remaining drops skipped.")
            break

        print(f"  {kit['name']}: ${kit['old_cents']/100:.0f} → ${kit['new_cents']/100:.0f} (-{kit['pct']*100:.0f}%)")
        subscribers = get_subscribers(kit["slug"])
        if not subscribers:
            print(f"    No subscribers for this kit.")
            continue

        for sub in subscribers:
            if total_sent >= DAILY_SEND_LIMIT:
                break
            if send_email(sub["email"], kit, sub["unsubscribe_token"]):
                log_sent(sub["id"], kit["slug"], kit["old_cents"], kit["new_cents"])
                total_sent += 1

        print(f"    Sent to {min(len(subscribers), DAILY_SEND_LIMIT - total_sent + len(subscribers))} subscriber(s).")

    print(f"Alert check complete. {total_sent} email(s) sent.")


if __name__ == "__main__":
    main()
