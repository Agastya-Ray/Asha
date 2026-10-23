import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldLabel, LangSwitch, SpeakField, t } from "@/components/asha/bits";
import { Pixie, type PixieMood } from "@/components/asha/pixie";
import type { Localized } from "@/lib/asha/plans";
import { useAsha } from "@/lib/asha/store";
import { speak, stopSpeaking, unlockAudio } from "@/lib/asha/voice";

/**
 * First run: the fairy is asleep in a little meadow. A tap wakes her; she says hello, asks the person to name her,
 * says she likes them and invites them into her home (Asha), then shows what Asha does. Every step waits for a tap.
 * Her wake-up animation will come from drawn frames; until then she uses her existing poses.
 */

type Step = "asleep" | "waking" | "hello" | "shy" | "naming" | "loves" | "invite" | "home";

const NAMES = ["Titli", "Mishti", "Juhi", "Tara"];
const STARS = [[14, 22], [32, 12], [58, 26], [72, 34], [22, 44], [86, 52], [46, 50]];

const LINES: Record<Exclude<Step, "asleep" | "waking" | "naming">, (name: string) => Localized> = {
  hello: () => ({
    en: "Hi! I'm your smol companion. I live right here, on your phone!",
    hi: "नमस्ते! मैं आपकी छोटी सी साथी हूँ. मैं यहीं, आपके फ़ोन में रहती हूँ!",
  }),
  shy: () => ({
    en: "Umm… I don't have a name yet. Would you give me one?",
    hi: "उम्म… मेरा अभी कोई नाम नहीं है. क्या आप मुझे एक नाम देंगे?",
  }),
  loves: (n) => ({
    en: `${n}! I love it! Thank you so much!`,
    hi: `${n}! मुझे बहुत पसंद आया! बहुत-बहुत शुक्रिया!`,
  }),
  invite: () => ({
    en: "You know what? I like you already. I'd love to take care of you. Will you come and stay in my home?",
    hi: "पता है? आप मुझे अभी से अच्छे लगने लगे हैं. मैं आपका ख़याल रखना चाहती हूँ. क्या आप मेरे घर आकर रहेंगे?",
  }),
  home: () => ({
    en: "Here we are! This is my home, Asha. From now on, I'll look after you from here.",
    hi: "लीजिए, आ गए! यह मेरा घर है, आशा. अब से मैं यहीं से आपका ख़याल रखूँगी.",
  }),
};

const MOOD: Record<Step, PixieMood> = {
  asleep: "sleep",
  waking: "yawn",
  hello: "jump",
  shy: "shy",
  naming: "asking",
  loves: "happy",
  invite: "flower",
  home: "wave",
};

const HOME_ROWS: { icon: string; text: Localized }[] = [
  {
    icon: "💊",
    text: {
      en: "I'll remind you about medicines and meals, out loud, by your name",
      hi: "मैं आपको दवा और खाने की याद दिलाऊँगी, बोलकर, आपके नाम से",
    },
  },
  {
    icon: "🔴",
    text: {
      en: "If you ever need help, I'll call your family",
      hi: "कभी मदद चाहिए हो, तो मैं आपके परिवार को फ़ोन करूँगी",
    },
  },
  {
    icon: "💛",
    text: {
      en: "I'll bring you little notes from your family",
      hi: "मैं आपके परिवार के छोटे-छोटे संदेश लाऊँगी",
    },
  },
  {
    icon: "💬",
    text: {
      en: "And I'm always here to talk, in Hindi or English",
      hi: "और मैं हमेशा बात करने के लिए यहाँ हूँ, हिन्दी या अंग्रेज़ी में",
    },
  },
];

export function FairyIntro() {
  const lang = useAsha((s) => s.lang);
  const voiceLang = useAsha((s) => s.voiceLang);
  const voiceOn = useAsha((s) => s.voiceOn);
  const setBoth = useAsha((s) => s.setBothLangs);
  const saved = useAsha((s) => s.fairyName);
  const setFairyName = useAsha((s) => s.setFairyName);
  const finish = useAsha((s) => s.finishIntro);
  const [step, setStep] = useState<Step>("asleep");
  const [pick, setPick] = useState(saved && NAMES.includes(saved) ? saved : "");
  const [own, setOwn] = useState(saved && !NAMES.includes(saved) ? saved : "");
  const [hint, setHint] = useState("");
  const name = saved || pick || own;

  const line = step in LINES ? LINES[step as keyof typeof LINES](name) : null;

  // She says each line out loud in her own voice (the screen was already tapped to wake her, so sound is allowed).
  useEffect(() => {
    if (line && voiceOn) void speak(t(voiceLang, line), voiceLang, "fairy");
  }, [step, voiceLang]);
  useEffect(() => () => stopSpeaking(), []);
  // a new step starts at the top, so her face is never scrolled away (the naming card can be long)
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  const wake = () => {
    unlockAudio();
    setStep("waking");
    window.setTimeout(() => setStep("hello"), 1800);
  };

  const saveName = () => {
    const chosen = (own.trim() || pick).trim();
    if (!chosen) {
      setHint(
        t(lang, {
          en: "Tap a name, or write one in the box.",
          hi: "कोई नाम चुनें, या बॉक्स में लिखें.",
        }),
      );
      return;
    }
    setFairyName(chosen);
    setStep("loves");
  };

  // The whole screen is her room at night; she is curled up asleep on its floor. Tapping anywhere wakes her.
  if (step === "asleep" || step === "waking")
    return (
      <div className="fi-room -mx-4 flex min-h-[calc(100dvh-5rem)] flex-col items-center px-4 pt-6">
        <span className="fi-moon" aria-hidden />
        <span className="fi-stars" aria-hidden>
          {STARS.map(([x, y], i) => (
            <i key={i} style={{ left: `${x}%`, top: `${y}%` }} />
          ))}
        </span>
        <div className="relative z-10 w-full max-w-sm">
          <LangSwitch value={lang} onChange={(l) => setBoth(l)} />
        </div>
        <button
          type="button"
          className="flex w-full flex-1 flex-col items-center"
          onClick={step === "asleep" ? wake : undefined}
          aria-label={t(lang, { en: "Wake the fairy", hi: "परी को जगाएँ" })}
        >
          <p
            className={`relative z-10 my-auto pb-40 text-center text-2xl font-bold text-paper transition-opacity ${step === "waking" ? "opacity-0" : ""}`}
          >
            {t(lang, { en: "Shh… she is sleeping.", hi: "श्श… वह सो रही है." })}
            <br />
            {t(lang, { en: "Tap her gently to wake her up", hi: "उसे धीरे से छूकर जगाइए" })}
            <br />
            <span className="fi-hand inline-block text-4xl" aria-hidden>
              👇
            </span>
          </p>
          <span className="fi-floor" aria-hidden />
          {step === "asleep" ? (
            <span className="fi-zzz" aria-hidden>
              z<span>z</span>
              <span>z</span>
            </span>
          ) : null}
          <Pixie mood={MOOD[step]} className={step === "asleep" ? "fi-sleeper" : "fi-waker"} />
        </button>
      </div>
    );

  return (
    <div className="fi-sky -mx-4 flex min-h-[calc(100dvh-5rem)] flex-col px-4 pb-8 pt-6">
      {step === "home" ? (
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="display text-3xl leading-tight">
              {t(lang, { en: "Welcome to my home!", hi: "मेरे घर में आपका स्वागत है!" })}
            </h1>
            <p className="text-lg font-bold text-quiet">
              {t(lang, { en: "It's called Asha", hi: "इसका नाम आशा है" })}
            </p>
          </div>
          <Pixie mood={MOOD[step]} className="h-24 w-20 shrink-0" />
        </div>
      ) : (
        <Pixie mood={MOOD[step]} className="mx-auto mt-4 h-64 w-56" />
      )}

      {step === "naming" ? (
        <div className="mt-4 rounded-3xl border border-line bg-paper p-4">
          <h2 className="display text-2xl">
            {t(lang, { en: "Give your fairy a name", hi: "अपनी परी को नाम दीजिए" })}
          </h2>
          <p className="mt-1 text-lg text-quiet">
            {t(lang, {
              en: "Tap a name you like, or write your own.",
              hi: "कोई पसंद का नाम चुनें, या अपना लिखें.",
            })}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {NAMES.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={pick === n && !own.trim()}
                onClick={() => {
                  setPick(n);
                  setOwn("");
                  setHint("");
                }}
                className={`min-h-12 rounded-2xl border px-4 text-lg font-bold ${pick === n && !own.trim() ? "border-sage bg-sage-soft text-sage" : "border-line bg-linen"}`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <FieldLabel>
              {t(lang, { en: "Or your own name for her", hi: "या उसके लिए अपना नाम" })}
            </FieldLabel>
            <p className="mb-2 text-base text-quiet">
              {t(lang, {
                en: "Any name you like. Type it, or press the microphone and say it.",
                hi: "कोई भी नाम. लिखिए, या माइक दबाकर बोलिए.",
              })}
            </p>
            <SpeakField
              value={own}
              onChange={(v) => setOwn(v.slice(0, 24))}
              placeholder={t(lang, { en: "Her name", hi: "उसका नाम" })}
            />
          </div>
          {hint ? <p className="mt-3 text-lg text-clay">{hint}</p> : null}
          <Button className="mt-4 w-full" onClick={saveName}>
            {t(lang, { en: "That's her name", hi: "यही उसका नाम है" })}
          </Button>
        </div>
      ) : null}

      {line ? (
        <div className="fi-bubble mt-4 rounded-3xl border-2 border-[#f3c4d0] bg-paper p-4 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-[#d9506f]">
            {name || t(lang, { en: "Your fairy", hi: "आपकी परी" })}
          </p>
          <p className="mt-1 text-xl leading-snug">{t(lang, line)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="min-h-12 shrink-0 rounded-2xl border border-line px-3 text-base font-bold text-quiet"
              onClick={() => void speak(t(voiceLang, line), voiceLang, "fairy")}
            >
              🔊 {t(lang, { en: "Again", hi: "फिर से" })}
            </button>
            <Button
              className="min-w-36 flex-1"
              onClick={() => {
                if (step === "hello") setStep(saved ? "loves" : "shy");
                else if (step === "shy") setStep("naming");
                else if (step === "loves") setStep("invite");
                else if (step === "invite") setStep("home");
                else finish();
              }}
            >
              {step === "hello"
                ? t(lang, { en: "Hello!", hi: "नमस्ते!" })
                : step === "shy"
                  ? t(lang, { en: "Yes, of course", hi: "हाँ, ज़रूर" })
                  : step === "loves"
                    ? t(lang, { en: "You're welcome", hi: "आपका स्वागत है" })
                    : step === "invite"
                      ? t(lang, { en: "Yes, I'd love to", hi: "हाँ, मुझे अच्छा लगेगा" })
                      : t(lang, { en: `Thank you, ${name}`, hi: `शुक्रिया, ${name}` })}
            </Button>
          </div>
        </div>
      ) : null}

      {step === "home" ? (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-lg text-quiet">
            {t(lang, {
              en: "From here, I'll take care of you:",
              hi: "यहाँ से मैं आपका ख़याल रखूँगी:",
            })}
          </p>
          {HOME_ROWS.map((r, i) => (
            <div
              key={r.icon}
              className="fi-row flex items-center gap-3 rounded-2xl bg-paper/90 p-3 text-lg"
              style={{ animationDelay: `${0.3 + i * 0.5}s` }}
            >
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-paper text-2xl"
                aria-hidden
              >
                {r.icon}
              </span>
              {t(lang, r.text)}
            </div>
          ))}
          <p className="text-base text-quiet">
            {t(lang, {
              en: "I'm not a doctor, so I never change your prescription.",
              hi: "मैं डॉक्टर नहीं हूँ, इसलिए मैं आपकी पर्ची कभी नहीं बदलती.",
            })}
          </p>
        </div>
      ) : null}
    </div>
  );
}
