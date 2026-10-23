import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, t } from "@/components/asha/bits";
import { sendError } from "@/components/asha/family-parts";
import { photoUrl, sendMedPhoto, useFamily, type CircleInfo } from "@/lib/asha/family";
import { photoToJpeg, putPhoto } from "@/lib/asha/photos";
import { useAsha } from "@/lib/asha/store";

/** Family side: add a photo for each of the elder's medicines. Her phone asks her before using it. */
export function FamilyMedPhotos({ circle }: { circle: CircleInfo }) {
  const lang = useAsha((s) => s.lang);
  const label = circle.label || "Maa";
  const meds = circle.meds ?? [];
  const input = useRef<HTMLInputElement>(null);
  const [forMed, setForMed] = useState("");
  const [note, setNote] = useState<Record<string, string>>({});
  if (!meds.length) return null;

  async function pick(file: File | undefined) {
    const medId = forMed;
    if (!file || !medId) return;
    setNote((n) => ({ ...n, [medId]: t(lang, { en: "Sending…", hi: "भेज रहे हैं…" }) }));
    try {
      const r = await sendMedPhoto(medId, await photoToJpeg(file), circle.id);
      setNote((n) => ({
        ...n,
        [medId]: r.ok
          ? lang === "hi"
            ? `भेज दी. ${label} के फ़ोन पर पूछा जाएगा कि यही दवा है या नहीं.`
            : `Sent. ${label}'s phone will ask them if it's the right one before using it.`
          : r.error === "blocked"
            ? t(lang, {
                en: "Only a photo of the medicine itself can be sent: the strip, tablets, bottle or box.",
                hi: "सिर्फ़ दवा की फ़ोटो भेजी जा सकती है: पत्ता, गोलियाँ, शीशी या डिब्बा.",
              })
            : sendError(r, lang),
      }));
    } catch {
      setNote((n) => ({
        ...n,
        [medId]: t(lang, {
          en: "That photo did not open. Try again.",
          hi: "वह फ़ोटो नहीं खुली. फिर कोशिश करें.",
        }),
      }));
    }
  }

  return (
    <Card className="mt-4">
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void pick(e.target.files?.[0])}
      />
      <p className="text-lg font-bold">
        {t(lang, { en: `Photos of ${label}'s medicines`, hi: `${label} की दवाओं की फ़ोटो` })}
      </p>
      <p className="mt-1 text-base text-quiet">
        {t(lang, {
          en: "At reminder time the photo fills the screen, so there's no doubt which one to take.",
          hi: "याद के समय फ़ोटो पूरी स्क्रीन पर दिखती है, ताकि कौन सी लेनी है इसमें कोई शक न रहे.",
        })}
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {meds.map((m) => (
          <li key={m.id} className="rounded-2xl bg-linen p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 text-lg font-bold">
                {m.name} <span className="font-normal text-quiet">{m.dose}</span>
              </p>
              <button
                type="button"
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-paper px-3 font-bold text-sage"
                onClick={() => {
                  setForMed(m.id);
                  input.current?.click();
                }}
              >
                <Camera className="size-5" aria-hidden />
                {t(lang, { en: "Add photo", hi: "फ़ोटो" })}
              </button>
            </div>
            {note[m.id] ? <p className="mt-1 text-base">{note[m.id]}</p> : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}

const DECIDED = "asha.photoOffers.v1";
function decided(): number[] {
  try {
    return JSON.parse(localStorage.getItem(DECIDED) ?? "[]") as number[];
  } catch {
    return [];
  }
}
function decide(id: number) {
  try {
    localStorage.setItem(DECIDED, JSON.stringify([...decided(), id].slice(-100)));
  } catch {
    /* asked again next time */
  }
}

/** Elder side: "Priya added a photo of your Metformin. Is this it?" Nothing is used until she says yes. */
export function FamilyPhotoOffer() {
  const lang = useAsha((s) => s.lang);
  const meds = useAsha((s) => s.meds);
  const setMedPhoto = useAsha((s) => s.setMedPhoto);
  const messages = useFamily((s) => s.messages);
  const [, bump] = useState(0);
  const [url, setUrl] = useState<{ id: number; url: string | null } | null>(null);
  const done = new Set(decided());
  const offer = messages.find(
    (m) =>
      m.kind === "photo" &&
      m.photo &&
      !m.mine &&
      !done.has(m.id) &&
      meds.some((x) => x.id === m.template),
  );
  const offerId = offer?.id;
  useEffect(() => {
    if (offerId === undefined) return;
    let live = true;
    void photoUrl(offerId).then((u) => live && setUrl({ id: offerId, url: u }));
    return () => {
      live = false;
    };
  }, [offerId]);
  if (!offer) return null;
  const med = meds.find((x) => x.id === offer.template)!;
  const from = (lang === "hi" ? offer.hi : offer.en).replace(/^📷\s*/, "");
  const close = () => {
    decide(offer.id);
    bump((n) => n + 1);
  };

  return (
    <Card className="mt-5">
      <p className="text-xl font-bold">{from}</p>
      {url?.id === offer.id && url.url ? (
        <img
          src={url.url}
          alt={med.name}
          className="mt-3 mx-auto aspect-square w-full max-w-72 rounded-3xl object-cover"
        />
      ) : (
        <div className="mt-3 mx-auto aspect-square w-full max-w-72 animate-pulse rounded-3xl bg-linen" />
      )}
      <p className="mt-3 text-lg">
        {lang === "hi" ? `क्या यही आपकी ${med.name} है?` : `Is this your ${med.name}?`}
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <Button
          disabled={!url?.url}
          onClick={async () => {
            try {
              const blob = await (await fetch(url!.url!)).blob();
              await putPhoto(med.id, await photoToJpeg(blob));
              const name = from.split(/\s(added|ने)\s/)[0];
              setMedPhoto(med.id, Date.now(), name);
            } catch {
              /* try again next time */
              return;
            }
            close();
          }}
        >
          {t(lang, { en: "Yes, use this photo", hi: "हाँ, यही फ़ोटो रखें" })}
        </Button>
        <Button variant="quiet" onClick={close}>
          {t(lang, { en: "No, that's not it", hi: "नहीं, यह नहीं है" })}
        </Button>
      </div>
    </Card>
  );
}
