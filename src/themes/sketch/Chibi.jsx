import React from 'react';

// =============================================================================
// Chibis dessinés à la main (création originale), pensés pour une animation
// image par image : chaque pose est un dessin, et le "line boil" (traits qui
// frémissent) vient de 3 filtres SVG qu'on alterne environ 8 fois par seconde.
// Repère local : pieds en (0, 0), la tête vers le haut (y négatif).
// =============================================================================

export const INK = '#2b2522';
export const PAPER = '#fffdf7';
export const MARKERS = ['#ff8fab', '#74c0fc', '#63e6be', '#ffd43b', '#b197fc', '#ffa94d', '#8ce99a', '#f783ac'];

// Filtres de "line boil" + motifs, à poser une fois dans le <svg>
export function BoilDefs({ id = 'sk' }) {
  return (
    <defs>
      {[3, 11, 27].map((seed, i) => (
        <filter key={seed} id={`${id}-boil-${i}`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      ))}
    </defs>
  );
}

const ell = (cx, cy, rx, ry) => `M${cx - rx},${cy} a${rx},${ry} 0 1,0 ${2 * rx},0 a${rx},${ry} 0 1,0 ${-2 * rx},0`;
const rrect = (x, y, w, h, r) =>
  `M${x + r},${y} h${w - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${h - 2 * r} a${r},${r} 0 0 1 ${-r},${r} h${-(w - 2 * r)} a${r},${r} 0 0 1 ${-r},${-r} v${-(h - 2 * r)} a${r},${r} 0 0 1 ${r},${-r} Z`;

// Contour festonné (une boucle par segment) : les cheveux bouclés
function scallop(points) {
  let d = `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const r = Math.hypot(x1 - x0, y1 - y0) * 0.56;
    d += ` A${r.toFixed(1)},${r.toFixed(1)} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  return `${d} Z`;
}
// Boucles longues : du volume derrière la tête jusqu'aux épaules…
const CURLY_BACK = scallop([
  [-44, -48], [-58, -58], [-68, -74], [-71, -94], [-68, -116], [-58, -136], [-42, -152], [-22, -162], [0, -166],
  [22, -162], [42, -152], [58, -136], [68, -116], [71, -94], [68, -74], [58, -58], [44, -48]
]);
// … et une frange bouclée qui couvre le haut de la tête
const CURLY_FRONT = scallop([
  ...Array.from({ length: 9 }, (_, i) => {
    const a = Math.PI - (i / 8) * Math.PI;
    return [Math.cos(a) * 51, -104 - Math.sin(a) * 49];
  }),
  [36, -117], [22, -122], [7, -125], [-8, -125], [-23, -122], [-37, -117], [-51, -104]
]);
const CURLY_SWIRLS = [
  'M-64,-104 q7,-7 12,1', 'M-62,-82 q7,-7 12,1', 'M-57,-62 q6,-6 11,1',
  'M52,-104 q7,-7 12,1', 'M50,-82 q7,-7 12,1', 'M46,-62 q6,-6 11,1',
  'M-30,-150 q6,-6 11,1', 'M14,-152 q6,-6 11,1'
];

const HAIR = {
  curlyLong: CURLY_FRONT,
  short: 'M-46,-104 C-50,-140 -16,-152 6,-148 C30,-150 52,-132 46,-104 C38,-118 30,-112 24,-124 C16,-110 4,-122 -2,-112 C-10,-124 -22,-110 -30,-122 C-36,-112 -42,-112 -46,-104 Z',
  long: 'M-48,-100 C-56,-146 -14,-154 4,-150 C34,-152 58,-134 48,-100 L52,-58 C44,-60 40,-64 38,-74 C34,-110 22,-118 6,-124 C-6,-112 -20,-118 -30,-112 C-38,-100 -38,-80 -40,-62 C-46,-60 -52,-62 -54,-60 Z',
  bun: 'M-46,-102 C-50,-140 -14,-150 4,-148 C30,-150 52,-132 46,-102 C40,-116 26,-124 4,-124 C-18,-124 -38,-116 -46,-102 Z M-14,-150 C-16,-172 18,-174 16,-150 Z',
  curly: 'M-48,-98 C-60,-108 -52,-128 -40,-128 C-42,-146 -22,-152 -12,-144 C-6,-160 18,-160 22,-146 C34,-154 52,-142 46,-126 C58,-122 58,-102 48,-96 C40,-112 30,-108 22,-118 C12,-106 -2,-116 -10,-108 C-20,-118 -32,-104 -40,-112 Z',
  spiky: 'M-46,-104 L-54,-128 L-34,-130 L-36,-152 L-12,-142 L-2,-164 L14,-144 L36,-156 L34,-132 L54,-126 L46,-104 C36,-116 22,-114 10,-122 C0,-112 -14,-120 -22,-112 C-30,-120 -40,-114 -46,-104 Z'
};

// Une pose = un dessin. Les valeurs changent d'une image à l'autre.
export const POSES = {
  stand: { armL: 18, armR: -18, sx: 1, sy: 1, legs: 'stand', y: 0 },
  wave1: { armL: 18, armR: -150, sx: 1, sy: 1, legs: 'stand', y: 0 },
  wave2: { armL: 18, armR: -120, sx: 1, sy: 1, legs: 'stand', y: 0 },
  squash: { armL: 40, armR: -40, sx: 1.18, sy: 0.82, legs: 'stand', y: 0 },
  stretch: { armL: -150, armR: 150, sx: 0.88, sy: 1.16, legs: 'tuck', y: -26 },
  top: { armL: -160, armR: 160, sx: 1, sy: 1, legs: 'tuck', y: -46 },
  fall: { armL: -120, armR: 120, sx: 0.94, sy: 1.08, legs: 'stand', y: -20 },
  cheer: { armL: -140, armR: 140, sx: 1, sy: 1, legs: 'stand', y: 0 },
  draw: { armL: 18, armR: -70, sx: 1, sy: 1, legs: 'stand', y: 0 }
};

// Ordre de tracé (pour l'effet "le crayon dessine le personnage")
export function Chibi({
  x = 0,
  y = 0,
  scale = 1,
  pose = 'stand',
  eyes = 'open', // open | blink | happy
  mouth = 'smile', // smile | open | o
  hair = 'short',
  hairColor = '#4a4a4a',
  hoodie = '#63e6be',
  badge, // texte/emoji dessiné sur le sweat
  above, // emoji au-dessus de la tête
  name, // prénom écrit à la main sous les pieds
  draw = 1, // 0 → 1 : progression du tracé au crayon
  color = 1, // 0 → 1 : coloriage au feutre (par paliers)
  prop, // 'pencil' | 'stylus'
  flip = false,
  nameSize = 19,
  children
}) {
  const p = POSES[pose] || POSES.stand;
  // éléments à tracer, dans l'ordre
  const strokes = [];
  const add = (d, fill, extra = {}) => strokes.push({ d, fill, ...extra });
  const legY = p.legs === 'tuck' ? -18 : 0;
  add(rrect(-18, -28 + legY * 0.3, 14, 28 + legY * 0.7, 6), PAPER);
  add(rrect(4, -28 + legY * 0.3, 14, 28 + legY * 0.7, 6), PAPER);
  const curly = hair === 'curlyLong';
  if (curly) add(CURLY_BACK, hairColor);
  add('M-22,-66 C-24,-46 -26,-34 -24,-24 L24,-24 C26,-34 24,-46 22,-66 C10,-72 -10,-72 -22,-66 Z', hoodie);
  add(ell(0, -100, 46, 42), PAPER);
  add(HAIR[hair] || HAIR.short, hairColor);
  // yeux
  const eyeL = -16;
  const eyeR = 16;
  const ey = -94;
  let eyeParts;
  if (eyes === 'blink') {
    eyeParts = [`M${eyeL - 8},${ey} Q${eyeL},${ey + 4} ${eyeL + 8},${ey}`, `M${eyeR - 8},${ey} Q${eyeR},${ey + 4} ${eyeR + 8},${ey}`];
  } else if (eyes === 'happy') {
    eyeParts = [`M${eyeL - 8},${ey + 2} Q${eyeL},${ey - 10} ${eyeL + 8},${ey + 2}`, `M${eyeR - 8},${ey + 2} Q${eyeR},${ey - 10} ${eyeR + 8},${ey + 2}`];
  } else eyeParts = null;
  const mouthD =
    mouth === 'open' ? 'M-8,-78 Q0,-64 8,-78 Z' : mouth === 'o' ? ell(0, -75, 4.5, 5.5) : 'M-7,-79 Q0,-72 7,-79';

  const n = strokes.length + 4;
  const split = curly ? 4 : 3; // jambes (+ boucles de derrière) + corps, puis la tête
  const prog = (i) => Math.max(0, Math.min(1, draw * n - i));
  const fillOp = color >= 1 ? 1 : color >= 0.5 ? 0.55 : color > 0 ? 0.25 : 0;
  const armProg = prog(strokes.length);
  const faceProg = prog(strokes.length + 1);
  const mouthProg = prog(strokes.length + 2);
  const extraProg = prog(strokes.length + 3);

  const dash = (k) => (k >= 1 ? {} : { pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - k });

  const arm = (side, angle, k) => {
    const sx = side * 21;
    return (
      <g transform={`translate(${sx},-60) rotate(${angle * side * -1 * -1})`} key={side}>
        <path d={rrect(-6, 0, 12, 30, 6)} fill={hoodie} fillOpacity={fillOp} stroke={INK} strokeWidth="3.2" {...dash(k)} data-di={side < 0 ? 'armL' : 'armR'} />
        <path d={ell(0, 32, 7, 7)} fill={PAPER} fillOpacity={fillOp} stroke={INK} strokeWidth="3.2" {...dash(k)} />
      </g>
    );
  };

  return (
    <g transform={`translate(${x},${y}) scale(${flip ? -scale : scale},${scale})`}>
      <g transform={`translate(0,${p.y}) scale(${p.sx},${p.sy})`}>
        {/* ombre */}
        {p.y < 0 && <ellipse cx="0" cy={-p.y} rx={26} ry={5} fill={INK} opacity="0.12" />}
        {strokes.slice(0, split).map((s, i) => (
          <path key={i} d={s.d} fill={s.fill} fillOpacity={s.fill === PAPER ? (draw >= 1 ? 1 : 0) : fillOp} stroke={INK} strokeWidth="3.2" strokeLinejoin="round" {...dash(prog(i))} data-di={i} />
        ))}
        {curly && color > 0 && CURLY_SWIRLS.map((d) => <path key={d} d={d} fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />)}
        {badge && color >= 1 && (
          <text x="0" y="-38" textAnchor="middle" fontSize="16" fontFamily="'Patrick Hand', sans-serif" fill={INK}>
            {badge}
          </text>
        )}
        {arm(-1, p.armL, armProg)}
        {strokes.slice(split).map((s, j) => {
          const i = j + split;
          return (
            <path key={i} d={s.d} fill={s.fill} fillOpacity={s.fill === PAPER ? (draw >= 1 ? 1 : 0) : fillOp} stroke={INK} strokeWidth="3.2" strokeLinejoin="round" {...dash(prog(i))} data-di={i} />
          );
        })}
        {/* yeux, joues, bouche */}
        {faceProg > 0 &&
          (eyeParts ? (
            eyeParts.map((d, i) => <path key={i} d={d} fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round" {...dash(faceProg)} />)
          ) : (
            <g opacity={faceProg >= 1 ? 1 : faceProg}>
              <ellipse cx={eyeL} cy={ey} rx="7.5" ry="10" fill={INK} />
              <ellipse cx={eyeR} cy={ey} rx="7.5" ry="10" fill={INK} />
              <circle cx={eyeL + 2.5} cy={ey - 4} r="3" fill={PAPER} />
              <circle cx={eyeR + 2.5} cy={ey - 4} r="3" fill={PAPER} />
            </g>
          ))}
        {color >= 1 && (
          <g opacity="0.55">
            <ellipse cx="-30" cy="-82" rx="7" ry="4" fill="#ff8fab" />
            <ellipse cx="30" cy="-82" rx="7" ry="4" fill="#ff8fab" />
          </g>
        )}
        {mouthProg > 0 && <path d={mouthD} fill={mouth === 'smile' ? 'none' : '#e8596f'} stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...dash(mouthProg)} />}
        {arm(1, p.armR, armProg)}
        {/* accessoires */}
        {prop === 'pencil' && extraProg > 0 && (
          <g transform="translate(36,-132) rotate(35)" opacity={extraProg >= 1 ? 1 : 0.6}>
            <path d="M-4,0 h8 v30 l-4,8 l-4,-8 Z" fill="#ffd43b" fillOpacity={fillOp} stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
            <path d="M-4,0 h8 v-6 h-8 Z" fill="#ff8fab" fillOpacity={fillOp} stroke={INK} strokeWidth="2.6" />
          </g>
        )}
        {prop === 'stylus' && extraProg > 0 && (
          <g transform="translate(-40,-136) rotate(-30)" opacity={extraProg >= 1 ? 1 : 0.6}>
            <path d="M-3,0 h6 v30 l-3,7 l-3,-7 Z" fill="#b197fc" fillOpacity={fillOp} stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
            <circle cx="0" cy="-3" r="4" fill="#ffd43b" fillOpacity={fillOp} stroke={INK} strokeWidth="2.4" />
          </g>
        )}
      </g>
      {above && color >= 1 && (
        <text x="0" y={-160 + p.y} textAnchor="middle" fontSize="26">
          {above}
        </text>
      )}
      {name && (
        <text x="0" y={6 + nameSize} textAnchor="middle" fontSize={nameSize} fontFamily="'Patrick Hand', 'Comic Sans MS', sans-serif" fill={INK} transform={flip ? 'scale(-1,1)' : undefined}>
          {name}
        </text>
      )}
      {children}
    </g>
  );
}

// Variante stable d'un ami à partir de son prénom
export function friendLook(label) {
  let h = 0;
  for (const c of label) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const styles = ['short', 'long', 'bun', 'curly', 'spiky'];
  return {
    hair: styles[h % styles.length],
    hairColor: MARKERS[(h >> 3) % MARKERS.length],
    hoodie: MARKERS[(h >> 7) % MARKERS.length]
  };
}

// Bulle de dialogue dessinée à la main, avec texte
export function Bubble({ x, y, w = 260, h = 92, text, draw = 1, tail = 'left', size = 22 }) {
  const tx = tail === 'left' ? x + 40 : x + w - 40;
  const d = `M${x + 18},${y} C${x + w * 0.4},${y - 6} ${x + w * 0.7},${y + 4} ${x + w - 16},${y + 2} C${x + w + 4},${y + 8} ${x + w + 2},${y + h - 10} ${x + w - 14},${y + h} L${tx + 18},${y + h + 2} L${tx - 6},${y + h + 26} L${tx - 2},${y + h} L${x + 14},${y + h - 2} C${x - 4},${y + h - 8} ${x - 2},${y + 10} ${x + 18},${y} Z`;
  const lines = String(text).split('\n');
  return (
    <g>
      <path d={d} fill={PAPER} stroke={INK} strokeWidth="3.2" strokeLinejoin="round" {...(draw >= 1 ? {} : { pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - draw, fillOpacity: 0 })} />
      {draw >= 1 &&
        lines.map((l, i) => (
          <text key={i} x={x + w / 2} y={y + h / 2 + (i - (lines.length - 1) / 2) * (size * 1.1) + size * 0.34} textAnchor="middle" fontSize={size} fontFamily="'Patrick Hand', 'Comic Sans MS', sans-serif" fill={INK}>
            {l}
          </text>
        ))}
    </g>
  );
}

// Crayon (suit la mine pendant le tracé)
export function Pencil({ x = 0, y = 0, angle = -35 }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${angle})`}>
      <path d="M0,0 l-6,-16 h12 Z" fill="#f4d7a1" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M0,0 l-2.4,-6.4 h4.8 Z" fill={INK} />
      <path d="M-6,-16 h12 v-62 h-12 Z" fill="#ffd43b" stroke={INK} strokeWidth="2.6" />
      <path d="M-2,-16 v-62" stroke="#e8b923" strokeWidth="2" />
      <path d="M-6,-78 h12 v-8 h-12 Z" fill="#c9c9c9" stroke={INK} strokeWidth="2.6" />
      <path d="M-6,-86 h12 v-10 a6,6 0 0 1 -12,0 Z" fill="#ff8fab" stroke={INK} strokeWidth="2.6" />
    </g>
  );
}
