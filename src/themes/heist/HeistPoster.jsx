import React, { useMemo } from 'react';

// Illustration originale de l'écran de chargement : coucher de soleil sur une
// ville, silhouettes d'immeubles avec quelques fenêtres allumées.
// Générée de façon déterministe (même dessin à chaque fois).

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function buildSkyline(seed, count, minH, maxH, y0) {
  const r = seeded(seed);
  const items = [];
  let x = -20;
  for (let i = 0; i < count && x < 1060; i++) {
    const w = 34 + r() * 70;
    const h = minH + r() * (maxH - minH);
    const windows = [];
    const cols = Math.max(2, Math.floor(w / 13));
    const rows = Math.floor(h / 16);
    for (let cx = 0; cx < cols; cx++) {
      for (let cy = 1; cy < rows; cy++) {
        if (r() < 0.16) windows.push([x + 6 + cx * ((w - 12) / cols), y0 - h + cy * 16]);
      }
    }
    items.push({ x, w, h, antenna: r() < 0.2 ? 10 + r() * 30 : 0, windows });
    x += w + 2 + r() * 6;
  }
  return items;
}

export default function HeistPoster() {
  const back = useMemo(() => buildSkyline(7, 40, 90, 260, 520), []);
  const front = useMemo(() => buildSkyline(21, 40, 40, 170, 560), []);

  return (
    <svg className="hx-poster" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="hx-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b1340" />
          <stop offset="0.45" stopColor="#7a2d6b" />
          <stop offset="0.72" stopColor="#ff6f7d" />
          <stop offset="0.9" stopColor="#ffb36b" />
        </linearGradient>
        <linearGradient id="hx-sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff2b8" />
          <stop offset="1" stopColor="#ff7a6b" />
        </linearGradient>
        <linearGradient id="hx-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff8a80" stopOpacity="0" />
          <stop offset="1" stopColor="#ff8a80" stopOpacity="0.55" />
        </linearGradient>
        <filter id="hx-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.09 0" />
          <feComposite operator="in" in2="SourceGraphic" />
        </filter>
      </defs>

      <rect width="1000" height="600" fill="url(#hx-sky)" />
      <circle cx="640" cy="430" r="150" fill="url(#hx-sun)" opacity="0.95" />
      {/* bandes de chaleur devant le soleil */}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x="480" y={420 + i * 22} width="320" height={3 + i * 1.6} fill="#ff7a8a" opacity="0.85" />
      ))}
      <rect y="380" width="1000" height="180" fill="url(#hx-haze)" />

      <g fill="#3a1b4a">
        {back.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={520 - b.h} width={b.w} height={b.h + 80} />
            {b.antenna > 0 && <rect x={b.x + b.w / 2} y={520 - b.h - b.antenna} width="2" height={b.antenna} />}
          </g>
        ))}
      </g>
      <g fill="#ffb38a" opacity="0.5">
        {back.flatMap((b, i) => b.windows.map(([x, y], k) => <rect key={`${i}-${k}`} x={x} y={y} width="5" height="7" />))}
      </g>

      <g fill="#12091c">
        {front.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={560 - b.h} width={b.w} height={b.h + 40} />
            {b.antenna > 0 && <rect x={b.x + b.w / 2} y={560 - b.h - b.antenna} width="2" height={b.antenna} />}
          </g>
        ))}
      </g>
      <g fill="#ffd27a" opacity="0.85">
        {front.flatMap((b, i) => b.windows.map(([x, y], k) => <rect key={`${i}-${k}`} x={x} y={y + 40} width="5" height="7" />))}
      </g>
      <rect y="556" width="1000" height="44" fill="#07040c" />
      <rect width="1000" height="600" filter="url(#hx-grain)" />
    </svg>
  );
}
