import { useState } from "react";
import { Mic } from "lucide-react";
import { create } from "zustand";
import { t } from "@/components/asha/bits";
import { canListen, listenOnce } from "@/lib/asha/listen";
import { buildAgenda } from "@/lib/asha/schedule";
import { useAsha } from "@/lib/asha/store";
import { speak } from "@/lib/asha/voice";

/** Words heard on Today that should go on to the Talk screen. */
export const useTalkHandoff = create<{ text: string; set: (text: string) => void }>((set) => ({
  text: "",
  set: (text) => set({ text }),
}));

const HELP = /\b(help|emergency|ambulance|sos)\b|मदद|बचाओ|एम्बुलेंस|इमरजेंसी/i;
const TAKEN = /\b(took|taken|done|finished)\b|ले ली|ले लिया|ले ली है|ली है|खा ली|ले चुकी|ले चुका/i;
const ATE = /\b(ate|eaten|had (my )?(breakfast|lunch|dinner|food))\b|खा लिया|खाना खा|नाश्ता कर/i;
const WATER = /\b(water|glass)\b|पानी/i;
// "I haven't taken it", "remind me later", "दवा नहीं ली": never mark these as done
const NOT_YET = /n't\b|\b(not|never|yet|later|remind|forgot|forget|skip)\b|नहीं|नही\b|भूल|बाद में|याद दिला/i;

export type Heard = "help" | "taken" | "ate" | "not-yet" | "water" | "other";

/** What a short spoken sentence asks for. Help wins; a "not yet" stops a dose or meal being marked. */
export function intentOf(said: string): Heard {
  if (HELP.test(said)) return "help";
  const taken = TAKEN.test(said) && !ATE.test(said);
  const ate = ATE.test(said);
  if ((taken || ate) && NOT_YET.test(said)) return "not-yet";
  if (taken) return "taken";
  if (ate) return "ate";
  if (WATER.test(said)) return "water";
  return "other";
}

/**
 * One big "Tell Asha" microphone on Today. Understands simple things without internet:
 * "I took it", "I have eaten", "a glass of water", "help". Anything else goes to Talk.
 */
export function VoiceCommand() {
  const lang = useAsha((s) => s.lang);
  const [busy, setBusy] = useState(false);
  const [heard, setHeard] = useState("");
  if (!canListen()) return null;

  async function run() {
    const v = useAsha.getState().voiceLang;
    setBusy(true);
    setHeard("");
    const r = await listenOnce(v);
    setBusy(false);
    const said = r.text.trim();
    if (!said) {
      setHeard(t(lang, { en: "I didn't catch that. Press and try again.", hi: "सुनाई नहीं दिया. दबाकर फिर बोलें." }));
      return;
    }
    setHeard(`“${said}”`);
    actOnSpoken(said);
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => void run()}
        className={`flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl text-xl font-bold ${busy ? "listening bg-sage text-paper" : "border-2 border-sage bg-paper text-sage"}`}
      >
        <Mic className="size-7" aria-hidden />
        {busy ? t(lang, { en: "Listening… speak now", hi: "सुन रही हूँ… अब बोलें" }) : t(lang, { en: "Tell Asha", hi: "आशा को बताएँ" })}
      </button>
      <p className="mt-2 text-base text-quiet">
        {heard ||
          t(lang, {
            en: "Say “I took it”, “I have eaten”, “one glass of water”, or “help”.",
            hi: "बोलें “ले ली”, “खा लिया”, “एक गिलास पानी”, या “मदद”.",
          })}
      </p>
    </div>
  );
}

/** Does what a short spoken sentence asks: mark a dose or meal, count water, open Help, or hand over to Talk. Used by "Tell Asha" and by the fairy. */
export function actOnSpoken(said: string) {
  const s = useAsha.getState();
  const v = s.voiceLang;
  const reply = (en: string, hi: string) => {
    void speak(v === "hi" ? hi : en, v, s.richVoice ? "warm" : "device");
  };
  const open = buildAgenda(s).filter((i) => i.state === "now" || i.state === "open" || i.state === "snoozed");

  const want = intentOf(said);
  if (want === "not-yet") {
    reply("Okay, I have not marked it. I will remind you again.", "ठीक है, मैंने अभी नहीं लिखा. मैं फिर याद दिलाऊँगी.");
    return;
  }
  if (want === "help") {
    s.setTab("sos");
    reply("Opening Help.", "मदद खोल रही हूँ.");
    return;
  }
  if (want === "taken") {
    const med = open.find((i) => i.kind === "med");
    if (med) {
      s.logDose(med.id, med.time, "taken");
      reply(`Well done. I've marked ${med.title} as taken.`, `बहुत अच्छा. ${med.title} ले ली, मैंने लिख लिया.`);
    } else reply("There is no medicine waiting right now. You're all caught up.", "अभी कोई दवा बाकी नहीं है. सब हो गया.");
    return;
  }
  if (want === "ate") {
    const meal = open.find((i) => i.kind === "meal");
    if (meal) {
      s.logMeal(meal.id);
      reply(`Lovely. I've marked ${meal.title}.`, `बढ़िया. ${meal.title} मैंने लिख लिया.`);
    } else reply("Good. No meal is waiting right now.", "अच्छा. अभी कोई खाना बाकी नहीं.");
    return;
  }
  if (want === "water") {
    s.addWater();
    reply("One more glass of water. Good.", "एक गिलास पानी और. बढ़िया.");
    return;
  }
  if (s.pro) {
    useTalkHandoff.getState().set(said);
    s.setTab("talk");
    return;
  }
  reply(
    "I can mark a medicine or a meal, count water, or open Help. Free talking is part of Pro.",
    "मैं दवा या खाना लिख सकती हूँ, पानी गिन सकती हूँ, या मदद खोल सकती हूँ. खुलकर बातें करना प्रो में है.",
  );
}
