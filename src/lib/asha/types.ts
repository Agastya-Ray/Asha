export type Lang = "en" | "hi";

export type ConditionId = "arthritis" | "diabetes" | "pcod" | "pcos" | "heart";

export type Food = "before" | "with" | "after" | "anytime";

export type Tab = "today" | "meds" | "care" | "talk" | "family" | "sos" | "settings";

export type AppRole = "elder" | "family";

export type Contact = {
  id: string;
  name: string;
  relation: string;
  phone: string;
};

export type Med = {
  id: string;
  name: string;
  dose: string;
  times: string[];
  food: Food;
  note: string;
  pillsLeft: number | null;
  /** weekdays it is taken on (0 = Sunday … 6 = Saturday); missing or empty means every day */
  days?: number[];
  /** taken only when needed: no reminders, no dose on Today */
  asNeeded?: boolean;
};

export type MealPreset = "breakfast" | "lunch" | "snack" | "dinner";

export type Meal = {
  id: string;
  preset?: MealPreset;
  name: string;
  time: string;
  note: string;
};

export type DoseLog = {
  medId: string;
  time: string;
  day: string;
  status: "taken" | "skipped";
  /** a pill was taken off "tablets left" for this dose (not when the count was already 0), so Undo puts back only that one */
  counted?: boolean;
};

export type MealLog = {
  mealId: string;
  day: string;
};

export type Checkin = {
  day: string;
  fastingSugar?: number;
  afterSugar?: number;
  bpSys?: number;
  bpDia?: number;
  pain?: number;
  mood?: number;
  weightKg?: number;
  swelling?: boolean;
  chestOk?: boolean;
  cycleNote?: string;
  footCheck?: boolean;
  water: number;
};

export type ChatTurn = { role: "user" | "asha"; text: string; say?: string };

export type TextSize = "normal" | "large" | "xl";

export type AgendaState = "later" | "now" | "open" | "snoozed" | "taken" | "skipped";

export type AgendaItem = {
  key: string;
  kind: "med" | "meal";
  id: string;
  time: string;
  minutes: number;
  title: string;
  detail: string;
  /** shown on screen, in the screen language */
  sentence: string;
  /** spoken out loud, in Asha's voice language */
  say: string;
  state: AgendaState;
};

export type Persist = {
  onboarded: boolean;
  setupStep: 1 | 2 | 3 | 4;
  name: string;
  /** language written on screen */
  lang: Lang;
  /** language Asha speaks and listens in */
  voiceLang: Lang;
  introSeen: boolean;
  /** the name the person gave the fairy during the intro ("" until then) */
  fairyName: string;
  /** Titli's chosen ElevenLabs voice; null = her phone voice */
  fairyVoice: { id: string; owner: string; name: string } | null;
  /** the fairy has shown the person round Today once */
  tourDone: boolean;
  /** who uses this phone: the person cared for, or a family member */
  appRole: AppRole;
  roleChosen: boolean;
  textSize: TextSize;
  deviceId: string;
  /** Help: text every loved one automatically (Android, needs SMS permission) */
  sosAutoSms: boolean;
  /** Text family when a medicine reminder goes unanswered three times */
  familyAlert: boolean;
  /** Morning and night spoken greetings */
  dailyGreetings: boolean;
  wakeTime: string;
  sleepTime: string;
  /** quiet mode: the fairy stays silent until this time (ms, 0 = off) */
  quietUntil: number;
  conditions: ConditionId[];
  contacts: Contact[];
  emergencyNumber: string;
  meds: Med[];
  meals: Meal[];
  doseLogs: DoseLog[];
  mealLogs: MealLog[];
  checkins: Checkin[];
  pro: boolean;
  voiceOn: boolean;
  richVoice: boolean;
  fairySounds: boolean;
  speakOnOpen: boolean;
  keepAwake: boolean;
  reminded: string[];
  snooze: Record<string, number>;
  coachDismissed: boolean;
  sample: boolean;
  chat: ChatTurn[];
};
