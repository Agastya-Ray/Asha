import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, FieldLabel, Hear, t } from "@/components/asha/bits";
import { Pixie } from "@/components/asha/pixie";
import { daysUntil, deleteRxPhoto, rxDate, rxSpoken, useRxPhoto, visitSoon } from "@/lib/asha/rx";
import { useAsha } from "@/lib/asha/store";

export type RxDraft = { date: string; doctor: string; instructions: string; followUp: string };

/** Under "Check these names": the date, doctor and advice read from the page, to fix before saving. */
export function RxDetailsEditor({
  value,
  onChange,
}: {
  value: RxDraft;
  onChange: (v: RxDraft) => void;
}) {
  const lang = useAsha((s) => s.lang);
  const set = (patch: Partial<RxDraft>) => onChange({ ...value, ...patch });
  return (
    <Card className="mt-4">
      <p className="text-xl font-bold">
        {t(lang, { en: "What the doctor wrote", hi: "डॉक्टर ने क्या लिखा" })}
      </p>
      <p className="mt-1 text-base text-quiet">
        {t(lang, {
          en: "Asha keeps this page with its date, so she can tell you what the doctor said. Fix anything misread.",
          hi: "आशा यह पर्ची उसकी तारीख के साथ रखेगी, ताकि बता सके डॉक्टर ने क्या कहा. कुछ गलत पढ़ा हो तो ठीक करें.",
        })}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label>
          <FieldLabel>{t(lang, { en: "Date on the page", hi: "पर्ची की तारीख" })}</FieldLabel>
          <input
            type="date"
            className="field"
            value={value.date}
            onChange={(e) => set({ date: e.target.value })}
          />
        </label>
        <label>
          <FieldLabel>{t(lang, { en: "Next visit", hi: "अगली बार मिलना" })}</FieldLabel>
          <input
            type="date"
            className="field"
            value={value.followUp}
            onChange={(e) => set({ followUp: e.target.value })}
          />
        </label>
      </div>
      <label className="mt-2 block">
        <FieldLabel>{t(lang, { en: "Doctor", hi: "डॉक्टर" })}</FieldLabel>
        <input
          className="field"
          value={value.doctor}
          placeholder={t(lang, { en: "e.g. Dr. Mehta", hi: "जैसे डॉ. मेहता" })}
          onChange={(e) => set({ doctor: e.target.value })}
        />
      </label>
      <label className="mt-2 block">
        <FieldLabel>
          {t(lang, { en: "Doctor's advice, one per line", hi: "डॉक्टर की सलाह, हर पंक्ति में एक" })}
        </FieldLabel>
        <textarea
          className="field min-h-28"
          value={value.instructions}
          placeholder={t(lang, { en: "e.g. Walk 20 minutes a day", hi: "जैसे रोज़ 20 मिनट टहलें" })}
          onChange={(e) => set({ instructions: e.target.value })}
        />
      </label>
    </Card>
  );
}

function RxCard({ id }: { id: string }) {
  const lang = useAsha((s) => s.lang);
  const voiceLang = useAsha((s) => s.voiceLang);
  const p = useAsha((s) => s.prescriptions.find((x) => x.id === id));
  const remove = useAsha((s) => s.removePrescription);
  const [showPhoto, setShowPhoto] = useState(false);
  const [removing, setRemoving] = useState(false);
  const photo = useRxPhoto(showPhoto && p?.hasPhoto ? id : null);
  if (!p) return null;
  const next = p.followUp ? daysUntil(p.followUp) : NaN;
  return (
    <Card>
      <p className="text-xl font-bold">
        {p.date ? rxDate(p.date, lang) : t(lang, { en: "No date", hi: "तारीख नहीं" })}
        {p.doctor ? ` · ${p.doctor}` : ""}
      </p>
      {p.meds.length ? (
        <ul className="mt-2 list-disc pl-5 text-lg">
          {p.meds.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      ) : null}
      {p.instructions.length ? (
        <div className="mt-3 rounded-2xl bg-linen p-3">
          <p className="text-base font-bold text-quiet">
            {t(lang, { en: "The doctor said", hi: "डॉक्टर ने कहा" })}
          </p>
          {p.instructions.map((line) => (
            <p key={line} className="mt-1 text-lg">
              {line}
            </p>
          ))}
        </div>
      ) : null}
      {p.followUp ? (
        <p className={`mt-3 text-lg font-bold ${next >= 0 && next <= 1 ? "text-clay" : ""}`}>
          {t(lang, { en: "Next visit: ", hi: "अगली बार: " })}
          {rxDate(p.followUp, lang, true)}
          {next < 0 ? t(lang, { en: " (passed)", hi: " (बीत गई)" }) : ""}
        </p>
      ) : null}
      {showPhoto && photo ? (
        <img src={photo} alt="" className="mt-3 w-full rounded-2xl border border-line" />
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Hear say={rxSpoken(p, voiceLang)} label={t(lang, { en: "Hear it", hi: "सुनें" })} />
        {p.hasPhoto ? (
          <button
            type="button"
            onClick={() => setShowPhoto((v) => !v)}
            className="min-h-12 rounded-full border border-line px-4 text-base font-bold"
          >
            {showPhoto
              ? t(lang, { en: "Hide the page", hi: "पर्ची छिपाएँ" })
              : t(lang, { en: "See the page", hi: "पर्ची देखें" })}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setRemoving(true)}
          className="min-h-12 rounded-full border border-line px-4 text-base font-bold text-quiet"
        >
          {t(lang, { en: "Remove", hi: "हटाएँ" })}
        </button>
      </div>
      {removing ? (
        <div className="mt-3 rounded-2xl border border-clay bg-clay-soft p-3">
          <p className="text-lg font-bold">
            {t(lang, {
              en: "Remove this prescription? Your medicines stay on the list.",
              hi: "यह पर्ची हटाएँ? आपकी दवाएँ सूची में रहेंगी.",
            })}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              variant="sos"
              onClick={() => {
                remove(p.id);
                void deleteRxPhoto(p.id);
              }}
            >
              {t(lang, { en: "Yes, remove", hi: "हाँ, हटाएँ" })}
            </Button>
            <Button variant="quiet" onClick={() => setRemoving(false)}>
              {t(lang, { en: "Keep it", hi: "रहने दें" })}
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

/** Saved prescriptions on Meds, newest first. */
export function PrescriptionList() {
  const lang = useAsha((s) => s.lang);
  const ids = useAsha((s) => s.prescriptions.map((p) => p.id).join(","));
  if (!ids) return null;
  return (
    <div className="mt-8">
      <h2 className="display text-3xl">{t(lang, { en: "Prescriptions", hi: "पर्चियाँ" })}</h2>
      <p className="mt-1 text-lg text-quiet">
        {t(lang, {
          en: "Ask the fairy “what did the doctor say?” and she reads the newest one.",
          hi: "परी से पूछें “डॉक्टर ने क्या कहा?”, वह सबसे नई पर्ची पढ़ देगी.",
        })}
      </p>
      <div className="mt-3 flex flex-col gap-3">
        {ids.split(",").map((id) => (
          <RxCard key={id} id={id} />
        ))}
      </div>
    </div>
  );
}

/** On Today, the day before and the day of a follow-up visit the doctor asked for. */
export function VisitSoon() {
  const lang = useAsha((s) => s.lang);
  const voiceLang = useAsha((s) => s.voiceLang);
  const list = useAsha((s) => s.prescriptions);
  const p = visitSoon(list);
  if (!p) return null;
  const today = daysUntil(p.followUp) === 0;
  const who = p.doctor || t(lang, { en: "the doctor", hi: "डॉक्टर" });
  const line =
    lang === "hi"
      ? `${today ? "आज" : "कल"} ${who} से मिलना है. पर्ची और दवाएँ साथ ले जाएँ.`
      : `You see ${who} ${today ? "today" : "tomorrow"}. Take this prescription and your medicines along.`;
  const say =
    voiceLang === "hi"
      ? `${today ? "आज" : "कल"} ${p.doctor || "डॉक्टर"} से मिलना है. पर्ची और दवाएँ साथ ले जाइए.`
      : `You see ${p.doctor || "the doctor"} ${today ? "today" : "tomorrow"}. Take the prescription and your medicines along.`;
  return (
    <Card className="mt-5 flex items-center gap-3">
      <Pixie mood="happy" className="h-20 w-16 shrink-0" />
      <div className="min-w-0">
        <p className="text-xl font-bold">{line}</p>
        <div className="mt-2">
          <Hear say={say} label={t(lang, { en: "Hear it", hi: "सुनें" })} />
        </div>
      </div>
    </Card>
  );
}
