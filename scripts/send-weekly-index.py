#!/usr/bin/env python3
"""
Weekly index sender. Runs Tuesday morning via cron, after snapshot-weekly.ts.

Reads the most recent public/data/weekly-archive/YYYY-MM-DD.json snapshot.
Queries Supabase for active subscribers (kit_slug = '__weekly_drops__' OR any kit).
Sends one email per unique address via Resend.

Skips entirely if the snapshot has zero drops or no human paragraph.
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

SCRIPT_DIR = Path(__file__).parent
ARCHIVE_DIR = SCRIPT_DIR / "../public/data/weekly-archive"

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SITE_URL = "https://offgridempire.com"
FROM_EMAIL = os.environ.get("RESEND_FROM_EMAIL", "OffGridEmpire <alerts@offgridempire.com>")
DAILY_LIMIT = 95
WEEKLY_DROPS_SENTINEL = "__weekly_drops__"


def latest_snapshot() -> dict | None:
    """Find and load the most recent snapshot file."""
    if not ARCHIVE_DIR.exists():
        return None
    files = sorted([f for f in ARCHIVE_DIR.glob("????-??-??.json")])
    if not files:
        return None
    with open(files[-1]) as f:
        return json.load(f)


def get_all_subscribers() -> list[dict]:
    """All active subscribers across kit_slug values, deduped by email."""
    url = f"{SUPABASE_URL}/rest/v1/price_alert_subscribers"
    resp = requests.get(
        url,
        params={
            "unsubscribed_at": "is.null",
            "select": "email,unsubscribe_token,kit_slug",
        },
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        },
        timeout=10,
    )
    resp.raise_for_status()
    rows = resp.json()
    seen: dict[str, dict] = {}
    for r in rows:
        email = r["email"].lower().strip()
        if email not in seen:
            seen[email] = r
    return list(seen.values())


def render_html(snapshot: dict, unsub_token: str) -> str:
    today = snapshot["date"]
    paragraph = snapshot.get("paragraph", "").strip()
    drops = snapshot.get("drops", [])
    unsub_url = f"{SITE_URL}/api/alerts/unsubscribe?token={unsub_token}"

    paragraph_html = ""
    if paragraph:
        paragraph_html = (
            "<div style=\"font-size:16px;line-height:1.7;margin:0 0 32px;color:#3a3a3a;\">"
            f"{paragraph}"
            "</div>"
        )

    rows_html: list[str] = []
    for d in drops[:10]:
        rows_html.append(
            f"""<tr>
<td style="padding:14px 0;border-bottom:1px solid #e8e2d5;vertical-align:top;">
  <div style="font-size:11px;color:#8a8275;font-family:system-ui,sans-serif;letter-spacing:0.5px;">#{d['rank']} &middot; {d['retailer']} &middot; observed {d['observedDate']}</div>
  <div style="font-size:16px;font-weight:500;color:#1a1a1a;margin:4px 0 4px;">
    <a href="{d['url']}" style="color:#1a1a1a;text-decoration:none;">{d['brand']} {d['name']}</a>
  </div>
  <div style="font-size:13px;color:#5a5a5a;font-family:system-ui,sans-serif;">{d['gapInsight']}</div>
</td>
<td style="padding:14px 0 14px 16px;border-bottom:1px solid #e8e2d5;vertical-align:top;text-align:right;white-space:nowrap;font-family:system-ui,sans-serif;">
  <div style="font-size:18px;font-weight:600;color:#1a1a1a;">${d['currentPriceCents']/100:,.0f}</div>
  <div style="font-size:12px;color:#8a8275;text-decoration:line-through;">${d['previousPriceCents']/100:,.0f}</div>
  <div style="font-size:12px;color:#a06a2a;font-weight:600;">−${d['dropCents']/100:,.0f} ({d['dropPercent']:.0f}%)</div>
</td>
</tr>"""
        )

    rows_str = "\n".join(rows_html)

    return f"""<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#faf7f2;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;">
  <div style="max-width:640px;margin:0 auto;padding:40px 24px;">
    <p style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#8a8275;margin:0 0 16px;font-family:system-ui,sans-serif;">
      OffGridEmpire Weekly &middot; {today}
    </p>
    <h1 style="font-size:28px;font-weight:500;line-height:1.25;margin:0 0 24px;color:#1a1a1a;">
      This week&rsquo;s biggest off-grid solar kit price drops.
    </h1>
    {paragraph_html}
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
      {rows_str}
    </table>
    <p style="margin:32px 0 0;">
      <a href="{SITE_URL}/this-week/" style="display:inline-block;background:#1a1a1a;color:#faf7f2;padding:12px 24px;border-radius:2px;text-decoration:none;font-size:14px;font-weight:600;font-family:system-ui,sans-serif;">
        See the live page &rarr;
      </a>
    </p>
    <hr style="border:none;border-top:1px solid #e8e2d5;margin:40px 0 16px;" />
    <p style="font-size:11px;line-height:1.6;color:#8a8275;margin:0;font-family:system-ui,sans-serif;">
      You subscribed at offgridempire.com to receive the weekly drops index. We send one email per week.<br/>
      <a href="{unsub_url}" style="color:#8a8275;">Unsubscribe</a>
      &middot; <a href="{SITE_URL}/this-week/archive/{today}/" style="color:#8a8275;">View this issue online</a>
    </p>
  </div>
</body>
</html>"""


def send_one(to: str, snapshot: dict, unsub_token: str) -> bool:
    html = render_html(snapshot, unsub_token)
    today = snapshot["date"]
    drop_count = len(snapshot.get("drops", []))
    subject = f"OffGridEmpire Weekly: {drop_count} kit price drops ({today})"
    unsub_url = f"{SITE_URL}/api/alerts/unsubscribe?token={unsub_token}"

    resp = requests.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "from": FROM_EMAIL,
            "to": [to],
            "subject": subject,
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


def main():
    if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY]):
        print("Weekly send skipped: missing creds")
        return

    snapshot = latest_snapshot()
    if not snapshot:
        print("Weekly send skipped: no snapshot file found")
        return

    if not snapshot.get("drops"):
        print("Weekly send skipped: snapshot has zero drops")
        return

    paragraph = snapshot.get("paragraph", "").strip()
    if not paragraph or paragraph.startswith("["):
        print("Weekly send skipped: paragraph is empty or still the placeholder — edit data/weekly-paragraph.md and re-run snapshot-weekly.ts")
        return

    subscribers = get_all_subscribers()
    if not subscribers:
        print("Weekly send: no active subscribers")
        return

    print(f"Weekly send: {len(subscribers)} subscribers, snapshot {snapshot['date']}")
    sent = 0
    for sub in subscribers:
        if sent >= DAILY_LIMIT:
            print(f"  Daily limit ({DAILY_LIMIT}) reached")
            break
        if send_one(sub["email"], snapshot, sub["unsubscribe_token"]):
            sent += 1
    print(f"Weekly send complete: {sent} emails sent")


if __name__ == "__main__":
    main()
