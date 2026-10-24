import { useEffect, useLayoutEffect, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/components/asha/bits";
import { Pixie, type PixieMood } from "@/components/asha/pixie";
import type { Localized } from "@/lib/asha/plans";
import { digits } from "@/lib/asha/schedule";
import { useAsha } from "@/lib/asha/store";
import { useBack } from "@/lib/asha/back";
import { speak, stopSpeaking } from "@/lib/asha/voice";

function useFairyLabel() {
  const lang = useAsha((s) => s.lang);
  const name = useAsha((s) => s.fairyName);
  return name || t(lang, { en: "Your fairy", hi: "आपकी परी" });
}

/** Splits her words into sentences, so they can appear one after another like she is telling a story. */
function sentences(text: string) {
  return text.match(/[^.?!।…]+[.?!।…]*\s*/g) ?? [text];
}
const SENTENCE_S = 0.9;
/** How long her sentences take to appear, so what comes after (the form) can wait for her. */
export function guideDelay(lang: "en" | "hi", line: Localized) {
  return Math.min(4, sentences(t(lang, line)).length * SENTENCE_S + 0.2);
}

/** The fairy beside a setup step, saying what to do there (once, out loud, with an Again button). Sentences rise in one by one. */
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
        <p key={t(lang, line)} className="mt-1 text-lg leading-snug">
          {sentences(t(lang, line)).map((part, i) => (
            <span
              key={i}
              className="fi-word"
              style={{ animationDelay: `${0.3 + i * SENTENCE_S}s` }}
            >
              {part}
            </span>
          ))}
        </p>
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

type Room = "today" | "meds" | "care" | "family" | "talk" | "settings";

type TourStep = {
  /** the room this part of the tour happens in */
  room: Room;
  /** going into a new room, she first flies to its button and taps it, then shows the room */
  via?: string;
  /** what she flies to, as CSS selectors tried in order; null = she floats in the middle */
  target: string[] | null;
  /** she taps it with her hand once she gets there */
  tap?: boolean;
  line: (name: string, helper: string) => Localized;
};

const TOUR: TourStep[] = [
  {
    room: "today",
    target: ['[data-tour="now"] h3', '[data-tour="now"]'],
    line: (name) => ({
      en: `Welcome to my home${name ? `, ${name}` : ""}! Come, let me show you around. This first room is your day. Whatever is due right now, a medicine or a meal, comes up right here.`,
      hi: `मेरे घर में आपका स्वागत है${name ? `, ${name}` : ""}! आइए, मैं आपको सब दिखाती हूँ. यह पहला कमरा आपका दिन है. अभी जो करना है, दवा या खाना, वह यहीं आता है.`,
    }),
  },
  {
    room: "today",
    target: ['[data-tour="now"] [data-tour-done]'],
    tap: true,
    line: () => ({
      en: "When it's done, you press this green button. Just like this! Then I know you're okay, and I won't keep reminding you.",
      hi: "जब हो जाए, तो यह हरा बटन दबाइए. बस ऐसे! तब मुझे पता चलेगा कि आप ठीक हैं, और मैं बार-बार याद नहीं दिलाऊँगी.",
    }),
  },
  {
    room: "today",
    target: ['[data-tour="help"]'],
    tap: true,
    line: (_, helper) => ({
      en: `I'm here to take care of you. So if you ever feel unwell, for any reason, just tap me and say "I'm not well". I'll call ${helper} for you straight away. You can also hold this red Help button.`,
      hi: `मैं आपका ख्याल रखने के लिए हूँ. इसलिए कभी भी, किसी भी वजह से तबीयत ठीक न लगे, तो बस मुझे छूकर कहिए "मेरी तबीयत ठीक नहीं". मैं उसी पल ${helper} को फ़ोन करूँगी. यह लाल 'मदद' बटन दबाकर भी रख सकते हैं.`,
    }),
  },
  {
    room: "meds",
    via: '[data-tour-tab="meds"]',
    target: ['[data-tour="meds-list"]'],
    line: () => ({
      en: "Come, this is your medicine room. Every medicine you take lives here. You can add one by typing its name, or take a photo of the prescription, and I'll read the names for you to check.",
      hi: "आइए, यह आपकी दवाओं का कमरा है. आपकी हर दवा यहीं रहती है. नाम लिखकर दवा जोड़ सकते हैं, या पर्ची की फ़ोटो लीजिए, मैं नाम पढ़ूँगी और आप जाँच लीजिए.",
    }),
  },
  {
    room: "care",
    via: '[data-tour-tab="care"]',
    target: ['[data-tour="care-feel"]'],
    line: () => ({
      en: "This is the care room. Each day, you can tell me how you're feeling, a little like a diary. I'll keep your last seven days, so you can show your doctor.",
      hi: "यह देखभाल का कमरा है. हर दिन आप मुझे बता सकते हैं कि आप कैसा महसूस कर रहे हैं, एक छोटी डायरी जैसा. मैं पिछले सात दिन रखूँगी, ताकि आप डॉक्टर को दिखा सकें.",
    }),
  },
  {
    room: "family",
    via: '[data-tour-tab="family"]',
    target: ['[data-tour="heart"]', '[data-tour="family-invite"]', "main h1"],
    tap: true,
    line: () => ({
      en: "And this is where your family lives. Press the heart to send them your love. When they send you a note, I'll bring it to you in my little bag.",
      hi: "और यहाँ आपका परिवार रहता है. दिल दबाइए और उन्हें अपना प्यार भेजिए. जब वे आपको संदेश भेजेंगे, मैं उसे अपने छोटे से थैले में लेकर आऊँगी.",
    }),
  },
  {
    room: "talk",
    via: '[data-tour-tab="talk"]',
    target: ['[data-tour="talk-mic"]', "main h1"],
    line: () => ({
      en: "This is my favourite room. Here we can just talk. Press the microphone and tell me anything, any time. I love listening.",
      hi: "यह मेरा सबसे प्यारा कमरा है. यहाँ हम बस बातें करते हैं. माइक दबाइए और मुझे कुछ भी बताइए, कभी भी. मुझे सुनना अच्छा लगता है.",
    }),
  },
  {
    room: "settings",
    via: '[data-tour="settings"]',
    target: ['[data-tour="set-size"]'],
    line: () => ({
      en: "Behind this little wheel are your settings. You can make the letters bigger, change my language or voice, and add the numbers of your loved ones.",
      hi: "इस छोटे पहिये के पीछे आपकी सेटिंग है. यहाँ अक्षर बड़े कर सकते हैं, मेरी भाषा या आवाज़ बदल सकते हैं, और अपनों के नंबर जोड़ सकते हैं.",
    }),
  },
  {
    room: "today",
    via: '[data-tour-tab="today"]',
    target: null,
    line: (name) => ({
      en: `That's my whole home, and now it's your home too${name ? `, ${name}` : ""}. I'll stay close by. Tap me any time you need me!`,
      hi: `यह मेरा पूरा घर है, और अब यह आपका भी घर है${name ? `, ${name}` : ""}. मैं पास ही रहूँगी. जब भी ज़रूरत हो, मुझे छू लीजिए!`,
    }),
  },
];

// her size on the tour, and where her pointing fingertip is in the "point" picture (left edge, a third of the way down)
const FW = 128;
const FH = 160;
const TIP_Y = 0.32;

function findTarget(sel: string[] | null) {
  if (!sel) return null;
  for (const q of sel) {
    const el = document.querySelector<HTMLElement>(q);
    if (el && el.getBoundingClientRect().height > 0) return el;
  }
  return null;
}

function goTo(room: Room) {
  const s = useAsha.getState();
  if (room === "settings") {
    if (s.tab !== "settings") s.openSettings();
  } else if (s.tab !== room) s.setTab(room);
}

/**
 * After setup, the fairy shows the person round her whole home once, like a host showing a guest around:
 * Today (what is due, the green button, Help), then each room in turn. She flies to each thing she talks about,
 * points at it or taps it, and her bubble sits on the other side so it never hides what she is showing.
 * Back goes to what she said before.
 */
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
    goTo("today");
    finishTour();
    window.scrollTo({ top: 0 });
  };
  const label = useFairyLabel();
  const [i, setI] = useState(0);
  const [back, setBack] = useState(false);
  // "via": on her way, tapping the room's button; "here": showing the thing in the room
  const [phase, setPhase] = useState<"via" | "here">("here");
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const [arrived, setArrived] = useState(false);
  const step = TOUR[i];
  // the phone's back key goes back one step in the tour, never out of the app
  useBack(() => {
    if (i > 0) {
      setBack(true);
      setI(i - 1);
    }
    return true;
  }, true);
  const line = step.line(name, helperIn(lang));
  const spoken = step.line(name, helperIn(voiceLang));

  // a new step: walk forward through the room's button; going back, just be in that room
  useLayoutEffect(() => {
    if (step.via && !back) setPhase("via");
    else {
      goTo(step.room);
      setPhase("here");
    }
  }, [i]);

  useLayoutEffect(() => {
    setArrived(false);
    const timers: number[] = [];
    const via = phase === "via";
    const measure = (el: HTMLElement | null) => {
      setRect(el ? el.getBoundingClientRect() : null);
      setVp({ w: window.innerWidth, h: window.innerHeight });
    };
    let el: HTMLElement | null = null;
    const place = () => {
      el = via ? findTarget([step.via!]) : findTarget(step.target);
      // bring it into the upper part of the screen, so her bubble has room underneath (fixed bars stay put)
      if (el && !el.closest(".dock, header, nav") && getComputedStyle(el).position !== "fixed") {
        const r = el.getBoundingClientRect();
        window.scrollTo({ top: window.scrollY + r.top - Math.max(96, window.innerHeight * 0.22), behavior: "instant" as ScrollBehavior });
      }
      measure(el);
    };
    if (!via && step.via) window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    // the new room needs a moment to draw before she can find things in it
    timers.push(window.setTimeout(place, via ? 0 : 60));
    timers.push(
      window.setTimeout(() => {
        measure(el);
        setArrived(true);
      }, 800),
    );
    // on the room's button: a tap, and in she goes
    if (via)
      timers.push(
        window.setTimeout(() => {
          goTo(step.room);
          setPhase("here");
        }, 1900),
      );
    const onMove = () => measure(el);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [i, phase]);

  // she speaks once she is showing the thing, and her words appear as she says them
  useEffect(() => {
    if (voiceOn && phase === "here") void speak(t(voiceLang, spoken), voiceLang, "fairy");
  }, [i, phase, voiceLang]);
  useEffect(() => () => stopSpeaking(), []);

  const via = phase === "via";
  const tapping = arrived && (via || step.tap);

  // Where she flies: her fingertip on the thing. Narrow things on the right (Help, Settings) get her from the left,
  // turned round; everything else from the right edge, pointing left at it.
  const pad = 8;
  let fx = (vp.w - FW * 1.4) / 2;
  let fy = vp.h * 0.18;
  let flip = false;
  const big = !rect;
  if (rect) {
    const narrowRight = rect.width < vp.w / 2 && rect.left + rect.width / 2 > vp.w / 2;
    const tipX = narrowRight ? rect.left + Math.min(rect.width * 0.35, 40) : rect.right - Math.min(rect.width * 0.18, 70);
    const tipY = rect.top + Math.min(rect.height / 2, 60);
    flip = narrowRight;
    fx = flip ? tipX - FW : tipX;
    fy = tipY - FH * TIP_Y;
    fx = Math.max(4, Math.min(vp.w - FW - 4, fx));
    if (fy < 8) fy = Math.max(8, rect.bottom - FH * 0.2);
    fy = Math.max(8, Math.min(vp.h - FH - 8, fy));
  }

  // The bubble goes on the far side of the thing and of her, never on top of either.
  let place: CSSProperties;
  let tail: "up" | "down" | null = null;
  if (!rect) place = { top: fy + FH * 1.4 + 12 };
  else {
    const top = Math.min(rect.top, fy) - pad;
    const bottom = Math.max(rect.bottom, fy + FH) + pad;
    if (vp.h - bottom >= top) {
      place = { top: bottom + 10 };
      tail = "up";
    } else {
      place = { bottom: vp.h - top + 10 };
      tail = "down";
    }
  }
  const tailX = Math.max(28, Math.min(vp.w - 44, fx + FW / 2));
  const mood: PixieMood = !rect ? (arrived ? "wave" : "fly") : arrived ? "point" : "flyside";

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={label}>
      {rect ? (
        <div
          className="pointer-events-none fixed rounded-3xl transition-all duration-500"
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
      {rect && tapping ? (
        <span
          key={`tap-${i}-${phase}`}
          className="tour-tap pointer-events-none fixed"
          style={{ left: flip ? fx + FW : fx, top: fy + FH * TIP_Y }}
          aria-hidden
        />
      ) : null}
      <div
        className="tour-fly pointer-events-none fixed left-0 top-0"
        style={{
          width: big ? FW * 1.4 : FW,
          height: big ? FH * 1.4 : FH,
          transform: `translate(${fx}px, ${fy}px)`,
        }}
      >
        <div className={`h-full w-full ${tapping ? "tour-poke" : "tour-bob"}`} style={{ transform: flip ? "scaleX(-1)" : undefined }}>
          <Pixie mood={mood} className="h-full w-full" />
        </div>
      </div>
      {via ? null : (
        <div className="fixed inset-x-0 mx-auto max-w-lg px-4" style={place}>
          <div key={i} className="fi-bubble relative rounded-3xl border-2 border-[#f3c4d0] bg-paper p-4 shadow-lg">
            {tail ? (
              <span
                className={`tour-tail absolute ${tail === "up" ? "tour-tail-up" : "tour-tail-down"}`}
                style={{ left: `calc(${tailX}px - max(1rem, (100vw - 32rem) / 2 + 1rem) - 10px)` }}
                aria-hidden
              />
            ) : null}
            <p className="text-sm font-bold uppercase tracking-wide text-[#d9506f]">{label}</p>
            <p className="mt-1 text-lg leading-snug">
              {sentences(t(lang, line)).map((part, k) => (
                <span key={k} className="fi-word" style={{ animationDelay: `${0.4 + k * SENTENCE_S}s` }}>
                  {part}
                </span>
              ))}
            </p>
            <div className="mt-3 grid grid-cols-[auto_auto_1fr] gap-2">
              <button
                type="button"
                disabled={i === 0}
                aria-label={t(lang, { en: "Back: hear what she said before", hi: "पीछे: पिछली बात फिर सुनें" })}
                className="min-h-12 rounded-2xl border border-line px-3 text-base font-bold text-quiet disabled:opacity-40"
                onClick={() => {
                  setBack(true);
                  setI(i - 1);
                }}
              >
                ← {t(lang, { en: "Back", hi: "पीछे" })}
              </button>
              <button
                type="button"
                className="min-h-12 rounded-2xl border border-line px-3 text-base font-bold text-quiet"
                onClick={() => void speak(t(voiceLang, spoken), voiceLang, "fairy")}
              >
                🔊 {t(lang, { en: "Again", hi: "फिर से" })}
              </button>
              <Button
                className="min-h-12"
                onClick={() => {
                  setBack(false);
                  if (i < TOUR.length - 1) setI(i + 1);
                  else finish();
                }}
              >
                {i < TOUR.length - 1 ? t(lang, { en: "Next", hi: "आगे" }) : t(lang, { en: "Thank you", hi: "शुक्रिया" })}
              </Button>
            </div>
            <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
              {TOUR.map((_, k) => (
                <span key={k} className={`ob-dot h-2 rounded-full ${k === i ? "w-6 bg-[#d9506f]" : "w-2 bg-line"}`} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
