import React from 'react';
import { Flag, Doner, Durum, Nazar, Cay } from './art';

// Kebabs et objets turcs collés un peu partout derrière le contenu
// (session d'Eray). Fixes, non cliquables, derrière les cartes.
const STICKERS = [
  { C: Doner, size: 70, style: { left: '-14px', top: '18vh', rotate: '-14deg' } },
  { C: Durum, size: 64, style: { right: '-10px', top: '34vh', rotate: '16deg' } },
  { C: Nazar, size: 46, style: { right: '18px', top: '92px', rotate: '0deg' } },
  { C: Flag, size: 78, style: { left: '10px', bottom: '22vh', rotate: '-8deg' } },
  { C: Cay, size: 44, style: { right: '12px', bottom: '16vh', rotate: '10deg' } },
  { C: Durum, size: 58, style: { left: '42vw', bottom: '-18px', rotate: '-24deg' } },
  { C: Doner, size: 56, style: { right: '22vw', top: '-26px', rotate: '170deg' } },
  { C: Nazar, size: 38, style: { left: '24px', top: '62vh', rotate: '0deg' } }
];

export default function KebabStickers() {
  return (
    <div className="kb-stickers" aria-hidden="true">
      {STICKERS.map(({ C, size, style }, i) => (
        <span key={i} className="kb-sticker" style={{ ...style, transform: `rotate(${style.rotate})` }}>
          <C size={size} />
        </span>
      ))}
    </div>
  );
}
