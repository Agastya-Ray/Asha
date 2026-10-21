import { useEffect, useState, type ReactNode } from "react";
import { App } from "@capacitor/app";
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
  const rich = useAsha((s) => s.richVoice);
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
  const [ear, setEar] = useState<"" | "listening" | "thinking" | "hello" | "shy" | "missed">("");
  const unread = unreadOf({ messages, heardLocal });
  const say = (text: string) => void speak(text, voiceLang, rich ? "warm" : "device");

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
  const hello = () => {
    setEar("shy");
    later(1300, () => setEar("hello"));
    say(t(voiceLang, { en: `Hello${name ? ` ${name}` : ""}! I'm right here with you.`, hi: `नमस्ते${name ? ` ${name} जी` : ""}! मैं यहीं आपके पास हूँ.` }));
    later(4500, () => setEar(""));
  };
  const blush = () => {
    setEar("shy");
    say(t(voiceLang, { en: "Aww, stop it! You're making me shy.", hi: "अरे, बस करिए! मुझे शर्म आ रही है." }));
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
      setEar("missed");
      later(2500, () => setEar(""));
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
      later(1800, () => {
        setBye("brave");
        say(t(voiceLang, { en: `That's okay${name ? `, ${name}` : ""}. I'm still here to help you, as a tiny friend or to remind you about your medicines.`, hi: `कोई बात नहीं${name ? ` ${name} जी` : ""}. मैं फिर भी आपकी मदद के लिए यहीं हूँ, छोटी सी दोस्त बनकर या दवाइयाँ याद दिलाने के लिए.` }));
      });
      later(6500, () => setBye("yawn"));
      later(8800, () => setBye("lie"));
    } else {
      setBye("yawn");
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
          ? t(lang, { en: "Oh…", hi: "ओह…" })
          : bye === "brave"
            ? t(lang, { en: "I'm still here to help, as a tiny friend or for your medicines.", hi: "मैं मदद के लिए यहीं हूँ, छोटी दोस्त या दवाइयों के लिए." })
            : t(lang, { en: "*yawn* Good night! See you soon.", hi: "*उबासी* शुभ रात्रि! जल्दी मिलेंगे." });
    const face: FairyMood = bye === "sad" ? "sad" : bye === "brave" ? "happy" : bye === "yawn" ? "yawn" : "idle";
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
    bubble = lang === "hi" ? `${unread.length} प्यार भरा संदेश! मुझे छुएँ` : `${unread.length} love note${unread.length > 1 ? "s" : ""}! Tap me`;
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
      mood = "idle";
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
      mood = "happy";
      label = t(lang, { en: "Tell Asha how you feel", hi: "आशा को बताएँ आप कैसी हैं" });
      onTap = () => {
        say(checkinQuestion(voiceLang, name));
        setTab("care");
      };
    } else if (n.kind === "comfort" && rested !== restKey) {
      kind = "comfort";
      bubble = nudgeBubble(n, lang);
      mood = "idle";
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
      mood = "happy";
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
      mood = night ? "sleep" : undefined;
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
            : ear === "shy"
              ? t(lang, { en: "Hee hee… aww.", hi: "ही ही… अरे." })
              : t(lang, { en: "Hello! I'm right here.", hi: "नमस्ते! मैं यहीं हूँ." });
    mood = ear === "listening" ? "asking" : ear === "thinking" ? "thinking" : ear === "missed" ? "sad" : ear === "shy" ? "shy" : "happy";
  }

  // on Today the reminder card already says it, so she stays small and quiet there and does not cover it;
  // with nothing to say she is small and quiet everywhere
  const quiet = !ear && ((tab === "today" && (kind === "due" || kind === "missed")) || kind === "idle" || kind === "sleep");
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
      <Flitter on={kind === "idle" && !ear}>
        <FairyScene news={news} mood={mood} size={quiet ? "sm" : "md"} floor={kind === "sleep"} label={quiet && bubble ? `${label}: ${bubble}` : label} onTap={onTap} />
      </Flitter>
    </div>
  );
}

/** With nothing to do, every half minute or so she takes off and flies a loop around the screen, then settles back. */
function Flitter({ on, children }: { on: boolean; children: ReactNode }) {
  const [flying, setFlying] = useState(false);
  useEffect(() => {
    if (!on) return setFlying(false);
    let t = 0;
    const next = () => {
      t = window.setTimeout(() => {
        setFlying(true);
        t = window.setTimeout(() => {
          setFlying(false);
          next();
        }, 6000);
      }, 20000 + Math.random() * 15000);
    };
    next();
    return () => window.clearTimeout(t);
  }, [on]);
  return <div className={flying ? "fairy-flit" : undefined}>{children}</div>;
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
