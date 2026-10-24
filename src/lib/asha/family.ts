// Family Circle: talks to the Supabase "family" function and keeps a small local copy.
import { create } from "zustand";
import { AshaNative, isNative } from "@/lib/asha/native";
import { useAsha } from "@/lib/asha/store";
import { todayKey } from "@/lib/asha/time";
import type { Lang } from "@/lib/asha/types";

export const FAMILY_URL = "https://qheqzgxtzcagpayelfxn.supabase.co/functions/v1/family";
const KEY = "asha.family.v1";

export type FamilyMsg = {
  id: number;
  circleId: string;
  mine: boolean;
  fromElder: boolean;
  kind: "preset" | "custom" | "status" | "heart" | "voice" | "alert" | "nudge" | "digest";
  template: string | null;
  en: string;
  hi: string;
  voice: boolean;
  /** a held voice note: when it will play for the elder (only its sender sees it before then) */
  scheduledFor?: string | null;
  silent: boolean;
  heardAt: string | null;
  reaction: string | null;
  at: string;
};

export type CircleInfo = {
  id: string;
  label: string;
  // elder side
  shareMeds?: boolean;
  shareMeals?: boolean;
  shareMood?: boolean;
  shareMissed?: boolean;
  digest?: boolean;
  nudge?: boolean;
  invite?: { code: string; expires: string } | null;
  // family side
  relation?: string;
  myName?: string;
  elderLastSeen?: string | null;
};

export type Member = { id: string; relation: string; name: string; muted: boolean; blocked: boolean; hasPush: boolean };

type Saved = {
  deviceId: string;
  secret: string;
  role: "elder" | "family" | "";
  circles: CircleInfo[];
  members: Member[];
  messages: FamilyMsg[];
  heardLocal: number[];
  sent: string[];
  caps: { ai: boolean; push: boolean };
  pushToken: string;
  bubble: boolean;
};

type FamilyState = Saved & {
  hydrated: boolean;
  syncing: boolean;
  online: boolean;
  /** the message the fairy is delivering right now */
  delivering: FamilyMsg | null;
};

const empty = (): Saved => ({
  deviceId: "",
  secret: "",
  role: "",
  circles: [],
  members: [],
  messages: [],
  heardLocal: [],
  sent: [],
  caps: { ai: false, push: false },
  pushToken: "",
  bubble: false,
});

export const useFamily = create<FamilyState>(() => ({ ...empty(), hydrated: false, syncing: false, online: true, delivering: null }));

/** A damaged saved copy must never blank the app: keep what is usable, reset the rest. */
function sanitize(raw: unknown): Saved {
  const base = empty();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const r = raw as Partial<Record<keyof Saved, unknown>>;
  const str = (v: unknown, d: string) => (typeof v === "string" ? v : d);
  const list = <T,>(v: unknown, ok: (x: unknown) => boolean) => (Array.isArray(v) ? (v.filter(ok) as T[]) : []);
  const isObj = (x: unknown) => !!x && typeof x === "object";
  const caps = isObj(r.caps) ? (r.caps as Saved["caps"]) : base.caps;
  return {
    deviceId: str(r.deviceId, ""),
    secret: str(r.secret, ""),
    role: r.role === "elder" || r.role === "family" ? r.role : "",
    circles: list<CircleInfo>(r.circles, (c) => isObj(c) && typeof (c as CircleInfo).id === "string"),
    members: list<Member>(r.members, isObj),
    messages: list<FamilyMsg>(r.messages, (m) => isObj(m) && typeof (m as FamilyMsg).id === "number"),
    heardLocal: list<number>(r.heardLocal, (n) => typeof n === "number"),
    sent: list<string>(r.sent, (s) => typeof s === "string"),
    caps: { ai: Boolean(caps.ai), push: Boolean(caps.push) },
    pushToken: str(r.pushToken, ""),
    bubble: r.bubble === true,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? sanitize(JSON.parse(raw) as unknown) : empty();
    useFamily.setState({ ...data, hydrated: true });
  } catch {
    useFamily.setState({ hydrated: true });
  }
}

function save() {
  const s = useFamily.getState();
  const out: Saved = {
    deviceId: s.deviceId,
    secret: s.secret,
    role: s.role,
    circles: s.circles,
    members: s.members,
    messages: s.messages.slice(0, 120),
    heardLocal: s.heardLocal.slice(-300),
    sent: s.sent.slice(-200),
    caps: s.caps,
    pushToken: s.pushToken,
    bubble: s.bubble,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(out));
  } catch {
    /* ignore */
  }
}

if (typeof window !== "undefined") {
  load();
  useFamily.subscribe((s, p) => {
    if (s.hydrated && (s.messages !== p.messages || s.circles !== p.circles || s.deviceId !== p.deviceId || s.sent !== p.sent || s.heardLocal !== p.heardLocal || s.members !== p.members || s.caps !== p.caps || s.pushToken !== p.pushToken || s.bubble !== p.bubble || s.role !== p.role)) {
      save();
    }
  });
}

// ---------- low-level call ----------

export type CallFail = { ok: false; error: string; status: number; reason?: string; hint?: { en: string; hi: string } };

async function call<T>(action: string, body: Record<string, unknown> = {}, timeoutMs = 20000): Promise<(T & { ok: true }) | CallFail> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return { ok: false, error: "offline", status: 0 };
  const s = useFamily.getState();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const started = performance.now();
  try {
    const res = await fetch(FAMILY_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-device-id": s.deviceId, "x-device-secret": s.secret },
      body: JSON.stringify({ action, ...body }),
      signal: ctrl.signal,
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    // how long each family call takes, so a slow run shows which call it was
    console.info(`[family] ${action} http ${res.status} in ${Math.round(performance.now() - started)} ms`);
    useFamily.setState({ online: true });
    if (!res.ok || !data.ok) {
      if (res.status === 401 && action !== "register") {
        // the server forgot this phone (or it was erased): start fresh next time
        useFamily.setState({ deviceId: "", secret: "" });
      }
      return { ok: false, error: String(data.error ?? `http ${res.status}`), status: res.status, reason: data.reason as string | undefined, hint: data.hint as CallFail["hint"] };
    }
    return data as T & { ok: true };
  } catch {
    console.info(`[family] ${action} failed after ${Math.round(performance.now() - started)} ms`);
    useFamily.setState({ online: false });
    return { ok: false, error: "network", status: 0 };
  } finally {
    clearTimeout(timer);
  }
}

// ---------- setup ----------

function profile() {
  const a = useAsha.getState();
  return {
    name: a.name,
    lang: a.lang,
    voiceLang: a.voiceLang,
    pro: a.pro,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
    quietStart: a.sleepTime || "21:30",
    quietEnd: a.wakeTime || "07:00",
  };
}

/** Makes sure this phone is known to the server, in the right role. */
export async function ensureDevice(): Promise<boolean> {
  const a = useAsha.getState();
  const role = a.appRole;
  const s = useFamily.getState();
  if (!s.deviceId || !s.secret) {
    const r = await call<{ deviceId: string; secret: string }>("register", { role, ...profile(), fcmToken: s.pushToken || undefined });
    if (!r.ok) return false;
    useFamily.setState({ deviceId: r.deviceId, secret: r.secret, role });
    // not awaited: the circle request does not need the native config, and a native call that never returns would hold the create button
    void pushNativeConfig();
    return true;
  }
  if (s.role !== role) {
    await call("update", { role });
    useFamily.setState({ role, circles: [], members: [], messages: [] });
  }
  return true;
}

let profileTimer: number | undefined;
/** Sends name / language / quiet hours / Pro to the server (debounced). */
export function syncProfile() {
  if (!useFamily.getState().deviceId) return;
  window.clearTimeout(profileTimer);
  profileTimer = window.setTimeout(() => {
    void call("update", { ...profile(), fcmToken: useFamily.getState().pushToken || undefined });
    void pushNativeConfig();
  }, 1200);
}

/** Gets this phone's push address from Android and tells the server. */
export async function refreshPushToken() {
  if (!isNative) return;
  try {
    const { token } = await AshaNative.getPushToken();
    if (token && token !== useFamily.getState().pushToken) {
      useFamily.setState({ pushToken: token });
      if (useFamily.getState().deviceId) await call("update", { fcmToken: token });
    }
  } catch {
    /* no push on this phone: the 15-minute check takes over */
  }
  await pushNativeConfig();
}

/** Android needs the address and the phone's key to fetch messages and send the missed-dose alert while the app is closed. */
export async function pushNativeConfig() {
  if (!isNative) return;
  const a = useAsha.getState();
  const f = useFamily.getState();
  try {
    await AshaNative.setFamilyConfig({
      url: FAMILY_URL,
      deviceId: f.deviceId,
      secret: f.secret,
      role: a.appRole,
      lang: a.lang,
      voiceLang: a.voiceLang,
      voiceOn: a.voiceOn,
      quietStart: a.sleepTime || "21:30",
      quietEnd: a.wakeTime || "07:00",
      inCircle: f.circles.length > 0,
      poll: f.circles.length > 0 && !f.pushToken,
      lastId: f.messages.reduce((m, x) => Math.max(m, x.id), 0),
      bubble: f.bubble,
    });
  } catch {
    /* older app build */
  }
}

// ---------- reading ----------

export async function refreshState() {
  if (!(await ensureDevice())) return false;
  const r = await call<{ circles: CircleInfo[]; members: Member[]; caps: { ai: boolean; push: boolean } }>("state");
  if (!r.ok) return false;
  useFamily.setState({ circles: r.circles, members: r.members, caps: r.caps });
  return true;
}

export async function pullInbox() {
  const s = useFamily.getState();
  if (!s.deviceId || !s.circles.length) return [];
  useFamily.setState({ syncing: true });
  const r = await call<{ messages: FamilyMsg[] }>("inbox");
  useFamily.setState({ syncing: false });
  if (!r.ok) return [];
  const known = new Set(s.messages.map((m) => m.id));
  const fresh = r.messages.filter((m) => !known.has(m.id));
  const byId = new Map<number, FamilyMsg>();
  for (const m of [...s.messages, ...r.messages]) byId.set(m.id, m);
  const merged = [...byId.values()].sort((a, b) => b.id - a.id).slice(0, 120);
  useFamily.setState({ messages: merged });
  void pushNativeConfig();
  void updateWidget();
  return fresh;
}

export function unreadOf(s: Pick<FamilyState, "messages" | "heardLocal">) {
  const heard = new Set(s.heardLocal);
  return s.messages.filter((m) => !m.mine && !m.heardAt && !heard.has(m.id) && !m.silent);
}

export async function markHeard(ids: number[]) {
  if (!ids.length) return;
  useFamily.setState((s) => ({ heardLocal: [...new Set([...s.heardLocal, ...ids])] }));
  void updateWidget();
  await call("heard", { ids });
}

export function textOf(m: FamilyMsg, lang: Lang) {
  return (lang === "hi" ? m.hi : m.en) || m.en || m.hi;
}

// ---------- sending ----------

function circleId() {
  return useFamily.getState().circles[0]?.id ?? "";
}

async function afterSend<T>(r: (T & { ok: true }) | CallFail) {
  if (r.ok) void pullInbox();
  return r;
}

export async function sendPreset(template: string, circle = circleId()) {
  return afterSend(await call<{ id: number }>("send", { circleId: circle, kind: "preset", template }));
}
export async function sendHeart(circle = circleId()) {
  return afterSend(await call<{ id: number }>("send", { circleId: circle, kind: "heart" }));
}
export async function sendCustom(text: string, circle = circleId()) {
  return afterSend(await call<{ id: number }>("send", { circleId: circle, kind: "custom", text }));
}
/** at: "now", or "HH:MM" on the elder's clock (the next time it comes round). */
export async function sendVoice(audio: string, mime: string, circle = circleId(), at = "now") {
  return afterSend(await call<{ id: number; scheduled?: string }>("send", { circleId: circle, kind: "voice", audio, mime, at }, 45000));
}

/** Plays a voice note; resolves when it ends (or fails). */
export async function playVoiceNote(id: number) {
  const url = await voiceUrl(id);
  if (!url) return false;
  return new Promise<boolean>((resolve) => {
    const a = new Audio(url);
    a.onended = () => resolve(true);
    a.onerror = () => resolve(false);
    void a.play().catch(() => resolve(false));
  });
}

const HIDDEN = "asha.hiddenNotes.v1";
/** Voice notes the elder said upset her: never played or shown again on this phone. */
export function hiddenNotes(): number[] {
  try {
    return JSON.parse(localStorage.getItem(HIDDEN) ?? "[]") as number[];
  } catch {
    return [];
  }
}
export function hideNote(id: number) {
  try {
    localStorage.setItem(HIDDEN, JSON.stringify([...hiddenNotes(), id].slice(-300)));
  } catch {
    /* hidden for this session only */
  }
  useFamily.setState((s) => ({ heardLocal: [...new Set([...s.heardLocal, id])], messages: [...s.messages] }));
}
export async function react(id: number, reaction = "❤️") {
  useFamily.setState((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, reaction, heardAt: m.heardAt ?? new Date().toISOString() } : m)) }));
  return call("react", { id, reaction });
}
export async function voiceUrl(id: number) {
  const r = await call<{ url: string | null }>("voice-url", { id });
  return r.ok ? r.url : null;
}

// ---------- elder: circle, invite, members ----------

export type Consent = { shareMeds: boolean; shareMeals: boolean; shareMood: boolean; shareMissed: boolean; digest: boolean; nudge: boolean };

export async function saveCircle(consent: Partial<Consent> & { label?: string }) {
  console.info("[family] create: checking device");
  if (!(await ensureDevice())) return { ok: false as const, error: "offline" };
  console.info("[family] create: sending circle");
  const r = await call<{ circle: CircleInfo }>("circle", consent);
  console.info(`[family] create: circle returned ok=${r.ok}`);
  if (r.ok) {
    await refreshState();
    void pushNativeConfig();
  }
  return r;
}

export async function makeInvite() {
  const r = await call<{ code: string; expires: string }>("invite");
  if (r.ok) await refreshState();
  return r;
}

export async function updateMember(deviceId: string, patch: { muted?: boolean; blocked?: boolean; remove?: boolean }) {
  const r = await call("member", { deviceId, ...patch });
  if (r.ok) await refreshState();
  return r;
}

// ---------- family: join / leave ----------

export async function joinCircle(code: string, relation: string, displayName: string) {
  if (!(await ensureDevice())) return { ok: false as const, error: "offline", status: 0 } as CallFail;
  const r = await call<{ circle: { id: string; label: string } }>("join", { code, relation, displayName });
  if (r.ok) {
    await refreshState();
    await pullInbox();
  }
  return r;
}

export async function leaveCircle(id: string) {
  const r = await call("leave", { circleId: id });
  if (r.ok) {
    await refreshState();
    useFamily.setState((s) => ({ messages: s.messages.filter((m) => m.circleId !== id) }));
  }
  return r;
}

export async function forgetMe() {
  await call("forget");
  useFamily.setState({ ...empty(), hydrated: true });
  void pushNativeConfig();
}

export async function testPush() {
  return call<{ result: string }>("test-push");
}

// ---------- elder: automatic updates ----------

function once(key: string) {
  const s = useFamily.getState();
  if (s.sent.includes(key)) return false;
  useFamily.setState({ sent: [...s.sent, key].slice(-200) });
  return true;
}

export function timeWords(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const en = `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "am" : "pm"}`;
  const part = h < 12 ? "सुबह" : h < 17 ? "दोपहर" : h < 21 ? "शाम" : "रात";
  const hi = `${part} ${h12}${m ? `:${String(m).padStart(2, "0")}` : ""} बजे`;
  return { en, hi };
}

async function status(template: string, vars: Record<string, string>) {
  if (useAsha.getState().appRole !== "elder" || !useFamily.getState().circles.length) return;
  await call("status", { template, ...vars });
}

/** Missed medicine / Help pressed. Returns how many family phones got it. */
export async function familyAlert(template: "missed" | "sos", vars: Record<string, string> = {}) {
  if (useAsha.getState().appRole !== "elder" || !useFamily.getState().circles.length) return 0;
  const r = await call<{ pushed: number }>("alert", { template, ...vars }, 10000);
  return r.ok ? r.pushed : 0;
}

let watching = false;
/** Watches Maa's day and sends the sweet updates she agreed to share. */
export function startFamilyWatchers() {
  if (watching || typeof window === "undefined") return;
  watching = true;
  useAsha.subscribe((s, p) => {
    if (s.appRole !== "elder" || !useFamily.getState().circles.length) return;
    const day = todayKey();
    if (s.doseLogs !== p.doseLogs) {
      const before = new Set(p.doseLogs.filter((l) => l.status === "taken").map((l) => `${l.day}|${l.medId}|${l.time}`));
      for (const l of s.doseLogs) {
        if (l.day !== day || l.status !== "taken" || before.has(`${l.day}|${l.medId}|${l.time}`)) continue;
        // one update per dose time ("her 8 am medicines"), not one per tablet
        if (!once(`${day}|dose|${l.time}`)) continue;
        const w = timeWords(l.time);
        void status("dose", { time: l.time, timeEn: w.en, timeHi: w.hi });
      }
    }
    if (s.mealLogs !== p.mealLogs) {
      const before = new Set(p.mealLogs.map((l) => `${l.day}|${l.mealId}`));
      for (const l of s.mealLogs) {
        if (l.day !== day || before.has(`${l.day}|${l.mealId}`)) continue;
        if (!once(`${day}|meal|${l.mealId}`)) continue;
        const meal = s.meals.find((m) => m.id === l.mealId);
        void status("meal", { meal: meal?.preset ?? meal?.name ?? "meal" });
      }
    }
    if (s.checkins !== p.checkins) {
      const now = s.checkins.find((c) => c.day === day)?.mood;
      const was = p.checkins.find((c) => c.day === day)?.mood;
      if (now && now !== was && once(`${day}|mood`)) {
        const t = now >= 5 ? "mood_great" : now === 4 ? "mood_good" : now === 3 ? "mood_okay" : "mood_low";
        void status(t, {});
      }
    }
    if (s.name !== p.name || s.lang !== p.lang || s.voiceLang !== p.voiceLang || s.pro !== p.pro || s.sleepTime !== p.sleepTime || s.wakeTime !== p.wakeTime || s.voiceOn !== p.voiceOn) {
      syncProfile();
    }
  });
}

// ---------- home-screen widget & floating fairy ----------

export async function updateWidget() {
  if (!isNative) return;
  const f = useFamily.getState();
  const a = useAsha.getState();
  const unread = unreadOf(f);
  const latest = unread[0];
  try {
    await AshaNative.updateWidget({
      mood: latest ? "happy" : "idle",
      text: latest ? textOf(latest, a.lang) : a.lang === "hi" ? "मैं यहीं हूँ. छूकर आशा खोलें." : "I'm right here. Tap to open Asha.",
      unread: unread.length,
    });
  } catch {
    /* older build */
  }
}

/** Android-only: pulls in messages the phone received while the app was closed. */
export async function drainNative() {
  if (!isNative) return;
  try {
    const r = await AshaNative.drainFamily();
    if (r.openTab === "family" && useAsha.getState().appRole === "elder" && useAsha.getState().onboarded) useAsha.getState().setTab("family");
    if (r.changed) await pullInbox();
  } catch {
    /* ignore */
  }
}

export { call as familyCall };
