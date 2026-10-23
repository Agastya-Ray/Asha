import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * The fairy as real drawn keyframes, played one after another like a flipbook: Agastya's pose sheet, sharpened 4x,
 * with in-between frames (RIFE) where the motion is small enough to blend cleanly. Every frame is the same 900×1080
 * canvas with her feet on the same floor line, so frames stack exactly and only her pose changes.
 */

const files = import.meta.glob("@/assets/fairy/kf/*.webp", {
  eager: true,
  import: "default",
}) as Record<string, string>;
const SRC: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split("/").pop()!.replace(".webp", ""), url]),
);

/** Canvas size, how tall she is when standing, and the gap under her feet, in canvas pixels. */
const CANVAS: [number, number] = [900, 1080];
const STANDING = 891;
const FLOOR = 40;

export type Frame = [name: string, ms: number];

/** Key `a` to key `b` through their three in-betweens (`a-b-1…3`), `ms` per in-between. */
const tween = (a: string, b: string, ms: number, back = false): Frame[] => {
  const steps: Frame[] = [1, 2, 3].map((i) => [`${a}-${b}-${i}`, ms]);
  return back ? steps.reverse() : steps;
};

/** Asleep: breathing in and out, slowly, for as long as nobody taps. */
export const SLEEP: Frame[] = [
  ["01-asleep-in", 900],
  ...tween("01", "02", 160),
  ["02-asleep-out", 900],
  ...tween("01", "02", 160, true),
];

/** Tapped: she stirs, opens one eye, then the other, pushes herself up, sits, yawns, looks up at you, smiles, grins. */
export const WAKE: Frame[] = [
  ["03-stirs", 450],
  ["01-asleep-in", 300],
  ["03-stirs", 500],
  ...tween("03", "04", 90),
  ["04-one-eye-half", 900],
  ...tween("04", "06", 90),
  ["06-both-eyes-sleepy", 1000],
  ["10-push-up", 400],
  ...tween("10", "11", 100),
  ["11-halfway", 400],
  ["12-sitting", 600],
  ["07-yawn-start", 250],
  ...tween("07", "08", 100),
  ["08-big-yawn", 1100],
  ...tween("08", "09", 100),
  ["09-yawn-end", 400],
  ["13-look-up", 600],
  ...tween("13", "14", 100),
  ["14-soft-smile", 800],
  ...tween("14", "15", 90),
  ["15-big-grin", 600],
  ["16-grin-squeeze", 1000],
];

const HOP: Frame[] = [
  ...tween("19", "20", 70),
  ["20-hop", 300],
  ...tween("19", "20", 70, true),
  ["19-arms-wide", 300],
];

/** Hello: she stands, her arms rise up and wide, and she hops for joy, twice. */
export const HELLO: Frame[] = [
  ["17-standing", 300],
  ...tween("17", "18", 80),
  ["18-arms-half", 250],
  ["19-arms-wide", 400],
  ...HOP,
  ...HOP,
];

/** Bouncing for joy, round and round. */
export const JOY: Frame[] = [["19-arms-wide", 300], ...HOP.slice(0, -1)];

/**
 * Plays `frames` once (calling `onDone` at the end) or, with `loop`, round and round. `height` is how tall she is drawn
 * when standing, in CSS pixels; every other frame is drawn at the same scale.
 */
export function FairyFlipbook({
  frames,
  loop = false,
  height,
  onDone,
  className,
}: {
  frames: Frame[];
  loop?: boolean;
  height: number;
  onDone?: () => void;
  className?: string;
}) {
  const [i, setI] = useState(0);
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => setI(reduced && !loop ? frames.length - 1 : 0), [frames]);

  useEffect(() => {
    if (reduced && loop) return;
    const at = Math.min(i, frames.length - 1);
    const last = at >= frames.length - 1;
    const t = window.setTimeout(
      () => {
        if (!last) setI(at + 1);
        else if (loop) setI(0);
        else onDone?.();
      },
      reduced ? 400 : frames[at][1],
    );
    return () => window.clearTimeout(t);
  }, [i, frames, loop]);

  const k = height / STANDING;
  const used = [...new Set(frames.map((f) => f[0]))];
  const current = frames[Math.min(i, frames.length - 1)][0];

  return (
    <div
      className={cn("pointer-events-none relative", className)}
      style={{ width: CANVAS[0] * k, height: CANVAS[1] * k, marginBottom: -FLOOR * k }}
      role="img"
      aria-label="Asha the fairy"
    >
      {used.map((n) => (
        <img
          key={n}
          src={SRC[n]}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full max-w-none"
          style={{ opacity: n === current ? 1 : 0 }}
        />
      ))}
    </div>
  );
}
