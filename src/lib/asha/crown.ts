import type { PixieMood } from "@/components/asha/pixie";
import type { Persist } from "@/lib/asha/types";
import { todayKey } from "@/lib/asha/time";

/**
 * She grows: a new flower opens in the fairy's crown after days spent together.
 * Days only ever add up. A missed day never takes a flower away and is never mentioned.
 */
export const MILESTONES = [1, 3, 7, 14, 30, 60, 100];

export function flowersFor(days: number) {
  return MILESTONES.filter((m) => days >= m).length;
}

/** Each new flower has its own colour, so the change is easy to see. */
export const FLOWERS = [
  { petal: "#ff6fae", heart: "#ffd34d", en: "a pink blossom", hi: "गुलाबी फूल" },
  { petal: "#a77bff", heart: "#fff1a0", en: "a lavender flower", hi: "बैंगनी फूल" },
  { petal: "#4fb8ff", heart: "#ffe066", en: "a blue forget-me-not", hi: "नीला फूल" },
  { petal: "#ff8a5c", heart: "#fff7e0", en: "a coral flower", hi: "मूंगे रंग का फूल" },
  { petal: "#ffffff", heart: "#ffc21a", en: "a white daisy", hi: "सफ़ेद डेज़ी" },
  { petal: "#ffc928", heart: "#e46f00", en: "a golden marigold", hi: "सुनहरा गेंदा" },
  { petal: "#e85bd2", heart: "#fff", en: "a magenta lotus", hi: "गुलाबी कमल" },
];

/** Where each flower sits along the crown: the top first, then out to the sides. -1 is the left end, 1 the right. */
export const SLOTS = [0, -0.5, 0.5, -0.88, 0.88, -0.25, 0.25];

/**
 * The crown in each picture, as fractions of the image: centre x, top y, half-width, tilt in degrees,
 * plus the image size (so the flowers line up whatever box she is drawn in). Leaf and floor poses have none.
 */
export const CROWNS: Partial<
  Record<PixieMood, { x: number; y: number; span: number; tilt: number; w: number; h: number }>
> = {
  idle: { x: 0.47, y: 0.06, span: 0.25, tilt: 0, w: 699, h: 921 },
  happy: { x: 0.55, y: 0.07, span: 0.22, tilt: 0, w: 576, h: 681 },
  talk: { x: 0.53, y: 0.065, span: 0.2, tilt: 0, w: 579, h: 699 },
  thinking: { x: 0.53, y: 0.07, span: 0.2, tilt: 0, w: 582, h: 681 },
  asking: { x: 0.5, y: 0.08, span: 0.2, tilt: 0, w: 579, h: 660 },
  sad: { x: 0.53, y: 0.06, span: 0.2, tilt: 0, w: 582, h: 657 },
  wave: { x: 0.47, y: 0.05, span: 0.25, tilt: 0, w: 504, h: 678 },
  jump: { x: 0.45, y: 0.055, span: 0.24, tilt: 0, w: 498, h: 600 },
  point: { x: 0.53, y: 0.05, span: 0.23, tilt: 0, w: 528, h: 657 },
  fly: { x: 0.43, y: 0.07, span: 0.23, tilt: 0, w: 561, h: 645 },
  sit: { x: 0.45, y: 0.08, span: 0.26, tilt: 0, w: 486, h: 549 },
  stretch: { x: 0.46, y: 0.07, span: 0.26, tilt: 0, w: 318, h: 363 },
  blush: { x: 0.46, y: 0.07, span: 0.3, tilt: 0, w: 372, h: 429 },
  tired: { x: 0.45, y: 0.11, span: 0.28, tilt: 0, w: 321, h: 378 },
  wakeup: { x: 0.38, y: 0.07, span: 0.24, tilt: 0, w: 294, h: 342 },
  flower: { x: 0.45, y: 0.06, span: 0.23, tilt: 0, w: 285, h: 351 },
  book: { x: 0.48, y: 0.13, span: 0.23, tilt: 0, w: 324, h: 354 },
  bag: { x: 0.47, y: 0.06, span: 0.23, tilt: 0, w: 267, h: 369 },
  butterfly: { x: 0.33, y: 0.11, span: 0.2, tilt: -35, w: 279, h: 366 },
  flyside: { x: 0.5, y: 0.08, span: 0.15, tilt: 20, w: 402, h: 489 },
  flyup: { x: 0.45, y: 0.06, span: 0.2, tilt: -20, w: 507, h: 522 },
  behind: { x: 0.4, y: 0.06, span: 0.3, tilt: 0, w: 288, h: 507 },
};

/** Did the person do anything with Asha today: a dose taken, a meal, water, or how they feel? */
export function togetherToday(
  s: Pick<Persist, "doseLogs" | "mealLogs" | "checkins">,
  day = todayKey(),
) {
  if (s.doseLogs.some((l) => l.day === day && l.status === "taken")) return true;
  if (s.mealLogs.some((l) => l.day === day)) return true;
  const c = s.checkins.find((x) => x.day === day);
  return Boolean(c && (c.water > 0 || c.mood));
}

/** For people who used Asha before the crown: count the days already in their logs. */
export function daysInLogs(s: Pick<Persist, "doseLogs" | "mealLogs" | "checkins">) {
  const days = new Set<string>();
  s.doseLogs.forEach((l) => l.status === "taken" && days.add(l.day));
  s.mealLogs.forEach((l) => days.add(l.day));
  s.checkins.forEach((c) => (c.water > 0 || c.mood) && days.add(c.day));
  return [...days].sort();
}
