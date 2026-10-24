import { useRef } from "react";
import { Camera, Phone } from "lucide-react";
import { t } from "@/components/asha/bits";
import { callNumber } from "@/components/asha/sos";
import { digits } from "@/lib/asha/schedule";
import { faceToJpeg, putFace, useFace } from "@/lib/asha/faces";
import { useAsha } from "@/lib/asha/store";
import type { Contact } from "@/lib/asha/types";

const TINTS = ["#f6d8c8", "#d7ebdf", "#dfe3f6", "#f6e7c4"];

/** A round face photo, or soft initials when there is none. */
export function Face({
  person,
  i,
  size = "size-20",
}: {
  person: Contact;
  i: number;
  size?: string;
}) {
  const url = useFace(person.id, person.photoAt);
  const initials = person.name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return url ? (
    <img src={url} alt="" className={`${size} rounded-full object-cover shadow-sm`} />
  ) : (
    <span
      className={`${size} inline-flex items-center justify-center rounded-full text-2xl font-bold text-ink shadow-sm`}
      style={{ background: TINTS[i % TINTS.length] }}
    >
      {initials || "?"}
    </span>
  );
}

/** On Today: big faces of loved ones. One tap calls them. */
export function CallFaces() {
  const lang = useAsha((s) => s.lang);
  const contacts = useAsha((s) => s.contacts);
  const people = contacts.filter((c) => c.name.trim() && digits(c.phone).length >= 6).slice(0, 4);
  if (!people.length) return null;
  return (
    <section
      className="mt-5"
      aria-label={t(lang, { en: "Call your loved ones", hi: "अपनों को फ़ोन करें" })}
    >
      <h2 className="text-2xl font-bold">
        {t(lang, { en: "Call someone", hi: "किसी को फ़ोन करें" })}
      </h2>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {people.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => void callNumber(p.phone)}
            aria-label={lang === "hi" ? `${p.name} को फ़ोन करें` : `Call ${p.name}`}
            className="flex flex-col items-center gap-1 rounded-3xl p-1 active:scale-[0.96]"
          >
            <span className="relative">
              <Face person={p} i={i} />
              <span className="absolute -bottom-1 -right-1 inline-flex size-8 items-center justify-center rounded-full bg-sage text-paper">
                <Phone className="size-4" aria-hidden />
              </span>
            </span>
            <span className="mt-1 w-full truncate text-center text-base font-bold">{p.name}</span>
            {p.relation ? (
              <span className="-mt-1 w-full truncate text-center text-sm text-quiet">
                {p.relation}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}

/** In Settings, beside each loved one: add or change their photo. */
export function FacePicker({ person, i }: { person: Contact; i: number }) {
  const lang = useAsha((s) => s.lang);
  const upsert = useAsha((s) => s.upsertContact);
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="mb-3 flex items-center gap-3">
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            await putFace(person.id, await faceToJpeg(f));
            upsert({ ...person, photoAt: Date.now() });
          } catch {
            /* the photo did not open; the initials stay */
          }
        }}
      />
      <Face person={person} i={i} size="size-16" />
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="inline-flex min-h-11 items-center gap-2 font-bold text-sage"
      >
        <Camera className="size-5" aria-hidden />
        {person.photoAt
          ? t(lang, { en: "Change photo", hi: "फ़ोटो बदलें" })
          : t(lang, { en: "Add their photo", hi: "उनकी फ़ोटो जोड़ें" })}
      </button>
    </div>
  );
}
