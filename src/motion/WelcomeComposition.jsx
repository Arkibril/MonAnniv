import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, random } from 'remotion';

// Intro de bienvenue : neuf tuiles éparpillées se rangent en grille autour
// de l'emoji de l'invité. Le placement de départ dépend de son prénom (seed),
// donc chaque invité a sa propre chorégraphie.
export const WELCOME_SIZE = { width: 390, height: 420, fps: 30, durationInFrames: 150 };

const INK = '#0b0b0c';
const CARD = '#f4f4f6';
const ACCENT = '#6b4eff';
const PARTY = ['🎉', '🥂', '🪩', '🎶', '🎈', '✨', '🍰', '🕺', '💃', '🎊', '🍾', '🎁'];

const TILE = 104;
const GAP = 12;

export function WelcomeComposition({ seed = 'invite', emoji = '🎉', initial = 'J' }) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Emojis choisis par le seed, sans doublon
  const pool = [...PARTY];
  const picks = [];
  for (let i = 0; i < 7; i++) {
    const idx = Math.floor(random(`${seed}-pick-${i}`) * pool.length);
    picks.push(pool.splice(idx, 1)[0]);
  }
  const accentSlot = Math.floor(random(`${seed}-accent`) * 8);

  const cells = [];
  let p = 0;
  let k = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const isCenter = row === 1 && col === 1;
      let kind = 'emoji';
      let content = null;
      if (isCenter) {
        kind = 'center';
        content = emoji;
      } else {
        if (k === accentSlot) {
          kind = 'accent';
          content = initial;
        } else {
          kind = (row + col) % 2 === 0 ? 'white' : 'emoji';
          content = picks[p++];
        }
        k++;
      }
      cells.push({ row, col, kind, content, isCenter });
    }
  }

  const gridW = TILE * 3 + GAP * 2;
  const originX = (width - gridW) / 2;
  const originY = (height - gridW) / 2;

  // Léger balancement d'ensemble une fois la grille formée
  const settle = interpolate(frame, [40, 150], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const groupRotate = interpolate(settle, [0, 1], [0, -6]);
  const groupScale = interpolate(settle, [0, 1], [1, 1.04]);

  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `rotate(${groupRotate}deg) scale(${groupScale})`,
          transformOrigin: '50% 50%',
        }}
      >
        {cells.map((c, i) => {
          const dist = Math.abs(c.row - 1) + Math.abs(c.col - 1);
          const delay = c.isCenter ? 0 : 6 + dist * 5 + Math.floor(random(`${seed}-d-${i}`) * 6);
          const s = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 120, mass: 0.9 } });

          const fromX = (random(`${seed}-x-${i}`) - 0.5) * 520;
          const fromY = (random(`${seed}-y-${i}`) - 0.5) * 560;
          const fromR = (random(`${seed}-r-${i}`) - 0.5) * 70;

          const x = originX + c.col * (TILE + GAP);
          const y = originY + c.row * (TILE + GAP);
          const tx = c.isCenter ? 0 : interpolate(s, [0, 1], [fromX, 0]);
          const ty = c.isCenter ? 0 : interpolate(s, [0, 1], [fromY, 0]);
          const rot = c.isCenter ? 0 : interpolate(s, [0, 1], [fromR, 0]);
          const scale = c.isCenter ? interpolate(s, [0, 1], [0.4, 1]) : interpolate(s, [0, 1], [0.7, 1]);
          const opacity = interpolate(s, [0, 0.25], [0, 1], { extrapolateRight: 'clamp' });

          // Respiration douce après l'arrivée
          const bob = Math.sin((frame + i * 9) / 16) * interpolate(settle, [0, 1], [0, 3]);

          const style = {
            position: 'absolute',
            left: x,
            top: y,
            width: TILE,
            height: TILE,
            borderRadius: 30,
            display: 'grid',
            placeItems: 'center',
            transform: `translate(${tx}px, ${ty + bob}px) rotate(${rot}deg) scale(${scale})`,
            opacity,
            fontFamily: "'Manrope Variable', Manrope, sans-serif",
          };

          if (c.kind === 'center') {
            return (
              <div key={i} style={{ ...style, background: INK, fontSize: 56, boxShadow: '0 18px 40px rgba(11,11,12,.25)' }}>
                {c.content}
              </div>
            );
          }
          if (c.kind === 'accent') {
            return (
              <div key={i} style={{ ...style, background: ACCENT, color: '#fff', fontSize: 52, fontWeight: 800, letterSpacing: '-0.04em' }}>
                {c.content}
              </div>
            );
          }
          if (c.kind === 'white') {
            return (
              <div key={i} style={{ ...style, background: '#fff', fontSize: 44, boxShadow: '0 2px 4px rgba(11,11,12,.05), 0 12px 26px rgba(11,11,12,.09)' }}>
                {c.content}
              </div>
            );
          }
          return (
            <div key={i} style={{ ...style, background: CARD, fontSize: 44 }}>
              {c.content}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
