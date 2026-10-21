import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * Asha's fairy, drawn in SVG: a slender little pixie with a honey-blonde top bun tied with a marigold,
 * pointed ears, big blue eyes, a petal dress of leaves, and two pairs of shimmering dragonfly wings.
 * Standing moods share one body; sleeping is its own pose, curled up on her side on the floor.
 */

export type PixieMood = "idle" | "happy" | "sleep" | "talk" | "sad" | "yawn" | "thinking" | "asking";

const SKIN = "#fcdcc8";
const SKIN_SHADE = "#f1bfa4";
const LINE = "#6b3f2a";

type Look = { x: number; y: number } | undefined;

export function Pixie({ mood = "idle", look, className }: { mood?: PixieMood; look?: Look; className?: string }) {
  const id = useId().replace(/:/g, "");
  return mood === "sleep" ? <Sleeping id={id} className={className} /> : <Standing id={id} mood={mood} look={look} className={className} />;
}

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <radialGradient id={`${id}glow`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff9d6" stopOpacity="0.95" />
        <stop offset="45%" stopColor="#fff2b0" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#fff2b0" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}wing`} x1="0" y1="1" x2="0.4" y2="0">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
        <stop offset="40%" stopColor="#d9f3ff" stopOpacity="0.6" />
        <stop offset="75%" stopColor="#e9dcff" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#fff3fb" stopOpacity="0.35" />
      </linearGradient>
      <linearGradient id={`${id}sheen`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#fff" stopOpacity="0" />
        <stop offset="50%" stopColor="#fff" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${id}hair`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffe9a3" />
        <stop offset="55%" stopColor="#f7cf62" />
        <stop offset="100%" stopColor="#e9b44a" />
      </linearGradient>
      <linearGradient id={`${id}dress`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8fdc8a" />
        <stop offset="100%" stopColor="#3fa45b" />
      </linearGradient>
      <linearGradient id={`${id}leaf`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7fd17e" />
        <stop offset="100%" stopColor="#2f8e4e" />
      </linearGradient>
      <radialGradient id={`${id}face`} cx="45%" cy="40%" r="65%">
        <stop offset="0%" stopColor="#fff0e6" />
        <stop offset="70%" stopColor={SKIN} />
        <stop offset="100%" stopColor={SKIN_SHADE} />
      </radialGradient>
      <radialGradient id={`${id}iris`} cx="50%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#bfe9ff" />
        <stop offset="55%" stopColor="#4aa3e0" />
        <stop offset="100%" stopColor="#1f5f9e" />
      </radialGradient>
      <radialGradient id={`${id}blush`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ff8fa3" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#ff8fa3" stopOpacity="0" />
      </radialGradient>
      <clipPath id={`${id}eyeL`}>
        <path d="M78 83 C78 73, 85 69, 90 70 C96 71, 99 77, 98 84 C97 91, 92 94, 88 94 C82 94, 78 89, 78 83 Z" />
      </clipPath>
      <clipPath id={`${id}eyeR`}>
        <path d="M122 83 C122 73, 115 69, 110 70 C104 71, 101 77, 102 84 C103 91, 108 94, 112 94 C118 94, 122 89, 122 83 Z" />
      </clipPath>
    </defs>
  );
}

/** One pair of wings, the right side mirrored from the left. */
function Wings({ id, folded = false }: { id: string; folded?: boolean }) {
  const upper = "M99 126 C80 112, 40 96, 22 66 C14 50, 24 38, 38 46 C66 62, 92 98, 100 124 Z";
  const lower = "M99 132 C80 136, 48 146, 36 166 C30 178, 42 184, 52 176 C70 162, 90 146, 100 134 Z";
  const veins = "M99 124 C76 104, 50 82, 30 56 M98 120 C84 110, 70 104, 58 102 M99 133 C80 144, 60 158, 44 174";
  const side = (s: "l" | "r") => (
    <g className={`pixie-wing pixie-wing-${s}`} transform={s === "r" ? "translate(200 0) scale(-1 1)" : undefined}>
      <g className="pixie-wing-up">
        <path d={upper} fill={`url(#${id}wing)`} stroke="#a9dcf2" strokeWidth="1.3" />
        <path d={veins.split(" M")[0] + (folded ? "" : " M" + veins.split(" M")[1])} stroke="#c8e9f8" strokeWidth="0.8" fill="none" />
        <path className="pixie-sheen" d={upper} fill={`url(#${id}sheen)`} opacity="0.5" />
      </g>
      <g className="pixie-wing-low">
        <path d={lower} fill={`url(#${id}wing)`} stroke="#bfe6f7" strokeWidth="1.1" />
        <path d={"M" + veins.split(" M")[2]} stroke="#c8e9f8" strokeWidth="0.8" fill="none" />
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

/** Head centred on (100, 80): hair, ears, face, eyes that follow `look`, mouth by mood. */
function Head({ id, mood, look }: { id: string; mood: PixieMood; look: Look }) {
  const closed = mood === "sleep" || mood === "yawn";
  const happyEyes = mood === "happy";
  const lx = (look?.x ?? 0) * 3.2;
  const ly = (look?.y ?? 0) * 2.6 + (mood === "thinking" ? -3 : 0) + (mood === "sad" ? 2 : 0);
  return (
    <g className="pixie-head">
      {/* back hair */}
      <path d="M68 84 C62 56, 78 40, 100 40 C122 40, 138 56, 132 84 C130 96, 124 104, 120 106 L80 106 C76 104, 70 96, 68 84 Z" fill="#e9b44a" />
      {/* bun with a marigold tie */}
      <g className="pixie-bun">
        <ellipse cx="100" cy="30" rx="17" ry="14" fill={`url(#${id}hair)`} />
        <path d="M88 30 C92 22, 106 20, 110 28 M90 35 C96 30, 106 30, 112 34" stroke="#e2a83e" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <path d="M86 40 C94 44, 106 44, 114 40" stroke="#f08a24" strokeWidth="4" strokeLinecap="round" fill="none" />
        <g transform="translate(117 38)">
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <ellipse key={a} cx="0" cy="-4" rx="3" ry="4.2" fill="#ffa62b" transform={`rotate(${a})`} />
          ))}
          <circle r="2.6" fill="#ffd34d" />
        </g>
      </g>
      {/* pointed ears */}
      <path d="M72 80 C64 76, 56 66, 50 56 C60 60, 68 66, 74 72 Z" fill={SKIN} stroke={SKIN_SHADE} strokeWidth="1" />
      <path d="M72 78 C66 74, 61 68, 57 62 C63 66, 68 70, 73 74 Z" fill="#f8b9a6" opacity="0.7" />
      <path d="M128 80 C136 76, 144 66, 150 56 C140 60, 132 66, 126 72 Z" fill={SKIN} stroke={SKIN_SHADE} strokeWidth="1" />
      <path d="M128 78 C134 74, 139 68, 143 62 C137 66, 132 70, 127 74 Z" fill="#f8b9a6" opacity="0.7" />
      {/* face: soft heart shape with a little chin */}
      <path d="M71 80 C71 60, 84 50, 100 50 C116 50, 129 60, 129 80 C129 96, 116 110, 100 112 C84 110, 71 96, 71 80 Z" fill={`url(#${id}face)`} />
      <ellipse cx="80" cy="96" rx="8" ry="5" fill={`url(#${id}blush)`} />
      <ellipse cx="120" cy="96" rx="8" ry="5" fill={`url(#${id}blush)`} />
      {/* eyes */}
      {closed ? (
        <g stroke={LINE} strokeWidth="2.2" strokeLinecap="round" fill="none">
          <path d="M79 85 C84 90, 93 90, 97 85" />
          <path d="M103 85 C107 90, 116 90, 121 85" />
          <path d="M79 85 l-3 -1.5 M121 85 l3 -1.5" strokeWidth="1.6" />
        </g>
      ) : happyEyes ? (
        <g stroke={LINE} strokeWidth="2.6" strokeLinecap="round" fill="none">
          <path d="M79 87 C83 79, 93 79, 97 87" />
          <path d="M103 87 C107 79, 117 79, 121 87" />
        </g>
      ) : (
        <g className="pixie-eyes">
          {(["L", "R"] as const).map((s) => {
            const cx = s === "L" ? 88 : 112;
            return (
              <g key={s}>
                <g clipPath={`url(#${id}eye${s})`}>
                  <rect x={cx - 12} y="66" width="24" height="30" fill="#fff" />
                  <rect x={cx - 12} y="66" width="24" height="6.5" fill={SKIN_SHADE} opacity="0.55" />
                  <g style={{ transform: `translate(${lx}px, ${ly}px)`, transition: "transform 0.3s ease-out" }}>
                    <circle cx={cx} cy="83.5" r="9.4" fill={`url(#${id}iris)`} />
                    <circle cx={cx} cy="84" r="4.8" fill="#132d4a" />
                    <circle cx={cx + 3} cy="80" r="3" fill="#fff" />
                    <circle cx={cx - 2.8} cy="87" r="1.3" fill="#fff" opacity="0.85" />
                  </g>
                  {mood === "sad" ? <rect x={cx - 12} y="64" width="24" height="9" fill={SKIN} transform={`rotate(${s === "L" ? -12 : 12} ${cx} 72)`} /> : null}
                </g>
                {/* upper lash line with a flick at the outer corner */}
                <path
                  className="pixie-lash"
                  d={s === "L" ? "M77.5 83 C78 73, 85 69, 90 70 C94 70.5, 97 73, 98 76" : "M122.5 83 C122 73, 115 69, 110 70 C106 70.5, 103 73, 102 76"}
                  stroke={LINE}
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  fill="none"
                />
                <path d={s === "L" ? "M82 92 C86 94.5, 92 94.5, 96 90" : "M118 92 C114 94.5, 108 94.5, 104 90"} stroke={LINE} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
                <path d={s === "L" ? "M78 79 q-3 -1 -5 -4" : "M122 79 q3 -1 5 -4"} stroke={LINE} strokeWidth="2" strokeLinecap="round" />
              </g>
            );
          })}
        </g>
      )}
      {/* brows */}
      <g stroke="#c98d3a" strokeWidth="1.6" strokeLinecap="round" fill="none">
        {mood === "sad" ? (
          <>
            <path d="M80 66 Q88 66 95 62" />
            <path d="M120 66 Q112 66 105 62" />
          </>
        ) : mood === "thinking" || mood === "asking" ? (
          <>
            <path d="M80 64 Q88 59 96 63" />
            <path d="M104 62 Q112 56 120 61" />
          </>
        ) : (
          <>
            <path d="M80 65 Q88 61 96 64" />
            <path d="M104 64 Q112 61 120 65" />
          </>
        )}
      </g>
      {/* nose */}
      <path d="M99 95 q2 1.6 3 0" stroke={SKIN_SHADE} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* mouth */}
      {mood === "sad" ? (
        <path d="M94 104 Q100 100 106 104" stroke="#b5485c" strokeWidth="2" strokeLinecap="round" fill="none" />
      ) : mood === "yawn" ? (
        <ellipse className="pixie-mouth-yawn" cx="100" cy="103" rx="4.2" ry="5.5" fill="#a83a52" />
      ) : mood === "talk" ? (
        <ellipse className="pixie-mouth-talk" cx="100" cy="102.5" rx="4" ry="3" fill="#a83a52" />
      ) : mood === "happy" ? (
        <g>
          <path d="M92 100 Q100 110 108 100 Z" fill="#a83a52" />
          <path d="M95 104 Q100 108 105 104 Q100 106 95 104 Z" fill="#ff8fa3" />
        </g>
      ) : mood === "asking" ? (
        <ellipse cx="101" cy="103" rx="2.4" ry="2" fill="#a83a52" />
      ) : mood === "thinking" ? (
        <path d="M95 103 Q101 101 106 104" stroke="#b5485c" strokeWidth="2" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M94 101 Q100 106 106 101" stroke="#b5485c" strokeWidth="2" strokeLinecap="round" fill="none" />
      )}
      {mood === "sad" ? <path className="pixie-tear" d="M80 92 q-2.6 4 0 5.6 q2.6 -1.6 0 -5.6 Z" fill="#9fd6f5" /> : null}
      {/* front hair: a side-swept fringe and two loose locks */}
      <path d="M70 80 C66 56, 82 42, 100 42 C120 42, 134 56, 130 80 C128 70, 124 63, 116 58 C108 66, 92 70, 78 68 C74 70, 72 74, 70 80 Z" fill={`url(#${id}hair)`} />
      <path d="M116 58 C106 66, 92 70, 78 68" stroke="#e2a83e" strokeWidth="1.2" fill="none" />
      <path d="M86 50 C96 46, 108 46, 116 52" stroke="#fff3c4" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.8" />
      <path d="M71 74 C66 86, 68 96, 75 102 C73 92, 73 84, 75 76 Z" fill={`url(#${id}hair)`} />
      <path d="M129 74 C134 86, 132 96, 125 102 C127 92, 127 84, 125 76 Z" fill={`url(#${id}hair)`} />
    </g>
  );
}

const ARMS: Record<Exclude<PixieMood, "sleep">, [string, string]> = {
  idle: ["M88 124 Q78 140 82 156", "M112 124 Q124 136 126 150"],
  happy: ["M88 124 Q72 114 66 98", "M112 124 Q128 114 134 98"],
  thinking: ["M88 124 Q86 142 104 146", "M112 124 Q124 114 110 106"],
  asking: ["M88 124 Q78 140 82 156", "M112 124 Q130 120 136 104"],
  sad: ["M88 124 Q90 142 98 152", "M112 124 Q110 142 102 152"],
  talk: ["M88 124 Q78 140 82 156", "M112 124 Q130 132 138 120"],
  yawn: ["M88 124 Q78 114 96 106", "M112 124 Q130 110 128 90"],
};

function Standing({ id, mood, look, className }: { id: string; mood: Exclude<PixieMood, "sleep">; look: Look; className?: string }) {
  const [armL, armR] = ARMS[mood];
  const hand = (d: string) => d.split(" ").slice(-2).map(Number) as [number, number];
  return (
    <svg viewBox="0 0 200 260" className={cn("pixie", `pixie-${mood}`, className)} role="img" aria-label="Asha the fairy">
      <Defs id={id} />
      <ellipse className="pixie-glow" cx="100" cy="130" rx="98" ry="118" fill={`url(#${id}glow)`} />
      <g className="pixie-dust" fill="#ffd95c">
        {[
          [70, 232, 2.2],
          [86, 246, 1.6],
          [118, 240, 2],
          [132, 252, 1.4],
          [102, 254, 1.8],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} style={{ animationDelay: `${i * 0.35}s` }} />
        ))}
      </g>
      <g className="pixie-fly">
        <Wings id={id} />
        {/* legs: one straight, one bent back, as if hovering; tiny leaf slippers with puff tips */}
        <path d="M91 180 C90 198, 90 214, 90 230 L95 230 C96 214, 97 198, 98 180 Z" fill={SKIN} />
        <path d="M103 180 C106 194, 110 204, 114 210 C118 216, 121 222, 125 226 L129 222 C124 214, 120 206, 118 198 C116 190, 113 184, 112 180 Z" fill={SKIN} />
        <path d="M84 236 C85 229, 96 228, 98 233 C98 238, 90 240, 84 236 Z" fill="#3fa45b" />
        <circle cx="83.5" cy="235" r="3.4" fill="#fff" />
        <path d="M124 230 C122 224, 130 218, 134 222 C136 226, 130 232, 124 230 Z" fill="#3fa45b" />
        <circle cx="135" cy="221" r="3.4" fill="#fff" />
        {/* skirt of leaves with a pointed hem */}
        <path
          d="M90 148 C80 160, 72 172, 66 184 L76 180 L80 192 L88 182 L94 194 L100 183 L106 194 L112 182 L120 192 L124 180 L134 184 C128 172, 120 160, 110 148 Z"
          fill={`url(#${id}dress)`}
        />
        <path d="M100 150 L100 182 M92 152 L84 182 M108 152 L116 182" stroke="#2f8e4e" strokeWidth="0.9" opacity="0.6" />
        {/* neck, shoulders, leaf bodice */}
        <path d="M96 108 L104 108 L105 120 L95 120 Z" fill={SKIN_SHADE} />
        <path d="M86 122 Q100 115 114 122 L112 132 L88 132 Z" fill={SKIN} />
        <path d="M88 128 L93 122 L98 128 L100 121 L102 128 L107 122 L112 128 L110 150 C106 154, 94 154, 90 150 Z" fill={`url(#${id}leaf)`} />
        <path d="M90 149 C96 152, 104 152, 110 149" stroke="#2f8e4e" strokeWidth="1.2" fill="none" />
        {/* arms */}
        <g className="pixie-arms" stroke={SKIN} strokeWidth="5" strokeLinecap="round" fill="none">
          <path className="pixie-arm-l" d={armL} />
          <path className="pixie-arm-r" d={armR} />
        </g>
        <circle cx={hand(armL)[0]} cy={hand(armL)[1]} r="3.4" fill={SKIN} />
        <circle cx={hand(armR)[0]} cy={hand(armR)[1]} r="3.4" fill={SKIN} />
        <Head id={id} mood={mood} look={look} />
        {mood === "thinking" ? (
          <g className="pixie-thought" fill="#fff" stroke="#d9cbb3">
            <circle cx="148" cy="44" r="3" />
            <circle cx="158" cy="32" r="4.5" />
            <circle cx="172" cy="18" r="7" />
          </g>
        ) : null}
        {mood === "asking" ? (
          <text x="146" y="50" fontSize="26" fontWeight="700" fill="#4aa3e0" fontFamily="Fraunces, serif" className="pixie-q">
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
        [30, 60, 1],
        [172, 70, 0.8],
        [24, 150, 0.7],
        [178, 160, 1],
        [150, 24, 0.6],
      ].map(([x, y, s], i) => (
        <path key={i} d={star} transform={`translate(${x} ${y}) scale(${s})`} style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
    </g>
  );
}

/** Curled up on her side on the floor, cheek on her hands, wings folded over her back. */
function Sleeping({ id, className }: { id: string; className?: string }) {
  return (
    <svg viewBox="0 0 260 150" className={cn("pixie", "pixie-sleep", className)} role="img" aria-label="Asha the fairy, asleep">
      <Defs id={id} />
      <ellipse cx="130" cy="96" rx="128" ry="70" fill={`url(#${id}glow)`} opacity="0.7" />
      <ellipse cx="130" cy="144" rx="80" ry="5" fill="#000" opacity="0.08" />
      <g className="pixie-breathe">
        <g transform="translate(104 142) scale(1.22) translate(-104 -142)">
        {/* folded wings resting over her back */}
        <g opacity="0.9">
          <path d="M128 112 C140 90, 162 64, 192 52 C200 50, 202 58, 196 64 C176 82, 154 102, 134 116 Z" fill={`url(#${id}wing)`} stroke="#bfe6f7" strokeWidth="1.1" />
          <path d="M132 114 C150 100, 176 88, 204 86 C212 86, 212 94, 206 96 C182 104, 156 112, 136 118 Z" fill={`url(#${id}wing)`} stroke="#bfe6f7" strokeWidth="1.1" />
          <path className="pixie-sheen" d="M128 112 C140 90, 162 64, 192 52 C200 50, 202 58, 196 64 C176 82, 154 102, 134 116 Z" fill={`url(#${id}sheen)`} opacity="0.4" />
        </g>
        {/* skirt and bodice lying sideways */}
        <path d="M128 120 C140 110, 156 106, 170 108 L166 116 L176 118 L168 124 L176 130 L164 130 L166 138 L154 132 L150 140 L144 132 C136 132, 130 128, 128 120 Z" fill={`url(#${id}dress)`} />
        <path d="M104 118 C112 112, 124 112, 132 116 L132 132 C122 136, 110 136, 104 130 Z" fill={`url(#${id}leaf)`} />
        {/* tucked legs and slippers */}
        <path d="M158 126 Q144 134 134 138 Q148 141 162 140" stroke={SKIN_SHADE} strokeWidth="5.5" strokeLinecap="round" fill="none" />
        <path d="M150 122 Q136 128 126 134 Q140 139 154 139" stroke={SKIN} strokeWidth="5.5" strokeLinecap="round" fill="none" />
        <path d="M160 136 C162 131, 172 132, 172 137 C171 141, 164 142, 160 136 Z" fill="#3fa45b" />
        <circle cx="173" cy="136" r="3" fill="#fff" />
        <path d="M152 135 C154 130, 164 131, 164 136 C163 140, 156 141, 152 135 Z" fill="#45b064" />
        <circle cx="165" cy="135" r="3" fill="#fff" />
        {/* arm under her cheek */}
        <path d="M106 122 Q90 132 78 134" stroke={SKIN} strokeWidth="6" strokeLinecap="round" fill="none" />
        <ellipse cx="74" cy="134" rx="9" ry="4.5" fill={SKIN} />
        </g>
        {/* head resting, tilted */}
        <g transform="translate(80 104) rotate(-14) scale(0.72) translate(-100 -80)">
          <Head id={id} mood="sleep" look={undefined} />
        </g>
      </g>
      <g className="pixie-z" fill="#9b8fb8" fontFamily="Fraunces, serif" fontWeight="700">
        <text x="112" y="44" fontSize="14">z</text>
        <text x="124" y="30" fontSize="11">z</text>
        <text x="134" y="18" fontSize="8">z</text>
      </g>
    </svg>
  );
}
