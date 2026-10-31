// Titli's brain: who answers when you talk to her.
// By default the free Asha server (/api/chat). If the person pastes a key for their own AI account
// (Claude, ChatGPT, Gemini, Grok, OpenRouter, or any OpenAI-style service), the phone talks to that
// service directly. The key is kept only in this phone's storage, under its own name, so it is never
// part of the app's saved data, a family share, or a backup, and it is sent only to that service.
import Anthropic from "@anthropic-ai/sdk";
import { CapacitorHttp } from "@capacitor/core";
import { create } from "zustand";
import { parseTitli, titliContextNote, titliSystem, type TitliMood } from "../../../api/_titli";
import { apiChat } from "@/lib/asha/api";
import { isNative } from "@/lib/asha/native";
import type { Lang } from "@/lib/asha/types";

export type ProviderId = "claude" | "openai" | "gemini" | "grok" | "openrouter" | "other";

export type Provider = {
  id: ProviderId;
  name: string;
  /** OpenAI-style base URL (…/v1); Claude uses its own API */
  base: string;
  model: string;
  /** where to make a key */
  keyUrl: string;
  /** one line on cost, shown under the choice */
  cost: { en: string; hi: string };
};

export const PROVIDERS: Provider[] = [
  {
    id: "claude",
    name: "Claude",
    base: "https://api.anthropic.com",
    model: "claude-haiku-5-5",
    keyUrl: "https://console.anthropic.com/settings/keys",
    cost: { en: "Paid per message. A chatty day costs well under ₹1.", hi: "हर संदेश का पैसा. बातूनी दिन भी ₹1 से बहुत कम." },
  },
  {
    id: "openai",
    name: "ChatGPT (OpenAI)",
    base: "https://api.openai.com/v1",
    model: "gpt-4.1-mini",
    keyUrl: "https://platform.openai.com/api-keys",
    cost: { en: "Paid per message. A chatty day costs about ₹1–2.", hi: "हर संदेश का पैसा. बातूनी दिन लगभग ₹1–2." },
  },
  {
    id: "gemini",
    name: "Gemini (Google)",
    base: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-2.5-flash",
    keyUrl: "https://aistudio.google.com/apikey",
    cost: { en: "Has a free daily allowance. Easiest to start.", hi: "रोज़ का कुछ हिस्सा मुफ़्त. शुरू करना सबसे आसान." },
  },
  {
    id: "grok",
    name: "Grok (xAI)",
    base: "https://api.x.ai/v1",
    model: "grok-4.5",
    keyUrl: "https://console.x.ai",
    cost: { en: "Paid per message.", hi: "हर संदेश का पैसा." },
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    base: "https://openrouter.ai/api/v1",
    model: "openrouter/auto",
    keyUrl: "https://openrouter.ai/keys",
    cost: { en: "One key for many AIs. Paid per message.", hi: "एक चाबी, कई AI. हर संदेश का पैसा." },
  },
  {
    id: "other",
    name: "Other",
    base: "",
    model: "",
    keyUrl: "",
    cost: { en: "Any service that works like OpenAI. Needs its web address.", hi: "OpenAI जैसी कोई भी सेवा. उसका वेब पता चाहिए." },
  },
];

export const providerOf = (id: ProviderId) => PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];

/** Guess the service from the key itself, so most people only paste. */
export function guessProvider(key: string): ProviderId | null {
  const k = key.trim();
  if (k.startsWith("sk-ant-")) return "claude";
  if (k.startsWith("sk-or-")) return "openrouter";
  if (k.startsWith("AIza")) return "gemini";
  if (k.startsWith("xai-")) return "grok";
  if (k.startsWith("sk-")) return "openai";
  return null;
}

export type OwnAi = { provider: ProviderId; key: string; model: string; base: string };

const STORE = "asha-own-ai-v1";

function load(): OwnAi | null {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return null;
    const j = JSON.parse(raw) as Partial<OwnAi>;
    if (typeof j.key !== "string" || !j.key || !PROVIDERS.some((p) => p.id === j.provider)) return null;
    return { provider: j.provider as ProviderId, key: j.key, model: String(j.model ?? ""), base: String(j.base ?? "") };
  } catch {
    return null;
  }
}

export const useBrain = create<{ own: OwnAi | null; save: (own: OwnAi | null) => void }>((set) => ({
  own: typeof localStorage === "undefined" ? null : load(),
  save: (own) => {
    try {
      if (own) localStorage.setItem(STORE, JSON.stringify(own));
      else localStorage.removeItem(STORE);
    } catch {
      /* private mode: kept for this visit only */
    }
    set({ own });
  },
}));

export type Turn = { role: string; content: string };
export type ChatIn = { show: Lang; say: Lang; context: string; turns: Turn[]; fairy?: string };
export type Reply =
  | { ok: true; say: string; show: string; mood: TitliMood; via: "own" | "free"; ownFailed?: string }
  | { ok: false; error: string; status: number; ownFailed?: string };

/** Titli answers: with the person's own AI if they set one, else the free server. */
export async function titliChat(input: ChatIn): Promise<Reply> {
  const own = useBrain.getState().own;
  if (own) {
    const r = await askOwn(own, input);
    if (r.ok) return { ok: true, ...r.reply, via: "own" };
    // their account did not answer: say why, and let the free helper answer this time
    const free = await askFree(input);
    return { ...free, ownFailed: r.why };
  }
  return askFree(input);
}

async function askFree(input: ChatIn): Promise<Reply> {
  const res = await apiChat(input);
  if (!res.ok) return res;
  return { ok: true, say: res.say, show: res.show, mood: res.mood ?? "idle", via: "free" };
}

/** Why the person's own AI failed, in words for them. */
export type Why = "key" | "credit" | "model" | "offline" | "address" | "other";

/** Order turns for any service: starts with the person, never two in a row from the same side. */
export function tidyTurns(turns: Turn[]) {
  const out: { role: "user" | "assistant"; content: string }[] = [];
  for (const t of turns.slice(-10)) {
    const role = t.role === "asha" || t.role === "assistant" ? "assistant" : "user";
    const content = String(t.content ?? "").slice(0, 800).trim();
    if (!content) continue;
    if (!out.length && role === "assistant") continue;
    const last = out[out.length - 1];
    if (last && last.role === role) last.content += `\n${content}`;
    else out.push({ role, content });
  }
  return out;
}

export async function askOwn(own: OwnAi, input: ChatIn): Promise<{ ok: true; reply: { say: string; show: string; mood: TitliMood } } | { ok: false; why: Why; detail: string }> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return { ok: false, why: "offline", detail: "offline" };
  const p = providerOf(own.provider);
  const model = own.model.trim() || p.model;
  const system = `${titliSystem(input.show, input.say, input.fairy)}\n\n${titliContextNote(input.context.slice(0, 1200))}`;
  const turns = tidyTurns(input.turns);
  if (!turns.length) return { ok: false, why: "other", detail: "empty" };
  try {
    const text = own.provider === "claude" ? await claude(own.key, model, system, turns) : await openaiStyle(own, p, model, system, turns);
    const parsed = parseTitli(text);
    if (!parsed.say) return { ok: false, why: "other", detail: "empty reply" };
    return { ok: true, reply: { say: parsed.say, show: parsed.show ?? parsed.say, mood: parsed.mood } };
  } catch (e) {
    return { ok: false, ...whyOf(e) };
  }
}

class HttpFail extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`http ${status}`);
  }
}

function whyOf(e: unknown): { why: Why; detail: string } {
  const status = e instanceof HttpFail ? e.status : e instanceof Anthropic.APIError ? (e.status ?? 0) : 0;
  const body = e instanceof HttpFail ? e.body : e instanceof Error ? e.message : String(e);
  const detail = `${status || ""} ${body}`.trim().slice(0, 300);
  if (e instanceof Anthropic.APIConnectionError) return { why: "offline", detail };
  if (status === 401 || status === 403 || /valid api key|api key not valid|invalid.{0,12}key|incorrect api key|authentication/i.test(body)) return { why: "key", detail };
  if (status === 402 || status === 429 || /credit|quota|billing|insufficient|balance/i.test(body)) return { why: "credit", detail };
  if (status === 404 || /model/i.test(body)) return { why: "model", detail };
  if (status === 0 && /fetch|network|failed/i.test(body)) return { why: "address", detail };
  return { why: "other", detail };
}

async function claude(key: string, model: string, system: string, turns: { role: "user" | "assistant"; content: string }[]) {
  // The phone talks to Claude directly with the person's own key (it never passes through our server)
  const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true, maxRetries: 1, timeout: 30_000 });
  const res = await client.messages.create({
    model,
    max_tokens: 2000,
    system,
    // a quick, warm chat: little thinking needed
    output_config: { effort: "low" },
    messages: turns,
  });
  if (res.stop_reason === "refusal") return '{"say":"Hmm, I can\'t talk about that one. Shall we talk about something else?","mood":"shy"}';
  return res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}

async function openaiStyle(own: OwnAi, p: Provider, model: string, system: string, turns: { role: "user" | "assistant"; content: string }[]) {
  const base = (own.provider === "other" ? own.base : p.base).trim().replace(/\/+$/, "");
  if (!/^https:\/\//.test(base)) throw new HttpFail(0, "address must start with https://");
  const body: Record<string, unknown> = { model, messages: [{ role: "system", content: system }, ...turns] };
  // OpenAI's newer models want max_completion_tokens; everyone else understands max_tokens
  if (own.provider === "openai") body.max_completion_tokens = 1500;
  else body.max_tokens = 1500;
  if (own.provider === "openai" || own.provider === "gemini" || own.provider === "grok") body.response_format = { type: "json_object" };
  const headers: Record<string, string> = { "content-type": "application/json", authorization: `Bearer ${own.key.trim()}` };
  if (own.provider === "openrouter") {
    headers["HTTP-Referer"] = "https://asha-rho.vercel.app";
    headers["X-Title"] = "Asha";
  }
  const { status, data } = await postJson(`${base}/chat/completions`, headers, body);
  if (status < 200 || status >= 300) throw new HttpFail(status, typeof data === "string" ? data : JSON.stringify(data));
  const j = data as { choices?: { message?: { content?: string | { text?: string }[] } }[] };
  const c = j.choices?.[0]?.message?.content;
  return typeof c === "string" ? c : Array.isArray(c) ? c.map((x) => x.text ?? "").join("") : "";
}

/** On the phone, native HTTP (no browser CORS rules, so any service works). In a browser, fetch. */
async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<{ status: number; data: unknown }> {
  if (isNative) {
    const r = await CapacitorHttp.post({ url, headers, data: body, connectTimeout: 15_000, readTimeout: 30_000 });
    return { status: r.status, data: r.data };
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30_000);
  try {
    const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: ctrl.signal });
    const text = await r.text();
    let data: unknown = text;
    try {
      data = JSON.parse(text);
    } catch {
      /* keep text */
    }
    return { status: r.status, data };
  } finally {
    clearTimeout(timer);
  }
}

/** Words for the person when their own AI did not answer. */
export function whyWords(why: Why | string, lang: Lang, name: string) {
  const w: Record<Why, { en: string; hi: string }> = {
    key: { en: `${name} did not accept this key. Check it was copied fully.`, hi: `${name} ने यह चाबी नहीं मानी. देखिए पूरी कॉपी हुई है.` },
    credit: { en: `Your ${name} account is out of credit or busy right now.`, hi: `आपके ${name} खाते में पैसे खत्म हैं या वह अभी व्यस्त है.` },
    model: { en: `${name} does not know that model name.`, hi: `${name} इस मॉडल का नाम नहीं जानता.` },
    offline: { en: "No internet right now.", hi: "अभी इंटरनेट नहीं." },
    address: { en: `Could not reach ${name}. Check the web address.`, hi: `${name} तक नहीं पहुँच पाए. वेब पता देखिए.` },
    other: { en: `${name} did not answer just now.`, hi: `${name} ने अभी जवाब नहीं दिया.` },
  };
  const l = w[(why as Why) in w ? (why as Why) : "other"];
  return lang === "hi" ? l.hi : l.en;
}
