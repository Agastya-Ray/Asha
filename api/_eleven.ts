// ElevenLabs: Titli's own voice (ELEVENLABS_API_KEY). Files starting with "_" are not endpoints.
import { toBase64 } from "./_shared.js";

const API = "https://api.elevenlabs.io";
export const elevenKey = () => process.env.ELEVENLABS_API_KEY ?? "";
// why the last attempt failed (ElevenLabs' own status, never the key), so a 503 can say what to fix
export let elevenWhy = "";
// Jessica, one of ElevenLabs' own voices: playful and bright, and it works on the free plan
export const DEFAULT_FAIRY_VOICE = "cgSgspJ2msm6clMCkdW9";
const okId = (v: unknown) => (typeof v === "string" && /^[A-Za-z0-9]{8,40}$/.test(v) ? v : "");

/**
 * Says `text` in the chosen ElevenLabs voice, slowly and warmly. A voice from the shared library has to be
 * added to the account once before it can speak; when ElevenLabs says it isn't there, we add it and try again.
 */
export async function elevenSpeak(text: string, voice: unknown, owner: unknown): Promise<string | null> {
  const key = elevenKey();
  const id = okId(voice) || okId(process.env.ELEVENLABS_VOICE_FAIRY) || DEFAULT_FAIRY_VOICE;
  elevenWhy = !key ? "no ELEVENLABS_API_KEY" : !id ? "no voice chosen" : "";
  if (!key || !id) return null;
  const say = (as = id) =>
    fetch(`${API}/v1/text-to-speech/${as}?output_format=mp3_44100_64`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "xi-api-key": key },
      body: JSON.stringify({
        text,
        // flash costs half the credits of multilingual (the free plan has 10,000 a month) and speaks Hindi too
        model_id: process.env.ELEVENLABS_MODEL || "eleven_flash_v2_5",
        // slow and gentle (Agastya: "much slower"), expressive, and still clearly the same girl every time
        voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.55, use_speaker_boost: true, speed: 0.78 },
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
      else elevenWhy = `add voice ${added.status}: ${(await added.text()).slice(0, 200)}`;
    }
    // a library voice on the free plan (402): she still speaks, in the default voice
    if (res.status === 402 && id !== DEFAULT_FAIRY_VOICE) res = await say(DEFAULT_FAIRY_VOICE);
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.includes("audio")) {
      elevenWhy = `speak ${res.status}: ${(await res.text()).slice(0, 200)}${elevenWhy ? ` (${elevenWhy})` : ""}`;
      console.error("elevenlabs", elevenWhy);
      return null;
    }
    const bytes = new Uint8Array(await res.arrayBuffer());
    return bytes.length > 100 ? toBase64(bytes) : null;
  } catch (e) {
    elevenWhy = `network: ${String(e).slice(0, 120)}`;
    return null;
  }
}

export type VoiceChoice = { id: string; owner: string; name: string; about: string; accent: string; preview: string };

let cached: { at: number; list: VoiceChoice[] } | null = null;

/**
 * Voices for "Choose Titli's voice". First the ones in your own ElevenLabs account (a voice you made with
 * Voice Design is yours and works on the free plan), then ElevenLabs' own young female voices (also free).
 * The shared library (other people's voices) needs a paid plan for apps, so it is only offered when
 * ELEVENLABS_LIBRARY=1.
 */
export async function elevenChoices(): Promise<VoiceChoice[]> {
  const key = elevenKey();
  if (!key) return [];
  if (cached && Date.now() - cached.at < 10 * 60 * 1000) return cached.list;
  const seen = new Set<string>();
  const list: VoiceChoice[] = [];
  try {
    const res = await fetch(`${API}/v1/voices`, { headers: { "xi-api-key": key } });
    if (res.ok) {
      const body = (await res.json()) as {
        voices?: { voice_id: string; name: string; category?: string; description?: string; labels?: Record<string, string>; preview_url?: string }[];
      };
      const all = body.voices ?? [];
      // made in this account (Voice Design, or a clone). A library voice added to the account still needs a paid plan.
      const mine = all.filter((v) => v.category === "generated" || v.category === "cloned");
      const stock = all.filter((v) => v.category === "premade" && v.labels?.gender === "female" && v.labels?.age !== "old" && v.labels?.age !== "middle_aged");
      for (const v of [...mine, ...stock]) {
        if (seen.has(v.voice_id)) continue;
        seen.add(v.voice_id);
        const about = v.description || [v.labels?.descriptive, v.labels?.description, v.labels?.use_case].filter(Boolean).join(", ");
        list.push({ id: v.voice_id, owner: "", name: v.name, about: about.slice(0, 140), accent: v.labels?.accent ?? "", preview: v.preview_url ?? "" });
      }
    }
  } catch {
    /* the library below, if allowed */
  }
  if (process.env.ELEVENLABS_LIBRARY === "1") {
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
      if (list.length >= 16) break;
    }
  }
  cached = { at: Date.now(), list: list.slice(0, 16) };
  return cached.list;
}
