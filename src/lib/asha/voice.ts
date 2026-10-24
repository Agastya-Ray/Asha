import { create } from "zustand";
import type { Lang } from "@/lib/asha/types";
import { apiTts } from "@/lib/asha/api";
import { AshaNative, isNative } from "@/lib/asha/native";
import { todayKey } from "@/lib/asha/time";
import { useAsha } from "@/lib/asha/store";

/**
 * Asha's voice, in order of preference:
 *   1. warm cloud voice  (server: xAI, then Google)   — needs internet
 *      Titli has her own: the childlike ElevenLabs voice picked in Settings, never a grown-up one
 *   2. the phone's own voice (Android TextToSpeech)   — free, offline
 *   3. the browser's voice (when used as a website)
 * If one fails, the next one speaks. She never goes silent because a service stopped.
 */

type SpeechState = {
  active: boolean;
  lastSaid: string;
  source: "warm" | "phone" | null;
  failed: boolean;
};

export const useSpeech = create<SpeechState>(() => ({ active: false, lastSaid: "", source: null, failed: false }));

const set = (patch: Partial<SpeechState>) => useSpeech.setState(patch);

let audio: HTMLAudioElement | null = null;
let generation = 0;
const cache = new Map<string, string>();
const SILENCE = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
let unlocked = false;
/** After a warm-voice failure, rest the cloud for a while instead of retrying every sentence. */
let warmRestUntil = 0;

export function unlockAudio() {
  if (unlocked || typeof window === "undefined") return;
  unlocked = true;
  const primer = new Audio(SILENCE);
  primer.volume = 0.01;
  void primer.play().catch(() => {
    unlocked = false;
  });
}

let hushUntil = 0;
/** Quiet mode ("I'm going to an event, be quiet"): she says nothing until then, except lines marked loud. */
export function setHush(until: number) {
  hushUntil = until;
  if (until > Date.now()) stopSpeaking();
}

export function stopSpeaking() {
  generation += 1;
  audio?.pause();
  audio = null;
  if (isNative) void AshaNative.stopSpeaking().catch(() => undefined);
  else if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  set({ active: false });
}

// Asha's allowance counts clips. Titli's counts letters: the free ElevenLabs plan gives about 20,000 letters
// a month, so she gets ~600 new letters a day; lines she has said before come from the phone and cost nothing.
const DAILY_WARM = 40;
const DAILY_FAIRY_LETTERS = 600;
function warmAllowed(fairy: boolean, letters: number) {
  try {
    const raw = localStorage.getItem(fairy ? "asha.tts.fairy" : "asha.tts");
    const p = raw ? (JSON.parse(raw) as { day: string; n: number }) : null;
    if (!p || p.day !== todayKey()) return true;
    return fairy ? p.n + letters <= DAILY_FAIRY_LETTERS : p.n < DAILY_WARM;
  } catch {
    return true;
  }
}
function countWarm(fairy: boolean, letters: number) {
  try {
    const day = todayKey();
    const slot = fairy ? "asha.tts.fairy" : "asha.tts";
    const raw = localStorage.getItem(slot);
    const p = raw ? (JSON.parse(raw) as { day: string; n: number }) : { day, n: 0 };
    const add = fairy ? letters : 1;
    localStorage.setItem(slot, JSON.stringify({ day, n: p.day === day ? p.n + add : add }));
  } catch {
    /* ignore */
  }
}

// Titli's clips are kept on the phone for good, so each sentence is paid for once
const KEEP = "titli-voice-v1";
const keepUrl = (key: string) => `https://asha.local/titli/${encodeURIComponent(key)}`;
async function kept(key: string) {
  try {
    if (typeof caches === "undefined") return null;
    const hit = await (await caches.open(KEEP)).match(keepUrl(key));
    return hit ? await hit.text() : null;
  } catch {
    return null;
  }
}
function keep(key: string, b64: string) {
  if (typeof caches === "undefined") return;
  void caches
    .open(KEEP)
    .then((c) => c.put(keepUrl(key), new Response(b64)))
    .catch(() => undefined);
}

/** "Phone voice" chosen in Settings: Titli uses the phone's own voice, free and offline. */
export const PHONE_VOICE = "phone";
/** Her voice until one is chosen: Jessica, one of ElevenLabs' own voices, free on its free plan. */
export const DEFAULT_FAIRY_ID = "cgSgspJ2msm6clMCkdW9";
const DEFAULT_FAIRY = { id: DEFAULT_FAIRY_ID, owner: "" };

let fairyRestUntil = 0;
async function warmClip(text: string, lang: Lang, fairy?: { id: string; owner: string }) {
  const key = `${fairy?.id ?? "asha"}|${lang}|${text}`;
  const hit = cache.get(key) ?? (fairy ? await kept(key) : null);
  if (hit) return hit;
  if (Date.now() < (fairy ? fairyRestUntil : warmRestUntil) || !warmAllowed(!!fairy, text.length)) throw new Error("rest");
  const res = await apiTts(text, lang, fairy);
  if (!res.ok) {
    const until = Date.now() + (res.status === 429 ? 30 : 5) * 60 * 1000;
    if (fairy) fairyRestUntil = until;
    else warmRestUntil = until;
    throw new Error(res.error);
  }
  countWarm(!!fairy, text.length);
  if (fairy) keep(key, res.audio);
  if (cache.size > 40) cache.delete(cache.keys().next().value as string);
  cache.set(key, res.audio);
  return res.audio;
}

function pickWebVoice(lang: Lang) {
  const voices = window.speechSynthesis?.getVoices?.() ?? [];
  const score = (v: SpeechSynthesisVoice) => {
    const n = `${v.name} ${v.lang}`.toLowerCase();
    let s = 0;
    if (lang === "hi" && (n.includes("hi-in") || n.includes("hindi"))) s += 6;
    if (lang === "en" && n.includes("en-in")) s += 5;
    if (n.includes("female")) s += 2;
    if (n.includes("google")) s += 1;
    return s;
  };
  return [...voices].sort((a, b) => score(b) - score(a))[0];
}

/** When her ElevenLabs voice can't speak (offline, or the day's allowance is used): the phone's voice, a little
 * higher and slower. Only gently higher: at 1.6 it sounded squeaky and strange. */
const FAIRY = { rate: 0.95, pitch: 1.25 };

function phoneVoice(text: string, lang: Lang, mine: number, fairy = false) {
  return new Promise<void>((resolve) => {
    if (isNative) {
      set({ active: true, lastSaid: text, source: "phone", failed: false });
      AshaNative.speak(fairy ? { text, lang, ...FAIRY } : { text, lang, rate: 0.92 })
        .then((r) => {
          if (mine === generation) set({ active: false, failed: !r.ok });
        })
        .catch(() => {
          if (mine === generation) set({ active: false, failed: true });
        })
        .finally(resolve);
      return;
    }
    if (typeof window === "undefined" || !window.speechSynthesis) {
      if (mine === generation) set({ active: false, failed: true, source: "phone" });
      resolve();
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "hi" ? "hi-IN" : "en-IN";
    u.rate = fairy ? FAIRY.rate : 0.92;
    if (fairy) u.pitch = FAIRY.pitch;
    const v = pickWebVoice(lang);
    if (v) u.voice = v;
    u.onend = () => {
      if (mine === generation) set({ active: false });
      resolve();
    };
    u.onerror = () => {
      if (mine === generation) set({ active: false, failed: true });
      resolve();
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    set({ active: true, lastSaid: text, source: "phone", failed: false });
  });
}

export async function speak(text: string, lang: Lang, prefer: "warm" | "device" | "fairy", loud = false) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean || (!loud && hushUntil > Date.now())) return;
  const mine = ++generation;
  audio?.pause();
  audio = null;
  if (!isNative && typeof window !== "undefined") window.speechSynthesis?.cancel();
  set({ active: true, lastSaid: clean, failed: false, source: null });
  // Titli speaks in her ElevenLabs voice (the default until one is chosen), unless "Phone voice" was chosen
  const chosen = useAsha.getState().fairyVoice;
  const fairyVoice = prefer === "fairy" && chosen?.id !== PHONE_VOICE ? (chosen ?? DEFAULT_FAIRY) : null;
  if (prefer === "warm" || fairyVoice) {
    try {
      const b64 = await warmClip(clean, lang, fairyVoice ?? undefined);
      if (mine !== generation) return;
      const next = new Audio(`data:audio/mpeg;base64,${b64}`);
      audio = next;
      await new Promise<void>((resolve, reject) => {
        next.onended = () => resolve();
        next.onpause = () => resolve();
        next.onerror = () => reject(new Error("play"));
        next.play().then(() => set({ active: true, source: "warm" }), reject);
      });
      if (audio === next && mine === generation) set({ active: false });
      return;
    } catch {
      if (mine !== generation) return;
    }
  }
  await phoneVoice(clean, lang, mine, prefer === "fairy");
}
