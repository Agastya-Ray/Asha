import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, MicButton, t } from "@/components/asha/bits";
import { URGENT, useTalkHandoff } from "@/components/asha/voice-command";
import { apiChat } from "@/lib/asha/api";
import { CONDITIONS, text as phrase } from "@/lib/asha/plans";
import { useAsha } from "@/lib/asha/store";
import { speak } from "@/lib/asha/voice";

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
  const rich = useAsha((s) => s.richVoice);
  const setTab = useAsha((s) => s.setTab);
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
    if (CRISIS.test(text)) setCrisis(true);
    if (URGENT.test(text)) setUrgent(true);
    push({ role: "user", text });
    setBusy(true);
    const conditionNames = conditions
      .map((id) => {
        const c = CONDITIONS.find((x) => x.id === id);
        return c ? phrase(c.title, "en") : id;
      })
      .join(", ");
    const context = `Name: ${name || "not given"}. Conditions: ${conditionNames || "none selected"}. Medicines: ${
      meds.map((m) => `${m.name} ${m.dose} at ${m.times.join(", ")}`).join("; ") || "none listed"
    }. Local time: ${new Date().toLocaleString("en-IN")}.`;
    const turns = [...useAsha.getState().chat].slice(-10).map((turn) => ({ role: turn.role, content: turn.text }));
    const res = await apiChat({ show: lang, say: voiceLang, context, turns });
    setBusy(false);
    if (!res.ok) {
      setError(
        res.error === "offline"
          ? t(lang, { en: "No internet right now. Reminders and Help still work.", hi: "अभी इंटरनेट नहीं. याद और मदद फिर भी चलते हैं." })
          : res.status === 429
            ? t(lang, { en: "Asha needs a short rest. Try again in a little while.", hi: "आशा को थोड़ा आराम चाहिए. थोड़ी देर बाद फिर कोशिश करें." })
            : t(lang, { en: "Asha could not answer just now. Try again in a moment.", hi: "आशा अभी जवाब नहीं दे पाई. थोड़ी देर में फिर कोशिश करें." }),
      );
      return;
    }
    push({ role: "asha", text: res.show, say: res.say });
    if (voiceOn) void speak(res.say, voiceLang, rich ? "warm" : "device");
  }

  // Words said with "Tell Asha" on Today arrive here and are sent straight away.
  const handoff = useTalkHandoff((s) => s.text);
  useEffect(() => {
    if (!handoff || !pro) return;
    useTalkHandoff.getState().set("");
    void send(handoff);
  }, [handoff, pro]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.length, busy]);

  if (!pro) {
    return (
      <div className="py-5">
        <h1 className="display text-4xl">{t(lang, { en: "Talk", hi: "बात" })}</h1>
        <p className="mt-2 text-lg text-quiet">
          {t(lang, {
            en: "Medicines, meals, the chart, greetings, 'Tell Asha', and Help stay free for everyone.",
            hi: "दवा, खाना, चार्ट, अभिवादन, 'आशा को बताएँ' और मदद सबके लिए मुफ़्त हैं.",
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
      <h1 className="display text-4xl">{t(lang, { en: "Talk with Asha", hi: "आशा से बात" })}</h1>
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
              <p className="text-base font-bold text-quiet">{turn.role === "user" ? name || t(lang, { en: "You", hi: "आप" }) : "Asha"}</p>
              <p className="mt-1">{turn.text}</p>
              {turn.role === "asha" && voiceOn ? (
                <button type="button" className="mt-1 min-h-11 text-base font-bold text-sage" onClick={() => void speak(turn.say ?? turn.text, voiceLang, rich ? "warm" : "device")}>
                  {t(lang, { en: "Hear again", hi: "फिर सुनें" })}
                </button>
              ) : null}
            </div>
          ))
        )}
        {busy ? <p className="text-lg text-quiet">{t(lang, { en: "Asha is thinking…", hi: "आशा सोच रही है…" })}</p> : null}
        {error ? <p className="text-lg text-clay">{error}</p> : null}
        <div ref={endRef} />
      </div>
      <div className="mt-4">
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
