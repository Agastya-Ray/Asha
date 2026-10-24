import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Choice, FieldLabel, SpeakField, t } from "@/components/asha/bits";
import { FairyGuide, guideDelay } from "@/components/asha/fairy-guide";
import type { PixieMood } from "@/components/asha/pixie";
import type { Localized } from "@/lib/asha/plans";
import { MedEditor, medSummary } from "@/components/asha/meds";
import { CONDITIONS } from "@/lib/asha/plans";
import { digits } from "@/lib/asha/schedule";
import { blankMed, newId, useAsha } from "@/lib/asha/store";
import type { Contact } from "@/lib/asha/types";

/** The four parts of setup, told like a short story: who you are, your body, your people, your medicines. */
const CHAPTER: Localized[] = [
  { en: "Getting to know you", hi: "आपसे पहचान" },
  { en: "Your body", hi: "आपका शरीर" },
  { en: "Your people", hi: "आपके अपने" },
  { en: "Your medicines", hi: "आपकी दवाइयाँ" },
];

/** What she says at each step: warm first, then the ask. */
const GUIDE = (name: string): { mood: PixieMood; line: Localized }[] => [
  {
    mood: "asking",
    line: {
      en: "Before anything else, I'd love to know you a little. What do your loved ones call you?",
      hi: "सबसे पहले, मैं आपको थोड़ा जानना चाहूँगी. आपके अपने आपको किस नाम से बुलाते हैं?",
    },
  },
  {
    mood: "thinking",
    line: {
      en: `What a lovely name${name ? `, ${name}` : ""}. Every body is a little different, and I want to look after yours just right. Do any of these sound like you? It's okay if none do.`,
      hi: `कितना प्यारा नाम है${name ? `, ${name}` : ""}. हर शरीर थोड़ा अलग होता है, और मैं आपका ठीक से ध्यान रखना चाहती हूँ. क्या इनमें से कुछ आपको है? कोई न हो तो भी ठीक है.`,
    },
  },
  {
    mood: "talk",
    line: {
      en: `I'm here to take care of you${name ? `, ${name}` : ""}, every single day. But some days are harder than others. That's why I'd love the number of someone who loves you. So if you ever feel unwell, for any reason, I can call them for you straight away. Who should that be?`,
      hi: `मैं हर दिन आपका ख्याल रखने के लिए हूँ${name ? `, ${name}` : ""}. पर कुछ दिन बाकी दिनों से मुश्किल होते हैं. इसलिए मुझे किसी अपने का नंबर चाहिए, जो आपसे प्यार करता हो. ताकि कभी भी, किसी भी वजह से तबीयत ठीक न लगे, तो मैं उसी पल उन्हें फ़ोन कर सकूँ. वह कौन हो?`,
    },
  },
  {
    mood: "point",
    line: {
      en: "Last one. Remembering every medicine can be tiring, so let me carry that for you. Write each name the way it's printed on the strip.",
      hi: "बस आखिरी. हर दवा याद रखना थका देता है, तो यह मुझ पर छोड़ दीजिए. हर नाम वैसे ही लिखिए जैसे पत्ते पर छपा है.",
    },
  },
];

export function Onboarding() {
  const lang = useAsha((s) => s.lang);
  const step = useAsha((s) => s.setupStep);
  const name = useAsha((s) => s.name);
  const conditions = useAsha((s) => s.conditions);
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
  const meds = useAsha((s) => s.meds);

  const steps = t(lang, { en: "Step", hi: "कदम" });
  const first = name.trim();
  const guide = GUIDE(first)[step - 1];
  const after = guide ? guideDelay(lang, guide.line) : 0;

  return (
    <div className="py-6">
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5" aria-hidden>
          {[1, 2, 3, 4].map((k) => (
            <span key={k} className={`ob-dot h-2.5 rounded-full ${k === step ? "w-8 bg-sage" : k < step ? "w-2.5 bg-sage" : "w-2.5 bg-line"}`} />
          ))}
        </div>
        <p className="text-base font-bold text-sage">{t(lang, CHAPTER[step - 1] ?? CHAPTER[0])}</p>
      </div>
      <span className="sr-only">
        {steps} {step} / 4
      </span>
      {guide ? <FairyGuide mood={guide.mood} line={guide.line} /> : null}
      {/* the form waits for her to finish her sentences, then rises in */}
      <div key={step} className="ob-after" style={{ animationDelay: `${after}s` }}>
      {step === 1 && (
        <div className="mt-3">
          <div className="mt-2">
            <FieldLabel>{t(lang, { en: "Your name", hi: "आपका नाम" })}</FieldLabel>
            <SpeakField value={name} onChange={setName} placeholder={t(lang, { en: "Your first name", hi: "आपका पहला नाम" })} autoComplete="given-name" />
            <p className="mt-2 text-base text-quiet">
              {t(lang, {
                en: "A first name or a nickname is enough. Type it, or press the microphone and say it.",
                hi: "पहला नाम या घर का नाम काफ़ी है. लिखिए, या माइक दबाकर बोलिए.",
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
          <h1 className="display text-4xl">{t(lang, { en: "A little about your health", hi: "आपकी सेहत के बारे में थोड़ा" })}</h1>
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
          <h1 className="display text-4xl">{t(lang, { en: "Someone to be there for you", hi: "कोई जो आपके पास रहे" })}</h1>
          <p className="mt-3 text-lg text-quiet">
            {t(lang, {
              en: "A daughter, a son, a neighbour, a friend. Anyone who would come. Add at least one number. In India 112 reaches police, fire and ambulance.",
              hi: "बेटी, बेटा, पड़ोसी, कोई दोस्त. कोई भी जो आ सके. कम से कम एक नंबर डालें. भारत में 112 पर पुलिस, फ़ायर और एम्बुलेंस मिलती है.",
            })}
          </p>
          <div className="mt-5">
            <FieldLabel>{t(lang, { en: "Emergency number", hi: "इमरजेंसी नंबर" })}</FieldLabel>
            <input
              className="field"
              inputMode="tel"
              value={emergency}
              onChange={(e) => setEmergencyLocal(e.target.value)}
              placeholder={t(lang, { en: "For example 112", hi: "जैसे 112" })}
            />
          </div>
          {people.map((person, index) => (
            <div key={person.id} className="mt-5 rounded-3xl border border-line bg-paper p-4">
              <p className="text-base font-bold text-quiet">
                {t(lang, { en: "Loved one", hi: "अपना व्यक्ति" })} {index + 1}
              </p>
              <div className="mt-3">
                <FieldLabel>{t(lang, { en: "Name", hi: "नाम" })}</FieldLabel>
                <SpeakField
                  value={person.name}
                  onChange={(v) => setPeople((list) => list.map((p) => (p.id === person.id ? { ...p, name: v } : p)))}
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
          <h1 className="display text-4xl">{t(lang, { en: "Let me remember for you", hi: "याद मैं रखूँगी" })}</h1>
          <p className="mt-3 text-lg text-quiet">
            {t(lang, {
              en: "Add one now, or later on Meds with a photo of the prescription.",
              hi: "अभी एक जोड़ें, या बाद में दवा वाले पन्ने पर पर्ची की फ़ोटो से.",
            })}
          </p>
          {meds.length > 0 && !adding ? (
            <div className="mt-5 rounded-3xl border border-sage bg-sage-soft p-4">
              <p className="text-lg font-bold">{t(lang, { en: "Saved ✓", hi: "सहेज लिया ✓" })}</p>
              <ul className="mt-2 space-y-1 text-lg">
                {meds.map((m) => (
                  <li key={m.id}>
                    <b>{m.name}</b>: {medSummary(m, lang)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
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
                {meds.length
                  ? t(lang, { en: "Add another medicine", hi: "एक और दवा जोड़ें" })
                  : t(lang, { en: "Add one medicine now", hi: "अभी एक दवा जोड़ें" })}
              </Button>
              <Button variant="ghost" onClick={() => setStep(3)}>
                {t(lang, { en: "Back", hi: "पीछे" })}
              </Button>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
