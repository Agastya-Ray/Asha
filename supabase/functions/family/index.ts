// Asha Family Circle server.
// One endpoint: POST { action, ...data }. Each phone proves who it is with x-device-id + x-device-secret.
// Database tables are locked (Row Level Security, no policies); only this function, with the service role, reads them.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { checkText, checkVoice } from "./moderation.ts";
import { push } from "./fcm.ts";
import { fill, FROM_ELDER, MEALS, presetById, STATUS, TO_ELDER, type Bi } from "./presets.ts";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-device-id, x-device-secret, x-cron-secret, authorization, apikey",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", ...CORS } });
const err = (error: string, status = 400, extra: Record<string, unknown> = {}) => json({ ok: false, error, ...extra }, status);

type Device = {
  id: string;
  role: "elder" | "family";
  name: string;
  lang: "en" | "hi";
  voice_lang: "en" | "hi";
  fcm_token: string | null;
  pro: boolean;
  tz: string;
  quiet_start: string;
  quiet_end: string;
};
type Circle = {
  id: string;
  elder_id: string;
  elder_label: string;
  share_meds: boolean;
  share_meals: boolean;
  share_mood: boolean;
  share_missed: boolean;
  digest: boolean;
  nudge: boolean;
  invite_code: string | null;
  invite_expires: string | null;
  last_digest_day: string | null;
  last_nudge_day: string | null;
};

// ---------- small helpers ----------

async function sha256(s: string) {
  const d = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  return Array.from(d, (b) => b.toString(16).padStart(2, "0")).join("");
}
function randomToken(bytes = 24) {
  const a = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}
function sixDigits() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 900000;
  return String(100000 + n);
}
const str = (v: unknown, max = 80) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const lang = (v: unknown): "en" | "hi" => (v === "hi" ? "hi" : "en");
const hhmm = (v: unknown, d: string) => (/^\d{2}:\d{2}$/.test(String(v)) ? String(v) : d);
const tzOk = (v: unknown) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: String(v) });
    return String(v);
  } catch {
    return "Asia/Kolkata";
  }
};

/** Local clock for a time zone: {day:"2026-10-13", min: minutes since midnight}. */
function localNow(tz: string, at = new Date()) {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(at);
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "00";
  return { day: `${g("year")}-${g("month")}-${g("day")}`, min: (Number(g("hour")) % 24) * 60 + Number(g("minute")) };
}
const toMin = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
function inQuiet(d: Device) {
  const now = localNow(d.tz).min;
  const a = toMin(d.quiet_start);
  const b = toMin(d.quiet_end);
  return a <= b ? now >= a && now < b : now >= a || now < b;
}

let saCache: string | null = null;
async function serviceAccount() {
  if (saCache) return saCache;
  const { data } = await db.rpc("asha_secret", { secret_name: "firebase_service_account" });
  saCache = (data as string | null) ?? "";
  return saCache;
}
let gemCache: string | null = null;
async function geminiKey() {
  if (gemCache !== null) return gemCache;
  const env = Deno.env.get("GEMINI_API_KEY");
  if (env) return (gemCache = env);
  const { data } = await db.rpc("asha_secret", { secret_name: "gemini_api_key" });
  gemCache = (data as string | null) ?? "";
  return gemCache;
}

async function auth(req: Request): Promise<Device | null> {
  const id = req.headers.get("x-device-id") ?? "";
  const secret = req.headers.get("x-device-secret") ?? "";
  if (!/^[0-9a-f-]{36}$/.test(id) || secret.length < 20) return null;
  const { data } = await db.from("devices").select("*").eq("id", id).maybeSingle();
  if (!data || data.secret_hash !== (await sha256(secret))) return null;
  // seen now (used for the "hasn't opened Asha today" nudge)
  void db.from("devices").update({ last_seen: new Date().toISOString() }).eq("id", id);
  return data as Device;
}

async function circleOfElder(elderId: string) {
  const { data } = await db.from("circles").select("*").eq("elder_id", elderId).maybeSingle();
  return (data as Circle | null) ?? null;
}

async function membership(circleId: string, deviceId: string) {
  const { data } = await db.from("members").select("*").eq("circle_id", circleId).eq("device_id", deviceId).maybeSingle();
  return data as { relation: string; display_name: string; muted: boolean; blocked: boolean } | null;
}

/** Can this device talk in this circle? Returns the circle or null. */
async function canUse(d: Device, circleId: string): Promise<Circle | null> {
  const { data: c } = await db.from("circles").select("*").eq("id", circleId).maybeSingle();
  if (!c) return null;
  if (c.elder_id === d.id) return c as Circle;
  const m = await membership(circleId, d.id);
  return m && !m.blocked ? (c as Circle) : null;
}

async function sentToday(deviceId: string, kinds: string[]) {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await db
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("from_device", deviceId)
    .in("kind", kinds)
    .gte("created_at", since);
  return count ?? 0;
}

const LIMITS: Record<string, number> = { heart: 40, preset: 25, custom: 12, voice: 6, status: 60, alert: 20 };

type Msg = {
  id: number;
  circle_id: string;
  from_device: string | null;
  to_device: string | null;
  kind: string;
  template: string | null;
  text_en: string;
  text_hi: string;
  audio_path: string | null;
  silent: boolean;
  created_at: string;
};

/** Store a message and push it to everyone it is for. */
async function deliver(
  circle: Circle,
  from: Device | null,
  msg: Omit<Msg, "id" | "circle_id" | "from_device" | "created_at"> & { original?: string | null },
  opts: { familyOnly?: boolean } = {},
) {
  const { data: row, error } = await db
    .from("messages")
    .insert({ ...msg, circle_id: circle.id, from_device: from?.id ?? null })
    .select()
    .single();
  if (error || !row) throw new Error(error?.message ?? "insert failed");

  // who receives it
  const { data: members } = await db.from("members").select("device_id, muted, blocked, display_name, relation").eq("circle_id", circle.id);
  const ids = new Set<string>([circle.elder_id, ...(members ?? []).filter((m) => !m.blocked).map((m) => m.device_id)]);
  if (from) ids.delete(from.id);
  if (opts.familyOnly) ids.delete(circle.elder_id);
  if (msg.to_device) {
    for (const id of [...ids]) if (id !== msg.to_device) ids.delete(id);
  }
  // a family member's message only goes to the elder (not to brothers and sisters), except alerts/status from the elder
  if (from && from.role === "family") {
    for (const id of [...ids]) if (id !== circle.elder_id) ids.delete(id);
  }
  if (!ids.size || msg.silent) return { message: row as Msg, pushed: 0 };

  const { data: targets } = await db.from("devices").select("*").in("id", [...ids]);
  const sa = await serviceAccount();
  const fromName = from ? (from.role === "elder" ? circle.elder_label || from.name : (members ?? []).find((m) => m.device_id === from.id)?.display_name || from.name) : "Asha";
  let pushed = 0;
  for (const t of (targets ?? []) as Device[]) {
    const mutedByElder = t.id === circle.elder_id && from && (members ?? []).find((m) => m.device_id === from.id)?.muted;
    if (mutedByElder) continue;
    const urgent = msg.kind === "alert";
    const quiet = !urgent && inQuiet(t);
    const r = await push(sa, t.fcm_token, {
      type: "family",
      id: String(row.id),
      circle: circle.id,
      kind: msg.kind,
      from: fromName,
      title_en: urgent ? "Asha · Urgent" : `${fromName} · Asha`,
      title_hi: urgent ? "आशा · ज़रूरी" : `${fromName} · आशा`,
      en: msg.text_en,
      hi: msg.text_hi,
      voice: msg.audio_path ? "1" : "0",
      quiet: quiet ? "1" : "0",
      urgent: urgent ? "1" : "0",
      to_role: t.role,
    });
    if (r === "sent") pushed += 1;
    if (r === "bad-token") await db.from("devices").update({ fcm_token: null }).eq("id", t.id);
  }
  return { message: row as Msg, pushed };
}

function bothLangs(t: Bi, vars: Record<string, string>, varsHi: Record<string, string> = vars): { text_en: string; text_hi: string } {
  return { text_en: fill(t.en, vars), text_hi: fill(t.hi, varsHi) };
}

// ---------- actions ----------

type Body = Record<string, unknown>;

async function register(b: Body) {
  const role = b.role === "family" ? "family" : "elder";
  const secret = randomToken();
  const { data, error } = await db
    .from("devices")
    .insert({
      secret_hash: await sha256(secret),
      role,
      name: str(b.name, 40),
      lang: lang(b.lang),
      voice_lang: lang(b.voiceLang ?? b.lang),
      pro: Boolean(b.pro),
      tz: tzOk(b.tz),
      quiet_start: hhmm(b.quietStart, "21:30"),
      quiet_end: hhmm(b.quietEnd, "07:00"),
      fcm_token: b.fcmToken ? str(b.fcmToken, 400) : null,
    })
    .select("id")
    .single();
  if (error || !data) return err("register-failed", 500);
  return json({ ok: true, deviceId: data.id, secret });
}

async function update(d: Device, b: Body) {
  const patch: Record<string, unknown> = {};
  if (b.name !== undefined) patch.name = str(b.name, 40);
  if (b.lang !== undefined) patch.lang = lang(b.lang);
  if (b.voiceLang !== undefined) patch.voice_lang = lang(b.voiceLang);
  if (b.pro !== undefined) patch.pro = Boolean(b.pro);
  if (b.tz !== undefined) patch.tz = tzOk(b.tz);
  if (b.quietStart !== undefined) patch.quiet_start = hhmm(b.quietStart, d.quiet_start);
  if (b.quietEnd !== undefined) patch.quiet_end = hhmm(b.quietEnd, d.quiet_end);
  if (b.fcmToken !== undefined) patch.fcm_token = b.fcmToken ? str(b.fcmToken, 400) : null;
  if (b.role === "elder" || b.role === "family") patch.role = b.role;
  if (Object.keys(patch).length) await db.from("devices").update(patch).eq("id", d.id);
  return json({ ok: true });
}

async function ensureCircle(d: Device, b: Body) {
  if (d.role !== "elder") return err("elder-only", 403);
  let c = await circleOfElder(d.id);
  const patch: Record<string, unknown> = {};
  for (const k of ["share_meds", "share_meals", "share_mood", "share_missed", "digest", "nudge"] as const) {
    const camel = k.replace(/_(\w)/g, (_, x: string) => x.toUpperCase());
    if (b[camel] !== undefined) patch[k] = Boolean(b[camel]);
  }
  if (b.label !== undefined) patch.elder_label = str(b.label, 30);
  if (!c) {
    const { data, error } = await db
      .from("circles")
      .insert({ elder_id: d.id, elder_label: str(b.label, 30) || d.name, ...patch })
      .select()
      .single();
    if (error || !data) return err("circle-failed", 500);
    c = data as Circle;
  } else if (Object.keys(patch).length) {
    const { data } = await db.from("circles").update(patch).eq("id", c.id).select().single();
    c = data as Circle;
  }
  return json({ ok: true, circle: publicCircle(c) });
}

function publicCircle(c: Circle) {
  return {
    id: c.id,
    label: c.elder_label,
    shareMeds: c.share_meds,
    shareMeals: c.share_meals,
    shareMood: c.share_mood,
    shareMissed: c.share_missed,
    digest: c.digest,
    nudge: c.nudge,
  };
}

async function invite(d: Device) {
  if (d.role !== "elder") return err("elder-only", 403);
  const c = await circleOfElder(d.id);
  if (!c) return err("no-circle", 404);
  for (let i = 0; i < 5; i++) {
    const code = sixDigits();
    const expires = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
    const { error } = await db.from("circles").update({ invite_code: code, invite_expires: expires }).eq("id", c.id);
    if (!error) return json({ ok: true, code, expires });
  }
  return err("invite-failed", 500);
}

const joinFails = new Map<string, { n: number; until: number }>();

async function join(d: Device, b: Body, ip: string) {
  if (d.role !== "family") return err("family-only", 403);
  const f = joinFails.get(d.id);
  const g = joinFails.get(`ip:${ip}`);
  if ((f && f.n >= 8 && Date.now() < f.until) || (g && g.n >= 20 && Date.now() < g.until)) return err("too-many-tries", 429);
  const code = String(b.code ?? "").replace(/\D/g, "");
  const { data: c } = await db.from("circles").select("*").eq("invite_code", code).maybeSingle();
  if (!c || !c.invite_expires || new Date(c.invite_expires).getTime() < Date.now()) {
    for (const [k, prev] of [[d.id, f], [`ip:${ip}`, g]] as const) {
      const cur = prev && Date.now() < prev.until ? prev : { n: 0, until: Date.now() + 3600 * 1000 };
      cur.n += 1;
      joinFails.set(k, cur);
    }
    return err("bad-code", 404);
  }
  const { count } = await db.from("members").select("device_id", { count: "exact", head: true }).eq("circle_id", c.id);
  if ((count ?? 0) >= 12) return err("circle-full", 409);
  const relation = str(b.relation, 30);
  const displayName = str(b.displayName, 30) || d.name;
  await db.from("members").upsert({ circle_id: c.id, device_id: d.id, relation, display_name: displayName, blocked: false });
  // tell the elder
  const elder = (await db.from("devices").select("*").eq("id", c.elder_id).single()).data as Device;
  const rel = relation ? ` (${relation})` : "";
  await deliver(c as Circle, null, {
    to_device: elder.id,
    kind: "status",
    template: "joined",
    text_en: `${displayName}${rel} joined your Asha family circle. 💛`,
    text_hi: `${displayName}${rel} आपके आशा परिवार से जुड़ गए. 💛`,
    audio_path: null,
    silent: false,
  });
  return json({ ok: true, circle: { id: c.id, label: c.elder_label } });
}

async function state(d: Device) {
  if (d.role === "elder") {
    const c = await circleOfElder(d.id);
    if (!c) return json({ ok: true, role: "elder", circles: [], members: [], caps: await caps() });
    const { data: members } = await db
      .from("members")
      .select("device_id, relation, display_name, muted, blocked, joined_at, devices(last_seen, fcm_token)")
      .eq("circle_id", c.id);
    return json({
      ok: true,
      role: "elder",
      circles: [{ ...publicCircle(c), invite: c.invite_expires && new Date(c.invite_expires).getTime() > Date.now() ? { code: c.invite_code, expires: c.invite_expires } : null }],
      members: (members ?? []).map((m) => ({
        id: m.device_id,
        relation: m.relation,
        name: m.display_name,
        muted: m.muted,
        blocked: m.blocked,
        // deno-lint-ignore no-explicit-any
        hasPush: Boolean((m as any).devices?.fcm_token),
      })),
      caps: await caps(),
    });
  }
  const { data: rows } = await db.from("members").select("circle_id, relation, display_name, blocked, circles(id, elder_label, elder_id)").eq("device_id", d.id);
  const circles = [];
  for (const r of rows ?? []) {
    if (r.blocked) continue;
    // deno-lint-ignore no-explicit-any
    const c = (r as any).circles as { id: string; elder_label: string; elder_id: string };
    const { data: elder } = await db.from("devices").select("last_seen").eq("id", c.elder_id).maybeSingle();
    circles.push({ id: c.id, label: c.elder_label, relation: r.relation, myName: r.display_name, elderLastSeen: elder?.last_seen ?? null });
  }
  return json({ ok: true, role: "family", circles, members: [], caps: await caps() });
}

async function caps() {
  return { ai: Boolean(await geminiKey()), push: Boolean(await serviceAccount()) };
}

async function send(d: Device, b: Body) {
  const circle = await canUse(d, str(b.circleId, 40));
  if (!circle) return err("not-in-circle", 403);
  const kind = String(b.kind);
  if (!["preset", "custom", "heart", "voice"].includes(kind)) return err("bad-kind");
  if ((await sentToday(d.id, [kind])) >= (LIMITS[kind] ?? 20)) return err("limit", 429);

  const elderSide = d.id === circle.elder_id;
  let fromName = elderSide ? circle.elder_label || d.name : (await membership(circle.id, d.id))?.display_name || d.name;
  fromName = fromName || (elderSide ? "Maa" : "Family");
  const vars = { from: fromName, elder: circle.elder_label || "Maa" };
  const to = b.to ? str(b.to, 40) : null;

  if (kind === "heart") {
    const out = bothLangs({ en: "{from} sent you a heart ❤️", hi: "{from} ने आपको दिल भेजा ❤️" }, vars);
    const r = await deliver(circle, d, { to_device: to, kind, template: "heart", ...out, audio_path: null, silent: false });
    return json({ ok: true, id: r.message.id, pushed: r.pushed });
  }

  if (kind === "preset") {
    const p = presetById(str(b.template, 40));
    const allowed = elderSide ? FROM_ELDER : TO_ELDER;
    if (!p || !allowed.includes(p)) return err("bad-template");
    const out = bothLangs(p.text, vars);
    const r = await deliver(circle, d, { to_device: to, kind, template: p.id, ...out, audio_path: null, silent: false });
    return json({ ok: true, id: r.message.id, pushed: r.pushed });
  }

  // custom words and voice notes are Pro, and strictly checked
  if (!d.pro) return err("pro-only", 402);
  const key = await geminiKey();

  if (kind === "custom") {
    const v = await checkText(String(b.text ?? ""), key);
    if (!v.ok) return json({ ok: false, error: "blocked", reason: v.reason, hint: v.hint }, 422);
    const prefix = { en: `${fromName}: `, hi: `${fromName}: ` };
    const r = await deliver(circle, d, {
      to_device: to,
      kind,
      template: null,
      text_en: prefix.en + v.en,
      text_hi: prefix.hi + v.hi,
      original: String(b.text ?? "").slice(0, 300),
      audio_path: null,
      silent: false,
    });
    return json({ ok: true, id: r.message.id, pushed: r.pushed, checkedByAi: v.checkedByAi });
  }

  // voice note (now, or held for a time of day on the elder's clock)
  if (!key) return err("voice-needs-setup", 503);
  const elderDev = (await db.from("devices").select("*").eq("id", circle.elder_id).single()).data as Device;
  const when = elderSide ? null : deliverAt(str(b.at, 10), elderDev.tz);
  if (when === undefined) return err("bad-time");
  const audio = String(b.audio ?? "");
  const mime = str(b.mime, 40) || "audio/webm";
  if (!audio || audio.length > 700000) return err("too-long");
  const v = await checkVoice(audio, mime.split(";")[0], key);
  if (!v.ok) return json({ ok: false, error: "blocked", reason: v.reason, hint: v.hint }, 422);
  const path = `${circle.id}/${Date.now()}-${randomToken(6)}.${mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : "webm"}`;
  const bytes = Uint8Array.from(atob(audio), (c) => c.charCodeAt(0));
  const up = await db.storage.from("voice").upload(path, bytes, { contentType: mime.split(";")[0], upsert: false });
  if (up.error) return err("upload-failed", 500);
  const msg = {
    to_device: to,
    kind: "voice",
    template: null,
    text_en: `🎙 ${fromName}: “${v.en}”`,
    text_hi: `🎙 ${fromName}: “${v.hi}”`,
    original: v.said ?? null,
    audio_path: path,
    silent: false,
  };
  if (when) {
    const { data: row, error } = await db
      .from("messages")
      .insert({ ...msg, circle_id: circle.id, from_device: d.id, pending: true, deliver_at: when.toISOString() })
      .select("id")
      .single();
    if (error || !row) return err("server-error", 500);
    return json({ ok: true, id: row.id, pushed: 0, scheduled: when.toISOString() });
  }
  const r = await deliver(circle, d, msg);
  return json({ ok: true, id: r.message.id, pushed: r.pushed });
}

/** "now" / "" -> null (send now). "HH:MM" -> the next time the elder's clock shows it. Anything else -> undefined. */
function deliverAt(at: string, tz: string): Date | null | undefined {
  if (!at || at === "now") return null;
  if (!/^\d{2}:\d{2}$/.test(at)) return undefined;
  const want = toMin(at);
  if (want >= 24 * 60) return undefined;
  const now = localNow(tz).min;
  const minutes = (want - now + 1440) % 1440 || 1440;
  return new Date(Date.now() + minutes * 60000);
}

/** Held voice notes whose time has come: delivered as fresh messages (pushed then, with that time). */
async function releaseHeld() {
  const { data: due } = await db.from("messages").select("*").eq("pending", true).lte("deliver_at", new Date().toISOString()).limit(200);
  let n = 0;
  for (const m of due ?? []) {
    const { data: c } = await db.from("circles").select("*").eq("id", m.circle_id).maybeSingle();
    const { data: from } = await db.from("devices").select("*").eq("id", m.from_device).maybeSingle();
    await db.from("messages").delete().eq("id", m.id);
    if (!c || !from) continue;
    const member = await membership(c.id, from.id);
    if (!member || member.blocked) continue;
    await deliver(c as Circle, from as Device, {
      to_device: m.to_device,
      kind: m.kind,
      template: m.template,
      text_en: m.text_en,
      text_hi: m.text_hi,
      original: m.original ?? null,
      audio_path: m.audio_path,
      silent: false,
    });
    n += 1;
  }
  return n;
}

/** Automatic updates from the elder's phone. Only sent if she agreed. */
async function status(d: Device, b: Body) {
  if (d.role !== "elder") return err("elder-only", 403);
  const c = await circleOfElder(d.id);
  if (!c) return json({ ok: true, skipped: "no-circle" });
  const t = str(b.template, 20);
  const allowed =
    (t === "dose" && c.share_meds) || (t === "meal" && c.share_meals) || (t.startsWith("mood_") && c.share_mood);
  if (!allowed || !STATUS[t]) return json({ ok: true, skipped: "not-shared" });
  if ((await sentToday(d.id, ["status"])) >= LIMITS.status) return err("limit", 429);
  const label = c.elder_label || d.name || "Maa";
  const meal = MEALS[str(b.meal, 20)] ?? { en: str(b.meal, 30) || "meal", hi: str(b.meal, 30) || "खाना" };
  const time = str(b.time, 30);
  const out = bothLangs(STATUS[t], { elder: label, time: str(b.timeEn, 30) || time, meal: meal.en }, { elder: label, time: str(b.timeHi, 30) || time, meal: meal.hi });
  const r = await deliver(c, d, { to_device: null, kind: "status", template: t, ...out, audio_path: null, silent: c.digest });
  return json({ ok: true, id: r.message.id, pushed: r.pushed });
}

/** Missed medicine after 3 reminders, or the Help button. Always delivered, even in quiet hours. */
async function alert(d: Device, b: Body) {
  if (d.role !== "elder") return err("elder-only", 403);
  const c = await circleOfElder(d.id);
  if (!c) return json({ ok: true, skipped: "no-circle", pushed: 0 });
  const t = str(b.template, 20);
  if (t !== "missed" && t !== "sos") return err("bad-template");
  if (t === "missed" && !c.share_missed) return json({ ok: true, skipped: "not-shared", pushed: 0 });
  if ((await sentToday(d.id, ["alert"])) >= LIMITS.alert) return err("limit", 429);
  const label = c.elder_label || d.name || "Maa";
  const where = str(b.where, 120);
  const out = bothLangs(STATUS[t], { elder: label, time: str(b.timeEn, 30) || str(b.time, 30), where }, { elder: label, time: str(b.timeHi, 30) || str(b.time, 30), where });
  const r = await deliver(c, d, { to_device: null, kind: "alert", template: t, ...out, audio_path: null, silent: false });
  return json({ ok: true, id: r.message.id, pushed: r.pushed });
}

async function inbox(d: Device, b: Body) {
  const after = Number(b.after ?? 0) || 0;
  let circleIds: string[] = [];
  if (d.role === "elder") {
    const c = await circleOfElder(d.id);
    if (c) circleIds = [c.id];
  } else {
    const { data } = await db.from("members").select("circle_id, blocked").eq("device_id", d.id);
    circleIds = (data ?? []).filter((m) => !m.blocked).map((m) => m.circle_id);
  }
  if (!circleIds.length) return json({ ok: true, messages: [] });
  let q = db
    .from("messages")
    .select("id, circle_id, from_device, to_device, kind, template, text_en, text_hi, audio_path, silent, heard_at, heard_by, reaction, created_at, pending, deliver_at")
    .in("circle_id", circleIds)
    .order("id", { ascending: false })
    .limit(80);
  if (after) q = q.gt("id", after);
  const { data: rows } = await q;
  // blocked / muted senders are hidden from the elder; family sees only messages to or from them, plus the elder's updates
  let hidden = new Set<string>();
  if (d.role === "elder") {
    const { data: ms } = await db.from("members").select("device_id, blocked").in("circle_id", circleIds);
    hidden = new Set((ms ?? []).filter((m) => m.blocked).map((m) => m.device_id));
  }
  const { data: circles } = await db.from("circles").select("id, elder_id").in("id", circleIds);
  const elderOf = new Map((circles ?? []).map((c) => [c.id, c.elder_id]));
  const out = (rows ?? []).filter((m) => {
    // a held voice note is seen only by the one who recorded it, until its time
    if (m.pending && m.from_device !== d.id) return false;
    if (m.from_device && hidden.has(m.from_device)) return false;
    if (m.to_device && m.to_device !== d.id && m.from_device !== d.id) return false;
    if (d.role === "family") {
      const elder = elderOf.get(m.circle_id);
      // family sees: things the elder sent to everyone/them, digests/nudges/alerts, and their own messages
      return m.from_device === d.id || m.from_device === elder || m.from_device === null && m.to_device !== elder;
    }
    return true;
  });
  return json({
    ok: true,
    messages: out.map((m) => ({
      id: m.id,
      circleId: m.circle_id,
      mine: m.from_device === d.id,
      fromElder: m.from_device !== null && m.from_device === elderOf.get(m.circle_id),
      kind: m.kind,
      template: m.template,
      en: m.text_en,
      hi: m.text_hi,
      voice: Boolean(m.audio_path),
      scheduledFor: m.pending ? m.deliver_at : null,
      silent: m.silent,
      heardAt: m.heard_at,
      reaction: m.reaction,
      at: m.created_at,
    })),
  });
}

async function heard(d: Device, b: Body) {
  const ids = (Array.isArray(b.ids) ? b.ids : []).map(Number).filter(Number.isFinite).slice(0, 100);
  if (!ids.length) return json({ ok: true });
  const { data: rows } = await db.from("messages").select("id, circle_id, from_device, heard_at").in("id", ids);
  for (const m of rows ?? []) {
    if (m.heard_at || m.from_device === d.id) continue;
    if (!(await canUse(d, m.circle_id))) continue;
    await db.from("messages").update({ heard_at: new Date().toISOString(), heard_by: d.id }).eq("id", m.id);
  }
  return json({ ok: true });
}

async function react(d: Device, b: Body) {
  const id = Number(b.id);
  const reaction = ["❤️", "🙏", "😊", "🤗"].includes(String(b.reaction)) ? String(b.reaction) : "❤️";
  const { data: m } = await db.from("messages").select("*").eq("id", id).maybeSingle();
  if (!m || m.from_device === d.id) return err("not-found", 404);
  const c = await canUse(d, m.circle_id);
  if (!c) return err("not-in-circle", 403);
  await db.from("messages").update({ reaction, heard_at: m.heard_at ?? new Date().toISOString(), heard_by: d.id }).eq("id", id);
  // a tiny push back to the sender
  if (m.from_device) {
    const { data: sender } = await db.from("devices").select("*").eq("id", m.from_device).maybeSingle();
    if (sender && !inQuiet(sender as Device)) {
      const name = d.id === c.elder_id ? c.elder_label || d.name : (await membership(c.id, d.id))?.display_name || d.name;
      await push(await serviceAccount(), sender.fcm_token, {
        type: "reaction",
        id: String(id),
        circle: c.id,
        kind: "reaction",
        from: name,
        title_en: "Asha",
        title_hi: "आशा",
        en: `${name} ${reaction} your message`,
        hi: `${name} ने आपके संदेश पर ${reaction} भेजा`,
        quiet: "0",
        urgent: "0",
        voice: "0",
        to_role: sender.role,
      });
    }
  }
  return json({ ok: true });
}

async function member(d: Device, b: Body) {
  if (d.role !== "elder") return err("elder-only", 403);
  const c = await circleOfElder(d.id);
  if (!c) return err("no-circle", 404);
  const id = str(b.deviceId, 40);
  if (b.remove) {
    await db.from("members").delete().eq("circle_id", c.id).eq("device_id", id);
    return json({ ok: true });
  }
  const patch: Record<string, unknown> = {};
  if (b.muted !== undefined) patch.muted = Boolean(b.muted);
  if (b.blocked !== undefined) patch.blocked = Boolean(b.blocked);
  if (b.relation !== undefined) patch.relation = str(b.relation, 30);
  if (b.name !== undefined) patch.display_name = str(b.name, 30);
  await db.from("members").update(patch).eq("circle_id", c.id).eq("device_id", id);
  return json({ ok: true });
}

async function leave(d: Device, b: Body) {
  await db.from("members").delete().eq("circle_id", str(b.circleId, 40)).eq("device_id", d.id);
  return json({ ok: true });
}

async function voiceUrl(d: Device, b: Body) {
  const { data: m } = await db.from("messages").select("circle_id, audio_path").eq("id", Number(b.id)).maybeSingle();
  if (!m?.audio_path || !(await canUse(d, m.circle_id))) return err("not-found", 404);
  const { data } = await db.storage.from("voice").createSignedUrl(m.audio_path, 600);
  return json({ ok: true, url: data?.signedUrl ?? null });
}

async function forget(d: Device) {
  const c = await circleOfElder(d.id);
  if (c) {
    const { data: files } = await db.storage.from("voice").list(c.id, { limit: 1000 });
    if (files?.length) await db.storage.from("voice").remove(files.map((f) => `${c.id}/${f.name}`));
  }
  await db.from("devices").delete().eq("id", d.id);
  return json({ ok: true });
}

/** Test push to my own phone (Settings → "Send me a test"). */
async function selfTest(d: Device) {
  const r = await push(await serviceAccount(), d.fcm_token, {
    type: "family",
    id: "0",
    circle: "",
    kind: "test",
    from: "Asha",
    title_en: "Asha",
    title_hi: "आशा",
    en: "This is a test from Asha. Family messages will arrive like this. 💛",
    hi: "यह आशा की तरफ़ से एक जाँच है. परिवार के संदेश ऐसे ही आएँगे. 💛",
    quiet: "0",
    urgent: "0",
    voice: "0",
    to_role: d.role,
  });
  return json({ ok: r === "sent", result: r });
}

// ---------- scheduled jobs (called every 15 minutes by pg_cron) ----------

async function cron(req: Request) {
  const { data: secret } = await db.rpc("asha_secret", { secret_name: "asha_cron_secret" });
  if (!secret || req.headers.get("x-cron-secret") !== secret) return err("forbidden", 403);
  const { data: circles } = await db.from("circles").select("*, devices!circles_elder_id_fkey(*)");
  let digests = 0;
  let nudges = 0;
  for (const row of circles ?? []) {
    // deno-lint-ignore no-explicit-any
    const elder = (row as any).devices as Device & { last_seen: string };
    const c = row as Circle;
    if (!elder) continue;
    const now = localNow(elder.tz);
    const label = c.elder_label || elder.name || "Maa";

    // Night summary at about 8:30 pm her time
    if (c.digest && now.min >= 20 * 60 + 30 && c.last_digest_day !== now.day) {
      const since = new Date(Date.now() - 20 * 3600 * 1000).toISOString();
      const { data: today } = await db.from("messages").select("template, text_en, text_hi").eq("circle_id", c.id).eq("kind", "status").eq("silent", true).gte("created_at", since).order("id");
      const doses = (today ?? []).filter((m) => m.template === "dose").length;
      const meals = (today ?? []).filter((m) => m.template === "meal").length;
      const mood = [...(today ?? [])].reverse().find((m) => String(m.template).startsWith("mood_"));
      const en = [`Today with ${label}: ${doses} medicine time${doses === 1 ? "" : "s"} done, ${meals} meal${meals === 1 ? "" : "s"} eaten.`, mood?.text_en ?? ""].join(" ").trim();
      const hi = [`आज ${label} का दिन: ${doses} बार दवा ली, ${meals} बार खाना खाया.`, mood?.text_hi ?? ""].join(" ").trim();
      await deliver(c, elder, { to_device: null, kind: "digest", template: "digest", text_en: `🌙 ${en}`, text_hi: `🌙 ${hi}`, audio_path: null, silent: false });
      await db.from("circles").update({ last_digest_day: now.day }).eq("id", c.id);
      digests += 1;
    }

    // "Hasn't opened Asha today" at about 1 pm her time
    if (c.nudge && now.min >= 13 * 60 && c.last_nudge_day !== now.day) {
      const seen = localNow(elder.tz, new Date(elder.last_seen));
      if (seen.day !== now.day) {
        const out = bothLangs(STATUS.nudge, { elder: label });
        await deliver(c, null, { to_device: null, kind: "nudge", template: "nudge", ...out, audio_path: null, silent: false }, { familyOnly: true });
        nudges += 1;
      }
      await db.from("circles").update({ last_nudge_day: now.day }).eq("id", c.id);
    }
  }
  const released = await releaseHeld();
  // keep 90 days only
  await db.from("messages").delete().lt("created_at", new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString());
  return json({ ok: true, digests, nudges, released });
}

// ---------- router ----------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return err("post-only", 405);
  let body: Body;
  try {
    const raw = await req.text();
    if (raw.length > 800000) return err("too-large", 413);
    body = raw ? (JSON.parse(raw) as Body) : {};
  } catch {
    return err("bad-json");
  }
  const action = String(body.action ?? "");
  try {
    if (action === "cron") return await cron(req);
    if (action === "ping") return json({ ok: true, caps: await caps() });
    if (action === "register") return await register(body);
    const d = await auth(req);
    if (!d) return err("unknown-device", 401);
    switch (action) {
      case "update":
        return await update(d, body);
      case "circle":
        return await ensureCircle(d, body);
      case "invite":
        return await invite(d);
      case "join":
        return await join(d, body, (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim());
      case "state":
        return await state(d);
      case "send":
        return await send(d, body);
      case "status":
        return await status(d, body);
      case "alert":
        return await alert(d, body);
      case "inbox":
        return await inbox(d, body);
      case "heard":
        return await heard(d, body);
      case "react":
        return await react(d, body);
      case "member":
        return await member(d, body);
      case "leave":
        return await leave(d, body);
      case "voice-url":
        return await voiceUrl(d, body);
      case "forget":
        return await forget(d);
      case "test-push":
        return await selfTest(d);
      default:
        return err("unknown-action");
    }
  } catch (e) {
    console.error(action, String(e));
    return err("server-error", 500);
  }
});
