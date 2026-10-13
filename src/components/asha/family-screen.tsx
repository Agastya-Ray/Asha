import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, FieldLabel, Hear, t } from "@/components/asha/bits";
import { FairyScene } from "@/components/asha/fairy";
import { CustomComposer, Feed, HeartButton, PresetPicker, VoiceNote, sendError } from "@/components/asha/family-parts";
import { cn } from "@/lib/cn";
import {
  type Consent,
  makeInvite,
  markHeard,
  pullInbox,
  refreshState,
  saveCircle,
  textOf,
  unreadOf,
  updateMember,
  useFamily,
} from "@/lib/asha/family";
import { AshaNative, isNative } from "@/lib/asha/native";
import { useAsha } from "@/lib/asha/store";
import { speak } from "@/lib/asha/voice";
import { FROM_ELDER, GROUPS_FROM_ELDER } from "../../../supabase/functions/family/presets";

const APK = "https://github.com/Agastya-Ray/Asha/releases/latest";

/** Maa's side: create the circle, invite family, read and send love. */
export function FamilyScreen() {
  const lang = useAsha((s) => s.lang);
  const circles = useFamily((s) => s.circles);
  const [loading, setLoading] = useState(!circles.length);

  useEffect(() => {
    let alive = true;
    void refreshState().then(() => {
      if (!alive) return;
      setLoading(false);
      void pullInbox();
    });
    const id = window.setInterval(() => void pullInbox(), 45000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  if (!circles.length) {
    return loading ? (
      <div className="py-10 text-center text-lg text-quiet">{t(lang, { en: "Opening your family circle…", hi: "आपका परिवार खोल रहे हैं…" })}</div>
    ) : (
      <StartCircle />
    );
  }
  return <ElderCircle />;
}

function ConsentForm({ value, onChange }: { value: Consent; onChange: (c: Consent) => void }) {
  const lang = useAsha((s) => s.lang);
  const rows: { key: keyof Consent; en: string; hi: string }[] = [
    { key: "shareMeds", en: "When I take my medicines", hi: "जब मैं दवा लूँ" },
    { key: "shareMeals", en: "When I eat my meals", hi: "जब मैं खाना खाऊँ" },
    { key: "shareMood", en: "How I feel today (from Care)", hi: "आज मैं कैसा महसूस कर रही हूँ (देखभाल से)" },
    { key: "shareMissed", en: "If I miss a medicine after 3 reminders", hi: "3 बार याद दिलाने पर भी दवा छूटे" },
    { key: "nudge", en: "If I haven't opened Asha by 1 pm", hi: "अगर दोपहर 1 बजे तक आशा न खोलूँ" },
  ];
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => (
        <button
          key={r.key}
          type="button"
          aria-pressed={value[r.key]}
          onClick={() => onChange({ ...value, [r.key]: !value[r.key] })}
          className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-2 text-left text-lg"
        >
          <span>{lang === "hi" ? r.hi : r.en}</span>
          <span className={cn("shrink-0 rounded-full px-3 py-1 text-base font-bold", value[r.key] ? "bg-sage text-paper" : "bg-linen text-quiet")}>
            {value[r.key] ? t(lang, { en: "Share", hi: "बताएँ" }) : t(lang, { en: "Private", hi: "निजी" })}
          </span>
        </button>
      ))}
      <FieldLabel>{t(lang, { en: "How often", hi: "कितनी बार" })}</FieldLabel>
      <div className="grid grid-cols-2 gap-2">
        {[false, true].map((d) => (
          <button
            key={String(d)}
            type="button"
            aria-pressed={value.digest === d}
            onClick={() => onChange({ ...value, digest: d })}
            className={cn("min-h-14 rounded-2xl border px-3 text-base font-bold", value.digest === d ? "border-sage bg-sage text-paper" : "border-line bg-paper")}
          >
            {d ? t(lang, { en: "One summary at night", hi: "रात को एक सार" }) : t(lang, { en: "Each time", hi: "हर बार" })}
          </button>
        ))}
      </div>
      <p className="text-base text-quiet">
        {t(lang, {
          en: "Help (SOS) always reaches your family, whatever you choose here.",
          hi: "मदद (SOS) हमेशा परिवार तक पहुँचती है, यहाँ कुछ भी चुनें.",
        })}
      </p>
    </div>
  );
}

function StartCircle() {
  const lang = useAsha((s) => s.lang);
  const name = useAsha((s) => s.name);
  const [label, setLabel] = useState(lang === "hi" ? "माँ" : "Maa");
  const [consent, setConsent] = useState<Consent>({ shareMeds: true, shareMeals: true, shareMood: true, shareMissed: true, digest: false, nudge: true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="py-5">
      <div className="flex items-center gap-4">
        <FairyScene news={false} mood="happy" size="md" />
        <div>
          <h1 className="display text-4xl leading-tight">{t(lang, { en: "Your family circle", hi: "आपका परिवार" })}</h1>
          <p className="mt-1 text-lg text-quiet">{t(lang, { en: "Little notes of love, both ways.", hi: "प्यार भरे छोटे संदेश, दोनों तरफ़." })}</p>
        </div>
      </div>
      <Card className="mt-5">
        <p className="text-lg">
          {t(lang, {
            en: "Your son, daughter or husband installs Asha on their phone and joins with a 6-digit code. Then they can send you sweet messages, and you can send them yours. The fairy brings each one and reads it out.",
            hi: "आपके बेटे, बेटी या पति अपने फ़ोन पर आशा लगाते हैं और 6 अंकों के कोड से जुड़ते हैं. फिर वो आपको प्यार भरे संदेश भेज सकते हैं, और आप उन्हें. परी हर संदेश लाकर पढ़कर सुनाती है.",
          })}
        </p>
      </Card>
      <div className="mt-5">
        <FieldLabel>{t(lang, { en: "What does your family call you?", hi: "परिवार आपको क्या बुलाता है?" })}</FieldLabel>
        <input className="field" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={name || "Maa"} maxLength={30} />
      </div>
      <h2 className="mt-6 text-2xl font-bold">{t(lang, { en: "What may Asha tell them?", hi: "आशा उन्हें क्या बता सकती है?" })}</h2>
      <p className="mt-1 text-base text-quiet">{t(lang, { en: "You decide. Change it any time.", hi: "आप तय करें. कभी भी बदल सकते हैं." })}</p>
      <div className="mt-3">
        <ConsentForm value={consent} onChange={setConsent} />
      </div>
      {error ? <p className="mt-3 text-lg text-clay">{error}</p> : null}
      <div className="mt-5">
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            const r = await saveCircle({ ...consent, label: label.trim() || name });
            setBusy(false);
            if (!r.ok) setError(sendError({ ok: false, error: r.error, status: 0 }, lang));
          }}
        >
          {busy ? t(lang, { en: "Creating…", hi: "बना रहे…" }) : t(lang, { en: "Create my family circle", hi: "मेरा परिवार बनाएँ" })}
        </Button>
      </div>
    </div>
  );
}

function ElderCircle() {
  const lang = useAsha((s) => s.lang);
  const voiceLang = useAsha((s) => s.voiceLang);
  const rich = useAsha((s) => s.richVoice);
  const contacts = useAsha((s) => s.contacts);
  const circle = useFamily((s) => s.circles[0]);
  const members = useFamily((s) => s.members);
  const messages = useFamily((s) => s.messages);
  const heardLocal = useFamily((s) => s.heardLocal);
  const unread = unreadOf({ messages, heardLocal });
  const [inviteBusy, setInviteBusy] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [consent, setConsent] = useState<Consent>({
    shareMeds: circle?.shareMeds ?? true,
    shareMeals: circle?.shareMeals ?? true,
    shareMood: circle?.shareMood ?? true,
    shareMissed: circle?.shareMissed ?? true,
    digest: circle?.digest ?? false,
    nudge: circle?.nudge ?? false,
  });
  const [saved, setSaved] = useState("");
  if (!circle) return null;
  const label = circle.label || "Maa";
  const invite = circle.invite;
  const firstPhone = contacts.find((c) => c.phone.replace(/\D/g, "").length >= 8)?.phone ?? "";

  function readNew() {
    if (!unread.length) {
      void speak(
        voiceLang === "hi" ? "अभी कोई नया संदेश नहीं है. मैं यहीं हूँ." : "No new messages right now. I'm right here.",
        voiceLang,
        rich ? "warm" : "device",
      );
      return;
    }
    const text = [...unread].reverse().map((m) => textOf(m, voiceLang)).join(" ... ");
    void speak(text, voiceLang, rich ? "warm" : "device");
    void markHeard(unread.map((m) => m.id));
  }

  const inviteText = invite
    ? lang === "hi"
      ? `${label} ने आपको आशा परिवार में बुलाया है 💛\n1. आशा ऐप लगाएँ: ${APK}\n2. "मैं परिवार से हूँ" चुनें\n3. यह कोड डालें: ${invite.code}`
      : `${label} invited you to her Asha family circle 💛\n1. Install the Asha app: ${APK}\n2. Choose "I'm family"\n3. Enter this code: ${invite.code}`
    : "";

  return (
    <div className="py-5">
      <div className="flex items-center gap-4">
        <FairyScene news={unread.length > 0} size="lg" onTap={readNew} label={t(lang, { en: "Tap the fairy to hear messages", hi: "संदेश सुनने के लिए परी को छुएँ" })} />
        <div className="min-w-0">
          <h1 className="display text-3xl leading-tight">{t(lang, { en: "Family", hi: "परिवार" })}</h1>
          <p className="mt-1 text-lg">
            {unread.length
              ? lang === "hi"
                ? `${unread.length} नए संदेश! परी को छुएँ.`
                : `${unread.length} new message${unread.length > 1 ? "s" : ""}! Tap the fairy.`
              : t(lang, { en: "Tap the fairy any time.", hi: "परी को कभी भी छुएँ." })}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <HeartButton />
      </div>

      <h2 className="mt-6 text-2xl font-bold">{t(lang, { en: "Messages", hi: "संदेश" })}</h2>
      <Feed
        messages={messages.slice(0, 30)}
        emptyText={t(lang, { en: "No messages yet. Invite your family below — the fairy will bring their notes here.", hi: "अभी कोई संदेश नहीं. नीचे परिवार को बुलाएँ — परी उनके संदेश यहाँ लाएगी." })}
      />

      <h2 className="mt-8 text-2xl font-bold">{t(lang, { en: "Send love", hi: "प्यार भेजें" })}</h2>
      <div className="mt-3">
        <PresetPicker presets={FROM_ELDER} groups={GROUPS_FROM_ELDER} vars={{ from: label, elder: label }} whatsappTo={firstPhone} />
      </div>
      <Card className="mt-4">
        <p className="text-lg font-bold">{t(lang, { en: "In your own words", hi: "अपने शब्दों में" })}</p>
        <div className="mt-2">
          <CustomComposer />
          <VoiceNote />
        </div>
      </Card>

      <h2 className="mt-8 text-2xl font-bold">{t(lang, { en: "Your people", hi: "आपके लोग" })}</h2>
      {members.length === 0 ? (
        <p className="mt-2 text-lg text-quiet">{t(lang, { en: "Nobody has joined yet.", hi: "अभी कोई नहीं जुड़ा." })}</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {members.map((m) => (
            <Card key={m.id}>
              <p className="text-xl font-bold">
                {m.name || "—"} {m.relation ? <span className="text-base font-normal text-quiet">· {m.relation}</span> : null}
              </p>
              {!m.hasPush ? (
                <p className="text-sm text-quiet">{t(lang, { en: "Their phone checks for messages every 15 minutes.", hi: "उनका फ़ोन हर 15 मिनट में संदेश देखता है." })}</p>
              ) : null}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="quiet" onClick={() => void updateMember(m.id, { muted: !m.muted })}>
                  {m.muted ? t(lang, { en: "Unmute", hi: "आवाज़ चालू" }) : t(lang, { en: "Mute", hi: "चुप करें" })}
                </Button>
                <Button variant="quiet" onClick={() => void updateMember(m.id, { remove: true })}>
                  {t(lang, { en: "Remove", hi: "हटाएँ" })}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-4">
        <p className="text-xl font-bold">{t(lang, { en: "Invite someone", hi: "किसी को बुलाएँ" })}</p>
        {invite ? (
          <>
            <p className="mt-2 text-base text-quiet">{t(lang, { en: "Their code (works for 2 days):", hi: "उनका कोड (2 दिन चलेगा):" })}</p>
            <p className="display mt-1 text-5xl tracking-[0.2em] tabular-nums">{invite.code}</p>
            <div className="mt-2">
              <Hear say={invite.code.split("").join(" ")} label={t(lang, { en: "Read the code out", hi: "कोड पढ़कर सुनाएँ" })} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(inviteText)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-sage px-3 text-lg font-bold text-paper"
              >
                WhatsApp
              </a>
              <Button
                variant="quiet"
                onClick={() => (isNative ? void AshaNative.share({ text: inviteText, title: "Asha" }) : void navigator.share?.({ text: inviteText }).catch(() => undefined))}
              >
                <Share2 className="size-5" aria-hidden />
                {t(lang, { en: "Share", hi: "भेजें" })}
              </Button>
            </div>
          </>
        ) : (
          <p className="mt-2 text-lg">{t(lang, { en: "Make a code and send it to your son, daughter or husband.", hi: "कोड बनाएँ और बेटे, बेटी या पति को भेजें." })}</p>
        )}
        <div className="mt-3">
          <Button
            variant={invite ? "ghost" : "primary"}
            disabled={inviteBusy}
            onClick={async () => {
              setInviteBusy(true);
              await makeInvite();
              setInviteBusy(false);
            }}
          >
            {invite ? t(lang, { en: "Make a new code", hi: "नया कोड बनाएँ" }) : t(lang, { en: "Make an invite code", hi: "बुलाने का कोड बनाएँ" })}
          </Button>
        </div>
      </Card>

      <details className="mt-4 rounded-3xl border border-line bg-paper px-4 py-3" open={showConsent} onToggle={(e) => setShowConsent((e.target as HTMLDetailsElement).open)}>
        <summary className="min-h-12 cursor-pointer text-lg font-bold">{t(lang, { en: "What Asha tells your family", hi: "आशा परिवार को क्या बताती है" })}</summary>
        <div className="mt-3">
          <ConsentForm value={consent} onChange={setConsent} />
          <div className="mt-3">
            <Button
              variant="quiet"
              onClick={async () => {
                const r = await saveCircle(consent);
                setSaved(r.ok ? t(lang, { en: "Saved.", hi: "सहेज लिया." }) : t(lang, { en: "Could not save. Try again.", hi: "सहेज नहीं पाए. फिर कोशिश करें." }));
              }}
            >
              {t(lang, { en: "Save", hi: "सहेजें" })}
            </Button>
            {saved ? <p className="mt-2 text-base text-sage">{saved}</p> : null}
          </div>
        </div>
      </details>
    </div>
  );
}
