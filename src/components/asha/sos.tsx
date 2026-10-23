import { useEffect, useRef, useState } from "react";
import { MessageSquare, Phone } from "lucide-react";
import { Geolocation } from "@capacitor/geolocation";
import { Button } from "@/components/ui/button";
import { Card, t } from "@/components/asha/bits";
import { familyAlert } from "@/lib/asha/family";
import { AshaNative, isNative } from "@/lib/asha/native";
import { digits, latinDigits, smsHref, telHref, todayCheckin } from "@/lib/asha/schedule";
import { sosText } from "@/lib/asha/speech";
import { useAsha } from "@/lib/asha/store";
import { speak } from "@/lib/asha/voice";
import { useSosNow } from "@/components/asha/voice-command";
import type { Contact } from "@/lib/asha/types";

const HOLD_MS = 1800;

async function whereAmI(): Promise<string> {
  try {
    const pos = await Promise.race([
      Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 7000, maximumAge: 120000 }),
      new Promise<null>((r) => setTimeout(() => r(null), 8000)),
    ]);
    if (!pos) return "";
    const { latitude, longitude } = pos.coords;
    return `https://maps.google.com/?q=${latitude.toFixed(5)},${longitude.toFixed(5)}`;
  } catch {
    return "";
  }
}

async function callNumber(number: string) {
  if (isNative) {
    try {
      await AshaNative.call({ number: latinDigits(number) });
      return;
    } catch {
      /* fall back to link */
    }
  }
  window.location.href = telHref(number);
}

export function SosScreen() {
  const lang = useAsha((s) => s.lang);
  const voiceLang = useAsha((s) => s.voiceLang);
  const name = useAsha((s) => s.name);
  const contacts = useAsha((s) => s.contacts);
  const emergency = useAsha((s) => s.emergencyNumber);
  const autoSms = useAsha((s) => s.sosAutoSms);
  const checkins = useAsha((s) => s.checkins);
  const openSettings = useAsha((s) => s.openSettings);
  const tight = todayCheckin(checkins)?.chestOk === false;
  const people = contacts.filter((c) => digits(c.phone).length >= 3);
  const hasEmergency = digits(emergency).length >= 3;
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [mapLink, setMapLink] = useState("");
  const holdTimer = useRef<number | undefined>(undefined);
  const start = useRef(0);

  useEffect(() => () => window.clearInterval(holdTimer.current), []);

  // she heard "I'm not well" (or "call Riya"): no button to find or hold, the call starts now
  const sosNow = useSosNow((q) => q.pending);
  useEffect(() => {
    if (!sosNow || running) return;
    const { who, clear } = useSosNow.getState();
    clear();
    void runHelp(contacts.find((c) => c.id === who));
  }, [sosNow]);

  const log = (line: string) => setSteps((s) => [...s, line]);

  async function runHelp(person?: Contact) {
    setRunning(true);
    setSteps([]);
    const first = person?.phone || (hasEmergency ? emergency : people[0]?.phone);
    const calling = person?.name || first || "";
    void speak(
      voiceLang === "hi"
        ? `मैं यहीं हूँ. ${calling ? `${calling} को फ़ोन कर रही हूँ.` : "आपके अपनों को बुला रही हूँ."} जहाँ हैं वहीं रहिए.`
        : `I'm right here. ${calling ? `I'm calling ${calling} now.` : "I'm getting your people now."} Stay where you are.`,
      voiceLang,
      "device",
    );
    log(t(lang, { en: "Finding where you are…", hi: "आपकी जगह ढूँढ रही हूँ…" }));
    // the call must not wait long for a location: a few seconds, then go without it
    const link = await Promise.race([
      whereAmI(),
      new Promise<string>((r) => setTimeout(() => r(""), 3000)),
    ]);
    setMapLink(link);
    log(link ? t(lang, { en: "Location found.", hi: "जगह मिल गई." }) : t(lang, { en: "Location not found. Sending without it.", hi: "जगह नहीं मिली. उसके बिना भेज रही हूँ." }));
    // family who use the Asha app get an urgent alert first (free, instant)
    const pushed = await familyAlert("sos", { where: link });
    if (pushed > 0) log(lang === "hi" ? `परिवार ऐप पर ${pushed} लोगों को सूचना गई.` : `Alert sent to ${pushed} family phone${pushed > 1 ? "s" : ""} in Asha.`);
    const text = sosText(lang, name, link);
    const numbers = people.map((p) => latinDigits(p.phone));

    if (numbers.length && isNative && autoSms) {
      try {
        const { sent } = await AshaNative.sendSms({ numbers, text });
        log(
          lang === "hi"
            ? `${sent} लोगों को संदेश भेजा.`
            : `Message sent to ${sent} ${sent === 1 ? "person" : "people"}.`,
        );
      } catch {
        log(t(lang, { en: "Could not send messages by itself. Use the Message buttons below.", hi: "खुद संदेश नहीं भेज पाई. नीचे संदेश बटन दबाएँ." }));
      }
    } else if (numbers.length) {
      log(t(lang, { en: "Press Message under each person to send your location.", hi: "जगह भेजने के लिए हर व्यक्ति के नीचे संदेश दबाएँ." }));
    }

    if (first) {
      log(lang === "hi" ? `कॉल लगा रही हूँ: ${first}` : `Calling ${first}…`);
      await callNumber(first);
    } else {
      log(t(lang, { en: "No number saved. Add one in Settings.", hi: "कोई नंबर नहीं. सेटिंग में जोड़ें." }));
    }
    setRunning(false);
  }

  function beginHold() {
    if (running) return;
    start.current = Date.now();
    window.clearInterval(holdTimer.current);
    holdTimer.current = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - start.current) / HOLD_MS);
      setProgress(p);
      if (p >= 1) {
        window.clearInterval(holdTimer.current);
        setProgress(0);
        if (navigator.vibrate) navigator.vibrate(200);
        void runHelp();
      }
    }, 40);
  }
  function endHold() {
    window.clearInterval(holdTimer.current);
    setProgress(0);
  }

  const R = 92;
  const C = 2 * Math.PI * R;

  return (
    <div className="py-5">
      <h1 className="display text-4xl text-sos">{t(lang, { en: "Help", hi: "मदद" })}</h1>
      {tight ? (
        <Card className="mt-4 border-sos bg-sos-soft">
          <p className="text-lg font-bold">
            {t(lang, {
              en: "Chest tightness was marked today. Call now. Do not wait to see if it passes.",
              hi: "आज सीने की जकड़न चिह्नित है. अभी कॉल करें. गुज़र जाने का इंतज़ार न करें.",
            })}
          </p>
        </Card>
      ) : null}

      <div className="mt-6 flex flex-col items-center">
        <button
          type="button"
          onPointerDown={beginHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onPointerCancel={endHold}
          onContextMenu={(e) => e.preventDefault()}
          disabled={running}
          aria-label={t(lang, { en: "Hold for help", hi: "मदद के लिए दबाकर रखें" })}
          className="relative flex size-56 touch-none select-none items-center justify-center rounded-full bg-sos text-paper shadow-lg active:scale-[0.98] disabled:opacity-70"
        >
          <svg viewBox="0 0 200 200" className="absolute inset-0 size-full -rotate-90" aria-hidden>
            <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="10" />
            <circle
              className="hold-fill"
              cx="100"
              cy="100"
              r={R}
              fill="none"
              stroke="#fffdf8"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - progress)}
            />
          </svg>
          <span className="relative text-center">
            <span className="block text-4xl font-bold">SOS</span>
            <span className="mt-1 block text-lg">{running ? t(lang, { en: "Working…", hi: "हो रहा है…" }) : t(lang, { en: "Hold 2 seconds", hi: "2 सेकंड दबाएँ" })}</span>
          </span>
        </button>
        <p className="mt-4 text-center text-lg">
          {t(lang, {
            en: isNative && autoSms
              ? "Asha texts your loved ones where you are, then calls."
              : "Asha finds where you are, then calls. Messages go with one more press.",
            hi: isNative && autoSms
              ? "आशा आपके अपनों को आपकी जगह भेजती है, फिर कॉल करती है."
              : "आशा आपकी जगह ढूँढती है, फिर कॉल करती है. संदेश एक और बटन से जाते हैं.",
          })}
        </p>
      </div>

      {steps.length ? (
        <Card className="mt-5">
          <ul className="space-y-1 text-lg">
            {steps.map((s, i) => (
              <li key={`${i}-${s}`}>• {s}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="mt-6">
        {hasEmergency ? (
          <button
            type="button"
            onClick={() => void callNumber(emergency)}
            className="inline-flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl border-2 border-sos bg-paper px-5 text-xl font-bold text-sos"
          >
            <Phone className="size-6" aria-hidden />
            {t(lang, { en: "Call emergency", hi: "इमरजेंसी कॉल" })} {emergency}
          </button>
        ) : (
          <Card>
            <p className="text-lg">
              {t(lang, {
                en: "No emergency number yet. In India, 112 reaches police, fire and ambulance. 108 is ambulance in most states.",
                hi: "अभी इमरजेंसी नंबर नहीं. भारत में 112 पर पुलिस, फ़ायर और एम्बुलेंस. ज़्यादातर राज्यों में 108 एम्बुलेंस है.",
              })}
            </p>
          </Card>
        )}
      </div>

      <h2 className="mt-6 text-2xl font-bold">{t(lang, { en: "Loved ones", hi: "अपने लोग" })}</h2>
      {people.length === 0 ? (
        <p className="mt-2 text-lg text-quiet">{t(lang, { en: "No phone numbers saved yet.", hi: "अभी कोई फ़ोन नंबर सहेजा नहीं." })}</p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {people.map((person) => (
            <Card key={person.id}>
              <p className="text-2xl font-bold">{person.name}</p>
              <p className="text-base text-quiet">
                {person.relation} · {person.phone}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => void callNumber(person.phone)}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-sage px-3 text-lg font-bold text-paper"
                >
                  <Phone className="size-5" aria-hidden />
                  {t(lang, { en: "Call", hi: "कॉल" })}
                </button>
                <a
                  href={smsHref(person.phone, sosText(lang, name, mapLink))}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-line bg-paper px-3 text-lg font-bold text-ink"
                >
                  <MessageSquare className="size-5" aria-hidden />
                  {t(lang, { en: "Message", hi: "संदेश" })}
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
      <div className="mt-5">
        <Button variant="quiet" onClick={() => openSettings()}>
          {t(lang, { en: "Add or change numbers", hi: "नंबर जोड़ें या बदलें" })}
        </Button>
      </div>
    </div>
  );
}
