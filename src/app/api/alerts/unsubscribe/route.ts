import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse(renderPage("Missing token", false), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return new NextResponse(renderPage("System error", false), {
      status: 503,
      headers: { "Content-Type": "text/html" },
    });
  }

  const supabase = createClient(supabaseUrl, anonKey);

  const { data, error } = await supabase
    .from("price_alert_subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("unsubscribe_token", token)
    .is("unsubscribed_at", null)
    .select("email")
    .single();

  if (error || !data) {
    return new NextResponse(
      renderPage("Link expired or already unsubscribed", false),
      { status: 404, headers: { "Content-Type": "text/html" } }
    );
  }

  return new NextResponse(renderPage("You've been unsubscribed", true), {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}

function renderPage(message: string, success: boolean) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${message} — OffGridEmpire</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0a0f1a; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { text-align: center; max-width: 400px; padding: 2rem; }
    h1 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    p { color: #94a3b8; font-size: 0.875rem; }
    a { color: #f97316; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${success ? "✓" : "✗"} ${message}</h1>
    <p>${success ? "You won't receive any more price drop alerts for this kit." : "This unsubscribe link may have already been used."}</p>
    <p><a href="/">← Back to OffGridEmpire</a></p>
  </div>
</body>
</html>`;
}
