import { createClient } from "@supabase/supabase-js";

// Public, browser-safe values (the URL + the PUBLISHABLE anon key, protected by
// RLS = anon-INSERT-only on the tracking tables). Baked as env-overridable
// defaults because NEXT_PUBLIC_* is inlined at build time and the CI build has no
// .env.local — without these the browser client is null and all client-side
// recording (affiliate_clicks, calc_submissions, calc_funnel_events) silently
// no-ops in production. This regression started at the CF Pages → Workers move
// (last Supabase row 2026-04-05).
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ybutlmccdqxmdrbnneek.supabase.co";
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_oCbBaKg3S2gKU8pXuGVAEA_YaI9sR8d";

export const supabase = url && key ? createClient(url, key) : null;
