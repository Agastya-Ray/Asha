import { AshaNative, isNative } from "@/lib/asha/native";
import type { Lang } from "@/lib/asha/types";
import { stopSpeaking } from "@/lib/asha/voice";

type WebRec = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((ev: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

function webRecognizer(): (new () => WebRec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => WebRec; webkitSpeechRecognition?: new () => WebRec };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function canListen() {
  return isNative || Boolean(webRecognizer());
}

export type Heard = { text: string; problem?: "no-mic" | "denied" | "nothing" };

/** Listens once, in Asha's voice language, and returns what was said. */
export async function listenOnce(lang: Lang): Promise<Heard> {
  stopSpeaking();
  if (isNative) {
    try {
      const r = await AshaNative.listen({ lang });
      return r.text ? { text: r.text } : { text: "", problem: "nothing" };
    } catch (e) {
      const msg = String((e as Error)?.message ?? e);
      return { text: "", problem: msg.includes("denied") ? "denied" : "no-mic" };
    }
  }
  const Ctor = webRecognizer();
  if (!Ctor) return { text: "", problem: "no-mic" };
  return new Promise<Heard>((resolve) => {
    const rec = new Ctor();
    rec.lang = lang === "hi" ? "hi-IN" : "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    let done = false;
    const finish = (h: Heard) => {
      if (done) return;
      done = true;
      resolve(h);
    };
    rec.onresult = (ev) => finish({ text: ev.results[0]?.[0]?.transcript ?? "" });
    rec.onerror = (ev) => finish({ text: "", problem: ev?.error === "not-allowed" ? "denied" : "nothing" });
    rec.onend = () => finish({ text: "", problem: "nothing" });
    try {
      rec.start();
    } catch {
      finish({ text: "", problem: "no-mic" });
    }
  });
}
