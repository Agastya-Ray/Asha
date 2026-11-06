// POST /api/chat  { show, say, context, fairy?, turns }  ->  { ok, show, say, mood }
// Titli (the fairy) answers, with the face she makes while saying it.
// "show" = language written on screen, "say" = language Asha speaks. They can differ
// (e.g. she speaks Hindi while the screen shows English).
import { asLang, chatText, guard, json, preflight, readBody } from "./_shared.js";
import { parseTitli, titliContextNote, titliSystem } from "./_titli.js";

export function OPTIONS() {
  return preflight();
}

type Body = { show?: string; say?: string; context?: string; fairy?: string; turns?: { role?: string; content?: string }[] };

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

  // Titli answers. What the app knows about the person goes in the system prompt, so turns stay user/assistant/user.
  const out = await chatText(
    [{ role: "system", content: `${titliSystem(show, say, String(body.fairy ?? "").slice(0, 24))}\n\n${titliContextNote(context)}` }, ...turns],
    400,
    0.7,
  );
  if (!out) return json({ ok: false, error: "unavailable" }, 503);

  const parsed = parseTitli(out.text);
  const sayText = parsed.say;
  const showText = parsed.show ?? parsed.say;
  if (!sayText) return json({ ok: false, error: "empty reply" }, 502);
  return json({ ok: true, say: sayText, show: showText || sayText, mood: parsed.mood, provider: out.provider });
}
