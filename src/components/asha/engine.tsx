import { useEffect } from "react";
import { App } from "@capacitor/app";
import { pullNativeActions, syncReminders } from "@/lib/asha/alarms";
import { setDeviceId } from "@/lib/asha/api";
import { isNative } from "@/lib/asha/native";
import { buildAgenda, shouldSpeak } from "@/lib/asha/schedule";
import { backLine, isQuiet } from "@/lib/asha/quiet";
import { greeting } from "@/lib/asha/speech";
import { useAsha } from "@/lib/asha/store";
import { setHush, speak, useSpeech } from "@/lib/asha/voice";

// Reminders that only buzzed while she was quiet (web): she says them when quiet ends.
const buzzed = new Set<string>();

/**
 * In the Android app, Android itself rings and speaks each reminder (see alarms.ts),
 * so this only keeps the phone's list up to date.
 * In a web browser, this page does the speaking while it is open.
 */
async function webTick() {
  const s = useAsha.getState();
  if (isNative || !s.hydrated || !s.onboarded || s.appRole !== "elder" || !s.voiceOn) return;
  if (useSpeech.getState().active) return;
  const items = buildAgenda(s);
  if (isQuiet(s)) {
    // quiet mode: a silent card and a buzz, once; not marked as said, so it is said when quiet ends
    const due = items.find((item) => shouldSpeak(item, s.reminded, s.snooze) && !buzzed.has(item.key));
    if (!due) return;
    buzzed.add(due.key);
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        new Notification("Asha", { body: due.sentence, silent: true });
      } catch {
        /* optional */
      }
    }
    navigator.vibrate?.([0, 400, 250, 400]);
    return;
  }
  const next = items.find((item) => shouldSpeak(item, s.reminded, s.snooze));
  if (!next) return;
  s.markReminded([next.key]);
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      new Notification("Asha", { body: next.sentence, silent: true });
    } catch {
      /* optional */
    }
  }
  await speak(next.say, s.voiceLang, s.richVoice ? "warm" : "device");
}

export function ReminderEngine() {
  const hydrated = useAsha((s) => s.hydrated);
  const onboarded = useAsha((s) => s.onboarded);

  // Keep Android's reminder list in step with the app.
  useEffect(() => {
    if (!hydrated) return;
    setDeviceId(useAsha.getState().deviceId);
    void pullNativeActions().then(() => syncReminders(true));
    const unsub = useAsha.subscribe((state, prev) => {
      if (
        state.meds !== prev.meds ||
        state.meals !== prev.meals ||
        state.doseLogs !== prev.doseLogs ||
        state.mealLogs !== prev.mealLogs ||
        state.contacts !== prev.contacts ||
        state.name !== prev.name ||
        state.lang !== prev.lang ||
        state.voiceLang !== prev.voiceLang ||
        state.voiceOn !== prev.voiceOn ||
        state.familyAlert !== prev.familyAlert ||
        state.dailyGreetings !== prev.dailyGreetings ||
        state.wakeTime !== prev.wakeTime ||
        state.sleepTime !== prev.sleepTime ||
        state.quietUntil !== prev.quietUntil ||
        state.onboarded !== prev.onboarded ||
        state.appRole !== prev.appRole
      ) {
        syncReminders();
      }
    });
    let removeResume: (() => void) | undefined;
    if (isNative) {
      void App.addListener("resume", () => {
        void pullNativeActions().then(() => syncReminders(true));
      }).then((h) => {
        removeResume = () => void h.remove();
      });
    }
    return () => {
      unsub();
      removeResume?.();
    };
  }, [hydrated]);

  // Quiet mode: hush her voice until then; at the end she says "I'm back" (Android does this itself).
  useEffect(() => {
    if (!hydrated) return;
    let end = 0;
    const arm = (until: number) => {
      setHush(until);
      window.clearTimeout(end);
      if (until > Date.now()) end = window.setTimeout(() => useAsha.getState().setQuiet(0), until - Date.now() + 200);
      else if (until) useAsha.getState().setQuiet(0);
    };
    arm(useAsha.getState().quietUntil);
    const unsub = useAsha.subscribe((state, prev) => {
      if (state.quietUntil === prev.quietUntil) return;
      arm(state.quietUntil);
      if (state.quietUntil || !prev.quietUntil) return;
      buzzed.clear();
      if (isNative || !state.voiceOn) return;
      void speak(backLine(state.voiceLang, state.name), state.voiceLang, "fairy").then(() => webTick());
    });
    return () => {
      window.clearTimeout(end);
      unsub();
    };
  }, [hydrated]);

  // Greeting on open, screen wake lock, and (web only) the speaking timer.
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
        void webTick();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    const unsub = useAsha.subscribe((state, prev) => {
      if (state.keepAwake !== prev.keepAwake) void syncWake();
    });
    const id = window.setInterval(() => void webTick(), 15000);
    const greetTimer = window.setTimeout(() => {
      const s = useAsha.getState();
      if (!s.onboarded || s.appRole !== "elder" || !s.voiceOn || !s.speakOnOpen) return;
      if (!isNative && buildAgenda(s).some((item) => shouldSpeak(item, s.reminded, s.snooze))) {
        void webTick();
        return;
      }
      const g = greeting(s.voiceLang, s.name, new Date());
      void speak(`${g.title} ${g.line}`, s.voiceLang, s.richVoice ? "warm" : "device");
    }, 2600);
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
