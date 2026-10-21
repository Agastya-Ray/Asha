import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * Asha's fairy, drawn in SVG in a soft chibi style: a big round face with large glossy teal eyes,
 * long wavy peach-blonde hair under a crown of roses and marigolds, pointed ears, a little red dress
 * with white dots, and teal butterfly wings. Standing moods share one body; asleep she curls up on the floor.
 * Sleepy or shy, she hides under a big leaf: held overhead when yawning, pulled down to peek from when shy,
 * and laid over her like a blanket when asleep.
 */

export type PixieMood = "idle" | "happy" | "sleep" | "talk" | "sad" | "yawn" | "thinking" | "asking" | "shy";

const SKIN = "#ffe7da";
const SKIN_SHADE = "#f6c5b1";
const LASH = "#3b2420";
const MOUTH = "#b8404f";

type Look = { x: number; y: number } | undefined;

export function Pixie({ mood = "idle", look, className }: { mood?: PixieMood; look?: Look; className?: string }) {
  const id = useId().replace(/:/g, "");
  return mood === "sleep" ? <Sleeping id={id} className={className} /> : <Standing id={id} mood={mood} look={look} className={className} />;
}

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <radialGradient id={`${id}glow`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fffbe0" stopOpacity="0.95" />
        <stop offset="50%" stopColor="#fff3c2" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#fff3c2" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}wing`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#c9f5f1" stopOpacity="0.95" />
        <stop offset="55%" stopColor="#7fd9d6" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#3fb3bf" stopOpacity="0.85" />
      </linearGradient>
      <linearGradient id={`${id}sheen`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#fff" stopOpacity="0" />
        <stop offset="50%" stopColor="#fff" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${id}hair`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffe2b6" />
        <stop offset="60%" stopColor="#fbc58e" />
        <stop offset="100%" stopColor="#f2a970" />
      </linearGradient>
      <linearGradient id={`${id}hairBack`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f7c38e" />
        <stop offset="100%" stopColor="#e99a62" />
      </linearGradient>
      <linearGradient id={`${id}dress`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ef5a4c" />
        <stop offset="100%" stopColor="#c23a33" />
      </linearGradient>
      <radialGradient id={`${id}face`} cx="50%" cy="38%" r="62%">
        <stop offset="0%" stopColor="#fff3ec" />
        <stop offset="72%" stopColor={SKIN} />
        <stop offset="100%" stopColor={SKIN_SHADE} />
      </radialGradient>
      <linearGradient id={`${id}iris`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0c4d5a" />
        <stop offset="45%" stopColor="#1f8f99" />
        <stop offset="100%" stopColor="#6fe0d2" />
      </linearGradient>
      <linearGradient id={`${id}bigleaf`} x1="1" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#b5e0a6" />
        <stop offset="55%" stopColor="#7fbf7a" />
        <stop offset="100%" stopColor="#4f9a5b" />
      </linearGradient>
      <radialGradient id={`${id}blush`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ff8c9a" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#ff8c9a" stopOpacity="0" />
      </radialGradient>
      <clipPath id={`${id}eyeL`}>
        <ellipse cx="80" cy="102" rx="12.5" ry="14" />
      </clipPath>
      <clipPath id={`${id}eyeR`}>
        <ellipse cx="120" cy="102" rx="12.5" ry="14" />
      </clipPath>
    </defs>
  );
}

/** Butterfly wings, the right side mirrored from the left. */
function Wings({ id }: { id: string }) {
  const upper = "M100 150 C90 120, 66 70, 34 56 C12 46, 0 66, 6 88 C14 116, 52 144, 100 154 Z";
  const lower = "M100 156 C80 160, 56 168, 46 186 C40 198, 50 210, 64 206 C82 200, 94 180, 100 160 Z";
  const side = (s: "l" | "r") => (
    <g className={`pixie-wing pixie-wing-${s}`} transform={s === "r" ? "translate(200 0) scale(-1 1)" : undefined}>
      <g className="pixie-wing-up">
        <path d={upper} fill={`url(#${id}wing)`} stroke="#2fa3b0" strokeWidth="1.4" />
        <path d="M98 150 C82 120, 54 86, 24 66 M98 152 C74 138, 44 118, 14 98" stroke="#3fb3bf" strokeWidth="1" fill="none" opacity="0.7" />
        <g fill="#fff" opacity="0.9">
          <circle cx="22" cy="66" r="2.8" />
          <circle cx="12" cy="80" r="2" />
          <circle cx="36" cy="62" r="1.6" />
          <circle cx="16" cy="96" r="1.5" />
        </g>
        <path className="pixie-sheen" d={upper} fill={`url(#${id}sheen)`} opacity="0.4" />
      </g>
      <g className="pixie-wing-low">
        <path d={lower} fill={`url(#${id}wing)`} stroke="#2fa3b0" strokeWidth="1.4" />
        <path d="M98 160 C80 172, 64 186, 56 198" stroke="#3fb3bf" strokeWidth="1" fill="none" opacity="0.7" />
        <g fill="#fff" opacity="0.9">
          <circle cx="56" cy="196" r="2" />
          <circle cx="66" cy="202" r="1.4" />
        </g>
      </g>
    </g>
  );
  return (
    <g className="pixie-wings">
      {side("l")}
      {side("r")}
    </g>
  );
}

function Flower({ x, y, kind, s = 1 }: { x: number; y: number; kind: "rose" | "marigold" | "daisy"; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {kind === "rose" ? (
        <>
          <circle r="6.5" fill="#e8574c" />
          <path d="M-3.5 -1 C-3 -4.5, 3 -4.5, 3.5 -0.5 C3 3, -2 3.6, -2.5 0.5 C-2 -1.6, 1.4 -1.8, 1.4 0.2" stroke="#b9302d" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        </>
      ) : kind === "marigold" ? (
        <>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <ellipse key={a} cy="-4.2" rx="2.4" ry="3.6" fill="#ff9a2e" transform={`rotate(${a})`} />
          ))}
          <circle r="2.8" fill="#ffcf4a" />
        </>
      ) : (
        <>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cy="-3.4" rx="2" ry="3" fill="#fff" transform={`rotate(${a})`} />
          ))}
          <circle r="1.8" fill="#ffd34d" />
        </>
      )}
    </g>
  );
}

/** The big leaf she hides under, its stem ending in her raised right hand at (135, 138). */
function BigLeaf({ id }: { id: string }) {
  return (
    <g className="pixie-leaf">
      <path d="M136 178 C138 150, 136 100, 126 42" stroke="#4f9a5b" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path
        d="M126 42 C150 30, 170 8, 152 -2 C130 -10, 72 -6, 42 20 C22 38, 16 64, 22 94 C38 76, 60 62, 84 56 C100 52, 116 48, 126 42 Z"
        fill={`url(#${id}bigleaf)`}
        stroke="#4f9a5b"
        strokeWidth="1.4"
      />
      <path d="M126 42 C96 32, 58 42, 28 84 M100 38 C96 22, 106 8, 120 0 M78 44 C66 30, 64 14, 70 4 M58 54 C44 46, 36 32, 36 22 M52 60 C40 64, 30 74, 26 84" stroke="#4f9a5b" strokeWidth="1.1" fill="none" opacity="0.7" />
      <path d="M140 6 C120 0, 90 2, 66 14" stroke="#e6f7dc" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
    </g>
  );
}

function Leaf({ x, y, r }: { x: number; y: number; r: number }) {
  return <path d="M0 0 C3 -4, 9 -4, 12 0 C9 4, 3 4, 0 0 Z" fill="#5fae6a" transform={`translate(${x} ${y}) rotate(${r})`} />;
}

/** Head centred near (100, 92): hair, ears, face, eyes that follow `look`, mouth by mood. */
/** The long wavy hair behind her, drawn before the body so it falls behind her shoulders. */
function HairBack({ id }: { id: string }) {
  return (
    <g className="pixie-hair-back">
      <path
        d="M52 90 C46 50, 76 34, 100 34 C124 34, 154 50, 148 90 C152 120, 158 150, 152 174 C148 186, 140 188, 136 180 C136 192, 124 196, 120 186 L80 186 C76 196, 64 192, 64 180 C60 188, 52 186, 48 174 C42 150, 48 120, 52 90 Z"
        fill={`url(#${id}hairBack)`}
      />
    </g>
  );
}

function Head({ id, mood, look }: { id: string; mood: PixieMood; look: Look }) {
  const closed = mood === "sleep" || mood === "yawn";
  const lx = (look?.x ?? 0) * 3.4 + (mood === "thinking" ? 3 : mood === "shy" ? -3.5 : 0);
  const ly = (look?.y ?? 0) * 3 + (mood === "thinking" ? -4 : 0) + (mood === "sad" || mood === "shy" ? 2.5 : 0);
  return (
    <g className="pixie-head">
      {/* pointed ears */}
      <path d="M60 102 C50 100, 42 92, 36 80 C48 84, 56 88, 62 94 Z" fill={SKIN} stroke={SKIN_SHADE} strokeWidth="1" />
      <path d="M58 98 C52 96, 47 91, 43 85 C50 88, 55 91, 59 95 Z" fill="#ffb7aa" opacity="0.7" />
      <path d="M140 102 C150 100, 158 92, 164 80 C152 84, 144 88, 138 94 Z" fill={SKIN} stroke={SKIN_SHADE} strokeWidth="1" />
      <path d="M142 98 C148 96, 153 91, 157 85 C150 88, 145 91, 141 95 Z" fill="#ffb7aa" opacity="0.7" />
      {/* face */}
      <path d="M58 94 C58 62, 78 50, 100 50 C122 50, 142 62, 142 94 C142 118, 124 134, 100 134 C76 134, 58 118, 58 94 Z" fill={`url(#${id}face)`} />
      <ellipse cx="68" cy="117" rx="10" ry="6.5" fill={`url(#${id}blush)`} />
      <ellipse cx="132" cy="117" rx="10" ry="6.5" fill={`url(#${id}blush)`} />
      {mood === "shy" ? (
        <g stroke="#ff7d8e" strokeWidth="1.3" strokeLinecap="round" opacity="0.8">
          <path d="M62 116 l3 -3 M67 117 l3 -3 M72 118 l3 -3 M125 118 l3 -3 M130 117 l3 -3 M135 116 l3 -3" />
        </g>
      ) : null}
      {/* eyes */}
      {closed ? (
        <g stroke={LASH} strokeWidth="2.8" strokeLinecap="round" fill="none">
          <path d="M68 104 C73 111, 87 111, 92 104" />
          <path d="M108 104 C113 111, 127 111, 132 104" />
          <path d="M68 104 l-4 1 M132 104 l4 1" strokeWidth="2" />
        </g>
      ) : mood === "happy" ? (
        <g stroke={LASH} strokeWidth="3.2" strokeLinecap="round" fill="none">
          <path d="M68 106 C72 95, 88 95, 92 106" />
          <path d="M108 106 C112 95, 128 95, 132 106" />
          <path d="M68 104 l-4 -2 M132 104 l4 -2" strokeWidth="2.2" />
        </g>
      ) : (
        <g>
          {(["L", "R"] as const).map((s) => {
            const cx = s === "L" ? 80 : 120;
            const o = s === "L" ? -1 : 1;
            return (
              <g key={s} className="pixie-eye" style={{ transformOrigin: `${cx}px 102px` }}>
                <g clipPath={`url(#${id}eye${s})`}>
                  <rect x={cx - 14} y="86" width="28" height="32" fill="#fff" />
                  <g style={{ transform: `translate(${lx}px, ${ly}px)`, transition: "transform 0.3s ease-out" }}>
                    <circle cx={cx} cy="103.5" r="12" fill={`url(#${id}iris)`} />
                    <circle cx={cx} cy="103.5" r="12" fill="none" stroke="#0b3f49" strokeWidth="1.2" />
                    <circle cx={cx} cy="103" r="5.6" fill="#08262c" />
                    <ellipse cx={cx + 4} cy="98" rx="4.2" ry="5" fill="#fff" />
                    <circle cx={cx - 4.5} cy="109" r="2.2" fill="#fff" opacity="0.9" />
                    <circle cx={cx + 5} cy="110" r="1.2" fill="#fff" opacity="0.8" />
                  </g>
                  <rect x={cx - 14} y="86" width="28" height="4" fill={SKIN_SHADE} opacity="0.5" />
                  {mood === "sad" ? <rect x={cx - 14} y="82" width="28" height="10" fill={SKIN} transform={`rotate(${-12 * o} ${cx} 90)`} /> : null}
                </g>
                {/* thick upper lash line with two flicks at the outer corner */}
                <path
                  d={`M${cx - 12 * o} 99 A12.8 14.2 0 0 ${o > 0 ? 1 : 0} ${cx + 13 * o} 103`}
                  stroke={LASH}
                  strokeWidth="3.4"
                  strokeLinecap="round"
                  fill="none"
                />
                <path d={`M${cx + 13 * o} 99 l${5 * o} -3 M${cx + 11 * o} 94.5 l${4 * o} -4`} stroke={LASH} strokeWidth="2" strokeLinecap="round" />
                <path d={`M${cx + 10 * o} 113 C${cx + 5 * o} 117.5, ${cx - 5 * o} 117.5, ${cx - 10 * o} 112`} stroke={LASH} strokeWidth="1" fill="none" opacity="0.35" />
              </g>
            );
          })}
        </g>
      )}
      {/* nose */}
      <path d="M98.6 116 q1.4 1.2 2.8 0" stroke={SKIN_SHADE} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      {/* mouth */}
      {mood === "sad" ? (
        <path d="M95 125 Q100 121 105 125" stroke={MOUTH} strokeWidth="2" strokeLinecap="round" fill="none" />
      ) : mood === "yawn" ? (
        <ellipse className="pixie-mouth-yawn" cx="100" cy="124" rx="4.6" ry="6" fill={MOUTH} />
      ) : mood === "talk" ? (
        <ellipse className="pixie-mouth-talk" cx="100" cy="123.5" rx="4.2" ry="3.4" fill={MOUTH} />
      ) : mood === "asking" ? (
        <ellipse cx="101" cy="124" rx="2.6" ry="2.4" fill={MOUTH} />
      ) : mood === "shy" ? (
        <path d="M96.5 123 Q100 125.5 103.5 123" stroke={MOUTH} strokeWidth="2" strokeLinecap="round" fill="none" />
      ) : mood === "thinking" ? (
        <path d="M96 124 Q101 122 105 125" stroke={MOUTH} strokeWidth="2" strokeLinecap="round" fill="none" />
      ) : (
        <g>
          <path d={mood === "happy" ? "M92 120 Q100 132 108 120 Z" : "M94.5 121 Q100 129 105.5 121 Z"} fill={MOUTH} />
          <path d={mood === "happy" ? "M95 125.5 Q100 130 105 125.5 Q100 127.5 95 125.5 Z" : "M96.5 124.5 Q100 127.5 103.5 124.5 Q100 126 96.5 124.5 Z"} fill="#ff97a6" />
        </g>
      )}
      {mood === "sad" ? <path className="pixie-tear" d="M68 112 q-2.8 4.4 0 6 q2.8 -1.6 0 -6 Z" fill="#a8e2f7" /> : null}
      {/* fringe: soft pointed strands across the forehead */}
      <path
        d="M54 92 C50 58, 74 38, 100 38 C126 38, 150 58, 146 92 C143 83, 139 77, 133 72 C131 80, 127 85, 121 87 C121 79, 117 73, 111 69 C107 78, 99 83, 89 85 C92 79, 92 73, 90 69 C84 77, 76 83, 66 85 C66 81, 66 77, 68 72 C62 78, 58 84, 54 92 Z"
        fill={`url(#${id}hair)`}
      />
      <path d="M111 69 C107 78, 99 83, 89 85 M90 69 C84 77, 76 83, 66 85 M133 72 C131 80, 127 85, 121 87" stroke="#e99a62" strokeWidth="1" fill="none" opacity="0.6" />
      {/* side locks over the shoulders */}
      <path d="M56 88 C50 110, 52 130, 58 146 C62 156, 58 166, 52 172 C64 172, 72 160, 70 146 C68 132, 64 112, 64 94 Z" fill={`url(#${id}hair)`} />
      <path d="M144 88 C150 110, 148 130, 142 146 C138 156, 142 166, 148 172 C136 172, 128 160, 130 146 C132 132, 136 112, 136 94 Z" fill={`url(#${id}hair)`} />
      <path d="M72 48 C86 40, 112 40, 126 48" stroke="#fff6e0" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />
      {/* brows show on top of the fringe only when they move */}
      {mood === "sad" ? (
        <g stroke="#c98a5a" strokeWidth="2" strokeLinecap="round" fill="none">
          <path d="M70 82 Q78 82 86 77" />
          <path d="M130 82 Q122 82 114 77" />
        </g>
      ) : mood === "thinking" || mood === "asking" ? (
        <g stroke="#c98a5a" strokeWidth="2" strokeLinecap="round" fill="none">
          <path d="M70 80 Q78 75 87 79" />
          <path d="M113 77 Q122 71 130 76" />
        </g>
      ) : null}
      {/* flower crown */}
      <g className="pixie-crown">
        <path d="M56 70 C70 46, 130 46, 144 70" stroke="#4f9a5b" strokeWidth="2" fill="none" />
        <Leaf x={58} y={66} r={-110} />
        <Leaf x={76} y={52} r={-150} />
        <Leaf x={118} y={48} r={-20} />
        <Leaf x={140} y={64} r={-60} />
        <Flower x={66} y={58} kind="daisy" s={0.9} />
        <Flower x={84} y={48} kind="rose" />
        <Flower x={101} y={45} kind="marigold" s={0.95} />
        <Flower x={118} y={47} kind="daisy" />
        <Flower x={134} y={56} kind="rose" s={0.85} />
      </g>
    </g>
  );
}

const ARMS: Record<Exclude<PixieMood, "sleep">, [string, string]> = {
  idle: ["M90 150 Q80 162 82 176", "M110 150 Q120 162 118 176"],
  happy: ["M90 150 Q76 140 72 126", "M110 150 Q124 140 128 126"],
  thinking: ["M90 150 Q90 166 104 168", "M110 150 Q122 142 114 132"],
  asking: ["M90 150 Q80 162 82 176", "M110 150 Q126 146 132 132"],
  sad: ["M90 150 Q92 164 99 170", "M110 150 Q108 164 101 170"],
  talk: ["M90 150 Q80 162 82 176", "M110 150 Q126 156 134 146"],
  yawn: ["M90 150 Q82 136 96 126", "M110 150 Q130 150 135 138"],
  shy: ["M90 150 Q92 164 99 170", "M110 150 Q130 150 135 138"],
};

function Dress({ id }: { id: string }) {
  return (
    <g>
      <path
        d="M88 146 C92 142, 108 142, 112 146 L114 162 C126 178, 136 196, 140 210 C130 216, 116 212, 108 216 C100 212, 92 216, 84 212 C76 216, 66 214, 60 210 C64 196, 74 178, 86 162 Z"
        fill={`url(#${id}dress)`}
      />
      <path d="M86 162 C94 166, 106 166, 114 162" stroke="#a92e2a" strokeWidth="1.4" fill="none" />
      <path d="M90 146 L92 140 M110 146 L108 140" stroke="#c23a33" strokeWidth="2" strokeLinecap="round" />
      <g fill="#fff" opacity="0.85">
        <circle cx="76" cy="196" r="1.6" />
        <circle cx="92" cy="186" r="1.3" />
        <circle cx="110" cy="198" r="1.6" />
        <circle cx="124" cy="186" r="1.3" />
        <circle cx="100" cy="206" r="1.2" />
        <circle cx="84" cy="204" r="1.1" />
        <circle cx="130" cy="202" r="1.1" />
      </g>
      <g fill="#ffd6cf">
        <circle cx="100" cy="150" r="1.4" />
        <circle cx="100" cy="156" r="1.4" />
      </g>
    </g>
  );
}

function Standing({ id, mood, look, className }: { id: string; mood: Exclude<PixieMood, "sleep">; look: Look; className?: string }) {
  const [armL, armR] = ARMS[mood];
  const end = (d: string) => d.split(" ").slice(-2).map(Number) as [number, number];
  return (
    <svg viewBox="0 -12 200 252" className={cn("pixie", `pixie-${mood}`, className)} role="img" aria-label="Asha the fairy">
      <Defs id={id} />
      <ellipse className="pixie-glow" cx="100" cy="130" rx="98" ry="110" fill={`url(#${id}glow)`} />
      <g className="pixie-dust" fill="#ffd95c">
        {[
          [78, 224, 2],
          [92, 236, 1.5],
          [114, 230, 1.8],
          [126, 238, 1.3],
          [104, 238, 1.6],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} style={{ animationDelay: `${i * 0.35}s` }} />
        ))}
      </g>
      <g className="pixie-fly">
        <Wings id={id} />
        <HairBack id={id} />
        {/* little legs, one bent as she hovers, and red shoes */}
        <g stroke={SKIN} strokeWidth="7" strokeLinecap="round" fill="none">
          <path d="M93 210 L91 226" />
          <path d="M107 210 Q111 220 117 223" />
        </g>
        <ellipse cx="90" cy="229" rx="5.5" ry="3.6" fill="#c23a33" />
        <ellipse cx="120" cy="224" rx="5.5" ry="3.6" fill="#c23a33" transform="rotate(-25 120 224)" />
        <path d="M96 140 L104 140 L105 148 L95 148 Z" fill={SKIN_SHADE} />
        <Dress id={id} />
        <Head id={id} mood={mood} look={look} />
        {mood === "shy" || mood === "yawn" ? <BigLeaf id={id} /> : null}
        <g className="pixie-arms" stroke={SKIN} strokeWidth="7" strokeLinecap="round" fill="none">
          <path d={armL} />
          <path d={armR} />
        </g>
        <circle cx={end(armL)[0]} cy={end(armL)[1]} r="4.4" fill={SKIN} />
        <circle cx={end(armR)[0]} cy={end(armR)[1]} r="4.4" fill={SKIN} />
        {mood === "thinking" ? (
          <g className="pixie-thought" fill="#fff" stroke="#d9cbb3">
            <circle cx="160" cy="44" r="3" />
            <circle cx="170" cy="32" r="4.5" />
            <circle cx="183" cy="18" r="7" />
          </g>
        ) : null}
        {mood === "asking" ? (
          <text x="160" y="46" fontSize="26" fontWeight="700" fill="#1f8f99" fontFamily="Fraunces, serif" className="pixie-q">
            ?
          </text>
        ) : null}
      </g>
      {mood === "happy" ? <Sparkles /> : null}
    </svg>
  );
}

function Sparkles() {
  const star = "M0 -6 L1.4 -1.4 L6 0 L1.4 1.4 L0 6 L-1.4 1.4 L-6 0 L-1.4 -1.4 Z";
  return (
    <g className="pixie-sparkles" fill="#ffd34d">
      {[
        [26, 56, 1],
        [176, 64, 0.8],
        [20, 150, 0.7],
        [182, 156, 1],
        [158, 22, 0.6],
      ].map(([x, y, s], i) => (
        <path key={i} d={star} transform={`translate(${x} ${y}) scale(${s})`} style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
    </g>
  );
}

/** Curled up on her side on the floor, cheek on her arms, wings folded over her back. */
function Sleeping({ id, className }: { id: string; className?: string }) {
  return (
    <svg viewBox="0 0 260 160" className={cn("pixie", "pixie-sleep", className)} role="img" aria-label="Asha the fairy, asleep">
      <Defs id={id} />
      <ellipse cx="130" cy="104" rx="128" ry="70" fill={`url(#${id}glow)`} opacity="0.7" />
      <ellipse cx="136" cy="154" rx="96" ry="5" fill="#000" opacity="0.08" />
      <g className="pixie-breathe">
        {/* wings resting folded over her back */}
        <path d="M150 124 C156 96, 176 68, 204 58 C218 54, 224 66, 216 76 C200 96, 176 114, 156 130 Z" fill={`url(#${id}wing)`} stroke="#2fa3b0" strokeWidth="1.3" />
        <path d="M156 128 C176 114, 202 104, 226 106 C236 108, 236 120, 226 122 C204 126, 180 130, 160 134 Z" fill={`url(#${id}wing)`} stroke="#2fa3b0" strokeWidth="1.3" />
        <g fill="#fff" opacity="0.9">
          <circle cx="206" cy="66" r="2.4" />
          <circle cx="214" cy="74" r="1.6" />
          <circle cx="224" cy="114" r="2" />
        </g>
        {/* dress lying sideways, little legs tucked up */}
        <path d="M118 128 C132 118, 160 118, 186 128 C196 134, 200 144, 196 150 C184 154, 170 150, 160 154 C148 150, 136 154, 124 150 C116 146, 114 136, 118 128 Z" fill={`url(#${id}dress)`} />
        <g fill="#fff" opacity="0.85">
          <circle cx="146" cy="140" r="1.5" />
          <circle cx="170" cy="134" r="1.3" />
          <circle cx="184" cy="144" r="1.4" />
        </g>
        <g stroke={SKIN} strokeWidth="7" strokeLinecap="round" fill="none">
          <path d="M188 142 Q202 140 210 148" />
          <path d="M182 148 Q194 152 204 152" />
        </g>
        <ellipse cx="213" cy="149" rx="5.5" ry="3.6" fill="#c23a33" />
        <ellipse cx="207" cy="153" rx="5.5" ry="3.6" fill="#c23a33" />
        {/* the big leaf, pulled over her like a blanket */}
        <g className="pixie-leaf-blanket">
          <path d="M106 142 C118 108, 176 94, 234 112 C246 118, 242 140, 228 146 C192 154, 140 154, 106 142 Z" fill={`url(#${id}bigleaf)`} stroke="#4f9a5b" strokeWidth="1.4" />
          <path d="M108 140 C150 124, 196 118, 236 120 M140 134 C150 120, 162 110, 176 104 M176 128 C186 118, 200 110, 214 108 M150 140 C170 140, 196 142, 220 140" stroke="#4f9a5b" strokeWidth="1.1" fill="none" opacity="0.7" />
          <path d="M106 142 C98 146, 94 140, 98 134" stroke="#4f9a5b" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        </g>
        {/* arms folded under her cheek */}
        <path d="M78 150 Q100 152 122 140" stroke={SKIN} strokeWidth="7" strokeLinecap="round" fill="none" />
        <circle cx="76" cy="150" r="4.6" fill={SKIN} />
        {/* her head resting on her arms */}
        <g transform="translate(80 88) rotate(-12) scale(0.72) translate(-100 -92)">
          <HairBack id={id} />
          <Head id={id} mood="sleep" look={undefined} />
        </g>
      </g>
      <g className="pixie-z" fill="#8fb9c0" fontFamily="Fraunces, serif" fontWeight="700">
        <text x="134" y="52" fontSize="15">z</text>
        <text x="146" y="36" fontSize="12">z</text>
        <text x="156" y="22" fontSize="9">z</text>
      </g>
    </svg>
  );
}
