import { useEffect, useRef, useState } from "react";
import { Camera, Image as ImageIcon, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, t } from "@/components/asha/bits";
import { FairyGuide } from "@/components/asha/fairy-guide";
import { photoToJpeg, putPhoto, usePhoto } from "@/lib/asha/photos";
import { useAsha } from "@/lib/asha/store";
import type { Med } from "@/lib/asha/types";

/** Two hidden file inputs (camera, gallery) and a function to open either. */
function usePicker(medId: string, onDone?: () => void) {
  const lang = useAsha((s) => s.lang);
  const setMedPhoto = useAsha((s) => s.setMedPhoto);
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  async function pick(file: File | undefined) {
    if (!file) return;
    setError("");
    try {
      await putPhoto(medId, await photoToJpeg(file));
      setMedPhoto(medId, Date.now());
      onDone?.();
    } catch {
      setError(t(lang, { en: "That photo did not open. Try again.", hi: "वह फ़ोटो नहीं खुली. फिर कोशिश करें." }));
    }
  }
  const inputs = (
    <>
      <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void pick(e.target.files?.[0])} />
      <input ref={gallery} type="file" accept="image/*" className="hidden" onChange={(e) => void pick(e.target.files?.[0])} />
    </>
  );
  return { inputs, error, takePhoto: () => camera.current?.click(), choosePhoto: () => gallery.current?.click() };
}

/** The photo itself, or a soft pill shape when there is none yet. */
export function MedPicture({ med, className }: { med: Med; className?: string }) {
  const url = usePhoto(med.id, med.photoAt);
  if (!url) {
    return (
      <div className={`flex items-center justify-center rounded-3xl bg-sage-soft text-sage ${className ?? ""}`}>
        <Pill className="size-1/3" aria-hidden />
      </div>
    );
  }
  return <img src={url} alt={med.name} className={`rounded-3xl object-cover ${className ?? ""}`} />;
}

/** On each medicine card: the photo, or a gentle "add a photo". */
export function MedPhotoRow({ med }: { med: Med }) {
  const lang = useAsha((s) => s.lang);
  const p = usePicker(med.id);
  return (
    <div className="mt-3 flex items-center gap-3">
      {p.inputs}
      <MedPicture med={med} className="size-20 shrink-0" />
      <div className="flex-1">
        {med.photoAt ? (
          <p className="text-base text-quiet">
            {med.photoBy
              ? lang === "hi"
                ? `${med.photoBy} ने फ़ोटो जोड़ी. याद के समय यही दिखेगी.`
                : `Photo added by ${med.photoBy}. It shows at reminder time.`
              : t(lang, { en: "This photo shows at reminder time.", hi: "याद के समय यही फ़ोटो दिखेगी." })}
          </p>
        ) : (
          <p className="text-base text-quiet">
            {t(lang, {
              en: "A photo of the strip or tablet helps you know it's the right one.",
              hi: "पत्ते या गोली की फ़ोटो से सही दवा पहचानना आसान होता है.",
            })}
          </p>
        )}
        <button type="button" onClick={p.takePhoto} className="mt-1 inline-flex min-h-11 items-center gap-2 text-base font-bold text-sage">
          <Camera className="size-5" aria-hidden />
          {med.photoAt ? t(lang, { en: "New photo", hi: "नई फ़ोटो" }) : t(lang, { en: "Take a photo", hi: "फ़ोटो लें" })}
        </button>
        {p.error ? <p className="text-base font-bold text-clay">{p.error}</p> : null}
      </div>
    </div>
  );
}

/**
 * Right after a medicine is saved: the fairy asks for a photo of it. Never required:
 * the medicine may not be at hand yet, so "Later" is always there.
 */
export function PhotoAsk({ medId, onDone }: { medId: string; onDone: () => void }) {
  const lang = useAsha((s) => s.lang);
  const med = useAsha((s) => s.meds.find((m) => m.id === medId));
  const p = usePicker(medId, onDone);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => box.current?.scrollIntoView({ block: "start", behavior: "smooth" }), []);
  if (!med) return null;
  const name = med.name;
  return (
    <div ref={box} className="scroll-mt-24">
      <Card className="mt-4">
        {p.inputs}
        <FairyGuide
          mood="asking"
          line={{
            en: `Shall we take a picture of ${name}? The strip or the tablet you really have. Then I'll show it every time it's due, so there's never a mix-up. Don't have it with you? That's fine, we can do it later.`,
            hi: `${name} की एक फ़ोटो ले लें? वही पत्ता या गोली जो आपके पास है. फिर हर बार समय पर मैं यही दिखाऊँगी, ताकि कोई गड़बड़ न हो. अभी पास नहीं है? कोई बात नहीं, बाद में ले लेंगे.`,
          }}
        />
        <div className="mt-4 flex flex-col gap-2">
          <Button onClick={p.takePhoto}>
            <Camera className="size-5" aria-hidden />
            {t(lang, { en: "Take a photo now", hi: "अभी फ़ोटो लें" })}
          </Button>
          <Button variant="quiet" onClick={p.choosePhoto}>
            <ImageIcon className="size-5" aria-hidden />
            {t(lang, { en: "Choose from gallery", hi: "गैलरी से चुनें" })}
          </Button>
          <Button variant="ghost" onClick={onDone}>
            {t(lang, { en: "Later", hi: "बाद में" })}
          </Button>
          {p.error ? <p className="text-base font-bold text-clay">{p.error}</p> : null}
        </div>
      </Card>
    </div>
  );
}
