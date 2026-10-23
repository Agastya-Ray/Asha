import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, Choice, FieldLabel, LangSwitch, SpeakField, t } from "@/components/asha/bits";
import { useQuietSheet } from "@/components/asha/quiet";
import { ReminderHealth } from "@/components/asha/reminder-health";
import { VoicePicker } from "@/components/asha/voice-picker";
import { CONDITIONS } from "@/lib/asha/plans";
import { AshaNative, isNative } from "@/lib/asha/native";
import { forgetMe, pushNativeConfig, testPush, useFamily } from "@/lib/asha/family";
import { newId, useAsha } from "@/lib/asha/store";
import type { Lang, TextSize } from "@/lib/asha/types";

export function SettingsScreen() {
  const s = useAsha();
  const lang = s.lang;
  const [confirm, setConfirm] = useState(false);
  const [note, setNote] = useState("");
  const [phoneDirect, setPhoneDirect] = useState(false);

  useEffect(() => {
    if (!isNative) return;
    void AshaNative.status()
      .then((st) => setPhoneDirect(st.phone))
      .catch(() => undefined);
  }, []);

  async function allowWebNotes() {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setNote(result === "granted" ? t(lang, { en: "Allowed.", hi: "अनुमति मिल गई." }) : t(lang, { en: "Not allowed.", hi: "अनुमति नहीं." }));
  }

  return (
    <div className="py-5">
      <button type="button" className="min-h-12 text-lg font-bold text-sage" onClick={() => s.closeSettings()}>
        {t(lang, { en: "← Back to the day", hi: "← दिन पर वापस" })}
      </button>
      <h1 className="display mt-2 text-4xl">{t(lang, { en: "Settings", hi: "सेटिंग" })}</h1>
      <p className="mt-2 text-lg text-quiet">
        {t(lang, {
          en: "Your list stays on this phone. Only a prescription photo or a Talk message is sent to be read, and it is not kept.",
          hi: "आपकी सूची इसी फ़ोन पर रहती है. सिर्फ पर्ची की फ़ोटो या बात वाला संदेश पढ़ने के लिए भेजा जाता है, रखा नहीं जाता.",
        })}
      </p>

      <ReminderHealth always />

      <div className="mt-5">
        <FieldLabel>{t(lang, { en: "Name", hi: "नाम" })}</FieldLabel>
        <SpeakField value={s.name} onChange={s.setName} />
      </div>

      <h2 className="mt-6 text-2xl font-bold">{t(lang, { en: "Language", hi: "भाषा" })}</h2>
      <div className="mt-3">
        <FieldLabel>{t(lang, { en: "Words on the screen", hi: "स्क्रीन के शब्द" })}</FieldLabel>
        <LangSwitch value={s.lang} onChange={(l: Lang) => s.setLang(l)} />
      </div>
      <div className="mt-3">
        <FieldLabel>{t(lang, { en: "Asha speaks and listens in", hi: "आशा बोलती और सुनती है" })}</FieldLabel>
        <LangSwitch value={s.voiceLang} onChange={(l: Lang) => s.setVoiceLang(l)} />
        <p className="mt-2 text-base text-quiet">
          {t(lang, {
            en: "These can be different. For example, she speaks Hindi while the screen stays in English.",
            hi: "ये अलग हो सकते हैं. जैसे, वह हिन्दी बोले और स्क्रीन अंग्रेज़ी में रहे.",
          })}
        </p>
      </div>

      <h2 className="mt-6 text-2xl font-bold">{t(lang, { en: "Text size", hi: "अक्षरों का आकार" })}</h2>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {(["normal", "large", "xl"] as TextSize[]).map((size) => (
          <button
            key={size}
            type="button"
            aria-pressed={s.textSize === size}
            onClick={() => s.setTextSize(size)}
            className={`min-h-14 rounded-2xl border font-bold ${s.textSize === size ? "border-sage bg-sage text-paper" : "border-line bg-paper"} ${size === "normal" ? "text-base" : size === "large" ? "text-lg" : "text-xl"}`}
          >
            {size === "normal" ? "A" : size === "large" ? "A+" : "A++"}
          </button>
        ))}
      </div>

      <h2 className="mt-6 text-2xl font-bold">{t(lang, { en: "Health", hi: "सेहत" })}</h2>
      <div className="mt-3 flex flex-col gap-2">
        {CONDITIONS.map((c) => (
          <Choice key={c.id} selected={s.conditions.includes(c.id)} onClick={() => s.toggleCondition(c.id)} title={t(lang, c.title)} detail={t(lang, c.blurb)} />
        ))}
      </div>

      <h2 className="mt-6 text-2xl font-bold">{t(lang, { en: "Voice", hi: "आवाज़" })}</h2>
      <VoicePicker />
      <div className="mt-3 flex flex-col gap-2">
        <Button variant="quiet" onClick={() => useQuietSheet.getState().show()}>
          {t(lang, { en: "🤫 Quiet for a while (meeting, event)", hi: "🤫 थोड़ी देर चुप (मीटिंग, कार्यक्रम)" })}
        </Button>
        <Toggle on={s.voiceOn} lang={lang} label={t(lang, { en: "Speak reminders and greetings", hi: "याद और अभिवादन बोलें" })} onClick={() => s.setPrefs({ voiceOn: !s.voiceOn })} />
        <Toggle on={s.richVoice} lang={lang} label={t(lang, { en: "Use the warmer voice when online", hi: "ऑनलाइन होने पर ज़्यादा प्यारी आवाज़" })} onClick={() => s.setPrefs({ richVoice: !s.richVoice })} />
        <Toggle on={s.fairySounds} lang={lang} label={t(lang, { en: "Little fairy sounds (quiet at night)", hi: "परी की छोटी आवाज़ें (रात में चुप)" })} onClick={() => s.setPrefs({ fairySounds: !s.fairySounds })} />
        <Toggle on={s.speakOnOpen} lang={lang} label={t(lang, { en: "Greet me when I open Asha", hi: "आशा खुलते ही अभिवादन" })} onClick={() => s.setPrefs({ speakOnOpen: !s.speakOnOpen })} />
        <Toggle on={s.dailyGreetings} lang={lang} label={t(lang, { en: "Good morning and good night", hi: "सुप्रभात और शुभ रात्रि" })} onClick={() => s.setPrefs({ dailyGreetings: !s.dailyGreetings })} />
        {s.dailyGreetings ? (
          <div className="grid grid-cols-2 gap-2">
            <label className="text-base font-bold">
              {t(lang, { en: "Wake up", hi: "जागना" })}
              <input type="time" className="field mt-1" value={s.wakeTime} onChange={(e) => e.target.value && s.setPrefs({ wakeTime: e.target.value })} />
            </label>
            <label className="text-base font-bold">
              {t(lang, { en: "Sleep", hi: "सोना" })}
              <input type="time" className="field mt-1" value={s.sleepTime} onChange={(e) => e.target.value && s.setPrefs({ sleepTime: e.target.value })} />
            </label>
          </div>
        ) : null}
        {!isNative ? (
          <Toggle on={s.keepAwake} lang={lang} label={t(lang, { en: "Keep the screen awake. Uses more battery.", hi: "स्क्रीन जगाए रखें. बैटरी ज़्यादा लगेगी." })} onClick={() => s.setPrefs({ keepAwake: !s.keepAwake })} />
        ) : null}
        <Toggle on={s.pro} lang={lang} label={t(lang, { en: "Pro on this phone — talk freely", hi: "इस फ़ोन पर प्रो — खुलकर बात" })} onClick={() => s.setPrefs({ pro: !s.pro })} />
      </div>
      {!isNative ? (
        <div className="mt-3">
          <Button variant="quiet" onClick={() => void allowWebNotes()}>
            {t(lang, { en: "Allow a quiet notice", hi: "शांत सूचना की अनुमति" })}
          </Button>
        </div>
      ) : null}

      <h2 className="mt-6 text-2xl font-bold">{t(lang, { en: "Help and family", hi: "मदद और परिवार" })}</h2>
      <div className="mt-3 flex flex-col gap-2">
        {isNative ? (
          <Toggle
            on={phoneDirect}
            lang={lang}
            label={t(lang, { en: "Help calls straight away (no extra tap)", hi: "मदद सीधे कॉल लगाए (एक और टैप नहीं)" })}
            onClick={async () => {
              if (phoneDirect) {
                setNote(t(lang, { en: "To turn this off, remove 'Phone' permission in phone settings.", hi: "बंद करने के लिए फ़ोन सेटिंग में 'Phone' अनुमति हटाएँ." }));
                return;
              }
              const r = await AshaNative.requestPhone().catch(() => ({ ok: false }));
              setPhoneDirect(r.ok);
            }}
          />
        ) : null}
        <p className="text-base text-quiet">
          {t(lang, {
            en: "Messages are normal SMS from this phone. Your phone plan's SMS rates apply.",
            hi: "संदेश इसी फ़ोन से साधारण एसएमएस हैं. आपके प्लान के एसएमएस शुल्क लगते हैं.",
          })}
        </p>
      </div>
      {note ? <p className="mt-2 text-base text-clay">{note}</p> : null}

      <h2 className="mt-6 text-2xl font-bold">{t(lang, { en: "Emergency number", hi: "इमरजेंसी नंबर" })}</h2>
      <input className="field mt-3" inputMode="tel" value={s.emergencyNumber} onChange={(e) => s.setEmergency(e.target.value)} placeholder="112" />

      <h2 className="mt-6 text-2xl font-bold">{t(lang, { en: "Loved ones", hi: "अपने लोग" })}</h2>
      <div className="mt-3 flex flex-col gap-3">
        {s.contacts.map((person) => (
          <Card key={person.id}>
            <FieldLabel>{t(lang, { en: "Name", hi: "नाम" })}</FieldLabel>
            <SpeakField value={person.name} onChange={(v) => s.upsertContact({ ...person, name: v })} />
            <div className="mt-3">
              <FieldLabel>{t(lang, { en: "Who they are", hi: "रिश्ता" })}</FieldLabel>
              <SpeakField value={person.relation} onChange={(v) => s.upsertContact({ ...person, relation: v })} />
            </div>
            <div className="mt-3">
              <FieldLabel>{t(lang, { en: "Phone", hi: "फ़ोन" })}</FieldLabel>
              <input className="field" inputMode="tel" value={person.phone} onChange={(e) => s.upsertContact({ ...person, phone: e.target.value })} />
            </div>
            <button type="button" className="mt-3 min-h-12 font-bold text-clay" onClick={() => s.removeContact(person.id)}>
              {t(lang, { en: "Remove this person", hi: "इस व्यक्ति को हटाएँ" })}
            </button>
          </Card>
        ))}
      </div>
      <div className="mt-3">
        <Button variant="quiet" onClick={() => s.upsertContact({ id: newId(), name: "", relation: "", phone: "" })}>
          {t(lang, { en: "Add a person", hi: "व्यक्ति जोड़ें" })}
        </Button>
      </div>

      <FairySettings />

      <h2 className="mt-8 text-2xl font-bold">{t(lang, { en: "About Asha", hi: "आशा के बारे में" })}</h2>
      <div className="mt-3">
        <Button variant="quiet" onClick={() => s.replayIntro()}>
          {t(lang, { en: "Meet Asha again", hi: "आशा से फिर मिलें" })}
        </Button>
      </div>

      <h2 className="mt-8 text-2xl font-bold">{t(lang, { en: "Erase this phone", hi: "इस फ़ोन को मिटाएँ" })}</h2>
      <p className="mt-2 text-lg text-quiet">
        {t(lang, { en: "This removes medicines, numbers, and the chart from this phone only.", hi: "यह दवा, नंबर और चार्ट सिर्फ इस फ़ोन से हटाता है." })}
      </p>
      {confirm ? (
        <div className="mt-3 flex flex-col gap-2">
          <Button variant="sos" onClick={() => s.eraseAll()}>
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
      className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-2 text-left text-lg"
    >
      <span>{label}</span>
      <span className={`shrink-0 rounded-full px-3 py-1 text-base font-bold ${on ? "bg-sage text-paper" : "bg-linen text-quiet"}`}>
        {on ? (lang === "hi" ? "चालू" : "On") : lang === "hi" ? "बंद" : "Off"}
      </span>
    </button>
  );
}

/** Family Circle and the fairy on the home screen. */
function FairySettings() {
  const s = useAsha();
  const lang = s.lang;
  const bubble = useFamily((f) => f.bubble);
  const circles = useFamily((f) => f.circles);
  const pushToken = useFamily((f) => f.pushToken);
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(false);

  async function toggleBubble() {
    if (bubble) {
      await AshaNative.setBubble({ on: false }).catch(() => undefined);
      useFamily.setState({ bubble: false });
      return;
    }
    const can = await AshaNative.canDrawOverlays().catch(() => ({ ok: false }));
    if (!can.ok) {
      setNote(
        t(lang, {
          en: "A settings page opens. Find Asha and turn on 'Display over other apps', then come back and press this again.",
          hi: "एक सेटिंग पन्ना खुलेगा. आशा ढूँढकर 'Display over other apps' चालू करें, फिर वापस आकर यह बटन दोबारा दबाएँ.",
        }),
      );
      await AshaNative.openOverlaySettings().catch(() => undefined);
      return;
    }
    const r = await AshaNative.setBubble({ on: true }).catch(() => ({ ok: false }));
    useFamily.setState({ bubble: r.ok });
    void pushNativeConfig();
  }

  return (
    <>
      <h2 className="mt-8 text-2xl font-bold">{t(lang, { en: "Family and the fairy", hi: "परिवार और परी" })}</h2>
      <div className="mt-3 flex flex-col gap-2">
        <Button variant="quiet" onClick={() => s.setTab("family")}>
          {circles.length ? t(lang, { en: "Open my family circle", hi: "मेरा परिवार खोलें" }) : t(lang, { en: "Set up my family circle", hi: "मेरा परिवार बनाएँ" })}
        </Button>
        {isNative ? (
          <>
            <Toggle on={bubble} lang={lang} label={t(lang, { en: "Floating fairy over other apps", hi: "दूसरे ऐप्स के ऊपर तैरती परी" })} onClick={() => void toggleBubble()} />
            <Card>
              <p className="text-lg font-bold">{t(lang, { en: "Put the fairy on your home screen", hi: "परी को होम स्क्रीन पर रखें" })}</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-base">
                <li>{t(lang, { en: "Press and hold an empty spot on the home screen.", hi: "होम स्क्रीन की खाली जगह को दबाकर रखें." })}</li>
                <li>{t(lang, { en: "Tap Widgets.", hi: "Widgets दबाएँ." })}</li>
                <li>{t(lang, { en: "Find Asha, then drag the fairy onto the screen.", hi: "आशा ढूँढें, फिर परी को स्क्रीन पर खींचें." })}</li>
              </ol>
            </Card>
            {circles.length ? (
              <Button
                variant="ghost"
                onClick={async () => {
                  const r = await testPush();
                  setNote(
                    r.ok
                      ? t(lang, { en: "Sent! The fairy should speak in a few seconds.", hi: "भेज दिया! कुछ सेकंड में परी बोलेगी." })
                      : pushToken
                        ? t(lang, { en: "Couldn't deliver. Check notifications are allowed.", hi: "नहीं पहुँचा. सूचना की अनुमति देखें." })
                        : t(lang, { en: "No instant delivery on this phone. Messages arrive every 15 minutes.", hi: "इस फ़ोन पर तुरंत संदेश नहीं. हर 15 मिनट में आएँगे." }),
                  );
                }}
              >
                {t(lang, { en: "Test: fairy brings me a message", hi: "जाँच: परी मुझे संदेश लाए" })}
              </Button>
            ) : null}
          </>
        ) : null}
        {note ? <p className="text-base text-quiet">{note}</p> : null}
        <Button variant="ghost" onClick={() => s.chooseRole("family")}>
          {t(lang, { en: "This phone belongs to a family member instead", hi: "यह फ़ोन परिवार के किसी सदस्य का है" })}
        </Button>
        {circles.length ? (
          confirm ? (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="sos"
                onClick={() => {
                  void forgetMe();
                  setConfirm(false);
                }}
              >
                {t(lang, { en: "Yes, delete", hi: "हाँ, मिटाएँ" })}
              </Button>
              <Button variant="quiet" onClick={() => setConfirm(false)}>
                {t(lang, { en: "Keep", hi: "रहने दें" })}
              </Button>
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setConfirm(true)}>
              {t(lang, { en: "Delete my family circle and its messages", hi: "मेरा परिवार और उसके संदेश मिटाएँ" })}
            </Button>
          )
        ) : null}
      </div>
    </>
  );
}
