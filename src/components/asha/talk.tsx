import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, MicButton, t } from "@/components/asha/bits";
import { URGENT, useTalkHandoff } from "@/components/asha/voice-command";
import { useQuietSheet } from "@/components/asha/quiet";
import { providerOf, titliChat, useBrain, whyWords } from "@/lib/asha/brain";
import { Pixie, type PixieMood } from "@/components/asha/pixie";
import { QUIET, minutesSaid } from "@/lib/asha/quiet";
import { CONDITIONS, text as phrase } from "@/lib/asha/plans";
import { rxContext } from "@/lib/asha/rx";
import { useAsha } from "@/lib/asha/store";
import { REMIND, memoryContext } from "@/lib/asha/remember";
import { useRemember } from "@/components/asha/ideas/remember";
import { speak, useSpeech } from "@/lib/asha/voice";

// Titli's chat replies use her own little phone voice: free, unlimited, and the same all day.
// (Her ElevenLabs voice has ~600 new letters a day, about three replies.)
const CHAT_VOICE = "fairy-phone" as const;

const CRISIS =
  /suicid|kill myself|want to die|end my life|self-harm|hurt myself|don't want to live|do not want to live|मरना चाहती|मरना चाहता|जीना नहीं|खुदकुशी|आत्महत्या/i;

export function TalkScreen() {
  const lang = useAsha((s) => s.lang);
  const voiceLang = useAsha((s) => s.voiceLang);
  const pro = useAsha((s) => s.pro);
  const setPrefs = useAsha((s) => s.setPrefs);
  const chat = useAsha((s) => s.chat);
  const push = useAsha((s) => s.pushChat);
  const name = useAsha((s) => s.name);
  const conditions = useAsha((s) => s.conditions);
  const meds = useAsha((s) => s.meds);
  const voiceOn = useAsha((s) => s.voiceOn);
  const setTab = useAsha((s) => s.setTab);
  const fairyName = useAsha((s) => s.fairyName);
  const own = useBrain((s) => s.own);
  const speaking = useSpeech((s) => s.active);
  const me = fairyName.trim() || "Titli";
  // her face follows the conversation: thinking while she works it out, then the face of her reply while she says it
  const [face, setFace] = useState<PixieMood>("wave");
  const [faceAt, setFaceAt] = useState(0);
  const [via, setVia] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [crisis, setCrisis] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function send(textIn?: string) {
    const text = (textIn ?? draft).trim();
    if (!text || busy) return;
    setDraft("");
    setError("");
    // "I'm going to a wedding, be quiet": quiet time, not a chat question
    if (QUIET.test(text) && !CRISIS.test(text) && !URGENT.test(text)) return useQuietSheet.getState().show(minutesSaid(text));
    // "remind me to…": she writes it down and asks what is missing, then the chat goes on
    if (!CRISIS.test(text) && !URGENT.test(text) && REMIND.test(text) && useRemember.getState().begin(text)) return;
    if (CRISIS.test(text)) setCrisis(true);
    if (URGENT.test(text)) setUrgent(true);
    push({ role: "user", text });
    setBusy(true);
    setFace("thinking");
    const conditionNames = conditions
      .map((id) => {
        const c = CONDITIONS.find((x) => x.id === id);
        return c ? phrase(c.title, "en") : id;
      })
      .join(", ");
    const context = `Name: ${name || "not given"}. Conditions: ${conditionNames || "none selected"}. Medicines: ${
      meds.map((m) => `${m.name} ${m.dose} at ${m.times.join(", ")}`).join("; ") || "none listed"
    }. ${rxContext(useAsha.getState().prescriptions)} ${memoryContext(useAsha.getState().memories)} Local time: ${new Date().toLocaleString("en-IN")}.`;
    const turns = [...useAsha.getState().chat].slice(-10).map((turn) => ({ role: turn.role, content: turn.text }));
    const res = await titliChat({ show: lang, say: voiceLang, context, turns, fairy: me });
    setBusy(false);
    const ownName = own ? providerOf(own.provider).name : "";
    setVia(
      res.ownFailed
        ? `${whyWords(res.ownFailed, lang, ownName)} ${res.ok ? t(lang, { en: "The free helper answered this time.", hi: "इस बार मुफ़्त सहायक ने जवाब दिया." }) : ""}`.trim()
        : res.ok && res.via === "own"
          ? t(lang, { en: `Answered with your ${ownName} account.`, hi: `आपके ${ownName} खाते से जवाब.` })
          : "",
    );
    if (!res.ok) {
      setFace("sad");
      setFaceAt(Date.now());
      setError(
        res.error === "offline"
          ? t(lang, { en: "No internet right now. Reminders and Help still work.", hi: "अभी इंटरनेट नहीं. याद और मदद फिर भी चलते हैं." })
          : res.status === 429
            ? t(lang, { en: `${me} needs a short rest. Try again in a little while.`, hi: `${me} को थोड़ा आराम चाहिए. थोड़ी देर बाद फिर कोशिश करें.` })
            : t(lang, { en: `${me} could not answer just now. Try again in a moment.`, hi: `${me} अभी जवाब नहीं दे पाई. थोड़ी देर में फिर कोशिश करें.` }),
      );
      return;
    }
    push({ role: "asha", text: res.show, say: res.say });
    setFace(res.mood);
    setFaceAt(Date.now());
    if (voiceOn) void speak(res.say, voiceLang, CHAT_VOICE);
  }

  // Words said with "Tell Asha" on Today arrive here and are sent straight away.
  const handoff = useTalkHandoff((s) => s.text);
  useEffect(() => {
    if (!handoff || !(pro || own)) return;
    useTalkHandoff.getState().set("");
    void send(handoff);
  }, [handoff, pro, own]);

  // after her reply is said (or a few seconds without voice) she relaxes back to her resting face
  useEffect(() => {
    if (!faceAt || speaking || busy) return;
    const id = window.setTimeout(() => setFace("idle"), 4000);
    return () => window.clearTimeout(id);
  }, [faceAt, speaking, busy]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.length, busy]);

  // with their own AI account, talking is theirs already: no Pro needed
  if (!pro && !own) {
    return (
      <div className="py-5">
        <h1 className="display text-4xl">{t(lang, { en: "Talk", hi: "बात" })}</h1>
        <p className="mt-2 text-lg text-quiet">
          {t(lang, {
            en: "Reminders, meals and Help are always free.",
            hi: "याद दिलाना, खाना और मदद हमेशा मुफ़्त हैं.",
          })}
        </p>
        <Card className="mt-5">
          <p className="text-2xl font-bold">{t(lang, { en: "Talking freely is Pro.", hi: "खुलकर बात करना प्रो है." })}</p>
          <p className="mt-3 text-lg">
            {t(lang, {
              en: "Pro lets you talk about anything: a lonely afternoon, a worry, the news, a memory. Asha answers in a short, warm voice. She is still not a doctor.",
              hi: "प्रो में आप कुछ भी बात कर सकते हैं: सूनी दोपहर, चिंता, खबर, कोई याद. आशा छोटे, प्यार भरे वाक्यों में जवाब देती है. वह फिर भी डॉक्टर नहीं.",
            })}
          </p>
          <p className="mt-3 text-base text-quiet">
            {t(lang, {
              en: "This test copy has no charge. Play Store payment can be added before launch.",
              hi: "इस टेस्ट कॉपी में कोई शुल्क नहीं. प्ले स्टोर भुगतान लॉन्च से पहले जोड़ा जा सकता है.",
            })}
          </p>
          <div className="mt-4">
            <Button onClick={() => setPrefs({ pro: true })}>{t(lang, { en: "Turn on Pro on this phone", hi: "इस फ़ोन पर प्रो चालू करें" })}</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-5">
      <div className="flex items-end gap-3">
        <div data-titli-face={busy ? "thinking" : face} className="h-32 w-28 shrink-0" aria-hidden>
          <Pixie mood={busy ? "thinking" : speaking && face === "idle" ? "talk" : face} className="h-full w-full" />
        </div>
        <div className="min-w-0 pb-2">
          <h1 className="display text-4xl">{t(lang, { en: `Talk with ${me}`, hi: `${me} से बात` })}</h1>
          {via ? <p data-titli-via className="mt-1 text-base text-quiet">{via}</p> : null}
        </div>
      </div>
      <p className="mt-2 text-lg text-quiet">
        {voiceLang !== lang
          ? t(lang, {
              en: "Speak or type in Hindi or English. Asha speaks Hindi and writes English here.",
              hi: "हिन्दी या अंग्रेज़ी में बोलें या लिखें. आशा अंग्रेज़ी में बोलती है और यहाँ हिन्दी में लिखती है.",
            })
          : t(lang, {
              en: "Press the microphone and speak, or type. She speaks her reply if voice is on.",
              hi: "माइक दबाकर बोलें, या लिखें. आवाज़ चालू हो तो वह जवाब बोलेगी.",
            })}
      </p>
      {urgent ? (
        <Card className="mt-4 border-sos bg-sos-soft">
          <p className="text-lg font-bold">{t(lang, { en: "This could be serious. Don't wait.", hi: "यह गंभीर हो सकता है. रुकिए मत." })}</p>
          <p className="mt-2 text-lg">
            {t(lang, {
              en: "Sit down and stay still. Open Help now and hold the big button: Asha calls for help.",
              hi: "बैठ जाइए और हिलिए मत. अभी मदद खोलिए और बड़ा बटन दबाकर रखिए: आशा मदद के लिए कॉल करेगी.",
            })}
          </p>
          <div className="mt-3">
            <Button variant="sos" onClick={() => setTab("sos")}>
              {t(lang, { en: "Open Help", hi: "मदद खोलें" })}
            </Button>
          </div>
        </Card>
      ) : null}
      {crisis ? (
        <Card className="mt-4 border-sos bg-sos-soft">
          <p className="text-lg font-bold">{t(lang, { en: "Please talk to someone now.", hi: "कृपया अभी किसी से बात करें." })}</p>
          <p className="mt-2 text-lg">
            {t(lang, {
              en: "Press Help to call your person. In India, Tele-MANAS is free, any time: 14416. In the US and Canada, call or text 988.",
              hi: "मदद दबाकर अपने व्यक्ति को कॉल करें. भारत में Tele-MANAS मुफ़्त है, कभी भी: 14416. अमेरिका और कनाडा में 988.",
            })}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <Button variant="sos" onClick={() => setTab("sos")}>
              {t(lang, { en: "Open Help", hi: "मदद खोलें" })}
            </Button>
            <a href="tel:14416" className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-line bg-paper text-lg font-bold">
              {t(lang, { en: "Call Tele-MANAS 14416", hi: "Tele-MANAS 14416 पर कॉल करें" })}
            </a>
          </div>
        </Card>
      ) : null}
      <div className="mt-5 flex flex-col gap-3">
        {chat.length === 0 ? (
          <Card>
            <p className="text-lg">
              {t(lang, {
                en: "You can start anywhere. How the morning went is enough.",
                hi: "कहीं से भी शुरू करें. सुबह कैसी रही, बस इतना काफ़ी है.",
              })}
            </p>
          </Card>
        ) : (
          chat.map((turn, i) => (
            <div
              key={`${i}-${turn.role}`}
              className={turn.role === "user" ? "ml-8 rounded-3xl bg-sage-soft px-4 py-3 text-lg" : "mr-6 rounded-3xl border border-line bg-paper px-4 py-3 text-lg"}
            >
              <p className="text-base font-bold text-quiet">{turn.role === "user" ? name || t(lang, { en: "You", hi: "आप" }) : me}</p>
              <p className="mt-1">{turn.text}</p>
              {turn.role === "asha" && voiceOn ? (
                <button type="button" className="mt-1 min-h-11 text-base font-bold text-sage" onClick={() => void speak(turn.say ?? turn.text, voiceLang, CHAT_VOICE)}>
                  {t(lang, { en: "Hear again", hi: "फिर सुनें" })}
                </button>
              ) : null}
            </div>
          ))
        )}
        {busy ? <p className="text-lg text-quiet">{t(lang, { en: `${me} is thinking…`, hi: `${me} सोच रही है…` })}</p> : null}
        {error ? <p className="text-lg text-clay">{error}</p> : null}
        <div ref={endRef} />
      </div>
      <div data-tour="talk-mic" className="mt-4">
        <MicButton
          className="w-full [&>button]:w-full [&>button]:min-h-16 [&>button]:text-xl"
          label={t(lang, { en: "Press and speak", hi: "दबाएँ और बोलें" })}
          onText={(said) => void send(said)}
        />
        <textarea
          className="field mt-3 min-h-24"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t(lang, { en: "Or type here", hi: "या यहाँ लिखें" })}
        />
        <div className="mt-3">
          <Button onClick={() => void send()} disabled={busy || !draft.trim()}>
            {t(lang, { en: "Send", hi: "भेजें" })}
          </Button>
        </div>
        <p className="mt-3 text-base text-quiet">
          {t(lang, {
            en: "Asha is not a doctor. If something feels urgent, press the red Help button at the top.",
            hi: "आशा डॉक्टर नहीं. अगर कुछ तुरंत लगे, ऊपर लाल मदद बटन दबाएँ.",
          })}
        </p>
      </div>
    </div>
  );
}
