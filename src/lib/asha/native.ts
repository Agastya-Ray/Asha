import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";
import type { Lang } from "@/lib/asha/types";

/** Reminder sent to the phone. It repeats every day at hour:minute until changed. */
export type NativeReminder = {
  key: string;
  hour: number;
  minute: number;
  /** Calendar.DAY_OF_WEEK values (1 = Sunday) it rings on; missing means every day */
  days?: number[];
  kind: "med" | "meal" | "greet";
  title: string;
  body: string;
  say: string;
  again?: string;
  /** said on the last repeat instead of `again` */
  lastAgain?: string;
  lang: Lang;
  skipUntil?: number;
  missedText?: string;
  alertTimeEn?: string;
  alertTimeHi?: string;
  doneLabel?: string;
  snoozeLabel?: string;
  againLabel?: string;
  /** a one-off reminder: rings once at this time (ms), never again */
  onceAt?: number;
};

export type NativeConfig = {
  speak: boolean;
  repeats: number;
  repeatMinutes: number;
  snoozeMinutes: number;
  rate: number;
};

export type NativeStatus = {
  exactAlarms: boolean;
  notifications: boolean;
  batteryFree: boolean;
  phone: boolean;
  microphone: boolean;
  speechInput: boolean;
  /** the fairy is the phone's live wallpaper (home and/or lock screen) */
  wallpaper?: boolean;
  /** "Display over other apps" is allowed (the floating fairy) */
  overlay?: boolean;
  /** she may open full screen at reminder time (Android 14+ has a switch for it) */
  fullScreen?: boolean;
  /** Android API level */
  sdk?: number;
};

interface AshaNativePlugin {
  speak(o: { text: string; lang: Lang; rate?: number; pitch?: number }): Promise<{ ok: boolean }>;
  stopSpeaking(): Promise<void>;
  listen(o: { lang: Lang }): Promise<{ text: string; error?: number }>;
  stopListening(): Promise<void>;
  setReminders(o: { items: NativeReminder[]; config: NativeConfig }): Promise<{ ok: boolean }>;
  drainActions(): Promise<{ actions: { key: string; action: string; at: number; day?: string }[] }>;
  status(): Promise<NativeStatus>;
  requestNotifications(): Promise<{ ok: boolean }>;
  openExactAlarmSettings(): Promise<void>;
  openBatterySettings(): Promise<void>;
  requestPhone(): Promise<{ ok: boolean }>;
  call(o: { number: string }): Promise<{ direct: boolean }>;
  share(o: { text: string; title?: string }): Promise<void>;
  /** keeps a medicine photo (base64 JPEG) for the reminder notification; empty data removes it */
  savePhoto(o: { id: string; data: string }): Promise<void>;
  // family circle
  getPushToken(): Promise<{ token: string }>;
  setFamilyConfig(o: FamilyNativeConfig): Promise<void>;
  drainFamily(): Promise<{ changed: boolean; openTab?: string }>;
  updateWidget(o: { mood: "idle" | "happy" | "sleep"; text: string; unread: number }): Promise<void>;
  canDrawOverlays(): Promise<{ ok: boolean }>;
  openOverlaySettings(): Promise<void>;
  setBubble(o: { on: boolean }): Promise<{ ok: boolean }>;
  openWallpaper(): Promise<{ ok: boolean }>;
  openFullScreenSettings(): Promise<void>;
  openAppInfo(): Promise<void>;
  addListener(eventName: "family" | "listening", fn: () => void): Promise<PluginListenerHandle>;
  addListener(eventName: "speaking", fn: (e: { on: boolean }) => void): Promise<PluginListenerHandle>;
}

export type FamilyNativeConfig = {
  url: string;
  deviceId: string;
  secret: string;
  role: "elder" | "family";
  lang: Lang;
  voiceLang: Lang;
  voiceOn: boolean;
  quietStart: string;
  quietEnd: string;
  inCircle: boolean;
  poll: boolean;
  lastId: number;
  bubble: boolean;
};

/** True inside the Android app, false in a web browser. */
export const isNative = Capacitor.isNativePlatform();

export const AshaNative = registerPlugin<AshaNativePlugin>("AshaNative");
