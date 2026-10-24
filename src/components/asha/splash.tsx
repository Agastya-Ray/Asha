import { useEffect, useState } from "react";
import { fairySoundSoon } from "@/lib/asha/sfx";

/** Calm opening: a leaf draws itself inside slow breathing rings, with a soft bell sound, then "Asha" rises in. Tap to skip. */
export function Splash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // a soft sound with the leaf (the Android app may play it before any touch; a browser waits for one)
    fairySoundSoon("open", true);
    const t1 = window.setTimeout(() => setLeaving(true), reduce ? 500 : 2300);
    const t2 = window.setTimeout(onDone, reduce ? 800 : 2800);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div
      role="presentation"
      onClick={onDone}
      className={`splash fixed inset-0 z-50 flex flex-col items-center justify-center bg-linen ${leaving ? "splash-out" : ""}`}
    >
      <div className="relative flex size-56 items-center justify-center">
        <span className="ring ring-1" />
        <span className="ring ring-2" />
        <span className="ring ring-3" />
        <svg viewBox="0 0 120 120" className="leaf relative size-28" aria-hidden>
          <path className="leaf-body" d="M28 94 C 24 54, 56 22, 100 20 C 100 62, 70 96, 28 94 Z" />
          <path className="leaf-vein" d="M33 89 Q 62 62 92 28" />
          <path className="leaf-stem" d="M28 94 L 18 104" />
        </svg>
      </div>
      <p className="splash-word display mt-2 text-6xl text-ink">Asha</p>
      <p className="splash-sub mt-2 text-lg text-quiet">आशा · hope</p>
    </div>
  );
}
