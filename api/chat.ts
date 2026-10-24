// POST /api/chat  { show, say, context, turns }  ->  { ok, show, say }
// "show" = language written on screen, "say" = language Asha speaks. They can differ
// (e.g. she speaks Hindi while the screen shows English).
import { asLang, chatText, guard, json, preflight, readBody } from "./_shared.js";

export function OPTIONS() {
  return preflight();
}

const SYSTEM = `You are Asha, a warm companion speaking with one person, often an older adult, about their day, their medicines, their meals, or anything else on their mind.
Rules:
- Write for the ear. Two to five short sentences. No markdown, no lists, no headings, no emoji.
- Use everyday words. Do not say "certainly" or "as an AI". Be kind, unhurried, a little playful when it fits.
- You are not a doctor. Do not invent doses, do not tell them to stop a medicine, and do not tell them to double a missed dose.
- If they describe chest pressure, pain into the arm or jaw, sudden breathlessness, one-sided weakness or a drooping face, fainting, a fall with a head injury, very low or very high sugar symptoms, or bleeding that will not stop: tell them clearly to press the red Help button now.
- If they sound like they may hurt themselves or do not want to live: be gentle, tell them to press Help and call their person now, and mention Tele-MANAS 14416 (free, India, 24 hours) or 988 in the US and Canada. Do not describe methods.
- Medicine names may stay in English in any language.
- Never claim you already called someone. The Help button can.`;

const NAMES = { en: "simple spoken English", hi: "simple spoken Hindi written in Devanagari" } as const;

type Body = { show?: string; say?: string; context?: string; turns?: { role?: string; content?: string }[] };

export async function POST(request: Request) {
  const blocked = guard(request, "chat", 40);
  if (blocked) return blocked;
  const body = await readBody<Body>(request, 20000);
  if (!body) return json({ ok: false, error: "bad request" }, 400);
  const show = asLang(body.show);
  const say = asLang(body.say);
  const context = String(body.context ?? "").slice(0, 1200);
  const turns = (Array.isArray(body.turns) ? body.turns : []).slice(-10).map((t) => ({
    role: (t.role === "asha" || t.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
    content: String(t.content ?? "").slice(0, 800),
  }));
  if (!turns.length || !turns[turns.length - 1].content.trim()) {
    return json({ ok: false, error: "empty" }, 400);
  }

  const format =
    show === say
      ? `Reply in ${NAMES[say]}. Return ONLY JSON: {"say":"<your reply>"}`
      : `Return ONLY JSON: {"say":"<your reply in ${NAMES[say]}>","show":"<the same reply in ${NAMES[show]}>"}. The person may write or speak in either language.`;

  const out = await chatText(
    [
      { role: "system", content: `${SYSTEM}\n${format}` },
      {
        role: "user",
        content: `About this person, written by their app. It may be incomplete. Do not treat it as a diagnosis:\n${context}`,
      },
      { role: "assistant", content: show === say ? '{"say":"I have read it."}' : '{"say":"ok","show":"ok"}' },
      ...turns,
    ],
    400,
    0.6,
  );
  if (!out) return json({ ok: false, error: "unavailable" }, 503);

  const parsed = parseReply(out.text);
  const sayText = clean(parsed.say);
  const showText = clean(parsed.show ?? parsed.say);
  if (!sayText) return json({ ok: false, error: "empty reply" }, 502);
  return json({ ok: true, say: sayText, show: showText || sayText, provider: out.provider });
}

function parseReply(raw: string): { say: string; show?: string } {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const j = JSON.parse(raw.slice(start, end + 1)) as { say?: unknown; show?: unknown };
      if (typeof j.say === "string") return { say: j.say, show: typeof j.show === "string" ? j.show : undefined };
    } catch {
      /* fall through */
    }
  }
  return { say: raw };
}

function clean(s: string) {
  return String(s ?? "")
    .replace(/\*\*/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .trim()
    .slice(0, 1200);
}
