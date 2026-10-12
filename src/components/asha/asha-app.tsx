import { useCallback, useEffect, useState } from "react";
import { App as NativeApp } from "@capacitor/app";
import { HeartPulse, Leaf, MessageCircle, Pill, Settings, Sun } from "lucide-react";
import { CareScreen } from "@/components/asha/care";
import { ReminderEngine } from "@/components/asha/engine";
import { MedsScreen } from "@/components/asha/meds";
import { Intro } from "@/components/asha/intro";
import { Onboarding } from "@/components/asha/onboarding";
import { Splash } from "@/components/asha/splash";
import { SettingsScreen } from "@/components/asha/settings";
import { SosScreen } from "@/components/asha/sos";
import { TalkScreen } from "@/components/asha/talk";
import { TodayScreen } from "@/components/asha/today";
import { t, useNow } from "@/components/asha/bits";
import { cn } from "@/lib/cn";
import { isNative } from "@/lib/asha/native";
import { clockLabel, dateLabel } from "@/lib/asha/time";
import { useAsha } from "@/lib/asha/store";
import type { Tab } from "@/lib/asha/types";
import { stopSpeaking, unlockAudio, useSpeech } from "@/lib/asha/voice";

export function AshaApp() {
  const hydrated = useAsha((s) => s.hydrated);
  const hydrate = useAsha((s) => s.hydrate);
  const [splash, setSplash] = useState(true);
  const endSplash = useCallback(() => setSplash(false), []);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return (
    <>
      {hydrated ? <Shell /> : null}
      {splash ? <Splash onDone={endSplash} /> : null}
    </>
  );
}

function Shell() {
  const onboarded = useAsha((s) => s.onboarded);
  const tab = useAsha((s) => s.tab);
  const lang = useAsha((s) => s.lang);
  const introSeen = useAsha((s) => s.introSeen);
  const textSize = useAsha((s) => s.textSize);
  useEffect(() => {
    document.documentElement.lang = lang === "hi" ? "hi" : "en";
  }, [lang]);
  useEffect(() => {
    document.documentElement.dataset.size = textSize;
  }, [textSize]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [tab]);
  // Android back button: go back to Today first, then leave the app.
  useEffect(() => {
    if (!isNative) return;
    let remove: (() => void) | undefined;
    void NativeApp.addListener("backButton", () => {
      const s = useAsha.getState();
      if (s.tab === "settings") s.closeSettings();
      else if (s.tab !== "today" && s.onboarded) s.setTab("today");
      else void NativeApp.minimizeApp();
    }).then((h) => {
      remove = () => void h.remove();
    });
    return () => remove?.();
  }, []);

  return (
    <div className="min-h-dvh bg-linen text-ink" onPointerDown={() => unlockAudio()}>
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
        <Header />
        <main className="flex-1 px-4 pb-36">
          {!introSeen ? (
            <Intro />
          ) : !onboarded ? (
            <Onboarding />
          ) : tab === "meds" ? (
            <MedsScreen />
          ) : tab === "care" ? (
            <CareScreen />
          ) : tab === "talk" ? (
            <TalkScreen />
          ) : tab === "sos" ? (
            <SosScreen />
          ) : tab === "settings" ? (
            <SettingsScreen />
          ) : (
            <TodayScreen />
          )}
        </main>
      </div>
      {onboarded && introSeen ? <Nav /> : null}
      <Speaking />
      <ReminderEngine />
    </div>
  );
}

function Header() {
  const lang = useAsha((s) => s.lang);
  const onboarded = useAsha((s) => s.onboarded);
  const tab = useAsha((s) => s.tab);
  const setTab = useAsha((s) => s.setTab);
  const openSettings = useAsha((s) => s.openSettings);
  const now = useNow();
  return (
    <header className="safe-top sticky top-0 z-20 border-b border-line bg-linen/95 px-4 py-3 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-lg items-center gap-3">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-sage text-paper">
          <Leaf className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="display text-2xl leading-none">Asha</p>
          {onboarded ? (
            <p className="mt-1 truncate text-base text-quiet tabular-nums">
              {dateLabel(lang, now)} · {clockLabel(lang, now)}
            </p>
          ) : (
            <p className="mt-1 text-base text-quiet">{t(lang, { en: "Set up takes a few minutes.", hi: "सेटअप में कुछ मिनट." })}</p>
          )}
        </div>
        {onboarded ? (
          <>
            <button
              type="button"
              aria-label={t(lang, { en: "Settings", hi: "सेटिंग" })}
              onClick={() => openSettings()}
              className={cn(
                "inline-flex size-12 items-center justify-center rounded-full border border-line",
                tab === "settings" ? "bg-sage text-paper" : "bg-paper text-ink",
              )}
            >
              <Settings className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setTab("sos")}
              className={cn(
                "min-h-12 rounded-full px-4 text-lg font-bold",
                tab === "sos" ? "bg-ink text-paper" : "bg-sos text-paper",
              )}
            >
              {t(lang, { en: "Help", hi: "मदद" })}
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
}

const TABS: { id: Tab; en: string; hi: string; icon: typeof Sun }[] = [
  { id: "today", en: "Today", hi: "आज", icon: Sun },
  { id: "meds", en: "Meds", hi: "दवा", icon: Pill },
  { id: "care", en: "Care", hi: "देखभाल", icon: HeartPulse },
  { id: "talk", en: "Talk", hi: "बात", icon: MessageCircle },
];

function Nav() {
  const lang = useAsha((s) => s.lang);
  const tab = useAsha((s) => s.tab);
  const setTab = useAsha((s) => s.setTab);
  return (
    <nav aria-label={lang === "hi" ? "मुख्य" : "Main"} className="dock fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper">
      <div className="mx-auto grid w-full max-w-lg grid-cols-4">
        {TABS.map((item) => {
          const Icon = item.icon;
          const on = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn("flex min-h-16 flex-col items-center justify-center gap-1 text-sm font-bold", on ? "text-sage" : "text-quiet")}
            >
              <Icon className="size-5" aria-hidden />
              {lang === "hi" ? item.hi : item.en}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Speaking() {
  const lang = useAsha((s) => s.lang);
  const active = useSpeech((s) => s.active);
  if (!active) return null;
  return (
    <div className="fixed inset-x-0 bottom-20 z-30 px-4">
      <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-3 text-paper">
        <p className="text-lg">{t(lang, { en: "Asha is speaking", hi: "आशा बोल रही हैं" })}</p>
        <button type="button" onClick={() => stopSpeaking()} className="min-h-11 rounded-xl bg-paper px-4 font-bold text-ink">
          {t(lang, { en: "Stop", hi: "रोकें" })}
        </button>
      </div>
    </div>
  );
}
