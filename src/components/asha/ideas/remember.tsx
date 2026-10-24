import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { create } from "zustand";
import { Button } from "@/components/ui/button";
import { Card, MicButton, t } from "@/components/asha/bits";
import { Pixie, type PixieMood } from "@/components/asha/pixie";
import { dueLine, hearMemory, whenChoices, whenWords } from "@/lib/asha/remember";
import { newId, useAsha } from "@/lib/asha/store";
import { todayKey } from "@/lib/asha/time";
import type { Localized } from "@/lib/asha/plans";
import type { Memory } from "@/lib/asha/types";
import { speak } from "@/lib/asha/voice";

type Step = "what" | "when" | "plan" | "saved" | "due" | "after" | "ask";

/** The little conversation she has about remembering something. */
export const useRemember = create<{
  step: Step | null;
  id: string;
  begin: (said: string) => boolean;
  open: (step: Step, id?: string) => void;
  close: () => void;
}>((set) => ({
  step: null,
  id: "",
  /** Hears "remind me…" or a plan. Returns false when it is neither. */
  begin: (said) => {
    const h = hearMemory(said);
    if (!h) return false;
    const m: Memory = {
      id: newId(),
      said: said.trim(),
      what: h.what,
      kind: h.kind,
      day: h.day,
      at: h.kind === "remind" ? h.at : 0,
      eventAt: h.kind === "plan" && h.at ? h.at : undefined,
      createdAt: Date.now(),
      done: false,
    };
    useAsha.getState().remember(m);
    const step: Step = h.kind === "plan" ? "plan" : !m.what ? "what" : !m.at ? "when" : "saved";
    set({ step, id: m.id });
    return true;
  },
  open: (step, id) => set((s) => ({ step, id: id ?? s.id })),
  close: () => set({ step: null }),
}));

const ASK_KEY = "asha.askPlans.v1";

function readAsk(): { day: string; skips: number } {
  try {
    return JSON.parse(localStorage.getItem(ASK_KEY) || "") as { day: string; skips: number };
  } catch {
    return { day: "", skips: 0 };
  }
}

function writeAsk(v: { day: string; skips: number }) {
  try {
    localStorage.setItem(ASK_KEY, JSON.stringify(v));
  } catch {
    /* fine */
  }
}

function Bubble({ mood, children }: { mood: PixieMood; children: React.ReactNode }) {
  const lang = useAsha((s) => s.lang);
  const name = useAsha((s) => s.fairyName);
  const close = useRemember((s) => s.close);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-ink/45" onClick={close} />
      <div className="relative flex w-full max-w-lg items-end gap-2 px-3 pb-6">
        <Pixie mood={mood} className="h-32 w-28 shrink-0" />
        <div className="fi-bubble flex-1 rounded-3xl border-2 border-[#f3c4d0] bg-paper p-4 shadow-lg">
          <p className="text-sm font-bold uppercase tracking-wide text-[#d9506f]">
            {name || t(lang, { en: "Your fairy", hi: "आपकी परी" })}
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}

function useSay(line: Localized | null, deps: unknown[]) {
  const voiceLang = useAsha((s) => s.voiceLang);
  const voiceOn = useAsha((s) => s.voiceOn);
  useEffect(() => {
    if (line && voiceOn) void speak(t(voiceLang, line), voiceLang, "fairy");
  }, deps);
}

function Chip({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-12 rounded-2xl border border-line bg-linen px-3 text-left text-lg font-bold active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

/** "When shall I remind you?": a few choices, or a time of their own. */
function WhenPicker({ m, onPick }: { m: Memory; onPick: (at: number) => void }) {
  const lang = useAsha((s) => s.lang);
  const [time, setTime] = useState("");
  const choices = whenChoices(new Date(), m.day, m.eventAt);
  const own = () => {
    const [h, mi] = time.split(":").map(Number);
    if (!Number.isFinite(h)) return;
    const [y, mo, d] = (m.day || todayKey()).split("-").map(Number);
    let at = new Date(y, mo - 1, d, h, mi || 0).getTime();
    if (at <= Date.now()) at += 86400000;
    onPick(at);
  };
  return (
    <div className="mt-3 flex flex-col gap-2">
      {choices.map((c) => (
        <Chip key={c.at} onClick={() => onPick(c.at)}>
          {t(lang, c)}
        </Chip>
      ))}
      <div className="flex gap-2">
        <input
          type="time"
          className="field flex-1"
          value={time}
          aria-label={t(lang, { en: "Another time", hi: "कोई और समय" })}
          onChange={(e) => setTime(e.target.value)}
        />
        <Button className="shrink-0" disabled={!time} onClick={own}>
          {t(lang, { en: "This time", hi: "यह समय" })}
        </Button>
      </div>
    </div>
  );
}

export function RememberSheet() {
  const lang = useAsha((s) => s.lang);
  const name = useAsha((s) => s.name.trim());
  const pro = useAsha((s) => s.pro);
  const { step, id, open, close } = useRemember();
  const m = useAsha((s) => s.memories.find((x) => x.id === id));
  const update = useAsha((s) => s.updateMemory);
  const forget = useAsha((s) => s.forget);
  const [what, setWhat] = useState("");
  const [after, setAfter] = useState<"" | "good" | "bad">("");

  useMemoryWatch();

  const thing = m?.what || m?.said || "";
  const line: Localized | null = !step
    ? null
    : step === "what"
      ? { en: "Of course! What shall I remind you about?", hi: "ज़रूर! किस बात की याद दिलाऊँ?" }
      : step === "when"
        ? {
            en: `I'll remember: ${thing}. When shall I remind you?`,
            hi: `मैं याद रखूँगी: ${thing}. कब याद दिलाऊँ?`,
          }
        : step === "plan"
          ? {
              en: "Oh, how lovely! Shall I remind you about it?",
              hi: "अरे वाह, कितना अच्छा! क्या मैं आपको याद दिलाऊँ?",
            }
          : step === "saved" && m?.at
            ? {
                en: `Okay! I'll remind you ${whenWords(m.at, "en")}: ${thing}.`,
                hi: `ठीक है! मैं ${whenWords(m.at, "hi")} याद दिलाऊँगी: ${thing}.`,
              }
            : step === "saved"
              ? { en: "Okay, I'll keep it in mind.", hi: "ठीक है, मैं ध्यान रखूँगी." }
              : step === "due"
                ? { en: dueLine("en", name, thing), hi: dueLine("hi", name, thing) }
                : step === "after"
                  ? after === "good"
                    ? {
                        en: "I'm so glad! Thank you for telling me.",
                        hi: "मुझे बहुत खुशी हुई! बताने के लिए शुक्रिया.",
                      }
                    : after === "bad"
                      ? {
                          en: "I'm sorry it wasn't nice. I'm right here if you want to talk.",
                          hi: "मुझे अफ़सोस है. बात करनी हो तो मैं यहीं हूँ.",
                        }
                      : {
                          en: `How did it go? You told me: “${m?.said}”`,
                          hi: `कैसा रहा? आपने बताया था: “${m?.said}”`,
                        }
                  : {
                      en: "Anything planned for tomorrow? Tell me, and I'll remember it for you.",
                      hi: "कल का कुछ प्लान है? बताइए, मैं याद रखूँगी.",
                    };
  useSay(line, [step, id, after]);
  useEffect(() => {
    setWhat("");
    setAfter("");
  }, [step, id]);

  if (!step || (!m && step !== "ask")) return null;
  const pick = (at: number) => {
    update(id, { at, done: false });
    open("saved");
  };

  if (step === "ask")
    return (
      <Bubble mood="asking">
        <p className="mt-1 text-lg leading-snug">{line && t(lang, line)}</p>
        <div className="mt-3 flex gap-2">
          <input
            className="field flex-1"
            value={what}
            placeholder={t(lang, { en: "e.g. Ravi is coming at 4", hi: "जैसे रवि 4 बजे आ रहा है" })}
            onChange={(e) => setWhat(e.target.value)}
          />
          <MicButton onText={(x) => setWhat(x)} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            disabled={!what.trim()}
            onClick={() => {
              const said = /tomorrow|कल/i.test(what)
                ? what
                : `${what} ${lang === "hi" ? "कल" : "tomorrow"}`;
              if (!useRemember.getState().begin(said)) {
                // not a plan in so many words: keep it for tomorrow anyway
                const m2: Memory = {
                  id: newId(),
                  said: what.trim(),
                  what: what.trim(),
                  kind: "plan",
                  day: todayKey(new Date(Date.now() + 86400000)),
                  at: 0,
                  createdAt: Date.now(),
                  done: false,
                };
                useAsha.getState().remember(m2);
                open("plan", m2.id);
              }
            }}
          >
            {t(lang, { en: "Remember it", hi: "याद रखो" })}
          </Button>
          <Button
            variant="quiet"
            onClick={() => {
              const a = readAsk();
              writeAsk({ day: todayKey(), skips: a.skips + 1 });
              close();
            }}
          >
            {t(lang, { en: "Not today", hi: "आज नहीं" })}
          </Button>
        </div>
      </Bubble>
    );
  if (!m) return null;

  if (step === "what")
    return (
      <Bubble mood="asking">
        <p className="mt-1 text-lg leading-snug">{line && t(lang, line)}</p>
        <div className="mt-3 flex gap-2">
          <input
            className="field flex-1"
            value={what}
            placeholder={t(lang, { en: "e.g. call Ravi", hi: "जैसे रवि को फ़ोन करना" })}
            onChange={(e) => setWhat(e.target.value)}
          />
          <MicButton onText={(x) => setWhat(x)} />
        </div>
        <Button
          className="mt-3 w-full"
          disabled={!what.trim()}
          onClick={() => {
            update(id, { what: what.trim() });
            open(m.at ? "saved" : "when");
          }}
        >
          {t(lang, { en: "Next", hi: "आगे" })}
        </Button>
      </Bubble>
    );

  if (step === "when" || step === "plan")
    return (
      <Bubble mood={step === "plan" ? "happy" : "thinking"}>
        <p className="mt-1 text-lg leading-snug">{line && t(lang, line)}</p>
        {step === "plan" ? <p className="mt-1 text-base text-quiet">“{m.said}”</p> : null}
        <WhenPicker m={m} onPick={pick} />
        <button
          type="button"
          className="mt-2 min-h-11 text-base font-bold text-quiet underline"
          onClick={() => {
            if (step === "when") forget(id);
            close();
          }}
        >
          {step === "plan"
            ? t(lang, { en: "No, thank you", hi: "नहीं, शुक्रिया" })
            : t(lang, { en: "Never mind", hi: "रहने दो" })}
        </button>
      </Bubble>
    );

  if (step === "saved")
    return (
      <Bubble mood="happy">
        <p className="mt-1 text-lg leading-snug">{line && t(lang, line)}</p>
        <div className="mt-3 flex flex-col gap-2">
          <Button onClick={close}>{t(lang, { en: "Thank you", hi: "शुक्रिया" })}</Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="quiet" onClick={() => open("when")}>
              {t(lang, { en: "Another time", hi: "कोई और समय" })}
            </Button>
            <Button
              variant="quiet"
              onClick={() => {
                if (m.kind === "plan") update(id, { at: 0 });
                else forget(id);
                close();
              }}
            >
              {t(lang, { en: "Don't remind me", hi: "याद मत दिलाना" })}
            </Button>
          </div>
        </div>
      </Bubble>
    );

  if (step === "due")
    return (
      <Bubble mood="point">
        <p className="mt-1 text-xl font-bold leading-snug">{line && t(lang, line)}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            onClick={() => {
              update(id, { done: true });
              close();
            }}
          >
            {t(lang, { en: "Done ✓", hi: "हो गया ✓" })}
          </Button>
          <Button
            variant="quiet"
            onClick={() => {
              update(id, { at: Date.now() + 10 * 60000 });
              close();
            }}
          >
            {t(lang, { en: "In 10 minutes", hi: "10 मिनट बाद" })}
          </Button>
        </div>
      </Bubble>
    );

  // "after": how was it?
  return (
    <Bubble mood={after === "bad" ? "sad" : after === "good" ? "jump" : "asking"}>
      <p className="mt-1 text-lg leading-snug">{line && t(lang, line)}</p>
      {after ? (
        <div className="mt-3 flex flex-col gap-2">
          {after === "bad" && pro ? (
            <Button
              onClick={() => {
                useAsha.getState().setTab("talk");
                close();
              }}
            >
              {t(lang, { en: "Talk to me", hi: "मुझसे बात करें" })}
            </Button>
          ) : null}
          <Button variant={after === "bad" && pro ? "quiet" : "primary"} onClick={close}>
            {t(lang, { en: "Thank you", hi: "शुक्रिया" })}
          </Button>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button onClick={() => setAfter("good")}>
            {t(lang, { en: "It was lovely 😊", hi: "बहुत अच्छा 😊" })}
          </Button>
          <Button variant="quiet" onClick={() => setAfter("bad")}>
            {t(lang, { en: "Not so good", hi: "कुछ खास नहीं" })}
          </Button>
        </div>
      )}
    </Bubble>
  );
}

/**
 * Every half minute: a reminder that has come due is said once; a plan that has passed gets one "how did it go?";
 * and once an evening she asks about tomorrow's plans (less often if the person keeps saying "not today").
 */
function useMemoryWatch() {
  useEffect(() => {
    const check = () => {
      const r = useRemember.getState();
      const s = useAsha.getState();
      if (r.step || !s.onboarded || !s.tourDone || s.appRole === "family" || s.tab !== "today")
        return;
      // never on top of something else she is showing (a dose reminder comes first): next check
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      const now = Date.now();
      const due = s.memories.find(
        (m) => !m.done && m.at && m.at <= now && now - m.at < 12 * 3600000,
      );
      if (due) return r.open("due", due.id);
      const today = todayKey();
      const past = s.memories.find(
        (m) =>
          m.kind === "plan" &&
          m.day &&
          m.day < today &&
          !m.askedAfter &&
          now - Date.parse(m.day) < 3 * 86400000,
      );
      if (past) {
        s.updateMemory(past.id, { askedAfter: true });
        return r.open("after", past.id);
      }
      const hour = new Date().getHours();
      const a = readAsk();
      const resting = a.skips >= 3 && now - Date.parse(a.day) < 7 * 86400000;
      if (hour >= 17 && hour < 21 && a.day !== today && !resting) {
        writeAsk({ day: today, skips: a.skips >= 3 ? 0 : a.skips });
        r.open("ask");
      }
    };
    const first = window.setTimeout(check, 2500);
    const id = window.setInterval(check, 30000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);
}

/** On Today: what she is keeping in mind, soonest first. */
export function Remembered() {
  const lang = useAsha((s) => s.lang);
  const all = useAsha((s) => s.memories);
  const forget = useAsha((s) => s.forget);
  const today = todayKey();
  const list = all
    .filter((m) => !m.done && (m.at ? m.at > Date.now() - 12 * 3600000 : m.day >= today))
    .sort((a, b) => (a.at || Date.parse(a.day)) - (b.at || Date.parse(b.day)))
    .slice(0, 5);
  if (!list.length) return null;
  return (
    <Card className="mt-5">
      <p className="text-xl font-bold">{t(lang, { en: "I'm remembering", hi: "मुझे याद है" })}</p>
      <ul className="mt-2 flex flex-col gap-2">
        {list.map((m) => (
          <li key={m.id} className="flex items-start gap-2">
            <span className="mt-1 text-lg" aria-hidden>
              {m.at ? "⏰" : "🌼"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-bold">{m.what || m.said}</span>
              <span className="block text-base text-quiet">
                {m.at
                  ? whenWords(m.at, lang)
                  : m.day
                    ? new Date(Date.parse(m.day)).toLocaleDateString(
                        lang === "hi" ? "hi-IN" : "en-GB",
                        { weekday: "long", day: "numeric", month: "short" },
                      )
                    : ""}
              </span>
            </span>
            <button
              type="button"
              aria-label={t(lang, { en: "Forget this", hi: "इसे भूल जाओ" })}
              onClick={() => forget(m.id)}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line"
            >
              <X className="size-5" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
