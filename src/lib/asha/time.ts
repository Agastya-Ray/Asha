import type { Lang } from "@/lib/asha/types";

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function shiftDay(days: number, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() - days);
  return todayKey(d);
}

export function toMin(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

export function minutesNow(d = new Date()) {
  return d.getHours() * 60 + d.getMinutes();
}

export function padTime(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function normTime(raw: string): string | null {
  // "08:00", "8.30 pm", and also "9 am" / "9pm" (a photo of a prescription often comes back like that)
  const m = raw.trim().match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?$/i);
  if (!m || (m[2] === undefined && !m[3])) return null;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  const ap = m[3]?.toLowerCase().replace(/\./g, "");
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return padTime(h, min);
}

const EN_HOURS = [
  "twelve",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
];

const HI_HOURS = [
  "बारह",
  "एक",
  "दो",
  "तीन",
  "चार",
  "पाँच",
  "छह",
  "सात",
  "आठ",
  "नौ",
  "दस",
  "ग्यारह",
];

const EN_ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const EN_TENS = ["", "", "twenty", "thirty", "forty", "fifty"];

/** Minutes as they are said aloud: 5 -> "oh five", 15 -> "fifteen", 45 -> "forty-five". */
function enMinutes(m: number) {
  if (m < 10) return `oh ${EN_ONES[m]}`;
  if (m < 20) return EN_ONES[m];
  const ones = m % 10;
  return ones ? `${EN_TENS[Math.floor(m / 10)]}-${EN_ONES[ones]}` : EN_TENS[Math.floor(m / 10)];
}

export function speakClock(lang: Lang, hhmm: string) {
  const [hRaw, mRaw] = hhmm.split(":").map(Number);
  const h = Number.isFinite(hRaw) ? hRaw : 0;
  const m = Number.isFinite(mRaw) ? mRaw : 0;
  const h12 = h % 12;
  if (lang === "hi") {
    const p = h < 4 ? "रात" : h < 12 ? "सुबह" : h < 17 ? "दोपहर" : h < 21 ? "शाम" : "रात";
    // "सुबह आठ बजे", "सुबह आठ बजकर पाँच मिनट"
    return m === 0 ? `${p} ${HI_HOURS[h12]} बजे` : `${p} ${HI_HOURS[h12]} बजकर ${m} मिनट`;
  }
  const p = h < 4 ? "at night" : h < 12 ? "in the morning" : h < 17 ? "in the afternoon" : h < 21 ? "in the evening" : "at night";
  const min = m === 0 ? "" : ` ${enMinutes(m)}`;
  return `${EN_HOURS[h12]}${min} ${p}`;
}

export function clockLabel(lang: Lang, d = new Date()) {
  return d.toLocaleTimeString(lang === "hi" ? "hi-IN" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function dateLabel(lang: Lang, d = new Date()) {
  return d.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function shortWeekday(day: string, lang: Lang) {
  const [y, m, d] = day.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-US", { weekday: "short" });
}
