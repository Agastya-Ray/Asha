import { medDueOn } from "@/lib/asha/schedule";
import { speakClock, shiftDay } from "@/lib/asha/time";
import type { DoseLog, Lang, Med } from "@/lib/asha/types";

export type Unmarked = { med: Med; time: string };

/**
 * Yesterday's doses (by the phone's own clock and time zone) that were neither marked taken nor skipped.
 * A medicine added today, or one added yesterday after its time, is not counted.
 */
export function unmarkedYesterday(meds: Med[], logs: DoseLog[], now = new Date()): Unmarked[] {
  const day = shiftDay(1, now);
  const date = new Date(now);
  date.setDate(date.getDate() - 1);
  const out: Unmarked[] = [];
  for (const med of meds) {
    if (!medDueOn(med, date)) continue;
    // added yesterday or today: we can't tell whether it existed at dose time
    if (med.addedOn && med.addedOn >= day) continue;
    for (const time of med.times) {
      if (!logs.some((l) => l.day === day && l.medId === med.id && l.time === time)) out.push({ med, time });
    }
  }
  return out.sort((a, b) => a.time.localeCompare(b.time));
}

/** Kind words for the morning after: no blame, never "take two", and today's doses come first. */
export function yesterdayLine(lang: Lang, items: Unmarked[]) {
  const list = items.map((i) => `${i.med.name} (${speakClock(lang, i.time)})`).join(", ");
  if (lang === "hi") {
    return {
      title: "कल की कुछ दवाइयाँ दर्ज नहीं हुईं",
      line: `${list}. कोई बात नहीं, ऐसा हो जाता है. इसकी भरपाई के लिए आज ज़्यादा न लें. बस आज की दवाइयाँ समय पर लें. पक्का न हो तो डॉक्टर से पूछ लें.`,
    };
  }
  return {
    title: items.length === 1 ? "One dose from yesterday wasn't marked" : `${items.length} doses from yesterday weren't marked`,
    line: `${list}. That's okay, it happens. Please don't take extra today to make up for it. Just take today's doses on time. If you're unsure, ask your doctor.`,
  };
}
