// POST /api/tts  { text, lang }  ->  { ok, audio (base64 mp3), provider }
// Tries the warm cloud voices in order. If all fail, the app speaks with the phone's own voice (free, offline).
//   1. xAI voice        (XAI_API_KEY)            paid per character
//   2. Google Cloud TTS (GOOGLE_TTS_API_KEY)     1M Chirp-HD + 4M WaveNet characters free every month
import { asLang, guard, json, preflight, readBody, toBase64, type Lang } from "./_shared";

export function OPTIONS() {
  return preflight();
}

export async function POST(request: Request) {
  const blocked = guard(request, "tts", 60);
  if (blocked) return blocked;
  const body = await readBody<{ text?: string; lang?: string }>(request, 4000);
  const text = String(body?.text ?? "").slice(0, 700).trim();
  const lang = asLang(body?.lang);
  if (!text) return json({ ok: false, error: "Nothing to say." }, 400);

  const xai = await tryXai(text, lang);
  if (xai) return json({ ok: true, audio: xai, provider: "xai" });
  const google = await tryGoogle(text, lang);
  if (google) return json({ ok: true, audio: google, provider: "google" });
  return json({ ok: false, error: "No warm voice right now. The phone voice will speak." }, 503);
}

async function tryXai(text: string, lang: Lang) {
  const key = process.env.XAI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.x.ai/v1/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ text, voice_id: process.env.XAI_VOICE || "luna", language: lang }),
    });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || type.includes("json") || type.startsWith("text/")) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    return bytes.length > 100 ? toBase64(bytes) : null;
  } catch {
    return null;
  }
}

async function tryGoogle(text: string, lang: Lang) {
  const key = process.env.GOOGLE_TTS_API_KEY;
  if (!key) return null;
  const code = lang === "hi" ? "hi-IN" : "en-IN";
  // Warmest first (Chirp 3 HD), then WaveNet. Both female, Indian accent.
  const voices = [
    process.env.GOOGLE_TTS_VOICE_HI && lang === "hi" ? process.env.GOOGLE_TTS_VOICE_HI : "",
    process.env.GOOGLE_TTS_VOICE_EN && lang === "en" ? process.env.GOOGLE_TTS_VOICE_EN : "",
    `${code}-Chirp3-HD-Aoede`,
    `${code}-Wavenet-A`,
  ].filter(Boolean);
  for (const name of voices) {
    try {
      const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: code, name },
          audioConfig: { audioEncoding: "MP3", speakingRate: name.includes("Chirp") ? 1 : 0.92 },
        }),
      });
      if (!res.ok) continue;
      const out = (await res.json()) as { audioContent?: string };
      if (out.audioContent) return out.audioContent;
    } catch {
      /* next voice */
    }
  }
  return null;
}
