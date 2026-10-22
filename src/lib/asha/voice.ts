import { create } from "zustand";
import type { Lang } from "@/lib/asha/types";
import { apiTts } from "@/lib/asha/api";
import { AshaNative, isNative } from "@/lib/asha/native";
import { todayKey } from "@/lib/asha/time";

/**
 * Asha's voice, in order of preference:
 *   1. warm cloud voice  (server: xAI, then Google)   — needs internet
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

export function stopSpeaking() {
  generation += 1;
  audio?.pause();
  audio = null;
  if (isNative) void AshaNative.stopSpeaking().catch(() => undefined);
  else if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  set({ active: false });
}

const DAILY_WARM = 40;
function warmAllowed() {
  try {
    const raw = localStorage.getItem("asha.tts");
    const p = raw ? (JSON.parse(raw) as { day: string; n: number }) : null;
    return !p || p.day !== todayKey() || p.n < DAILY_WARM;
  } catch {
    return true;
  }
}
function countWarm() {
  try {
    const day = todayKey();
    const raw = localStorage.getItem("asha.tts");
    const p = raw ? (JSON.parse(raw) as { day: string; n: number }) : { day, n: 0 };
    localStorage.setItem("asha.tts", JSON.stringify({ day, n: p.day === day ? p.n + 1 : 1 }));
  } catch {
    /* ignore */
  }
}

async function warmClip(text: string, lang: Lang) {
  const key = `${lang}|${text}`;
  const hit = cache.get(key);
  if (hit) return hit;
  if (Date.now() < warmRestUntil || !warmAllowed()) throw new Error("rest");
  const res = await apiTts(text, lang);
  if (!res.ok) {
    warmRestUntil = Date.now() + (res.status === 429 ? 30 : 5) * 60 * 1000;
    throw new Error(res.error);
  }
  countWarm();
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

/** The fairy has her own voice: the phone's voice, pitched up and a little quicker, like a small bright girl. */
const FAIRY = { rate: 1.0, pitch: 1.6 };

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

export async function speak(text: string, lang: Lang, prefer: "warm" | "device" | "fairy") {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return;
  const mine = ++generation;
  audio?.pause();
  audio = null;
  if (!isNative && typeof window !== "undefined") window.speechSynthesis?.cancel();
  set({ active: true, lastSaid: clean, failed: false, source: null });
  if (prefer === "warm") {
    try {
      const b64 = await warmClip(clean, lang);
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
