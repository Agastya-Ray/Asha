export type Lang = "en" | "hi";

export type ConditionId = "arthritis" | "diabetes" | "pcod" | "pcos" | "heart";

export type Food = "before" | "with" | "after" | "anytime";

export type Tab = "today" | "meds" | "care" | "talk" | "sos" | "settings";

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

export type ChatTurn = { role: "user" | "asha"; text: string };

export type AgendaState = "later" | "now" | "open" | "snoozed" | "taken" | "skipped";

export type AgendaItem = {
  key: string;
  kind: "med" | "meal";
  id: string;
  time: string;
  minutes: number;
  title: string;
  detail: string;
  sentence: string;
  state: AgendaState;
};

export type Persist = {
  onboarded: boolean;
  setupStep: 1 | 2 | 3 | 4;
  name: string;
  lang: Lang;
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
  speakOnOpen: boolean;
  keepAwake: boolean;
  reminded: string[];
  snooze: Record<string, number>;
  coachDismissed: boolean;
  sample: boolean;
  chat: ChatTurn[];
};
