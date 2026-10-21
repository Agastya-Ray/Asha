import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, FieldLabel, t } from "@/components/asha/bits";
import { CONDITIONS, planById, text } from "@/lib/asha/plans";
import { mealNote, mealTitle } from "@/lib/asha/speech";
import { latinDigits, todayCheckin } from "@/lib/asha/schedule";
import { minutesNow, shiftDay, shortWeekday, todayKey, toMin } from "@/lib/asha/time";
import { AshaNative, isNative } from "@/lib/asha/native";
import { useAsha } from "@/lib/asha/store";
import type { ConditionId } from "@/lib/asha/types";

const MOODS = [
  { n: 1, en: "Hard day", hi: "भारी दिन" },
  { n: 2, en: "Quiet", hi: "शांत" },
  { n: 3, en: "Okay", hi: "ठीक" },
  { n: 4, en: "Good", hi: "अच्छा" },
  { n: 5, en: "Really good", hi: "बहुत अच्छा" },
];

type Metric = "sugar" | "bp" | "pain" | "mood";

export function CareScreen() {
  const lang = useAsha((s) => s.lang);
  const conditions = useAsha((s) => s.conditions);
  const meals = useAsha((s) => s.meals);
  const updateMeal = useAsha((s) => s.updateMeal);
  const checkins = useAsha((s) => s.checkins);
  const patch = useAsha((s) => s.patchCheckin);
  const checkin = todayCheckin(checkins);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const metrics: Metric[] = [];
  if (conditions.includes("diabetes")) metrics.push("sugar");
  if (conditions.includes("heart") || conditions.includes("diabetes")) metrics.push("bp");
  if (conditions.includes("arthritis")) metrics.push("pain");
  metrics.push("mood");
  const [metric, setMetric] = useState<Metric>(metrics[0] ?? "mood");
  const activeMetric = metrics.includes(metric) ? metric : metrics[0];

  const rows = [...checkins]
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(-7)
    .map((c) => ({
      day: c.day,
      label: shortWeekday(c.day, lang),
      fasting: c.fastingSugar ?? null,
      after: c.afterSugar ?? null,
      bp: c.bpSys ?? null,
      pain: c.pain ?? null,
      mood: c.mood ?? null,
    }));

  function saveNumber(key: "fastingSugar" | "afterSugar" | "bpSys" | "bpDia" | "weightKg" | "pain", raw: string, min: number, max: number) {
    const trimmed = raw.trim();
    if (!trimmed) {
      patch({ [key]: undefined });
      setError("");
      setSaved(t(lang, { en: "Saved for today.", hi: "आज के लिए सहेजा." }));
      return;
    }
    const n = Number(latinDigits(trimmed));
    if (!Number.isFinite(n) || n < min || n > max) {
      setSaved("");
      setError(t(lang, { en: "That number looks unlikely. Check it, or leave it blank.", hi: "यह आँकड़ा अटपटा है. जाँचें, या खाली छोड़ दें." }));
      return;
    }
    patch({ [key]: n });
    setError("");
    setSaved(t(lang, { en: "Saved for today.", hi: "आज के लिए सहेजा." }));
  }

  const both = conditions.includes("pcod") && conditions.includes("pcos");

  return (
    <div className="py-5">
      <h1 className="display text-4xl">{t(lang, { en: "Care", hi: "देखभाल" })}</h1>
      <p className="mt-2 text-lg text-quiet">
        {t(lang, {
          en: "Meal times, a short check-in, then the chart. Open a condition to read the plate. This is general care, not your doctor's order.",
          hi: "खाने का समय, छोटी जाँच, फिर चार्ट. प्लेट पढ़ने के लिए बीमारी खोलें. यह सामान्य देखभाल है, डॉक्टर का आदेश नहीं.",
        })}
      </p>

      <h2 className="mt-6 text-2xl font-bold">{t(lang, { en: "Meal times", hi: "खाने का समय" })}</h2>
      <p className="mt-1 text-base text-quiet">
        {t(lang, { en: "Change a time and Today follows it.", hi: "समय बदलें और आज वाला पन्ना उसी पर चलेगा." })}
      </p>
      <div className="mt-3 flex flex-col gap-3">
        {meals.map((meal) => (
          <Card key={meal.id}>
            <p className="text-lg font-bold first-letter:uppercase">{mealTitle(meal, lang)}</p>
            <p className="mt-1 text-base text-quiet">{mealNote(meal, lang)}</p>
            <input
              type="time"
              className="field mt-3"
              value={meal.time}
              onChange={(e) => e.target.value && updateMeal(meal.id, { time: e.target.value })}
            />
          </Card>
        ))}
      </div>

      <h2 className="mt-8 text-2xl font-bold">{t(lang, { en: "How is the body today?", hi: "आज शरीर कैसा है?" })}</h2>
      <Card className="mt-3">
        <FieldLabel>{t(lang, { en: "Mood", hi: "मन" })}</FieldLabel>
        <div className="flex flex-col gap-2">
          {MOODS.map((m) => (
            <button
              key={m.n}
              type="button"
              aria-pressed={checkin?.mood === m.n}
              onClick={() => {
                patch({ mood: m.n });
                setSaved(t(lang, { en: "Saved for today.", hi: "आज के लिए सहेजा." }));
              }}
              className={`min-h-12 rounded-2xl border px-4 text-left text-lg font-bold ${checkin?.mood === m.n ? "border-sage bg-sage-soft" : "border-line"}`}
            >
              {lang === "hi" ? m.hi : m.en}
            </button>
          ))}
        </div>
        {conditions.includes("diabetes") ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Num
              label={t(lang, { en: "Fasting sugar", hi: "खाली पेट शुगर" })}
              placeholder="110"
              initial={checkin?.fastingSugar}
              onCommit={(v) => saveNumber("fastingSugar", v, 40, 500)}
            />
            <Num
              label={t(lang, { en: "After a meal", hi: "खाने के बाद" })}
              placeholder="160"
              initial={checkin?.afterSugar}
              onCommit={(v) => saveNumber("afterSugar", v, 40, 500)}
            />
          </div>
        ) : null}
        {conditions.includes("arthritis") ? (
          <div className="mt-4">
            <FieldLabel>{t(lang, { en: "Pain, 0 is none and 10 is worst", hi: "दर्द, 0 नहीं और 10 सबसे ज़्यादा" })}</FieldLabel>
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 11 }, (_, n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={checkin?.pain === n}
                  onClick={() => {
                    patch({ pain: n });
                    setSaved(t(lang, { en: "Saved for today.", hi: "आज के लिए सहेजा." }));
                  }}
                  className={`min-h-12 rounded-xl border text-lg font-bold ${checkin?.pain === n ? "border-sage bg-sage text-paper" : "border-line bg-linen"}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {conditions.includes("heart") || conditions.includes("diabetes") ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Num label={t(lang, { en: "Blood pressure, top", hi: "रक्तचाप, ऊपर" })} placeholder="128" initial={checkin?.bpSys} onCommit={(v) => saveNumber("bpSys", v, 70, 220)} />
            <Num label={t(lang, { en: "Blood pressure, bottom", hi: "रक्तचाप, नीचे" })} placeholder="80" initial={checkin?.bpDia} onCommit={(v) => saveNumber("bpDia", v, 40, 140)} />
          </div>
        ) : null}
        {conditions.includes("heart") ? (
          <div className="mt-4">
            <Num label={t(lang, { en: "Morning weight, kg", hi: "सुबह का वज़न, किलो" })} placeholder="62" initial={checkin?.weightKg} onCommit={(v) => saveNumber("weightKg", v, 30, 200)} />
            <FieldLabel>{t(lang, { en: "New swelling in the ankles?", hi: "टखनों में नई सूजन?" })}</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={checkin?.swelling === true ? "primary" : "quiet"}
                onClick={() => patch({ swelling: true })}
              >
                {t(lang, { en: "Yes", hi: "हाँ" })}
              </Button>
              <Button
                variant={checkin?.swelling === false ? "primary" : "quiet"}
                onClick={() => patch({ swelling: false })}
              >
                {t(lang, { en: "No", hi: "नहीं" })}
              </Button>
            </div>
          </div>
        ) : null}
        {conditions.includes("pcod") || conditions.includes("pcos") ? (
          <div className="mt-4">
            <FieldLabel>{t(lang, { en: "Cycle note", hi: "पीरियड का नोट" })}</FieldLabel>
            <input
              className="field"
              defaultValue={checkin?.cycleNote ?? ""}
              placeholder={t(lang, { en: "Started today / not today", hi: "आज शुरू / आज नहीं" })}
              onBlur={(e) => patch({ cycleNote: e.target.value.slice(0, 120) })}
            />
          </div>
        ) : null}
        {saved ? <p className="mt-4 text-lg font-bold text-sage">{saved}</p> : null}
        {error ? <p className="mt-4 text-lg text-clay">{error}</p> : null}
      </Card>

      <h2 className="mt-8 text-2xl font-bold">{t(lang, { en: "The last seven days", hi: "पिछले सात दिन" })}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {metrics.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setMetric(id)}
            className={`min-h-12 rounded-full px-4 text-base font-bold ${activeMetric === id ? "bg-sage text-paper" : "border border-line bg-paper"}`}
          >
            {id === "sugar"
              ? t(lang, { en: "Sugar", hi: "शुगर" })
              : id === "bp"
                ? t(lang, { en: "Blood pressure", hi: "रक्तचाप" })
                : id === "pain"
                  ? t(lang, { en: "Pain", hi: "दर्द" })
                  : t(lang, { en: "Mood", hi: "मन" })}
          </button>
        ))}
      </div>
      <Card className="mt-3">
        {rows.length === 0 ? (
          <p className="text-lg">{t(lang, { en: "Nothing saved yet. The first check-in starts the line.", hi: "अभी कुछ सहेजा नहीं. पहली जाँच से रेखा शुरू होगी." })}</p>
        ) : (
          <>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rows}>
                  <CartesianGrid stroke="var(--color-line)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "var(--color-quiet)", fontSize: 14 }} />
                  <YAxis width={40} tick={{ fill: "var(--color-quiet)", fontSize: 14 }} domain={activeMetric === "pain" || activeMetric === "mood" ? [0, activeMetric === "mood" ? 5 : 10] : ["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-paper)",
                      border: "1px solid var(--color-line)",
                      borderRadius: 12,
                      color: "var(--color-ink)",
                    }}
                  />
                  {activeMetric === "sugar" ? (
                    <>
                      <Line type="monotone" dataKey="fasting" name={t(lang, { en: "Fasting", hi: "खाली पेट" })} stroke="var(--color-sage)" strokeWidth={3} dot={{ r: 4 }} connectNulls />
                      <Line type="monotone" dataKey="after" name={t(lang, { en: "After food", hi: "खाने के बाद" })} stroke="var(--color-clay)" strokeWidth={3} dot={{ r: 4 }} connectNulls />
                    </>
                  ) : (
                    <Line
                      type="monotone"
                      dataKey={activeMetric === "bp" ? "bp" : activeMetric}
                      name={
                        activeMetric === "bp"
                          ? t(lang, { en: "Blood pressure, top", hi: "रक्तचाप, ऊपर" })
                          : activeMetric === "pain"
                            ? t(lang, { en: "Pain", hi: "दर्द" })
                            : t(lang, { en: "Mood", hi: "मन" })
                      }
                      stroke="var(--color-sage)"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      connectNulls
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-base text-quiet">
              {activeMetric === "sugar"
                ? `${t(lang, { en: "Fasting this week:", hi: "इस हफ्ते खाली पेट:" })} ${rows.map((r) => r.fasting ?? "—").join(", ")}`
                : activeMetric === "bp"
                  ? `${t(lang, { en: "Top number this week:", hi: "इस हफ्ते ऊपर का आँकड़ा:" })} ${rows.map((r) => r.bp ?? "—").join(", ")}`
                  : activeMetric === "pain"
                    ? `${t(lang, { en: "Pain this week:", hi: "इस हफ्ते दर्द:" })} ${rows.map((r) => r.pain ?? "—").join(", ")}`
                    : `${t(lang, { en: "Mood this week, 1 is hard and 5 is light:", hi: "इस हफ्ते मन, 1 भारी और 5 हल्का:" })} ${rows.map((r) => r.mood ?? "—").join(", ")}`}
            </p>
          </>
        )}
      </Card>

      <h2 className="mt-8 text-2xl font-bold">{t(lang, { en: "The plate and the day", hi: "प्लेट और दिन" })}</h2>
      {both ? (
        <p className="mt-2 text-lg">
          {t(lang, {
            en: "You selected both PCOD and PCOS. Follow the PCOS plate once. You do not need two diets.",
            hi: "आपने पीसीओडी और पीसीओएस दोनों चुने हैं. पीसीओएस की प्लेट एक बार अपनाएँ. दो डाइट की ज़रूरत नहीं.",
          })}
        </p>
      ) : null}
      {conditions.length === 0 ? (
        <p className="mt-2 text-lg text-quiet">
          {t(lang, { en: "Choose a condition in Settings and a specific page will open here.", hi: "सेटिंग में बीमारी चुनें, तब यहाँ उसका पन्ना खुलेगा." })}
        </p>
      ) : (
        <div className="mt-2">
          {conditions.map((id) => (
            <PlanBlock key={id} id={id} />
          ))}
        </div>
      )}
      <DoctorReport />
    </div>
  );
}

/** A plain-text summary of the last two weeks, ready to send to the doctor on WhatsApp or SMS. */
function DoctorReport() {
  const lang = useAsha((s) => s.lang);
  const [done, setDone] = useState("");
  async function share() {
    const s = useAsha.getState();
    const days = new Set<string>();
    for (let i = 0; i < 14; i++) days.add(shiftDay(i));
    const rows = s.checkins.filter((c) => days.has(c.day)).sort((a, b) => a.day.localeCompare(b.day));
    const avg = (xs: (number | undefined)[]) => {
      const v = xs.filter((x): x is number => typeof x === "number");
      return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
    };
    // Count a dose only from the first day that medicine was marked, and today only once its time has come.
    // Otherwise a medicine added yesterday shows as "2 of 42" and the doctor reads it as missed doses.
    const today = todayKey();
    const nowMin = minutesNow();
    let planned = 0;
    let taken = 0;
    for (const m of s.meds) {
      const first = s.doseLogs.filter((l) => l.medId === m.id).map((l) => l.day).sort()[0];
      if (!first) continue;
      for (const d of days) {
        if (d < first) continue;
        for (const time of m.times) {
          const log = s.doseLogs.find((l) => l.day === d && l.medId === m.id && l.time === time);
          if (d === today && !log && toMin(time) > nowMin) continue;
          planned += 1;
          if (log?.status === "taken") taken += 1;
        }
      }
    }
    const conds = s.conditions.map((id) => CONDITIONS.find((c) => c.id === id)?.title.en ?? id).join(", ") || "-";
    const lines = [
      `Health summary from Asha, last 14 days`,
      `Name: ${s.name || "-"}`,
      `Conditions noted: ${conds}`,
      `Medicines: ${s.meds.map((m) => `${m.name} ${m.dose} (${m.times.join(", ")})`).join("; ") || "-"}`,
      planned ? `Doses marked taken: ${taken} of ${planned} (${Math.round((taken / planned) * 100)}%)` : "Doses marked taken: none marked yet",
    ];
    const fs = avg(rows.map((r) => r.fastingSugar));
    const as = avg(rows.map((r) => r.afterSugar));
    const sys = avg(rows.map((r) => r.bpSys));
    const dia = avg(rows.map((r) => r.bpDia));
    const pain = avg(rows.map((r) => r.pain));
    if (fs !== null) lines.push(`Fasting sugar, average: ${fs} mg/dL`);
    if (as !== null) lines.push(`Sugar 2h after food, average: ${as} mg/dL`);
    if (sys !== null && dia !== null) lines.push(`Blood pressure, average: ${sys}/${dia}`);
    if (pain !== null) lines.push(`Joint pain, average: ${pain}/10`);
    const daily = rows
      .filter((r) => r.fastingSugar || r.bpSys || r.pain !== undefined)
      .map((r) =>
        [r.day, r.fastingSugar ? `FBS ${r.fastingSugar}` : "", r.afterSugar ? `PP ${r.afterSugar}` : "", r.bpSys ? `BP ${r.bpSys}/${r.bpDia ?? "?"}` : "", r.pain !== undefined ? `pain ${r.pain}` : ""]
          .filter(Boolean)
          .join("  "),
      );
    if (daily.length) lines.push("", "Daily readings:", ...daily);
    lines.push("", "Recorded at home in the Asha app. Not a diagnosis.");
    const text = lines.join("\n");
    try {
      if (isNative) await AshaNative.share({ text, title: "Asha health summary" });
      else if (navigator.share) await navigator.share({ title: "Asha health summary", text });
      else {
        await navigator.clipboard.writeText(text);
        setDone(t(lang, { en: "Copied. Paste it into WhatsApp or SMS.", hi: "कॉपी हो गया. व्हाट्सऐप या एसएमएस में चिपकाएँ." }));
      }
    } catch {
      /* the person closed the share sheet */
    }
  }
  return (
    <Card className="mt-8">
      <p className="text-xl font-bold">{t(lang, { en: "For the doctor", hi: "डॉक्टर के लिए" })}</p>
      <p className="mt-2 text-lg text-quiet">
        {t(lang, {
          en: "A short summary of two weeks: medicines taken, sugar, blood pressure and pain. Send it before a visit.",
          hi: "दो हफ्तों का छोटा सार: दवा, शुगर, बीपी और दर्द. डॉक्टर से मिलने से पहले भेजें.",
        })}
      </p>
      <div className="mt-4">
        <Button variant="quiet" onClick={() => void share()}>
          {t(lang, { en: "Share the summary", hi: "सार भेजें" })}
        </Button>
      </div>
      {done ? <p className="mt-2 text-base text-sage">{done}</p> : null}
    </Card>
  );
}

function Num({
  label,
  placeholder,
  initial,
  onCommit,
}: {
  label: string;
  placeholder: string;
  initial?: number;
  onCommit: (v: string) => void;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        className="field"
        inputMode="decimal"
        placeholder={placeholder}
        defaultValue={initial ?? ""}
        onBlur={(e) => onCommit(e.target.value)}
      />
    </div>
  );
}

function PlanBlock({ id }: { id: ConditionId }) {
  const lang = useAsha((s) => s.lang);
  const plan = planById(id);
  const known = CONDITIONS.find((c) => c.id === id);
  return (
    <details className="border-b border-line py-3" open={id === "heart" || id === "diabetes"}>
      <summary className="min-h-12 cursor-pointer text-xl font-bold">{known ? text(known.title, lang) : id}</summary>
      <div className="mt-3 space-y-3 text-lg">
        <p>{text(plan.plain, lang)}</p>
        <p>
          <span className="font-bold">{t(lang, { en: "Plate. ", hi: "प्लेट. " })}</span>
          {text(plan.plate, lang)}
        </p>
        <p>
          <span className="font-bold">{t(lang, { en: "Day. ", hi: "दिन. " })}</span>
          {text(plan.day, lang)}
        </p>
        <p>
          <span className="font-bold">{t(lang, { en: "Tell the doctor. ", hi: "डॉक्टर को बताएँ. " })}</span>
          {text(plan.watch, lang)}
        </p>
      </div>
    </details>
  );
}
