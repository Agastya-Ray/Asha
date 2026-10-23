import { useEffect, useRef, useState } from "react";
import { create } from "zustand";
import { t, useNow } from "@/components/asha/bits";
import { FairyScene } from "@/components/asha/fairy";
import { Button } from "@/components/ui/button";
import { QUIET_CHOICES, dueWhileQuiet, isQuiet } from "@/lib/asha/quiet";
import { useAsha } from "@/lib/asha/store";
import { clockLabel } from "@/lib/asha/time";
import type { Lang } from "@/lib/asha/types";
import { speak } from "@/lib/asha/voice";
import { useBack } from "@/lib/asha/back";

/** Opens the "how long should I be quiet?" sheet, from her voice, Talk, or her own button. */
export const useQuietSheet = create<{ open: boolean; minutes: number; show: (minutes?: number) => void; hide: () => void }>((set) => ({
  open: false,
  minutes: 0,
  show: (minutes = 0) => set({ open: true, minutes: (QUIET_CHOICES as readonly number[]).includes(minutes) ? minutes : 0 }),
  hide: () => set({ open: false, minutes: 0 }),
}));

function choiceLabel(lang: Lang, minutes: number) {
  if (minutes < 60) return t(lang, { en: `${minutes} minutes`, hi: `${minutes} मिनट` });
  const h = minutes / 60;
  return t(lang, { en: h === 1 ? "1 hour" : `${h} hours`, hi: `${h} घंटे` });
}

/**
 * "I'm going to an event, be quiet": she asks for how long, tells what happens to the medicines due
 * in that time (a silent buzz card when due, said out loud when she is back), then hushes.
 * While quiet, the same sheet lets the person wake her early.
 */
export function QuietSheet() {
  const { open, minutes: asked, hide } = useQuietSheet();
  const s = useAsha();
  const now = useNow();
  const [minutes, setMinutes] = useState(0);
  const sheet = useRef<HTMLDivElement>(null);
  const lang = s.lang;
  const fairy = s.fairyName || t(lang, { en: "Your fairy", hi: "आपकी परी" });
  const quiet = isQuiet(s, now.getTime());
  useBack(() => {
    hide();
    return true;
  }, open);
  const sayV = (en: string, hi: string, loud = false) =>
    void speak(s.voiceLang === "hi" ? hi : en, s.voiceLang, "fairy", loud);

  useEffect(() => {
    if (!open) return;
    setMinutes(asked);
    // move focus into the sheet: screen readers (and Android's accessibility tree) then pick it up straight away
    window.requestAnimationFrame(() => sheet.current?.focus());
    const st = useAsha.getState();
    if (isQuiet(st)) return;
    if (!asked) sayV("Shh, okay. For how long should I be quiet?", "श्श, ठीक है. कितनी देर चुप रहूँ?");
  }, [open, asked]);

  if (!open) return null;
  const until = quiet ? s.quietUntil : now.getTime() + minutes * 60_000;
  const untilText = clockLabel(lang, new Date(until));
  const due = minutes || quiet ? dueWhileQuiet(s, until, now).filter((i) => i.kind === "med") : [];

  const confirm = () => {
    const end = Date.now() + minutes * 60_000;
    s.setQuiet(end);
    const at = clockLabel(s.voiceLang, new Date(end));
    sayV(`Okay, shh. See you at ${at}.`, `ठीक है, श्श. ${at} पर मिलते हैं.`, true);
    hide();
  };
  const wakeNow = () => {
    s.setQuiet(0);
    hide();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-label={t(lang, { en: "Quiet time", hi: "शांत समय" })}>
      <div className="fixed inset-0 bg-ink/55" onClick={hide} />
      <div ref={sheet} tabIndex={-1} data-quiet-sheet className="relative outline-none mx-auto w-full max-w-lg rounded-t-3xl bg-paper px-4 pb-8 pt-4 shadow-lg">
        <div className="flex items-end gap-3">
          <div className="h-28 w-24 shrink-0">
            <FairyScene news={false} mood={quiet ? "sleep" : minutes ? "happy" : "asking"} size="sm" label={fairy} />
          </div>
          <p className="mb-2 text-xl font-bold leading-snug">
            {quiet
              ? t(lang, { en: `Shh… ${fairy} is quiet until ${untilText}.`, hi: `श्श… ${fairy} ${untilText} तक चुप है.` })
              : minutes
                ? t(lang, { en: `I'll be quiet until ${untilText}.`, hi: `मैं ${untilText} तक चुप रहूँगी.` })
                : t(lang, { en: "Shh, okay. For how long should I be quiet?", hi: "श्श, ठीक है. कितनी देर चुप रहूँ?" })}
          </p>
        </div>

        {!quiet && !minutes ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {QUIET_CHOICES.map((m) => (
              <Button key={m} variant="quiet" onClick={() => setMinutes(m)}>
                {choiceLabel(lang, m)}
              </Button>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-linen p-3 text-lg">
            {due.length ? (
              <>
                <p className="font-bold">{t(lang, { en: "Medicines in that time:", hi: "उस समय की दवाइयाँ:" })}</p>
                <ul className="mt-1">
                  {due.map((i) => (
                    <li key={i.key}>
                      {i.state === "later" ? clockLabel(lang, new Date(new Date(now).setHours(Math.floor(i.minutes / 60), i.minutes % 60, 0, 0))) : t(lang, { en: "Now", hi: "अभी" })} · {i.title}
                    </li>
                  ))}
                </ul>
                <p className="mt-2">
                  {t(lang, {
                    en: "When one is due, your phone will buzz with a silent card. If it is still not taken when I'm back, I'll say it out loud.",
                    hi: "दवा का समय होने पर फ़ोन बिना आवाज़ के कंपन करेगा और कार्ड दिखाएगा. मेरे लौटने तक न ली हो, तो मैं बोलकर याद दिलाऊँगी.",
                  })}
                </p>
              </>
            ) : (
              <p>{t(lang, { en: "No medicines are due in that time.", hi: "उस समय कोई दवा नहीं है." })}</p>
            )}
            <p className="mt-2 text-base text-quiet">{t(lang, { en: "Help still works while I'm quiet.", hi: "मेरे चुप रहने पर भी मदद बटन काम करता है." })}</p>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2">
          {quiet ? (
            <>
              <Button onClick={wakeNow}>{t(lang, { en: "Wake her now", hi: "अभी जगाएँ" })}</Button>
              <Button variant="ghost" onClick={hide}>{t(lang, { en: "Let her stay quiet", hi: "चुप रहने दें" })}</Button>
            </>
          ) : minutes ? (
            <>
              <Button onClick={confirm}>{t(lang, { en: `Be quiet until ${untilText}`, hi: `${untilText} तक चुप रहो` })}</Button>
              <Button variant="quiet" onClick={() => setMinutes(0)}>{t(lang, { en: "Change the time", hi: "समय बदलें" })}</Button>
              <Button variant="ghost" onClick={hide}>{t(lang, { en: "Cancel", hi: "रद्द करें" })}</Button>
            </>
          ) : (
            <Button variant="ghost" onClick={hide}>{t(lang, { en: "Cancel", hi: "रद्द करें" })}</Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** A thin bar under the header while she is quiet, so nobody wonders why she went silent. */
export function QuietBanner() {
  const lang = useAsha((s) => s.lang);
  const quietUntil = useAsha((s) => s.quietUntil);
  const fairyName = useAsha((s) => s.fairyName);
  const show = useQuietSheet((q) => q.show);
  const setQuiet = useAsha((s) => s.setQuiet);
  const now = useNow();
  if (quietUntil <= now.getTime()) return null;
  const at = clockLabel(lang, new Date(quietUntil));
  const who = fairyName || t(lang, { en: "Your fairy", hi: "आपकी परी" });
  return (
    <div data-quiet-banner className="mx-4 mb-2 flex min-h-12 items-center justify-between gap-2 rounded-2xl border border-line bg-paper pl-4 text-base font-bold">
      <button type="button" className="min-h-12 flex-1 text-left" onClick={() => show()}>
        🤫 {t(lang, { en: `${who} is quiet until ${at}`, hi: `${who} ${at} तक चुप है` })}
      </button>
      <button type="button" className="min-h-12 shrink-0 px-4 text-sage underline" onClick={() => setQuiet(0)}>
        {t(lang, { en: "Wake her", hi: "जगाएँ" })}
      </button>
    </div>
  );
}
