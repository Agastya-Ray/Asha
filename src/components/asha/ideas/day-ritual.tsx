import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, t, useNow } from "@/components/asha/bits";
import { Pixie } from "@/components/asha/pixie";
import { morningRitual, nightRitual, todaysWeather, type Weather } from "@/lib/asha/ritual";
import { useAsha } from "@/lib/asha/store";
import { minutesNow, todayKey, toMin } from "@/lib/asha/time";
import { speak } from "@/lib/asha/voice";

const SEEN = "asha.ritual.v1";
function seen(key: string) {
  try {
    return (JSON.parse(localStorage.getItem(SEEN) ?? "[]") as string[]).includes(key);
  } catch {
    return false;
  }
}
function markSeen(key: string) {
  try {
    const list = JSON.parse(localStorage.getItem(SEEN) ?? "[]") as string[];
    localStorage.setItem(SEEN, JSON.stringify([...list, key].slice(-20)));
  } catch {
    /* shows again next time */
  }
}

/** Minutes from a to b going forward round the clock (0 … 1439). */
const ahead = (a: number, b: number) => (b - a + 1440) % 1440;

/**
 * On Today: in the first three hours after waking, the fairy's morning (day, date, weather, today's plan);
 * from 90 minutes before bed, her kind recap of the day. Each shows once a day.
 */
export function DayRitual() {
  const now = useNow();
  const s = useAsha();
  const [weather, setWeather] = useState<Weather | null>(null);
  const [, bump] = useState(0);
  const m = minutesNow(now);
  const wake = toMin(s.wakeTime || "07:30");
  const sleep = toMin(s.sleepTime || "21:30");
  const part =
    ahead(wake, m) < 180
      ? "morning"
      : ahead(m, sleep) <= 90 || ahead(sleep, m) < 180
        ? "night"
        : null;
  const key = `${todayKey(now)}|${part}`;
  const show = part && !s.sample && !seen(key);

  useEffect(() => {
    if (show && part === "morning") void todaysWeather().then(setWeather);
  }, [show, part]);
  if (!show) return null;

  const lang = s.lang;
  const words =
    part === "morning" ? morningRitual(lang, s, now, weather) : nightRitual(lang, s, now);
  const say =
    part === "morning"
      ? morningRitual(s.voiceLang, s, now, weather)
      : nightRitual(s.voiceLang, s, now);
  const done = () => {
    markSeen(key);
    bump((n) => n + 1);
  };

  return (
    <Card className={part === "morning" ? "mt-5 bg-[#fff7e6]" : "mt-5 bg-[#eef0fa]"}>
      <div className="flex items-start gap-3">
        <Pixie mood={part === "morning" ? "stretch" : "tired"} className="h-28 w-24 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold uppercase tracking-wide text-[#d9506f]">
            {s.fairyName || t(lang, { en: "Your fairy", hi: "आपकी परी" })}
          </p>
          <p className="mt-1 text-lg leading-snug">{words}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="quiet" onClick={() => void speak(say, s.voiceLang, "fairy")}>
          🔊 {t(lang, { en: "Hear it", hi: "सुनें" })}
        </Button>
        <Button onClick={done}>
          {part === "morning"
            ? t(lang, { en: "Thank you!", hi: "धन्यवाद!" })
            : t(lang, { en: "Good night", hi: "शुभ रात्रि" })}
        </Button>
      </div>
    </Card>
  );
}
