/**
 * Auto-draft the weekly digest paragraph from real price-drop data, write it to
 * data/weekly-paragraph.md, and email the owner the draft for review.
 *
 * Run Monday (a day before the Tuesday send) so there's an approval window. The
 * wrapper run-draft.sh commits + pushes the file so the Tuesday cron's git pull
 * picks it up. If the owner edits the file before Tuesday, their edit wins.
 *
 * Env: ANTHROPIC_API_KEY, RESEND_API_KEY, RESEND_FROM_EMAIL, OGE_DIGEST_EMAIL.
 * Falls back to a deterministic template paragraph if ANTHROPIC_API_KEY is absent.
 */
import * as fs from "fs";
import * as path from "path";
import { getTopPriceDrops } from "../src/lib/price-drops";

const OUT = path.join(__dirname, "../data/weekly-paragraph.md");
const RECIPIENT = process.env.OGE_DIGEST_EMAIL || "trisha.penrod@gmail.com";
const FROM = process.env.RESEND_FROM_EMAIL || "OffGridEmpire <alerts@offgridempire.com>";
const MODEL = "claude-haiku-4-5";

const d = (cents: number) => `$${Math.round(cents / 100).toLocaleString()}`;

function dropLines() {
  const drops = getTopPriceDrops({ limit: 8, minDropCents: 2000, windowDays: 7 });
  return drops.map((x) => {
    const k = (x as { kit?: { brand?: string; displayName?: string; name?: string } }).kit;
    const name = `${k?.brand ?? ""} ${k?.displayName ?? k?.name ?? ""}`.trim();
    return `- ${Math.round(x.dropPercent)}% off (${d(x.dropCents)}) ${name} -> now ${d(x.currentPriceCents)}`;
  });
}

function templateParagraph(lines: string[]): string {
  if (lines.length === 0) return "";
  return `This week's biggest verified drops:\n${lines.slice(0, 3).join("\n")}\nAlways confirm the retailer's checkout price before acting.`;
}

async function aiParagraph(lines: string[]): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || lines.length === 0) return templateParagraph(lines);
  const prompt = `You write the one-paragraph intro for OffGridEmpire's weekly off-grid solar price-drop digest.\n\nThis week's top verified drops (real observed price changes):\n${lines.join("\n")}\n\nWrite ONE paragraph, under 80 words. Rules: data-first and factual, cite the standout drop with its real numbers, and explicitly say which drops are genuine deals vs. routine repricing (small % on very expensive systems). No hype adjectives, no emojis, no "unlock/dive in" filler, plain punctuation. Sound like a sharp human analyst, not marketing. Output only the paragraph text.`;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 300, messages: [{ role: "user", content: prompt }] }),
    });
    if (!r.ok) { console.error("anthropic error", r.status, (await r.text()).slice(0, 200)); return templateParagraph(lines); }
    const j = await r.json();
    const text = j?.content?.[0]?.text?.trim();
    return text || templateParagraph(lines);
  } catch (e) {
    console.error("anthropic exception", e); return templateParagraph(lines);
  }
}

async function emailDraft(paragraph: string, lines: string[]) {
  const key = process.env.RESEND_API_KEY;
  const html = `<h2>Weekly drops paragraph — draft for review</h2>
    <p>The Tuesday digest will send this paragraph unless you edit <code>data/weekly-paragraph.md</code> before then.</p>
    <blockquote style="border-left:3px solid #2a7;padding:8px 12px;background:#f6f6f6">${paragraph.replace(/\n/g, "<br>")}</blockquote>
    <p><small>Source drops:</small></p><pre style="font-size:12px">${lines.join("\n")}</pre>`;
  if (!key) { console.log("no RESEND_API_KEY; draft:\n", paragraph); return; }
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [RECIPIENT], subject: "Weekly drops paragraph — review before Tue send", html }),
    });
    console.log("email ->", r.status);
  } catch (e) { console.error("email exception", e); }
}

(async () => {
  const lines = dropLines();
  if (lines.length === 0) { console.log("no drops this week; leaving paragraph unchanged"); return; }
  const paragraph = await aiParagraph(lines);
  fs.writeFileSync(OUT, paragraph.trim() + "\n");
  console.log("wrote", OUT);
  await emailDraft(paragraph, lines);
})();
