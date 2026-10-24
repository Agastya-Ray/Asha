import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, t } from "@/components/asha/bits";
import { Pixie } from "@/components/asha/pixie";
import { apiTts, apiVoices, type VoiceChoice } from "@/lib/asha/api";
import { useAsha } from "@/lib/asha/store";
import { speak, stopSpeaking } from "@/lib/asha/voice";

/** What each voice says when you try it: a real Titli line, so you hear her, not a demo. */
function sampleLine(lang: "en" | "hi", name: string) {
  return lang === "hi"
    ? `नमस्ते${name ? ` ${name} जी` : ""}! मैं तितली हूँ… और मैं हर दिन आपका ख़्याल रखूँगी. क्या आपने अपनी दवा ले ली?`
    : `Hello${name ? `, ${name}` : ""}! I'm Titli… and I'll take care of you, every single day. Did you take your medicine?`;
}

/**
 * "Choose Titli's voice": a few childlike voices from ElevenLabs, each saying the same Titli line.
 * The one you choose is hers from then on; "Phone voice" keeps her free and offline.
 */
export function VoicePicker() {
  const lang = useAsha((s) => s.lang);
  const voiceLang = useAsha((s) => s.voiceLang);
  const name = useAsha((s) => s.name.trim());
  const chosen = useAsha((s) => s.fairyVoice);
  const setFairyVoice = useAsha((s) => s.setFairyVoice);
  const [open, setOpen] = useState(false);
  const [voices, setVoices] = useState<VoiceChoice[] | null>(null);
  const [problem, setProblem] = useState("");
  const [playing, setPlaying] = useState("");
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!open || voices) return;
    setProblem("");
    void apiVoices().then((r) => {
      if (r.ok) setVoices(r.voices);
      else
        setProblem(
          t(lang, {
            en: "Titli's new voices aren't switched on yet, or the internet is off. Her phone voice still works.",
            hi: "तितली की नई आवाज़ें अभी चालू नहीं हैं, या इंटरनेट बंद है. फ़ोन वाली आवाज़ अब भी चलती है.",
          }),
        );
    });
  }, [open]);
  useEffect(() => () => audio.current?.pause(), []);

  async function hear(v: VoiceChoice) {
    audio.current?.pause();
    stopSpeaking();
    setPlaying(v.id);
    // the voice's own sample is free; only a voice without one is asked to say her line (that costs credits)
    const r = v.preview ? null : await apiTts(sampleLine(voiceLang, name), voiceLang, v);
    const src = r?.ok ? `data:audio/mpeg;base64,${r.audio}` : v.preview;
    if (!src) {
      setPlaying("");
      setProblem(t(lang, { en: "That voice didn't load. Try another.", hi: "यह आवाज़ नहीं चली. दूसरी आज़माएँ." }));
      return;
    }
    const a = new Audio(src);
    audio.current = a;
    a.onended = () => setPlaying("");
    a.onerror = () => setPlaying("");
    void a.play().catch(() => setPlaying(""));
  }

  function choose(v: VoiceChoice | null) {
    audio.current?.pause();
    setFairyVoice(v ? { id: v.id, owner: v.owner, name: v.name } : null);
    // she says hello in her new voice
    window.setTimeout(() => void speak(sampleLine(voiceLang, name), voiceLang, "fairy"), 100);
  }

  return (
    <Card className="mt-3">
      <div className="flex items-center gap-3">
        <Pixie mood={playing ? "talk" : "happy"} className="h-20 w-16 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold">{t(lang, { en: "Titli's voice", hi: "तितली की आवाज़" })}</p>
          <p className="text-base text-quiet">
            {chosen ? chosen.name : t(lang, { en: "Phone voice (free, works offline)", hi: "फ़ोन की आवाज़ (मुफ़्त, बिना इंटरनेट)" })}
          </p>
        </div>
      </div>
      {!open ? (
        <div className="mt-3">
          <Button variant="quiet" onClick={() => setOpen(true)}>
            {t(lang, { en: "Choose her voice", hi: "उसकी आवाज़ चुनें" })}
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-base text-quiet">
            {t(lang, {
              en: "Press ▶ to hear each one say hello. Choose the one that feels like her.",
              hi: "हर आवाज़ को नमस्ते कहते सुनने के लिए ▶ दबाएँ. जो उसके जैसी लगे, वह चुनें.",
            })}
          </p>
          {problem ? <p className="text-base font-bold text-clay">{problem}</p> : null}
          {!voices && !problem ? <p className="text-base">{t(lang, { en: "Finding voices…", hi: "आवाज़ें ढूँढ रही हूँ…" })}</p> : null}
          {(voices ?? []).map((v) => {
            const on = chosen?.id === v.id;
            return (
              <div key={v.id} className={`rounded-2xl border p-3 ${on ? "border-sage bg-sage-soft" : "border-line"}`}>
                <p className="text-lg font-bold">
                  {v.name} {on ? "✓" : ""}
                </p>
                {v.about ? <p className="text-sm text-quiet">{v.about}</p> : null}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button variant="quiet" className="min-h-12" onClick={() => void hear(v)}>
                    {playing === v.id ? "…" : `▶ ${t(lang, { en: "Hear her", hi: "सुनें" })}`}
                  </Button>
                  <Button className="min-h-12" disabled={on} onClick={() => choose(v)}>
                    {on ? t(lang, { en: "Chosen", hi: "चुनी गई" }) : t(lang, { en: "Choose", hi: "चुनें" })}
                  </Button>
                </div>
              </div>
            );
          })}
          <div className={`rounded-2xl border p-3 ${!chosen ? "border-sage bg-sage-soft" : "border-line"}`}>
            <p className="text-lg font-bold">
              {t(lang, { en: "Phone voice", hi: "फ़ोन की आवाज़" })} {!chosen ? "✓" : ""}
            </p>
            <p className="text-sm text-quiet">{t(lang, { en: "Free, and works without internet.", hi: "मुफ़्त, और बिना इंटरनेट के चलती है." })}</p>
            <div className="mt-2">
              <Button variant="quiet" className="min-h-12" disabled={!chosen} onClick={() => choose(null)}>
                {!chosen ? t(lang, { en: "Chosen", hi: "चुनी गई" }) : t(lang, { en: "Use the phone voice", hi: "फ़ोन की आवाज़ लें" })}
              </Button>
            </div>
          </div>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t(lang, { en: "Done", hi: "हो गया" })}
          </Button>
        </div>
      )}
    </Card>
  );
}
