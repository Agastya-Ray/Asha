import { useState } from "react";
import { Button } from "@/components/ui/button";
import { t, useNow } from "@/components/asha/bits";
import { MedPicture } from "@/components/asha/ideas/med-photo";
import { Pixie } from "@/components/asha/pixie";
import { buildAgenda } from "@/lib/asha/schedule";
import { useAsha } from "@/lib/asha/store";

// keys closed this session, so switching tabs does not bring the same dose back
const closed = new Set<string>();

/**
 * When a medicine is due, it fills most of the screen: the photo of the real strip or tablet,
 * its name and how much, with the fairy pointing at it. One dose at a time.
 */
export function DoseSpotlight() {
  const now = useNow();
  const [, bump] = useState(0);
  const s = useAsha();
  if (s.quietUntil > Date.now()) return null;
  const agenda = buildAgenda(s, now);
  const due = agenda.filter((i) => i.kind === "med" && i.state === "now" && !closed.has(i.key));
  const item = due[0];
  const med = item ? s.meds.find((m) => m.id === item.id) : undefined;
  if (!item || !med) return null;
  const lang = s.lang;
  const who = s.name.trim();
  const close = () => {
    closed.add(item.key);
    bump((n) => n + 1);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={med.name}
      className="safe-top fixed inset-0 z-40 flex flex-col items-center justify-end gap-2 bg-ink/40 px-3 pb-3 pt-3"
    >
      {/* she covers the header's Help button, so Help comes with her: it must always be one tap away */}
      <div className="flex w-full max-w-lg shrink-0 justify-end">
        <button
          type="button"
          onClick={() => s.setTab("sos")}
          className="btn-sos min-h-12 rounded-full bg-sos px-5 text-lg font-bold text-paper"
        >
          {t(lang, { en: "Help", hi: "मदद" })}
        </button>
      </div>
      <div className="flex min-h-0 w-full max-w-lg flex-col overflow-y-auto rounded-[2rem] bg-paper p-4 shadow-xl">
        <div className="flex items-end gap-2">
          <Pixie mood="point" className="h-24 w-20 shrink-0" />
          <p className="mb-2 flex-1 rounded-3xl border-2 border-[#f3c4d0] bg-linen p-3 text-lg leading-snug">
            {lang === "hi"
              ? `${who ? `${who}, ` : ""}अब यह वाली. ठीक यही दवा, इतनी ही.`
              : `${who ? `${who}, ` : ""}it's time for this one. Exactly this medicine, this much.`}
          </p>
        </div>
        <MedPicture med={med} className="mt-3 aspect-square w-full max-h-[48vh]" />
        <p className="mt-4 text-center text-4xl font-bold leading-tight">{med.name}</p>
        <p className="mt-1 text-center text-2xl">{item.detail}</p>
        {due.length > 1 ? (
          <p className="mt-1 text-center text-base text-quiet">
            {lang === "hi"
              ? `${due.length} दवाइयों में से पहली`
              : `1 of ${due.length} medicines now`}
          </p>
        ) : null}
        <div className="mt-4 flex flex-col gap-2">
          <Button
            onClick={() => {
              s.logDose(item.id, item.time, "taken");
              close();
            }}
          >
            {t(lang, { en: "I've taken it ✓", hi: "ले ली ✓" })}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="quiet"
              onClick={() => {
                s.snoozeKey(item.key, 10);
                close();
              }}
            >
              {t(lang, { en: "10 min later", hi: "10 मिनट बाद" })}
            </Button>
            <Button variant="quiet" onClick={close}>
              {t(lang, { en: "Close", hi: "बंद करें" })}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
