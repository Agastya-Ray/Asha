import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Asha's fairy (original character): a small fairy in a sage dress with leaf-shaped wings,
 * and her mischievous pet "Chintu" — a fluffy round puff with floppy ears and a firefly tail.
 * Everything is drawn here in SVG, so there are no pictures to download.
 */

export type FairyMood = "idle" | "happy" | "sleep" | "talk";

export function Fairy({ mood = "idle", className }: { mood?: FairyMood; className?: string }) {
  const eyesClosed = mood === "sleep";
  return (
    <svg viewBox="0 0 120 140" className={cn("fairy", `fairy-${mood}`, className)} role="img" aria-label="Asha the fairy">
      <defs>
        <radialGradient id="fg-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff6c9" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fff6c9" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fg-wing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e6f6ec" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#9fd3b4" stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id="fg-dress" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2f8a5c" />
          <stop offset="100%" stopColor="#1d6b45" />
        </linearGradient>
      </defs>
      <circle className="fairy-halo" cx="60" cy="70" r="56" fill="url(#fg-glow)" />
      {/* wings: two leaf shapes on each side */}
      <g className="fairy-wings">
        <g className="wing wing-l">
          <path d="M52 66 C 26 40, 8 52, 14 72 C 20 88, 40 84, 52 72 Z" fill="url(#fg-wing)" stroke="#7bbf98" strokeWidth="1.2" />
          <path d="M50 76 C 32 84, 22 100, 32 106 C 42 110, 50 96, 52 80 Z" fill="url(#fg-wing)" stroke="#7bbf98" strokeWidth="1.2" />
          <path d="M50 70 Q 30 62 18 70" stroke="#7bbf98" strokeWidth="1" fill="none" />
        </g>
        <g className="wing wing-r">
          <path d="M68 66 C 94 40, 112 52, 106 72 C 100 88, 80 84, 68 72 Z" fill="url(#fg-wing)" stroke="#7bbf98" strokeWidth="1.2" />
          <path d="M70 76 C 88 84, 98 100, 88 106 C 78 110, 70 96, 68 80 Z" fill="url(#fg-wing)" stroke="#7bbf98" strokeWidth="1.2" />
          <path d="M70 70 Q 90 62 102 70" stroke="#7bbf98" strokeWidth="1" fill="none" />
        </g>
      </g>
      <g className="fairy-body">
        {/* dress */}
        <path d="M60 70 C 50 72, 44 96, 40 112 C 52 118, 68 118, 80 112 C 76 96, 70 72, 60 70 Z" fill="url(#fg-dress)" />
        <path d="M42 108 Q 50 114 60 112 Q 70 114 78 108" stroke="#e4f2ea" strokeWidth="1.5" fill="none" strokeDasharray="2 3" />
        {/* arms */}
        <path className="fairy-arm-l" d="M53 78 Q 44 88 46 96" stroke="#c98f6b" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path className="fairy-arm-r" d="M67 78 Q 78 84 84 78" stroke="#c98f6b" strokeWidth="4" strokeLinecap="round" fill="none" />
        {/* wand */}
        <g className="fairy-wand">
          <path d="M84 78 L 92 64" stroke="#a37a3a" strokeWidth="2" strokeLinecap="round" />
          <path d="M92 56 l2.4 5 5.4.6 -4 3.6 1.2 5.3 -5-2.8 -5 2.8 1.2-5.3 -4-3.6 5.4-.6z" fill="#f4c64e" />
        </g>
        {/* legs */}
        <path d="M54 114 L 52 124 M66 114 L 68 124" stroke="#c98f6b" strokeWidth="3.4" strokeLinecap="round" />
        <ellipse cx="51" cy="126" rx="4" ry="2.4" fill="#a34b24" />
        <ellipse cx="69" cy="126" rx="4" ry="2.4" fill="#a34b24" />
        {/* head */}
        <circle cx="60" cy="50" r="20" fill="#d9a07c" />
        {/* hair */}
        <path d="M40 50 C 38 30, 54 24, 62 26 C 76 26, 84 38, 80 52 C 76 42, 70 38, 60 38 C 50 38, 44 44, 40 50 Z" fill="#3a2418" />
        <circle cx="60" cy="25" r="8" fill="#3a2418" />
        <path d="M66 20 C 74 12, 84 16, 80 24 C 76 26, 70 24, 66 20 Z" fill="#6aa57f" />
        {/* face */}
        {eyesClosed ? (
          <g stroke="#2a1a12" strokeWidth="2" strokeLinecap="round" fill="none">
            <path d="M49 52 q4 3 8 0" />
            <path d="M63 52 q4 3 8 0" />
          </g>
        ) : (
          <g className="fairy-eyes">
            <ellipse cx="53" cy="51" rx="3.2" ry="4" fill="#2a1a12" />
            <ellipse cx="67" cy="51" rx="3.2" ry="4" fill="#2a1a12" />
            <circle cx="54.2" cy="49.6" r="1.2" fill="#fff" />
            <circle cx="68.2" cy="49.6" r="1.2" fill="#fff" />
          </g>
        )}
        <circle cx="47" cy="57" r="3.4" fill="#f08a8a" opacity="0.55" />
        <circle cx="73" cy="57" r="3.4" fill="#f08a8a" opacity="0.55" />
        {mood === "talk" ? (
          <ellipse className="fairy-mouth-talk" cx="60" cy="61" rx="3.4" ry="2.6" fill="#8a3b2b" />
        ) : mood === "happy" ? (
          <path d="M54 59 Q 60 66 66 59 Z" fill="#8a3b2b" />
        ) : (
          <path d="M55 60 Q 60 64 65 60" stroke="#8a3b2b" strokeWidth="2" strokeLinecap="round" fill="none" />
        )}
        <circle cx="60" cy="44" r="1.6" fill="#a34b24" />
      </g>
      {mood === "sleep" ? (
        <g className="fairy-z" fill="#5c564c" fontFamily="Fraunces, serif" fontWeight="700">
          <text x="84" y="34" fontSize="12">z</text>
          <text x="92" y="24" fontSize="9">z</text>
        </g>
      ) : null}
      {mood === "happy" ? (
        <g className="fairy-sparkles" fill="#f4c64e">
          <circle cx="18" cy="30" r="2.4" />
          <circle cx="104" cy="28" r="2" />
          <circle cx="12" cy="96" r="1.8" />
          <circle cx="108" cy="100" r="2.2" />
        </g>
      ) : null}
    </svg>
  );
}

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
}: {
  news: boolean;
  mood?: FairyMood;
  size?: "sm" | "md" | "lg";
  onTap?: () => void;
  label?: string;
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
  const hour = new Date().getHours();
  const autoMood: FairyMood = mood ?? (news ? "happy" : hour >= 22 || hour < 6 ? "sleep" : "idle");
  const dims = size === "sm" ? "h-20 w-20" : size === "lg" ? "h-44 w-44" : "h-28 w-28";
  return (
    <button type="button" onClick={onTap} aria-label={label} className={cn("fairy-scene relative shrink-0 select-none", dims)}>
      <Fairy mood={autoMood} className="absolute inset-0 h-full w-full" />
      <Pet mode={pet} className={cn("absolute bottom-0", size === "lg" ? "-right-6 h-20 w-20" : size === "sm" ? "-right-3 h-10 w-10" : "-right-4 h-14 w-14")} />
    </button>
  );
}
