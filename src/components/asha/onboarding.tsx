import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Choice, FieldLabel, t } from "@/components/asha/bits";
import { MedEditor } from "@/components/asha/meds";
import { CONDITIONS } from "@/lib/asha/plans";
import { digits } from "@/lib/asha/schedule";
import { blankMed, newId, useAsha } from "@/lib/asha/store";
import type { Contact } from "@/lib/asha/types";

export function Onboarding() {
  const lang = useAsha((s) => s.lang);
  const step = useAsha((s) => s.setupStep);
  const name = useAsha((s) => s.name);
  const conditions = useAsha((s) => s.conditions);
  const setLang = useAsha((s) => s.setLang);
  const setName = useAsha((s) => s.setName);
  const toggle = useAsha((s) => s.toggleCondition);
  const setStep = useAsha((s) => s.setSetupStep);
  const setContacts = useAsha((s) => s.setContacts);
  const setEmergency = useAsha((s) => s.setEmergency);
  const finish = useAsha((s) => s.finishSetup);
  const loadSample = useAsha((s) => s.loadSample);
  const [hint, setHint] = useState("");
  const [people, setPeople] = useState<Contact[]>(() => {
    const existing = useAsha.getState().contacts;
    return existing.length ? existing : [{ id: newId(), name: "", relation: "", phone: "" }];
  });
  const [emergency, setEmergencyLocal] = useState(() => useAsha.getState().emergencyNumber);
  const [adding, setAdding] = useState(false);

  const steps = t(lang, { en: "Step", hi: "कदम" });

  return (
    <div className="py-6">
      <p className="text-base font-bold text-sage">
        {steps} {step} / 4
      </p>
      {step === 1 && (
        <div className="mt-3">
          <h1 className="display text-5xl leading-tight">
            {t(lang, { en: "A calm voice for the day.", hi: "दिन के लिए एक शांत आवाज़." })}
          </h1>
          <p className="mt-4 text-lg text-quiet">
            {t(lang, {
              en: "Asha speaks medicines and meals in a sentence, not a beep. Help stays at the top. This stays on this phone.",
              hi: "आशा दवा और खाना एक वाक्य में बोलती है, बीप में नहीं. मदद ऊपर रहती है. यह इसी फ़ोन पर रहता है.",
            })}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-line bg-paper p-1">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`min-h-12 rounded-xl text-lg font-bold ${lang === "en" ? "bg-sage text-paper" : "text-ink"}`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLang("hi")}
              className={`min-h-12 rounded-xl text-lg font-bold ${lang === "hi" ? "bg-sage text-paper" : "text-ink"}`}
            >
              हिन्दी
            </button>
          </div>
          <div className="mt-6">
            <FieldLabel>{t(lang, { en: "What should Asha call you?", hi: "आशा आपको क्या कहे?" })}</FieldLabel>
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t(lang, { en: "Meena", hi: "मीना" })}
              autoComplete="given-name"
            />
            <p className="mt-2 text-base text-quiet">
              {t(lang, {
                en: "A first name is enough. She will use it when she speaks.",
                hi: "पहला नाम काफ़ी है. बोलते समय वही नाम आएगा.",
              })}
            </p>
          </div>
          {hint ? <p className="mt-4 text-lg text-clay">{hint}</p> : null}
          <div className="mt-6 flex flex-col gap-3">
            <Button
              onClick={() => {
                if (!name.trim()) {
                  setHint(t(lang, { en: "Type a name first. Even a nickname is fine.", hi: "पहले नाम लिखें. उपनाम भी चलेगा." }));
                  return;
                }
                setHint("");
                setStep(2);
              }}
            >
              {t(lang, { en: "Continue", hi: "आगे बढ़ें" })}
            </Button>
            <Button variant="quiet" onClick={() => loadSample()}>
              {t(lang, { en: "See a sample day first", hi: "पहले एक नमूना दिन देखें" })}
            </Button>
          </div>
          <p className="mt-6 text-base text-quiet">
            {t(lang, {
              en: "Asha is not a doctor. She does not change a prescription.",
              hi: "आशा डॉक्टर नहीं है. वह पर्ची नहीं बदलती.",
            })}
          </p>
        </div>
      )}

      {step === 2 && (
        <div className="mt-3">
          <h1 className="display text-4xl">{t(lang, { en: "Which of these are yours?", hi: "इनमें से कौन सी आपकी हैं?" })}</h1>
          <p className="mt-3 text-lg text-quiet">
            {t(lang, {
              en: "Tap every one that applies. You can change this later. None is also allowed.",
              hi: "जो लागू हो उसे छुएँ. बाद में बदल सकते हैं. कोई न चुनना भी ठीक है.",
            })}
          </p>
          <div className="mt-5 flex flex-col gap-3">
            {CONDITIONS.map((c) => (
              <Choice
                key={c.id}
                selected={conditions.includes(c.id)}
                onClick={() => toggle(c.id)}
                title={t(lang, c.title)}
                detail={t(lang, c.blurb)}
              />
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <Button
              onClick={() => {
                setStep(3);
              }}
            >
              {t(lang, { en: "Continue", hi: "आगे बढ़ें" })}
            </Button>
            <Button variant="quiet" onClick={() => setStep(1)}>
              {t(lang, { en: "Back", hi: "पीछे" })}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-3">
          <h1 className="display text-4xl">{t(lang, { en: "Who should the phone call?", hi: "फ़ोन किसे लगना चाहिए?" })}</h1>
          <p className="mt-3 text-lg text-quiet">
            {t(lang, {
              en: "Add at least one number. A daughter, a neighbor, or the emergency number where you live. In India that is often 112. In the US it is 911.",
              hi: "कम से कम एक नंबर डालें. बेटी, पड़ोसी, या इमरजेंसी नंबर. भारत में अक्सर 112. अमेरिका में 911.",
            })}
          </p>
          <div className="mt-5">
            <FieldLabel>{t(lang, { en: "Emergency number", hi: "इमरजेंसी नंबर" })}</FieldLabel>
            <input
              className="field"
              inputMode="tel"
              value={emergency}
              onChange={(e) => setEmergencyLocal(e.target.value)}
              placeholder="112"
            />
          </div>
          {people.map((person, index) => (
            <div key={person.id} className="mt-5 rounded-3xl border border-line bg-paper p-4">
              <p className="text-base font-bold text-quiet">
                {t(lang, { en: "Loved one", hi: "अपना व्यक्ति" })} {index + 1}
              </p>
              <div className="mt-3">
                <FieldLabel>{t(lang, { en: "Name", hi: "नाम" })}</FieldLabel>
                <input
                  className="field"
                  value={person.name}
                  onChange={(e) =>
                    setPeople((list) => list.map((p) => (p.id === person.id ? { ...p, name: e.target.value } : p)))
                  }
                />
              </div>
              <div className="mt-3">
                <FieldLabel>{t(lang, { en: "Who they are", hi: "रिश्ता" })}</FieldLabel>
                <input
                  className="field"
                  value={person.relation}
                  placeholder={t(lang, { en: "Daughter", hi: "बेटी" })}
                  onChange={(e) =>
                    setPeople((list) => list.map((p) => (p.id === person.id ? { ...p, relation: e.target.value } : p)))
                  }
                />
              </div>
              <div className="mt-3">
                <FieldLabel>{t(lang, { en: "Phone", hi: "फ़ोन" })}</FieldLabel>
                <input
                  className="field"
                  inputMode="tel"
                  value={person.phone}
                  placeholder="+91"
                  onChange={(e) =>
                    setPeople((list) => list.map((p) => (p.id === person.id ? { ...p, phone: e.target.value } : p)))
                  }
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            className="mt-4 min-h-12 text-lg font-bold text-sage"
            onClick={() => setPeople((list) => [...list, { id: newId(), name: "", relation: "", phone: "" }])}
          >
            {t(lang, { en: "Add another person", hi: "एक और व्यक्ति जोड़ें" })}
          </button>
          {hint ? <p className="mt-4 text-lg text-clay">{hint}</p> : null}
          <div className="mt-6 flex flex-col gap-3">
            <Button
              onClick={() => {
                const kept = people.filter((p) => p.name.trim() || digits(p.phone).length >= 3);
                const ok =
                  digits(emergency).length >= 3 || kept.some((p) => p.name.trim() && digits(p.phone).length >= 3);
                if (!ok) {
                  setHint(
                    t(lang, {
                      en: "Add one real number before going on. Help cannot call an empty line.",
                      hi: "आगे बढ़ने से पहले एक असली नंबर डालें. खाली नंबर पर मदद कॉल नहीं कर सकती.",
                    }),
                  );
                  return;
                }
                setContacts(kept);
                setEmergency(emergency);
                setHint("");
                setStep(4);
              }}
            >
              {t(lang, { en: "Continue", hi: "आगे बढ़ें" })}
            </Button>
            <Button variant="quiet" onClick={() => setStep(2)}>
              {t(lang, { en: "Back", hi: "पीछे" })}
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="mt-3">
          <h1 className="display text-4xl">{t(lang, { en: "Medicines can wait one minute.", hi: "दवा एक मिनट रुक सकती है." })}</h1>
          <p className="mt-3 text-lg text-quiet">
            {t(lang, {
              en: "You can type the first one now. Or finish, and on Meds take a photo of the prescription. Asha reads the names and waits for you to check each one. Handwriting is easy to misread.",
              hi: "पहली दवा अभी लिख सकते हैं. या खत्म करें, और दवा वाले पन्ने पर पर्ची की फ़ोटो लें. आशा नाम पढ़ेगी और हर नाम आपकी जाँच का इंतज़ार करेगी. लिखावट आसानी से गलत पढ़ी जाती है.",
            })}
          </p>
          {adding ? (
            <div className="mt-5">
              <MedEditor
                initial={blankMed()}
                submitLabel={t(lang, { en: "Save this medicine", hi: "यह दवा सहेजें" })}
                onCancel={() => setAdding(false)}
                onSave={() => setAdding(false)}
              />
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              <Button onClick={() => finish()}>{t(lang, { en: "Go to my day", hi: "मेरे दिन पर जाएँ" })}</Button>
              <Button variant="quiet" onClick={() => setAdding(true)}>
                {t(lang, { en: "Add one medicine now", hi: "अभी एक दवा जोड़ें" })}
              </Button>
              <Button variant="ghost" onClick={() => setStep(3)}>
                {t(lang, { en: "Back", hi: "पीछे" })}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
