import { useEffect } from "react";
import { App } from "@capacitor/app";
import { t } from "@/components/asha/bits";
import { FairyScene } from "@/components/asha/fairy";
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

/** The little fairy that floats above the tabs when a family message is waiting. */
export function FairyDock() {
  const lang = useAsha((s) => s.lang);
  const voiceLang = useAsha((s) => s.voiceLang);
  const rich = useAsha((s) => s.richVoice);
  const tab = useAsha((s) => s.tab);
  const setTab = useAsha((s) => s.setTab);
  const messages = useFamily((s) => s.messages);
  const heardLocal = useFamily((s) => s.heardLocal);
  const speaking = useSpeech((s) => s.active);
  const unread = unreadOf({ messages, heardLocal });
  if (!unread.length || tab === "family" || tab === "sos") return null;
  return (
    <div className={`fairy-dock fixed right-3 z-30 flex items-end gap-2 ${speaking ? "fairy-dock-up" : ""}`}>
      <div className="mb-6 max-w-[11rem] rounded-2xl rounded-br-sm border border-line bg-paper px-3 py-2 text-base font-bold shadow-sm">
        {lang === "hi" ? `${unread.length} प्यार भरा संदेश! मुझे छुएँ` : `${unread.length} love note${unread.length > 1 ? "s" : ""}! Tap me`}
      </div>
      <FairyScene
        news
        size="md"
        label={t(lang, { en: "Hear family messages", hi: "परिवार के संदेश सुनें" })}
        onTap={() => {
          void speak([...unread].reverse().map((m) => textOf(m, voiceLang)).join(" ... "), voiceLang, rich ? "warm" : "device");
          void markHeard(unread.map((m) => m.id));
          setTab("family");
        }}
      />
    </div>
  );
}
