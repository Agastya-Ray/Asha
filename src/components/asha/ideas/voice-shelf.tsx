import { useState } from "react";
import { Play } from "lucide-react";
import { Card, t } from "@/components/asha/bits";
import { hiddenNotes, markHeard, playVoiceNote, useFamily } from "@/lib/asha/family";
import { useAsha } from "@/lib/asha/store";

/** "Mon, 8:05 am" */
function when(iso: string, lang: "en" | "hi") {
  return new Date(iso).toLocaleString(lang === "hi" ? "hi-IN" : "en-GB", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** The elder's shelf of family voice notes: their own voices, to play again any time. */
export function VoiceShelf() {
  const lang = useAsha((s) => s.lang);
  const messages = useFamily((s) => s.messages);
  const [playing, setPlaying] = useState<number | null>(null);
  const hidden = hiddenNotes();
  const notes = messages.filter((m) => m.voice && !m.mine && !hidden.includes(m.id)).slice(0, 8);
  if (!notes.length) return null;
  return (
    <>
      <h2 className="mt-6 text-2xl font-bold">
        {t(lang, { en: "Voice notes from family", hi: "परिवार की आवाज़ें" })}
      </h2>
      <div className="mt-3 flex flex-col gap-2">
        {notes.map((m) => {
          const from = (lang === "hi" ? m.hi : m.en).replace(/^🎙\s*/, "").split(":")[0];
          return (
            <Card key={m.id} className="flex items-center gap-3 py-3">
              <button
                type="button"
                aria-label={t(lang, { en: `Play ${from}'s voice`, hi: `${from} की आवाज़ सुनें` })}
                onClick={async () => {
                  setPlaying(m.id);
                  void markHeard([m.id]);
                  await playVoiceNote(m.id);
                  setPlaying(null);
                }}
                className="inline-flex size-16 shrink-0 items-center justify-center rounded-full bg-sage text-paper active:scale-95"
              >
                <Play className="size-7" aria-hidden />
              </button>
              <div className="min-w-0">
                <p className="text-xl font-bold">{from}</p>
                <p className="text-base text-quiet">
                  {playing === m.id ? t(lang, { en: "Playing…", hi: "चल रहा है…" }) : when(m.at, lang)}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
