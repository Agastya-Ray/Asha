// POST /api/voices  {}  ->  { ok, voices: [{ id, owner, name, about, accent, preview }] }
// Candidate voices for Titli, for the "Choose Titli's voice" screen in Settings.
import { guard, json, preflight } from "./_shared.js";
import { elevenChoices, elevenKey } from "./_eleven.js";

export function OPTIONS() {
  return preflight();
}

// GET works too, so the voice list can be checked from a browser
export const GET = (request: Request) => POST(request);

export async function POST(request: Request) {
  const blocked = guard(request, "voices", 30);
  if (blocked) return blocked;
  if (!elevenKey()) return json({ ok: false, error: "Titli's voices are not switched on yet." }, 503);
  const voices = await elevenChoices();
  if (!voices.length) return json({ ok: false, error: "No voices came back. Try again in a minute." }, 503);
  return json({ ok: true, voices });
}
