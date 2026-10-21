import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useNow } from "@/components/asha/bits";
import { useSpeech } from "@/lib/asha/voice";
import { Pixie, type PixieMood } from "@/components/asha/pixie";

/**
 * Asha's fairy (the pixie, drawn in pixie.tsx) and her mischievous pet "Chintu" —
 * a fluffy round puff with floppy ears and a firefly tail.
 */

export type FairyMood = PixieMood;

export type PetMode = "hidden" | "peek" | "tumble" | "envelope";

/** Chintu, the mischievous pet. Shows up only when a message has arrived. */
export function Pet({ mode, className }: { mode: PetMode; className?: string }) {
  if (mode === "hidden") return null;
  return (
    <svg viewBox="0 0 80 70" className={cn("pet", `pet-${mode}`, className)} role="img" aria-label="Chintu">
      <g className="pet-body">
        {/* firefly tail */}
        <path d="M62 46 Q 74 40 72 30" stroke="#e8d9b5" strokeWidth="4" strokeLinecap="round" fill="none" />
        <circle className="pet-glow" cx="72" cy="28" r="5" fill="#f4e27a" />
        {/* floppy ears */}
        <path className="pet-ear-l" d="M26 22 C 14 6, 4 14, 12 28 Z" fill="#efe3c8" stroke="#d8c7a2" strokeWidth="1" />
        <path className="pet-ear-r" d="M46 20 C 56 2, 68 10, 58 26 Z" fill="#efe3c8" stroke="#d8c7a2" strokeWidth="1" />
        {/* round fluffy body */}
        <ellipse cx="36" cy="44" rx="26" ry="22" fill="#fbf4e3" stroke="#e2d3b0" strokeWidth="1.2" />
        <path d="M14 40 q-4 4 0 8 M58 40 q4 4 0 8" stroke="#e2d3b0" strokeWidth="1.2" fill="none" />
        {/* cheeky face: one eye winking */}
        <ellipse cx="28" cy="40" rx="3" ry="3.6" fill="#2a1a12" />
        <circle cx="29" cy="38.8" r="1" fill="#fff" />
        <path d="M40 40 q3 -3 6 0" stroke="#2a1a12" strokeWidth="2" strokeLinecap="round" fill="none" />
        <ellipse cx="36" cy="46" rx="2.4" ry="1.6" fill="#e48f8f" />
        <path d="M31 50 Q 36 55 43 49" stroke="#2a1a12" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        <circle cx="22" cy="47" r="3" fill="#f6b6b6" opacity="0.6" />
        <circle cx="49" cy="47" r="3" fill="#f6b6b6" opacity="0.6" />
        {/* little feet */}
        <ellipse cx="26" cy="65" rx="6" ry="3" fill="#efe3c8" />
        <ellipse cx="46" cy="65" rx="6" ry="3" fill="#efe3c8" />
      </g>
      {mode === "envelope" || mode === "tumble" ? (
        <g className="pet-envelope">
          <rect x="22" y="52" width="28" height="18" rx="3" fill="#fffdf8" stroke="#a34b24" strokeWidth="1.4" />
          <path d="M22 54 L 36 63 L 50 54" stroke="#a34b24" strokeWidth="1.4" fill="none" />
          <path d="M36 60 c-2-2.4-5.4-.4-3.4 2.2 L36 65 l3.4-2.8 c2-2.6-1.4-4.6-3.4-2.2z" fill="#d6455d" />
        </g>
      ) : null}
    </svg>
  );
}

/** The fairy with her pet. When `news` turns on, Chintu peeks, tumbles in with the envelope and waits. */
export function FairyScene({
  news,
  mood,
  size = "md",
  onTap,
  label,
  floor = false,
}: {
  news: boolean;
  mood?: FairyMood;
  size?: "sm" | "md" | "lg";
  onTap?: () => void;
  label?: string;
  /** asleep, she lies on the bottom edge (the "floor") instead of floating */
  floor?: boolean;
}) {
  const [pet, setPet] = useState<PetMode>(news ? "envelope" : "hidden");
  const timers = useRef<number[]>([]);
  useEffect(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    if (!news) {
      setPet("hidden");
      return;
    }
    setPet("peek");
    timers.current = [window.setTimeout(() => setPet("tumble"), 900), window.setTimeout(() => setPet("envelope"), 1900)];
    return () => timers.current.forEach((t) => window.clearTimeout(t));
  }, [news]);
  // re-checked every 30 s, so she falls asleep at night and wakes up without a reload
  const hour = useNow().getHours();
  const speaking = useSpeech((s) => s.active);
  // while Asha is speaking, the fairy talks; otherwise good news makes her happy and late night makes her sleep
  // while Asha speaks she talks along, unless she is in the middle of a gesture (waving, blushing, pointing…)
  const autoMood: FairyMood = speaking && (!mood || mood === "idle") ? "talk" : mood ?? (news ? "happy" : hour >= 22 || hour < 6 ? "sleep" : "idle");

  const me = useRef<HTMLButtonElement>(null);
  const [look, setLook] = useState<{ x: number; y: number } | undefined>();
  // she looks at whatever was just tapped, then back at you after a moment
  useEffect(() => {
    let back = 0;
    const onDown = (e: PointerEvent) => {
      const r = me.current?.getBoundingClientRect();
      if (!r) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height * 0.3);
      const d = Math.hypot(dx, dy) || 1;
      setLook({ x: dx / d, y: dy / d });
      window.clearTimeout(back);
      back = window.setTimeout(() => setLook(undefined), 2500);
    };
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.clearTimeout(back);
    };
  }, []);
  const dims = size === "sm" ? "h-24 w-20" : size === "lg" ? "h-52 w-44" : "h-32 w-28";
  const asleepOnFloor = floor && autoMood === "sleep";
  return (
    <button
      ref={me}
      type="button"
      onClick={onTap}
      aria-label={label}
      data-mood={autoMood}
      className={cn("fairy-scene relative shrink-0 select-none", asleepOnFloor ? (size === "sm" ? "h-20 w-36" : "h-24 w-44") : dims)}
    >
      <Pixie mood={autoMood} look={look} className="absolute inset-0 h-full w-full overflow-visible" />
      <Pet mode={pet} className={cn("absolute bottom-0", size === "lg" ? "-right-6 h-20 w-20" : size === "sm" ? "-right-3 h-10 w-10" : "-right-4 h-14 w-14")} />
    </button>
  );
}
