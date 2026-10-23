// Quiet mode: "I'm going to an event, be quiet". She stays silent for a while; medicines that come due
// only buzz a silent card, and when quiet ends she says "I'm back" and anything still not taken.
import { buildAgenda } from "@/lib/asha/schedule";
import type { AgendaItem, Lang, Persist } from "@/lib/asha/types";

export const QUIET =
  /\b(be|keep|stay) (quiet|silent)\b|\bquiet (mode|please|for)\b|\bsilen(ce|t)\b|\bshh+\b|\bdo ?n[o']?t (talk|disturb|speak)\b|\bdo not disturb\b|\bgoing (to|for|into) (an? |the |my )?(event|meeting|wedding|function|party|movie|cinema|temple|church|mosque|gurudwara|prayer|puja|class|funeral|hospital|doctor|lecture|concert)|चुप|शांत रह|आवाज़ मत|आवाज मत|मत बोल|परेशान मत|मीटिंग में|शादी में|पूजा में|मंदिर जा/i;

export const QUIET_CHOICES = [30, 60, 120, 240] as const;

const WORD_NUM: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, एक: 1, दो: 2, तीन: 3, चार: 4, पांच: 5, पाँच: 5 };

/** "for half an hour", "2 hours", "45 minutes", "आधा घंटा", "दो घंटे" → minutes (0 if none said). */
export function minutesSaid(said: string): number {
  const s = said.toLowerCase();
  if (/half an? hour|आधा घंट|आधे घंट/.test(s)) return 30;
  if (/डेढ़ घंट|an hour and a half|one and a half hours?/.test(s)) return 90;
  const h = s.match(/(\d+(?:\.\d+)?|an?|one|two|three|four|five|six|एक|दो|तीन|चार|पांच|पाँच)\s*(hours?|hrs?|घंट)/);
  if (h) return Math.round((WORD_NUM[h[1]] ?? Number(h[1])) * 60);
  const m = s.match(/(\d+)\s*(minutes?|mins?|मिनट)/);
  if (m) return Number(m[1]);
  return 0;
}

export function isQuiet(s: Pick<Persist, "quietUntil">, now = Date.now()) {
  return s.quietUntil > now;
}

/** Medicines and meals that come due (or are already due and open) between now and the end of quiet. */
export function dueWhileQuiet(s: Parameters<typeof buildAgenda>[0], until: number, now = new Date()): AgendaItem[] {
  const end = new Date(until);
  const sameDay = end.toDateString() === now.toDateString();
  const endMin = sameDay ? end.getHours() * 60 + end.getMinutes() : 24 * 60;
  return buildAgenda(s, now)
    .filter((i) => (i.state === "later" && i.minutes <= endMin) || i.state === "now" || i.state === "snoozed")
    .sort((a, b) => a.minutes - b.minutes);
}

/** What she says when quiet is over. The reminders still waiting are said right after. */
export function backLine(lang: Lang, name: string) {
  return lang === "hi"
    ? `मैं वापस आ गई${name ? ` ${name} जी` : ""}! उम्मीद है सब अच्छा रहा.`
    : `I'm back${name ? `, ${name}` : ""}! I hope it went well.`;
}
