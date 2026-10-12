import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { text, type Localized } from "@/lib/asha/plans";
import type { Lang } from "@/lib/asha/types";
import { useAsha } from "@/lib/asha/store";
import { speak } from "@/lib/asha/voice";

export function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export function t(lang: Lang, copy: Localized) {
  return text(copy, lang);
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("rounded-3xl border border-line bg-paper p-4", className)}>{children}</section>;
}

export function Hear({ text: line, label }: { text: string; label: string }) {
  const lang = useAsha((s) => s.lang);
  const voiceOn = useAsha((s) => s.voiceOn);
  const rich = useAsha((s) => s.richVoice);
  if (!voiceOn) return null;
  return (
    <button
      type="button"
      onClick={() => void speak(line, lang, rich ? "warm" : "device")}
      className="inline-flex min-h-12 items-center gap-2 rounded-full border border-line bg-linen px-4 text-base font-bold text-ink"
    >
      <Volume2 className="size-5" aria-hidden />
      {label}
    </button>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-2 block text-lg font-bold text-ink">{children}</label>;
}

export function Choice({
  selected,
  onClick,
  title,
  detail,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  detail?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "w-full rounded-2xl border px-4 py-3 text-left transition-transform duration-150 active:scale-[0.96]",
        selected ? "border-sage bg-sage-soft" : "border-line bg-paper",
      )}
    >
      <span className="block text-lg font-bold">{title}</span>
      {detail ? <span className="mt-1 block text-base text-quiet">{detail}</span> : null}
    </button>
  );
}
