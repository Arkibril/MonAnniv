import React from 'react';

// Dessins originaux en SVG, fond transparent : drapeau turc, döner sur sa
// broche, dürüm, nazar boncuğu, verre de thé. Utilisés en "stickers".

// Étoile à 5 branches, une pointe vers la gauche (vers la hampe)
function starPoints(cx, cy, R, r, rotationDeg = 180) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rad = ((rotationDeg + i * 36) * Math.PI) / 180;
    const rr = i % 2 === 0 ? R : r;
    pts.push(`${(cx + rr * Math.cos(rad)).toFixed(1)},${(cy + rr * Math.sin(rad)).toFixed(1)}`);
  }
  return pts.join(' ');
}

// Drapeau turc (proportions officielles simplifiées, G = 800)
export function Flag({ size = 120, wave = false, className = '', style }) {
  return (
    <svg
      className={`kb-flag ${wave ? 'kb-flag--wave' : ''} ${className}`}
      width={size}
      height={(size * 2) / 3}
      viewBox="0 0 1200 800"
      style={style}
      aria-hidden="true"
    >
      <rect width="1200" height="800" fill="#E30A17" />
      <circle cx="400" cy="400" r="200" fill="#fff" />
      <circle cx="450" cy="400" r="160" fill="#E30A17" />
      <polygon points={starPoints(583.3, 400, 100, 38.2)} fill="#fff" />
    </svg>
  );
}

// Döner sur sa broche verticale
export function Doner({ size = 120, className = '', style }) {
  const layers = [];
  for (let i = 0; i < 9; i++) {
    const y = 40 + i * 24;
    const w = 104 - i * 6.5;
    layers.push(
      <path
        key={i}
        d={`M${100 - w / 2},${y} Q100,${y + 10} ${100 + w / 2},${y}`}
        fill="none"
        stroke={i % 2 ? '#7a3412' : '#9a4a1d'}
        strokeWidth="3"
        opacity="0.75"
      />
    );
  }
  return (
    <svg className={`kb-doner ${className}`} width={size} height={size * 1.4} viewBox="0 0 200 280" style={style} aria-hidden="true">
      <rect x="96" y="6" width="8" height="262" rx="4" fill="#9aa0a6" />
      <circle cx="100" cy="10" r="9" fill="#c9ced3" />
      <path d="M44,34 Q100,22 156,34 L132,252 Q100,262 68,252 Z" fill="#b5602a" />
      <path d="M44,34 Q100,22 156,34 L150,80 Q100,70 50,80 Z" fill="#c9773a" />
      {layers}
      <path d="M128,40 L140,44 L118,248 L110,250 Z" fill="#e9a25f" opacity="0.55" />
      <path d="M58,60 L66,58 L80,246 L72,244 Z" fill="#6e2c0e" opacity="0.35" />
      <ellipse cx="100" cy="262" rx="58" ry="10" fill="#8a8f95" />
      <rect x="44" y="258" width="112" height="8" rx="4" fill="#b8bec4" />
    </svg>
  );
}

// Dürüm (wrap) dans son papier
export function Durum({ size = 110, className = '', style }) {
  return (
    <svg className={`kb-durum ${className}`} width={size} height={size * 1.25} viewBox="0 0 200 250" style={style} aria-hidden="true">
      <path d="M40,70 Q100,40 160,70 L118,236 Q100,246 82,236 Z" fill="#f2d39c" />
      {/* garniture qui dépasse */}
      <path d="M44,72 Q60,40 82,58 Q96,30 116,52 Q136,32 156,70 Q100,58 44,72 Z" fill="#5fae3c" />
      <circle cx="78" cy="58" r="11" fill="#e2412f" />
      <circle cx="122" cy="56" r="10" fill="#e2412f" />
      <path d="M62,66 L88,46 L94,52 L70,72 Z" fill="#8a3f17" />
      <path d="M104,62 L132,44 L138,50 L112,68 Z" fill="#a24c1c" />
      <path d="M92,60 L100,40 L108,60 Z" fill="#f4f1e8" />
      {/* papier */}
      <path d="M52,120 Q100,104 148,120 L118,236 Q100,246 82,236 Z" fill="#ffffff" />
      <path d="M58,140 Q100,126 142,140 L138,154 Q100,140 62,154 Z" fill="#E30A17" />
      <path d="M52,120 Q100,104 148,120" fill="none" stroke="#e6e1d6" strokeWidth="3" />
      <path d="M86,96 L94,236" stroke="#e5c27f" strokeWidth="3" opacity="0.6" />
    </svg>
  );
}

// Nazar boncuğu (perle contre le mauvais œil)
export function Nazar({ size = 70, className = '', style }) {
  return (
    <svg className={`kb-nazar ${className}`} width={size} height={size} viewBox="0 0 100 100" style={style} aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="#1c45a8" />
      <circle cx="50" cy="50" r="33" fill="#ffffff" />
      <circle cx="50" cy="50" r="22" fill="#59b2ec" />
      <circle cx="50" cy="50" r="11" fill="#0b0b0f" />
      <ellipse cx="34" cy="28" rx="10" ry="5" fill="#fff" opacity="0.5" transform="rotate(-30 34 28)" />
    </svg>
  );
}

// Verre de thé turc (forme de tulipe) sur sa soucoupe
export function Cay({ size = 70, className = '', style }) {
  return (
    <svg className={`kb-cay ${className}`} width={size} height={size * 1.3} viewBox="0 0 100 130" style={style} aria-hidden="true">
      <ellipse cx="50" cy="118" rx="44" ry="9" fill="#E30A17" />
      <ellipse cx="50" cy="115" rx="30" ry="5" fill="#ffffff" opacity="0.5" />
      <path d="M26,14 Q20,40 34,62 Q24,86 30,112 L70,112 Q76,86 66,62 Q80,40 74,14 Z" fill="#ffffff" opacity="0.35" stroke="#d9d9d9" strokeWidth="2" />
      <path d="M31,36 Q27,46 36,62 Q27,84 33,108 L67,108 Q73,84 64,62 Q73,46 69,36 Z" fill="#b8410f" />
      <path d="M31,36 Q50,42 69,36" fill="none" stroke="#e0703a" strokeWidth="3" />
      <path d="M38,44 Q34,58 42,66" fill="none" stroke="#fff" strokeWidth="3" opacity="0.5" />
    </svg>
  );
}
