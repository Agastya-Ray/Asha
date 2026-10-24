import { useState } from "react";
import { Mic } from "lucide-react";
import { create } from "zustand";
import { t } from "@/components/asha/bits";
import { canListen, listenOnce } from "@/lib/asha/listen";
import { QUIET, minutesSaid } from "@/lib/asha/quiet";
import { buildAgenda, digits } from "@/lib/asha/schedule";
import { useQuietSheet } from "@/components/asha/quiet";
import { useAsha } from "@/lib/asha/store";
import { rxSpoken } from "@/lib/asha/rx";
import { speak } from "@/lib/asha/voice";
import { REMIND, hearMemory } from "@/lib/asha/remember";
import { todayKey } from "@/lib/asha/time";
import { useRemember } from "@/components/asha/ideas/remember";

/** "Call now" from her voice: the Help screen picks it up and starts the call straight away. who = a contact id, or "" for the usual first number. */
export const useSosNow = create<{
  pending: number;
  who: string;
  request: (who: string) => void;
  clear: () => void;
}>((set) => ({
  pending: 0,
  who: "",
  request: (who) => set({ pending: Date.now(), who }),
  clear: () => set({ pending: 0, who: "" }),
}));

/** Words heard on Today that should go on to the Talk screen. */
export const useTalkHandoff = create<{ text: string; set: (text: string) => void }>((set) => ({
  text: "",
  set: (text) => set({ text }),
}));

const HELP = /\b(help|emergency|ambulance|sos)\b|मदद|बचाओ|एम्बुलेंस|इमरजेंसी/i;
// Said in a hurry, or feeling unwell: these place the call at once, no screen to find, no button to hold.
// ("help me with my medicines" only opens Help; "help!" or "help me" calls.)
const CALL_NOW =
  /^\W*(please\W+)?help(\W+me)?(\W+please)?\W*$|\b(emergency|ambulance|sos)\b|\b(i'?m|i am|feeling|feel)\b.{0,12}\b(unwell|not (feeling )?(well|good|okay|ok|right)|sick|ill|dizzy|faint|very bad|terrible)\b|\bcall\b.{0,30}\b(now|quick|quickly|someone|somebody|help|doctor)\b|बचाओ|मदद (करो|करें|चाहिए|कीजिए)|एम्बुलेंस|इमरजेंसी|तबीयत (ठीक नहीं|खराब|ख़राब)|ठीक नहीं लग|बीमार|चक्कर|घबराहट/i;
// Body signs that should never wait for a chat reply (or for the internet): she points straight to Help.
export const URGENT =
  /chest (pain|hurts?|pressure|tight)|pain in (my )?chest|can'?t breathe|cannot breathe|can'?t catch my breath|short of breath|fainted|passed out|face (is )?drooping|can'?t (speak|talk|move my)|arm (is )?(weak|numb)|stroke|heart attack|bleeding (a lot|heavily|won'?t stop)|fell and can'?t get up|सीने में दर्द|छाती में दर्द|सांस नहीं|साँस नहीं|बेहोश|लकवा|दिल का दौरा/i;
const TAKEN = /\b(took|taken|done|finished)\b|ले ली|ले लिया|ले ली है|ली है|खा ली|ले चुकी|ले चुका/i;
const ATE = /\b(ate|eaten|had (my )?(breakfast|lunch|dinner|food))\b|खा लिया|खाना खा|नाश्ता कर/i;
// "what did the doctor say?", "read my prescription"
const DOCTOR = /\b(doctor|prescription)\b|डॉक्टर|डाक्टर|पर्ची/i;
const WATER = /\b(water|glass)\b|पानी/i;
// "I haven't taken it", "remind me later", "दवा नहीं ली": never mark these as done
const NOT_YET = /n't\b|\b(not|never|yet|later|remind|forgot|forget|skip)\b|नहीं|नही\b|भूल|बाद में|याद दिला/i;

export type Heard = "call" | "help" | "quiet" | "remember" | "taken" | "ate" | "not-yet" | "water" | "doctor" | "other";

/** What a short spoken sentence asks for. Help wins; a "not yet" stops a dose or meal being marked. */
export function intentOf(said: string): Heard {
  // "remind me to call the doctor tomorrow" is a note for later, not a call now ("I feel dizzy, remind me" still calls)
  if (REMIND.test(said) && !URGENT.test(said) && !CALL_NOW.test(said.replace(/\bcall\b/gi, ""))) return "remember";
  if (CALL_NOW.test(said) || URGENT.test(said)) return "call";
  if (HELP.test(said)) return "help";
  // "I'm going to the temple tomorrow" is a plan to remember; "going to the temple" (now) asks for quiet
  const later = hearMemory(said);
  if (later?.day && later.day !== todayKey() && !/quiet|silent|चुप|शांत/i.test(said)) return "remember";
  if (QUIET.test(said)) return "quiet";
  const taken = TAKEN.test(said) && !ATE.test(said);
  const ate = ATE.test(said);
  if ((taken || ate) && NOT_YET.test(said)) return "not-yet";
  // "remind me to call Ravi at 5", "I'm going to the temple tomorrow"
  if (hearMemory(said)) return "remember";
  if (taken) return "taken";
  if (ate) return "ate";
  if (WATER.test(said)) return "water";
  if (DOCTOR.test(said)) return "doctor";
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
      setHeard(
        r.problem === "denied"
          ? t(lang, {
              en: "Asha needs the microphone to hear you. Allow it in phone Settings → Apps → Asha → Permissions.",
              hi: "सुनने के लिए आशा को माइक चाहिए. फ़ोन की सेटिंग → ऐप → आशा → अनुमतियाँ में माइक चालू करें.",
            })
          : t(lang, { en: "I didn't catch that. Press and try again.", hi: "सुनाई नहीं दिया. दबाकर फिर बोलें." }),
      );
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
        className={`flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl text-xl font-bold ${busy ? "listening bg-sage text-paper" : "tell-asha border-2 border-sage bg-paper text-sage"}`}
      >
        <Mic className="size-7" aria-hidden />
        {busy ? t(lang, { en: "Listening… speak now", hi: "सुन रही हूँ… अब बोलें" }) : t(lang, { en: "Tell Asha", hi: "आशा को बताएँ" })}
      </button>
      <p className="mt-2 text-base text-quiet">
        {heard ||
          t(lang, {
            en: "Say “I took it”, “I have eaten”, “one glass of water”, or “I'm not well” to call your people.",
            hi: "बोलें “ले ली”, “खा लिया”, “एक गिलास पानी”, या “तबीयत ठीक नहीं” तो मैं आपके अपनों को फ़ोन करूँगी.",
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
  if (want === "call") {
    // "I'm unwell, call Riya" calls Riya; otherwise the emergency number, or the first loved one
    const low = said.toLowerCase();
    const who = s.contacts.find(
      (c) =>
        digits(c.phone).length >= 3 &&
        [c.name, c.relation].some(
          (w) => w?.trim().length > 1 && low.includes(w.trim().toLowerCase()),
        ),
    );
    s.setTab("sos");
    useSosNow.getState().request(who?.id ?? "");
    return;
  }
  if (want === "help") {
    s.setTab("sos");
    reply("Opening Help.", "मदद खोल रही हूँ.");
    return;
  }
  if (want === "quiet") {
    useQuietSheet.getState().show(minutesSaid(said));
    return;
  }
  if (want === "remember") {
    useRemember.getState().begin(said);
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
  // a short ask is read from the saved page, even offline; a longer question goes to Talk, which knows the page too
  if (want === "doctor" && !(s.pro && said.split(/\s+/).length > 6)) {
    void speak(rxSpoken(s.prescriptions[0], v), v, s.richVoice ? "warm" : "device");
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
