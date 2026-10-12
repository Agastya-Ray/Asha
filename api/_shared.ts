// Shared helpers for the Asha API (Vercel Functions).
// Files starting with "_" are not turned into endpoints by Vercel.

export const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-asha-key, x-asha-device",
  "Access-Control-Max-Age": "86400",
};

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...CORS },
  });
}

export function preflight() {
  return new Response(null, { status: 204, headers: CORS });
}

type Bucket = { n: number; reset: number };
const buckets = new Map<string, Bucket>();

/** Counts requests per device AND per IP. Memory lives per server instance, so it is a soft guard, not a bill cap. */
function allow(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (now > b.reset) buckets.delete(k);
  }
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  if (b.n >= limit) return false;
  b.n += 1;
  return true;
}

/**
 * Returns an error Response when the call must be refused, or null when it may go on.
 * - ASHA_APP_KEY (optional env): when set, the app must send the same value in x-asha-key.
 * - Per-device and per-IP hourly limits, so one person cannot use up everyone's voice.
 */
export function guard(request: Request, name: string, perHour: number): Response | null {
  const required = process.env.ASHA_APP_KEY;
  if (required && request.headers.get("x-asha-key") !== required) {
    return json({ ok: false, error: "This copy of Asha is not allowed to use the service." }, 401);
  }
  const device = (request.headers.get("x-asha-device") ?? "").slice(0, 64) || "unknown";
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown";
  const hour = 60 * 60 * 1000;
  if (!allow(`${name}|d|${device}`, perHour, hour) || !allow(`${name}|ip|${ip}`, perHour * 3, hour)) {
    return json({ ok: false, error: "rate", retry: true }, 429);
  }
  return null;
}

export async function readBody<T>(request: Request, maxBytes: number): Promise<T | null> {
  try {
    const raw = await request.text();
    if (raw.length > maxBytes) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export type Lang = "en" | "hi";
export const asLang = (v: unknown): Lang => (v === "hi" ? "hi" : "en");

export function toBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64");
}

export const XAI_MODEL = () => process.env.XAI_MODEL || "grok-4.5";
export const GEMINI_MODEL = () => process.env.GEMINI_MODEL || "gemini-2.5-flash";

type Msg = { role: "system" | "user" | "assistant"; content: string };

/** Text chat with fallback: xAI first, then Google Gemini (has a free tier). Returns null if every provider failed. */
export async function chatText(messages: Msg[], maxTokens: number, temperature: number): Promise<{ text: string; provider: string } | null> {
  const xai = process.env.XAI_API_KEY;
  if (xai) {
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${xai}` },
        body: JSON.stringify({ model: XAI_MODEL(), max_tokens: maxTokens, temperature, messages }),
      });
      if (res.ok) {
        const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const text = String(body.choices?.[0]?.message?.content ?? "").trim();
        if (text) return { text, provider: "xai" };
      }
    } catch {
      /* try the next provider */
    }
  }
  const gem = process.env.GEMINI_API_KEY;
  if (gem) {
    try {
      const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
      const contents = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL()}:generateContent?key=${encodeURIComponent(gem)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: system ? { parts: [{ text: system }] } : undefined,
            contents,
            generationConfig: { maxOutputTokens: maxTokens, temperature },
          }),
        },
      );
      if (res.ok) {
        const text = geminiText(await res.json());
        if (text) return { text, provider: "gemini" };
      }
    } catch {
      /* give up */
    }
  }
  return null;
}

/** Image + prompt with fallback: xAI vision, then Gemini vision. */
export async function visionText(prompt: string, dataUrl: string): Promise<string | null> {
  const xai = process.env.XAI_API_KEY;
  if (xai) {
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${xai}` },
        body: JSON.stringify({
          model: XAI_MODEL(),
          max_tokens: 900,
          temperature: 0,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            },
          ],
        }),
      });
      if (res.ok) {
        const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const text = String(body.choices?.[0]?.message?.content ?? "");
        if (text.trim()) return text;
      }
    } catch {
      /* next */
    }
  }
  const gem = process.env.GEMINI_API_KEY;
  if (gem) {
    try {
      const m = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/);
      if (!m) return null;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL()}:generateContent?key=${encodeURIComponent(gem)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }, { inline_data: { mime_type: m[1], data: m[2] } }] }],
            generationConfig: { maxOutputTokens: 900, temperature: 0 },
          }),
        },
      );
      if (res.ok) return geminiText(await res.json()) || null;
    } catch {
      /* give up */
    }
  }
  return null;
}

function geminiText(body: unknown) {
  const b = body as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return (b.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();
}
