import { useEffect, useRef, useState, type CSSProperties } from "react";
import { t } from "@/components/asha/bits";
import { Pixie, type PixieMood } from "@/components/asha/pixie";
import type { Localized } from "@/lib/asha/plans";
import { fairySound } from "@/lib/asha/sfx";
import { useAsha } from "@/lib/asha/store";
import { speak, useSpeech } from "@/lib/asha/voice";
import { awake } from "@/lib/asha/companion";

/**
 * Titli is a phone pet, not a sticker in the corner. Whenever she has nothing to remind you of, every so often
 * she flies out to something on the screen you are looking at, points at it, says a little something about it
 * (or wonders out loud what it is), then flies back to her corner. Opening a room, she goes to show you its
 * main thing first. Tap her while she is out and she comes straight back to listen.
 */

type Spot = { sel: string; lines: (text: string) => Localized[]; mood?: PixieMood; tap?: boolean };

// the things worth visiting, most interesting first; text = what the element says, for her to read out
const SPOTS: Spot[] = [
  {
    sel: '[data-tour="now"] h3',
    lines: (x) => [
      { en: `Ooh, ${x}! I'll remind you right on time.`, hi: `अरे, ${x}! मैं ठीक समय पर याद दिलाऊँगी.` },
      { en: `${x} is next. Shall we do it together?`, hi: `अगला है ${x}. साथ में करें?` },
    ],
  },
  {
    sel: '[data-tour="now"] [data-tour-done]',
    tap: true,
    lines: () => [{ en: "When it's done, tap this big one. I'll do a happy dance!", hi: "हो जाए तो यह बड़ा बटन दबाइए. मैं खुशी से नाचूँगी!" }],
  },
  {
    sel: '[data-pet="water"]',
    lines: () => [
      { en: "Have you had some water? Tap here after each glass!", hi: "पानी पिया? हर गिलास के बाद यहाँ दबाइए!" },
      { en: "Sip, sip! Water keeps you fresh.", hi: "घूँट घूँट! पानी से ताज़गी रहती है." },
    ],
  },
  {
    sel: '[data-tour="meds-list"]',
    lines: () => [
      { en: "All your medicines live here. I keep count of the tablets for you.", hi: "आपकी सारी दवाएँ यहीं रहती हैं. गोलियाँ मैं गिनती रहती हूँ." },
      { en: "If a name looks wrong, you can change it here.", hi: "कोई नाम गलत लगे तो यहाँ बदल सकते हैं." },
    ],
  },
  {
    sel: '[data-tour="care-feel"]',
    mood: "asking",
    lines: () => [{ en: "How is your body today? Tell me here, I'm listening.", hi: "आज शरीर कैसा है? यहाँ बताइए, मैं सुन रही हूँ." }],
  },
  {
    sel: '[data-tour="heart"]',
    tap: true,
    lines: () => [{ en: "Shall we send your family some love? Press the heart!", hi: "परिवार को थोड़ा प्यार भेजें? दिल दबाइए!" }],
  },
  {
    sel: '[data-tour="talk-mic"]',
    lines: () => [{ en: "Psst… press this and talk to me. About anything!", hi: "श्श… इसे दबाइए और मुझसे बात कीजिए. किसी भी बारे में!" }],
  },
  {
    sel: '[data-tour="set-size"]',
    lines: () => [{ en: "Letters too small? You can make them bigger here.", hi: "अक्षर छोटे लगते हैं? यहाँ बड़े कर सकते हैं." }],
  },
  {
    sel: '[data-tour="help"]',
    lines: () => [{ en: "This red button is always here for you. And so am I.", hi: "यह लाल बटन हमेशा आपके लिए है. और मैं भी." }],
  },
];

// anything else on the screen: she reads the heading and wonders about it
const CURIOUS = (x: string): Localized[] => [
  { en: `Hmm, "${x}"… what's in here?`, hi: `हम्म, "${x}"… इसमें क्या है?` },
  { en: `Let me peek… "${x}"!`, hi: `ज़रा देखूँ… "${x}"!` },
];

const FW = 96;
const FH = 120;
const TIP_Y = 0.32;

function visible(el: Element) {
  const r = el.getBoundingClientRect();
  // fully on screen, clear of the header and the tab bar
  return r.height > 0 && r.top > 90 && r.bottom < window.innerHeight - 100;
}

function pick(seen: Set<string>, first: boolean) {
  const found: { el: HTMLElement; lines: Localized[]; mood?: PixieMood; tap?: boolean; key: string }[] = [];
  for (const s of SPOTS) {
    const el = document.querySelector<HTMLElement>(s.sel);
    if (!el || !visible(el)) continue;
    const text = (el.innerText || "").trim().split("\n")[0].slice(0, 40);
    found.push({ el, lines: s.lines(text), mood: s.mood, tap: s.tap, key: s.sel });
  }
  document.querySelectorAll<HTMLElement>("main h2").forEach((el) => {
    const text = (el.innerText || "").trim().slice(0, 40);
    if (text && visible(el)) found.push({ el, lines: CURIOUS(text), mood: "thinking", key: `h2|${text}` });
  });
  if (!found.length) return null;
  const fresh = found.filter((f) => !seen.has(f.key));
  const from = fresh.length ? fresh : found;
  // entering a room she goes to its main thing; later, mostly the next interesting thing, sometimes anything,
  // so she doesn't repeat herself
  return first ? found[0] : from[Math.random() < 0.6 ? 0 : Math.floor(Math.random() * from.length)];
}

/** Is she free to wander? Not while she reminds, listens, sleeps, is quiet, or something is open on top. */
function free() {
  const s = useAsha.getState();
  if (s.quietUntil > Date.now() || !awake(s.wakeTime, s.sleepTime, new Date())) return false;
  if (useSpeech.getState().active) return false;
  if (document.querySelector('[role="dialog"], [data-quiet-sheet]')) return false;
  const dock = document.querySelector<HTMLElement>(".fairy-dock, .fairy-perched");
  // a family note, a question or a cheer waits in her corner: she stays put. A due medicine is fine:
  // her trips often go to that very card.
  return !dock || ["idle", "due", "missed"].includes(dock.dataset.fairy ?? "");
}

type Trip = { phase: "out" | "there" | "back"; x: number; y: number; flip: boolean; mood: PixieMood; words: string; tap: boolean };

export function PetRoam() {
  const tab = useAsha((s) => s.tab);
  const lang = useAsha((s) => s.lang);
  const [trip, setTrip] = useState<Trip | null>(null);
  const seen = useRef(new Set<string>());
  const lastVoice = useRef(0);
  const timers = useRef<number[]>([]);
  const later = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms));
  const clear = () => {
    timers.current.forEach((x) => window.clearTimeout(x));
    timers.current = [];
  };

  // where she starts and ends: her corner, or just off the right edge when the corner is empty
  const home = () => {
    const dock = document.querySelector<HTMLElement>(".fairy-dock .fairy-scene");
    if (dock) {
      const r = dock.getBoundingClientRect();
      return { x: r.left + r.width / 2 - FW / 2, y: r.bottom - FH, away: false };
    }
    return { x: window.innerWidth + 20, y: window.innerHeight * 0.45, away: true };
  };

  const go = (first: boolean) => {
    if (!free()) return false;
    const spot = pick(seen.current, first);
    if (!spot) return false;
    seen.current.add(spot.key);
    const line = spot.lines[Math.floor(Math.random() * spot.lines.length)];
    const words = t(lang, line);
    const r = spot.el.getBoundingClientRect();
    const vw = window.innerWidth;
    const narrowRight = r.width < vw / 2 && r.left + r.width / 2 > vw / 2;
    const tipX = narrowRight ? r.left + Math.min(r.width * 0.3, 30) : r.right - Math.min(r.width * 0.15, 60);
    let x = narrowRight ? tipX - FW : tipX;
    let y = r.top + Math.min(r.height / 2, 40) - FH * TIP_Y;
    x = Math.max(4, Math.min(vw - FW - 4, x));
    y = Math.max(70, Math.min(window.innerHeight - FH - 90, y));
    const h = home();
    document.documentElement.classList.add("pet-out");
    fairySound("flutter");
    setTrip({ phase: "out", x: h.x, y: h.y, flip: false, mood: "flyside", words: "", tap: false });
    // next frame: she flies over
    later(30, () => setTrip({ phase: "out", x, y, flip: narrowRight, mood: "flyside", words: "", tap: false }));
    later(950, () => {
      setTrip({ phase: "there", x, y, flip: narrowRight, mood: spot.mood ?? "point", words, tap: !!spot.tap });
      // she says it out loud when you open a room, and otherwise now and then, so she never chatters
      const s = useAsha.getState();
      if (s.voiceOn && (first || Date.now() - lastVoice.current > 4 * 60_000)) {
        lastVoice.current = Date.now();
        void speak(t(s.voiceLang, line), s.voiceLang, "fairy");
      }
    });
    later(950 + Math.max(3800, words.length * 75), () => back());
    return true;
  };

  const back = () => {
    clear();
    const h = home();
    setTrip((tr) => (tr ? { ...tr, phase: "back", x: h.x, y: h.y, flip: false, mood: "flyside", words: "", tap: false } : tr));
    later(900, () => {
      document.documentElement.classList.remove("pet-out");
      setTrip(null);
    });
  };

  // opening a room: after a moment she goes to show you its main thing; then every half minute or so, something else
  useEffect(() => {
    let alive = true;
    const loop = (first: boolean, wait: number) =>
      later(wait, () => {
        if (!alive) return;
        const went = go(first);
        loop(false, went ? 30_000 + Math.random() * 25_000 : 8_000);
      });
    clear();
    loop(true, 2500);
    return () => {
      alive = false;
      clear();
      document.documentElement.classList.remove("pet-out");
      setTrip(null);
    };
  }, [tab]);

  // scrolling or tapping elsewhere sends her home, so she never sits over what you are reading
  useEffect(() => {
    if (!trip || trip.phase === "back") return;
    const away = () => back();
    window.addEventListener("scroll", away, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", away, true);
  }, [trip?.phase]);

  if (!trip) return null;
  const bubbleBelow = trip.y < window.innerHeight / 2;
  const bubble: CSSProperties = {
    left: Math.max(12, Math.min(window.innerWidth - 232, trip.x + FW / 2 - 110)),
    ...(bubbleBelow ? { top: trip.y + FH + 6 } : { top: trip.y - 8, transform: "translateY(-100%)" }),
  };
  return (
    <div className="pointer-events-none fixed inset-0 z-40" aria-live="polite">
      {trip.phase === "there" && trip.tap ? (
        <span className="tour-tap fixed" style={{ left: trip.flip ? trip.x + FW : trip.x, top: trip.y + FH * TIP_Y }} aria-hidden />
      ) : null}
      <button
        type="button"
        aria-label={t(lang, { en: "Titli, come back", hi: "तितली, वापस आओ" })}
        className="tour-fly pointer-events-auto fixed left-0 top-0"
        style={{ width: FW, height: FH, transform: `translate(${trip.x}px, ${trip.y}px)` }}
        onClick={back}
      >
        <div className={`h-full w-full ${trip.phase === "there" && trip.tap ? "tour-poke" : "tour-bob"}`} style={{ transform: trip.flip ? "scaleX(-1)" : undefined }}>
          <Pixie mood={trip.mood} className="h-full w-full" />
        </div>
      </button>
      {trip.phase === "there" && trip.words ? (
        <p className="fi-bubble fixed w-[220px] rounded-2xl border-2 border-[#f3c4d0] bg-paper px-3 py-2 text-base font-bold leading-snug shadow-md" style={bubble}>
          {trip.words}
        </p>
      ) : null}
    </div>
  );
}
