import { create } from "zustand";
import type {
  ChatTurn,
  Checkin,
  ConditionId,
  Contact,
  Food,
  Lang,
  Med,
  Persist,
  AppRole,
  Tab,
  TextSize,
} from "@/lib/asha/types";
import { defaultMeals, emptyCheckin } from "@/lib/asha/schedule";
import { shiftDay, todayKey } from "@/lib/asha/time";

const KEY = "asha.v1";

export const initialPersist = (): Persist => ({
  onboarded: false,
  setupStep: 1,
  name: "",
  lang: "en",
  voiceLang: "en",
  introSeen: false,
  appRole: "elder",
  roleChosen: false,
  textSize: "normal",
  deviceId: "",
  sosAutoSms: false,
  familyAlert: false,
  dailyGreetings: true,
  wakeTime: "07:30",
  sleepTime: "21:30",
  conditions: [],
  contacts: [],
  emergencyNumber: "",
  meds: [],
  meals: defaultMeals(),
  doseLogs: [],
  mealLogs: [],
  checkins: [],
  pro: false,
  voiceOn: true,
  richVoice: true,
  speakOnOpen: true,
  keepAwake: false,
  reminded: [],
  snooze: {},
  coachDismissed: false,
  sample: false,
  chat: [],
});

type State = Persist & {
  hydrated: boolean;
  tab: Tab;
  returnTab: Tab;
  hydrate: () => void;
  setTab: (tab: Tab) => void;
  openSettings: () => void;
  closeSettings: () => void;
  setLang: (lang: Lang) => void;
  setVoiceLang: (lang: Lang) => void;
  setBothLangs: (lang: Lang) => void;
  setTextSize: (size: TextSize) => void;
  finishIntro: () => void;
  chooseRole: (role: AppRole) => void;
  replayIntro: () => void;
  applyNativeActions: (actions: { key: string; action: string; at: number }[]) => void;
  setName: (name: string) => void;
  toggleCondition: (id: ConditionId) => void;
  setConditions: (ids: ConditionId[]) => void;
  setSetupStep: (step: 1 | 2 | 3 | 4) => void;
  upsertContact: (contact: Contact) => void;
  removeContact: (id: string) => void;
  setEmergency: (value: string) => void;
  setContacts: (contacts: Contact[]) => void;
  saveMed: (med: Med) => void;
  removeMed: (id: string) => void;
  saveMeds: (meds: Med[]) => void;
  updateMeal: (id: string, patch: Partial<{ name: string; time: string; note: string }>) => void;
  logDose: (medId: string, time: string, status: "taken" | "skipped") => void;
  undoDose: (medId: string, time: string) => void;
  logMeal: (mealId: string) => void;
  undoMeal: (mealId: string) => void;
  snoozeKey: (key: string, minutes: number) => void;
  markReminded: (keys: string[]) => void;
  patchCheckin: (patch: Partial<Checkin>) => void;
  addWater: () => void;
  setPrefs: (
    patch: Partial<
      Pick<
        Persist,
        "voiceOn" | "richVoice" | "speakOnOpen" | "keepAwake" | "pro" | "sosAutoSms" | "familyAlert" | "dailyGreetings" | "wakeTime" | "sleepTime"
      >
    >,
  ) => void;
  pushChat: (turn: ChatTurn) => void;
  dismissCoach: () => void;
  finishSetup: () => void;
  loadSample: () => void;
  eraseAll: () => void;
};

function uid() {
  return crypto.randomUUID();
}

function prune(p: Persist): Persist {
  const keepDays = new Set([todayKey(), shiftDay(1)]);
  const reminded = p.reminded.filter((k) => [...keepDays].some((d) => k.startsWith(d)));
  const snooze: Record<string, number> = {};
  const now = Date.now();
  for (const [k, until] of Object.entries(p.snooze)) {
    if (until > now - 3 * 60 * 60 * 1000) snooze[k] = until;
  }
  return {
    ...p,
    reminded,
    snooze,
    doseLogs: p.doseLogs.slice(-400),
    mealLogs: p.mealLogs.slice(-400),
    checkins: p.checkins.slice(-120),
    chat: p.chat.slice(-24),
  };
}

function snapshot(s: State): Persist {
  const base = initialPersist();
  const out = { ...base };
  (Object.keys(base) as (keyof Persist)[]).forEach((k) => {
    (out[k] as Persist[keyof Persist]) = s[k] as Persist[keyof Persist];
  });
  return prune(out);
}

function sanitize(raw: unknown): Persist {
  const base = initialPersist();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<Persist>;
  return {
    ...base,
    ...r,
    lang: r.lang === "hi" ? "hi" : "en",
    voiceLang: r.voiceLang === "hi" ? "hi" : r.voiceLang === "en" ? "en" : r.lang === "hi" ? "hi" : "en",
    textSize: r.textSize === "large" || r.textSize === "xl" ? r.textSize : "normal",
    deviceId: typeof r.deviceId === "string" && r.deviceId ? r.deviceId : uid(),
    // people who used the older version already know Asha
    introSeen: typeof r.introSeen === "boolean" ? r.introSeen : Boolean(r.onboarded),
    appRole: r.appRole === "family" ? "family" : "elder",
    // people who already set up meds are the person cared for
    roleChosen: typeof r.roleChosen === "boolean" ? r.roleChosen : Boolean(r.onboarded),
    conditions: Array.isArray(r.conditions) ? r.conditions.filter(Boolean) : [],
    contacts: Array.isArray(r.contacts) ? r.contacts : [],
    meds: Array.isArray(r.meds)
      ? r.meds
          .filter((m) => m && typeof m === "object" && typeof m.id === "string")
          .map((m) => ({ ...m, name: String(m.name ?? ""), dose: String(m.dose ?? ""), times: Array.isArray(m.times) ? m.times.filter((t) => typeof t === "string") : [] }))
      : [],
    meals: Array.isArray(r.meals) && r.meals.some((m) => m && typeof m.time === "string") ? r.meals.filter((m) => m && typeof m.time === "string") : defaultMeals(),
    doseLogs: Array.isArray(r.doseLogs) ? r.doseLogs : [],
    mealLogs: Array.isArray(r.mealLogs) ? r.mealLogs : [],
    checkins: Array.isArray(r.checkins) ? r.checkins : [],
    reminded: Array.isArray(r.reminded) ? r.reminded : [],
    snooze: r.snooze && typeof r.snooze === "object" ? r.snooze : {},
    chat: Array.isArray(r.chat) ? r.chat : [],
    setupStep: r.setupStep === 2 || r.setupStep === 3 || r.setupStep === 4 ? r.setupStep : 1,
  };
}

export const useAsha = create<State>((set) => ({
  ...initialPersist(),
  hydrated: false,
  tab: "today",
  returnTab: "today",
  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(KEY);
      const data = raw ? sanitize(JSON.parse(raw) as unknown) : { ...initialPersist(), deviceId: uid() };
      set({ ...data, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
  setTab: (tab) => set({ tab }),
  openSettings: () => set((s) => ({ returnTab: s.tab === "settings" ? s.returnTab : s.tab, tab: "settings" })),
  closeSettings: () => set((s) => ({ tab: s.returnTab })),
  setLang: (lang) => set({ lang }),
  setVoiceLang: (voiceLang) => set({ voiceLang }),
  setBothLangs: (lang) => set({ lang, voiceLang: lang }),
  setTextSize: (textSize) => set({ textSize }),
  finishIntro: () => set({ introSeen: true }),
  chooseRole: (appRole) => set({ appRole, roleChosen: true, tab: appRole === "family" ? "family" : "today" }),
  replayIntro: () => set({ introSeen: false }),
  applyNativeActions: (actions) =>
    set((s) => {
      // Buttons pressed on the lock-screen card while the app was closed.
      // key looks like "med|<medId>|08:00" or "meal|<mealId>|13:00".
      let doseLogs = s.doseLogs;
      let mealLogs = s.mealLogs;
      let meds = s.meds;
      const reminded = new Set(s.reminded);
      for (const a of actions) {
        const [kind, id, time] = a.key.split("|");
        const day = todayKey(new Date(a.at || Date.now()));
        reminded.add(`${day}|${kind}|${id}|${time}`);
        if (a.action !== "taken") continue;
        if (kind === "med" && id && time) {
          const had = doseLogs.find((l) => l.day === day && l.medId === id && l.time === time);
          let counted = had?.status === "taken" ? had.counted : false;
          if (had?.status !== "taken") {
            const med = meds.find((m) => m.id === id);
            counted = !!med && med.pillsLeft !== null && med.pillsLeft > 0;
            if (counted) meds = meds.map((m) => (m.id === id && m.pillsLeft !== null ? { ...m, pillsLeft: m.pillsLeft - 1 } : m));
          }
          doseLogs = [...doseLogs.filter((l) => !(l.day === day && l.medId === id && l.time === time)), { medId: id, time, day, status: "taken", counted }];
        } else if (kind === "meal" && id && !mealLogs.some((l) => l.day === day && l.mealId === id)) {
          mealLogs = [...mealLogs, { mealId: id, day }];
        }
      }
      return { doseLogs, mealLogs, meds, reminded: [...reminded] };
    }),
  setName: (name) => set({ name }),
  toggleCondition: (id) =>
    set((s) => ({
      conditions: s.conditions.includes(id) ? s.conditions.filter((c) => c !== id) : [...s.conditions, id],
    })),
  setConditions: (ids) => set({ conditions: ids }),
  setSetupStep: (setupStep) => set({ setupStep }),
  upsertContact: (contact) =>
    set((s) => ({
      contacts: s.contacts.some((c) => c.id === contact.id)
        ? s.contacts.map((c) => (c.id === contact.id ? contact : c))
        : [...s.contacts, contact],
    })),
  removeContact: (id) => set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),
  setEmergency: (emergencyNumber) => set({ emergencyNumber }),
  setContacts: (contacts: Contact[]) => set({ contacts }),
  saveMed: (med) =>
    set((s) => ({
      meds: s.meds.some((m) => m.id === med.id) ? s.meds.map((m) => (m.id === med.id ? med : m)) : [...s.meds, med],
    })),
  removeMed: (id) => set((s) => ({ meds: s.meds.filter((m) => m.id !== id) })),
  // From a prescription photo: a medicine already on the list is updated, not added twice.
  saveMeds: (incoming) =>
    set((s) => {
      const norm = (n: string) => n.toLowerCase().replace(/[^a-z0-9\u0900-\u097f]/g, "");
      const meds = s.meds.slice();
      for (const m of incoming) {
        const i = meds.findIndex((x) => norm(x.name) === norm(m.name));
        if (i >= 0) meds[i] = { ...meds[i], dose: m.dose || meds[i].dose, times: m.times, food: m.food, note: m.note || meds[i].note };
        else meds.push(m);
      }
      return { meds };
    }),
  updateMeal: (id, patch) =>
    set((s) => ({
      meals: s.meals.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),
  logDose: (medId, time, status) =>
    set((s) => {
      const day = todayKey();
      const prev = s.doseLogs.find((l) => l.day === day && l.medId === medId && l.time === time);
      let meds = s.meds;
      let counted = status === "taken" && prev?.status === "taken" ? prev.counted : false;
      if (status === "taken" && prev?.status !== "taken") {
        const med = s.meds.find((m) => m.id === medId);
        counted = !!med && med.pillsLeft !== null && med.pillsLeft > 0;
        if (counted) meds = s.meds.map((m) => (m.id === medId && m.pillsLeft !== null ? { ...m, pillsLeft: m.pillsLeft - 1 } : m));
      }
      const doseLogs = [
        ...s.doseLogs.filter((l) => !(l.day === day && l.medId === medId && l.time === time)),
        { medId, time, day, status, counted },
      ];
      return { doseLogs, meds };
    }),
  undoDose: (medId, time) =>
    set((s) => {
      const day = todayKey();
      const prev = s.doseLogs.find((l) => l.day === day && l.medId === medId && l.time === time);
      const doseLogs = s.doseLogs.filter((l) => !(l.day === day && l.medId === medId && l.time === time));
      let meds = s.meds;
      // older logs have no "counted" mark: keep the old behaviour for them
      if (prev?.status === "taken" && prev.counted !== false) {
        meds = s.meds.map((m) => (m.id === medId && m.pillsLeft !== null ? { ...m, pillsLeft: m.pillsLeft + 1 } : m));
      }
      return { doseLogs, meds };
    }),
  logMeal: (mealId) =>
    set((s) => {
      const day = todayKey();
      if (s.mealLogs.some((l) => l.day === day && l.mealId === mealId)) return {};
      return { mealLogs: [...s.mealLogs, { mealId, day }] };
    }),
  undoMeal: (mealId) =>
    set((s) => {
      const day = todayKey();
      return { mealLogs: s.mealLogs.filter((l) => !(l.day === day && l.mealId === mealId)) };
    }),
  snoozeKey: (key, minutes) =>
    set((s) => ({
      snooze: { ...s.snooze, [key]: Date.now() + minutes * 60 * 1000 },
      reminded: s.reminded.filter((k) => k !== key),
    })),
  markReminded: (keys) =>
    set((s) => ({
      reminded: [...new Set([...s.reminded, ...keys])],
    })),
  patchCheckin: (patch) =>
    set((s) => {
      const day = todayKey();
      const current = s.checkins.find((c) => c.day === day) ?? emptyCheckin(day);
      const next = { ...current, ...patch, day, water: patch.water ?? current.water };
      return { checkins: [...s.checkins.filter((c) => c.day !== day), next] };
    }),
  addWater: () =>
    set((s) => {
      const day = todayKey();
      const current = s.checkins.find((c) => c.day === day) ?? emptyCheckin(day);
      const next = { ...current, water: Math.min(12, current.water + 1) };
      return { checkins: [...s.checkins.filter((c) => c.day !== day), next] };
    }),
  setPrefs: (patch) => set(patch),
  pushChat: (turn) => set((s) => ({ chat: [...s.chat, turn].slice(-24) })),
  dismissCoach: () => set({ coachDismissed: true }),
  finishSetup: () => set({ onboarded: true, setupStep: 4, sample: false }),
  loadSample: () => set((s) => ({ ...sampleDay(), name: s.name.trim(), deviceId: s.deviceId, introSeen: true, roleChosen: true, appRole: "elder", lang: s.lang, voiceLang: s.voiceLang })),
  eraseAll: () => set((s) => ({ ...initialPersist(), deviceId: s.deviceId, introSeen: true, hydrated: true, tab: "today" })),
}));

function sampleDay(): Partial<State> {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const meds: Med[] = [
    {
      id: "med-metformin",
      name: "Metformin",
      dose: "500 mg",
      times: ["08:00", "20:00"],
      food: "with" satisfies Food,
      note: "With breakfast and dinner. Do not double a missed dose.",
      pillsLeft: 6,
    },
    {
      id: "med-calcium",
      name: "Calcium",
      dose: "500 mg",
      times: ["13:00"],
      food: "after",
      note: "After lunch.",
      pillsLeft: 24,
    },
  ];
  const doseLogs = meds.flatMap((med) =>
    med.times
      .filter((time) => toMinSafe(time) + 60 < nowMin)
      .map((time) => ({ medId: med.id, time, day: todayKey(now), status: "taken" as const })),
  );
  const meals = defaultMeals();
  const mealLogs = meals
    .filter((meal) => toMinSafe(meal.time) + 60 < nowMin)
    .map((meal) => ({ mealId: meal.id, day: todayKey(now) }));
  const checkins: Checkin[] = [6, 5, 4, 3, 2, 1].map((ago, i) => ({
    day: shiftDay(ago, now),
    fastingSugar: [118, 126, 121, 134, 117, 129][i],
    afterSugar: [156, 164, 149, 172, 158, 151][i],
    bpSys: [128, 132, 126, 130, 124, 129][i],
    bpDia: [78, 82, 76, 80, 77, 79][i],
    pain: [4, 5, 3, 4, 6, 4][i],
    mood: [3, 3, 4, 2, 3, 4][i],
    water: 5,
  }));
  return {
    ...initialPersist(),
    hydrated: true,
    onboarded: true,
    setupStep: 4,
    name: "",
    lang: "en",
    conditions: ["diabetes", "arthritis"],
    contacts: [{ id: "sample-priya", name: "Priya", relation: "Daughter", phone: "" }],
    emergencyNumber: "",
    meds,
    meals,
    doseLogs,
    mealLogs,
    checkins,
    sample: true,
    coachDismissed: false,
    tab: "today",
  };
}

function toMinSafe(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

if (typeof window !== "undefined") {
  useAsha.subscribe((state) => {
    if (!state.hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(snapshot(state)));
    } catch {
      /* private mode or a full disk — the day still works in memory */
    }
  });
}

export function newId() {
  return uid();
}

export function blankMed(): Med {
  return {
    id: newId(),
    name: "",
    dose: "",
    times: ["08:00"],
    food: "with",
    note: "",
    pillsLeft: null,
  };
}
