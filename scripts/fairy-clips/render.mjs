// Records Titli's fixed lines once, in Jessica (the default voice), into public/fairy-clips/ so the app plays
// them without a call. Lines with a name in them are cut around the name (src/lib/asha/clip-segments.ts), so only
// the name is left out. Run with: node --experimental-strip-types scripts/fairy-clips/render.mjs
// Needs ELEVENLABS_API_KEY. Existing clips are skipped, so a run that stops at the free plan's limit can be resumed.
import ts from "typescript";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { clipSegments } from "../../src/lib/asha/clip-segments.ts";

const VOICE = "cgSgspJ2msm6clMCkdW9"; // Jessica, same as DEFAULT_FAIRY_VOICE in api/_eleven.ts
const OUT = "public/fairy-clips";
const KEY = process.env.ELEVENLABS_API_KEY ?? "";
// flash_v2_5 costs half a credit a character; the free plan has 10,000 credits a month
const MAX_CREDITS = Number(process.env.MAX_CREDITS ?? 9000);
const PLACEHOLDER_NAME = "Ami";

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    return /\.(ts|tsx)$/.test(e.name) ? [p] : [];
  });
}

// Value of a template or string literal with the name filled in. Expressions that need the app to run are skipped.
function literalText(node, sf, name) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (!ts.isTemplateExpression(node)) return null;
  let out = node.head.text;
  for (const span of node.templateSpans) {
    let value;
    try {
      value = new Function("name", `return (${span.expression.getText(sf)});`)(name);
    } catch {
      return null;
    }
    out += value == null ? "" : String(value);
    out += span.literal.text;
  }
  return out;
}

const first = (f) => (/fairy-intro|onboarding/.test(f) ? 1 : 0);

function lines() {
  const found = new Map();
  const add = (lang, raw, names) => {
    const clean = raw.replace(/\s+/g, " ").trim();
    // a label ("Settings") is not something she says; a sentence is
    if (clean.split(" ").length < 3) return;
    for (const piece of clipSegments(clean, names)) found.set(`${lang}|${piece}`, { lang, text: piece });
  };
  // the first-run screens come first, so they are recorded first when the free plan's credits run short
  const files = [...walk("src/components/asha"), ...walk("src/lib/asha")].sort((a, b) => first(b) - first(a));
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    // only files that say something out loud, or show her guide
    if (!/\bspeak\(|FairyGuide/.test(source)) continue;
    const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    const visit = (node) => {
      if (ts.isObjectLiteralExpression(node)) {
        const prop = (k) => node.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText(sf).replace(/["']/g, "") === k);
        const en = prop("en");
        const hi = prop("hi");
        if (en && hi) {
          for (const [lang, p] of [["en", en], ["hi", hi]]) {
            for (const [name, names] of [["", []], [PLACEHOLDER_NAME, [PLACEHOLDER_NAME]]]) {
              const raw = literalText(p.initializer, sf, name);
              if (raw != null) add(lang, raw, names);
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return [...found.values()];
}

async function say(text) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_64`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "xi-api-key": KEY },
    body: JSON.stringify({
      text,
      model_id: "eleven_flash_v2_5",
      voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.55, use_speaker_boost: true, speed: 0.85 },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return Buffer.from(await res.arrayBuffer());
}

if (process.env.DRY) {
  const all = lines();
  console.log(all.length, all.reduce((n, l) => n + l.text.length, 0));
  console.log(all.slice(0, 12));
  process.exit(0);
}
if (!KEY) throw new Error("ELEVENLABS_API_KEY is not set");
mkdirSync(OUT, { recursive: true });
const indexPath = join(OUT, "index.json");
const index = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, "utf8")) : {};
const todo = lines().filter((l) => !index[`${l.lang}|${l.text}`]);
const chars = todo.reduce((n, l) => n + l.text.length, 0);
console.log(`${todo.length} lines to record, ${chars} characters (about ${chars / 2} credits)`);

let spent = 0;
let n = Object.keys(index).length;
for (const line of todo) {
  const cost = line.text.length / 2;
  if (spent + cost > MAX_CREDITS) {
    console.log(`stopping at the credit limit (${MAX_CREDITS}); run again later to continue`);
    break;
  }
  const file = `${String(++n).padStart(4, "0")}.mp3`;
  writeFileSync(join(OUT, file), await say(line.text));
  index[`${line.lang}|${line.text}`] = file;
  spent += cost;
  writeFileSync(indexPath, JSON.stringify(index, null, 1));
}
console.log(`done: ${Object.keys(index).length} lines in index, ${spent} credits spent this run`);
