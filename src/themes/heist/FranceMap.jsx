import React from 'react';

// Carte stylisée (contour simplifié de la France) avec les deux lieux au vote.
const OUTLINE = [
  [2.37, 51.05], [3.1, 50.78], [4.2, 50.1], [4.85, 49.8], [5.9, 49.5], [6.6, 49.15], [8.2, 48.97],
  [7.6, 47.6], [6.95, 47.4], [6.1, 46.2], [7.0, 45.9], [6.65, 45.1], [7.0, 44.4], [7.5, 43.8],
  [6.6, 43.1], [5.4, 43.25], [4.6, 43.4], [3.6, 43.3], [3.05, 42.55], [1.7, 42.5], [0.6, 42.7],
  [-0.6, 42.85], [-1.78, 43.36], [-1.25, 44.5], [-1.2, 45.7], [-1.9, 46.6], [-2.4, 47.2],
  [-3.4, 47.7], [-4.6, 47.95], [-4.75, 48.45], [-3.6, 48.8], [-2.3, 48.6], [-1.55, 48.65],
  [-1.85, 49.7], [-1.2, 49.36], [0.1, 49.45], [1.0, 49.9], [1.6, 50.35], [1.6, 50.95]
];

const project = ([lon, lat]) => [(lon + 5.4) * 60, (51.5 - lat) * 84];
const PATH = 'M' + OUTLINE.map((p) => project(p).map((n) => n.toFixed(1)).join(',')).join('L') + 'Z';

const PLACES = [
  { id: 'paris', name: 'Paris', lonlat: [2.35, 48.86] },
  { id: 'strasbourg', name: 'Strasbourg', lonlat: [7.75, 48.58] }
];

export default function FranceMap() {
  const [px, py] = project(PLACES[0].lonlat);
  const [sx, sy] = project(PLACES[1].lonlat);
  return (
    <svg className="hx-map" viewBox="-20 -20 840 820" role="img" aria-label="Carte : Paris ou Strasbourg, lieu au vote">
      <defs>
        <pattern id="hx-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="-20" y="-20" width="840" height="820" fill="url(#hx-grid)" />
      <path d={PATH} fill="rgba(120,150,170,0.16)" stroke="rgba(200,220,235,0.55)" strokeWidth="2.5" strokeLinejoin="round" />
      <path
        d={`M${px},${py} Q${(px + sx) / 2},${Math.min(py, sy) - 70} ${sx},${sy}`}
        fill="none"
        stroke="var(--hx-accent)"
        strokeWidth="4"
        strokeDasharray="10 9"
        className="hx-map-route"
      />
      {PLACES.map((p) => {
        const [x, y] = project(p.lonlat);
        return (
          <g key={p.id} transform={`translate(${x},${y})`}>
            <circle r="22" fill="var(--hx-accent)" opacity="0.22" />
            <circle r="10" fill="var(--hx-accent)" stroke="#fff" strokeWidth="3" />
            <text x={p.id === 'paris' ? -18 : 14} y={p.id === 'paris' ? -26 : 62} textAnchor="end" className="hx-map-label">
              {p.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
