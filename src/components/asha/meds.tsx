import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, FieldLabel, SpeakField, t } from "@/components/asha/bits";
import { apiReadPrescription } from "@/lib/asha/api";
import { normTime } from "@/lib/asha/time";
import { newId, useAsha } from "@/lib/asha/store";
import type { Food, Med } from "@/lib/asha/types";

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

  return (
    <Card>
      <FieldLabel>{t(lang, { en: "Medicine name", hi: "दवा का नाम" })}</FieldLabel>
      <SpeakField value={med.name} onChange={(v) => setMed({ ...med, name: v })} placeholder={t(lang, { en: "Metformin", hi: "मेटफॉर्मिन" })} />
      <div className="mt-4">
        <FieldLabel>{t(lang, { en: "How much", hi: "कितनी" })}</FieldLabel>
        <SpeakField value={med.dose} onChange={(v) => setMed({ ...med, dose: v })} placeholder={t(lang, { en: "1 tablet, 500 mg", hi: "1 गोली, 500 mg" })} />
      </div>
      <div className="mt-4">
        <FieldLabel>{t(lang, { en: "Times", hi: "समय" })}</FieldLabel>
        <div className="flex flex-col gap-2">
          {med.times.map((time, index) => (
            <div key={`${time}-${index}`} className="flex gap-2">
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
          onClick={() => setMed({ ...med, times: [...med.times, "20:00"] })}
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
            const raw = e.target.value.trim();
            setMed({ ...med, pillsLeft: raw === "" ? null : Number(raw) });
          }}
        />
        <p className="mt-2 text-base text-quiet">
          {t(lang, { en: "Asha mentions a refill when 7 or fewer are left.", hi: "7 या कम बचें तो आशा रिफिल कहेगी." })}
        </p>
      </div>
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
            const times = med.times.filter(Boolean);
            if (!times.length) {
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

type Draft = Med & { keep: boolean };

export function MedsScreen() {
  const lang = useAsha((s) => s.lang);
  const meds = useAsha((s) => s.meds);
  const removeMed = useAsha((s) => s.removeMed);
  const saveMeds = useAsha((s) => s.saveMeds);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
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
          dose: m.dose || (lang === "hi" ? "खुराक लिखें" : "Add the dose"),
          times: times.length ? times : ["08:00"],
          food,
          note: [m.note, m.days > 0 ? (lang === "hi" ? `${m.days} दिन के लिए` : `For ${m.days} days`) : ""].filter(Boolean).join(" · "),
          pillsLeft: null,
          keep: true,
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

      <div className="mt-5 flex flex-col gap-3">
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
                <p className="mt-1 text-lg">{med.dose}</p>
                <p className="mt-1 text-base text-quiet">
                  {med.times.join(" · ")} · {foodLabel(med.food, lang)}
                </p>
                {med.note ? <p className="mt-2 text-base text-quiet">{med.note}</p> : null}
                {med.pillsLeft !== null ? (
                  <p className="mt-2 text-base font-bold text-clay">
                    {med.pillsLeft} {t(lang, { en: "tablets left in the count", hi: "गोलियाँ गिनती में बची हैं" })}
                  </p>
                ) : null}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button variant="quiet" onClick={() => setEditing(med.id)}>
                    {t(lang, { en: "Change", hi: "बदलें" })}
                  </Button>
                  <Button variant="quiet" onClick={() => removeMed(med.id)}>
                    {t(lang, { en: "Remove", hi: "हटाएँ" })}
                  </Button>
                </div>
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
                  onChange={(e) =>
                    setDrafts((list) => list?.map((d) => (d.id === draft.id ? { ...d, dose: e.target.value } : d)) ?? null)
                  }
                />
                <p className="mt-2 text-base text-quiet">
                  {draft.times.join(" · ")} · {foodLabel(draft.food, lang)}
                </p>
                {draft.note ? <p className="mt-1 text-base text-quiet">{draft.note}</p> : null}
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
                saveMeds(
                chosen.map((d) => ({
                  id: d.id,
                  name: d.name.trim(),
                  dose: d.dose,
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
