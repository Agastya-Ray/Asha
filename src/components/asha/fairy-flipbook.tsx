import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * The fairy as real drawn keyframes, played one after another like a flipbook (Agastya's pose sheet, sharpened 4x).
 * Every frame stands on the same floor line and is drawn at the same size, so only her pose changes.
 */

const files = import.meta.glob("@/assets/fairy/kf/*.webp", {
  eager: true,
  import: "default",
}) as Record<string, string>;
const SRC: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split("/").pop()!.replace(".webp", ""), url]),
);

/** Natural size of each keyframe in pixels. The lying and yawning row of the sheet was drawn smaller, hence `grow`. */
const SIZE: Record<string, [number, number, number?]> = {
  "01-asleep-in": [620, 542, 1.16],
  "02-asleep-out": [616, 509, 1.16],
  "03-stirs": [611, 525, 1.16],
  "04-one-eye-half": [582, 524, 1.16],
  "06-both-eyes-sleepy": [569, 557, 1.16],
  "07-yawn-start": [545, 615, 1.16],
  "08-big-yawn": [561, 654, 1.16],
  "09-yawn-end": [548, 601, 1.16],
  "10-push-up": [796, 649],
  "11-halfway": [706, 705],
  "12-sitting": [601, 799],
  "13-look-up": [632, 803],
  "14-soft-smile": [645, 793],
  "15-big-grin": [642, 778],
  "16-grin-squeeze": [640, 774],
  "17-standing": [638, 891],
  "18-arms-half": [668, 876],
  "19-arms-wide": [695, 903],
  "20-hop": [708, 866],
  blush: [561, 996],
};

export type Frame = [name: keyof typeof SIZE, ms: number];

/** Asleep: breathing in and out, slowly, for as long as nobody taps. */
export const SLEEP: Frame[] = [
  ["01-asleep-in", 1500],
  ["02-asleep-out", 1500],
];

/** Tapped: she stirs, opens one eye, then the other, pushes herself up, sits, yawns, looks up at you, smiles, grins. */
export const WAKE: Frame[] = [
  ["03-stirs", 450],
  ["01-asleep-in", 300],
  ["03-stirs", 600],
  ["04-one-eye-half", 1000],
  ["06-both-eyes-sleepy", 1100],
  ["10-push-up", 500],
  ["11-halfway", 500],
  ["12-sitting", 600],
  ["07-yawn-start", 350],
  ["08-big-yawn", 1200],
  ["09-yawn-end", 450],
  ["13-look-up", 800],
  ["14-soft-smile", 900],
  ["15-big-grin", 700],
  ["16-grin-squeeze", 1000],
];

/** Hello: she stands, her arms rise up and wide, and she hops for joy. */
export const HELLO: Frame[] = [
  ["17-standing", 350],
  ["18-arms-half", 300],
  ["19-arms-wide", 450],
  ["20-hop", 350],
  ["19-arms-wide", 300],
  ["20-hop", 350],
  ["19-arms-wide", 300],
];

export const ALL_FRAMES = Object.keys(SIZE);

/**
 * Plays `frames` once (calling `onDone` at the end) or, with `loop`, round and round. `height` is how tall a standing
 * frame is drawn, in CSS pixels; every other frame is drawn at the same scale.
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
        if (!last) setI(i + 1);
        else if (loop) setI(0);
        else onDone?.();
      },
      reduced ? 400 : frames[at][1],
    );
    return () => window.clearTimeout(t);
  }, [i, frames, loop]);

  const k = height / SIZE["17-standing"][1];
  const used = [...new Set(frames.map((f) => f[0]))];
  const current = frames[Math.min(i, frames.length - 1)][0];
  const widest = Math.max(...used.map((n) => SIZE[n][0] * (SIZE[n][2] ?? 1)));
  const tallest = Math.max(...used.map((n) => SIZE[n][1] * (SIZE[n][2] ?? 1)));

  return (
    <div
      className={cn("pointer-events-none relative", className)}
      style={{ width: widest * k, height: tallest * k }}
      role="img"
      aria-label="Asha the fairy"
    >
      {used.map((n) => {
        const [w, h, grow = 1] = SIZE[n];
        return (
          <img
            key={n}
            src={SRC[n]}
            alt=""
            draggable={false}
            className="absolute bottom-0 left-1/2 max-w-none"
            style={{
              width: w * grow * k,
              height: h * grow * k,
              transform: "translateX(-50%)",
              opacity: n === current ? 1 : 0,
            }}
          />
        );
      })}
    </div>
  );
}
