import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldLabel, Hear, LangSwitch, t } from "@/components/asha/bits";
import type { Localized } from "@/lib/asha/plans";
import { useAsha } from "@/lib/asha/store";
import { speak, stopSpeaking } from "@/lib/asha/voice";

type Slide = { art: "hello" | "voice" | "plate" | "help" | "talk"; title: Localized; body: Localized };

const SLIDES: Slide[] = [
  {
    art: "hello",
    title: { en: "Namaste. I'm Asha.", hi: "नमस्ते. मैं आशा हूँ." },
    body: {
      en: "Asha means hope. I'm a calm voice who keeps your day gentle: medicines, meals, and help, all in one place. I'm not a doctor, and I never change a prescription.",
      hi: "आशा का मतलब है उम्मीद. मैं एक शांत आवाज़ हूँ जो आपके दिन को आसान रखती है: दवा, खाना और मदद, सब एक जगह. मैं डॉक्टर नहीं हूँ, और पर्ची कभी नहीं बदलती.",
    },
  },
  {
    art: "voice",
    title: { en: "I remind you by name, in a voice.", hi: "मैं नाम लेकर, आवाज़ में याद दिलाती हूँ." },
    body: {
      en: "Not a beep. At eight in the morning I'll say: time for your Metformin, with breakfast. Even when the phone is locked. Press Taken, and I'll stop. If you miss it, I'll ask again gently.",
      hi: "बीप नहीं. सुबह आठ बजे मैं कहूँगी: मेटफॉर्मिन का समय है, नाश्ते के साथ. फ़ोन लॉक हो तब भी. 'ले ली' दबाएँ, मैं रुक जाऊँगी. छूट जाए, तो प्यार से दोबारा पूछूँगी.",
    },
  },
  {
    art: "plate",
    title: { en: "Food and health, made simple.", hi: "खाना और सेहत, आसान तरीके से." },
    body: {
      en: "Choose arthritis, diabetes, PCOD, PCOS, or heart care. I'll show what goes on the plate, gentle daily habits, and a chart of sugar, blood pressure, pain and mood that you can share with your doctor.",
      hi: "गठिया, मधुमेह, पीसीओडी, पीसीओएस या दिल की देखभाल चुनें. मैं बताऊँगी प्लेट में क्या रखें, रोज़ की हल्की आदतें, और शुगर, बीपी, दर्द और मन का चार्ट जो आप डॉक्टर को भेज सकें.",
    },
  },
  {
    art: "help",
    title: { en: "Help is one red button away.", hi: "मदद बस एक लाल बटन दूर है." },
    body: {
      en: "Hold the red Help button. I'll message your loved ones with where you are, and call them or the emergency number. You choose those people in a moment.",
      hi: "लाल 'मदद' बटन दबाकर रखें. मैं आपके अपनों को आपकी जगह के साथ संदेश भेजूँगी, और उन्हें या इमरजेंसी नंबर को कॉल करूँगी. ये लोग आप अभी चुनेंगे.",
    },
  },
  {
    art: "talk",
    title: { en: "And you can simply talk to me.", hi: "और आप मुझसे बस बात कर सकते हैं." },
    body: {
      en: "Speak or type, in Hindi or English. Tell me about your day, or just chat when the afternoon feels long. You can even speak Hindi and read English.",
      hi: "बोलिए या लिखिए, हिन्दी या अंग्रेज़ी में. अपने दिन के बारे में बताइए, या लंबी दोपहर में बस बातें कीजिए. आप हिन्दी में बोलकर अंग्रेज़ी में पढ़ भी सकते हैं.",
    },
  },
];

export function Intro() {
  const lang = useAsha((s) => s.lang);
  const voiceLang = useAsha((s) => s.voiceLang);
  const voiceOn = useAsha((s) => s.voiceOn);
  const rich = useAsha((s) => s.richVoice);
  const setLang = useAsha((s) => s.setLang);
  const setVoiceLang = useAsha((s) => s.setVoiceLang);
  const setBoth = useAsha((s) => s.setBothLangs);
  const finish = useAsha((s) => s.finishIntro);
  const [i, setI] = useState(0);
  const [split, setSplit] = useState(lang !== voiceLang);
  const touched = useRef(false);
  const slide = SLIDES[i];
  const last = i === SLIDES.length - 1;
  const say = `${t(voiceLang, slide.title)} ${t(voiceLang, slide.body)}`;

  // Read each card aloud once the person has touched the screen (phones block sound before that).
  useEffect(() => {
    if (!touched.current || !voiceOn) return;
    void speak(say, voiceLang, rich ? "warm" : "device");
  }, [i, voiceLang]);

  useEffect(() => () => stopSpeaking(), []);

  const go = (n: number) => {
    touched.current = true;
    setI(Math.max(0, Math.min(SLIDES.length - 1, n)));
  };

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col py-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2" aria-label={`${i + 1} / ${SLIDES.length}`}>
          {SLIDES.map((s, n) => (
            <span key={s.art} className={`h-2 rounded-full transition-all duration-300 ${n === i ? "w-8 bg-sage" : "w-2 bg-line"}`} />
          ))}
        </div>
        <button type="button" className="min-h-12 px-2 text-lg font-bold text-quiet" onClick={() => finish()}>
          {t(lang, { en: "Skip", hi: "छोड़ें" })}
        </button>
      </div>

      <div key={slide.art} className="intro-card mt-6 flex flex-1 flex-col">
        <Art kind={slide.art} />
        <h1 className="display mt-6 text-4xl leading-tight">{t(lang, slide.title)}</h1>
        <p className="mt-4 text-xl leading-relaxed">{t(lang, slide.body)}</p>
        <div className="mt-4">
          <Hear say={say} label={t(lang, { en: "Hear Asha say this", hi: "आशा से सुनें" })} />
        </div>

        {i === 0 ? (
          <div className="mt-6 rounded-3xl border border-line bg-paper p-4">
            <FieldLabel>{t(lang, { en: "Language", hi: "भाषा" })}</FieldLabel>
            <LangSwitch
              value={lang}
              onChange={(l) => {
                touched.current = true;
                if (split) setLang(l);
                else setBoth(l);
              }}
            />
            <button type="button" className="mt-3 min-h-12 text-left text-base font-bold text-sage" onClick={() => setSplit((v) => !v)}>
              {split
                ? t(lang, { en: "Use one language for both", hi: "दोनों के लिए एक ही भाषा" })
                : t(lang, { en: "Speak one language, read another?", hi: "बोलें एक भाषा में, पढ़ें दूसरी में?" })}
            </button>
            {split ? (
              <div className="mt-3">
                <FieldLabel>{t(lang, { en: "Asha speaks and listens in", hi: "आशा बोलती और सुनती है" })}</FieldLabel>
                <LangSwitch
                  value={voiceLang}
                  onChange={(l) => {
                    touched.current = true;
                    setVoiceLang(l);
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Button onClick={() => (last ? finish() : go(i + 1))}>
          {last ? t(lang, { en: "Let's set up — about 3 minutes", hi: "चलिए सेटअप करें — लगभग 3 मिनट" }) : t(lang, { en: "Next", hi: "आगे" })}
        </Button>
        {i > 0 ? (
          <Button variant="ghost" onClick={() => go(i - 1)}>
            {t(lang, { en: "Back", hi: "पीछे" })}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** Simple drawn pictures for each card (no images to download). */
function Art({ kind }: { kind: Slide["art"] }) {
  return (
    <div className="art flex h-44 items-center justify-center rounded-3xl bg-sage-soft">
      {kind === "hello" ? (
        <svg viewBox="0 0 160 120" className="h-36 float" aria-hidden>
          <circle cx="80" cy="60" r="46" fill="#fffdf8" />
          <path d="M56 86 C 53 56, 76 34, 108 32 C 108 62, 86 87, 56 86 Z" fill="#1d6b45" />
          <path d="M60 82 Q 82 62 102 38" stroke="#e4f2ea" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      ) : null}
      {kind === "voice" ? (
        <svg viewBox="0 0 160 120" className="h-36" aria-hidden>
          <rect x="22" y="26" width="84" height="58" rx="18" fill="#fffdf8" />
          <path d="M40 84 L 34 100 L 56 84 Z" fill="#fffdf8" />
          <rect x="44" y="46" width="40" height="18" rx="9" fill="#1d6b45" />
          <rect x="64" y="46" width="20" height="18" rx="9" fill="#a34b24" />
          <path className="wave w1" d="M118 44 Q 128 58 118 72" stroke="#1d6b45" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path className="wave w2" d="M130 36 Q 146 58 130 80" stroke="#1d6b45" strokeWidth="5" fill="none" strokeLinecap="round" />
        </svg>
      ) : null}
      {kind === "plate" ? (
        <svg viewBox="0 0 160 120" className="h-36 float" aria-hidden>
          <circle cx="80" cy="60" r="50" fill="#fffdf8" stroke="#e4d8c6" strokeWidth="3" />
          <path d="M80 60 L 80 16 A 44 44 0 0 1 80 104 Z" fill="#6aa57f" />
          <path d="M80 60 L 80 104 A 44 44 0 0 1 36 60 Z" fill="#e0b25c" />
          <path d="M80 60 L 36 60 A 44 44 0 0 1 80 16 Z" fill="#c9884f" />
        </svg>
      ) : null}
      {kind === "help" ? (
        <div className="relative flex items-center justify-center">
          <span className="pulse absolute size-28 rounded-full bg-sos/25" />
          <span className="relative flex size-24 items-center justify-center rounded-full bg-sos text-2xl font-bold text-paper">SOS</span>
        </div>
      ) : null}
      {kind === "talk" ? (
        <svg viewBox="0 0 160 120" className="h-36" aria-hidden>
          <rect className="bubble b1" x="16" y="18" width="86" height="38" rx="16" fill="#fffdf8" />
          <rect className="bubble b2" x="58" y="64" width="86" height="38" rx="16" fill="#1d6b45" />
          <circle cx="40" cy="37" r="4" fill="#5c564c" />
          <circle cx="56" cy="37" r="4" fill="#5c564c" />
          <circle cx="72" cy="37" r="4" fill="#5c564c" />
          <rect x="74" y="80" width="54" height="6" rx="3" fill="#e4f2ea" />
        </svg>
      ) : null}
    </div>
  );
}
