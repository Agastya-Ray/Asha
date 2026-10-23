import { useAsha } from "@/lib/asha/store";
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { CrownFlowers } from "@/components/asha/ideas/crown";
import idle from "@/assets/fairy/idle.webp";
import happy from "@/assets/fairy/happy.webp";
import thinking from "@/assets/fairy/thinking.webp";
import asking from "@/assets/fairy/asking.webp";
import talk from "@/assets/fairy/talk.webp";
import sad from "@/assets/fairy/sad.webp";
import shy from "@/assets/fairy/shy.webp";
import yawn from "@/assets/fairy/yawn.webp";
import sleep from "@/assets/fairy/sleep.webp";
import wave from "@/assets/fairy/wave.webp";
import jump from "@/assets/fairy/jump.webp";
import fly from "@/assets/fairy/fly.webp";
import point from "@/assets/fairy/point.webp";
import sit from "@/assets/fairy/sit.webp";
import behind from "@/assets/fairy/behind.webp";
import flyside from "@/assets/fairy/flyside.webp";
import flyup from "@/assets/fairy/flyup.webp";
import blush from "@/assets/fairy/blush.webp";
import tired from "@/assets/fairy/tired.webp";
import stretch from "@/assets/fairy/stretch.webp";
import wakeup from "@/assets/fairy/wakeup.webp";
import flower from "@/assets/fairy/flower.webp";
import book from "@/assets/fairy/book.webp";
import butterfly from "@/assets/fairy/butterfly.webp";
import bag from "@/assets/fairy/bag.webp";

/**
 * Asha's fairy: a chibi girl with big teal eyes, long golden hair, a flower crown, a red dress and
 * teal butterfly wings, one picture per mood or pose (cut from Agastya's character sheets): waving hello,
 * flying, pointing at a reminder, jumping for joy, sitting down to rest, stretching in the morning, tired at bedtime,
 * blushing, bringing a flower, reading, chasing a butterfly, carrying the family's love notes in her bag. Sleepy or shy she
 * hides under a big leaf; asleep she lies on the floor under it. Motion (bobbing, leaning toward a tap,
 * sparkles, z's) is added on top in CSS.
 */

export type PixieMood =
  | "idle"
  | "happy"
  | "sleep"
  | "talk"
  | "sad"
  | "yawn"
  | "thinking"
  | "asking"
  | "shy"
  | "wave"
  | "jump"
  | "fly"
  | "point"
  | "sit"
  | "behind"
  | "flyside"
  | "flyup"
  | "blush"
  | "tired"
  | "stretch"
  | "wakeup"
  | "flower"
  | "book"
  | "butterfly"
  | "bag";

const ART: Record<PixieMood, string> = { idle, happy, thinking, asking, talk, sad, shy, yawn, sleep, wave, jump, fly, point, sit, behind, flyside, flyup, blush, tired, stretch, wakeup, flower, book, butterfly, bag };

type Look = { x: number; y: number } | undefined;

export function Pixie({ mood = "idle", look, className, style }: { mood?: PixieMood; look?: Look; className?: string; style?: CSSProperties }) {
  // she leans a little toward whatever was just tapped
  const fairyName = useAsha((s) => s.fairyName);
  const lean = look ? { transform: `translateX(${look.x * 4}%) rotate(${look.x * 5}deg)` } : undefined;
  return (
    <div className={cn("pixie relative", `pixie-${mood}`, className)} style={style} role="img" aria-label={`${fairyName || "Your fairy"}${mood === "sleep" ? ", asleep" : ""}`}>
      <div className="pixie-glow absolute inset-0" />
      <div className="pixie-lean absolute inset-0" style={lean}>
        <div className="pixie-art absolute inset-0">
          <img src={ART[mood]} alt="" draggable={false} className="absolute inset-0 h-full w-full object-contain object-bottom" />
          <CrownFlowers mood={mood} />
        </div>
      </div>
      <Extras mood={mood} />
    </div>
  );
}

/** Little extras around her: sparkles when happy, a thought bubble, a question mark, falling z's. */
function Extras({ mood }: { mood: PixieMood }) {
  const star = "M0 -6 L1.4 -1.4 L6 0 L1.4 1.4 L0 6 L-1.4 1.4 L-6 0 L-1.4 -1.4 Z";
  if (mood === "happy" || mood === "jump" || mood === "flyup" || mood === "shy" || mood === "blush")
    return (
      <svg viewBox="0 0 100 120" className="pixie-sparkles pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        {(mood !== "shy" && mood !== "blush"
          ? [
              [8, 30, 1],
              [92, 26, 0.8],
              [6, 80, 0.7],
              [94, 74, 0.9],
            ]
          : [
              [10, 40, 0.6],
              [90, 50, 0.6],
            ]
        ).map(([x, y, s], i) => (
          <path key={i} d={star} fill={mood === "shy" || mood === "blush" ? "#ff9fb1" : "#ffd34d"} transform={`translate(${x} ${y}) scale(${s})`} style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </svg>
    );
  if (mood === "thinking")
    return (
      <svg viewBox="0 0 100 120" className="pixie-thought pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        <g fill="#fff" stroke="#d9cbb3">
          <circle cx="82" cy="20" r="2.4" />
          <circle cx="89" cy="11" r="3.6" />
          <circle cx="99" cy="0" r="5.6" />
        </g>
      </svg>
    );
  if (mood === "asking")
    return (
      <span className="pixie-q pointer-events-none absolute -right-1 -top-2 font-display text-2xl font-bold text-[#1f8f99]" aria-hidden>
        ?
      </span>
    );
  if (mood === "sleep" || mood === "tired")
    return (
      <svg viewBox="0 0 160 100" className="pixie-z pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <g fill="#8fb9c0" fontFamily="Fraunces, serif" fontWeight="700">
          <text x="70" y="22" fontSize="14">z</text>
          <text x="82" y="10" fontSize="11">z</text>
          <text x="92" y="0" fontSize="8">z</text>
        </g>
      </svg>
    );
  return null;
}
