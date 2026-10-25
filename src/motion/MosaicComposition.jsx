import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

// Mosaïque inclinée de tuiles arrondies qui défilent en boucle.
// Chaque tuile porte un vrai morceau de l'invitation : dates, villes, ambiance.
export const MOSAIC_SIZE = { width: 390, height: 420, fps: 30, durationInFrames: 480 };

const INK = '#0b0b0c';
const CARD = '#f4f4f6';
const ACCENT = '#6b4eff';

const COLUMNS = [
  [
    { kind: 'emoji', emoji: '🎂', h: 150 },
    { kind: 'ink', top: 'Sam.', big: '19 déc.', h: 170 },
    { kind: 'emoji', emoji: '🪩', h: 140 },
    { kind: 'label', emoji: '🗼', text: 'Paris', h: 160 },
  ],
  [
    { kind: 'label', emoji: '🥂', text: 'Le 1er janv.', h: 180 },
    { kind: 'accent', top: 'Ven. férié', big: '25 déc.', h: 170 },
    { kind: 'emoji', emoji: '🎶', h: 140 },
    { kind: 'ink', top: 'Le thème', big: 'À voter', h: 160 },
  ],
  [
    { kind: 'emoji', emoji: '🥨', h: 140 },
    { kind: 'label', emoji: '🚆', text: 'Strasbourg', h: 170 },
    { kind: 'emoji', emoji: '🎉', h: 150 },
    { kind: 'ink', top: 'Réponds en', big: '2 min', h: 170 },
  ],
];

const GAP = 14;
const COL_W = 150;

function Tile({ tile }) {
  const base = {
    height: tile.h,
    borderRadius: 34,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    padding: 18,
    fontFamily: "'Manrope Variable', Manrope, sans-serif",
    flex: 'none',
  };

  if (tile.kind === 'emoji') {
    return (
      <div style={{ ...base, background: CARD, alignItems: 'center', justifyContent: 'center', fontSize: 64, lineHeight: 1 }}>
        {tile.emoji}
      </div>
    );
  }
  if (tile.kind === 'label') {
    return (
      <div style={{ ...base, background: '#fff', boxShadow: '0 2px 4px rgba(11,11,12,.05), 0 14px 30px rgba(11,11,12,.09)' }}>
        <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 'auto' }}>{tile.emoji}</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: INK, lineHeight: 1.05 }}>{tile.text}</div>
      </div>
    );
  }
  const bg = tile.kind === 'accent' ? ACCENT : INK;
  return (
    <div style={{ ...base, background: bg, color: '#fff' }}>
      <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.7, marginBottom: 4 }}>{tile.top}</div>
      <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>{tile.big}</div>
    </div>
  );
}

export function MosaicComposition() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = frame / durationInFrames;

  return (
    <AbsoluteFill style={{ background: '#fff', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          display: 'flex',
          gap: GAP,
          transform: 'translate(-50%, -50%) rotate(-14deg)',
        }}
      >
        {COLUMNS.map((col, i) => {
          const loopH = col.reduce((s, t) => s + t.h + GAP, 0);
          const dir = i % 2 === 0 ? -1 : 1;
          // Boucle parfaite : on décale d'exactement une hauteur de série
          const offset = dir === -1 ? -progress * loopH : -loopH + progress * loopH;
          return (
            <div
              key={i}
              style={{
                width: COL_W,
                display: 'flex',
                flexDirection: 'column',
                gap: GAP,
                transform: `translateY(${offset - 120 + i * 40}px)`,
              }}
            >
              {[...col, ...col, ...col].map((tile, j) => (
                <Tile key={j} tile={tile} />
              ))}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
