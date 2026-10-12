import { create } from "zustand";
import type { Lang } from "@/lib/asha/types";
import { speakRich } from "@/lib/asha/ai";
import { todayKey } from "@/lib/asha/time";

const SILENCE =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

type SpeechState = {
  active: boolean;
  lastSaid: string;
  source: "warm" | "phone" | null;
  failed: boolean;
};

export const useSpeech = create<SpeechState>(() => ({
  active: false,
  lastSaid: "",
  source: null,
  failed: false,
}));

let audio: HTMLAudioElement | null = null;
let unlocked = false;
const cache = new Map<string, string>();

function setSpeech(patch: Partial<SpeechState>) {
  useSpeech.setState(patch);
}

export function unlockAudio() {
  if (unlocked || typeof window === "undefined") return;
  unlocked = true;
  const primer = new Audio(SILENCE);
  primer.volume = 0.01;
  void primer.play().catch(() => {
    unlocked = false;
  });
}

let generation = 0;

export function stopSpeaking() {
  generation += 1;
  audio?.pause();
  audio = null;
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  setSpeech({ active: false });
}

function capAllows() {
  try {
    const raw = localStorage.getItem("asha.tts");
    const parsed = raw ? (JSON.parse(raw) as { day: string; n: number }) : { day: todayKey(), n: 0 };
    if (parsed.day !== todayKey()) return true;
    return parsed.n < 24;
  } catch {
    return true;
  }
}

function markCap() {
  try {
    const day = todayKey();
    const raw = localStorage.getItem("asha.tts");
    const parsed = raw ? (JSON.parse(raw) as { day: string; n: number }) : { day, n: 0 };
    const n = parsed.day === day ? parsed.n + 1 : 1;
    localStorage.setItem("asha.tts", JSON.stringify({ day, n }));
  } catch {
    /* ignore */
  }
}

async function loadClip(text: string, lang: Lang) {
  const key = `${lang}|${text}`;
  const hit = cache.get(key);
  if (hit) return hit;
  if (!capAllows()) throw new Error("cap");
  const res = await speakRich({ data: { text: text.slice(0, 700), language: lang === "hi" ? "hi" : "en" } });
  if (!res.ok || !res.audio) throw new Error(res.ok ? "empty" : res.error);
  markCap();
  cache.set(key, res.audio);
  return res.audio;
}

function pickVoice(lang: Lang) {
  const voices = window.speechSynthesis?.getVoices?.() ?? [];
  const score = (v: SpeechSynthesisVoice) => {
    const n = `${v.name} ${v.lang}`.toLowerCase();
    let s = 0;
    if (lang === "hi" && (n.includes("hi-in") || n.includes("hindi") || n.includes("hi_"))) s += 6;
    if (lang === "en" && (n.includes("en-in") || n.includes("en_in"))) s += 5;
    if (n.includes("en-gb") || n.includes("english female") || n.includes("female")) s += 2;
    if (n.includes("google")) s += 1;
    return s;
  };
  return [...voices].sort((a, b) => score(b) - score(a))[0];
}

function speakDevice(text: string, lang: Lang, mine: number) {
  return new Promise<void>((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      if (mine === generation) setSpeech({ active: false, failed: true, source: "phone" });
      resolve();
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === "hi" ? "hi-IN" : "en-IN";
    utter.rate = 0.92;
    utter.pitch = 1;
    const voice = pickVoice(lang);
    if (voice) utter.voice = voice;
    utter.onend = () => {
      if (mine === generation) setSpeech({ active: false });
      resolve();
    };
    utter.onerror = () => {
      if (mine === generation) setSpeech({ active: false, failed: true });
      resolve();
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    if (mine === generation) setSpeech({ active: true, lastSaid: text, source: "phone", failed: false });
  });
}

export async function speak(text: string, lang: Lang, prefer: "warm" | "device") {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return;
  const mine = ++generation;
  audio?.pause();
  audio = null;
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  setSpeech({ active: true, lastSaid: clean, failed: false, source: null });
  if (prefer === "warm") {
    try {
      const b64 = await loadClip(clean, lang);
      if (mine !== generation) return;
      const next = new Audio(`data:audio/mpeg;base64,${b64}`);
      audio = next;
      next.onended = () => {
        if (audio === next) setSpeech({ active: false });
      };
      await next.play();
      if (mine !== generation) {
        next.pause();
        return;
      }
      setSpeech({ active: true, source: "warm", failed: false, lastSaid: clean });
      return;
    } catch {
      if (mine !== generation) return;
    }
  }
  if (mine !== generation) return;
  await speakDevice(clean, lang, mine);
}
