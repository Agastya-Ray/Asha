import type { AgendaItem, Checkin, Lang } from "@/lib/asha/types";
import { minutesNow, todayKey, toMin } from "@/lib/asha/time";

/**
 * What the fairy on the elder's phone is doing right now, most important first:
 * a family note to deliver, a medicine or meal that is due or missed, a daily "how are you?",
 * comfort after a low mood, a little cheer once every dose so far is marked, or nothing (asleep at night).
 */
export type Nudge =
  | { kind: "due"; item: AgendaItem; late: boolean }
  | { kind: "checkin" }
  | { kind: "comfort" }
  | { kind: "cheer" }
  | { kind: "none" };

export function awake(wakeTime: string, sleepTime: string, now = new Date()) {
  const m = minutesNow(now);
  const a = toMin(wakeTime || "07:00");
  const b = toMin(sleepTime || "21:30");
  return a <= b ? m >= a && m < b : m >= a || m < b;
}

export function companionNudge(
  agenda: AgendaItem[],
  checkins: Checkin[],
  wakeTime: string,
  sleepTime: string,
  now = new Date(),
): Nudge {
  // due or missed medicine first, then meals; snoozed ones wait for their snooze to end
  const due = agenda.filter((i) => i.state === "now" || i.state === "open");
  const pick = due.find((i) => i.kind === "med") ?? due[0];
  if (pick) return { kind: "due", item: pick, late: pick.state === "open" };
  if (!awake(wakeTime, sleepTime, now)) return { kind: "none" };
  // check in once a day, from two hours after waking
  const today = checkins.find((c) => c.day === todayKey(now));
  if (!today?.mood && minutesNow(now) >= toMin(wakeTime || "07:00") + 120) return { kind: "checkin" };
  // a low mood today: she stays close and offers to reach family
  if (today?.mood && today.mood <= 2) return { kind: "comfort" };
  const meds = agenda.filter((i) => i.kind === "med");
  if (meds.length && meds.every((i) => i.state === "taken" || i.state === "skipped" || i.state === "later") && meds.some((i) => i.state === "taken")) {
    return { kind: "cheer" };
  }
  return { kind: "none" };
}

export function nudgeBubble(n: Nudge, lang: Lang): string {
  const hi = lang === "hi";
  if (n.kind === "due") {
    const what = n.item.title;
    if (n.item.kind === "med") return n.late ? (hi ? `${what} अभी बाकी है. मुझे छुएँ` : `${what} is still waiting. Tap me`) : hi ? `${what} का समय! मुझे छुएँ` : `Time for ${what}! Tap me`;
    return n.late ? (hi ? `${what} हो गया? मुझे छुएँ` : `Had your ${what.toLowerCase()}? Tap me`) : hi ? `${what} का समय! मुझे छुएँ` : `${what} time! Tap me`;
  }
  if (n.kind === "checkin") return hi ? "आज आप कैसा महसूस कर रही हैं?" : "How are you feeling today?";
  if (n.kind === "comfort") return hi ? "मैं यहीं हूँ. परिवार को संदेश भेजें?" : "I'm here with you. Send family a note?";
  if (n.kind === "cheer") return hi ? "शाबाश! अब तक की सब दवाइयाँ ले लीं" : "Well done! All doses so far taken";
  return "";
}

export function checkinQuestion(lang: Lang, name: string) {
  return lang === "hi" ? `${name ? `${name} जी, ` : ""}आज आप कैसा महसूस कर रही हैं? दर्द या मन के बारे में मुझे बताइए.` : `${name ? `${name}, ` : ""}how are you feeling today? Tell me about any pain and your mood.`;
}
