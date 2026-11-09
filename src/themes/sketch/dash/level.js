// =============================================================================
// Le niveau de Julien : « Anniv Rush » (création originale).
// Chaque obstacle est posé sur un temps de la musique (140 BPM) :
// sauter sur le temps fait passer pile au-dessus.
// =============================================================================
import { SPEED } from './physics';

export const BPM = 140;
export const BEAT = 60 / BPM;
export const BLOCKS_PER_BEAT = SPEED * BEAT; // 4,5
const X = (b) => b * BLOCKS_PER_BEAT;

const objects = [];
const add = (o) => objects.push(o);

// n pics au sol (ou sur un bloc à la hauteur y), saut idéal sur le temps b
function spikes(b, n = 1, y = 0) {
  const off = n === 1 ? 1.7 : n === 2 ? 1.2 : 0.7;
  for (let i = 0; i < n; i++) add({ type: 'spike', x: X(b) + off + i, y });
}
const spikeAt = (x, y = 0, down = false) => add({ type: 'spike', x, y, down });
const block = (x, y, w = 1, h = 1) => add({ type: 'block', x, y, w, h });
const pad = (x, y = 0) => add({ type: 'pad', x, y });
const orb = (x, y) => add({ type: 'orb', x, y });
const portal = (x, mode, floor = 0, ceil = Infinity) => add({ type: 'portal', x, mode, floor, ceil, w: 1, h: 3 });
const pillarUp = (x, h, w = 1.5) => block(x, 0, w, h); // depuis le sol
const pillarDown = (x, h, ceil = 10, w = 1.5) => block(x, ceil - h, w, h); // depuis le plafond

// ---------------------------------------------------------------- 1. échauffement (temps 8 à 23)
spikes(8);
spikes(10);
spikes(12, 2);
spikes(14);
spikes(16);
spikes(17);
spikes(18, 2);
spikes(20, 2);
spikes(22);

// ---------------------------------------------------------------- 2. blocs (temps 24 à 39)
block(X(24) + 2.5, 0, 9, 1); // plateforme
spikes(25, 1, 1); // pic sur la plateforme
spikes(28);
block(X(29) + 2.5, 0, 4.5, 1); // marche 1
block(X(30) + 2.5, 0, 5, 2); // marche 2
spikes(31, 1, 2); // pic en haut de la marche
spikes(33, 2);
spikes(35);
spikes(36, 2);
spikes(38, 3);

// ---------------------------------------------------------------- 3. montée (temps 40 à 47)
pad(X(40) + 0.5); // trampoline au-dessus des pics
spikeAt(X(40) + 2);
spikeAt(X(40) + 3);
spikeAt(X(40) + 4);
// fosse de pics avec deux anneaux à attraper en l'air
for (let i = 0; i < 9; i++) spikeAt(X(42) + 1.7 + i);
orb(X(42) + 3.6, 2.2);
orb(X(43) + 3.4, 2.2);
// escalier vers le portail
block(X(45) + 2.5, 0, 4.5, 1);
block(X(46) + 2.5, 0, 4.5, 2);
block(X(47) + 2.5, 0, 3, 3);

// ---------------------------------------------------------------- 4. vaisseau, premier drop (temps 48 à 79)
portal(X(48), 'ship', 0, 10);
pillarUp(X(50), 4);
pillarDown(X(52), 4);
pillarUp(X(54), 5);
pillarDown(X(56), 5);
pillarUp(X(58), 3);
pillarDown(X(58), 4);
pillarUp(X(60), 5);
pillarDown(X(60), 2);
pillarUp(X(62), 2);
pillarDown(X(62), 5);
// tunnel qui ondule
const wave = [2, 3, 4, 3, 2, 3, 4, 3];
wave.forEach((hb, i) => {
  block(X(64 + i), 0, BLOCKS_PER_BEAT, hb);
  block(X(64 + i), hb + 4.4, BLOCKS_PER_BEAT, 10 - (hb + 4.4));
});
// piliers à pointes
pillarUp(X(73), 4);
spikeAt(X(73) + 0.25, 4);
pillarDown(X(75), 4);
spikeAt(X(75) + 0.25, 5, true);
pillarUp(X(77), 3);
pillarDown(X(77), 3);
portal(X(79) + 2, 'cube', 0);

// ---------------------------------------------------------------- 5. pause (temps 80 à 95)
spikes(82);
spikes(84, 2);
block(X(86) + 2.5, 0, 3.5, 1);
spikeAt(X(86) + 6.5);
block(X(87) + 2.6, 0, 3.5, 1);
spikes(90, 3);
spikes(92);
spikes(93);
spikes(94, 2);

// ---------------------------------------------------------------- 6. deuxième drop (temps 96 à 119)
pad(X(96) + 0.5);
block(X(96) + 3.2, 2, 9, 1); // plateforme en hauteur (dessus à 3)
for (let i = 0; i < 8; i++) spikeAt(X(96) + 3.5 + i); // pics dessous
spikes(98, 1, 3);
spikes(101, 2);
spikes(102);
spikes(103);
for (let i = 0; i < 10; i++) spikeAt(X(104) + 1.7 + i);
orb(X(104) + 3.6, 2.2);
orb(X(105) + 3.4, 2.2);
// sauts de bloc en bloc, un par temps
for (let k = 0; k < 4; k++) {
  block(X(108 + k) + 2.2, 0, 2.4, 1);
  spikeAt(X(108 + k) + 4.6);
  spikeAt(X(108 + k) + 5.6);
}
spikes(113, 3);
pad(X(115) + 0.5);
block(X(115) + 3.4, 0, 6, 3); // mur à grimper avec le trampoline
spikes(116, 1, 3);
spikes(118, 2);
spikes(120);
spikes(121);

objects.sort((a, b) => a.x - b.x);

export const LEVEL = {
  name: 'Anniv Rush',
  objects,
  endX: X(124),
  // points de reprise du mode entraînement (positions sûres)
  checkpoints: [
    { b: 0, y: 0, mode: 'cube', floor: 0, ceil: Infinity },
    { b: 24, y: 0, mode: 'cube', floor: 0, ceil: Infinity },
    { b: 40, y: 0, mode: 'cube', floor: 0, ceil: Infinity },
    { b: 49, y: 5, mode: 'ship', floor: 0, ceil: 10 },
    { b: 63, y: 4.8, mode: 'ship', floor: 0, ceil: 10 },
    { b: 81, y: 0, mode: 'cube', floor: 0, ceil: Infinity },
    { b: 95.5, y: 0, mode: 'cube', floor: 0, ceil: Infinity },
    { b: 107, y: 0, mode: 'cube', floor: 0, ceil: Infinity }
  ].map((c) => ({ ...c, t: c.b * BEAT, x: X(c.b) })),
  // sections (couleurs du décor qui changent avec la musique)
  sections: [
    { b: 0, bg: ['#2b1d6b', '#4b2bb3'], ground: '#3d2a9e', line: '#c9b8ff' },
    { b: 24, bg: ['#0f3b6e', '#1b6fc2'], ground: '#164f8f', line: '#a8e1ff' },
    { b: 40, bg: ['#5a1a6b', '#a32bb3'], ground: '#6e2185', line: '#ffb8f5' },
    { b: 48, bg: ['#6b1a2b', '#d1324f'], ground: '#8c1f37', line: '#ffd2a8' },
    { b: 80, bg: ['#123d3a', '#1f8a7e'], ground: '#17564f', line: '#b8fff0' },
    { b: 96, bg: ['#6b3d0f', '#e0801f'], ground: '#8a4c12', line: '#fff0a8' },
    { b: 120, bg: ['#1d1d6b', '#3b3bd1'], ground: '#2a2a8c', line: '#ffffff' }
  ]
};
