// Morning and night with the fairy: what day it is, the weather, today's plan, and a kind recap at night.
import { Geolocation } from "@capacitor/geolocation";
import { medDueOn } from "@/lib/asha/schedule";
import { person } from "@/lib/asha/speech";
import { speakClock, todayKey, toMin } from "@/lib/asha/time";
import type { Lang, Persist } from "@/lib/asha/types";

type S = Pick<Persist, "name" | "meds" | "meals" | "doseLogs" | "checkins">;

export type Weather = { day: string; temp: number; code: number };

const WKEY = "asha.weather.v1";

/** "Saturday, the 24th of October" / "शनिवार, 24 अक्टूबर" */
export function dayWords(lang: Lang, d: Date) {
  if (lang === "hi")
    return d.toLocaleDateString("hi-IN", { weekday: "long", day: "numeric", month: "long" });
  const n = d.getDate();
  const th =
    n % 10 === 1 && n !== 11
      ? "st"
      : n % 10 === 2 && n !== 12
        ? "nd"
        : n % 10 === 3 && n !== 13
          ? "rd"
          : "th";
  const weekday = d.toLocaleDateString("en-GB", { weekday: "long" });
  const month = d.toLocaleDateString("en-GB", { month: "long" });
  return `${weekday}, the ${n}${th} of ${month}`;
}

/** Doses due on a day, earliest first. */
export function dosesOn(s: S, d: Date) {
  const out: { medId: string; name: string; time: string }[] = [];
  for (const m of s.meds)
    if (medDueOn(m, d)) for (const time of m.times) out.push({ medId: m.id, name: m.name, time });
  return out.sort((a, b) => a.time.localeCompare(b.time));
}

/** Open-Meteo weather codes, in plain words, with one small tip. */
function weatherWords(lang: Lang, w: Weather) {
  const c = w.code;
  const kind =
    c === 0
      ? "clear"
      : c <= 3
        ? "cloudy"
        : c <= 48
          ? "foggy"
          : c <= 67 || (c >= 80 && c <= 82)
            ? "rain"
            : c <= 77
              ? "cold"
              : "storm";
  const hot = w.temp >= 33;
  const cold = w.temp <= 12;
  if (lang === "hi") {
    const sky = {
      clear: "धूप खिली है",
      cloudy: "बादल हैं",
      foggy: "कोहरा है",
      rain: "बारिश हो सकती है",
      cold: "ठंड है",
      storm: "आँधी-बारिश हो सकती है",
    }[kind];
    const tip =
      kind === "rain" || kind === "storm"
        ? "बाहर जाएँ तो छाता ले लें."
        : hot
          ? "पानी पीते रहें और दोपहर की धूप से बचें."
          : cold
            ? "गरम कपड़े पहन लें."
            : "";
    return `आज ${Math.round(w.temp)} डिग्री है, ${sky}. ${tip}`.trim();
  }
  const sky = {
    clear: "and sunny",
    cloudy: "and cloudy",
    foggy: "and foggy",
    rain: "and it may rain",
    cold: "and cold",
    storm: "and there may be a storm",
  }[kind];
  const tip =
    kind === "rain" || kind === "storm"
      ? "Take an umbrella if you go out."
      : hot
        ? "Keep sipping water and stay out of the midday sun."
        : cold
          ? "Wear something warm."
          : "";
  return `It's ${Math.round(w.temp)} degrees ${sky}. ${tip}`.trim();
}

/** The morning words: the day, the weather (when known), and what today holds. */
export function morningRitual(lang: Lang, s: S, d: Date, weather?: Weather | null) {
  const who = person(s.name, lang);
  const doses = dosesOn(s, d);
  const first = doses[0];
  const parts: string[] = [];
  if (lang === "hi") {
    parts.push(`सुप्रभात, ${who}! आज ${dayWords(lang, d)} है.`);
    if (weather) parts.push(weatherWords(lang, weather));
    if (doses.length)
      parts.push(
        `आज ${doses.length} बार दवा है. पहली ${first.name}, ${speakClock(lang, first.time)}.`,
      );
    else parts.push("आज कोई दवा नहीं है.");
    parts.push("शुरुआत एक गिलास पानी से करें. मैं पूरे दिन साथ हूँ.");
  } else {
    parts.push(`Good morning, ${who}! It's ${dayWords(lang, d)}.`);
    if (weather) parts.push(weatherWords(lang, weather));
    if (doses.length)
      parts.push(
        `Today there ${doses.length === 1 ? "is 1 dose" : `are ${doses.length} doses`}. The first is ${first.name} at ${speakClock(lang, first.time)}.`,
      );
    else parts.push("No medicines today.");
    parts.push("Start with a glass of water. I'm with you all day.");
  }
  return parts.join(" ");
}

/** The night words: a gentle recap that never scolds, then good night. */
export function nightRitual(lang: Lang, s: S, d: Date) {
  const who = person(s.name, lang);
  const day = todayKey(d);
  const nowMin = d.getHours() * 60 + d.getMinutes();
  const marked = (x: { medId: string; time: string }) =>
    s.doseLogs.find((l) => l.day === day && l.medId === x.medId && l.time === x.time);
  const all = dosesOn(s, d);
  // a dose from the last two hours (or still ahead) that isn't marked is still to take: say so, don't count it
  const still = all.filter((x) => !marked(x) && toMin(x.time) > nowMin - 120);
  const doses = all.filter((x) => !still.includes(x));
  const taken = doses.filter((x) => marked(x)?.status === "taken").length;
  const water = s.checkins.find((c) => c.day === day)?.water ?? 0;
  const parts: string[] = [];
  if (lang === "hi") {
    parts.push(`${who}, आज का दिन लगभग पूरा हुआ.`);
    if (still.length)
      parts.push(
        `सोने से पहले बस यह बाकी है: ${still.map((x) => `${x.name}, ${speakClock(lang, x.time)}`).join("; ")}.`,
      );
    if (doses.length && taken === doses.length)
      parts.push(
        still.length ? "बाकी सब आपने ले लीं. शाबाश!" : "आपने आज की सारी दवाइयाँ लीं. शाबाश!",
      );
    else if (doses.length && taken > 0)
      parts.push(`आपने ${doses.length} में से ${taken} दवाइयाँ लीं. कोई बात नहीं, कल नया दिन है.`);
    else if (doses.length)
      parts.push("आज दवाइयाँ दर्ज नहीं हुईं. कोई बात नहीं, कल हम साथ याद रखेंगे.");
    if (water > 0) parts.push(`${water} गिलास पानी भी पिया.`);
    parts.push("आराम से सोइए. सुबह मिलते हैं. शुभ रात्रि!");
  } else {
    parts.push(`${who}, the day is nearly done.`);
    if (still.length)
      parts.push(
        `Just this before bed: ${still.map((x) => `${x.name} at ${speakClock(lang, x.time)}`).join("; ")}.`,
      );
    if (doses.length && taken === doses.length)
      parts.push(
        still.length
          ? "You took all the others. Well done!"
          : "You took every medicine today. Well done!",
      );
    else if (doses.length && taken > 0)
      parts.push(
        `You took ${taken} of ${doses.length} medicines. That's alright, tomorrow is a new day.`,
      );
    else if (doses.length)
      parts.push("No medicines were marked today. That's okay, we'll remember together tomorrow.");
    if (water > 0) parts.push(`And ${water} glass${water === 1 ? "" : "es"} of water.`);
    parts.push("Sleep well. See you in the morning. Good night!");
  }
  return parts.join(" ");
}

/**
 * Said by Android at bedtime, possibly hours after the app last saw the doses, so no counts here
 * (a stale "3 of 5" would scold for doses that were taken). Tomorrow's first medicine instead.
 */
export function nightLineAhead(lang: Lang, s: S, tomorrow: Date) {
  const who = person(s.name, lang);
  const first = dosesOn(s, tomorrow)[0];
  if (lang === "hi") {
    const next = first
      ? ` कल सुबह पहली दवा ${first.name} है, ${speakClock(lang, first.time)}.`
      : "";
    return `शुभ रात्रि, ${who}. आज के लिए बस इतना.${next} आराम से सोइए, मैं सुबह यहीं हूँ.`;
  }
  const next = first
    ? ` Tomorrow's first medicine is ${first.name} at ${speakClock(lang, first.time)}.`
    : "";
  return `Good night, ${who}. That's all for today.${next} Sleep well, I'll be here in the morning.`;
}

/** The weather saved earlier today, if any (Android's morning greeting can use it). */
export function savedWeather(day = todayKey()): Weather | null {
  try {
    const w = JSON.parse(localStorage.getItem(WKEY) ?? "null") as Weather | null;
    return w?.day === day ? w : null;
  } catch {
    return null;
  }
}

/** Today's weather from Open-Meteo (free, no key), using a rough location. Once a day; null when unknown. */
export async function todaysWeather(): Promise<Weather | null> {
  const day = todayKey();
  try {
    const saved = JSON.parse(localStorage.getItem(WKEY) ?? "null") as Weather | null;
    if (saved?.day === day) return saved;
  } catch {
    /* fetch again */
  }
  try {
    const pos = await Promise.race([
      Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 6000,
        maximumAge: 6 * 3600 * 1000,
      }),
      new Promise<null>((r) => setTimeout(() => r(null), 7000)),
    ]);
    if (!pos) return null;
    const { latitude, longitude } = pos.coords;
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(2)}&longitude=${longitude.toFixed(2)}&daily=weather_code,temperature_2m_max&timezone=auto&forecast_days=1`,
    );
    if (!res.ok) return null;
    const j = (await res.json()) as {
      daily?: { weather_code?: number[]; temperature_2m_max?: number[] };
    };
    const code = j.daily?.weather_code?.[0];
    const temp = j.daily?.temperature_2m_max?.[0];
    if (typeof code !== "number" || typeof temp !== "number") return null;
    const w = { day, code, temp };
    localStorage.setItem(WKEY, JSON.stringify(w));
    return w;
  } catch {
    return null;
  }
}
