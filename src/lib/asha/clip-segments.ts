// Splits one line of Titli's speech into the pieces that are kept as clips. Pure, so the app and the
// clip renderer (scripts/fairy-clips) cut every line the same way.

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Splits a line at its pauses ("…") and around the names in it: "What a lovely name, Ami. Every…" becomes
 * "What a lovely name,", "Ami" and ". Every…". Only the name changes from person to person, so the rest can be kept. */
export function clipSegments(text: string, names: string[]) {
  const found = names.filter((n) => n.length >= 2);
  const re = found.length ? new RegExp(`(${found.map(escape).join("|")})`) : null;
  return text
    .split(/\s*…\s*/)
    .flatMap((piece) => (re ? piece.split(re) : [piece]))
    .map((p) => p.trim())
    .filter((p) => /[\p{L}\p{N}]/u.test(p));
}
