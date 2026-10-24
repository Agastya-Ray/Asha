import { useEffect, useLayoutEffect, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/components/asha/bits";
import { Pixie, type PixieMood } from "@/components/asha/pixie";
import type { Localized } from "@/lib/asha/plans";
import { digits } from "@/lib/asha/schedule";
import { useAsha } from "@/lib/asha/store";
import { speak, stopSpeaking } from "@/lib/asha/voice";

function useFairyLabel() {
  const lang = useAsha((s) => s.lang);
  const name = useAsha((s) => s.fairyName);
  return name || t(lang, { en: "Your fairy", hi: "आपकी परी" });
}

/** The fairy beside a setup step, saying what to do there (once, out loud, with an Again button). */
export function FairyGuide({ mood, line }: { mood: PixieMood; line: Localized }) {
  const lang = useAsha((s) => s.lang);
  const voiceLang = useAsha((s) => s.voiceLang);
  const voiceOn = useAsha((s) => s.voiceOn);
  const label = useFairyLabel();
  const say = t(voiceLang, line);
  useEffect(() => {
    if (voiceOn) void speak(say, voiceLang, "fairy");
  }, [say]);
  useEffect(() => () => stopSpeaking(), []);
  return (
    <div className="fi-bubble mt-3 flex items-end gap-2">
      <Pixie mood={mood} className="h-28 w-24 shrink-0" />
      <div className="flex-1 rounded-3xl border-2 border-[#f3c4d0] bg-paper p-3 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-[#d9506f]">{label}</p>
        <p className="mt-1 text-lg leading-snug">{t(lang, line)}</p>
        <button
          type="button"
          className="mt-2 min-h-11 rounded-2xl border border-line px-3 text-base font-bold text-quiet"
          onClick={() => void speak(say, voiceLang, "fairy")}
        >
          🔊 {t(lang, { en: "Again", hi: "फिर से" })}
        </button>
      </div>
    </div>
  );
}

type TourStep = {
  target: string | null;
  mood: PixieMood;
  line: (name: string, helper: string) => Localized;
  next: Localized;
};

const TOUR: TourStep[] = [
  {
    target: "now",
    mood: "point",
    line: () => ({
      en: "This is your day. What is due now, a medicine or a meal, shows here. When it's done, press the big button.",
      hi: "यह आपका दिन है. अभी जो करना है, दवा या खाना, वह यहीं दिखेगा. हो जाए, तो बड़ा बटन दबाइए.",
    }),
    next: { en: "Next", hi: "आगे" },
  },
  {
    target: "help",
    mood: "talk",
    line: (_, helper) => ({
      en: `See this red Help button? If you ever feel unwell, press it and keep holding. I'll call ${helper} and tell them where you are.`,
      hi: `यह लाल 'मदद' बटन देखा? कभी तबीयत ठीक न लगे, तो इसे दबाकर रखिए. मैं ${helper} को फ़ोन करूँगी और बताऊँगी कि आप कहाँ हैं.`,
    }),
    next: { en: "Next", hi: "आगे" },
  },
  {
    target: "nav",
    mood: "happy",
    line: () => ({
      en: "These buttons at the bottom open the four rooms of my home: today, medicines, family, and a chat with me. Meals and your health chart open from Today.",
      hi: "नीचे के ये चार बटन मेरे घर के कमरे खोलते हैं: आज, दवाएँ, परिवार, और मुझसे बातें. खाना और सेहत चार्ट 'आज' से खुलते हैं.",
    }),
    next: { en: "Next", hi: "आगे" },
  },
  {
    target: null,
    mood: "wave",
    line: (name) => ({
      en: `Now my home is your home too${name ? `, ${name}` : ""}. I'll stay right here in the corner. Tap me any time you need me!`,
      hi: `अब मेरा घर आपका भी घर है${name ? `, ${name}` : ""}. मैं यहीं कोने में रहूँगी. जब भी ज़रूरत हो, मुझे छू लीजिए!`,
    }),
    next: { en: "Thank you", hi: "शुक्रिया" },
  },
];

/** After setup, the fairy walks the person round Today once: the next medicine, the Help button, the tabs. */
export function FairyTour() {
  const lang = useAsha((s) => s.lang);
  const voiceLang = useAsha((s) => s.voiceLang);
  const voiceOn = useAsha((s) => s.voiceOn);
  const name = useAsha((s) => s.name.trim());
  // only someone Help can actually ring; without one she means the emergency number
  const helperName = useAsha(
    (s) => s.contacts.find((c) => c.name?.trim() && digits(c.phone ?? "").length >= 3)?.name.trim() ?? "",
  );
  const emergency = useAsha((s) => s.emergencyNumber.trim());
  const helperIn = (l: "en" | "hi") =>
    helperName || (emergency ? emergency : l === "hi" ? "आपके अपनों" : "your family");
  const finishTour = useAsha((s) => s.finishTour);
  const finish = () => {
    finishTour();
    window.scrollTo({ top: 0 });
  };
  const label = useFairyLabel();
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = TOUR[i];
  const line = step.line(name, helperIn(lang));
  const spoken = step.line(name, helperIn(voiceLang));

  useLayoutEffect(() => {
    const el = step.target
      ? document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`)
      : null;
    if (!el) {
      setRect(null);
      return;
    }
    // A tall target (a long "Right now" list) is shown from its top, so there is room for her bubble below it.
    const show = () => {
      const tall = el.getBoundingClientRect().height > window.innerHeight * 0.45;
      if (tall)
        window.scrollTo({
          top: window.scrollY + el.getBoundingClientRect().top - 110,
          behavior: "instant" as ScrollBehavior,
        });
      else el.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior });
    };
    show();
    const measure = () => {
      const r = el.getBoundingClientRect();
      setRect(new DOMRect(r.left, r.top, r.width, Math.min(r.height, window.innerHeight * 0.62)));
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    // a card that appears late (the phone's reminder-permission card) pushes the target down; bring it back into view
    const grow = new ResizeObserver(() => {
      show();
      measure();
    });
    grow.observe(document.body);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      grow.disconnect();
    };
  }, [i]);

  useEffect(() => {
    if (voiceOn) void speak(t(voiceLang, spoken), voiceLang, "fairy");
  }, [i, voiceLang]);
  useEffect(() => () => stopSpeaking(), []);

  // The bubble sits right next to what she is showing, on the side with more room, so the header stays visible.
  const pad = 8;
  const gap = 16;
  const below = !!rect && rect.top + rect.height / 2 < window.innerHeight / 2;
  const place: CSSProperties = !rect
    ? { top: "50%", transform: "translateY(-50%)" }
    : below
      ? window.innerHeight - rect.bottom < 300
        ? { bottom: 12 }
        : { top: rect.bottom + pad + gap }
      : { bottom: Math.max(window.innerHeight - rect.top + pad + gap, 16) };
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={label}>
      {rect ? (
        <div
          className="pointer-events-none fixed rounded-3xl transition-all duration-300"
          style={{
            left: rect.left - pad,
            top: rect.top - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 4px #ffd36e, 0 0 0 9999px rgba(28,25,21,0.55)",
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-ink/55" />
      )}
      <div
        className={`fixed inset-x-0 mx-auto flex max-w-lg gap-2 px-4 ${step.target ? "items-end" : "flex-col items-center"}`}
        style={place}
      >
        <Pixie mood={step.mood} className={`${step.target ? "tour-pixie h-28 w-24" : "h-44 w-36"} shrink-0`} />
        <div
          key={i}
          className={`fi-bubble rounded-3xl border-2 border-[#f3c4d0] bg-paper p-4 shadow-lg ${step.target ? "flex-1" : "w-full"}`}
        >
          <p className="text-sm font-bold uppercase tracking-wide text-[#d9506f]">{label}</p>
          <p className="mt-1 text-lg leading-snug">{t(lang, line)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="min-h-12 shrink-0 rounded-2xl border border-line px-3 text-base font-bold text-quiet"
              onClick={() => void speak(t(voiceLang, spoken), voiceLang, "fairy")}
            >
              🔊 {t(lang, { en: "Again", hi: "फिर से" })}
            </button>
            <Button
              className="min-w-36 flex-1"
              onClick={() => (i < TOUR.length - 1 ? setI(i + 1) : finish())}
            >
              {t(lang, step.next)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
