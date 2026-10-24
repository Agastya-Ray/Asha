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
  Prescription,
  AppRole,
  Tab,
  TextSize,
} from "@/lib/asha/types";
import { defaultMeals, emptyCheckin } from "@/lib/asha/schedule";
import { shiftDay, todayKey } from "@/lib/asha/time";
import { daysInLogs } from "@/lib/asha/crown";

const KEY = "asha.v1";

export const initialPersist = (): Persist => ({
  onboarded: false,
  setupStep: 1,
  name: "",
  lang: "en",
  voiceLang: "en",
  introSeen: false,
  fairyName: "",
  fairyVoice: null,
  tourDone: false,
  appRole: "elder",
  roleChosen: false,
  textSize: "normal",
  deviceId: "",
  sosAutoSms: false,
  familyAlert: false,
  dailyGreetings: true,
  wakeTime: "07:30",
  sleepTime: "21:30",
  quietUntil: 0,
  yesterdayNoted: "",
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
  fairySounds: true,
  speakOnOpen: true,
  keepAwake: false,
  reminded: [],
  snooze: {},
  coachDismissed: false,
  sample: false,
  chat: [],
  growth: { days: 0, last: "" },
  crownSeen: 0,
  prescriptions: [],
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
  /** back to "who will use this phone?" (picked the wrong one) */
  unchooseRole: () => void;
  replayIntro: () => void;
  setFairyName: (name: string) => void;
  setFairyVoice: (voice: Persist["fairyVoice"]) => void;
  finishTour: () => void;
  applyNativeActions: (actions: { key: string; action: string; at: number; day?: string }[]) => void;
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
  savePrescription: (p: Prescription) => void;
  removePrescription: (id: string) => void;
  updateMeal: (id: string, patch: Partial<{ name: string; time: string; note: string }>) => void;
  /** day defaults to today; the "yesterday" note passes yesterday's day */
  logDose: (medId: string, time: string, status: "taken" | "skipped", day?: string) => void;
  /** answers the morning-after note; doses still unmarked are recorded as missed */
  noteYesterday: (day: string, missed: { medId: string; time: string; day: string }[]) => void;
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
        "voiceOn" | "richVoice" | "fairySounds" | "speakOnOpen" | "keepAwake" | "pro" | "sosAutoSms" | "familyAlert" | "dailyGreetings" | "wakeTime" | "sleepTime"
      >
    >,
  ) => void;
  pushChat: (turn: ChatTurn) => void;
  setQuiet: (until: number) => void;
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

// before the crown existed: count the days already logged, and celebrate what she has grown so far once
function seedGrowth(r: Partial<Persist>) {
  const days = daysInLogs({
    doseLogs: Array.isArray(r.doseLogs) ? r.doseLogs : [],
    mealLogs: Array.isArray(r.mealLogs) ? r.mealLogs : [],
    checkins: Array.isArray(r.checkins) ? r.checkins : [],
  });
  return { days: days.length, last: days[days.length - 1] ?? "" };
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
    fairyName: typeof r.fairyName === "string" ? r.fairyName.slice(0, 24) : "",
    fairyVoice: r.fairyVoice && typeof r.fairyVoice === "object" && typeof r.fairyVoice.id === "string" ? r.fairyVoice : null,
    tourDone: typeof r.tourDone === "boolean" ? r.tourDone : Boolean(r.onboarded),
    appRole: r.appRole === "family" ? "family" : "elder",
    // people who already set up meds are the person cared for
    roleChosen: typeof r.roleChosen === "boolean" ? r.roleChosen : Boolean(r.onboarded),
    conditions: Array.isArray(r.conditions) ? r.conditions.filter(Boolean) : [],
    contacts: Array.isArray(r.contacts)
      ? r.contacts
          .filter((c) => c && typeof c === "object")
          .map((c) => ({ ...c, id: typeof c.id === "string" && c.id ? c.id : uid(), name: String(c.name ?? ""), relation: String(c.relation ?? ""), phone: String(c.phone ?? "") }))
      : [],
    meds: Array.isArray(r.meds)
      ? r.meds
          .filter((m) => m && typeof m === "object" && typeof m.id === "string")
          .map((m) => ({ ...m, name: String(m.name ?? ""), dose: String(m.dose ?? ""), times: Array.isArray(m.times) ? m.times.filter((t) => typeof t === "string") : [], days: Array.isArray(m.days) ? m.days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6) : undefined, asNeeded: m.asNeeded === true }))
      : [],
    meals: Array.isArray(r.meals) && r.meals.some((m) => m && typeof m.time === "string") ? r.meals.filter((m) => m && typeof m.time === "string") : defaultMeals(),
    doseLogs: Array.isArray(r.doseLogs) ? r.doseLogs : [],
    mealLogs: Array.isArray(r.mealLogs) ? r.mealLogs : [],
    checkins: Array.isArray(r.checkins) ? r.checkins : [],
    reminded: Array.isArray(r.reminded) ? r.reminded : [],
    snooze: r.snooze && typeof r.snooze === "object" ? r.snooze : {},
    chat: Array.isArray(r.chat) ? r.chat : [],
    growth: r.growth && typeof r.growth.days === "number" ? { days: Math.max(0, r.growth.days), last: String(r.growth.last ?? "") } : seedGrowth(r),
    crownSeen: typeof r.crownSeen === "number" ? r.crownSeen : 0,
    prescriptions: Array.isArray(r.prescriptions)
      ? r.prescriptions
          .filter((p) => p && typeof p === "object" && typeof p.id === "string")
          .map((p) => ({
            ...p,
            date: String(p.date ?? ""),
            doctor: String(p.doctor ?? ""),
            meds: Array.isArray(p.meds) ? p.meds.map(String) : [],
            instructions: Array.isArray(p.instructions) ? p.instructions.map(String) : [],
            followUp: String(p.followUp ?? ""),
            savedAt: Number(p.savedAt) || 0,
            hasPhoto: p.hasPhoto === true,
          }))
      : [],
    yesterdayNoted: typeof r.yesterdayNoted === "string" ? r.yesterdayNoted : "",
    quietUntil: typeof r.quietUntil === "number" && r.quietUntil > Date.now() ? r.quietUntil : 0,
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
  setQuiet: (quietUntil) => set({ quietUntil: Math.max(0, Math.round(quietUntil)) }),
  chooseRole: (appRole) =>
    set({ appRole, roleChosen: true, tab: appRole === "family" ? "family" : "today" }),
  unchooseRole: () => set({ appRole: "elder", roleChosen: false, tab: "today" }),
  replayIntro: () => set({ introSeen: false }),
  setFairyName: (fairyName) => set({ fairyName: fairyName.trim().slice(0, 24) }),
  setFairyVoice: (fairyVoice) => set({ fairyVoice }),
  finishTour: () => set({ tourDone: true }),
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
        // the day the card was for (a card from last night pressed this morning is last night's dose, not today's)
        const day = a.day || todayKey(new Date(a.at || Date.now()));
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
      meds: s.meds.some((m) => m.id === med.id) ? s.meds.map((m) => (m.id === med.id ? med : m)) : [...s.meds, { ...med, addedOn: med.addedOn ?? todayKey() }],
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
        else meds.push({ ...m, addedOn: m.addedOn ?? todayKey() });
      }
      return { meds };
    }),
  // newest first; the same id replaces the old copy
  savePrescription: (p) => set((s) => ({ prescriptions: [p, ...s.prescriptions.filter((x) => x.id !== p.id)].slice(0, 30) })),
  removePrescription: (id) => set((s) => ({ prescriptions: s.prescriptions.filter((x) => x.id !== id) })),
  updateMeal: (id, patch) =>
    set((s) => ({
      meals: s.meals.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),
  noteYesterday: (yesterdayNoted, missed) =>
    set((s) => ({
      yesterdayNoted,
      doseLogs: [
        ...s.doseLogs,
        ...missed
          .filter((m) => !s.doseLogs.some((l) => l.day === m.day && l.medId === m.medId && l.time === m.time))
          .map((m) => ({ ...m, status: "skipped" as const, missed: true })),
      ],
    })),
  logDose: (medId, time, status, onDay) =>
    set((s) => {
      const day = onDay ?? todayKey();
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
