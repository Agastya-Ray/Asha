import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, Choice, FieldLabel, t } from "@/components/asha/bits";
import { Pixie, type PixieMood } from "@/components/asha/pixie";
import { PROVIDERS, askOwn, guessProvider, providerOf, useBrain, whyWords, type OwnAi, type ProviderId } from "@/lib/asha/brain";
import { useAsha } from "@/lib/asha/store";
import { speak } from "@/lib/asha/voice";

/**
 * "Titli's brain" in Settings: talk to Titli through your own AI account.
 * Pick a service (or just paste a key and it is recognised), tap "Test and save", and she says hello with it.
 */
export function BrainSettings() {
  const lang = useAsha((s) => s.lang);
  const voiceLang = useAsha((s) => s.voiceLang);
  const voiceOn = useAsha((s) => s.voiceOn);
  const name = useAsha((s) => s.name);
  const me = useAsha((s) => s.fairyName).trim() || "Titli";
  const own = useBrain((s) => s.own);
  const save = useBrain((s) => s.save);
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<ProviderId>(own?.provider ?? "claude");
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  const [model, setModel] = useState(own?.model ?? "");
  const [base, setBase] = useState(own?.base ?? "");
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; words: string; mood: PixieMood; detail?: string } | null>(null);
  const p = providerOf(provider);

  const onKey = (v: string) => {
    setKey(v);
    setResult(null);
    const g = guessProvider(v);
    if (g && g !== provider) {
      setProvider(g);
      setModel("");
    }
  };

  async function pasteKey() {
    try {
      const v = (await navigator.clipboard.readText()).trim();
      if (v) onKey(v);
    } catch {
      /* clipboard not allowed: they can long-press the box and paste */
    }
  }

  async function test(candidate: OwnAi) {
    setBusy(true);
    setResult(null);
    const r = await askOwn(candidate, {
      show: lang,
      say: voiceLang,
      fairy: me,
      context: `Name: ${name || "not given"}. They just connected their own ${providerOf(candidate.provider).name} account so you can talk with them. This is your first hello through it.`,
      turns: [{ role: "user", content: lang === "hi" ? "नमस्ते! क्या तुम मुझे सुन सकती हो?" : "Hello! Can you hear me?" }],
    });
    setBusy(false);
    if (!r.ok) {
      setResult({ ok: false, words: whyWords(r.why, lang, providerOf(candidate.provider).name), mood: "sad", detail: r.detail });
      return false;
    }
    setResult({ ok: true, words: r.reply.show, mood: r.reply.mood });
    if (voiceOn) void speak(r.reply.say, voiceLang, "fairy-phone");
    return true;
  }

  async function testAndSave() {
    const candidate: OwnAi = { provider, key: key.trim() || own?.key || "", model: model.trim(), base: base.trim() };
    if (!candidate.key) return;
    if (await test(candidate)) {
      save(candidate);
      setKey("");
      setOpen(false);
    }
  }

  const masked = own ? `${own.key.slice(0, 6)}…${own.key.slice(-4)}` : "";

  return (
    <div data-brain-settings>
      <h2 className="mt-6 text-2xl font-bold">{t(lang, { en: `${me}'s brain`, hi: `${me} का दिमाग़` })}</h2>
      <p className="mt-2 text-lg text-quiet">
        {own
          ? t(lang, { en: `${me} talks with your own ${providerOf(own.provider).name} account.`, hi: `${me} आपके अपने ${providerOf(own.provider).name} खाते से बात करती है.` })
          : t(lang, {
              en: `${me} uses Asha's free helper. You can connect your own AI account (Claude, ChatGPT, Gemini and more) so she answers with it.`,
              hi: `${me} आशा का मुफ़्त सहायक इस्तेमाल करती है. आप अपना AI खाता (Claude, ChatGPT, Gemini वगैरह) जोड़ सकते हैं, तो वह उससे जवाब देगी.`,
            })}
      </p>

      {result ? (
        <Card className={result.ok ? "mt-3" : "mt-3 border-clay bg-clay-soft"}>
          <div data-brain-result={result.ok ? "ok" : "fail"} className="flex items-center gap-3">
            <Pixie mood={result.mood} className="h-24 w-20 shrink-0" />
            <div className="min-w-0">
              <p className="text-lg font-bold">{result.words}</p>
              {result.ok ? (
                <p className="mt-1 text-base text-quiet">{t(lang, { en: "It works. Saved on this phone.", hi: "चल रहा है. इस फ़ोन पर सहेजा." })}</p>
              ) : result.detail ? (
                <p className="mt-1 break-words text-sm text-quiet">{result.detail}</p>
              ) : null}
            </div>
          </div>
        </Card>
      ) : null}

      {own && !open ? (
        <Card className="mt-3">
          <p className="text-lg font-bold">{providerOf(own.provider).name}</p>
          <p className="mt-1 text-base text-quiet">
            {t(lang, { en: "Key", hi: "चाबी" })}: <span className="font-mono">{masked}</span>
            {own.model ? ` · ${own.model}` : ` · ${providerOf(own.provider).model}`}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <Button variant="quiet" disabled={busy} onClick={() => void test(own)}>
              {busy ? t(lang, { en: "Asking…", hi: "पूछ रही है…" }) : t(lang, { en: `Say hello to ${me}`, hi: `${me} को नमस्ते कहें` })}
            </Button>
            <Button variant="quiet" onClick={() => setOpen(true)}>
              {t(lang, { en: "Change account or key", hi: "खाता या चाबी बदलें" })}
            </Button>
            <Button
              variant="quiet"
              onClick={() => {
                save(null);
                setResult(null);
              }}
            >
              {t(lang, { en: "Remove my key from this phone", hi: "इस फ़ोन से मेरी चाबी हटाएँ" })}
            </Button>
          </div>
        </Card>
      ) : null}

      {!own && !open ? (
        <div className="mt-3">
          <Button variant="quiet" onClick={() => setOpen(true)}>
            {t(lang, { en: "Use my own AI account", hi: "अपना AI खाता इस्तेमाल करें" })}
          </Button>
        </div>
      ) : null}

      {open ? (
        <Card className="mt-3">
          <p className="text-lg font-bold">{t(lang, { en: "1. Which one do you have?", hi: "1. आपके पास कौन सा है?" })}</p>
          <div className="mt-2 flex flex-col gap-2">
            {PROVIDERS.map((x) => (
              <Choice
                key={x.id}
                selected={provider === x.id}
                title={x.name}
                detail={t(lang, x.cost)}
                onClick={() => {
                  setProvider(x.id);
                  setModel("");
                  setResult(null);
                  if (x.id === "other") setMore(true);
                }}
              />
            ))}
          </div>

          <p className="mt-5 text-lg font-bold">{t(lang, { en: "2. Get a key", hi: "2. चाबी लें" })}</p>
          <p className="mt-1 text-base text-quiet">
            {t(lang, {
              en: "A key is a long code from your account's website that lets Asha use it. Your Claude Pro or ChatGPT Plus plan does not include one; the key is billed separately by the service, per message.",
              hi: "चाबी आपके खाते की वेबसाइट से मिलने वाला एक लंबा कोड है, जिससे आशा उसे इस्तेमाल कर सके. Claude Pro या ChatGPT Plus में यह शामिल नहीं; सेवा हर संदेश का अलग से पैसा लेती है.",
            })}
          </p>
          {p.keyUrl ? (
            <a
              href={p.keyUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex min-h-12 items-center rounded-2xl border border-line px-4 text-lg font-bold text-sage"
            >
              {t(lang, { en: `Open ${p.name} keys page ↗`, hi: `${p.name} का चाबी पेज खोलें ↗` })}
            </a>
          ) : null}

          <p className="mt-5 text-lg font-bold">{t(lang, { en: "3. Paste it here", hi: "3. यहाँ चिपकाएँ" })}</p>
          <div className="mt-2 flex gap-2">
            <input
              data-brain-key
              className="field min-w-0 flex-1 font-mono"
              type={show ? "text" : "password"}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              value={key}
              placeholder={own ? t(lang, { en: "Leave empty to keep your key", hi: "पुरानी चाबी रखने के लिए खाली छोड़ें" }) : "sk-…"}
              onChange={(e) => onKey(e.target.value)}
            />
            <Button variant="quiet" className="w-auto shrink-0" onClick={() => setShow(!show)}>
              {show ? t(lang, { en: "Hide", hi: "छिपाएँ" }) : t(lang, { en: "Show", hi: "दिखाएँ" })}
            </Button>
          </div>
          <div className="mt-2">
            <Button variant="quiet" onClick={() => void pasteKey()}>
              {t(lang, { en: "📋 Paste what I copied", hi: "📋 जो कॉपी किया, चिपकाएँ" })}
            </Button>
          </div>
          <p className="mt-2 text-base text-quiet">
            {t(lang, {
              en: `The key stays only on this phone and goes only to ${p.name}. Asha's server never sees it.`,
              hi: `चाबी सिर्फ इसी फ़ोन पर रहती है और सिर्फ ${p.name} को जाती है. आशा का सर्वर इसे कभी नहीं देखता.`,
            })}
          </p>

          <button type="button" className="mt-3 min-h-11 text-base font-bold text-sage" onClick={() => setMore(!more)}>
            {more ? t(lang, { en: "▾ Fewer options", hi: "▾ कम विकल्प" }) : t(lang, { en: "▸ More options (model, web address)", hi: "▸ और विकल्प (मॉडल, वेब पता)" })}
          </button>
          {more ? (
            <div className="mt-2 flex flex-col gap-3">
              <div>
                <FieldLabel>{t(lang, { en: "Model name", hi: "मॉडल का नाम" })}</FieldLabel>
                <input data-brain-model className="field font-mono" value={model} placeholder={p.model || "model-name"} onChange={(e) => setModel(e.target.value)} />
              </div>
              {provider === "other" ? (
                <div>
                  <FieldLabel>{t(lang, { en: "Web address (ends in /v1)", hi: "वेब पता (अंत में /v1)" })}</FieldLabel>
                  <input data-brain-base className="field font-mono" value={base} placeholder="https://…/v1" onChange={(e) => setBase(e.target.value)} />
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 flex flex-col gap-2">
            <Button data-brain-save disabled={busy || !(key.trim() || own?.key) || (provider === "other" && (!base.trim() || !model.trim()))} onClick={() => void testAndSave()}>
              {busy ? t(lang, { en: `${me} is trying it…`, hi: `${me} आज़मा रही है…` }) : t(lang, { en: "Test and save", hi: "जाँचें और सहेजें" })}
            </Button>
            <Button
              variant="quiet"
              onClick={() => {
                setOpen(false);
                setKey("");
                setResult(null);
              }}
            >
              {t(lang, { en: "Cancel", hi: "रद्द करें" })}
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
