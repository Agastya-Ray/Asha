import { useEffect, useLayoutEffect, useState, type CSSProperties } from "react";
import { create } from "zustand";
import { Button } from "@/components/ui/button";
import { t } from "@/components/asha/bits";
import { Pixie } from "@/components/asha/pixie";
import { TOPICS, findTarget } from "@/lib/asha/how";
import { useAsha } from "@/lib/asha/store";
import { speak, stopSpeaking } from "@/lib/asha/voice";

/** Which "how" the fairy is showing: a topic id, the list of topics, or nothing. */
export const useHow = create<{
  topic: string | null;
  menu: boolean;
  show: (id: string) => void;
  list: () => void;
  close: () => void;
}>((set) => ({
  topic: null,
  menu: false,
  show: (topic) => set({ topic, menu: false }),
  list: () => set({ topic: null, menu: true }),
  close: () => set({ topic: null, menu: false }),
}));

function useFairyName() {
  const lang = useAsha((s) => s.lang);
  const name = useAsha((s) => s.fairyName);
  return name || t(lang, { en: "Your fairy", hi: "आपकी परी" });
}

/** The list of things she can show, as big buttons. */
function HowMenu() {
  const lang = useAsha((s) => s.lang);
  const voiceLang = useAsha((s) => s.voiceLang);
  const voiceOn = useAsha((s) => s.voiceOn);
  const label = useFairyName();
  const { show, close } = useHow();
  useEffect(() => {
    if (voiceOn)
      void speak(
        t(voiceLang, { en: "What shall I show you? Pick one.", hi: "मैं क्या दिखाऊँ? एक चुनिए." }),
        voiceLang,
        "fairy",
      );
  }, []);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div className="fixed inset-0 bg-ink/55" onClick={close} />
      <div className="fi-bubble relative max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-2 border-[#f3c4d0] bg-paper p-4 pb-8 shadow-lg">
        <div className="flex items-end gap-2">
          <Pixie mood="asking" className="h-24 w-20 shrink-0" />
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[#d9506f]">{label}</p>
            <p className="text-2xl font-bold leading-snug">
              {t(lang, { en: "What shall I show you?", hi: "मैं क्या दिखाऊँ?" })}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {TOPICS.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => show(x.id)}
              className="min-h-14 rounded-2xl border border-line bg-linen px-4 text-left text-lg font-bold active:scale-[0.98]"
            >
              {t(lang, x.title)}
            </button>
          ))}
        </div>
        <Button variant="quiet" className="mt-3 w-full" onClick={close}>
          {t(lang, { en: "Not now", hi: "अभी नहीं" })}
        </Button>
      </div>
    </div>
  );
}

/** She goes to the right screen and points at the button, step by step. Pressing the lit button for real means they have it, so she steps aside. */
function HowSteps({ id }: { id: string }) {
  const lang = useAsha((s) => s.lang);
  const voiceLang = useAsha((s) => s.voiceLang);
  const voiceOn = useAsha((s) => s.voiceOn);
  const label = useFairyName();
  const { close, list } = useHow();
  const topic = TOPICS.find((x) => x.id === id);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = topic?.steps[i];
  const last = !!topic && i === topic.steps.length - 1;
  const next = () => (last ? close() : setI(i + 1));

  useLayoutEffect(() => {
    if (!step) return;
    const s = useAsha.getState();
    if (step.tab === "settings") {
      if (s.tab !== "settings") s.openSettings();
    } else if (s.tab !== step.tab) s.setTab(step.tab);
    setRect(null);
    let el: HTMLElement | null = null;
    let tries = 0;
    const measure = () => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect(new DOMRect(r.left, r.top, r.width, Math.min(r.height, window.innerHeight * 0.5)));
    };
    const onPress = () => window.setTimeout(close, 150);
    // the screen has to draw first; look for the button a few times
    const look = window.setInterval(() => {
      el = findTarget(step.find, lang);
      if (el || ++tries > 8) {
        window.clearInterval(look);
        if (!el) return;
        el.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior });
        measure();
        el.addEventListener("click", onPress);
      }
    }, 120);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearInterval(look);
      el?.removeEventListener("click", onPress);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [id, i]);

  useEffect(() => {
    if (step && voiceOn) void speak(t(voiceLang, step.line), voiceLang, "fairy");
  }, [id, i]);
  useEffect(() => () => stopSpeaking(), []);

  if (!topic || !step) return null;
  const pad = 8;
  const gap = 16;
  const below = !!rect && rect.top + rect.height / 2 < window.innerHeight / 2;
  const place: CSSProperties = !rect
    ? { top: "50%", transform: "translateY(-50%)" }
    : below
      ? { top: Math.min(rect.bottom + pad + gap, window.innerHeight - 300) }
      : { bottom: Math.max(window.innerHeight - rect.top + pad + gap, 16) };
  return (
    // only her bubble catches taps: the lit button underneath can be pressed for real
    <div className="pointer-events-none fixed inset-0 z-50" role="dialog" aria-label={label}>
      {rect ? (
        <div
          className="fixed rounded-3xl transition-all duration-300"
          style={{
            left: rect.left - pad,
            top: rect.top - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 4px #ffd36e, 0 0 0 9999px rgba(28,25,21,0.5)",
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-ink/50" />
      )}
      <div className="fixed inset-x-0 mx-auto flex max-w-lg items-end gap-2 px-4" style={place}>
        <Pixie mood={step.mood} className="tour-pixie h-28 w-24 shrink-0" />
        <div
          key={i}
          className="fi-bubble pointer-events-auto flex-1 rounded-3xl border-2 border-[#f3c4d0] bg-paper p-4 shadow-lg"
        >
          <p className="text-sm font-bold uppercase tracking-wide text-[#d9506f]">
            {label} · {t(lang, topic.title)}
          </p>
          <p className="mt-1 text-lg leading-snug">{t(lang, step.line)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="min-h-12 shrink-0 rounded-2xl border border-line px-3 text-base font-bold text-quiet"
              onClick={() => void speak(t(voiceLang, step.line), voiceLang, "fairy")}
            >
              🔊 {t(lang, { en: "Again", hi: "फिर से" })}
            </button>
            <Button className="min-w-32 flex-1" onClick={next}>
              {last ? t(lang, { en: "Got it", hi: "ठीक है" }) : t(lang, { en: "Next", hi: "आगे" })}
            </Button>
          </div>
          {last ? (
            <button
              type="button"
              className="mt-2 min-h-11 text-base font-bold text-sage underline"
              onClick={list}
            >
              {t(lang, { en: "Show me something else", hi: "कुछ और दिखाओ" })}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AskHow() {
  const topic = useHow((s) => s.topic);
  const menu = useHow((s) => s.menu);
  if (topic) return <HowSteps key={topic} id={topic} />;
  if (menu) return <HowMenu />;
  return null;
}

/** On Settings: "Ask me how", for anyone who would rather tap than speak. */
export function AskHowButton() {
  const lang = useAsha((s) => s.lang);
  return (
    <button
      type="button"
      onClick={() => useHow.getState().list()}
      className="mt-4 flex min-h-16 w-full items-center gap-3 rounded-3xl border-2 border-[#f3c4d0] bg-paper px-3 text-left active:scale-[0.98]"
    >
      <Pixie mood="asking" className="h-14 w-12 shrink-0" />
      <span>
        <span className="block text-xl font-bold">
          {t(lang, { en: "Ask me how", hi: "मुझसे पूछिए कैसे" })}
        </span>
        <span className="block text-base text-quiet">
          {t(lang, { en: "I'll show you where to press.", hi: "मैं दिखाऊँगी कहाँ दबाना है." })}
        </span>
      </span>
    </button>
  );
}
