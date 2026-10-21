import type { AgendaItem, Checkin, DoseLog, Meal, MealLog, Med, Persist } from "@/lib/asha/types";
import { doseSentence, mealSentence } from "@/lib/asha/speech";
import { mealNote, mealTitle } from "@/lib/asha/speech";
import { minutesNow, todayKey, toMin } from "@/lib/asha/time";

export function defaultMeals(): Meal[] {
  return [
    { id: "breakfast", preset: "breakfast", name: "", time: "08:00", note: "" },
    { id: "lunch", preset: "lunch", name: "", time: "13:00", note: "" },
    { id: "snack", preset: "snack", name: "", time: "16:30", note: "" },
    { id: "dinner", preset: "dinner", name: "", time: "19:30", note: "" },
  ];
}

export function buildAgenda(
  state: Pick<Persist, "name" | "lang" | "voiceLang" | "meds" | "meals" | "doseLogs" | "mealLogs" | "snooze">,
  now = new Date(),
): AgendaItem[] {
  const day = todayKey(now);
  const nowMin = minutesNow(now);
  const nowMs = now.getTime();
  const items: AgendaItem[] = [];

  for (const med of state.meds) {
    for (const time of med.times) {
      const key = `${day}|med|${med.id}|${time}`;
      const log = state.doseLogs.find((l) => l.day === day && l.medId === med.id && l.time === time);
      const snoozeUntil = state.snooze[key];
      const minutes = toMin(time);
      let agendaState: AgendaItem["state"] = "later";
      if (log?.status === "taken") agendaState = "taken";
      else if (log?.status === "skipped") agendaState = "skipped";
      else if (snoozeUntil && snoozeUntil > nowMs) agendaState = "snoozed";
      else if (nowMin >= minutes) agendaState = nowMin - minutes <= 45 ? "now" : "open";
      items.push({
        key,
        kind: "med",
        id: med.id,
        time,
        minutes,
        title: med.name,
        detail: `${med.dose}${med.note ? ` · ${med.note}` : ""}`,
        sentence: doseSentence(state.lang, state.name, med, time),
        say: doseSentence(state.voiceLang, state.name, med, time),
        state: agendaState,
      });
    }
  }

  for (const meal of state.meals) {
    const key = `${day}|meal|${meal.id}|${meal.time}`;
    const done = state.mealLogs.some((l) => l.day === day && l.mealId === meal.id);
    const snoozeUntil = state.snooze[key];
    const minutes = toMin(meal.time);
    let agendaState: AgendaItem["state"] = "later";
    if (done) agendaState = "taken";
    else if (snoozeUntil && snoozeUntil > nowMs) agendaState = "snoozed";
    else if (nowMin >= minutes) agendaState = nowMin - minutes <= 45 ? "now" : "open";
    const note = mealNote(meal, state.lang);
    items.push({
      key,
      kind: "meal",
      id: meal.id,
      time: meal.time,
      minutes,
      title: mealTitle(meal, state.lang),
      detail: note,
      sentence: mealSentence(state.lang, state.name, meal, meal.time),
      say: mealSentence(state.voiceLang, state.name, meal, meal.time),
      state: agendaState,
    });
  }

  const rank: Record<AgendaItem["state"], number> = {
    now: 0,
    snoozed: 1,
    open: 2,
    later: 3,
    taken: 4,
    skipped: 5,
  };
  return items.sort((a, b) => rank[a.state] - rank[b.state] || a.minutes - b.minutes);
}

/**
 * Speak once per item per day: when it is due, or (if the app was opened late)
 * when it is still open up to 4 hours later. A snooze clears the "reminded" mark,
 * so it speaks again when the snooze ends.
 */
export function shouldSpeak(item: AgendaItem, reminded: string[], _snooze: Record<string, number>, now = new Date()) {
  if (reminded.includes(item.key)) return false;
  const late = minutesNow(now) - item.minutes;
  if (late < 0) return false;
  if (item.state === "now") return true;
  if (item.state === "open" && late <= 240) return true;
  return false;
}

export function todayCheckin(checkins: Checkin[], now = new Date()) {
  return checkins.find((c) => c.day === todayKey(now));
}

export function doseProgress(meds: Med[], logs: DoseLog[], now = new Date()) {
  const day = todayKey(now);
  let total = 0;
  let marked = 0;
  for (const med of meds) {
    for (const time of med.times) {
      total += 1;
      const log = logs.find((l) => l.day === day && l.medId === med.id && l.time === time);
      if (log) marked += 1;
    }
  }
  return { total, marked };
}

/** Hindi keyboards and Hindi voice typing give Devanagari digits (९८७…); turn them into 0–9 before reading a number. */
export function latinDigits(s: string) {
  return s.replace(/[\u0966-\u096f]/g, (d) => String(d.charCodeAt(0) - 0x0966));
}

export function telHref(phone: string) {
  return `tel:${latinDigits(phone).replace(/[^\d+]/g, "")}`;
}

export function smsHref(phone: string, body: string) {
  const n = latinDigits(phone).replace(/[^\d+]/g, "");
  return `sms:${n}?body=${encodeURIComponent(body)}`;
}

export function digits(phone: string) {
  return latinDigits(phone).replace(/\D/g, "");
}

export function emptyCheckin(day: string): Checkin {
  return { day, water: 0 };
}

export function isMealDone(logs: MealLog[], mealId: string, day: string) {
  return logs.some((l) => l.mealId === mealId && l.day === day);
}
