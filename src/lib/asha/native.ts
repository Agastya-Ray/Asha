import { Capacitor, registerPlugin } from "@capacitor/core";
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
  speak(o: { text: string; lang: Lang; rate?: number }): Promise<{ ok: boolean }>;
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
}

/** True inside the Android app, false in a web browser. */
export const isNative = Capacitor.isNativePlatform();

export const AshaNative = registerPlugin<AshaNativePlugin>("AshaNative");
