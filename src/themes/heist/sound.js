// =============================================================================
// Sons du thème "jeu" d'Alexia, synthétisés en Web Audio (aucun fichier).
// Ne démarre qu'après une action de l'utilisateur (règle des navigateurs).
// =============================================================================

let ctx = null;
let master = null;
let ambience = null;
let muted = false;

function audio() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.55;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function setMuted(value) {
  muted = value;
  if (master && ctx) master.gain.setTargetAtTime(value ? 0 : 0.55, ctx.currentTime, 0.05);
}
export const isMuted = () => muted;

function tone({ freq, type = 'square', start = 0, dur = 0.06, vol = 0.12, to, filter = 4200 }) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + start;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = filter;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(lp).connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// Déplacement dans un menu : petit clic sec
export function sfxMove() {
  tone({ freq: 1250, type: 'triangle', dur: 0.045, vol: 0.09, filter: 6000 });
}

// Changement d'onglet : clic plus grave
export function sfxTab() {
  tone({ freq: 620, type: 'triangle', dur: 0.06, vol: 0.11, to: 540 });
}

// Validation : deux notes montantes
export function sfxSelect() {
  tone({ freq: 880, type: 'square', dur: 0.07, vol: 0.06, filter: 3000 });
  tone({ freq: 1320, type: 'square', start: 0.06, dur: 0.09, vol: 0.06, filter: 3000 });
}

// Retour / erreur
export function sfxBack() {
  tone({ freq: 420, type: 'triangle', dur: 0.08, vol: 0.1, to: 300 });
}

// Lancement de mission : souffle grave + impact
export function sfxMissionStart() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  // impact grave
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(140, t);
  osc.frequency.exponentialRampToValueAtTime(42, t + 0.9);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + 1.2);
  // souffle (bruit filtré qui monte puis retombe)
  const len = Math.floor(ac.sampleRate * 1.2);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.8;
  bp.frequency.setValueAtTime(300, t);
  bp.frequency.exponentialRampToValueAtTime(2400, t + 0.25);
  bp.frequency.exponentialRampToValueAtTime(200, t + 1.1);
  const ng = ac.createGain();
  ng.gain.setValueAtTime(0.0001, t);
  ng.gain.exponentialRampToValueAtTime(0.18, t + 0.12);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 1.15);
  src.connect(bp).connect(ng).connect(master);
  src.start(t);
}

// Jingle de mission réussie : accords de synthé montants (composition originale)
export function sfxMissionPassed() {
  const ac = audio();
  if (!ac) return;
  const chords = [
    [0, [261.63, 329.63, 392.0]], // do
    [0.32, [293.66, 369.99, 440.0]], // ré
    [0.64, [349.23, 440.0, 523.25, 698.46]] // fa (tenu)
  ];
  chords.forEach(([start, notes], k) => {
    const dur = k === 2 ? 1.8 : 0.34;
    notes.forEach((f) => {
      ['sawtooth', 'square'].forEach((type, j) => {
        tone({ freq: f * (j ? 1.003 : 1), type, start, dur, vol: 0.035, filter: 1800 + k * 600 });
      });
    });
  });
  tone({ freq: 87.31, type: 'sine', start: 0.64, dur: 1.6, vol: 0.25, filter: 400 });
}

// Nappe d'ambiance très discrète pour le menu
export function startAmbience() {
  const ac = audio();
  if (!ac || ambience) return;
  const out = ac.createGain();
  out.gain.value = 0.0001;
  out.gain.exponentialRampToValueAtTime(0.06, ac.currentTime + 2.5);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 700;
  const lfo = ac.createOscillator();
  const lfoGain = ac.createGain();
  lfo.frequency.value = 0.08;
  lfoGain.gain.value = 260;
  lfo.connect(lfoGain).connect(lp.frequency);
  const oscs = [110, 110.6, 164.8, 220.4].map((f) => {
    const o = ac.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f;
    o.connect(lp);
    o.start();
    return o;
  });
  lfo.start();
  lp.connect(out).connect(master);
  ambience = { out, oscs, lfo };
}

export function stopAmbience() {
  if (!ambience || !ctx) return;
  const { out, oscs, lfo } = ambience;
  const t = ctx.currentTime;
  out.gain.cancelScheduledValues(t);
  out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), t);
  out.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
  setTimeout(() => {
    oscs.forEach((o) => o.stop());
    lfo.stop();
  }, 700);
  ambience = null;
}
