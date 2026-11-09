// =============================================================================
// « Anniv Rush » : musique originale du niveau de Julien.
// Électro 140 BPM en la mineur (la – fa – do – sol), 32 mesures (≈ 55 s),
// entièrement synthétisée en Web Audio (aucun fichier).
// Structure calée sur le niveau :
//   mesures 0-1 intro · 2-9 groove · 10-11 montée · 12-19 drop (vaisseau)
//   20-23 pause · 24-29 deuxième drop · 30-31 final
// =============================================================================
import { getAudioGraph } from '../../heist/sound';
import { BPM, BEAT } from './level';

const STEP16 = BEAT / 4;
export const BARS = 32;
export const SONG_LENGTH = BARS * 4 * BEAT;

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Grille d'accords (une mesure chacun, en boucle)
const CHORDS = [
  { root: 33, notes: [57, 60, 64] }, // la mineur
  { root: 29, notes: [57, 60, 65] }, // fa
  { root: 36, notes: [55, 60, 64] }, // do
  { root: 31, notes: [55, 59, 62] } // sol
];
// Mélodie (4 mesures de 16 doubles-croches) : [pas, note, durée en pas]
const LEAD = [
  [[0, 81, 3], [3, 79, 3], [6, 76, 2], [8, 81, 2], [10, 84, 2], [12, 83, 2], [14, 79, 2]],
  [[0, 81, 3], [3, 79, 3], [6, 77, 2], [8, 76, 2], [10, 72, 2], [12, 76, 2], [14, 77, 2]],
  [[0, 79, 3], [3, 76, 3], [6, 72, 2], [8, 79, 2], [10, 81, 2], [12, 79, 2], [14, 76, 2]],
  [[0, 74, 3], [3, 71, 3], [6, 74, 2], [8, 79, 2], [10, 76, 4], [14, 74, 2]]
];
// Motif d'arpège (indices dans l'accord, + octave)
const ARP = [0, 1, 2, 4, 2, 1, 3, 2, 0, 2, 1, 4, 2, 3, 1, 2];

// --------------------------------------------------------------- instruments
const noiseCache = new WeakMap();
function noiseBuffer(ac) {
  let b = noiseCache.get(ac);
  if (!b) {
    b = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noiseCache.set(ac, b);
  }
  return b;
}
function env(g, t, a, peak, d, sustain = 0.0001) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), t + a + d);
}
function noise(ac, out, t, { dur, vol, type = 'highpass', freq = 6000, q = 0.7, to }) {
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac);
  const f = ac.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
  f.Q.value = q;
  const g = ac.createGain();
  env(g, t, 0.003, vol, dur);
  src.connect(f).connect(g).connect(out);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.05);
}
function kick(ac, n, t, v = 1) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(165, t);
  o.frequency.exponentialRampToValueAtTime(44, t + 0.12);
  env(g, t, 0.003, 0.95 * v, 0.34);
  o.connect(g).connect(n.bus);
  o.start(t);
  o.stop(t + 0.4);
  noise(ac, n.bus, t, { dur: 0.012, vol: 0.18 * v, freq: 3500 });
  // « pompe » : le pad et la basse s'effacent un instant sur chaque grosse caisse
  n.duck.gain.setValueAtTime(0.25, t);
  n.duck.gain.linearRampToValueAtTime(1, t + 0.26);
}
function clap(ac, n, t, v = 1) {
  [0, 0.011, 0.022].forEach((o, i) => noise(ac, n.bus, t + o, { dur: i === 2 ? 0.16 : 0.02, vol: 0.32 * v, type: 'bandpass', freq: 1600, q: 0.9 }));
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(220, t);
  env(g, t, 0.002, 0.12 * v, 0.08);
  o.connect(g).connect(n.bus);
  o.start(t);
  o.stop(t + 0.12);
}
const hat = (ac, n, t, v = 1, open = false) => noise(ac, n.bus, t, { dur: open ? 0.16 : 0.035, vol: 0.09 * v, freq: 8200 });
function bass(ac, n, t, midi, dur, v = 1) {
  const g = ac.createGain();
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 6;
  lp.frequency.setValueAtTime(1100, t);
  lp.frequency.exponentialRampToValueAtTime(260, t + dur);
  [-7, 7].forEach((c) => {
    const o = ac.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = mtof(midi);
    o.detune.value = c;
    o.connect(lp);
    o.start(t);
    o.stop(t + dur + 0.05);
  });
  const sub = ac.createOscillator();
  sub.type = 'sine';
  sub.frequency.value = mtof(midi);
  sub.connect(g);
  sub.start(t);
  sub.stop(t + dur + 0.05);
  env(g, t, 0.005, 0.3 * v, dur, 0.05);
  lp.connect(g);
  g.connect(n.duck);
}
function pluck(ac, n, t, midi, v = 1, cutoff = 3200) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  const lp = ac.createBiquadFilter();
  o.type = 'square';
  o.frequency.value = mtof(midi);
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(cutoff, t);
  lp.frequency.exponentialRampToValueAtTime(Math.max(300, cutoff / 5), t + 0.16);
  env(g, t, 0.003, 0.07 * v, 0.17);
  o.connect(lp).connect(g).connect(n.bus);
  g.connect(n.delay);
  o.start(t);
  o.stop(t + 0.22);
}
function lead(ac, n, t, midi, dur, v = 1) {
  const g = ac.createGain();
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 3400;
  [['sawtooth', -6], ['square', 6]].forEach(([type, c]) => {
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.value = mtof(midi);
    o.detune.value = c;
    o.connect(lp);
    o.start(t);
    o.stop(t + dur + 0.12);
  });
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.085 * v, t + 0.012);
  g.gain.setValueAtTime(0.085 * v, t + Math.max(0.02, dur - 0.04));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.1);
  lp.connect(g).connect(n.bus);
  g.connect(n.delay);
}
function pad(ac, n, t, notes, dur, v = 1) {
  const g = ac.createGain();
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1500;
  notes.forEach((m) => {
    [-8, 8].forEach((c) => {
      const o = ac.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = mtof(m);
      o.detune.value = c;
      o.connect(lp);
      o.start(t);
      o.stop(t + dur + 0.5);
    });
  });
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.03 * v, t + 0.25);
  g.gain.setValueAtTime(0.03 * v, t + dur - 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.45);
  lp.connect(g).connect(n.duck);
}
const crash = (ac, n, t) => noise(ac, n.bus, t, { dur: 1.8, vol: 0.16, freq: 4200 });
const riser = (ac, n, t, dur) => noise(ac, n.bus, t, { dur, vol: 0.12, type: 'bandpass', freq: 400, to: 7000, q: 1.2 });

// --------------------------------------------------------------- partition
function buildEvents() {
  const ev = [];
  const at = (bar, step16, play) => ev.push({ t: (bar * 16 + step16) * STEP16, play });
  for (let bar = 0; bar < BARS; bar++) {
    const ch = CHORDS[bar % 4];
    const mel = LEAD[bar % 4];
    const intro = bar < 2;
    const groove = bar >= 2 && bar < 10;
    const build = bar >= 10 && bar < 12;
    const drop1 = bar >= 12 && bar < 20;
    const brk = bar >= 20 && bar < 24;
    const drop2 = bar >= 24 && bar < 30;
    const outro = bar >= 30;
    const drop = drop1 || drop2;

    // pad
    if (!outro) at(bar, 0, (ac, n, t) => pad(ac, n, t, ch.notes, 4 * BEAT, intro || brk ? 0.8 : 1));
    // batterie
    for (let beat = 0; beat < 4; beat++) {
      const s = beat * 4;
      if (groove || drop || (build && bar === 10)) at(bar, s, (ac, n, t) => kick(ac, n, t));
      if ((groove || drop) && (beat === 1 || beat === 3)) at(bar, s, (ac, n, t) => clap(ac, n, t));
      if (intro || groove || brk) at(bar, s + 2, (ac, n, t) => hat(ac, n, t, intro ? 0.6 : 1));
      if (drop) {
        for (let k = 0; k < 4; k++) at(bar, s + k, (ac, n, t) => hat(ac, n, t, k === 2 ? 1.1 : 0.55, k === 2));
      }
    }
    // roulement de caisse claire avant les drops
    if (build && bar === 11) {
      for (let k = 0; k < 16; k++) if (k % 2 === 0 || k >= 8) at(bar, k, (ac, n, t) => clap(ac, n, t, 0.35 + k * 0.04));
      at(bar, 0, (ac, n, t) => riser(ac, n, t, 4 * BEAT));
    }
    if (bar === 23) {
      for (let k = 8; k < 16; k++) at(bar, k, (ac, n, t) => clap(ac, n, t, 0.3 + k * 0.04));
      at(bar, 0, (ac, n, t) => riser(ac, n, t, 4 * BEAT));
    }
    if (bar === 12 || bar === 24 || bar === 30) at(bar, 0, (ac, n, t) => crash(ac, n, t));
    // basse
    if (groove || (build && bar === 10)) {
      for (let k = 2; k < 16; k += 4) at(bar, k, (ac, n, t) => bass(ac, n, t, ch.root + 12, BEAT * 0.45));
    }
    if (drop) {
      for (let k = 0; k < 16; k++) {
        if (k % 4 === 0) continue; // laisse la place à la grosse caisse
        at(bar, k, (ac, n, t) => bass(ac, n, t, ch.root + (k % 8 === 6 ? 24 : 12), STEP16 * 0.9, 0.85));
      }
    }
    // arpège
    if (!outro) {
      const cutoff = build ? 1200 + (bar - 10) * 1600 : intro ? 1400 : 3200;
      for (let k = 0; k < 16; k++) {
        if ((intro || brk) && k % 2) continue;
        const idx = ARP[k];
        const note = idx > 2 ? ch.notes[idx - 3] + 12 : ch.notes[idx];
        at(bar, k, (ac, n, t) => pluck(ac, n, t, note + 12, brk ? 0.8 : 1, cutoff + k * (build ? 120 : 0)));
      }
    }
    // mélodie
    if (drop || brk) {
      mel.forEach(([s, m, len]) => {
        at(bar, s, (ac, n, t) => lead(ac, n, t, brk ? m - 12 : m, len * STEP16, brk ? 0.7 : 1));
        if (drop2) at(bar, s, (ac, n, t) => lead(ac, n, t, m + 12, len * STEP16, 0.35));
      });
    }
    // final : grosse caisse + accord tenu
    if (bar === 30) {
      at(bar, 0, (ac, n, t) => kick(ac, n, t));
      at(bar, 0, (ac, n, t) => pad(ac, n, t, [57, 60, 64, 69], 6 * BEAT, 1.6));
      at(bar, 0, (ac, n, t) => lead(ac, n, t, 81, 2 * BEAT, 0.9));
      at(bar, 0, (ac, n, t) => bass(ac, n, t, 45, 2 * BEAT));
    }
  }
  ev.sort((a, b) => a.t - b.t);
  return ev;
}

const EVENTS = buildEvents();

// --------------------------------------------------------------- lecteur
export function createSong() {
  const graph = getAudioGraph();
  if (!graph) return null;
  const { ac, out } = graph;
  let nodes = null;
  let timer = 0;
  let t0 = 0;
  let idx = 0;
  let loop = null; // { from, to } en secondes

  function makeBus() {
    const bus = ac.createGain();
    bus.gain.value = 0.85;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    bus.connect(comp).connect(out);
    const duck = ac.createGain();
    duck.connect(bus);
    const delay = ac.createDelay(1);
    delay.delayTime.value = BEAT * 0.75;
    const fb = ac.createGain();
    fb.gain.value = 0.3;
    const wet = ac.createGain();
    wet.gain.value = 0.22;
    delay.connect(fb).connect(delay);
    delay.connect(wet).connect(bus);
    return { bus, comp, duck, delay };
  }

  function tick() {
    const horizon = ac.currentTime + 0.18;
    for (;;) {
      if (loop && (idx >= EVENTS.length || EVENTS[idx].t >= loop.to)) {
        // on reboucle : la même portion recommence juste après
        t0 += loop.to - loop.from;
        idx = 0;
        while (idx < EVENTS.length && EVENTS[idx].t < loop.from) idx++;
      }
      if (!(idx < EVENTS.length && t0 + EVENTS[idx].t < horizon)) break;
      const e = EVENTS[idx++];
      const when = t0 + e.t;
      if (when >= ac.currentTime - 0.03) e.play(ac, nodes, Math.max(when, ac.currentTime + 0.005));
    }
  }

  // démarre la musique à la position "offset" (en secondes)
  function start(offset = 0, lead = 0.12, loopBars = null) {
    stop(true);
    loop = loopBars ? { from: loopBars[0] * 4 * BEAT, to: loopBars[1] * 4 * BEAT } : null;
    nodes = makeBus();
    t0 = ac.currentTime + lead - offset;
    idx = 0;
    while (idx < EVENTS.length && EVENTS[idx].t < offset - 0.001) idx++;
    tick();
    timer = setInterval(tick, 25);
    return t0;
  }

  function stop(fast = false) {
    clearInterval(timer);
    timer = 0;
    if (nodes) {
      const old = nodes;
      old.bus.gain.setTargetAtTime(0, ac.currentTime, fast ? 0.015 : 0.12);
      setTimeout(() => {
        try {
          old.comp.disconnect();
          old.bus.disconnect();
        } catch {
          /* déjà déconnecté */
        }
      }, fast ? 200 : 900);
      nodes = null;
    }
  }

  return {
    ac,
    start,
    stop,
    get t0() {
      return t0;
    },
    time: () => ac.currentTime - t0,
    playing: () => Boolean(timer)
  };
}

export { BPM };
