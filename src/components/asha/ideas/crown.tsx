import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/components/asha/bits";
import { Pixie, type PixieMood } from "@/components/asha/pixie";
import { CROWNS, FLOWERS, MILESTONES, SLOTS, flowersFor, togetherToday } from "@/lib/asha/crown";
import { useAsha } from "@/lib/asha/store";
import { todayKey } from "@/lib/asha/time";
import { speak } from "@/lib/asha/voice";

function Flower({ petal, heart, fresh }: { petal: string; heart: string; fresh: boolean }) {
  return (
    <svg
      viewBox="-12 -12 24 24"
      className={`crown-flower h-full w-full overflow-visible ${fresh ? "crown-fresh" : ""}`}
      aria-hidden
    >
      <ellipse cx="7" cy="7" rx="4.2" ry="2" fill="#4caf50" transform="rotate(35 7 7)" />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse
          key={a}
          cx="0"
          cy="-5.2"
          rx="3.9"
          ry="5.4"
          fill={petal}
          stroke="#fff"
          strokeWidth="0.9"
          transform={`rotate(${a})`}
        />
      ))}
      <circle r="3.1" fill={heart} stroke="#fff" strokeWidth="0.6" />
      <circle cx="-1" cy="-1.1" r="0.9" fill="#fff" opacity="0.8" />
    </svg>
  );
}

/** The flowers she has grown, sitting on top of her crown in whatever picture she is in. */
export function CrownFlowers({ mood }: { mood: PixieMood }) {
  const days = useAsha((s) => s.growth.days);
  const seen = useAsha((s) => s.crownSeen);
  const crown = CROWNS[mood];
  const count = flowersFor(days);
  if (!crown || !count) return null;
  const rad = (crown.tilt * Math.PI) / 180;
  const size = 0.15; // of the image width
  return (
    <div className="pointer-events-none absolute inset-0" style={{ containerType: "size" }}>
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: `min(100cqw, calc(100cqh * ${crown.w} / ${crown.h}))`,
          aspectRatio: `${crown.w} / ${crown.h}`,
        }}
      >
        {FLOWERS.slice(0, count).map((f, i) => {
          const s = SLOTS[i];
          // along the crown's curve: the middle sits a little higher
          const dx = s * crown.span * crown.w;
          const dy = -(1 - s * s) * 0.025 * crown.h;
          const x = crown.x * crown.w + dx * Math.cos(rad) - dy * Math.sin(rad);
          const y = crown.y * crown.h + dx * Math.sin(rad) + dy * Math.cos(rad);
          return (
            <span
              key={i}
              className="absolute"
              style={{
                left: `${(x / crown.w) * 100}%`,
                top: `${(y / crown.h) * 100}%`,
                width: `${size * 100}%`,
                aspectRatio: "1",
                transform: `translate(-50%, -50%) rotate(${s * 18 + crown.tilt}deg)`,
              }}
            >
              <Flower petal={f.petal} heart={f.heart} fresh={i >= seen} />
            </span>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Counts the days spent together (any day a dose is taken, a meal or water noted, or a mood shared),
 * and when a new flower opens, the fairy shows it off once. Nothing is ever taken away.
 */
export function CrownKeeper() {
  const lang = useAsha((s) => s.lang);
  const voiceLang = useAsha((s) => s.voiceLang);
  const voiceOn = useAsha((s) => s.voiceOn);
  const name = useAsha((s) => s.name);
  const days = useAsha((s) => s.growth.days);
  const seen = useAsha((s) => s.crownSeen);
  const ready = useAsha(
    (s) => s.onboarded && s.tourDone && s.appRole !== "family" && s.tab === "today",
  );
  const doseLogs = useAsha((s) => s.doseLogs);
  const mealLogs = useAsha((s) => s.mealLogs);
  const checkins = useAsha((s) => s.checkins);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const s = useAsha.getState();
    const day = todayKey();
    if (s.growth.last === day || !togetherToday(s, day)) return;
    useAsha.setState({ growth: { days: s.growth.days + 1, last: day } });
  }, [doseLogs, mealLogs, checkins]);

  const count = flowersFor(days);
  const due = ready && count > seen;
  useEffect(() => {
    if (!due) return;
    const id = window.setTimeout(() => setOpen(true), 1200);
    return () => window.clearTimeout(id);
  }, [due]);

  const flower = FLOWERS[count - 1];
  const together = MILESTONES[count - 1] ?? days;
  const said =
    voiceLang === "hi"
      ? `देखो! मेरे ताज में एक नया फूल खिला है, ${flower?.hi}. यह हमारे ${together} दिनों के साथ से उगा है. शुक्रिया${name ? `, ${name}` : ""}!`
      : `Look! A new flower opened in my crown, ${flower?.en}. It grew from our ${together} ${together === 1 ? "day" : "days"} together. Thank you${name ? `, ${name}` : ""}!`;
  useEffect(() => {
    if (open && voiceOn) void speak(said, voiceLang, "fairy");
  }, [open]);

  if (!open || !flower) return null;
  const close = () => {
    useAsha.setState({ crownSeen: count });
    setOpen(false);
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-ink/55" onClick={close} />
      <div className="fi-bubble relative w-full max-w-md rounded-3xl border-2 border-[#f3c4d0] bg-paper p-5 text-center shadow-lg">
        <Pixie mood="blush" className="mx-auto h-72 w-60" />
        <p className="mt-2 text-sm font-bold uppercase tracking-wide text-[#d9506f]">
          {t(lang, { en: "A new flower", hi: "नया फूल" })}
        </p>
        <p className="mt-1 text-2xl font-bold leading-snug">
          {lang === "hi"
            ? `देखो! मेरे ताज में ${flower.hi} खिला है.`
            : `Look! ${flower.en[0].toUpperCase()}${flower.en.slice(1)} opened in my crown.`}
        </p>
        <p className="mt-2 text-lg text-quiet">
          {lang === "hi"
            ? `यह हमारे ${together} दिनों के साथ से उगा है. ${count < FLOWERS.length ? "साथ रहेंगे तो और फूल खिलेंगे." : "मेरा ताज पूरा खिल गया!"}`
            : `It grew from our ${together} ${together === 1 ? "day" : "days"} together. ${count < FLOWERS.length ? "More will open as we go on." : "My crown is in full bloom!"}`}
        </p>
        <Button className="mt-4 w-full" onClick={close}>
          {t(lang, { en: "It's lovely!", hi: "बहुत सुंदर!" })}
        </Button>
      </div>
    </div>
  );
}
