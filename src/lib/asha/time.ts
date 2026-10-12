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
  const m = raw.trim().match(/^(\d{1,2})[:.](\d{2})\s*(am|pm)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const ap = m[3]?.toLowerCase();
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

export function speakClock(lang: Lang, hhmm: string) {
  const [hRaw, mRaw] = hhmm.split(":").map(Number);
  const h = hRaw ?? 0;
  const m = mRaw ?? 0;
  const h12 = h % 12;
  if (lang === "hi") {
    const p = h < 12 ? "सुबह" : h < 17 ? "दोपहर" : h < 21 ? "शाम" : "रात";
    const min = m === 0 ? "" : m === 30 ? " तीस" : ` ${m}`;
    return `${p} ${HI_HOURS[h12]} बजे${min}`;
  }
  const p = h < 12 ? "morning" : h < 17 ? "afternoon" : h < 21 ? "evening" : "night";
  const min = m === 0 ? "" : m === 30 ? " thirty" : ` ${String(m).padStart(2, "0")}`;
  return `${EN_HOURS[h12]}${min} in the ${p}`;
}

export function clockLabel(lang: Lang, d = new Date()) {
  return d.toLocaleTimeString(lang === "hi" ? "hi-IN" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function dateLabel(lang: Lang, d = new Date()) {
  return d.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function shortWeekday(day: string, lang: Lang) {
  const [y, m, d] = day.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-US", { weekday: "short" });
}
