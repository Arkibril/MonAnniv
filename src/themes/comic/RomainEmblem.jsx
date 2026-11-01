import React from 'react';

// Emblème personnel de Romain : son geste ✌️ stylisé en "V" éclair,
// dans un blason hexagonal rouge et noir (création originale).
export default function RomainEmblem({ size = 64, className = '', style }) {
  return (
    <svg className={`rm-emblem ${className}`} width={size} height={size} viewBox="0 0 100 100" style={style} aria-hidden="true">
      <polygon points="50,3 93,27 93,73 50,97 7,73 7,27" fill="#0d0d10" stroke="#141018" strokeWidth="4" />
      <polygon points="50,11 86,31 86,69 50,89 14,69 14,31" fill="none" stroke="#e5212e" strokeWidth="6" />
      {/* les deux doigts du V */}
      <path d="M28,26 L44,70 L50,70 L39,26 Z" fill="#ffffff" />
      <path d="M72,26 L56,70 L50,70 L61,26 Z" fill="#ffffff" />
      {/* éclair qui traverse le V */}
      <path d="M54,30 L42,54 L52,54 L44,78 L62,48 L52,48 L60,30 Z" fill="#ffd21a" stroke="#141018" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
