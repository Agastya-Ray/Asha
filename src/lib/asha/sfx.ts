import { awake } from "@/lib/asha/companion";
import { useAsha } from "@/lib/asha/store";

/**
 * The fairy's little sounds, made on the spot with Web Audio (no sound files to ship or license):
 *   chime   — a sparkle when she waves hello or cheers
 *   giggle  — "hee hee" when she is shy or blushing
 *   yawn    — before she curls up to sleep
 *   sad     — a soft "aww" when you send her away for a bad reason
 *   pop     — Chintu tumbling in with a love note
 *   flutter — her wings when she flies by
 * Soft and short, on the media volume. Silent in quiet hours (bedtime to wake-up) and when switched off in Settings.
 */

export type Sfx = "chime" | "giggle" | "yawn" | "sad" | "pop" | "flutter";

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function context() {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
  return ctx;
}

// phones only allow sound after the first touch, so wake the audio up then
if (typeof window !== "undefined")
  window.addEventListener("pointerdown", () => context(), { once: true, capture: true });

function allowed(now = new Date()) {
  const s = useAsha.getState();
  return s.fairySounds && !(s.quietUntil > now.getTime()) && awake(s.wakeTime, s.sleepTime, now);
}

/** Plays one sound; says whether it was heard (false at night, when switched off, or before the first touch). */
export function fairySound(name: Sfx) {
  if (!allowed()) return false;
  const ac = context();
  if (!ac || ac.state !== "running") return false;
  try {
    const out = ac.createGain();
    out.gain.value = 0.22;
    out.connect(ac.destination);
    PLAY[name](ac, out, ac.currentTime + 0.01);
    return true;
  } catch {
    // a sound is a nicety; never let it break the app
    return false;
  }
}

const heard = new Set<string>();
/** Plays a sound once for a moment (say, "all doses taken today"), even if the fairy is redrawn on another tab. */
export function fairySoundOnce(name: Sfx, moment: string) {
  if (heard.has(moment)) return;
  if (fairySound(name)) heard.add(moment);
}

type Play = (ac: AudioContext, out: AudioNode, t: number) => void;

/** One soft bell note with a quick attack and a gentle fade. */
function bell(ac: AudioContext, out: AudioNode, t: number, freq: number, len: number, vol = 1) {
  for (const [mult, amp] of [
    [1, 1],
    [2.01, 0.35],
    [3.02, 0.12],
  ]) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "sine";
    o.frequency.value = freq * mult;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol * amp, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + len + 0.05);
  }
}

function noiseBuffer(ac: AudioContext) {
  if (noise && noise.sampleRate === ac.sampleRate) return noise;
  noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noise;
}

/** A sung little vowel: a buzzy tone through two "mouth" filters, so it sounds voice-like rather than electronic. */
function voice(
  ac: AudioContext,
  out: AudioNode,
  t: number,
  len: number,
  pitch: [number, number][],
  formants: [number, number],
  vol: number,
) {
  const o = ac.createOscillator();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(pitch[0][1], t);
  for (const [at, f] of pitch.slice(1)) o.frequency.linearRampToValueAtTime(f, t + at);
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + Math.min(0.04, len / 4));
  g.gain.setValueAtTime(vol, t + len * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  const mix = ac.createGain();
  mix.gain.value = 1;
  for (const f of formants) {
    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = f;
    bp.Q.value = 6;
    o.connect(bp).connect(mix);
  }
  mix.connect(g).connect(out);
  o.start(t);
  o.stop(t + len + 0.05);
}

const PLAY: Record<Sfx, Play> = {
  // a quick rising sparkle: four bell notes
  chime: (ac, out, t) => {
    [1568, 1976, 2349, 3136].forEach((f, i) => bell(ac, out, t + i * 0.07, f, 0.7, 0.55));
  },
  // "hee hee hee": three tiny high vowels, each one a little lower
  giggle: (ac, out, t) => {
    [0, 0.15, 0.3].forEach((d, i) => {
      const p = 820 - i * 60;
      voice(
        ac,
        out,
        t + d,
        0.11,
        [
          [0, p * 1.15],
          [0.05, p],
          [0.11, p * 0.9],
        ],
        [2700, 3400],
        2.4,
      );
    });
  },
  // "aaah-mm": rises, then sinks slowly, the mouth closing as it goes
  yawn: (ac, out, t) => {
    voice(
      ac,
      out,
      t,
      1.3,
      [
        [0, 300],
        [0.35, 420],
        [1.3, 230],
      ],
      [850, 1250],
      1.6,
    );
  },
  // "aww": two soft falling notes
  sad: (ac, out, t) => {
    bell(ac, out, t, 784, 0.6, 0.5);
    bell(ac, out, t + 0.28, 622, 0.9, 0.45);
  },
  // a round bubbly pop
  pop: (ac, out, t) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(900, t);
    o.frequency.exponentialRampToValueAtTime(180, t + 0.09);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.15);
    bell(ac, out, t + 0.1, 2093, 0.4, 0.3);
  },
  // tiny wings: airy noise beating fast, fading in and out
  flutter: (ac, out, t) => {
    const src = ac.createBufferSource();
    src.buffer = noiseBuffer(ac);
    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 3200;
    bp.Q.value = 1.2;
    const beat = ac.createGain();
    beat.gain.value = 0.5;
    const lfo = ac.createOscillator();
    lfo.frequency.value = 22;
    const depth = ac.createGain();
    depth.gain.value = 0.5;
    lfo.connect(depth).connect(beat.gain);
    const env = ac.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(1.3, t + 0.12);
    env.gain.linearRampToValueAtTime(0, t + 0.6);
    src.connect(bp).connect(beat).connect(env).connect(out);
    src.start(t);
    lfo.start(t);
    src.stop(t + 0.65);
    lfo.stop(t + 0.65);
  },
};

/** Plays one sound into any audio graph (used to render a preview offline). */
export function playInto(name: Sfx, ac: BaseAudioContext, out: AudioNode, t: number) {
  PLAY[name](ac as AudioContext, out, t);
}
