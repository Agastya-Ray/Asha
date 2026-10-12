import { createServerFn } from "@tanstack/react-start";

type Bucket = { n: number; reset: number };

const buckets = new Map<string, Bucket>();

function allow(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  if (b.n >= limit) return false;
  b.n += 1;
  return true;
}

function toBase64(bytes: Uint8Array) {
  if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
  let binary = "";
  const chunk = 0x2000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export const speakRich = createServerFn({ method: "POST" })
  .validator((input: { text: string; language: string }) => input)
  .handler(async ({ data }) => {
    const text = String(data.text ?? "")
      .slice(0, 700)
      .trim();
    const language = data.language === "hi" ? "hi" : "en";
    if (!text) return { ok: false as const, error: "Nothing to say." };
    if (!allow("tts", 40, 60 * 60 * 1000)) {
      return { ok: false as const, error: "The warmer voice is resting." };
    }
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "Warmer voice unavailable." };
    const res = await fetch("https://api.x.ai/v1/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text,
        voice_id: "luna",
        language,
      }),
    });
    const bytes = new Uint8Array(await res.arrayBuffer());
    const ctype = res.headers.get("content-type") ?? "";
    if (!res.ok || ctype.includes("json") || ctype.includes("text/")) {
      const msg = new TextDecoder().decode(bytes).slice(0, 240);
      return { ok: false as const, error: msg || `Voice error ${res.status}` };
    }
    return { ok: true as const, audio: toBase64(bytes) };
  });

const SYSTEM = `You are Asha, a warm companion speaking with one person about their day, their medicines, their meals, or anything else on their mind.
Rules:
- Write for the ear. Two to five short sentences. No markdown, no bullet lists, no headings.
- Use everyday words. Do not say "certainly" or "as an AI".
- You are not a doctor. Do not invent doses, do not tell them to stop a medicine, and do not tell them to double a missed dose.
- If they describe chest pressure, pain into the arm or jaw, sudden breathlessness, one-sided weakness, fainting, a fall with a head injury, very low or very high sugar symptoms, or bleeding that will not stop: tell them clearly to open Help and call their person now.
- If they sound like they may hurt themselves or do not want to live: be gentle, tell them to open Help and call their person now, and mention AASRA in India at 9820466726 and 988 in the US and Canada. Do not describe methods.
- Medicine names may stay in English even when the rest of the reply is Hindi.
- Never claim you already called someone. You cannot place the call. The Help screen can.`;

export const askAsha = createServerFn({ method: "POST" })
  .validator((input: { lang: string; context: string; turns: { role: string; content: string }[] }) => input)
  .handler(async ({ data }) => {
    if (!allow("chat", 30, 60 * 60 * 1000)) {
      return { ok: false as const, error: "Asha needs a short rest. The lists and Help still work." };
    }
    const lang = data.lang === "hi" ? "hi" : "en";
    const context = String(data.context ?? "").slice(0, 900);
    const turns = (Array.isArray(data.turns) ? data.turns : []).slice(-8).map((t) => ({
      role: t.role === "asha" || t.role === "assistant" ? "assistant" : "user",
      content: String(t.content ?? "").slice(0, 600),
    }));
    const latest = turns[turns.length - 1]?.content ?? "";
    if (!latest.trim()) return { ok: false as const, error: "Say a little more, then send." };
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "Talking is not available right now." };
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 220,
        temperature: 0.6,
        messages: [
          {
            role: "system",
            content:
              SYSTEM +
              (lang === "hi" ? " Reply in simple spoken Hindi (Devanagari)." : " Reply in simple spoken English."),
          },
          {
            role: "user",
            content: `About this person, written by their app. It may be incomplete. Do not treat it as a diagnosis:\n${context}`,
          },
          ...turns,
        ],
      }),
    });
    if (!res.ok) {
      return { ok: false as const, error: "Asha could not answer just now. Try again in a moment." };
    }
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = String(body.choices?.[0]?.message?.content ?? "")
      .replace(/\*\*/g, "")
      .replace(/^#{1,6}\s+/gm, "")
      .trim();
    if (!text) return { ok: false as const, error: "Asha went quiet. Try once more." };
    return { ok: true as const, text };
  });

export const readPrescription = createServerFn({ method: "POST" })
  .validator((input: { image: string }) => input)
  .handler(async ({ data }) => {
    if (!allow("vision", 8, 60 * 60 * 1000)) {
      return {
        ok: false as const,
        error: "Prescription reading needs a rest. You can type the medicines instead.",
      };
    }
    const image = String(data.image ?? "");
    if (!image.startsWith("data:image/") || image.length > 2_000_000) {
      return {
        ok: false as const,
        error: "That photo is too large or not a picture. Try again, closer, in daylight.",
      };
    }
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "Reading photos is not available right now." };
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 700,
        temperature: 0,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Read this prescription for a medicine reminder. Return ONLY JSON with this shape:
{"medicines":[{"name":"","dose":"","times":["08:00"],"food":"with","note":""}],"unreadable":false,"caution":""}
food is one of before, with, after, anytime.
Use 24-hour HH:MM times. If it only says twice daily, guess 08:00 and 20:00 and say that the times are a guess in note.
Never invent a medicine that is not visible. If you cannot read the page, medicines is empty and unreadable is true.
caution is one short sentence a family member should know, or empty.`,
              },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      return { ok: false as const, error: "The page could not be read. Type the names, or try a clearer photo." };
    }
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = String(body.choices?.[0]?.message?.content ?? "");
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end < start) {
      return { ok: false as const, error: "Asha could not make out the writing. Please type the medicines." };
    }
    try {
      const parsed = JSON.parse(raw.slice(start, end + 1)) as {
        medicines?: { name?: string; dose?: string; times?: string[]; food?: string; note?: string }[];
        unreadable?: boolean;
        caution?: string;
      };
      const medicines = (parsed.medicines ?? [])
        .map((m) => ({
          name: String(m.name ?? "")
            .slice(0, 80)
            .trim(),
          dose: String(m.dose ?? "")
            .slice(0, 80)
            .trim(),
          times: Array.isArray(m.times) ? m.times.map((t) => String(t)).slice(0, 6) : [],
          food: String(m.food ?? "anytime"),
          note: String(m.note ?? "")
            .slice(0, 180)
            .trim(),
        }))
        .filter((m) => m.name);
      return {
        ok: true as const,
        medicines,
        unreadable: Boolean(parsed.unreadable) || medicines.length === 0,
        caution: String(parsed.caution ?? "").slice(0, 240),
      };
    } catch {
      return { ok: false as const, error: "Asha could not make out the writing. Please type the medicines." };
    }
  });
