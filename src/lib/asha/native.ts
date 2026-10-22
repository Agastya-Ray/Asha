import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";
import type { Lang } from "@/lib/asha/types";

/** Reminder sent to the phone. It repeats every day at hour:minute until changed. */
export type NativeReminder = {
  key: string;
  hour: number;
  minute: number;
  kind: "med" | "meal" | "greet";
  title: string;
  body: string;
  say: string;
  again?: string;
  lang: Lang;
  skipUntil?: number;
  missedText?: string;
  alertTimeEn?: string;
  alertTimeHi?: string;
  doneLabel?: string;
  snoozeLabel?: string;
  againLabel?: string;
};

export type NativeConfig = {
  speak: boolean;
  repeats: number;
  repeatMinutes: number;
  snoozeMinutes: number;
  rate: number;
  familyAlert: boolean;
  familyNumbers: string[];
};

export type NativeStatus = {
  exactAlarms: boolean;
  notifications: boolean;
  batteryFree: boolean;
  sms: boolean;
  phone: boolean;
  microphone: boolean;
  speechInput: boolean;
};

interface AshaNativePlugin {
  speak(o: { text: string; lang: Lang; rate?: number; pitch?: number }): Promise<{ ok: boolean }>;
  stopSpeaking(): Promise<void>;
  listen(o: { lang: Lang }): Promise<{ text: string; error?: number }>;
  stopListening(): Promise<void>;
  setReminders(o: { items: NativeReminder[]; config: NativeConfig }): Promise<{ ok: boolean }>;
  drainActions(): Promise<{ actions: { key: string; action: string; at: number }[] }>;
  status(): Promise<NativeStatus>;
  requestNotifications(): Promise<{ ok: boolean }>;
  openExactAlarmSettings(): Promise<void>;
  openBatterySettings(): Promise<void>;
  requestSms(): Promise<{ ok: boolean }>;
  requestPhone(): Promise<{ ok: boolean }>;
  sendSms(o: { numbers: string[]; text: string }): Promise<{ sent: number }>;
  call(o: { number: string }): Promise<{ direct: boolean }>;
  share(o: { text: string; title?: string }): Promise<void>;
  // family circle
  getPushToken(): Promise<{ token: string }>;
  setFamilyConfig(o: FamilyNativeConfig): Promise<void>;
  drainFamily(): Promise<{ changed: boolean; openTab?: string }>;
  updateWidget(o: { mood: "idle" | "happy" | "sleep"; text: string; unread: number }): Promise<void>;
  canDrawOverlays(): Promise<{ ok: boolean }>;
  openOverlaySettings(): Promise<void>;
  setBubble(o: { on: boolean }): Promise<{ ok: boolean }>;
  addListener(eventName: "family" | "listening", fn: () => void): Promise<PluginListenerHandle>;
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
