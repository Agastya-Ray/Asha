import { useEffect, useRef, useState } from "react";
import { Heart, Mic, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, MicButton, t } from "@/components/asha/bits";
import { cn } from "@/lib/cn";
import {
  type CallFail,
  type FamilyMsg,
  markHeard,
  react,
  sendCustom,
  sendHeart,
  sendPreset,
  sendVoice,
  textOf,
  useFamily,
  voiceUrl,
} from "@/lib/asha/family";
import { useAsha } from "@/lib/asha/store";
import { speak } from "@/lib/asha/voice";
import { fill, type Preset } from "../../../supabase/functions/family/presets";
import { digits } from "@/lib/asha/schedule";

/** Friendly words for server errors. */
export function sendError(r: CallFail, lang: "en" | "hi") {
  if (r.hint) return r.hint[lang];
  const map: Record<string, { en: string; hi: string }> = {
    offline: { en: "No internet right now. Try again when you're online.", hi: "अभी इंटरनेट नहीं है. ऑनलाइन होने पर फिर कोशिश करें." },
    network: { en: "Couldn't reach Asha's server. Try again in a moment.", hi: "आशा के सर्वर तक नहीं पहुँच पाए. थोड़ी देर में फिर कोशिश करें." },
    limit: { en: "That's a lot of messages today. Try again tomorrow — or call! 😊", hi: "आज बहुत संदेश हो गए. कल फिर भेजें — या फ़ोन कर लें! 😊" },
    "pro-only": { en: "Your own words and voice notes are part of Pro.", hi: "अपने शब्द और आवाज़ वाले संदेश प्रो में हैं." },
    "voice-needs-setup": { en: "Voice notes switch on once the safety checker is set up (see README).", hi: "आवाज़ वाले संदेश सुरक्षा जाँच सेट होने पर चालू होंगे." },
    "bad-code": { en: "That code didn't work. Check the 6 digits, or ask for a new code.", hi: "यह कोड नहीं चला. 6 अंक जाँचें, या नया कोड माँगें." },
    "too-many-tries": { en: "Too many tries. Please wait an hour and try again.", hi: "बहुत बार कोशिश हुई. एक घंटे बाद फिर करें." },
    "circle-full": { en: "This family circle is full (12 people).", hi: "यह परिवार भर गया है (12 लोग)." },
  };
  return (map[r.error] ?? { en: "Something went wrong. Try again.", hi: "कुछ गड़बड़ हुई. फिर कोशिश करें." })[lang];
}

function ago(iso: string, lang: "en" | "hi") {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return lang === "hi" ? "अभी" : "just now";
  if (mins < 60) return lang === "hi" ? `${mins} मिनट पहले` : `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return lang === "hi" ? `${h} घंटे पहले` : `${h} h ago`;
  const d = Math.round(h / 24);
  return lang === "hi" ? `${d} दिन पहले` : `${d} days ago`;
}
export { ago };

/** The list of messages, newest first. */
export function Feed({ messages, emptyText }: { messages: FamilyMsg[]; emptyText: string }) {
  const lang = useAsha((s) => s.lang);
  const voiceLang = useAsha((s) => s.voiceLang);
  const rich = useAsha((s) => s.richVoice);
  const role = useAsha((s) => s.appRole);
  const heardLocal = useFamily((s) => s.heardLocal);
  const [playing, setPlaying] = useState<number | null>(null);

  if (!messages.length) {
    return (
      <Card className="mt-3">
        <p className="text-lg text-quiet">{emptyText}</p>
      </Card>
    );
  }

  async function playVoice(id: number) {
    setPlaying(id);
    const url = await voiceUrl(id);
    if (!url) {
      setPlaying(null);
      return;
    }
    const a = new Audio(url);
    a.onended = () => setPlaying(null);
    a.onerror = () => setPlaying(null);
    void a.play().catch(() => setPlaying(null));
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      {messages.map((m) => {
        const urgent = m.kind === "alert";
        const update = m.kind === "status" || m.kind === "digest" || m.kind === "nudge";
        const isNew = !m.mine && !m.heardAt && !heardLocal.includes(m.id);
        return (
          <div
            key={m.id}
            className={cn(
              "rounded-3xl border px-4 py-3",
              m.mine ? "ml-8 border-sage-soft bg-sage-soft" : urgent ? "border-sos bg-sos-soft" : update ? "border-line bg-linen" : "mr-6 border-line bg-paper",
              isNew && !urgent ? "ring-2 ring-sage/40" : "",
            )}
          >
            <p className={cn("text-lg", urgent && "font-bold")}>{textOf(m, lang)}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-quiet">
              <span>{ago(m.at, lang)}</span>
              {m.mine && m.heardAt ? <span className="font-bold text-sage">· {t(lang, { en: "seen ✓", hi: "देख लिया ✓" })}</span> : null}
              {m.reaction ? <span className="text-base">· {m.reaction}</span> : null}
              {!m.mine ? (
                <>
                  <button
                    type="button"
                    className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-full border border-line bg-paper px-3 font-bold text-ink"
                    onClick={() => {
                      void speak(textOf(m, voiceLang), voiceLang, rich ? "warm" : "device");
                      void markHeard([m.id]);
                    }}
                  >
                    <Volume2 className="size-4" aria-hidden />
                    {t(lang, { en: "Hear", hi: "सुनें" })}
                  </button>
                  {m.voice ? (
                    <button
                      type="button"
                      className="inline-flex min-h-11 items-center gap-1 rounded-full border border-line bg-paper px-3 font-bold text-ink"
                      onClick={() => void playVoice(m.id)}
                    >
                      🎙 {playing === m.id ? t(lang, { en: "Playing…", hi: "चल रहा…" }) : t(lang, { en: "Play voice", hi: "आवाज़ सुनें" })}
                    </button>
                  ) : null}
                  {!m.reaction && (m.kind !== "nudge" || role === "family") ? (
                    <button
                      type="button"
                      aria-label={t(lang, { en: "Send a heart back", hi: "दिल वापस भेजें" })}
                      className="inline-flex min-h-11 items-center gap-1 rounded-full border border-line bg-paper px-3 font-bold text-sos"
                      onClick={() => void react(m.id)}
                    >
                      <Heart className="size-4" aria-hidden />
                    </button>
                  ) : null}
                </>
              ) : m.voice ? (
                <button type="button" className="ml-auto min-h-11 font-bold text-sage" onClick={() => void playVoice(m.id)}>
                  🎙 {t(lang, { en: "Play", hi: "सुनें" })}
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Ready-made messages, grouped. Pick one, then send in Asha or on WhatsApp. */
export function PresetPicker({
  presets,
  groups,
  vars,
  whatsappTo,
  onSent,
}: {
  presets: Preset[];
  groups: { id: string; label: { en: string; hi: string } }[];
  vars: Record<string, string>;
  whatsappTo?: string;
  onSent?: () => void;
}) {
  const lang = useAsha((s) => s.lang);
  const [group, setGroup] = useState(groups[0]?.id ?? "");
  const [picked, setPicked] = useState<Preset | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const list = presets.filter((p) => p.group === group);

  async function send() {
    if (!picked) return;
    setBusy(true);
    setNote("");
    const r = await sendPreset(picked.id);
    setBusy(false);
    if (r.ok) {
      setNote(t(lang, { en: "Sent with love 💌", hi: "प्यार से भेज दिया 💌" }));
      setPicked(null);
      onSent?.();
    } else setNote(sendError(r, lang));
  }

  const waText = picked ? fill(picked.text[lang], vars) : "";
  const waHref = `https://wa.me/${digits(whatsappTo ?? "")}?text=${encodeURIComponent(waText)}`;

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => {
              setGroup(g.id);
              setPicked(null);
            }}
            className={cn("min-h-11 shrink-0 rounded-full border px-4 font-bold", group === g.id ? "border-sage bg-sage text-paper" : "border-line bg-paper")}
          >
            {g.label[lang]}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {list.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={picked?.id === p.id}
            onClick={() => setPicked(picked?.id === p.id ? null : p)}
            className={cn("rounded-2xl border px-4 py-3 text-left text-lg", picked?.id === p.id ? "border-sage bg-sage-soft" : "border-line bg-paper")}
          >
            {fill(p.text[lang], vars)}
          </button>
        ))}
      </div>
      {picked ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button onClick={() => void send()} disabled={busy}>
            {busy ? t(lang, { en: "Sending…", hi: "भेज रहे…" }) : t(lang, { en: "Send in Asha", hi: "आशा से भेजें" })}
          </Button>
          <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-line bg-paper px-3 text-center text-lg font-bold">
            {t(lang, { en: "WhatsApp", hi: "व्हाट्सऐप" })}
          </a>
        </div>
      ) : null}
      {note ? <p className="mt-2 text-base text-sage">{note}</p> : null}
    </div>
  );
}

export function HeartButton() {
  const lang = useAsha((s) => s.lang);
  const [state, setState] = useState<"" | "busy" | "sent">("");
  const [error, setError] = useState("");
  return (
    <div>
      <button
        type="button"
        disabled={state === "busy"}
        onClick={async () => {
          setState("busy");
          setError("");
          const r = await sendHeart();
          if (r.ok) {
            setState("sent");
            if (navigator.vibrate) navigator.vibrate(60);
            window.setTimeout(() => setState(""), 2500);
          } else {
            setState("");
            setError(sendError(r, lang));
          }
        }}
        className={cn(
          "flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl text-xl font-bold transition-transform active:scale-[0.97]",
          state === "sent" ? "bg-sos-soft text-sos" : "bg-sos text-paper",
        )}
      >
        <Heart className={cn("size-7", state === "sent" && "fill-current")} aria-hidden />
        {state === "sent" ? t(lang, { en: "Heart sent!", hi: "दिल भेज दिया!" }) : t(lang, { en: "Thinking of you ❤️", hi: "आपकी याद आई ❤️" })}
      </button>
      {error ? <p className="mt-2 text-base text-clay">{error}</p> : null}
    </div>
  );
}

/** Pro: your own words, checked before sending. */
export function CustomComposer() {
  const lang = useAsha((s) => s.lang);
  const pro = useAsha((s) => s.pro);
  const caps = useFamily((s) => s.caps);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  if (!pro) {
    return (
      <p className="text-base text-quiet">
        {t(lang, { en: "Writing your own words and voice notes is part of Pro (Settings → Pro).", hi: "अपने शब्द और आवाज़ वाले संदेश प्रो में हैं (सेटिंग → प्रो)." })}
      </p>
    );
  }
  return (
    <div>
      <div className="flex items-start gap-2">
        <textarea
          className="field min-h-20"
          maxLength={200}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t(lang, { en: "Write something kind…", hi: "कुछ प्यार भरा लिखें…" })}
        />
        <MicButton onText={(s) => setText((v) => (v ? `${v} ${s}` : s).slice(0, 200))} />
      </div>
      <p className="mt-1 text-sm text-quiet">
        {text.length}/200 ·{" "}
        {caps.ai
          ? t(lang, { en: "Checked for safety and translated before it's sent.", hi: "भेजने से पहले सुरक्षा जाँच और अनुवाद होता है." })
          : t(lang, { en: "Checked for safety before it's sent.", hi: "भेजने से पहले सुरक्षा जाँच होती है." })}
      </p>
      <div className="mt-2">
        <Button
          variant="quiet"
          disabled={busy || !text.trim()}
          onClick={async () => {
            setBusy(true);
            setNote(null);
            const r = await sendCustom(text);
            setBusy(false);
            if (r.ok) {
              setText("");
              setNote({ ok: true, text: t(lang, { en: "Sent 💌", hi: "भेज दिया 💌" }) });
            } else setNote({ ok: false, text: sendError(r, lang) });
          }}
        >
          {busy ? t(lang, { en: "Checking…", hi: "जाँच रहे…" }) : t(lang, { en: "Send my words", hi: "मेरे शब्द भेजें" })}
        </Button>
      </div>
      {note ? <p className={cn("mt-2 text-base", note.ok ? "text-sage" : "text-clay")}>{note.text}</p> : null}
    </div>
  );
}

const MAX_SECONDS = 20;

function pickMime() {
  const options = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4", "audio/webm"];
  if (typeof MediaRecorder === "undefined") return "";
  return options.find((m) => MediaRecorder.isTypeSupported?.(m)) ?? "";
}

function blobToBase64(b: Blob) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = reject;
    r.readAsDataURL(b);
  });
}

/** Pro: a 20-second voice note. Press to start, press to stop. */
export function VoiceNote() {
  const lang = useAsha((s) => s.lang);
  const pro = useAsha((s) => s.pro);
  const caps = useFamily((s) => s.caps);
  const [state, setState] = useState<"idle" | "rec" | "sending">("idle");
  const [secs, setSecs] = useState(0);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const tick = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearInterval(tick.current), []);
  if (!pro || typeof MediaRecorder === "undefined") return null;
  if (!caps.ai) {
    return (
      <p className="text-sm text-quiet">
        {t(lang, { en: "🎙 Voice notes will switch on once the safety checker is set up.", hi: "🎙 आवाज़ वाले संदेश सुरक्षा जाँच सेट होने पर चालू होंगे." })}
      </p>
    );
  }

  async function start() {
    setNote(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickMime();
      const r = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : undefined);
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      r.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        window.clearInterval(tick.current);
        setState("sending");
        const blob = new Blob(chunks, { type: r.mimeType || mime || "audio/webm" });
        const b64 = await blobToBase64(blob);
        const res = await sendVoice(b64, blob.type);
        setState("idle");
        setSecs(0);
        setNote(res.ok ? { ok: true, text: t(lang, { en: "Voice note sent 💌", hi: "आवाज़ वाला संदेश भेज दिया 💌" }) } : { ok: false, text: sendError(res, lang) });
      };
      rec.current = r;
      r.start();
      setState("rec");
      setSecs(0);
      const began = Date.now();
      tick.current = window.setInterval(() => {
        const s = Math.floor((Date.now() - began) / 1000);
        setSecs(s);
        if (s >= MAX_SECONDS && r.state === "recording") r.stop();
      }, 250);
    } catch {
      setNote({ ok: false, text: t(lang, { en: "Microphone not allowed. Allow it in phone settings.", hi: "माइक की अनुमति नहीं. फ़ोन सेटिंग में दें." }) });
    }
  }

  return (
    <div className="mt-3">
      <Button
        variant={state === "rec" ? "sos" : "quiet"}
        disabled={state === "sending"}
        onClick={() => (state === "rec" ? rec.current?.stop() : void start())}
      >
        {state === "rec" ? <Square className="size-5" aria-hidden /> : <Mic className="size-5" aria-hidden />}
        {state === "rec"
          ? t(lang, { en: `Recording ${secs}s / ${MAX_SECONDS}s — press to send`, hi: `रिकॉर्ड ${secs} / ${MAX_SECONDS} सेकंड — भेजने के लिए दबाएँ` })
          : state === "sending"
            ? t(lang, { en: "Checking and sending…", hi: "जाँच कर भेज रहे…" })
            : t(lang, { en: "Record a voice note (20 sec)", hi: "आवाज़ वाला संदेश (20 सेकंड)" })}
      </Button>
      {note ? <p className={cn("mt-2 text-base", note.ok ? "text-sage" : "text-clay")}>{note.text}</p> : null}
    </div>
  );
}
