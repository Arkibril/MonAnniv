import React from 'react';

// Toiles d'araignée blanches de coin, décor d'Halloween (dessin original).
// Lignes rayonnantes depuis le coin + fils qui s'affaissent entre elles.
function CornerWeb({ size = 120, className = '', style }) {
  const rays = 6;
  const rings = [0.28, 0.46, 0.64, 0.82, 0.98];
  const R = 100;
  const angle = (i) => (i / (rays - 1)) * (Math.PI / 2);
  const pt = (i, k) => [Math.cos(angle(i)) * R * k, Math.sin(angle(i)) * R * k];
  const paths = [];
  for (let i = 0; i < rays; i++) {
    const [x, y] = pt(i, 1.04);
    paths.push(`M0,0 L${x.toFixed(1)},${y.toFixed(1)}`);
  }
  rings.forEach((k, r) => {
    for (let i = 0; i < rays - 1; i++) {
      const [x1, y1] = pt(i, k + (i % 2 ? 0.02 : -0.01) * (r + 1) * 0.3);
      const [x2, y2] = pt(i + 1, k + ((i + 1) % 2 ? 0.02 : -0.01) * (r + 1) * 0.3);
      // le fil s'affaisse vers le coin
      const mx = ((x1 + x2) / 2) * 0.9;
      const my = ((y1 + y2) / 2) * 0.9;
      paths.push(`M${x1.toFixed(1)},${y1.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`);
    }
  });
  return (
    <svg className={className} viewBox="-2 -2 106 106" style={style} aria-hidden="true">
      <g fill="none" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" opacity="0.9">
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}

// Toiles dans les coins de l'écran (menus de Romain)
export default function HalloweenWebs({ corners = ['tl', 'tr', 'br'], size = 120 }) {
  const place = {
    tl: { top: 0, left: 0, transform: 'none' },
    tr: { top: 0, right: 0, transform: 'scaleX(-1)' },
    bl: { bottom: 0, left: 0, transform: 'scaleY(-1)' },
    br: { bottom: 0, right: 0, transform: 'scale(-1, -1)' }
  };
  return (
    <div className="hw-webs" aria-hidden="true">
      {corners.map((c) => (
        <CornerWeb key={c} size={size} className="hw-web" style={{ position: 'fixed', ...place[c] }} />
      ))}
    </div>
  );
}
