// ElevenLabs: Titli's own voice (ELEVENLABS_API_KEY). Files starting with "_" are not endpoints.
import { toBase64 } from "./_shared.js";

const API = "https://api.elevenlabs.io";
export const elevenKey = () => process.env.ELEVENLABS_API_KEY ?? "";
const okId = (v: unknown) => (typeof v === "string" && /^[A-Za-z0-9]{8,40}$/.test(v) ? v : "");

/**
 * Says `text` in the chosen ElevenLabs voice, slowly and warmly. A voice from the shared library has to be
 * added to the account once before it can speak; when ElevenLabs says it isn't there, we add it and try again.
 */
export async function elevenSpeak(text: string, voice: unknown, owner: unknown): Promise<string | null> {
  const key = elevenKey();
  const id = okId(voice) || okId(process.env.ELEVENLABS_VOICE_FAIRY);
  if (!key || !id) return null;
  const say = () =>
    fetch(`${API}/v1/text-to-speech/${id}?output_format=mp3_44100_64`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "xi-api-key": key },
      body: JSON.stringify({
        text,
        model_id: process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2",
        // a little slower than normal, expressive, and still clearly the same girl every time
        voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.55, use_speaker_boost: true, speed: 0.85 },
      }),
    });
  try {
    let res = await say();
    if (!res.ok && okId(owner) && (res.status === 400 || res.status === 404)) {
      const added = await fetch(`${API}/v1/voices/add/${okId(owner)}/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "xi-api-key": key },
        body: JSON.stringify({ new_name: `Titli ${id.slice(0, 6)}` }),
      });
      if (added.ok) res = await say();
    }
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.includes("audio")) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    return bytes.length > 100 ? toBase64(bytes) : null;
  } catch {
    return null;
  }
}

export type VoiceChoice = { id: string; owner: string; name: string; about: string; accent: string; preview: string };

let cached: { at: number; list: VoiceChoice[] } | null = null;

/** Young, sweet, girlish voices from the ElevenLabs library, for "Choose Titli's voice". */
export async function elevenChoices(): Promise<VoiceChoice[]> {
  const key = elevenKey();
  if (!key) return [];
  if (cached && Date.now() - cached.at < 6 * 60 * 60 * 1000) return cached.list;
  const seen = new Set<string>();
  const list: VoiceChoice[] = [];
  for (const search of ["child girl", "little girl", "cute girl", "fairy", "young girl sweet"]) {
    try {
      const q = new URLSearchParams({ search, gender: "female", page_size: "12", sort: "trending" });
      const res = await fetch(`${API}/v1/shared-voices?${q}`, { headers: { "xi-api-key": key } });
      if (!res.ok) continue;
      const body = (await res.json()) as {
        voices?: { voice_id: string; public_owner_id: string; name: string; description?: string; accent?: string; age?: string; preview_url?: string }[];
      };
      for (const v of body.voices ?? []) {
        if (seen.has(v.voice_id) || v.age === "old" || v.age === "middle_aged") continue;
        seen.add(v.voice_id);
        list.push({ id: v.voice_id, owner: v.public_owner_id, name: v.name, about: (v.description ?? "").slice(0, 140), accent: v.accent ?? "", preview: v.preview_url ?? "" });
      }
    } catch {
      /* next search */
    }
    if (list.length >= 10) break;
  }
  cached = { at: Date.now(), list: list.slice(0, 10) };
  return cached.list;
}
