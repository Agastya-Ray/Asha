// POST /api/rx  { image: "data:image/jpeg;base64,..." }  ->  { ok, medicines[], unreadable, caution, date, doctor, instructions[], followUp }
// Reads a prescription photo. Nothing is stored on the server.
import { guard, json, preflight, readBody, visionText } from "./_shared.js";

export function OPTIONS() {
  return preflight();
}

const PROMPT = `Read this prescription for a medicine reminder. Return ONLY JSON with this shape:
{"medicines":[{"name":"","dose":"","times":["08:00"],"food":"with","days":0,"note":""}],"unreadable":false,"caution":"","date":"","doctor":"","instructions":[],"followUp":""}
food is one of before, with, after, anytime.
Use 24-hour HH:MM times. Common Indian shorthand: OD = once a day (08:00), BD = twice (08:00, 20:00), TDS = three times (08:00, 14:00, 20:00), HS = at bedtime (21:30), SOS = only when needed (times empty, say so in note), AC = before food, PC = after food, 1-0-1 means morning and night.
If a time is a guess, say "times are a guess" in note. days is the course length in days if written, else 0.
Never invent a medicine that is not visible. If you cannot read the page, medicines is empty and unreadable is true.
caution is one short sentence a family member should know, or empty.
date is the date written on the prescription as YYYY-MM-DD, or empty. doctor is the doctor's name as written, or empty.
instructions are the doctor's other advice in short plain sentences, copied faithfully (diet, rest, exercise, tests to do, what to avoid), at most 8; never add advice that is not written.
followUp is the date of the next visit as YYYY-MM-DD if written (or worked out from the prescription date, e.g. "review after 2 weeks"), else empty.`;

export async function POST(request: Request) {
  const blocked = guard(request, "rx", 10);
  if (blocked) return blocked;
  const body = await readBody<{ image?: string }>(request, 2_500_000);
  const image = String(body?.image ?? "");
  if (!image.startsWith("data:image/") || image.length > 2_400_000) {
    return json({ ok: false, error: "too-large" }, 400);
  }
  const raw = await visionText(PROMPT, image);
  if (!raw) return json({ ok: false, error: "unavailable" }, 503);
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < start) return json({ ok: false, error: "unreadable" }, 422);
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as {
      medicines?: { name?: unknown; dose?: unknown; times?: unknown; food?: unknown; days?: unknown; note?: unknown }[];
      unreadable?: boolean;
      caution?: unknown;
      date?: unknown;
      doctor?: unknown;
      instructions?: unknown;
      followUp?: unknown;
    };
    const day = (v: unknown) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v ?? "")) ? String(v) : "");
    const medicines = (Array.isArray(parsed.medicines) ? parsed.medicines : [])
      .map((m) => ({
        name: String(m.name ?? "").slice(0, 80).trim(),
        dose: String(m.dose ?? "").slice(0, 80).trim(),
        times: Array.isArray(m.times) ? m.times.map((t) => String(t)).slice(0, 6) : [],
        food: String(m.food ?? "anytime"),
        days: Number.isFinite(Number(m.days)) ? Math.max(0, Math.min(365, Math.round(Number(m.days)))) : 0,
        note: String(m.note ?? "").slice(0, 180).trim(),
      }))
      .filter((m) => m.name)
      .slice(0, 20);
    return json({
      ok: true,
      medicines,
      unreadable: Boolean(parsed.unreadable) || medicines.length === 0,
      caution: String(parsed.caution ?? "").slice(0, 240),
      date: day(parsed.date),
      doctor: String(parsed.doctor ?? "").slice(0, 80).trim(),
      instructions: (Array.isArray(parsed.instructions) ? parsed.instructions : [])
        .map((x) => String(x ?? "").slice(0, 200).trim())
        .filter(Boolean)
        .slice(0, 8),
      followUp: day(parsed.followUp),
    });
  } catch {
    return json({ ok: false, error: "unreadable" }, 422);
  }
}
