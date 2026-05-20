#!/usr/bin/env python3
"""
Reddit opportunity-finder for OffGridEmpire.

Surfaces relevant threads in solar/off-grid subreddits and emails a daily digest
with a pre-drafted, genuinely-helpful reply for each — so the owner can submit
manually. It NEVER posts to Reddit (auto-posting promo gets you banned).

Auth: read-only OAuth (application-only / client_credentials). Reddit blocks
unauthenticated .json from datacenter IPs, so a registered "script" app is
required. If creds are missing/blocked, it emails a one-time setup notice.

Env (from /opt/offgridempire/.env):
  REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET   (create at reddit.com/prefs/apps -> "script")
  REDDIT_USER_AGENT                         (e.g. "oge-finder/1.0 by u/yourname")
  RESEND_API_KEY, RESEND_FROM_EMAIL
  OGE_DIGEST_EMAIL                          (recipient; default below)
"""
import os, sys, json, time, html
from datetime import datetime, timezone

try:
    import requests
except ImportError:
    print("requests not installed", file=sys.stderr); sys.exit(1)

SUBREDDITS = ["SolarDIY", "solar", "SolarPower", "offgrid", "OffGridLiving"]
# Each query is run per subreddit (restrict_sr). Keep intent commercial/decision.
QUERIES = [
    "solar kit worth it", "what's included kit", "kit missing panels",
    "ecoflow vs", "anker solix", "bluetti kit", "best off grid kit",
    "cost per watt", "is this a good deal solar",
]
RECIPIENT = os.environ.get("OGE_DIGEST_EMAIL", "trisha.penrod@gmail.com")
FROM = os.environ.get("RESEND_FROM_EMAIL", "OffGridEmpire <alerts@offgridempire.com>")
SEEN_FILE = os.environ.get("REDDIT_SEEN_FILE", "/opt/offgridempire/reddit-seen.json")
MAX_AGE_HOURS = 36          # only surface fresh threads worth replying to
SITE = "https://offgridempire.com"


def load_seen():
    try:
        with open(SEEN_FILE) as f:
            return set(json.load(f))
    except Exception:
        return set()


def save_seen(seen):
    try:
        with open(SEEN_FILE, "w") as f:
            json.dump(sorted(seen), f)
    except Exception as e:
        print(f"warn: could not write seen file: {e}", file=sys.stderr)


def get_token():
    cid = os.environ.get("REDDIT_CLIENT_ID")
    secret = os.environ.get("REDDIT_CLIENT_SECRET")
    ua = os.environ.get("REDDIT_USER_AGENT", "oge-finder/1.0")
    if not cid or not secret:
        return None, ua
    try:
        r = requests.post(
            "https://www.reddit.com/api/v1/access_token",
            auth=(cid, secret),
            data={"grant_type": "client_credentials"},
            headers={"User-Agent": ua}, timeout=20,
        )
        if r.status_code == 200:
            return r.json().get("access_token"), ua
        print(f"token error {r.status_code}: {r.text[:200]}", file=sys.stderr)
    except Exception as e:
        print(f"token exception: {e}", file=sys.stderr)
    return None, ua


def search(token, ua, sub, query):
    url = f"https://oauth.reddit.com/r/{sub}/search"
    params = {"q": query, "restrict_sr": 1, "sort": "new", "t": "week", "limit": 25}
    try:
        r = requests.get(url, params=params,
                         headers={"Authorization": f"Bearer {token}", "User-Agent": ua},
                         timeout=20)
        if r.status_code != 200:
            print(f"search {sub}/{query} -> {r.status_code}", file=sys.stderr)
            return []
        return [c["data"] for c in r.json().get("data", {}).get("children", [])]
    except Exception as e:
        print(f"search exception {sub}/{query}: {e}", file=sys.stderr)
        return []


def draft_reply(post):
    """A genuinely helpful, non-spammy reply template. Owner edits before posting."""
    title = (post.get("title") or "").lower()
    body = (post.get("selftext") or "").lower()
    text = title + " " + body
    brand = next((b for b in ["ecoflow", "anker", "bluetti", "sol-ark", "renogy", "jackery"] if b in text), None)
    lead = ("One thing worth checking before you buy: a lot of advertised \"kits\" quote a price "
            "that doesn't include the panels, battery, or charger, so the real build cost is higher "
            "than the sticker.")
    if brand:
        lead = (f"With {brand.title()} specifically, the bundle configs vary a lot in what's actually "
                "included — worth confirming whether the price covers panels + battery or just the unit.")
    soft = ("I've been decomposing kits into their bill of materials to compare real cost/W — happy to "
            "share what I found for this one if useful. (Full disclosure: it's a tool I run.)")
    return f"{lead} {soft}"


def fmt_digest(rows):
    parts = ["<h2>OffGridEmpire — Reddit opportunities</h2>",
             f"<p>{len(rows)} fresh thread(s) worth a manual reply. Drafts below — edit before posting; never paste verbatim.</p>"]
    for r in rows:
        p = r["post"]
        link = f"https://reddit.com{p.get('permalink','')}"
        parts.append(
            f"<div style='margin:16px 0;padding:12px;border-left:3px solid #2a7'>"
            f"<a href='{html.escape(link)}'><b>{html.escape(p.get('title',''))}</b></a><br>"
            f"<small>r/{html.escape(p.get('subreddit',''))} · matched: {html.escape(r['query'])} · "
            f"{p.get('num_comments',0)} comments</small>"
            f"<p style='background:#f6f6f6;padding:8px;margin-top:8px'><i>Draft reply:</i><br>{html.escape(r['draft'])}</p>"
            f"</div>")
    parts.append(f"<p><small>Posting tips: reply where you can genuinely help, disclose the tool, "
                 f"link a specific page (e.g. {SITE}/this-week/). Space posts out; don't blast.</small></p>")
    return "".join(parts)


def send_email(subject, body_html):
    key = os.environ.get("RESEND_API_KEY")
    if not key:
        print("no RESEND_API_KEY; printing instead:\n", body_html[:500]); return
    try:
        r = requests.post("https://api.resend.com/emails",
                          headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                          json={"from": FROM, "to": [RECIPIENT], "subject": subject, "html": body_html},
                          timeout=20)
        print(f"email -> {r.status_code}")
    except Exception as e:
        print(f"email exception: {e}", file=sys.stderr)


def main():
    token, ua = get_token()
    if not token:
        send_email("OGE Reddit finder needs setup",
                   "<p>The Reddit opportunity-finder couldn't authenticate. Create a <b>script</b> app at "
                   "<a href='https://www.reddit.com/prefs/apps'>reddit.com/prefs/apps</a>, then add "
                   "<code>REDDIT_CLIENT_ID</code>, <code>REDDIT_CLIENT_SECRET</code>, and "
                   "<code>REDDIT_USER_AGENT</code> to <code>/opt/offgridempire/.env</code>.</p>")
        return
    seen = load_seen()
    now = datetime.now(timezone.utc).timestamp()
    rows, new_ids = [], set()
    for sub in SUBREDDITS:
        for q in QUERIES:
            for p in search(token, ua, sub, q):
                pid = p.get("name") or p.get("id")
                if not pid or pid in seen or pid in new_ids:
                    continue
                age_h = (now - p.get("created_utc", now)) / 3600
                if age_h > MAX_AGE_HOURS:
                    continue
                new_ids.add(pid)
                rows.append({"post": p, "query": q, "draft": draft_reply(p)})
            time.sleep(1)  # be polite
    if rows:
        rows.sort(key=lambda r: r["post"].get("num_comments", 0), reverse=True)
        send_email(f"OGE Reddit opportunities — {len(rows)} new thread(s)", fmt_digest(rows))
    else:
        print("no new opportunities")
    save_seen(seen | new_ids)


if __name__ == "__main__":
    main()
