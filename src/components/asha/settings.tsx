import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, Choice, FieldLabel, t } from "@/components/asha/bits";
import { CONDITIONS } from "@/lib/asha/plans";
import { newId, useAsha } from "@/lib/asha/store";

export function SettingsScreen() {
  const lang = useAsha((s) => s.lang);
  const name = useAsha((s) => s.name);
  const conditions = useAsha((s) => s.conditions);
  const contacts = useAsha((s) => s.contacts);
  const emergency = useAsha((s) => s.emergencyNumber);
  const voiceOn = useAsha((s) => s.voiceOn);
  const richVoice = useAsha((s) => s.richVoice);
  const speakOnOpen = useAsha((s) => s.speakOnOpen);
  const keepAwake = useAsha((s) => s.keepAwake);
  const pro = useAsha((s) => s.pro);
  const setLang = useAsha((s) => s.setLang);
  const setName = useAsha((s) => s.setName);
  const toggle = useAsha((s) => s.toggleCondition);
  const setEmergency = useAsha((s) => s.setEmergency);
  const upsert = useAsha((s) => s.upsertContact);
  const remove = useAsha((s) => s.removeContact);
  const setPrefs = useAsha((s) => s.setPrefs);
  const erase = useAsha((s) => s.eraseAll);
  const close = useAsha((s) => s.closeSettings);
  const [confirm, setConfirm] = useState(false);
  const [note, setNote] = useState("");

  async function allowNotes() {
    if (typeof Notification === "undefined") {
      setNote(t(lang, { en: "This phone does not show reminders outside the page.", hi: "यह फ़ोन पन्ने के बाहर याद नहीं दिलाता." }));
      return;
    }
    const result = await Notification.requestPermission();
    setNote(
      result === "granted"
        ? t(lang, {
            en: "Allowed. Asha still has to be open to speak. The notice is only a quiet line, not an alarm.",
            hi: "अनुमति मिल गई. बोलने के लिए आशा को खुला रहना होगा. सूचना एक शांत पंक्ति है, अलार्म नहीं.",
          })
        : t(lang, { en: "Not allowed. Speaking on this page still works.", hi: "अनुमति नहीं. इस पन्ने पर बोलना फिर भी चलेगा." }),
    );
  }

  return (
    <div className="py-5">
      <button type="button" className="min-h-12 text-lg font-bold text-sage" onClick={() => close()}>
        {t(lang, { en: "Back to the day", hi: "दिन पर वापस" })}
      </button>
      <h1 className="display mt-2 text-4xl">{t(lang, { en: "Settings", hi: "सेटिंग" })}</h1>
      <p className="mt-2 text-lg text-quiet">
        {t(lang, {
          en: "Everything here stays on this phone. Nothing is sent to an account.",
          hi: "यहाँ सब कुछ इसी फ़ोन पर रहता है. किसी खाते में नहीं जाता.",
        })}
      </p>

      <div className="mt-5">
        <FieldLabel>{t(lang, { en: "Name", hi: "नाम" })}</FieldLabel>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-line bg-paper p-1">
        <button type="button" onClick={() => setLang("en")} className={`min-h-12 rounded-xl text-lg font-bold ${lang === "en" ? "bg-sage text-paper" : ""}`}>
          English
        </button>
        <button type="button" onClick={() => setLang("hi")} className={`min-h-12 rounded-xl text-lg font-bold ${lang === "hi" ? "bg-sage text-paper" : ""}`}>
          हिन्दी
        </button>
      </div>

      <h2 className="mt-6 text-2xl font-bold">{t(lang, { en: "Health", hi: "सेहत" })}</h2>
      <div className="mt-3 flex flex-col gap-2">
        {CONDITIONS.map((c) => (
          <Choice key={c.id} selected={conditions.includes(c.id)} onClick={() => toggle(c.id)} title={t(lang, c.title)} detail={t(lang, c.blurb)} />
        ))}
      </div>

      <h2 className="mt-6 text-2xl font-bold">{t(lang, { en: "Voice", hi: "आवाज़" })}</h2>
      <div className="mt-3 flex flex-col gap-2">
        <Toggle on={voiceOn} lang={lang} label={t(lang, { en: "Speak reminders and greetings", hi: "याद और अभिवादन बोलें" })} onClick={() => setPrefs({ voiceOn: !voiceOn })} />
        <Toggle on={richVoice} lang={lang} label={t(lang, { en: "Use the warmer voice when online", hi: "ऑनलाइन होने पर गरम आवाज़" })} onClick={() => setPrefs({ richVoice: !richVoice })} />
        <Toggle on={speakOnOpen} lang={lang} label={t(lang, { en: "Greet me when I open Asha", hi: "आशा खुलते ही अभिवादन" })} onClick={() => setPrefs({ speakOnOpen: !speakOnOpen })} />
        <Toggle on={keepAwake} lang={lang} label={t(lang, { en: "Keep the screen awake. Uses more battery.", hi: "स्क्रीन जगाए रखें. बैटरी ज़्यादा लगेगी." })} onClick={() => setPrefs({ keepAwake: !keepAwake })} />
        <Toggle on={pro} lang={lang} label={t(lang, { en: "Pro on this phone — talk freely", hi: "इस फ़ोन पर प्रो — खुलकर बात" })} onClick={() => setPrefs({ pro: !pro })} />
      </div>
      <div className="mt-3">
        <Button variant="quiet" onClick={() => void allowNotes()}>
          {t(lang, { en: "Allow a quiet notice", hi: "शांत सूचना की अनुमति" })}
        </Button>
        {note ? <p className="mt-2 text-base text-quiet">{note}</p> : null}
      </div>

      <h2 className="mt-6 text-2xl font-bold">{t(lang, { en: "Emergency number", hi: "इमरजेंसी नंबर" })}</h2>
      <input className="field mt-3" inputMode="tel" value={emergency} onChange={(e) => setEmergency(e.target.value)} placeholder="112" />

      <h2 className="mt-6 text-2xl font-bold">{t(lang, { en: "Loved ones", hi: "अपने लोग" })}</h2>
      <div className="mt-3 flex flex-col gap-3">
        {contacts.map((person) => (
          <Card key={person.id}>
            <FieldLabel>{t(lang, { en: "Name", hi: "नाम" })}</FieldLabel>
            <input className="field" value={person.name} onChange={(e) => upsert({ ...person, name: e.target.value })} />
            <div className="mt-3">
              <FieldLabel>{t(lang, { en: "Who they are", hi: "रिश्ता" })}</FieldLabel>
              <input className="field" value={person.relation} onChange={(e) => upsert({ ...person, relation: e.target.value })} />
            </div>
            <div className="mt-3">
              <FieldLabel>{t(lang, { en: "Phone", hi: "फ़ोन" })}</FieldLabel>
              <input className="field" inputMode="tel" value={person.phone} onChange={(e) => upsert({ ...person, phone: e.target.value })} />
            </div>
            <button type="button" className="mt-3 min-h-12 font-bold text-clay" onClick={() => remove(person.id)}>
              {t(lang, { en: "Remove this person", hi: "इस व्यक्ति को हटाएँ" })}
            </button>
          </Card>
        ))}
      </div>
      <div className="mt-3">
        <Button variant="quiet" onClick={() => upsert({ id: newId(), name: "", relation: "", phone: "" })}>
          {t(lang, { en: "Add a person", hi: "व्यक्ति जोड़ें" })}
        </Button>
      </div>

      <h2 className="mt-8 text-2xl font-bold">{t(lang, { en: "Erase this phone", hi: "इस फ़ोन को मिटाएँ" })}</h2>
      <p className="mt-2 text-lg text-quiet">
        {t(lang, { en: "This removes medicines, numbers, and the chart from this phone only.", hi: "यह दवा, नंबर और चार्ट सिर्फ इस फ़ोन से हटाता है." })}
      </p>
      {confirm ? (
        <div className="mt-3 flex flex-col gap-2">
          <Button variant="sos" onClick={() => erase()}>
            {t(lang, { en: "Yes, erase", hi: "हाँ, मिटाएँ" })}
          </Button>
          <Button variant="quiet" onClick={() => setConfirm(false)}>
            {t(lang, { en: "Keep my list", hi: "मेरी सूची रहने दें" })}
          </Button>
        </div>
      ) : (
        <div className="mt-3">
          <Button variant="quiet" onClick={() => setConfirm(true)}>
            {t(lang, { en: "Erase everything on this phone", hi: "इस फ़ोन की सब चीज़ मिटाएँ" })}
          </Button>
        </div>
      )}
    </div>
  );
}

function Toggle({ on, label, onClick, lang }: { on: boolean; label: string; onClick: () => void; lang: "en" | "hi" }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 text-left text-lg"
    >
      <span>{label}</span>
      <span className={`shrink-0 rounded-full px-3 py-1 text-base font-bold ${on ? "bg-sage text-paper" : "bg-linen text-quiet"}`}>
        {on ? (lang === "hi" ? "चालू" : "On") : lang === "hi" ? "बंद" : "Off"}
      </span>
    </button>
  );
}
