// POST /api/tts  { text, lang, who?, voice?, owner? }  ->  { ok, audio (base64 mp3), provider }
// Asha (who absent): tries the warm cloud voices in order. If all fail, the app speaks with the phone's own voice (free, offline).
// Titli (who: "fairy"): her own childlike ElevenLabs voice (ELEVENLABS_API_KEY), the one picked in Settings or
// ELEVENLABS_VOICE_FAIRY. Never a grown-up voice: if it fails, the app uses her phone voice.
//   1. xAI voice        (XAI_API_KEY)            paid per character
//   2. Google Cloud TTS (GOOGLE_TTS_API_KEY)     1M Chirp-HD + 4M WaveNet characters free every month
import { asLang, guard, json, preflight, readBody, toBase64, type Lang } from "./_shared.js";
import { elevenSpeak } from "./_eleven.js";

export function OPTIONS() {
  return preflight();
}

// GET /api/tts?voice=<id>&owner=<id>&lang=en&text=... : Titli only, for hearing a voice from a browser link
export async function GET(request: Request) {
  const blocked = guard(request, "tts", 60);
  if (blocked) return blocked;
  const q = new URL(request.url).searchParams;
  const text = String(q.get("text") ?? "").slice(0, 300).trim();
  if (!text) return json({ ok: false, error: "Nothing to say." }, 400);
  const fairy = await elevenSpeak(text, q.get("voice"), q.get("owner"));
  if (!fairy) return json({ ok: false, error: "Titli's voice is resting." }, 503);
  if (q.get("play") === "1")
    return new Response(Buffer.from(fairy, "base64"), { headers: { "content-type": "audio/mpeg", "access-control-allow-origin": "*" } });
  return json({ ok: true, audio: fairy, provider: "elevenlabs" });
}

export async function POST(request: Request) {
  const blocked = guard(request, "tts", 60);
  if (blocked) return blocked;
  const body = await readBody<{ text?: string; lang?: string; who?: string; voice?: string; owner?: string }>(request, 4000);
  const text = String(body?.text ?? "").slice(0, 700).trim();
  const lang = asLang(body?.lang);
  if (!text) return json({ ok: false, error: "Nothing to say." }, 400);

  if (body?.who === "fairy") {
    const fairy = await elevenSpeak(text, body.voice, body.owner);
    if (fairy) return json({ ok: true, audio: fairy, provider: "elevenlabs" });
    return json({ ok: false, error: "Titli's voice is resting. The phone voice will speak." }, 503);
  }

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
