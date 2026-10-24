import type { Lang, Memory } from "@/lib/asha/types";
import { latinDigits } from "@/lib/asha/schedule";
import { padTime, speakClock, todayKey } from "@/lib/asha/time";

/**
 * She remembers small things. "Remind me to call Ravi at 5", "I'm going to the temple tomorrow".
 * Read on the phone, without internet. What is missing (what, or when) she asks about, like a person would.
 */

export const REMIND =
  /\bremind me\b|\bremember (to|that|my|the)\b|\bdon'?t let me forget\b|याद दिला|याद रख|भूलने मत/i;

const PLAN_VERB =
  /\b(i'?m going|i am going|we'?re going|we are going|i will|i'?ll|i have (a|an|my)|i've got|is coming|are coming|will come|visiting|appointment|birthday|anniversary|wedding|function|pooja|puja)\b|जाना है|जा रही|जा रहा|जाएँगे|जाऊँगी|जाऊँगा|आने वाल|आ रहे|आ रही|आ रहा|आएगा|आएगी|आएँगे|जन्मदिन|शादी|पूजा|अपॉइंटमेंट/i;

const DAY_WORD =
  /\b(today|tonight|tomorrow|day after tomorrow|this (morning|afternoon|evening)|next week|on (monday|tuesday|wednesday|thursday|friday|saturday|sunday)|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|आज|कल|परसों|सोमवार|मंगलवार|बुधवार|गुरुवार|शुक्रवार|शनिवार|रविवार|अगले हफ़्ते|अगले हफ्ते/i;

const WEEKDAYS_EN = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const WEEKDAYS_HI = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];

export type Heard = {
  kind: "remind" | "plan";
  /** what to remind about, in the person's words ("call Ravi"), or "" if not said */
  what: string;
  /** the day it is about, YYYY-MM-DD, or "" */
  day: string;
  /** the time, ms, when a clock time (or "in 2 hours") was said */
  at: number;
};

/** Is this a "remember this" sentence, or a plan worth asking about? */
export function hearMemory(said: string, now = new Date()): Heard | null {
  const text = latinDigits(said.trim());
  const remind = REMIND.test(text);
  const plan = !remind && PLAN_VERB.test(text) && DAY_WORD.test(text);
  if (!remind && !plan) return null;
  const day = dayOf(text, now);
  const at = timeOf(text, day, now);
  return {
    kind: remind ? "remind" : "plan",
    what: whatOf(text),
    day: at ? todayKey(new Date(at)) : day,
    at,
  };
}

function dayOf(text: string, now: Date) {
  const d = new Date(now);
  const t = text.toLowerCase();
  if (/day after tomorrow|परसों/.test(t)) d.setDate(d.getDate() + 2);
  else if (/tomorrow|\bकल\b|^कल|\sकल/.test(t)) d.setDate(d.getDate() + 1);
  else if (/next week|अगले हफ़्ते|अगले हफ्ते/.test(t)) d.setDate(d.getDate() + 7);
  else {
    const i = WEEKDAYS_EN.findIndex((w) => t.includes(w));
    const j = i >= 0 ? i : WEEKDAYS_HI.findIndex((w) => t.includes(w));
    if (j >= 0) d.setDate(d.getDate() + ((j - d.getDay() + 7) % 7 || 7));
    else if (!/today|tonight|this (morning|afternoon|evening)|आज/.test(t)) return "";
  }
  return todayKey(d);
}

function timeOf(text: string, day: string, now: Date) {
  const t = text.toLowerCase();
  const later = t.match(/\bin (an?|\d+) (minute|min|hour)s?\b|(\d+) (मिनट|घंटे) (में|बाद)/);
  if (later) {
    const n = later[1] ? (/^an?$/.test(later[1]) ? 1 : Number(later[1])) : Number(later[3]);
    const unit = later[2] ?? later[4];
    return now.getTime() + n * (/hour|घंटे/.test(unit) ? 60 : 1) * 60000;
  }
  const m = t.match(
    /\bat (\d{1,2})(?:[:.](\d{2}))?\s*(a\.?m\.?|p\.?m\.?|o'?clock)?|\b(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?m\.?|p\.?m\.?)|(\d{1,2})(?:[:.](\d{2}))?\s*बजे/,
  );
  let h = -1;
  let min = 0;
  let mer = "";
  if (m) {
    h = Number(m[1] ?? m[4] ?? m[7]);
    min = Number(m[2] ?? m[5] ?? m[8] ?? 0);
    mer = (m[3] ?? m[6] ?? "").replace(/\./g, "");
  }
  const morning = /morning|सुबह/.test(t);
  const afternoon = /afternoon|दोपहर/.test(t);
  const evening = /evening|शाम/.test(t);
  const night = /night|tonight|रात/.test(t);
  if (h < 0) {
    // "tomorrow morning" with no clock time: a sensible hour
    if (!day && !morning && !afternoon && !evening && !night) return 0;
    if (!morning && !afternoon && !evening && !night) return 0;
    h = morning ? 9 : afternoon ? 14 : evening ? 18 : 20;
  } else if (h > 23 || min > 59) return 0;
  else if (mer.startsWith("p") && h < 12) h += 12;
  else if (mer.startsWith("a") && h === 12) h = 0;
  else if (!mer.startsWith("a") && !mer.startsWith("p") && h <= 12) {
    // no am/pm: read it like a person would
    if (afternoon || evening || night) h = h < 12 ? h + 12 : h;
    else if (!morning && h >= 1 && h <= 6) h += 12;
  }
  const [y, mo, d] = (day || todayKey(now)).split("-").map(Number);
  let at = new Date(y, mo - 1, d, h, min).getTime();
  // "at 5" said at 6 pm with no day: tomorrow at 5
  if (!day && at <= now.getTime()) at += 86400000;
  return at;
}

/** The thing itself: "remind me to call Ravi at 5 pm" → "call Ravi". */
function whatOf(text: string) {
  let w = text
    .replace(/^(hey |ok |okay |please |titli,? |asha,? )+/i, "")
    .replace(
      /\b(can you |could you |please )?(remind me|remember|don'?t let me forget)( to| about| that)?\b/i,
      "",
    )
    .replace(
      /\b(in (an?|\d+) (minute|min|hour)s?|at \d{1,2}([:.]\d{2})?\s*(a\.?m\.?|p\.?m\.?|o'?clock)?|\d{1,2}([:.]\d{2})?\s*(a\.?m\.?|p\.?m\.?))\b/gi,
      "",
    )
    .replace(
      /\b(day after tomorrow|tomorrow|today|tonight|next week|this (morning|afternoon|evening)|in the (morning|afternoon|evening)|on (monday|tuesday|wednesday|thursday|friday|saturday|sunday)|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
      "",
    )
    .replace(/(मुझे )?(याद दिला(ना|देना|दें|दीजिए|ओ|इए)?|याद रख(ना|ें|िए)?|भूलने मत देना)/g, "")
    .replace(
      /(\d+ (मिनट|घंटे) (में|बाद)|\d{1,2}([:.]\d{2})? बजे|परसों|आज|कल|सुबह|दोपहर|शाम|रात)/g,
      "",
    )
    .replace(/\b(later|again|morning|afternoon|evening|night)\b|बाद में|फिर से/gi, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s,.!-]+|[\s,.!?-]+$/g, "")
    .trim();
  // "that my grandson is coming" → "my grandson is coming"
  w = w.replace(/^(to|about|that|ki|कि)\s+/i, "");
  return w.length >= 2 ? w.slice(0, 120) : "";
}

/** "today at five in the evening", "tomorrow at nine in the morning", "on Sun 27 Oct at …" */
export function whenWords(at: number, lang: Lang, now = new Date()) {
  const d = new Date(at);
  const clock = speakClock(lang, padTime(d.getHours(), d.getMinutes()));
  const diff = Math.round(
    (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() -
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      86400000,
  );
  if (lang === "hi") {
    const day =
      diff === 0
        ? "आज"
        : diff === 1
          ? "कल"
          : diff === 2
            ? "परसों"
            : d.toLocaleDateString("hi-IN", { weekday: "long", day: "numeric", month: "short" });
    return `${day} ${clock}`;
  }
  const day =
    diff === 0
      ? "today"
      : diff === 1
        ? "tomorrow"
        : `on ${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}`;
  return `${day} at ${clock}`;
}

/** Choices for "when shall I remind you?", as times from now. */
export function whenChoices(now = new Date(), day = "", eventAt = 0) {
  const at = (dayKey: string, h: number, m = 0) => {
    const [y, mo, d] = dayKey.split("-").map(Number);
    return new Date(y, mo - 1, d, h, m).getTime();
  };
  const today = todayKey(now);
  const tomorrow = todayKey(new Date(now.getTime() + 86400000));
  const out: { at: number; en: string; hi: string }[] = [];
  if (eventAt) {
    const before = new Date(eventAt - 60 * 60000);
    const hhmm = padTime(before.getHours(), before.getMinutes());
    out.push({
      at: before.getTime(),
      en: `An hour before (${speakClock("en", hhmm)})`,
      hi: `एक घंटा पहले (${speakClock("hi", hhmm)})`,
    });
  }
  if (day && day !== today) {
    const before = todayKey(new Date(at(day, 12) - 86400000));
    out.push({ at: at(day, 9), en: "That morning, 9:00", hi: "उस दिन सुबह 9 बजे" });
    if (before !== today || now.getHours() < 18)
      out.push({ at: at(before, 19), en: "The evening before, 7:00", hi: "एक दिन पहले शाम 7 बजे" });
  } else {
    out.push({ at: now.getTime() + 60 * 60000, en: "In 1 hour", hi: "1 घंटे में" });
    if (now.getHours() < 17)
      out.push({ at: at(today, 18), en: "This evening, 6:00", hi: "आज शाम 6 बजे" });
    out.push({ at: at(tomorrow, 9), en: "Tomorrow morning, 9:00", hi: "कल सुबह 9 बजे" });
  }
  return out.filter((c) => c.at > now.getTime());
}

/** For Talk: the things she is keeping in mind. */
export function memoryContext(list: Memory[]) {
  const open = list.filter((m) => !m.done).slice(0, 8);
  if (!open.length) return "";
  return `Things the person asked Asha to remember: ${open
    .map(
      (m) =>
        `${m.what || m.said}${m.at ? ` (remind ${new Date(m.at).toLocaleString("en-IN")})` : m.day ? ` (on ${m.day})` : ""}`,
    )
    .join("; ")}.`;
}

/** "Kamla, you asked me to remind you: call Ravi." */
export function dueLine(lang: Lang, name: string, what: string) {
  return lang === "hi"
    ? `${name ? `${name}, ` : ""}आपने याद दिलाने को कहा था: ${what}.`
    : `${name ? `${name}, ` : ""}you asked me to remind you: ${what}.`;
}
