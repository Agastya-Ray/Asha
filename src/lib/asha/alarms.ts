// Hands the day's reminders to Android, so Asha speaks even when the app is closed or the phone is locked.
import { AshaNative, isNative, type NativeReminder } from "@/lib/asha/native";
import { digits } from "@/lib/asha/schedule";
import { againSentence, doseSentence, mealNote, mealSentence, mealTitle, missedText, morningLine, nightLine } from "@/lib/asha/speech";
import { useAsha } from "@/lib/asha/store";
import { speakClock, todayKey, toMin } from "@/lib/asha/time";
import type { Persist } from "@/lib/asha/types";

type S = Persist;

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 0);
  return d.getTime();
}

export function buildReminders(s: S): NativeReminder[] {
  const day = todayKey();
  const lang = s.lang;
  const v = s.voiceLang;
  const out: NativeReminder[] = [];
  const doneLabel = lang === "hi" ? "ले ली ✓" : "Taken ✓";
  const eatenLabel = lang === "hi" ? "खा लिया ✓" : "Eaten ✓";
  const snoozeLabel = lang === "hi" ? "10 मिनट बाद" : "10 min later";
  const againLabel = lang === "hi" ? "दोबारा याद" : "Gentle reminder";

  for (const med of s.meds) {
    for (const time of med.times) {
      const m = toMin(time);
      const done = s.doseLogs.some((l) => l.day === day && l.medId === med.id && l.time === time);
      const low = med.pillsLeft !== null && med.pillsLeft <= 5;
      const lowLine = low ? (lang === "hi" ? ` सिर्फ ${med.pillsLeft} बची हैं.` : ` Only ${med.pillsLeft} left.`) : "";
      const lowSay = low ? (v === "hi" ? ` सिर्फ ${med.pillsLeft} गोलियाँ बची हैं, दुकान से मँगवा लें.` : ` Only ${med.pillsLeft} left, so ask for a refill soon.`) : "";
      out.push({
        key: `med|${med.id}|${time}`,
        hour: Math.floor(m / 60),
        minute: m % 60,
        kind: "med",
        title: `${med.name} · ${med.dose}`,
        body: doseSentence(lang, s.name, med, time) + lowLine,
        say: doseSentence(v, s.name, med, time) + lowSay,
        again: againSentence(v, s.name, med.name),
        lang: v,
        skipUntil: done ? endOfToday() : 0,
        missedText: missedText(lang, s.name, med.name, time),
        doneLabel,
        snoozeLabel,
        againLabel,
      });
    }
  }

  for (const meal of s.meals) {
    const m = toMin(meal.time);
    const done = s.mealLogs.some((l) => l.day === day && l.mealId === meal.id);
    const title = mealTitle(meal, lang);
    out.push({
      key: `meal|${meal.id}|${meal.time}`,
      hour: Math.floor(m / 60),
      minute: m % 60,
      kind: "meal",
      title: `${title} · ${speakClock(lang, meal.time)}`,
      body: mealNote(meal, lang) || mealSentence(lang, s.name, meal, meal.time),
      say: mealSentence(v, s.name, meal, meal.time),
      again: againSentence(v, s.name, mealTitle(meal, v)),
      lang: v,
      skipUntil: done ? endOfToday() : 0,
      doneLabel: eatenLabel,
      snoozeLabel,
      againLabel,
    });
  }

  if (s.dailyGreetings) {
    const wake = toMin(s.wakeTime || "07:30");
    const sleep = toMin(s.sleepTime || "21:30");
    out.push({
      key: "greet|morning|x",
      hour: Math.floor(wake / 60),
      minute: wake % 60,
      kind: "greet",
      title: lang === "hi" ? "सुप्रभात" : "Good morning",
      body: morningLine(lang, s.name),
      say: morningLine(v, s.name),
      lang: v,
    });
    out.push({
      key: "greet|night|x",
      hour: Math.floor(sleep / 60),
      minute: sleep % 60,
      kind: "greet",
      title: lang === "hi" ? "शुभ रात्रि" : "Good night",
      body: nightLine(lang, s.name),
      say: nightLine(v, s.name),
      lang: v,
    });
  }
  return out;
}

let timer: number | undefined;
let lastSent = "";

/** Sends reminders to Android (debounced; only when something changed). */
export function syncReminders(force = false) {
  if (!isNative) return;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    const s = useAsha.getState();
    if (!s.hydrated) return;
    const items = s.onboarded ? buildReminders(s) : [];
    const config = {
      speak: s.voiceOn,
      repeats: 2,
      repeatMinutes: 10,
      snoozeMinutes: 10,
      rate: 0.92,
      familyAlert: s.familyAlert,
      familyNumbers: s.contacts.map((c) => c.phone).filter((p) => digits(p).length >= 6),
    };
    const payload = JSON.stringify({ items, config });
    if (!force && payload === lastSent) return;
    lastSent = payload;
    void AshaNative.setReminders({ items, config }).catch(() => {
      lastSent = "";
    });
  }, 400);
}

/** Applies "Taken" / "10 min later" buttons pressed on the lock screen while the app was closed. */
export async function pullNativeActions() {
  if (!isNative) return;
  try {
    const { actions } = await AshaNative.drainActions();
    if (actions?.length) useAsha.getState().applyNativeActions(actions);
  } catch {
    /* nothing to apply */
  }
}
