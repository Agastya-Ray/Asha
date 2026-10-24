// Strict checks for anything a person types or says (Pro only).
// Step 1: fast rules, always on.  Step 2: an AI check + translation, when a Gemini key is set.

export type Verdict =
  | { ok: true; en: string; hi: string; checkedByAi: boolean }
  | { ok: false; reason: Reason; hint: { en: string; hi: string } };

export type Reason = "empty" | "long" | "link" | "number" | "money" | "medical" | "rude" | "unkind" | "unsafe";

const HINTS: Record<Reason, { en: string; hi: string }> = {
  empty: { en: "Write a few words first.", hi: "पहले कुछ शब्द लिखें." },
  long: { en: "Keep it short and sweet — under 200 letters.", hi: "छोटा और प्यारा रखें — 200 अक्षर से कम." },
  link: { en: "Links can't be sent here. Tell her about it in a call instead.", hi: "यहाँ लिंक नहीं भेज सकते. फ़ोन पर बता दें." },
  number: { en: "Phone and account numbers can't be sent here, to keep her safe from scams.", hi: "धोखाधड़ी से बचाने के लिए यहाँ फ़ोन या खाता नंबर नहीं भेज सकते." },
  money: { en: "Messages about money, OTPs or payments are blocked to keep her safe. Please call instead.", hi: "सुरक्षा के लिए पैसे, ओटीपी या भुगतान वाले संदेश रोके जाते हैं. फ़ोन कर लें." },
  medical: { en: "Changes to medicines should come from her doctor, not a message. Try: “Did you take your medicines today?”", hi: "दवा में बदलाव डॉक्टर से हो, संदेश से नहीं. ऐसे लिखें: “आज दवा ले ली?”" },
  rude: { en: "That doesn't sound kind. Try something warm, like “Thinking of you.”", hi: "यह प्यार भरा नहीं लगता. कुछ ऐसा लिखें: “आपकी याद आ रही है.”" },
  unkind: { en: "Asha only carries warm messages. Maybe say it gently in a call?", hi: "आशा सिर्फ़ प्यार भरे संदेश भेजती है. शायद फ़ोन पर प्यार से कहें?" },
  unsafe: { en: "This message can't be sent. Please call her directly.", hi: "यह संदेश नहीं भेजा जा सकता. सीधे फ़ोन कर लें." },
};

const fail = (reason: Reason): Verdict => ({ ok: false, reason, hint: HINTS[reason] });

const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|in|net|org|co|ly|me|app|link|xyz|info|io)\b|bit\.ly|wa\.me|t\.me)/i;
const LONG_NUMBER = /(\d[\s-]?){6,}/;
const MONEY =
  /\b(otp|upi|paytm|phonepe|gpay|google pay|bank|account|ifsc|atm|pin|cvv|card|loan|lottery|prize|kyc|aadhaa?r|pan card|transfer|send money|pay me|rupees?|rs\.?|₹|inr|password)\b|पैसे भेज|पैसा भेज|ओटीपी|खाता|बैंक|लॉटरी|इनाम|पिन|पासवर्ड|paise bhej|paisa bhej|paise de|paisa de|udhaar|udhar/i;
const MEDICAL =
  /\b(stop|skip|double|quit|don'?t take|do not take|no need (of|for|to take)|throw|reduce|increase|extra)\b.{0,25}\b(medicine|medicines|tablet|tablets|pill|pills|insulin|dose|meds|dawa|dawai|goli|injection)\b|\b(medicine|tablet|pill|insulin|dose|dawa|dawai|goli)\b.{0,25}\b(stop|skip|double|band kar|mat lo|mat lena|chhod)\b|दवा (बंद|छोड़|मत|दोगुनी)|गोली (बंद|छोड़|मत)|(बंद|छोड़) (कर|दो).{0,10}दवा/i;
// Short list on purpose: the AI check catches the rest. Matched as whole words.
const RUDE_WORDS = [
  "idiot", "stupid", "useless", "shut up", "hate you", "die", "dumb", "fool", "bitch", "bastard", "fuck", "shit",
  "pagal", "bewakoof", "bevkoof", "gadha", "kutta", "kutti", "kamina", "kamini", "harami", "chup", "nikammi", "nikamma",
  "बेवकूफ", "पागल", "गधा", "गधी", "कुत्ता", "कुत्ती", "कमीना", "हरामी", "चुप", "निकम्मी", "निकम्मा", "मर जा",
];
const RUDE = new RegExp(`(^|[^\\p{L}])(${RUDE_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?=$|[^\\p{L}])`, "iu");

export function isHindi(s: string) {
  return /[ऀ-ॿ]/.test(s);
}

export function quickCheck(raw: string): Verdict | null {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return fail("empty");
  if (text.length > 200) return fail("long");
  if (LINK.test(text)) return fail("link");
  if (MONEY.test(text)) return fail("money");
  if (LONG_NUMBER.test(text)) return fail("number");
  if (MEDICAL.test(text)) return fail("medical");
  if (RUDE.test(text)) return fail("rude");
  return null;
}

const AI_PROMPT = `You check short messages that family members send to an elderly parent (or that the parent sends to family) inside a care app.
Only warm, kind, everyday messages may pass. Reject if the message contains ANY of:
- insults, anger, guilt-tripping, threats, sexual content, or anything that could upset or frighten an older person
- requests for money, payments, OTPs, passwords, bank or ID details, or anything that looks like a scam or impersonation
- telling them to stop, skip, change, double or start any medicine, or other medical instructions
- links, phone numbers, or instructions to install apps or press buttons
Return ONLY JSON: {"ok":true|false,"reason":"unkind|money|medical|unsafe|link|number","en":"<message in simple English>","hi":"<same message in simple Hindi, Devanagari>"}
Keep the meaning and the sender's voice. Do not add anything. If ok is false, en and hi may be empty.`;

/** Full check. `geminiKey` may be empty: then only the fast rules run and no translation happens. */
export async function checkText(raw: string, geminiKey: string): Promise<Verdict> {
  const quick = quickCheck(raw);
  if (quick) return quick;
  const text = raw.replace(/\s+/g, " ").trim();
  if (!geminiKey) {
    return { ok: true, en: text, hi: text, checkedByAi: false };
  }
  const out = await gemini(geminiKey, [{ text: `${AI_PROMPT}\n\nMessage:\n"""${text}"""` }]);
  if (!out) return { ok: true, en: text, hi: text, checkedByAi: false };
  if (!out.ok) {
    const r = (["unkind", "money", "medical", "unsafe", "link", "number"] as Reason[]).find((x) => x === out.reason) ?? "unkind";
    return fail(r);
  }
  const en = String(out.en ?? "").trim().slice(0, 300) || text;
  const hi = String(out.hi ?? "").trim().slice(0, 300) || text;
  // the translation must pass the fast rules too
  if (quickCheck(en) || quickCheck(hi)) return fail("unsafe");
  return { ok: true, en, hi, checkedByAi: true };
}

/** Voice note: transcribe + check in one call. Needs a Gemini key. */
export async function checkVoice(base64: string, mime: string, geminiKey: string): Promise<Verdict & { said?: string }> {
  const out = await gemini(geminiKey, [
    {
      text: `${AI_PROMPT}\nThis message is a short voice note. Listen to HOW it is said as well as the words: also reject (reason "unkind") a raised, angry, harsh, mocking, cold or threatening tone, shouting, or someone crying or in distress, even when the words themselves are fine. Also include "said": the exact words spoken, in the language spoken. If you cannot hear words clearly, return ok:false reason:"unsafe".`,
    },
    { inline_data: { mime_type: mime, data: base64 } },
  ]);
  if (!out) return fail("unsafe");
  const said = String(out.said ?? "").trim();
  if (!out.ok || !said) return fail(((["unkind", "money", "medical", "unsafe", "link", "number"] as Reason[]).find((x) => x === out.reason) ?? "unsafe"));
  const quick = quickCheck(said);
  if (quick) return quick;
  return { ok: true, en: String(out.en ?? said).slice(0, 300), hi: String(out.hi ?? said).slice(0, 300), checkedByAi: true, said };
}

/** A photo family sends for a medicine: it must show medicine (a strip, tablets, a bottle or a box) and nothing else. */
export async function checkPhoto(base64: string, geminiKey: string): Promise<Verdict> {
  const out = await gemini(geminiKey, [
    {
      text: `A family member is adding a photo of a medicine for an elderly parent, to show at reminder time.
Accept ONLY a photo of medicine: a blister strip, tablets or capsules, a bottle, a box or a label.
Reject anything else: people, faces, screenshots, text messages, money, QR codes, links, or anything upsetting.
Return ONLY JSON: {"ok":true|false,"reason":"unsafe"}`,
    },
    { inline_data: { mime_type: "image/jpeg", data: base64 } },
  ]);
  if (!out) return { ok: true, en: "", hi: "", checkedByAi: false };
  return out.ok ? { ok: true, en: "", hi: "", checkedByAi: true } : fail("unsafe");
}

type Part = { text: string } | { inline_data: { mime_type: string; data: string } };

async function gemini(key: string, parts: Part[]): Promise<Record<string, unknown> | null> {
  const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: { temperature: 0, maxOutputTokens: 500, responseMimeType: "application/json" },
      }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const raw = (body.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    const s = raw.indexOf("{");
    const e = raw.lastIndexOf("}");
    if (s < 0 || e < s) return null;
    return JSON.parse(raw.slice(s, e + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}
