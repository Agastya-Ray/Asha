// Hands the day's reminders to Android, so Asha speaks even when the app is closed or the phone is locked.
import { AshaNative, isNative, type NativeReminder } from "@/lib/asha/native";
import { timeWords, useFamily } from "@/lib/asha/family";
import { againSentence, doseSentence, lastAgainSentence, mealNote, mealSentence, mealTitle, missedText, morningLine, nightLine } from "@/lib/asha/speech";
import { backLine } from "@/lib/asha/quiet";
import { dueLine } from "@/lib/asha/remember";
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
  const familyTold = useFamily.getState().circles.length > 0;

  for (const med of s.meds) {
    if (med.asNeeded) continue;
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
        // Android counts weekdays from 1 (Sunday)
        days: med.days?.length ? med.days.map((d) => d + 1) : undefined,
        kind: "med",
        title: `${med.name} · ${med.dose}`,
        body: doseSentence(lang, s.name, med, time) + lowLine,
        say: doseSentence(v, s.name, med, time) + lowSay,
        again: againSentence(v, s.name, med.name),
        lastAgain: lastAgainSentence(v, s.name, med.name, familyTold),
        lang: v,
        skipUntil: done ? endOfToday() : 0,
        missedText: missedText(lang, s.name, med.name, time),
        alertTimeEn: timeWords(time).en,
        alertTimeHi: timeWords(time).hi,
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
  // things she was asked to remember, each rung once
  const now = Date.now();
  for (const m of s.memories) {
    if (m.done || !m.at || m.at <= now || m.at - now > 7 * 86400000) continue;
    const at = new Date(m.at);
    out.push({
      key: `note|${m.id}`,
      hour: at.getHours(),
      minute: at.getMinutes(),
      kind: "greet",
      title: lang === "hi" ? "याद है?" : "You asked me to remember",
      body: dueLine(lang, s.name, m.what || m.said),
      say: dueLine(v, s.name, m.what || m.said),
      lang: v,
      onceAt: m.at,
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
    const items = s.onboarded && s.appRole === "elder" ? buildReminders(s) : [];
    const config = {
      speak: s.voiceOn,
      repeats: 2,
      repeatMinutes: 10,
      snoozeMinutes: 10,
      rate: 0.92,
      // quiet mode: Android buzzes silently until then, and says "I'm back" plus anything not yet taken
      quietUntil: s.quietUntil,
      quietBack: backLine(s.voiceLang, s.name),
      quietLang: s.voiceLang,
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
