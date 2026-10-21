import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { App } from "@capacitor/app";
import { cn } from "@/lib/cn";
import type { Lang } from "@/lib/asha/types";
import { t, useNow } from "@/components/asha/bits";
import { FairyScene, type FairyMood } from "@/components/asha/fairy";
import { awake, checkinQuestion, companionNudge, nudgeBubble } from "@/lib/asha/companion";
import { actOnSpoken } from "@/components/asha/voice-command";
import { canListen, listenOnce } from "@/lib/asha/listen";
import { buildAgenda } from "@/lib/asha/schedule";
import { todayKey } from "@/lib/asha/time";
import {
  drainNative,
  markHeard,
  pullInbox,
  pushNativeConfig,
  refreshPushToken,
  refreshState,
  startFamilyWatchers,
  textOf,
  unreadOf,
  updateWidget,
  useFamily,
} from "@/lib/asha/family";
import { AshaNative, isNative } from "@/lib/asha/native";
import { useAsha } from "@/lib/asha/store";
import { speak, useSpeech } from "@/lib/asha/voice";
import { fairySound, fairySoundOnce, type Sfx } from "@/lib/asha/sfx";

/** Keeps the Family Circle in sync: on open, on return to the app, and when a push arrives. */
export function FamilyEngine() {
  const hydrated = useAsha((s) => s.hydrated);
  const roleChosen = useAsha((s) => s.roleChosen);
  const role = useAsha((s) => s.appRole);

  useEffect(() => {
    if (!hydrated || !roleChosen) return;
    startFamilyWatchers();
    const sync = async () => {
      await refreshPushToken();
      // only talk to the server when this phone is (or wants to be) in a circle
      const f = useFamily.getState();
      if (role === "family" || f.deviceId) {
        await refreshState();
        await pullInbox();
      }
      void updateWidget();
    };
    void sync();
    const removers: (() => void)[] = [];
    if (isNative) {
      void App.addListener("resume", () => {
        void drainNative().then(() => pullInbox());
      }).then((h) => removers.push(() => void h.remove()));
      // a family message arrived while the app is open
      void AshaNative.addListener("family", () => void drainNative().then(() => pullInbox())).then((h) => removers.push(() => void h.remove()));
      void drainNative();
    }
    const onVis = () => {
      if (document.visibilityState === "visible" && useFamily.getState().circles.length) void pullInbox();
    };
    document.addEventListener("visibilitychange", onVis);
    // turn the floating fairy back on if she was on
    if (isNative && useFamily.getState().bubble) void AshaNative.setBubble({ on: true }).catch(() => undefined);
    return () => {
      removers.forEach((r) => r());
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [hydrated, roleChosen, role]);

  useEffect(() => {
    void pushNativeConfig();
  }, [role]);

  return null;
}

/**
 * The fairy that floats above the tabs: Asha's companion on the phone.
 * She brings family notes (with Chintu), reminds about a medicine or meal that is due or missed,
 * asks "how are you?" once a day, cheers when the doses are done, talks while Asha speaks,
 * and sleeps at night.
 */
export function FairyDock() {
  const lang = useAsha((s) => s.lang);
  const voiceLang = useAsha((s) => s.voiceLang);
  const tab = useAsha((s) => s.tab);
  const setTab = useAsha((s) => s.setTab);
  const name = useAsha((s) => s.name);
  const meds = useAsha((s) => s.meds);
  const meals = useAsha((s) => s.meals);
  const doseLogs = useAsha((s) => s.doseLogs);
  const mealLogs = useAsha((s) => s.mealLogs);
  const snooze = useAsha((s) => s.snooze);
  const checkins = useAsha((s) => s.checkins);
  const wakeTime = useAsha((s) => s.wakeTime);
  const sleepTime = useAsha((s) => s.sleepTime);
  const messages = useFamily((s) => s.messages);
  const heardLocal = useFamily((s) => s.heardLocal);
  const speaking = useSpeech((s) => s.active);
  const now = useNow();
  const [rested, setRested] = useState(readRest);
  // "Don't want me around?": ask why, react, then say good night and fade away
  const [bye, setBye] = useState<"" | "ask" | "sad" | "brave" | "yawn" | "lie" | "gone">("");
  const [awayUntil, setAwayUntil] = useState(readAway);
  // she listens when tapped: what you say goes to the same helper as "Tell Asha"
  const [ear, setEar] = useState<"" | "listening" | "thinking" | "hello" | "shy" | "blush" | "wake" | "missed" | "nomic">("");
  // on Today the reminder card keeps a corner free for her (data-fairy-perch), so she sits there instead of over its text
  const [perch, setPerch] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const el = document.querySelector<HTMLElement>("[data-fairy-perch]");
    if (el !== perch) setPerch(el);
  });
  // while her bubble is up, the page gets extra room at the bottom so the last card can scroll clear of it
  const talking = useRef(false);
  talking.current = false;
  useEffect(() => {
    document.documentElement.classList.toggle("fairy-talking", talking.current);
  });
  const unread = unreadOf({ messages, heardLocal });
  // she always speaks in her own little voice, never the grown-up warm voice Asha uses
  const say = (text: string) => void speak(text, voiceLang, "fairy");

  // Settings and Talk have controls along the bottom edge; she would sit on top of them
  if (tab === "family" || tab === "sos" || tab === "settings") return null;
  if (tab === "talk" && !unread.length) return null;

  let bubble = "";
  let mood: FairyMood | undefined;
  let news = false;
  let onTap = () => {};
  let label = "";
  let kind = "";

  const later = (ms: number, f: () => void) => window.setTimeout(f, ms);
  // a greeting makes her peek out shyly from under her leaf first, then beam
  // woken at night she rubs her eyes first
  const hello = () => {
    const day = awake(wakeTime, sleepTime, new Date());
    setEar(day ? "shy" : "wake");
    if (day) fairySound("giggle");
    later(day ? 1300 : 1800, () => {
      setEar("hello");
      fairySound("chime");
    });
    say(
      day
        ? t(voiceLang, { en: `Hello${name ? ` ${name}` : ""}! I'm right here with you.`, hi: `नमस्ते${name ? ` ${name} जी` : ""}! मैं यहीं आपके पास हूँ.` })
        : t(voiceLang, { en: `Mmm… hello${name ? `, ${name}` : ""}! I was just napping. I'm here if you need me.`, hi: `हम्म… नमस्ते${name ? ` ${name} जी` : ""}! मैं ज़रा सो रही थी. ज़रूरत हो तो मैं यहीं हूँ.` }),
    );
    later(5000, () => setEar(""));
  };
  const blush = () => {
    setEar("blush");
    fairySound("giggle");
    say(t(voiceLang, { en: "Aww, stop it! You're making me blush.", hi: "अरे, बस करिए! मुझे शर्म आ रही है." }));
    later(4000, () => setEar(""));
  };
  const askWhy = () => {
    setBye("ask");
    say(t(voiceLang, { en: "Don't want me around? Why?", hi: "मुझे पास नहीं रखना? क्यों?" }));
  };
  const listen = async () => {
    if (!canListen()) return hello();
    setEar("listening");
    const r = await listenOnce(voiceLang);
    const said = r.text.trim();
    if (!said) {
      // with the microphone refused she says so, instead of asking to hear it again
      setEar(r.problem === "denied" ? "nomic" : "missed");
      later(r.problem === "denied" ? 5000 : 2500, () => setEar(""));
      return;
    }
    if (GO_AWAY.test(said)) {
      setEar("");
      return askWhy();
    }
    if (GREETING.test(said)) return hello();
    if (SWEET.test(said)) return blush();
    setEar("thinking");
    later(700, () => {
      setEar("");
      actOnSpoken(said);
    });
  };

  const goodnight = (sadFirst: boolean) => {
    if (sadFirst) {
      setBye("sad");
      fairySound("sad");
      later(1800, () => {
        setBye("brave");
        fairySound("chime");
        say(t(voiceLang, { en: `That's okay${name ? `, ${name}` : ""}. I'm still here to help you, as a tiny friend or to remind you about your medicines.`, hi: `कोई बात नहीं${name ? ` ${name} जी` : ""}. मैं फिर भी आपकी मदद के लिए यहीं हूँ, छोटी सी दोस्त बनकर या दवाइयाँ याद दिलाने के लिए.` }));
      });
      later(6500, () => {
        setBye("yawn");
        fairySound("yawn");
      });
      later(8800, () => setBye("lie"));
    } else {
      setBye("yawn");
      fairySound("yawn");
      later(2300, () => setBye("lie"));
      say(t(voiceLang, { en: `Okay, well I wanted to sleep anyway. Good night${name ? `, ${name}` : ""}! See you soon.`, hi: `ठीक है, मुझे वैसे भी नींद आ रही थी. शुभ रात्रि${name ? ` ${name} जी` : ""}! जल्दी मिलेंगे.` }));
    }
    later(sadFirst ? 12500 : 6000, () => {
      const until = Date.now() + 3 * 60 * 60 * 1000;
      saveAway(until);
      setAwayUntil(until);
      setBye("gone");
    });
  };

  // after the yawn she curls up on the floor of the screen, sleeps a moment, then fades away softly
  if (bye === "lie") {
    return (
      <div data-fairy="bye-lie" className="fairy-dock fairy-dock-floor fairy-vanish-soft pointer-events-none fixed right-3 z-30">
        <FairyScene news={false} mood="sleep" floor size="md" label={t(lang, { en: "Asha is asleep", hi: "आशा सो रही है" })} />
      </div>
    );
  }
  if (bye && bye !== "gone") {
    const line =
      bye === "ask"
        ? t(lang, { en: "Don't want me around? Why?", hi: "मुझे पास नहीं रखना? क्यों?" })
        : bye === "sad"
          ? t(lang, { en: "Oh… *sniff*", hi: "ओह… *सुबक*" })
          : bye === "brave"
            ? t(lang, { en: "I'm still here to help, as a tiny friend or for your medicines.", hi: "मैं मदद के लिए यहीं हूँ, छोटी दोस्त या दवाइयों के लिए." })
            : t(lang, { en: "*yawn* Good night! See you soon.", hi: "*उबासी* शुभ रात्रि! जल्दी मिलेंगे." });
    const face: FairyMood = bye === "ask" ? "asking" : bye === "sad" ? "sad" : bye === "brave" ? "happy" : "yawn";
    return (
      <div data-fairy={`bye-${bye}`} className={`fairy-dock fixed right-3 z-30 flex items-end gap-2 ${speaking ? "fairy-dock-up" : ""}`}>
        <div className="mb-6 max-w-[13rem] rounded-2xl rounded-br-sm border border-line bg-paper px-3 py-2 text-base font-bold shadow-sm">
          <p>{line}</p>
          {bye === "ask" ? (
            <div className="mt-2 flex flex-col gap-2">
              <button type="button" className="min-h-11 rounded-xl border border-line px-3 text-left" onClick={() => goodnight(false)}>
                {t(lang, { en: "I just want some quiet", hi: "बस थोड़ा शांत रहना है" })}
              </button>
              <button type="button" className="min-h-11 rounded-xl border border-line px-3 text-left" onClick={() => goodnight(true)}>
                {t(lang, { en: "You're bothering me", hi: "तुम परेशान कर रही हो" })}
              </button>
              <button type="button" className="min-h-11 rounded-xl px-3 text-left text-quiet" onClick={() => setBye("")}>
                {t(lang, { en: "Stay, it's fine", hi: "रहो, ठीक है" })}
              </button>
            </div>
          ) : null}
        </div>
        <FairyScene news={false} mood={face} size="md" label={line} />
      </div>
    );
  }
  // she went to sleep: only a due medicine or a family note wakes her before then
  const away = awayUntil > now.getTime();

  if (unread.length) {
    kind = "news";
    news = true;
    // she brings the family's love notes in her little bag
    mood = "bag";
    bubble =
      lang === "hi"
        ? `आपके लिए ${unread.length} प्यार भरा संदेश लाई हूँ! मुझे छुएँ`
        : unread.length > 1
          ? `I brought you ${unread.length} love notes! Tap me`
          : "I brought you a love note! Tap me";
    label = t(lang, { en: "Hear family messages", hi: "परिवार के संदेश सुनें" });
    onTap = () => {
      say([...unread].reverse().map((m) => textOf(m, voiceLang)).join(" ... "));
      void markHeard(unread.map((m) => m.id));
      setTab("family");
    };
  } else {
    const agenda = buildAgenda({ name, lang, voiceLang, meds, meals, doseLogs, mealLogs, snooze }, now);
    const n = companionNudge(agenda, checkins, wakeTime, sleepTime, now);
    const restKey = `${todayKey(now)}|${n.kind}|${doseLogs.filter((l) => l.day === todayKey(now) && l.status === "taken").length}`;
    if (n.kind === "due") {
      kind = n.late ? "missed" : "due";
      bubble = nudgeBubble(n, lang);
      // she points at the reminder
      mood = "point";
      label = t(lang, { en: "Hear the reminder", hi: "याद दिलाना सुनें" });
      onTap = () => {
        say(n.item.say);
        setTab("today");
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
    } else if (away) {
      return null;
    } else if (n.kind === "checkin" && tab !== "care" && rested !== restKey) {
      kind = "checkin";
      bubble = nudgeBubble(n, lang);
      mood = "asking";
      label = t(lang, { en: "Tell Asha how you feel", hi: "आशा को बताएँ आप कैसी हैं" });
      onTap = () => {
        say(checkinQuestion(voiceLang, name));
        setTab("care");
      };
    } else if (n.kind === "comfort" && rested !== restKey) {
      kind = "comfort";
      bubble = nudgeBubble(n, lang);
      // she brings a flower
      mood = "flower";
      label = t(lang, { en: "Talk to family", hi: "परिवार से बात करें" });
      onTap = () => {
        say(bubble);
        saveRest(restKey);
        setRested(restKey);
        setTab("family");
      };
    } else if (n.kind === "cheer" && rested !== restKey) {
      kind = "cheer";
      bubble = nudgeBubble(n, lang);
      mood = "jump";
      label = t(lang, { en: "Well done", hi: "शाबाश" });
      onTap = () => {
        say(bubble);
        saveRest(restKey);
        setRested(restKey);
      };
    } else {
      // nothing to say: she is simply there, watching what you tap; at night she sleeps on the floor
      const night = !awake(wakeTime, sleepTime, now);
      kind = night ? "sleep" : "idle";
      // she stretches for the first hour after waking, and grows sleepy in the last hour before bed
      const m = now.getHours() * 60 + now.getMinutes();
      const toMins = (hhmm: string) => Number(hhmm.split(":")[0]) * 60 + Number(hhmm.split(":")[1]);
      const sinceWake = (m - toMins(wakeTime || "07:00") + 1440) % 1440;
      const toBed = (toMins(sleepTime || "21:30") - m + 1440) % 1440;
      mood = night ? "sleep" : sinceWake < 60 ? "stretch" : toBed <= 60 ? "tired" : undefined;
      if (mood === "stretch") bubble = t(lang, { en: `*stretch* Good morning${name ? `, ${name}` : ""}!`, hi: `*अंगड़ाई* सुप्रभात${name ? ` ${name} जी` : ""}!` });
      if (mood === "tired") bubble = t(lang, { en: "*yawn* Getting sleepy… almost bedtime.", hi: "*उबासी* नींद आ रही है… सोने का समय होने वाला है." });
      label = night
        ? t(lang, { en: "The fairy is asleep. Tap to wake her", hi: "परी सो रही है. जगाने के लिए छुएँ" })
        : t(lang, { en: "Talk to the fairy", hi: "परी से बात करें" });
      onTap = night ? hello : () => void listen();
    }
  }

  if (ear) {
    bubble =
      ear === "listening"
        ? t(lang, { en: "I'm listening…", hi: "सुन रही हूँ…" })
        : ear === "thinking"
          ? t(lang, { en: "Hmm, let me see…", hi: "हम्म, देखती हूँ…" })
          : ear === "missed"
            ? t(lang, { en: "I didn't catch that. Tap me and say it again?", hi: "सुनाई नहीं दिया. मुझे छूकर फिर बोलें?" })
            : ear === "nomic"
              ? t(lang, { en: "I can't hear you. Please allow the microphone for Asha in phone settings.", hi: "मुझे सुनाई नहीं देता. फ़ोन सेटिंग में आशा को माइक की अनुमति दें." })
            : ear === "shy"
              ? t(lang, { en: "Oh! Hi… hee hee.", hi: "अरे! नमस्ते… ही ही." })
              : ear === "blush"
                ? t(lang, { en: "Aww, stop it! You're making me blush.", hi: "अरे, बस करिए! मुझे शर्म आ रही है." })
                : ear === "wake"
                  ? t(lang, { en: "*rubs eyes* Hmm? I'm up!", hi: "*आँखें मलती है* हम्म? जाग गई!" })
              : t(lang, { en: "Hello! I'm right here.", hi: "नमस्ते! मैं यहीं हूँ." });
    mood = ear === "listening" ? "asking" : ear === "thinking" ? "thinking" : ear === "missed" || ear === "nomic" ? "sad" : ear === "shy" ? "shy" : ear === "blush" ? "blush" : ear === "wake" ? "wakeup" : "wave";
  }

  // on Today the reminder card already says it, so she stays small and quiet there and does not cover it;
  // with nothing to say she is small and quiet everywhere
  const quiet = !ear && ((tab === "today" && (kind === "due" || kind === "missed")) || (kind === "idle" && !bubble) || kind === "sleep");
  talking.current = !quiet;
  if (quiet && perch && tab === "today" && (kind === "due" || kind === "missed")) {
    return createPortal(
      <div data-fairy={kind} className="fairy-perched">
        <FairyScene news={news} mood={mood} size="sm" label={bubble ? `${label}: ${bubble}` : label} onTap={onTap} />
      </div>,
      perch,
    );
  }
  return (
    <div data-fairy={kind} className={`fairy-dock fixed right-3 z-30 flex items-end gap-2 ${kind === "sleep" && !ear ? "fairy-dock-floor" : speaking ? "fairy-dock-up" : ""}`}>
      {quiet ? null : (
        <div className="mb-6 max-w-[11rem] rounded-2xl rounded-br-sm border border-line bg-paper px-3 py-2 text-base font-bold shadow-sm">
          {bubble}
          {kind === "news" ? null : (
            <button type="button" className="mt-1 block min-h-9 text-sm font-semibold text-quiet underline" onClick={askWhy}>
              {t(lang, { en: "Not now", hi: "अभी नहीं" })}
            </button>
          )}
        </div>
      )}
      <SoundOnce moment={kind === "cheer" ? `cheer|${todayKey(now)}|${bubble}` : ""} sound="chime" />
      <Flitter on={kind === "idle" && !ear && !bubble} lang={lang}>
        {(pose) => (
          <FairyScene news={news} mood={pose || mood} size={quiet ? "sm" : "md"} floor={kind === "sleep"} label={quiet && bubble ? `${label}: ${bubble}` : label} onTap={onTap} />
        )}
      </Flitter>
    </div>
  );
}

/** Plays a sound once per moment (she jumps for joy with a sparkle when all doses are taken). If it could not
 * play yet (no touch since the app opened), it tries again on the next redraw. */
function SoundOnce({ moment, sound }: { moment: string; sound: Sfx }) {
  useEffect(() => {
    if (moment) fairySoundOnce(sound, moment);
  });
  return null;
}

type Pastime = "flyside" | "sit" | "book" | "butterfly" | "behind";
const PASTIMES: Pastime[] = ["flyside", "flyside", "sit", "book", "butterfly", "behind"];

/** With nothing to do, every half minute or so she finds something to do: flies a loop around the screen,
 * sits for a rest, reads her book, watches a butterfly, or just stands with her hands behind her back. */
const PASTIME_LINE: Record<Pastime, { en: string; hi: string }> = {
  flyside: { en: "Wheee!", hi: "वीईई!" },
  sit: { en: "Just resting my wings.", hi: "बस पंखों को आराम दे रही हूँ." },
  book: { en: "Shh… a good story.", hi: "श्श… अच्छी कहानी है." },
  butterfly: { en: "Ooh, a butterfly!", hi: "अरे, तितली!" },
  behind: { en: "La la la…", hi: "ला ला ला…" },
};

function Flitter({ on, lang, children }: { on: boolean; lang: Lang; children: (pose: Pastime | undefined) => ReactNode }) {
  const [pose, setPose] = useState<Pastime | undefined>();
  useEffect(() => {
    if (!on) return setPose(undefined);
    let t = 0;
    const next = () => {
      t = window.setTimeout(() => {
        const p = PASTIMES[Math.floor(Math.random() * PASTIMES.length)];
        const fly = p === "flyside";
        setPose(p);
        if (fly) fairySound("flutter");
        t = window.setTimeout(
          () => {
            setPose(undefined);
            next();
          },
          fly ? 6000 : 12000,
        );
      }, 20000 + Math.random() * 15000);
    };
    next();
    return () => window.clearTimeout(t);
  }, [on]);
  // a few words for what she is doing, shown for a moment and never spoken
  return (
    <div className={cn("relative", pose === "flyside" ? "fairy-flit" : undefined)}>
      {pose ? (
        <span data-pastime={pose} className="fairy-pastime pointer-events-none absolute bottom-full right-0 mb-1 whitespace-nowrap rounded-full border border-line bg-paper px-2.5 py-1 text-sm font-bold shadow-sm">
          {t(lang, PASTIME_LINE[pose])}
        </span>
      ) : null}
      {children(pose)}
    </div>
  );
}

const GO_AWAY = /\b(go away|leave me|bye|go to sleep|not now|stop)\b|चली जाओ|जाओ|बाय|सो जाओ|अभी नहीं/i;
const SWEET = /\b(cute|pretty|beautiful|sweet|love you|thank you|thanks)\b|प्यारी|सुंदर|धन्यवाद|शुक्रिया/i;
const GREETING = /\b(hello|hi|hey|how are you|good morning|good evening)\b|नमस्ते|हेलो|कैसी हो/i;

const AWAY_KEY = "asha.fairy.away";
function readAway() {
  try {
    return Number(localStorage.getItem(AWAY_KEY)) || 0;
  } catch {
    return 0;
  }
}
function saveAway(until: number) {
  try {
    localStorage.setItem(AWAY_KEY, String(until));
  } catch {
    /* private mode */
  }
}

const REST_KEY = "asha.fairy.rest";
function readRest() {
  try {
    return localStorage.getItem(REST_KEY) ?? "";
  } catch {
    return "";
  }
}
function saveRest(v: string) {
  try {
    localStorage.setItem(REST_KEY, v);
  } catch {
    /* private mode */
  }
}
