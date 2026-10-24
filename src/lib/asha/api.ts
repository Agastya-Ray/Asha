// Talks to the small Asha server (the /api folder, hosted on Vercel).
import { isNative } from "@/lib/asha/native";
import type { Lang } from "@/lib/asha/types";

/** Where the server lives. In the browser it is the same site. In the app it is the Vercel address. */
const FALLBACK_API = "https://asha-rho.vercel.app";
const BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") || (isNative ? FALLBACK_API : "");
const APP_KEY = (import.meta.env.VITE_ASHA_APP_KEY as string | undefined) ?? "";

let deviceId = "";
export function setDeviceId(id: string) {
  deviceId = id;
}

type Fail = { ok: false; error: string; status: number };

async function post<T>(path: string, body: unknown, timeoutMs = 25000): Promise<(T & { ok: true }) | Fail> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { ok: false, error: "offline", status: 0 };
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-asha-key": APP_KEY, "x-asha-device": deviceId },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) return { ok: false, error: data.error ?? `http ${res.status}`, status: res.status };
    return data as T & { ok: true };
  } catch {
    return { ok: false, error: "network", status: 0 };
  } finally {
    clearTimeout(timer);
  }
}

export function apiTts(text: string, lang: Lang, fairy?: { id: string; owner: string }) {
  return post<{ audio: string; provider: string }>(
    "/api/tts",
    fairy ? { text, lang, who: "fairy", voice: fairy.id, owner: fairy.owner } : { text, lang },
    15000,
  );
}

export type VoiceChoice = { id: string; owner: string; name: string; about: string; accent: string; preview: string };

/** Childlike voices Titli could have, for "Choose Titli's voice". */
export function apiVoices() {
  return post<{ voices: VoiceChoice[] }>("/api/voices", {}, 20000);
}

export function apiChat(input: { show: Lang; say: Lang; context: string; turns: { role: string; content: string }[] }) {
  return post<{ say: string; show: string }>("/api/chat", input);
}

export type RxMedicine = { name: string; dose: string; times: string[]; food: string; days: number; note: string };

export function apiReadPrescription(image: string) {
  return post<{ medicines: RxMedicine[]; unreadable: boolean; caution: string }>("/api/rx", { image }, 45000);
}
