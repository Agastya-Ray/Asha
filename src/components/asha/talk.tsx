import { useState } from "react";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, t } from "@/components/asha/bits";
import { askAsha } from "@/lib/asha/ai";
import { CONDITIONS, text as phrase } from "@/lib/asha/plans";
import { useAsha } from "@/lib/asha/store";
import { speak } from "@/lib/asha/voice";

const CRISIS =
  /suicid|kill myself|want to die|end my life|self-harm|hurt myself|don't want to live|do not want to live|मरना|जीना नहीं|खुदकुशी|आत्महत्या/i;

type Rec = {
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function recognizer() {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => Rec;
    webkitSpeechRecognition?: new () => Rec;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function TalkScreen() {
  const lang = useAsha((s) => s.lang);
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
  const [listening, setListening] = useState(false);
  const [crisis, setCrisis] = useState(false);

  async function send(textIn?: string) {
    const text = (textIn ?? draft).trim();
    if (!text || busy) return;
    setDraft("");
    setError("");
    setCrisis(CRISIS.test(text));
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
    }.`;
    const turns = [...chat, { role: "user" as const, text }].slice(-8).map((turn) => ({
      role: turn.role,
      content: turn.text,
    }));
    const res = await askAsha({ data: { lang, context, turns } });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    push({ role: "asha", text: res.text });
    if (voiceOn) void speak(res.text, lang, rich ? "warm" : "device");
  }

  function listen() {
    const Ctor = recognizer();
    if (!Ctor) {
      setError(t(lang, { en: "This phone has no speech button. Typing works.", hi: "इस फ़ोन पर बोलने का बटन नहीं. लिखना चलता है." }));
      return;
    }
    const rec = new Ctor();
    rec.lang = lang === "hi" ? "hi-IN" : "en-IN";
    rec.onresult = (ev) => {
      const said = ev.results[0]?.[0]?.transcript ?? "";
      setDraft(said);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  }

  if (!pro) {
    return (
      <div className="py-5">
        <h1 className="display text-4xl">{t(lang, { en: "Talk", hi: "बात" })}</h1>
        <p className="mt-2 text-lg text-quiet">
          {t(lang, {
            en: "Medicines, meals, the chart, greetings, and Help stay open for everyone.",
            hi: "दवा, खाना, चार्ट, अभिवादन और मदद सबके लिए खुले हैं.",
          })}
        </p>
        <Card className="mt-5">
          <p className="text-2xl font-bold">{t(lang, { en: "Talking freely is Pro.", hi: "खुलकर बात करना प्रो है." })}</p>
          <p className="mt-3 text-lg">
            {t(lang, {
              en: "Pro lets her talk about anything — a lonely afternoon, a worry, the news, a memory. Asha answers in a short, human voice. She is still not a doctor.",
              hi: "प्रो में वह कुछ भी बात कर सकती हैं — सूनी दोपहर, चिंता, खबर, कोई याद. आशा छोटे मानवीय वाक्यों में जवाब देती है. वह फिर भी डॉक्टर नहीं.",
            })}
          </p>
          <p className="mt-3 text-base text-quiet">
            {t(lang, {
              en: "There is no charge inside this copy. Pro stays on this phone. A Play Store payment can come later, when you choose it.",
              hi: "इस प्रति में कोई शुल्क नहीं. प्रो इसी फ़ोन पर रहता है. प्ले स्टोर का भुगतान बाद में, जब आप चाहें.",
            })}
          </p>
          <div className="mt-4">
            <Button onClick={() => setPrefs({ pro: true })}>
              {t(lang, { en: "Turn on Pro on this phone", hi: "इस फ़ोन पर प्रो चालू करें" })}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-5">
      <h1 className="display text-4xl">{t(lang, { en: "Talk with Asha", hi: "आशा से बात" })}</h1>
      <p className="mt-2 text-lg text-quiet">
        {t(lang, {
          en: "You will see the words before they are sent. Then press Send. She speaks the reply if voice is on.",
          hi: "भेजने से पहले शब्द दिखेंगे. फिर भेजें दबाएँ. आवाज़ चालू हो तो वह जवाब बोलेगी.",
        })}
      </p>
      {crisis ? (
        <Card className="mt-4 border-sos bg-sos-soft">
          <p className="text-lg font-bold">
            {t(lang, { en: "Please call someone now.", hi: "कृपया अभी किसी को कॉल करें." })}
          </p>
          <p className="mt-2 text-lg">
            {t(lang, {
              en: "Open Help and call your person. In India, AASRA is 9820466726. In the US and Canada, call or text 988.",
              hi: "मदद खोलें और अपने व्यक्ति को कॉल करें. भारत में AASRA 9820466726. अमेरिका और कनाडा में 988 पर कॉल या संदेश.",
            })}
          </p>
          <div className="mt-3">
            <Button variant="sos" onClick={() => setTab("sos")}>
              {t(lang, { en: "Open Help", hi: "मदद खोलें" })}
            </Button>
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
            </div>
          ))
        )}
        {busy ? <p className="text-lg text-quiet">{t(lang, { en: "Asha is thinking.", hi: "आशा सोच रही है." })}</p> : null}
        {error ? <p className="text-lg text-clay">{error}</p> : null}
      </div>
      <div className="mt-4">
        <textarea
          className="field min-h-28"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t(lang, { en: "Type, or use the microphone", hi: "लिखें, या माइक दबाएँ" })}
        />
        <div className="mt-3 flex flex-col gap-2">
          <Button onClick={() => void send()} disabled={busy}>
            {t(lang, { en: "Send", hi: "भेजें" })}
          </Button>
          <Button variant="quiet" onClick={listen}>
            <Mic className="size-5" aria-hidden />
            {listening ? t(lang, { en: "Listening…", hi: "सुन रही हूँ…" }) : t(lang, { en: "Speak, then check the words", hi: "बोलें, फिर शब्द देखें" })}
          </Button>
        </div>
        <p className="mt-3 text-base text-quiet">
          {t(lang, {
            en: "Asha is not a doctor. If something feels urgent, Help is at the top.",
            hi: "आशा डॉक्टर नहीं. अगर कुछ तुरंत लगे, मदद ऊपर है.",
          })}
        </p>
      </div>
    </div>
  );
}
