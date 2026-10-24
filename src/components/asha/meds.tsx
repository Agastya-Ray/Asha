import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, FieldLabel, SpeakField, t } from "@/components/asha/bits";
import { apiReadPrescription } from "@/lib/asha/api";
import { normTime, speakClock } from "@/lib/asha/time";
import { newId, useAsha } from "@/lib/asha/store";
import type { Food, Med } from "@/lib/asha/types";
import { latinDigits } from "@/lib/asha/schedule";

const FOODS: Food[] = ["before", "with", "after", "anytime"];

function foodLabel(food: Food, lang: "en" | "hi") {
  const map: Record<Food, { en: string; hi: string }> = {
    before: { en: "Before food", hi: "खाने से पहले" },
    with: { en: "With food", hi: "खाने के साथ" },
    after: { en: "After food", hi: "खाने के बाद" },
    anytime: { en: "With or without", hi: "खाने से फर्क नहीं" },
  };
  return t(lang, map[food]);
}

type Often = "daily" | "some" | "weekly" | "asNeeded";
const OFTEN: { id: Often; en: string; hi: string }[] = [
  { id: "daily", en: "Every day", hi: "रोज़" },
  { id: "some", en: "Some days", hi: "कुछ दिन" },
  { id: "weekly", en: "Once a week", hi: "हफ़्ते में एक बार" },
  { id: "asNeeded", en: "Only when needed", hi: "ज़रूरत होने पर" },
];
const WEEKDAYS: { en: string; hi: string; long: { en: string; hi: string } }[] = [
  { en: "Sun", hi: "रवि", long: { en: "Sunday", hi: "रविवार" } },
  { en: "Mon", hi: "सोम", long: { en: "Monday", hi: "सोमवार" } },
  { en: "Tue", hi: "मंगल", long: { en: "Tuesday", hi: "मंगलवार" } },
  { en: "Wed", hi: "बुध", long: { en: "Wednesday", hi: "बुधवार" } },
  { en: "Thu", hi: "गुरु", long: { en: "Thursday", hi: "गुरुवार" } },
  { en: "Fri", hi: "शुक्र", long: { en: "Friday", hi: "शुक्रवार" } },
  { en: "Sat", hi: "शनि", long: { en: "Saturday", hi: "शनिवार" } },
];
const AMOUNTS: { en: string; hi: string }[] = [
  { en: "½ tablet", hi: "आधी गोली" },
  { en: "1 tablet", hi: "1 गोली" },
  { en: "2 tablets", hi: "2 गोलियाँ" },
  { en: "1 spoon", hi: "1 चम्मच" },
];

function oftenOf(med: Med): Often {
  if (med.asNeeded) return "asNeeded";
  const n = med.days?.length ?? 0;
  return n === 0 || n === 7 ? "daily" : n === 1 ? "weekly" : "some";
}

/** The whole plan in one plain sentence, so a person can check it at a glance. */
export function medSummary(med: Med, lang: "en" | "hi", chosen?: Often) {
  const often = chosen ?? oftenOf(med);
  const amount = med.dose.trim();
  if (often === "asNeeded") return t(lang, { en: `${amount}, only when needed.`, hi: `${amount}, सिर्फ़ ज़रूरत होने पर.` });
  const days = (med.days ?? []).slice().sort().map((d) => t(lang, WEEKDAYS[d].long));
  const when =
    often === "daily"
      ? t(lang, { en: "every day", hi: "रोज़" })
      : days.length
        ? t(lang, { en: `on ${days.join(", ")}`, hi: `${days.join(", ")} को` })
        : t(lang, { en: "on the days you tap", hi: "जिन दिनों पर टैप करें" });
  // an emptied time box is not "twelve at night"
  const times = [...new Set(med.times.filter(Boolean))].sort().map((x) => speakClock(lang, x));
  const at = times.join(t(lang, { en: " and ", hi: " और " }));
  return lang === "hi" ? `${amount}, ${when}, ${at}, ${foodLabel(med.food, lang)}.` : `${amount}, ${when}, at ${at}, ${foodLabel(med.food, lang).toLowerCase()}.`;
}

export function MedEditor({
  initial,
  submitLabel,
  onSave,
  onCancel,
}: {
  initial: Med;
  submitLabel: string;
  onSave: () => void;
  onCancel?: () => void;
}) {
  const lang = useAsha((s) => s.lang);
  const saveMed = useAsha((s) => s.saveMed);
  const [med, setMed] = useState(initial);
  const [hint, setHint] = useState("");
  const [often, setOften] = useState<Often>(oftenOf(initial));

  return (
    <Card>
      <FieldLabel>{t(lang, { en: "Medicine name", hi: "दवा का नाम" })}</FieldLabel>
      <SpeakField value={med.name} onChange={(v) => setMed({ ...med, name: v })} placeholder={t(lang, { en: "Metformin", hi: "मेटफॉर्मिन" })} />
      <div className="mt-4">
        <FieldLabel>{t(lang, { en: "How much each time?", hi: "हर बार कितनी?" })}</FieldLabel>
        <p className="mb-2 text-base text-quiet">{t(lang, { en: "Tap one, or write it: tablets, spoons or drops.", hi: "एक चुनें, या लिखें: गोली, चम्मच या बूँद." })}</p>
        <div className="mb-2 flex flex-wrap gap-2">
          {AMOUNTS.map((a) => {
            const label = t(lang, a);
            return (
              <button
                key={a.en}
                type="button"
                aria-pressed={med.dose === label}
                onClick={() => setMed({ ...med, dose: label })}
                className={`min-h-12 rounded-2xl border px-4 text-base font-bold ${med.dose === label ? "border-sage bg-sage-soft" : "border-line bg-linen"}`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <SpeakField value={med.dose} onChange={(v) => setMed({ ...med, dose: v })} placeholder={t(lang, { en: "1 tablet, 500 mg", hi: "1 गोली, 500 mg" })} />
      </div>
      <div className="mt-4">
        <FieldLabel>{t(lang, { en: "How often?", hi: "कितनी बार?" })}</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          {OFTEN.map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={often === o.id}
              onClick={() => {
                setOften(o.id);
                if (o.id === "daily") setMed({ ...med, days: undefined, asNeeded: false });
                else if (o.id === "asNeeded") setMed({ ...med, days: undefined, asNeeded: true });
                else if (o.id === "weekly") setMed({ ...med, days: [med.days?.[0] ?? new Date().getDay()], asNeeded: false });
                else setMed({ ...med, days: med.days?.length ? med.days : [], asNeeded: false });
              }}
              className={`min-h-12 rounded-2xl border px-3 text-base font-bold ${often === o.id ? "border-sage bg-sage-soft" : "border-line bg-linen"}`}
            >
              {t(lang, o)}
            </button>
          ))}
        </div>
        {often === "some" || often === "weekly" ? (
          <>
            <p className="mb-2 mt-3 text-base text-quiet">
              {often === "weekly" ? t(lang, { en: "Which day?", hi: "किस दिन?" }) : t(lang, { en: "Tap every day you take it.", hi: "जिन दिनों लेते हैं, सब पर टैप करें." })}
            </p>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((w, d) => {
                const on = med.days?.includes(d) ?? false;
                return (
                  <button
                    key={w.en}
                    type="button"
                    aria-pressed={on}
                    aria-label={t(lang, w.long)}
                    onClick={() => {
                      const days = often === "weekly" ? [d] : on ? (med.days ?? []).filter((x) => x !== d) : [...(med.days ?? []), d].sort();
                      setMed({ ...med, days });
                    }}
                    className={`min-h-12 min-w-14 rounded-2xl border px-2 text-base font-bold ${on ? "border-sage bg-sage-soft" : "border-line bg-linen"}`}
                  >
                    {t(lang, w)}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
      <div className={`mt-4 ${often === "asNeeded" ? "hidden" : ""}`}>
        <FieldLabel>{t(lang, { en: "At what time?", hi: "किस समय?" })}</FieldLabel>
        <p className="mb-2 text-base text-quiet">{t(lang, { en: "One box for each time you take it.", hi: "जितनी बार लेते हैं, उतने समय." })}</p>
        <div className="flex flex-col gap-2">
          {med.times.map((time, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="time"
                className="field"
                value={time}
                onChange={(e) => {
                  const times = med.times.slice();
                  times[index] = e.target.value;
                  setMed({ ...med, times });
                }}
              />
              {med.times.length > 1 ? (
                <button
                  type="button"
                  className="min-h-14 shrink-0 rounded-2xl border border-line px-4 font-bold"
                  onClick={() => setMed({ ...med, times: med.times.filter((_, i) => i !== index) })}
                >
                  {t(lang, { en: "Remove", hi: "हटाएँ" })}
                </button>
              ) : null}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-2 min-h-12 font-bold text-sage"
          onClick={() => {
            const next = ["20:00", "13:00", "08:00", "22:00", "06:00"].find((x) => !med.times.includes(x)) ?? "12:00";
            setMed({ ...med, times: [...med.times, next] });
          }}
        >
          {t(lang, { en: "Add another time", hi: "एक और समय" })}
        </button>
      </div>
      <div className="mt-4">
        <FieldLabel>{t(lang, { en: "Food", hi: "खाना" })}</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          {FOODS.map((food) => (
            <button
              key={food}
              type="button"
              aria-pressed={med.food === food}
              onClick={() => setMed({ ...med, food })}
              className={`min-h-12 rounded-2xl border px-3 text-base font-bold ${med.food === food ? "border-sage bg-sage-soft" : "border-line bg-linen"}`}
            >
              {foodLabel(food, lang)}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <FieldLabel>{t(lang, { en: "Note, if you want", hi: "नोट, अगर चाहें" })}</FieldLabel>
        <input
          className="field"
          value={med.note}
          onChange={(e) => setMed({ ...med, note: e.target.value })}
          placeholder={t(lang, { en: "With breakfast", hi: "नाश्ते के साथ" })}
        />
      </div>
      <div className="mt-4">
        <FieldLabel>{t(lang, { en: "Tablets left at home, optional", hi: "घर में बची गोलियाँ, वैकल्पिक" })}</FieldLabel>
        <input
          className="field"
          inputMode="numeric"
          value={med.pillsLeft ?? ""}
          placeholder={t(lang, { en: "Leave blank to skip", hi: "छोड़ना हो तो खाली रखें" })}
          onChange={(e) => {
            const raw = latinDigits(e.target.value).replace(/\D/g, "").slice(0, 4);
            setMed({ ...med, pillsLeft: raw === "" ? null : Number(raw) });
          }}
        />
        <p className="mt-2 text-base text-quiet">
          {t(lang, { en: "Asha mentions a refill when 7 or fewer are left.", hi: "7 या कम बचें तो आशा रिफिल कहेगी." })}
        </p>
      </div>
      {med.dose.trim() && (often === "asNeeded" || med.times.some(Boolean)) ? (
        <p className="mt-5 rounded-2xl bg-sage-soft p-4 text-lg text-sage">
          {t(lang, { en: "So: ", hi: "यानी: " })}
          {medSummary(med, lang, often)}
        </p>
      ) : null}
      {hint ? <p className="mt-4 text-lg text-clay">{hint}</p> : null}
      <div className="mt-5 flex flex-col gap-2">
        <Button
          onClick={() => {
            if (!med.name.trim()) {
              setHint(t(lang, { en: "The name is the part that matters. Type it.", hi: "नाम ज़रूरी है. उसे लिखें." }));
              return;
            }
            if (!med.dose.trim()) {
              setHint(t(lang, { en: "Add how much. Even '1 tablet' is enough.", hi: "कितनी है यह लिखें. '1 गोली' भी काफ़ी है." }));
              return;
            }
            // The same time twice would ring twice and count as two doses.
            const times = [...new Set(med.times.filter(Boolean))].sort();
            if ((often === "some" || often === "weekly") && !med.days?.length) {
              setHint(t(lang, { en: "Tap the days you take it.", hi: "जिन दिनों लेते हैं, उन पर टैप करें." }));
              return;
            }
            if (!times.length && often !== "asNeeded") {
              setHint(t(lang, { en: "Add at least one time.", hi: "कम से कम एक समय डालें." }));
              return;
            }
            saveMed({
              ...med,
              name: med.name.trim(),
              dose: med.dose.trim(),
              times,
              pillsLeft: med.pillsLeft !== null && Number.isFinite(med.pillsLeft) ? Math.max(0, Math.round(med.pillsLeft)) : null,
            });
            onSave();
          }}
        >
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button variant="quiet" onClick={onCancel}>
            {t(lang, { en: "Cancel", hi: "रद्द" })}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

async function fileToJpeg(file: File) {
  const bitmap = await createImageBitmap(file);
  const max = 1280;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.72);
}

type Draft = Med & { keep: boolean; noTime: boolean };

export function MedsScreen() {
  const lang = useAsha((s) => s.lang);
  const meds = useAsha((s) => s.meds);
  const removeMed = useAsha((s) => s.removeMed);
  const saveMeds = useAsha((s) => s.saveMeds);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [caution, setCaution] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    setError("");
    setReading(true);
    setDrafts(null);
    try {
      const image = await fileToJpeg(file);
      const res = await apiReadPrescription(image);
      if (!res.ok) {
        setError(
          res.error === "offline"
            ? t(lang, { en: "No internet right now. Type the medicines instead.", hi: "अभी इंटरनेट नहीं. दवाएँ लिख दें." })
            : res.status === 429
              ? t(lang, { en: "Photo reading needs a short rest. Type the medicines, or try later.", hi: "फ़ोटो पढ़ना थोड़ी देर रुका है. दवाएँ लिखें, या बाद में कोशिश करें." })
              : t(lang, { en: "The page could not be read. Type the names, or try a clearer photo in daylight.", hi: "पन्ना पढ़ा नहीं गया. नाम लिखें, या दिन की रोशनी में साफ़ फ़ोटो लें." }),
        );
        return;
      }
      const next: Draft[] = res.medicines.map((m) => {
        const times = m.times.map((raw) => normTime(raw)).filter((x): x is string => Boolean(x));
        const food = (["before", "with", "after", "anytime"] as const).find((f) => f === m.food) ?? "anytime";
        return {
          id: newId(),
          name: m.name,
          dose: m.dose || "",
          times: times.length ? times : ["08:00"],
          food,
          note: [m.note, m.days > 0 ? (lang === "hi" ? `${m.days} दिन के लिए` : `For ${m.days} days`) : ""].filter(Boolean).join(" · "),
          pillsLeft: null,
          // No time on the page usually means "only when needed" (SOS). A daily reminder would be wrong, so it starts unticked.
          keep: times.length > 0,
          noTime: times.length === 0,
        };
      });
      setCaution(res.caution);
      if (!next.length) {
        setError(
          t(lang, {
            en: "No medicine names were clear. Type them, or take the photo again in daylight.",
            hi: "कोई नाम साफ़ नहीं दिखा. उन्हें लिखें, या दिन की रोशनी में फिर फ़ोटो लें.",
          }),
        );
        return;
      }
      setDrafts(next);
    } catch {
      setError(
        t(lang, {
          en: "That photo did not open. Try a JPG, or take the picture again.",
          hi: "वह फ़ोटो नहीं खुली. JPG आज़माएँ, या फिर से फ़ोटो लें.",
        }),
      );
    } finally {
      setReading(false);
    }
  }

  return (
    <div className="py-5">
      <h1 className="display text-4xl">{t(lang, { en: "Medicines", hi: "दवाइयाँ" })}</h1>
      <p className="mt-2 text-lg text-quiet">
        {t(lang, {
          en: "Green on Today means taken. If a name looks wrong, change it here. A photo can misread handwriting, so you confirm every name.",
          hi: "आज वाले पन्ने पर हरा मतलब ले ली. नाम गलत लगे तो यहीं बदलें. फ़ोटो लिखावट गलत पढ़ सकती है, इसलिए हर नाम आप पक्का करते हैं.",
        })}
      </p>

      <div data-tour="meds-list" className="mt-5 flex flex-col gap-3">
        {meds.length === 0 ? (
          <Card>
            <p className="text-lg">
              {t(lang, {
                en: "No medicines yet. Add one, or photograph the prescription.",
                hi: "अभी कोई दवा नहीं. एक जोड़ें, या पर्ची की फ़ोटो लें.",
              })}
            </p>
          </Card>
        ) : (
          meds.map((med) =>
            editing === med.id ? (
              <MedEditor
                key={med.id}
                initial={med}
                submitLabel={t(lang, { en: "Save changes", hi: "बदलाव सहेजें" })}
                onCancel={() => setEditing(null)}
                onSave={() => setEditing(null)}
              />
            ) : (
              <Card key={med.id}>
                <p className="text-2xl font-bold">{med.name}</p>
                <p className="mt-1 text-lg">{medSummary(med, lang)}</p>
                {med.note ? <p className="mt-2 text-base text-quiet">{med.note}</p> : null}
                {med.pillsLeft !== null ? (
                  <p className="mt-2 text-base font-bold text-clay">
                    {med.pillsLeft} {t(lang, { en: "tablets left in the count", hi: "गोलियाँ गिनती में बची हैं" })}
                  </p>
                ) : null}
                {removing === med.id ? (
                  <div className="mt-4 rounded-2xl border border-clay bg-clay-soft p-3">
                    <p className="text-lg font-bold">
                      {lang === "hi" ? `${med.name} को सूची से हटाएँ? इसकी याद भी बंद हो जाएगी.` : `Remove ${med.name}? Its reminders stop too.`}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button
                        variant="sos"
                        onClick={() => {
                          removeMed(med.id);
                          setRemoving(null);
                        }}
                      >
                        {t(lang, { en: "Yes, remove", hi: "हाँ, हटाएँ" })}
                      </Button>
                      <Button variant="quiet" onClick={() => setRemoving(null)}>
                        {t(lang, { en: "Keep it", hi: "रहने दें" })}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button variant="quiet" onClick={() => setEditing(med.id)}>
                      {t(lang, { en: "Change", hi: "बदलें" })}
                    </Button>
                    <Button variant="quiet" onClick={() => setRemoving(med.id)}>
                      {t(lang, { en: "Remove", hi: "हटाएँ" })}
                    </Button>
                  </div>
                )}
              </Card>
            ),
          )
        )}
      </div>

      {adding ? (
        <div className="mt-4">
          <MedEditor
            initial={{
              id: newId(),
              name: "",
              dose: "",
              times: ["08:00"],
              food: "with",
              note: "",
              pillsLeft: null,
            }}
            submitLabel={t(lang, { en: "Save this medicine", hi: "यह दवा सहेजें" })}
            onCancel={() => setAdding(false)}
            onSave={() => setAdding(false)}
          />
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <Button onClick={() => setAdding(true)}>{t(lang, { en: "Add a medicine", hi: "दवा जोड़ें" })}</Button>
          {reading ? (
            <p className="text-lg font-bold text-sage">{t(lang, { en: "Reading the page…", hi: "पन्ना पढ़ रही हूँ…" })}</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="quiet" onClick={() => fileRef.current?.click()}>
                {t(lang, { en: "Photo of prescription", hi: "पर्ची की फ़ोटो लें" })}
              </Button>
              <Button variant="quiet" onClick={() => galleryRef.current?.click()}>
                {t(lang, { en: "Choose from gallery", hi: "गैलरी से चुनें" })}
              </Button>
            </div>
          )}
          <p className="text-base text-quiet">
            {t(lang, {
              en: "One page, in daylight, lying flat. Asha suggests names. She does not add them until you say so.",
              hi: "एक पन्ना, दिन की रोशनी में, सीधा रखकर. आशा नाम सुझाएगी. आप कहें तब जोड़ेगी.",
            })}
          </p>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void onFile(file);
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void onFile(file);
        }}
      />
      {error ? <p className="mt-4 text-lg text-clay">{error}</p> : null}

      {drafts ? (
        <div className="mt-5">
          <h2 className="display text-3xl">{t(lang, { en: "Check these names", hi: "इन नामों को जाँचें" })}</h2>
          <p className="mt-2 text-lg text-quiet">
            {t(lang, {
              en: "Untick anything wrong. Change a name if a letter looks off. Times that were not written down are a guess.",
              hi: "जो गलत हो उसे हटाएँ. अक्षर अटपटा लगे तो नाम बदलें. जो समय लिखा नहीं था, वह अंदाज़ा है.",
            })}
          </p>
          {caution ? <p className="mt-3 text-lg">{caution}</p> : null}
          <div className="mt-4 flex flex-col gap-3">
            {drafts.map((draft) => (
              <Card key={draft.id}>
                <label className="flex items-center gap-3 text-lg font-bold">
                  <input
                    type="checkbox"
                    className="size-6"
                    checked={draft.keep}
                    onChange={(e) =>
                      setDrafts((list) => list?.map((d) => (d.id === draft.id ? { ...d, keep: e.target.checked } : d)) ?? null)
                    }
                  />
                  {t(lang, { en: "Add this one", hi: "इसे जोड़ें" })}
                </label>
                <input
                  className="field mt-3"
                  value={draft.name}
                  onChange={(e) =>
                    setDrafts((list) => list?.map((d) => (d.id === draft.id ? { ...d, name: e.target.value } : d)) ?? null)
                  }
                />
                <input
                  className="field mt-2"
                  value={draft.dose}
                  placeholder={t(lang, { en: "How much? e.g. 1 tablet", hi: "कितनी? जैसे 1 गोली" })}
                  onChange={(e) =>
                    setDrafts((list) => list?.map((d) => (d.id === draft.id ? { ...d, dose: e.target.value } : d)) ?? null)
                  }
                />
                <p className="mt-2 text-base text-quiet">
                  {draft.times.join(" · ")} · {foodLabel(draft.food, lang)}
                </p>
                {draft.note ? <p className="mt-1 text-base text-quiet">{draft.note}</p> : null}
                {draft.noTime ? (
                  <p className="mt-2 text-base font-bold text-clay">
                    {t(lang, {
                      en: "No time was written, so this may be only when needed. Tick it only if it is a daily medicine, then set its time on Meds.",
                      hi: "समय नहीं लिखा है, शायद यह सिर्फ ज़रूरत पर है. रोज़ की दवा हो तभी चुनें, फिर दवा वाले पन्ने पर समय बदलें.",
                    })}
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              onClick={() => {
                const chosen = drafts.filter((d) => d.keep && d.name.trim());
                if (!chosen.length) {
                  setError(t(lang, { en: "Tick at least one medicine, or cancel.", hi: "कम से कम एक दवा चुनें, या रद्द करें." }));
                  return;
                }
                const noDose = chosen.find((d) => !d.dose.trim());
                if (noDose) {
                  setError(
                    lang === "hi"
                      ? `${noDose.name.trim()} कितनी लेनी है, यह लिखें. '1 गोली' भी काफ़ी है.`
                      : `Write how much ${noDose.name.trim()} to take. Even '1 tablet' is enough.`,
                  );
                  return;
                }
                saveMeds(
                chosen.map((d) => ({
                  id: d.id,
                  name: d.name.trim(),
                  dose: d.dose.trim(),
                  times: d.times,
                  food: d.food,
                  note: d.note,
                  pillsLeft: d.pillsLeft,
                })),
              );
                setDrafts(null);
                setCaution("");
                setError("");
              }}
            >
              {t(lang, { en: "Add the ticked medicines", hi: "चुनी हुई दवाएँ जोड़ें" })}
            </Button>
            <Button variant="quiet" onClick={() => setDrafts(null)}>
              {t(lang, { en: "Do not add these", hi: "इन्हें न जोड़ें" })}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
