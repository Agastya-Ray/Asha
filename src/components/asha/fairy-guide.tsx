import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/components/asha/bits";
import { Pixie, type PixieMood } from "@/components/asha/pixie";
import type { Localized } from "@/lib/asha/plans";
import { digits } from "@/lib/asha/schedule";
import { useAsha } from "@/lib/asha/store";
import { aimAt, aimRect } from "@/lib/asha/aim";
import { apiChat } from "@/lib/asha/api";
import { canListen, listenOnce } from "@/lib/asha/listen";
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
// on the tour each sentence waits for her voice to reach it: about this long per word at her slow, gentle pace
const WORD_S = 0.5;
function sentenceDelays(parts: string[]) {
  let at = 0.6;
  return parts.map((p) => {
    const start = at;
    at += p.trim().split(/\s+/).length * WORD_S + 0.4;
    return start;
  });
}
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
  /** a resting place: she asks if anything is unclear, and offers to show any room again */
  check?: boolean;
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
      en: "When it's done, you press this big button. Just like this! Then I know you're okay, and I won't keep reminding you.",
      hi: "जब हो जाए, तो यह बड़ा बटन दबाइए. बस ऐसे! तब मुझे पता चलेगा कि आप ठीक हैं, और मैं बार-बार याद नहीं दिलाऊँगी.",
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
      en: "Come, this is your medicine room. Every medicine you take lives here, with how many tablets are left.",
      hi: "आइए, यह आपकी दवाओं का कमरा है. आपकी हर दवा यहीं रहती है, और कितनी गोलियाँ बची हैं, वह भी.",
    }),
  },
  {
    room: "meds",
    target: ['[data-tour="meds-add"]'],
    line: () => ({
      en: "To add a new medicine, press this button. Then just type its name, and when you take it.",
      hi: "नई दवा जोड़नी हो, तो यह बटन दबाइए. फिर बस उसका नाम लिखिए, और कब लेनी है.",
    }),
  },
  {
    room: "meds",
    target: ['[data-tour="meds-photo"]', '[data-tour="meds-add"]'],
    line: () => ({
      en: "Or, take a photo of your prescription here. I will read the names for you. Then you check them, slowly, one by one.",
      hi: "या फिर, यहाँ अपनी पर्ची की फ़ोटो लीजिए. मैं नाम पढ़ूँगी. फिर आप उन्हें आराम से, एक एक करके जाँच लीजिए.",
    }),
  },
  {
    room: "meds",
    target: null,
    check: true,
    line: (name) => ({
      en: `Let's rest here for a moment${name ? `, ${name}` : ""}. That was a lot! If you have a question, please ask me. I'm more than happy to answer. Or if you want to see any room again, just tell me, and I'll show you around again.`,
      hi: `चलिए, यहाँ थोड़ा रुकते हैं${name ? `, ${name}` : ""}. बहुत कुछ देख लिया! कुछ पूछना हो, तो ज़रूर पूछिए. मुझे जवाब देकर बहुत अच्छा लगेगा. या कोई कमरा फिर से देखना हो, तो बस बताइए, मैं फिर से दिखा दूँगी.`,
    }),
  },
  {
    room: "care",
    target: ['[data-tour="care-feel"]'],
    line: () => ({
      en: "This is the care room, for meals and your chart. You open it from a card on Today. Each day, you can tell me how you're feeling, a little like a diary. I'll keep your last seven days, so you can show your doctor.",
      hi: "यह देखभाल का कमरा है, खाने और चार्ट के लिए. यह 'आज' के एक कार्ड से खुलता है. हर दिन आप मुझे बता सकते हैं कि आप कैसा महसूस कर रहे हैं, एक छोटी डायरी जैसा. मैं पिछले सात दिन रखूँगी, ताकि आप डॉक्टर को दिखा सकें.",
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
    room: "talk",
    target: null,
    check: true,
    line: () => ({
      en: "Are you doing okay? We're nearly done. If anything is not clear, ask me, any time. Or choose a room below, and I'll show it to you again.",
      hi: "आप ठीक हैं? हम लगभग पूरा देख चुके. कुछ भी साफ़ न हो, तो मुझसे पूछिए, कभी भी. या नीचे कोई कमरा चुनिए, मैं फिर से दिखा दूँगी.",
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
    check: true,
    line: (name) => ({
      en: `That's my whole home, and now it's your home too${name ? `, ${name}` : ""}. If you want to see any room again, just tell me. I'll stay close by. Tap me any time you need me!`,
      hi: `यह मेरा पूरा घर है, और अब यह आपका भी घर है${name ? `, ${name}` : ""}. कोई कमरा फिर से देखना हो, तो बस बताइए. मैं पास ही रहूँगी. जब भी ज़रूरत हो, मुझे छू लीजिए!`,
    }),
  },
];

const ROOM_NAME: Record<Room, Localized> = {
  today: { en: "Today", hi: "आज" },
  meds: { en: "Medicines", hi: "दवाएँ" },
  care: { en: "Care", hi: "देखभाल" },
  family: { en: "Family", hi: "परिवार" },
  talk: { en: "Talk", hi: "बात" },
  settings: { en: "Settings", hi: "सेटिंग" },
};

/** "show me the medicines again": which room they named, if any */
function roomSaid(said: string): Room | null {
  if (/medicine|\bmeds?\b|tablet|pill|prescription|दवा|गोली|पर्ची/i.test(said)) return "meds";
  if (/\bcare\b|meal|food|diary|feel|chart|देखभाल|खाना|डायरी/i.test(said)) return "care";
  if (/family|daughter|\bson\b|heart|परिवार|बेटी|बेटा/i.test(said)) return "family";
  if (/\btalk|chat|microphone|\bmic\b|बात|माइक/i.test(said)) return "talk";
  if (/setting|wheel|letters|language|voice|सेटिंग|भाषा|आवाज़|अक्षर/i.test(said)) return "settings";
  if (/today|my day|help button|done button|\bआज\b|मदद/i.test(said)) return "today";
  return null;
}

const TOUR_CONTEXT = `Right now you are their fairy, showing them round the Asha app for the first time. They stopped to ask you something about it. The rooms:
Today: what is due right now (a medicine or a meal); press the big Done button when it's done; the red Help button at the top calls their loved one.
Medicines: the list of their medicines and tablets left; "Add a medicine" to type one in; "Photo of prescription" to have the names read.
Care: meals, a daily "how do you feel" diary, a chart of the last seven days for the doctor. Opened from a card on Today.
Family: press the heart to send love; notes from family come to them.
Talk: press the microphone and just talk.
Settings: the little wheel at the top; bigger letters, language, voice, loved ones' numbers.
Answer simply and kindly, and say where to press.`;

// her size on the tour, and where her pointing fingertip is in the "point" picture (left edge, a third of the way down)
const FW = 168;
const FH = 210;
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
 * Today (what is due, the big button, Help), then each room in turn. She flies to each thing she talks about,
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
  // "via": on her way, tapping the room's button; "here": showing the thing in the room.
  // One state, so a new step never starts for a moment in the last step's phase (that made her say a line twice).
  const [pos, setPos] = useState<{ i: number; phase: "via" | "here" }>({ i: 0, phase: "here" });
  const { i, phase } = pos;
  // going back, she is just in that room; going forward into a new room, she flies to its button first
  const go = (n: number, backwards = false) => setPos({ i: n, phase: TOUR[n].via && !backwards ? "via" : "here" });
  // showing a room again from a resting place: where to come back to afterwards
  const [resume, setResume] = useState<number | null>(null);
  // her bubble and voice wait until she has arrived and had a breath, so nothing happens all at once
  // (kept per step, so a new step never sees the last one's "ready" for a moment and speaks too soon)
  const [readyFor, setReadyFor] = useState("");
  const ready = readyFor === `${i}-${phase}`;
  // what she answered to their question, in place of her line
  const [answer, setAnswer] = useState<string | null>(null);
  const [ear, setEar] = useState<"" | "listening" | "thinking">("");
  const asked = useRef(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  // the words on the thing, which her finger touches (the spotlight still lights the whole thing)
  const [aim, setAim] = useState<DOMRect | null>(null);
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const [arrived, setArrived] = useState(false);
  const step = TOUR[i];
  // the phone's back key goes back one step in the tour, never out of the app
  useBack(() => {
    if (i > 0) go(i - 1, true);
    return true;
  }, true);
  const line = step.line(name, helperIn(lang));
  const spoken = step.line(name, helperIn(voiceLang));

  // in the room once she has tapped its button (or straight away, going back)
  useLayoutEffect(() => {
    if (phase === "here") goTo(step.room);
  }, [i, phase]);

  useLayoutEffect(() => {
    setArrived(false);
    setAnswer(null);
    setEar("");
    asked.current++;
    stopSpeaking();
    const timers: number[] = [];
    const via = phase === "via";
    const measure = (el: HTMLElement | null) => {
      setRect(el ? el.getBoundingClientRect() : null);
      setAim(el ? aimRect(el) : null);
      setVp({ w: window.innerWidth, h: window.innerHeight });
    };
    let el: HTMLElement | null = null;
    const place = (tries = 0) => {
      el = via ? findTarget([step.via!]) : findTarget(step.target);
      // a room can still be loading (the family circle on a slow phone): look again for a few seconds
      if (!el && step.target && !via && tries < 10) {
        timers.push(window.setTimeout(() => place(tries + 1), 400));
        return;
      }
      // bring it into the upper part of the screen, so her bubble has room underneath (fixed bars stay put)
      if (el && !el.closest(".dock, header, nav") && getComputedStyle(el).position !== "fixed") {
        const r = el.getBoundingClientRect();
        window.scrollTo({ top: window.scrollY + r.top - Math.max(96, window.innerHeight * 0.22), behavior: "instant" as ScrollBehavior });
      }
      measure(el);
      // she takes a while to fly there; once settled, a breath, and then she speaks
      timers.push(
        window.setTimeout(() => {
          measure(el);
          setArrived(true);
        }, 1500),
      );
      if (!via) timers.push(window.setTimeout(() => setReadyFor(`${i}-${phase}`), 2300));
    };
    if (!via && step.via) window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    // Slowly, one thing at a time: the new room opens and she stays by its button a moment so it can be seen,
    // then she flies to the thing, settles, takes a breath, and only then speaks.
    const start = via ? 0 : step.via ? 1200 : 60;
    timers.push(window.setTimeout(() => place(), start));
    // on the room's button: a tap, a pause, and in she goes
    if (via) timers.push(window.setTimeout(() => setPos({ i, phase: "here" }), 4000));
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
    if (voiceOn && phase === "here" && ready) void speak(t(voiceLang, spoken), voiceLang, "fairy");
  }, [i, phase, ready, voiceLang]);

  // the rooms she has shown so far, to see again
  const seen = Array.from(new Set(TOUR.slice(0, i + 1).filter((s) => !s.check).map((s) => s.room)));
  const replay = (room: Room) => {
    setResume(i);
    go(TOUR.findIndex((s) => s.room === room && !s.check));
  };
  const next = () => {
    const after = TOUR[i + 1];
    // done showing that room again: back to where they asked
    if (resume !== null && (!after || after.room !== step.room || after.check)) {
      setResume(null);
      return go(resume, true);
    }
    if (after) go(i + 1);
    else finish();
  };
  const ask = async () => {
    const mine = asked.current;
    const tell = (l: Localized) => {
      setEar("");
      setAnswer(t(lang, l));
      void speak(t(voiceLang, l), voiceLang, "fairy");
    };
    if (!canListen())
      return tell({ en: "I can't hear on this phone. Press one of the rooms below, and I'll show it again.", hi: "इस फ़ोन पर मैं सुन नहीं पाती. नीचे कोई कमरा दबाइए, मैं फिर से दिखा दूँगी." });
    setEar("listening");
    const r = await listenOnce(voiceLang);
    if (mine !== asked.current) return;
    const said = r.text.trim();
    if (!said)
      return tell(
        r.problem === "denied"
          ? { en: "I can't use the microphone yet. You can allow it in Settings later.", hi: "माइक अभी चालू नहीं है. बाद में सेटिंग में चालू कर सकते हैं." }
          : { en: "I didn't hear that. Press the button and ask me again, slowly.", hi: "मैं सुन नहीं पाई. बटन दबाकर फिर से, धीरे से पूछिए." },
      );
    const room = roomSaid(said);
    if (room && seen.includes(room) && !/\?|how|why|what|कैसे|क्यों|क्या/i.test(said)) {
      setEar("");
      return replay(room);
    }
    setEar("thinking");
    const res = await apiChat({ show: lang, say: voiceLang, context: TOUR_CONTEXT, turns: [{ role: "user", content: said }] });
    if (mine !== asked.current) return;
    setEar("");
    if (!res.ok)
      return tell({ en: "I couldn't think of the answer just now. Ask me again in the Talk room later.", hi: "अभी मैं जवाब नहीं सोच पाई. बाद में 'बात' वाले कमरे में फिर पूछिए." });
    setAnswer(res.show);
    void speak(res.say, voiceLang, "fairy");
  };
  useEffect(() => () => stopSpeaking(), []);

  const via = phase === "via";
  const tapping = arrived && (via || step.tap);

  // Where she flies: her fingertip right at the words on the thing, from its right, or from its left turned round
  // when there is no room on the right (Help, Settings).
  const pad = 8;
  let fx = (vp.w - FW * 1.4) / 2;
  let fy = vp.h * 0.1;
  let flip = false;
  const big = !rect;
  if (rect && aim) {
    const at = aimAt(aim, FW, FH, TIP_Y, vp.w);
    fx = at.x;
    flip = at.flip;
    fy = at.y;
    fy = Math.max(8, Math.min(vp.h - FH - 8, fy));
  }

  // The bubble sits at the far end of the screen from what she is showing, so it never covers the thing
  // (or the rest of its card).
  let place: CSSProperties;
  let tail: "up" | "down" | null = null;
  // with nothing to show she floats near the top, and her bubble (taller at a resting place) sits at the bottom
  if (!rect) place = { bottom: 16 };
  else if (rect.top + rect.height / 2 < vp.h / 2) {
    place = { bottom: 16 };
    tail = null;
  } else {
    place = { top: 16 };
    tail = null;
  }
  const tailX = Math.max(28, Math.min(vp.w - 44, fx + FW / 2));
  const mood: PixieMood = ear === "listening" ? "asking" : ear === "thinking" ? "thinking" : !rect ? (arrived ? "wave" : "fly") : arrived ? "point" : "flyside";

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
      {via || !ready ? null : (
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
            <p key={answer ?? ""} className="mt-1 text-lg leading-snug">
              {sentences(answer ?? t(lang, line)).map((part, k, all) => (
                <span key={k} className="fi-word" style={{ animationDelay: `${sentenceDelays(all)[k]}s` }}>
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
                onClick={() => go(i - 1, true)}
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
              <Button className="min-h-12" onClick={next}>
                {i < TOUR.length - 1 || resume !== null ? t(lang, { en: "Next", hi: "आगे" }) : t(lang, { en: "Thank you", hi: "शुक्रिया" })}
              </Button>
            </div>
            {step.check ? (
              <div className="mt-3 border-t border-line pt-3">
                <button
                  type="button"
                  disabled={ear !== ""}
                  onClick={() => void ask()}
                  className="min-h-12 w-full rounded-2xl border-2 border-[#f3c4d0] bg-[#fff5f7] px-3 text-base font-bold text-[#b8405d] disabled:opacity-70"
                >
                  🎤{" "}
                  {ear === "listening"
                    ? t(lang, { en: "I'm listening…", hi: "मैं सुन रही हूँ…" })
                    : ear === "thinking"
                      ? t(lang, { en: "Let me think…", hi: "सोचने दीजिए…" })
                      : t(lang, { en: "Ask me something", hi: "मुझसे कुछ पूछिए" })}
                </button>
                <p className="mt-3 text-base text-quiet">{t(lang, { en: "See a room again:", hi: "कोई कमरा फिर से देखें:" })}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {seen.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => replay(r)}
                      className="min-h-11 rounded-full border border-line bg-paper px-4 text-base font-bold text-ink"
                    >
                      {t(lang, ROOM_NAME[r])}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
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
