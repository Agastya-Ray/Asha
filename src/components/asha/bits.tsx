import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Mic, Volume2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { text, type Localized } from "@/lib/asha/plans";
import type { Lang } from "@/lib/asha/types";
import { canListen, listenOnce } from "@/lib/asha/listen";
import { useAsha } from "@/lib/asha/store";
import { speak } from "@/lib/asha/voice";
import { latinDigits } from "@/lib/asha/schedule";

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

/** "Hear this" button. `say` must already be in Asha's voice language. */
export function Hear({ say, label, round = false }: { say: string; label: string; round?: boolean }) {
  const voiceLang = useAsha((s) => s.voiceLang);
  const voiceOn = useAsha((s) => s.voiceOn);
  const rich = useAsha((s) => s.richVoice);
  if (!voiceOn) return null;
  // round: just the speaker, beside the words it reads out (the label stays for screen readers)
  if (round)
    return (
      <button
        type="button"
        aria-label={label}
        onClick={() => void speak(say, voiceLang, rich ? "warm" : "device")}
        className="hear-round inline-flex size-12 shrink-0 items-center justify-center rounded-full active:scale-[0.95]"
      >
        <Volume2 className="size-6" aria-hidden />
      </button>
    );
  return (
    <button
      type="button"
      onClick={() => void speak(say, voiceLang, rich ? "warm" : "device")}
      className="inline-flex min-h-12 items-center gap-2 rounded-full border border-line bg-linen px-4 text-base font-bold text-ink active:scale-[0.97]"
    >
      <Volume2 className="size-5" aria-hidden />
      {label}
    </button>
  );
}

/**
 * Small microphone button next to a text box. Press, speak, and the words appear in the box.
 * Listens in Asha's voice language, so Hindi can be spoken even when the screen is in English.
 */
export function MicButton({ onText, label, className }: { onText: (text: string) => void; label?: string; className?: string }) {
  const lang = useAsha((s) => s.lang);
  const voiceLang = useAsha((s) => s.voiceLang);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  if (!canListen()) return null;
  return (
    <span className={cn("inline-flex flex-col", className)}>
      <button
        type="button"
        aria-label={label ?? t(lang, { en: "Speak instead of typing", hi: "लिखने की जगह बोलें" })}
        onClick={async () => {
          setNote("");
          setBusy(true);
          const heard = await listenOnce(voiceLang);
          setBusy(false);
          if (heard.text) onText(heard.text);
          else
            setNote(
              heard.problem === "denied"
                ? t(lang, { en: "Microphone is not allowed. Allow it in phone settings.", hi: "माइक की अनुमति नहीं. फ़ोन सेटिंग में दें." })
                : t(lang, { en: "I didn't catch that. Try once more.", hi: "सुनाई नहीं दिया. एक बार और." }),
            );
        }}
        className={cn(
          "inline-flex min-h-14 min-w-14 items-center justify-center gap-2 rounded-2xl border px-3 text-base font-bold",
          busy ? "listening border-sage bg-sage text-paper" : "border-line bg-paper text-ink",
        )}
      >
        <Mic className="size-6" aria-hidden />
        {label ? <span>{busy ? t(lang, { en: "Listening…", hi: "सुन रही हूँ…" }) : label}</span> : null}
      </button>
      {note ? <span className="mt-1 text-sm text-clay">{note}</span> : null}
    </span>
  );
}

/** A text box with a microphone beside it. */
export function SpeakField({
  value,
  onChange,
  placeholder,
  inputMode,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "text" | "tel" | "numeric";
  autoComplete?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <input
        className="field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
      />
      <MicButton onText={(said) => onChange(inputMode === "tel" ? latinDigits(said).replace(/[^\d+]/g, "") : said)} />
    </div>
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

/** Two-way switch: English / हिन्दी */
export function LangSwitch({ value, onChange }: { value: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-paper p-1">
      {(["en", "hi"] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={value === l}
          onClick={() => onChange(l)}
          className={cn("min-h-12 rounded-xl text-lg font-bold", value === l ? "bg-sage text-paper" : "text-ink")}
        >
          {l === "en" ? "English" : "हिन्दी"}
        </button>
      ))}
    </div>
  );
}
