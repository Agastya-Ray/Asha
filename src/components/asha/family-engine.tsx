import { useEffect, useState } from "react";
import { App } from "@capacitor/app";
import { t, useNow } from "@/components/asha/bits";
import { FairyScene, type FairyMood } from "@/components/asha/fairy";
import { checkinQuestion, companionNudge, nudgeBubble } from "@/lib/asha/companion";
import { buildAgenda } from "@/lib/asha/schedule";
import { todayKey } from "@/lib/asha/time";
import {
  drainNative,
  markHeard,
  pullInbox,
  pushNativeConfig,
  refreshPushToken,
  refreshState,
  startFamilyWatchers,
  textOf,
  unreadOf,
  updateWidget,
  useFamily,
} from "@/lib/asha/family";
import { AshaNative, isNative } from "@/lib/asha/native";
import { useAsha } from "@/lib/asha/store";
import { speak, useSpeech } from "@/lib/asha/voice";

/** Keeps the Family Circle in sync: on open, on return to the app, and when a push arrives. */
export function FamilyEngine() {
  const hydrated = useAsha((s) => s.hydrated);
  const roleChosen = useAsha((s) => s.roleChosen);
  const role = useAsha((s) => s.appRole);

  useEffect(() => {
    if (!hydrated || !roleChosen) return;
    startFamilyWatchers();
    const sync = async () => {
      await refreshPushToken();
      // only talk to the server when this phone is (or wants to be) in a circle
      const f = useFamily.getState();
      if (role === "family" || f.deviceId) {
        await refreshState();
        await pullInbox();
      }
      void updateWidget();
    };
    void sync();
    const removers: (() => void)[] = [];
    if (isNative) {
      void App.addListener("resume", () => {
        void drainNative().then(() => pullInbox());
      }).then((h) => removers.push(() => void h.remove()));
      // a family message arrived while the app is open
      void AshaNative.addListener("family", () => void drainNative().then(() => pullInbox())).then((h) => removers.push(() => void h.remove()));
      void drainNative();
    }
    const onVis = () => {
      if (document.visibilityState === "visible" && useFamily.getState().circles.length) void pullInbox();
    };
    document.addEventListener("visibilitychange", onVis);
    // turn the floating fairy back on if she was on
    if (isNative && useFamily.getState().bubble) void AshaNative.setBubble({ on: true }).catch(() => undefined);
    return () => {
      removers.forEach((r) => r());
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [hydrated, roleChosen, role]);

  useEffect(() => {
    void pushNativeConfig();
  }, [role]);

  return null;
}

/**
 * The fairy that floats above the tabs: Asha's companion on the phone.
 * She brings family notes (with Chintu), reminds about a medicine or meal that is due or missed,
 * asks "how are you?" once a day, cheers when the doses are done, talks while Asha speaks,
 * and sleeps at night.
 */
export function FairyDock() {
  const lang = useAsha((s) => s.lang);
  const voiceLang = useAsha((s) => s.voiceLang);
  const rich = useAsha((s) => s.richVoice);
  const tab = useAsha((s) => s.tab);
  const setTab = useAsha((s) => s.setTab);
  const name = useAsha((s) => s.name);
  const meds = useAsha((s) => s.meds);
  const meals = useAsha((s) => s.meals);
  const doseLogs = useAsha((s) => s.doseLogs);
  const mealLogs = useAsha((s) => s.mealLogs);
  const snooze = useAsha((s) => s.snooze);
  const checkins = useAsha((s) => s.checkins);
  const wakeTime = useAsha((s) => s.wakeTime);
  const sleepTime = useAsha((s) => s.sleepTime);
  const messages = useFamily((s) => s.messages);
  const heardLocal = useFamily((s) => s.heardLocal);
  const speaking = useSpeech((s) => s.active);
  const now = useNow();
  const [rested, setRested] = useState(readRest);
  const unread = unreadOf({ messages, heardLocal });
  const say = (text: string) => void speak(text, voiceLang, rich ? "warm" : "device");

  if (tab === "family" || tab === "sos") return null;

  let bubble = "";
  let mood: FairyMood | undefined;
  let news = false;
  let onTap = () => {};
  let label = "";
  let kind = "";

  if (unread.length) {
    kind = "news";
    news = true;
    bubble = lang === "hi" ? `${unread.length} प्यार भरा संदेश! मुझे छुएँ` : `${unread.length} love note${unread.length > 1 ? "s" : ""}! Tap me`;
    label = t(lang, { en: "Hear family messages", hi: "परिवार के संदेश सुनें" });
    onTap = () => {
      say([...unread].reverse().map((m) => textOf(m, voiceLang)).join(" ... "));
      void markHeard(unread.map((m) => m.id));
      setTab("family");
    };
  } else {
    const agenda = buildAgenda({ name, lang, voiceLang, meds, meals, doseLogs, mealLogs, snooze }, now);
    const n = companionNudge(agenda, checkins, wakeTime, sleepTime, now);
    const restKey = `${todayKey(now)}|${n.kind}|${doseLogs.filter((l) => l.day === todayKey(now) && l.status === "taken").length}`;
    if (n.kind === "due") {
      kind = n.late ? "missed" : "due";
      bubble = nudgeBubble(n, lang);
      mood = "idle";
      label = t(lang, { en: "Hear the reminder", hi: "याद दिलाना सुनें" });
      onTap = () => {
        say(n.item.say);
        setTab("today");
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
    } else if (n.kind === "checkin" && tab !== "care" && rested !== restKey) {
      kind = "checkin";
      bubble = nudgeBubble(n, lang);
      mood = "happy";
      label = t(lang, { en: "Tell Asha how you feel", hi: "आशा को बताएँ आप कैसी हैं" });
      onTap = () => {
        say(checkinQuestion(voiceLang, name));
        setTab("care");
      };
    } else if (n.kind === "cheer" && rested !== restKey) {
      kind = "cheer";
      bubble = nudgeBubble(n, lang);
      mood = "happy";
      label = t(lang, { en: "Well done", hi: "शाबाश" });
      onTap = () => {
        say(bubble);
        saveRest(restKey);
        setRested(restKey);
      };
    } else return null;
  }

  // on Today the reminder card already says it, so she stays small and quiet there and does not cover it
  const quiet = tab === "today" && (kind === "due" || kind === "missed");
  return (
    <div data-fairy={kind} className={`fairy-dock fixed right-3 z-30 flex items-end gap-2 ${speaking ? "fairy-dock-up" : ""}`}>
      {quiet ? null : <div className="mb-6 max-w-[11rem] rounded-2xl rounded-br-sm border border-line bg-paper px-3 py-2 text-base font-bold shadow-sm">{bubble}</div>}
      <FairyScene news={news} mood={mood} size={quiet ? "sm" : "md"} label={quiet ? `${label}: ${bubble}` : label} onTap={onTap} />
    </div>
  );
}

const REST_KEY = "asha.fairy.rest";
function readRest() {
  try {
    return localStorage.getItem(REST_KEY) ?? "";
  } catch {
    return "";
  }
}
function saveRest(v: string) {
  try {
    localStorage.setItem(REST_KEY, v);
  } catch {
    /* private mode */
  }
}
