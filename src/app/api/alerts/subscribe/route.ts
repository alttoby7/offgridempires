import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      { error: "Alert system not configured" },
      { status: 503 }
    );
  }

  let body: { email?: string; kitSlug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const kitSlug = body.kitSlug?.trim();

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (!kitSlug) {
    return NextResponse.json({ error: "Missing kit slug" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, anonKey);

  // Upsert: re-subscribe if previously unsubscribed
  const { error } = await supabase.from("price_alert_subscribers").upsert(
    {
      email,
      kit_slug: kitSlug,
      unsubscribed_at: null,
    },
    { onConflict: "email,kit_slug" }
  );

  if (error) {
    console.error("Alert subscribe error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
