-- affiliate_clicks — durable, queryable affiliate-click ledger.
-- REVIEW ONLY — not yet applied. Apply to the offgrid Supabase project
-- (ref ybutlmccdqxmdrbnneek) once the click-tracking wiring lands. Mirrors the
-- existing fire-and-forget, INSERT-only-for-anon pattern used by
-- calc_submissions / calc_funnel_events. Lets the opportunity engine answer
-- "which kit/cohort/content drives monetized clicks" without a warehouse.
-- See growth-system/inputs/monetization-plan.md §3b.

create table if not exists affiliate_clicks (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  session_id   text,                  -- reuse calc-recording.ts localStorage session id
  kit_slug     text not null,
  retailer     text not null,
  price_cents  integer,
  surface      text,                  -- kit_page | retailer_table | bom_missing_part | article_embed | best_for | compare | sticky_bar
  content_slug text,                  -- article/use-case that drove it (nullable)
  cohort       text,                  -- systemType|completenessBand|priceBucket
  referrer     text,                  -- first-touch attribution from calc-recording.ts
  utm          jsonb                  -- {source,medium,campaign} if present
);

alter table affiliate_clicks enable row level security;

-- anon may INSERT only (browser writes, never reads) — same as the calc tables.
create policy "anon insert affiliate_clicks"
  on affiliate_clicks for insert to anon with check (true);
revoke select on affiliate_clicks from anon;

create index if not exists affiliate_clicks_created_at_idx on affiliate_clicks (created_at);
create index if not exists affiliate_clicks_kit_slug_idx   on affiliate_clicks (kit_slug);
create index if not exists affiliate_clicks_surface_idx    on affiliate_clicks (surface);
create index if not exists affiliate_clicks_content_idx    on affiliate_clicks (content_slug) where content_slug is not null;
