import { useEffect, useState } from "react";
import { useBack } from "@/lib/asha/back";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Choice, FieldLabel, LangSwitch, SpeakField, t } from "@/components/asha/bits";
import { FairyScene } from "@/components/asha/fairy";
import { ago, CustomComposer, Feed, HeartButton, PresetPicker, VoiceNote, sendError } from "@/components/asha/family-parts";
import { FamilyMedPhotos } from "@/components/asha/ideas/family-med-photos";
import { cn } from "@/lib/cn";
import {
  forgetMe,
  joinCircle,
  leaveCircle,
  markHeard,
  pullInbox,
  refreshState,
  testPush,
  textOf,
  unreadOf,
  useFamily,
} from "@/lib/asha/family";
import { isNative } from "@/lib/asha/native";
import { useAsha } from "@/lib/asha/store";
import { speak } from "@/lib/asha/voice";
import { GROUPS_TO_ELDER, TO_ELDER } from "../../../supabase/functions/family/presets";
import { latinDigits } from "@/lib/asha/schedule";

/** The whole app for a son / daughter / husband: Maa's updates and sending love. */
export function FamilyHome() {
  const lang = useAsha((s) => s.lang);
  const circles = useFamily((s) => s.circles);
  const [settings, setSettings] = useState(false);
  const [loading, setLoading] = useState(!circles.length);
  const unchoose = useAsha((s) => s.unchooseRole);
  // back key: out of settings first; before joining anyone, back to "who will use this phone?"
  useBack(() => {
    if (settings) setSettings(false);
    else if (!circles.length) unchoose();
    else return false;
    return true;
  });

  useEffect(() => {
    void refreshState().then(() => {
      setLoading(false);
      void pullInbox();
    });
    const id = window.setInterval(() => void pullInbox(), 45000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="py-5">
      <div className="flex justify-end">
        <button
          type="button"
          aria-label={t(lang, { en: "Settings", hi: "सेटिंग" })}
          onClick={() => setSettings((v) => !v)}
          className={cn("inline-flex size-12 items-center justify-center rounded-full border border-line", settings ? "bg-sage text-paper" : "bg-paper")}
        >
          <Settings className="size-5" aria-hidden />
        </button>
      </div>
      {settings ? (
        <FamilySettings onClose={() => setSettings(false)} />
      ) : loading ? (
        <p className="py-10 text-center text-lg text-quiet">{t(lang, { en: "Opening…", hi: "खुल रहा है…" })}</p>
      ) : circles.length ? (
        <Joined />
      ) : (
        <Join />
      )}
    </div>
  );
}

const RELATIONS = [
  { en: "Son", hi: "बेटा" },
  { en: "Daughter", hi: "बेटी" },
  { en: "Husband", hi: "पति" },
  { en: "Wife", hi: "पत्नी" },
  { en: "Grandchild", hi: "पोता/पोती" },
  { en: "Friend", hi: "दोस्त" },
];

function Join() {
  const lang = useAsha((s) => s.lang);
  const unchoose = useAsha((s) => s.unchooseRole);
  const myName = useAsha((s) => s.name);
  const setName = useAsha((s) => s.setName);
  const [code, setCode] = useState("");
  const [relation, setRelation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div>
      <div className="flex items-center gap-4">
        <FairyScene news={false} mood="happy" size="md" />
        <div>
          <h1 className="display text-4xl leading-tight">
            {t(lang, { en: "Join your family", hi: "परिवार से जुड़ें" })}
          </h1>
        </div>
      </div>
      {/* where the code comes from, step by step: the person cared for makes it on their own phone */}
      <ol className="mt-4 flex flex-col gap-2 rounded-2xl bg-paper p-4 text-lg">
        <li>
          <b>1.</b>{" "}
          {t(lang, {
            en: "On their phone (Maa, Papa…), open Asha and go to the Family tab.",
            hi: "उनके फ़ोन पर (माँ, पापा…) आशा खोलें और परिवार टैब पर जाएँ.",
          })}
        </li>
        <li>
          <b>2.</b>{" "}
          {t(lang, {
            en: "Press “Make an invite code”. A 6-digit code appears.",
            hi: "“बुलाने का कोड बनाएँ” दबाएँ. 6 अंकों का कोड आएगा.",
          })}
        </li>
        <li>
          <b>3.</b>{" "}
          {t(lang, {
            en: "Type that code below. It works for 2 days.",
            hi: "वह कोड नीचे लिखें. यह 2 दिन चलता है.",
          })}
        </li>
      </ol>
      <p className="mt-2 text-base text-quiet">
        {t(lang, {
          en: "Once you join, you see how their day is going and can send them love notes. The fairy reads them out on their phone.",
          hi: "जुड़ने के बाद आप उनका दिन देख सकेंगे और प्यार भरे संदेश भेज सकेंगे. परी उनके फ़ोन पर पढ़कर सुनाएगी.",
        })}
      </p>
      <div className="mt-6">
        <FieldLabel>{t(lang, { en: "Invite code", hi: "कोड" })}</FieldLabel>
        <input
          className="field text-center text-3xl tracking-[0.3em] tabular-nums"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(latinDigits(e.target.value).replace(/\D/g, "").slice(0, 6))}
          placeholder="••••••"
        />
      </div>
      <div className="mt-4">
        <FieldLabel>{t(lang, { en: "Your name (they'll see this)", hi: "आपका नाम (उन्हें दिखेगा)" })}</FieldLabel>
        <SpeakField value={myName} onChange={setName} placeholder={t(lang, { en: "Rahul", hi: "राहुल" })} />
      </div>
      <div className="mt-4">
        <FieldLabel>{t(lang, { en: "You are their…", hi: "आप उनके…" })}</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          {RELATIONS.map((r) => (
            <button
              key={r.en}
              type="button"
              aria-pressed={relation === r.en}
              onClick={() => setRelation(r.en)}
              className={cn("min-h-12 rounded-2xl border text-lg font-bold", relation === r.en ? "border-sage bg-sage text-paper" : "border-line bg-paper")}
            >
              {r[lang]}
            </button>
          ))}
        </div>
      </div>
      {error ? <p className="mt-3 text-lg text-clay">{error}</p> : null}
      <div className="mt-5">
        <Button
          disabled={busy || code.length !== 6 || !myName.trim()}
          onClick={async () => {
            setBusy(true);
            setError("");
            const r = await joinCircle(code, relation, myName.trim());
            setBusy(false);
            if (!r.ok) setError(sendError(r, lang));
          }}
        >
          {busy ? t(lang, { en: "Joining…", hi: "जुड़ रहे…" }) : t(lang, { en: "Join", hi: "जुड़ें" })}
        </Button>
      </div>
      {/* picked "I'm family" by mistake */}
      <div className="mt-3">
        <Button variant="ghost" onClick={unchoose}>
          {t(lang, { en: "← No, this phone is for me", hi: "← नहीं, यह फ़ोन मेरे लिए है" })}
        </Button>
      </div>
    </div>
  );
}

function Joined() {
  const lang = useAsha((s) => s.lang);
  const voiceLang = useAsha((s) => s.voiceLang);
  const rich = useAsha((s) => s.richVoice);
  const myName = useAsha((s) => s.name);
  const circles = useFamily((s) => s.circles);
  const messages = useFamily((s) => s.messages);
  const heardLocal = useFamily((s) => s.heardLocal);
  const [active, setActive] = useState(circles[0]?.id ?? "");
  const circle = circles.find((c) => c.id === active) ?? circles[0];
  const mine = messages.filter((m) => m.circleId === circle.id);
  const unread = unreadOf({ messages: mine, heardLocal });
  const label = circle.label || "Maa";
  const alerts = unread.filter((m) => m.kind === "alert");

  return (
    <div>
      {circles.length > 1 ? (
        <div className="mb-3 flex gap-2 overflow-x-auto">
          {circles.map((c) => (
            <button key={c.id} type="button" onClick={() => setActive(c.id)} className={cn("min-h-11 shrink-0 rounded-full border px-4 font-bold", c.id === circle.id ? "border-sage bg-sage text-paper" : "border-line bg-paper")}>
              {c.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex items-center gap-4">
        <FairyScene
          news={unread.length > 0}
          size="lg"
          label={t(lang, { en: "Tap the fairy to hear updates", hi: "अपडेट सुनने के लिए परी को छुएँ" })}
          onTap={() => {
            if (!unread.length) return;
            void speak([...unread].reverse().map((m) => textOf(m, voiceLang)).join(" ... "), voiceLang, rich ? "warm" : "device");
            void markHeard(unread.map((m) => m.id));
          }}
        />
        <div className="min-w-0">
          <h1 className="display text-4xl leading-tight">{label}</h1>
          <p className="mt-1 text-base text-quiet">
            {circle.elderLastSeen
              ? lang === "hi"
                ? `आशा आखिरी बार खोली: ${ago(circle.elderLastSeen, lang)}`
                : `Last opened Asha ${ago(circle.elderLastSeen, lang)}`
              : ""}
          </p>
        </div>
      </div>

      {alerts.length ? (
        <Card className="mt-4 border-sos bg-sos-soft">
          <p className="text-xl font-bold">{textOf(alerts[0], lang)}</p>
          <p className="mt-2 text-base">{t(lang, { en: "Please call them now.", hi: "कृपया अभी फ़ोन करें." })}</p>
        </Card>
      ) : null}

      <div className="mt-5">
        <HeartButton />
      </div>

      <h2 className="mt-6 text-2xl font-bold">{t(lang, { en: `Send ${label} some love`, hi: `${label} को प्यार भेजें` })}</h2>
      <div className="mt-3">
        <PresetPicker presets={TO_ELDER} groups={GROUPS_TO_ELDER} vars={{ from: myName || "", elder: label }} />
      </div>
      <Card className="mt-4">
        <p className="text-lg font-bold">{t(lang, { en: "In your own words", hi: "अपने शब्दों में" })}</p>
        <div className="mt-2">
          <CustomComposer />
          <VoiceNote schedule />
        </div>
      </Card>
      <FamilyMedPhotos circle={circle} />

      <h2 className="mt-8 text-2xl font-bold">{t(lang, { en: `${label}'s day`, hi: `${label} का दिन` })}</h2>
      <Feed messages={mine.slice(0, 40)} emptyText={t(lang, { en: "Updates from their day will appear here.", hi: "उनके दिन के अपडेट यहाँ दिखेंगे." })} />
    </div>
  );
}

function FamilySettings({ onClose }: { onClose: () => void }) {
  const s = useAsha();
  const lang = s.lang;
  const circles = useFamily((f) => f.circles);
  const pushToken = useFamily((f) => f.pushToken);
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  return (
    <div>
      <button type="button" className="min-h-12 text-lg font-bold text-sage" onClick={onClose}>
        {t(lang, { en: "← Back", hi: "← वापस" })}
      </button>
      <h1 className="display mt-2 text-4xl">{t(lang, { en: "Settings", hi: "सेटिंग" })}</h1>
      <div className="mt-4">
        <FieldLabel>{t(lang, { en: "Your name", hi: "आपका नाम" })}</FieldLabel>
        <SpeakField value={s.name} onChange={s.setName} />
      </div>
      <div className="mt-4">
        <FieldLabel>{t(lang, { en: "Language", hi: "भाषा" })}</FieldLabel>
        <LangSwitch value={s.lang} onChange={(l) => s.setBothLangs(l)} />
      </div>
      <div className="mt-4">
        <FieldLabel>{t(lang, { en: "Quiet hours (no pings, except urgent)", hi: "शांत समय (कोई सूचना नहीं, ज़रूरी छोड़कर)" })}</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          <input type="time" className="field" value={s.sleepTime} onChange={(e) => e.target.value && s.setPrefs({ sleepTime: e.target.value })} />
          <input type="time" className="field" value={s.wakeTime} onChange={(e) => e.target.value && s.setPrefs({ wakeTime: e.target.value })} />
        </div>
      </div>
      <div className="mt-4">
        <Choice
          selected={s.pro}
          onClick={() => s.setPrefs({ pro: !s.pro })}
          title={t(lang, { en: s.pro ? "Pro is on" : "Turn on Pro (free in this test copy)", hi: s.pro ? "प्रो चालू है" : "प्रो चालू करें (इस टेस्ट कॉपी में मुफ़्त)" })}
          detail={t(lang, { en: "Your own words and voice notes.", hi: "अपने शब्द और आवाज़ वाले संदेश." })}
        />
      </div>
      {isNative ? (
        <div className="mt-4">
          <Button
            variant="quiet"
            onClick={async () => {
              const r = await testPush();
              setNote(
                r.ok
                  ? t(lang, { en: "Sent! A card should pop up in a few seconds.", hi: "भेज दिया! कुछ सेकंड में कार्ड दिखेगा." })
                  : pushToken
                    ? t(lang, { en: "Couldn't deliver. Check notifications are allowed for Asha.", hi: "नहीं पहुँचा. आशा के लिए सूचना की अनुमति देखें." })
                    : t(lang, { en: "This phone has no instant delivery. Messages arrive every 15 minutes instead.", hi: "इस फ़ोन पर तुरंत संदेश नहीं. हर 15 मिनट में आएँगे." }),
              );
            }}
          >
            {t(lang, { en: "Send me a test message", hi: "मुझे एक जाँच संदेश भेजें" })}
          </Button>
          {note ? <p className="mt-2 text-base text-quiet">{note}</p> : null}
        </div>
      ) : null}
      <h2 className="mt-6 text-2xl font-bold">{t(lang, { en: "Circles", hi: "परिवार" })}</h2>
      {circles.map((c) => (
        <Card key={c.id} className="mt-2">
          <p className="text-xl font-bold">{c.label}</p>
          {confirm === c.id ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="sos" onClick={() => void leaveCircle(c.id).then(() => setConfirm(null))}>
                {t(lang, { en: "Yes, leave", hi: "हाँ, छोड़ें" })}
              </Button>
              <Button variant="quiet" onClick={() => setConfirm(null)}>
                {t(lang, { en: "Stay", hi: "रहने दें" })}
              </Button>
            </div>
          ) : (
            <button type="button" className="mt-2 min-h-12 font-bold text-clay" onClick={() => setConfirm(c.id)}>
              {t(lang, { en: "Leave this circle", hi: "यह परिवार छोड़ें" })}
            </button>
          )}
        </Card>
      ))}
      <div className="mt-6 flex flex-col gap-2">
        <Button variant="ghost" onClick={() => s.chooseRole("elder")}>
          {t(lang, { en: "Use this phone for my own care instead", hi: "यह फ़ोन मेरी अपनी देखभाल के लिए है" })}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            void forgetMe();
            onClose();
          }}
        >
          {t(lang, { en: "Delete my family data from the server", hi: "सर्वर से मेरा परिवार डेटा मिटाएँ" })}
        </Button>
      </div>
    </div>
  );
}
