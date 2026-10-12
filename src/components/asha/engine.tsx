import { useEffect } from "react";
import { buildAgenda, shouldSpeak } from "@/lib/asha/schedule";
import { greeting } from "@/lib/asha/speech";
import { useAsha } from "@/lib/asha/store";
import { speak, useSpeech } from "@/lib/asha/voice";

async function tick() {
  const s = useAsha.getState();
  if (!s.hydrated || !s.onboarded || !s.voiceOn) return;
  if (useSpeech.getState().active) return;
  const items = buildAgenda(s);
  const next = items.find((item) => shouldSpeak(item, s.reminded, s.snooze));
  if (!next) return;
  s.markReminded([next.key]);
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      new Notification("Asha", { body: next.sentence, silent: true });
    } catch {
      /* a quiet notice is optional */
    }
  }
  await speak(next.sentence, s.lang, s.richVoice ? "warm" : "device");
}

export function ReminderEngine() {
  const hydrated = useAsha((s) => s.hydrated);
  const onboarded = useAsha((s) => s.onboarded);

  useEffect(() => {
    if (!hydrated) return;
    let wake: { release: () => Promise<void> } | null = null;
    const syncWake = async () => {
      const s = useAsha.getState();
      if (!s.keepAwake || !s.onboarded || !("wakeLock" in navigator)) {
        await wake?.release().catch(() => undefined);
        wake = null;
        return;
      }
      try {
        wake = await navigator.wakeLock.request("screen");
      } catch {
        wake = null;
      }
    };
    void syncWake();
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void syncWake();
        void tick();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    const unsub = useAsha.subscribe((state, prev) => {
      if (state.keepAwake !== prev.keepAwake) void syncWake();
    });
    const id = window.setInterval(() => void tick(), 15000);
    const greetTimer = window.setTimeout(() => {
      const s = useAsha.getState();
      if (!s.onboarded || !s.voiceOn || !s.speakOnOpen) return;
      const items = buildAgenda(s);
      if (items.some((item) => shouldSpeak(item, s.reminded, s.snooze))) {
        void tick();
        return;
      }
      const g = greeting(s.lang, s.name, new Date());
      void speak(`${g.title} ${g.line}`, s.lang, "device");
    }, 800);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(greetTimer);
      document.removeEventListener("visibilitychange", onVis);
      unsub();
      void wake?.release().catch(() => undefined);
    };
  }, [hydrated, onboarded]);

  return null;
}
