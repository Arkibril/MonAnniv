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
  if (music) music.muted = value;
}
export const isMuted = () => muted;

// Accès au contexte audio partagé (pour les musiques synthétisées des niveaux)
export function getAudioGraph() {
  const ac = audio();
  return ac ? { ac, out: master } : null;
}

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

// -----------------------------------------------------------------------------
// Musique de fond optionnelle : fichier fourni par l'organisateur dans
// public/alexia/musique.mp3. Jouée en boucle, volume doux, sur toute la
// session d'Alexia. Sans fichier, on garde la nappe synthétisée.
// -----------------------------------------------------------------------------
export const MUSIC_SRC = '/alexia/musique.mp3';
const MUSIC_VOLUME = 0.18;
let music = null;
let musicFade = null;

function fadeMusic(to, ms, done) {
  clearInterval(musicFade);
  if (!music) return;
  const from = music.volume;
  const start = performance.now();
  musicFade = setInterval(() => {
    const k = Math.min(1, (performance.now() - start) / ms);
    if (music) music.volume = from + (to - from) * k;
    if (k >= 1) {
      clearInterval(musicFade);
      done?.();
    }
  }, 40);
}

const onVisibility = () => {
  if (!music) return;
  if (document.hidden) music.pause();
  else music.play().catch(() => {});
};

// Renvoie une promesse : true si la musique joue, false sinon (fichier absent…)
// src : fichier à jouer (par défaut la musique d'Alexia)
export function startMusic(src = MUSIC_SRC) {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (music) return Promise.resolve(true);
  const el = new Audio(src);
  el.loop = true;
  el.volume = 0;
  el.muted = muted;
  music = el;
  return el
    .play()
    .then(() => {
      fadeMusic(MUSIC_VOLUME, 2500);
      document.addEventListener('visibilitychange', onVisibility);
      return true;
    })
    .catch(() => {
      if (music === el) music = null;
      return false;
    });
}

export const isMusicPlaying = () => Boolean(music);

export function stopMusic() {
  if (!music) return;
  const el = music;
  document.removeEventListener('visibilitychange', onVisibility);
  fadeMusic(0, 600, () => {
    el.pause();
    el.removeAttribute('src');
    el.load();
  });
  music = null;
}

// -----------------------------------------------------------------------------
// Sons au clic sur les boutons, pour tous les invités (synthétisés).
// Le timbre suit le thème de l'invité : pop doux par défaut, tic de menu pour
// Alexia, coup de darbuka pour Eray.
// -----------------------------------------------------------------------------
function noiseHit({ start = 0, dur = 0.03, vol = 0.05, freq = 3000 }) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + start;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq;
  const g = ac.createGain();
  g.gain.value = vol;
  src.connect(bp).connect(g).connect(master);
  src.start(t);
}

export function sfxClick(theme) {
  if (muted) return;
  if (theme === 'heist') {
    tone({ freq: 1250, type: 'triangle', dur: 0.045, vol: 0.08, filter: 6000 });
  } else if (theme === 'comic') {
    // "pow" : coup sourd + claquement
    tone({ freq: 260, type: 'sine', dur: 0.1, vol: 0.28, to: 120, filter: 1200 });
    noiseHit({ dur: 0.04, vol: 0.08, freq: 2400 });
  } else if (theme === 'sketch') {
    noiseHit({ dur: 0.04, vol: 0.06, freq: 2600 });
    noiseHit({ start: 0.05, dur: 0.03, vol: 0.05, freq: 3400 });
  } else if (theme === 'kawaii') {
    tone({ freq: 1568, type: 'sine', dur: 0.18, vol: 0.07, filter: 9000 });
    tone({ freq: 2093, type: 'sine', start: 0.06, dur: 0.2, vol: 0.05, filter: 9000 });
  } else if (theme === 'dank') {
    sfxHitmarker();
  } else if (theme === 'cinema') {
    // petite note de boîte à musique + "tic" de projecteur
    tone({ freq: 1568, type: 'sine', dur: 0.32, vol: 0.09, filter: 7000 });
    tone({ freq: 2349, type: 'sine', start: 0.04, dur: 0.22, vol: 0.04, filter: 7000 });
    noiseHit({ dur: 0.012, vol: 0.05, freq: 5200 });
  } else if (theme === 'kebab') {
    // "düm" grave + "tek" sec, façon darbuka
    tone({ freq: 190, type: 'sine', dur: 0.14, vol: 0.32, to: 85, filter: 900 });
    noiseHit({ start: 0.005, dur: 0.025, vol: 0.09, freq: 3800 });
  } else {
    tone({ freq: 540, type: 'sine', dur: 0.07, vol: 0.12, to: 860, filter: 5000 });
  }
}

const BURST_WORDS = ['POW !', 'BAM !', 'ZAP !', 'BOUM !', 'WOW !', 'CLAC !'];
function comicBurst(x, y) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const b = document.createElement('span');
  b.className = 'cm-burst';
  b.textContent = BURST_WORDS[Math.floor(Math.random() * BURST_WORDS.length)];
  b.style.left = `${x || window.innerWidth / 2}px`;
  b.style.top = `${y || window.innerHeight / 2}px`;
  b.style.setProperty('--rot', `${Math.round(Math.random() * 24 - 12)}deg`);
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 700);
}

function popcornBurst(x, y) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const cx = x || window.innerWidth / 2;
  const cy = y || window.innerHeight / 2;
  for (let i = 0; i < 7; i++) {
    const b = document.createElement('span');
    b.className = i % 3 === 0 ? 'cn-pop cn-pop--star' : 'cn-pop';
    b.textContent = i % 3 === 0 ? '✦' : '🍿';
    const a = (-Math.PI / 2) + (Math.random() - 0.5) * 2.2;
    const d = 40 + Math.random() * 46;
    b.style.left = `${cx}px`;
    b.style.top = `${cy}px`;
    b.style.setProperty('--dx', `${Math.cos(a) * d}px`);
    b.style.setProperty('--dy', `${Math.sin(a) * d}px`);
    b.style.setProperty('--rot', `${Math.round(Math.random() * 300 - 150)}deg`);
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 900);
  }
}

export function hitmarkerBurst(x, y, parent = document.body, force = false) {
  if (!force && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const b = document.createElement('span');
  b.className = 'dk-hit';
  b.innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M4 4 L15 15 M36 4 L25 15 M4 36 L15 25 M36 36 L25 25" stroke="#fff" stroke-width="4" stroke-linecap="square"/><path d="M4 4 L15 15 M36 4 L25 15 M4 36 L15 25 M36 36 L25 25" stroke="#000" stroke-width="1.4"/></svg>';
  b.style.left = `${x ?? window.innerWidth / 2}px`;
  b.style.top = `${y ?? window.innerHeight / 2}px`;
  parent.appendChild(b);
  setTimeout(() => b.remove(), 420);
}

function symbolBurst(x, y, cls, symbols, colors) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const cx = x || window.innerWidth / 2;
  const cy = y || window.innerHeight / 2;
  for (let i = 0; i < 6; i++) {
    const b = document.createElement('span');
    b.className = cls;
    b.textContent = symbols[i % symbols.length];
    b.style.color = colors[i % colors.length];
    const a = (i / 6) * Math.PI * 2 + Math.random() * 0.5;
    const d = 28 + Math.random() * 30;
    b.style.left = `${cx}px`;
    b.style.top = `${cy}px`;
    b.style.setProperty('--dx', `${Math.cos(a) * d}px`);
    b.style.setProperty('--dy', `${Math.sin(a) * d}px`);
    b.style.setProperty('--rot', `${Math.round(Math.random() * 120 - 60)}deg`);
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 800);
  }
}

let clicksInstalled = false;
export function installClickSounds() {
  if (clicksInstalled || typeof document === 'undefined') return;
  clicksInstalled = true;
  document.addEventListener(
    'click',
    (e) => {
      const el = e.target instanceof Element ? e.target.closest('button, [role="button"], a.btn') : null;
      if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
      // Le menu d'Alexia a déjà ses propres sons
      if (el.closest('.hx-intro')) return;
      const theme = document.documentElement.dataset.theme;
      sfxClick(theme);
      // Session de Romain : éclat de BD à l'endroit du clic
      if (theme === 'comic' && !el.closest('.rc-intro')) comicBurst(e.clientX, e.clientY);
      // Session de Lola : pop-corn et paillettes dorées
      if (theme === 'cinema' && !el.closest('.lo-intro')) popcornBurst(e.clientX, e.clientY);
      if (theme === 'sketch' && !el.closest('.sk-intro')) symbolBurst(e.clientX, e.clientY, 'sk-doodle', ['✦', '✎', '☆', '♡', '~'], ['#2b2522']);
      if (theme === 'kawaii' && !el.closest('.kw')) symbolBurst(e.clientX, e.clientY, 'kw-pop', ['♡', '✦', '★', '♪'], ['#ff8fc0', '#b197fc', '#ffd43b', '#74c0fc']);
      // Session de Baptiste : hitmarker à l'endroit du clic
      if (theme === 'dank' && !el.closest('.bp-intro')) hitmarkerBurst(e.clientX, e.clientY);
    },
    true
  );
}

// -----------------------------------------------------------------------------
// Sons du mini-jeu de Romain (synthétisés)
// -----------------------------------------------------------------------------
export function sfxHook() {
  tone({ freq: 1800, type: 'square', dur: 0.03, vol: 0.05, filter: 5000 });
  tone({ freq: 700, type: 'triangle', start: 0.02, dur: 0.08, vol: 0.09, to: 420 });
}
export function sfxRelease() {
  noiseHit({ dur: 0.22, vol: 0.12, freq: 1200 });
}
export function sfxCollect() {
  tone({ freq: 988, type: 'square', dur: 0.06, vol: 0.05, filter: 4000 });
  tone({ freq: 1319, type: 'square', start: 0.06, dur: 0.1, vol: 0.05, filter: 4000 });
}
export function sfxFail() {
  tone({ freq: 420, type: 'sawtooth', dur: 0.5, vol: 0.08, to: 110, filter: 1400 });
}
export function sfxHurt() {
  tone({ freq: 300, type: 'square', dur: 0.18, vol: 0.08, to: 140, filter: 1600 });
  noiseHit({ dur: 0.08, vol: 0.1, freq: 900 });
}
export function sfxShoot() {
  tone({ freq: 1600, type: 'sawtooth', dur: 0.12, vol: 0.05, to: 400, filter: 3500 });
}
export function sfxBoom() {
  tone({ freq: 160, type: 'sine', dur: 0.35, vol: 0.32, to: 45, filter: 700 });
  noiseHit({ dur: 0.3, vol: 0.16, freq: 700 });
}
export function sfxFocusIn() {
  tone({ freq: 600, type: 'sine', dur: 0.55, vol: 0.18, to: 90, filter: 1200 });
  noiseHit({ dur: 0.4, vol: 0.06, freq: 400 });
}
export function sfxFocusOut() {
  tone({ freq: 90, type: 'sine', dur: 0.4, vol: 0.14, to: 520, filter: 1400 });
}
export function sfxMission() {
  tone({ freq: 784, type: 'square', dur: 0.09, vol: 0.05, filter: 3000 });
  tone({ freq: 988, type: 'square', start: 0.09, dur: 0.09, vol: 0.05, filter: 3000 });
  tone({ freq: 1319, type: 'square', start: 0.18, dur: 0.22, vol: 0.05, filter: 3000 });
}

// -----------------------------------------------------------------------------
// Session de Lola : musique de comédie romantique (boîte à musique synthétisée)
// Grille I – vi – IV – V en do majeur, arpèges doux + basse.
// -----------------------------------------------------------------------------
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
let romanceTimer = null;
let romanceBar = 0;
const ROMANCE = [
  [48, [60, 64, 67, 72], [76, 74, 72, 74]],
  [45, [57, 60, 64, 69], [72, 71, 69, 67]],
  [41, [57, 60, 65, 69], [69, 72, 77, 76]],
  [43, [55, 59, 62, 67], [74, 72, 71, 74]]
];
function romanceStep() {
  const [bass, chord, melody] = ROMANCE[romanceBar % ROMANCE.length];
  const e = 0.3; // croche
  tone({ freq: mtof(bass), type: 'sine', dur: 2.2, vol: 0.12, filter: 900 });
  [0, 1, 2, 3, 2, 1, 2, 3].forEach((n, i) =>
    tone({ freq: mtof(chord[n]), type: 'triangle', start: i * e, dur: 0.9, vol: 0.045, filter: 3000 })
  );
  if (romanceBar % 8 >= 4 || romanceBar > 0) {
    melody.forEach((m, i) => tone({ freq: mtof(m), type: 'sine', start: i * e * 2, dur: 1.1, vol: 0.06, filter: 5000 }));
  }
  romanceBar++;
}
export function startRomance() {
  if (romanceTimer || !audio()) return;
  romanceBar = 0;
  romanceStep();
  romanceTimer = setInterval(() => {
    if (document.hidden) return;
    romanceStep();
  }, 2400);
}
export function stopRomance() {
  clearInterval(romanceTimer);
  romanceTimer = null;
}
export const isRomancePlaying = () => Boolean(romanceTimer);

// Ronronnement + cliquetis du projecteur
export function sfxProjector() {
  for (let i = 0; i < 10; i++) noiseHit({ start: i * 0.06, dur: 0.02, vol: 0.05, freq: 1800 + (i % 2) * 900 });
}
// Impression du ticket
export function sfxTicket() {
  for (let i = 0; i < 14; i++) noiseHit({ start: i * 0.045, dur: 0.03, vol: 0.06, freq: 2600 });
  tone({ freq: 1318, type: 'sine', start: 0.7, dur: 0.4, vol: 0.08 });
}
// Rideau qui s'ouvre : souffle de velours
export function sfxCurtain() {
  noiseHit({ dur: 1.2, vol: 0.14, freq: 500 });
  tone({ freq: 523, type: 'sine', start: 0.3, dur: 1.2, vol: 0.07 });
  tone({ freq: 784, type: 'sine', start: 0.45, dur: 1.2, vol: 0.06 });
  tone({ freq: 1046, type: 'sine', start: 0.6, dur: 1.4, vol: 0.05 });
}

// -----------------------------------------------------------------------------
// Session de Baptiste : chien qui aboie, flash d'appareil photo, sons "MLG"
// (tout est synthétisé, aucun fichier)
// -----------------------------------------------------------------------------
export function sfxWoaf(start = 0, pitch = 1) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + start;
  const osc = ac.createOscillator();
  const bp = ac.createBiquadFilter();
  const g = ac.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(430 * pitch, t);
  osc.frequency.linearRampToValueAtTime(620 * pitch, t + 0.04);
  osc.frequency.exponentialRampToValueAtTime(190 * pitch, t + 0.24);
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(1100, t);
  bp.frequency.exponentialRampToValueAtTime(600, t + 0.24);
  bp.Q.value = 1.4;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.5, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
  osc.connect(bp).connect(g).connect(master);
  osc.start(t);
  osc.stop(t + 0.3);
  noiseHit({ start, dur: 0.07, vol: 0.18, freq: 1600 });
}
export function sfxFlashCharge() {
  tone({ freq: 1400, type: 'sine', dur: 0.9, vol: 0.05, to: 9000, filter: 12000 });
}
export function sfxShutter() {
  noiseHit({ dur: 0.03, vol: 0.35, freq: 4000 });
  noiseHit({ start: 0.07, dur: 0.05, vol: 0.3, freq: 2500 });
  tone({ freq: 180, type: 'square', dur: 0.05, vol: 0.12, filter: 1500 });
}
export function sfxHitmarker() {
  tone({ freq: 1950, type: 'square', dur: 0.035, vol: 0.06, filter: 6000 });
  noiseHit({ dur: 0.02, vol: 0.08, freq: 6000 });
}
export function sfxAirhorn(start = 0) {
  const ac = audio();
  if (!ac) return;
  const blasts = [[0, 0.13], [0.17, 0.13], [0.34, 0.13], [0.52, 0.75]];
  blasts.forEach(([s0, d]) => {
    [370, 466, 554, 740].forEach((f, i) => {
      const t = ac.currentTime + start + s0;
      const osc = ac.createOscillator();
      const lp = ac.createBiquadFilter();
      const g = ac.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f * 0.94, t);
      osc.frequency.exponentialRampToValueAtTime(f * (1 + (i - 1.5) * 0.004), t + 0.05);
      lp.type = 'lowpass';
      lp.frequency.value = 3200;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
      g.gain.setValueAtTime(0.06, t + d - 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      osc.connect(lp).connect(g).connect(master);
      osc.start(t);
      osc.stop(t + d + 0.02);
    });
  });
}
export function sfxWow(start = 0) {
  // "wooow" de synthé qui monte et redescend
  tone({ freq: 220, type: 'sawtooth', start, dur: 0.25, vol: 0.1, to: 520, filter: 1800 });
  tone({ freq: 520, type: 'sawtooth', start: start + 0.25, dur: 0.45, vol: 0.1, to: 260, filter: 1800 });
}

// "Kill" dans le kill feed de Baptiste : petit double bip de confirmation
export function sfxKill() {
  tone({ freq: 1760, type: 'square', dur: 0.05, vol: 0.05, filter: 5000 });
  tone({ freq: 2349, type: 'square', start: 0.06, dur: 0.09, vol: 0.05, filter: 5000 });
}

// Niveau de Julien : explosion du cube et fanfare de fin de niveau
export function sfxExplode() {
  noiseHit({ dur: 0.35, vol: 0.32, freq: 900 });
  tone({ freq: 140, type: 'square', dur: 0.25, vol: 0.14, to: 40, filter: 900 });
}
export function sfxLevelComplete() {
  [72, 76, 79, 84, 88].forEach((m, i) =>
    tone({ freq: 440 * Math.pow(2, (m - 69) / 12), type: 'triangle', start: i * 0.09, dur: 0.5, vol: 0.12, filter: 6000 })
  );
}

// -----------------------------------------------------------------------------
// Carnet de croquis (Julien, Assiya) : crayon, pop, page, rebond, mélodie
// -----------------------------------------------------------------------------
export function sfxScribble() {
  noiseHit({ dur: 0.035 + Math.random() * 0.03, vol: 0.05, freq: 2200 + Math.random() * 1800 });
}
export function sfxPop(pitch = 1) {
  tone({ freq: 520 * pitch, type: 'sine', dur: 0.09, vol: 0.12, to: 1100 * pitch, filter: 8000 });
}
export function sfxPage() {
  noiseHit({ dur: 0.22, vol: 0.12, freq: 1400 });
  noiseHit({ start: 0.08, dur: 0.18, vol: 0.08, freq: 900 });
}
export function sfxBoing(pitch = 1) {
  tone({ freq: 260 * pitch, type: 'triangle', dur: 0.16, vol: 0.1, to: 620 * pitch, filter: 3000 });
}
export function sfxSparkle() {
  [0, 0.05, 0.1].forEach((s, i) => tone({ freq: 1760 + i * 440, type: 'sine', start: s, dur: 0.12, vol: 0.05, filter: 9000 }));
}
// Petite mélodie de kalimba (originale), en boucle pendant l'animation
let storyTimer = null;
let storyBar = 0;
const KALIMBA = [
  [72, 76, 79, 76, 74, 77, 81, 77],
  [72, 76, 79, 84, 83, 79, 76, 74],
  [69, 72, 76, 72, 71, 74, 77, 74],
  [67, 71, 74, 79, 77, 74, 71, 72]
];
function kalimbaNote(m, start) {
  const f = 440 * Math.pow(2, (m - 69) / 12);
  tone({ freq: f, type: 'sine', start, dur: 0.5, vol: 0.07, filter: 6000 });
  tone({ freq: f * 2, type: 'sine', start, dur: 0.18, vol: 0.02, filter: 9000 });
}
export function startStoryTune() {
  if (storyTimer || !audio()) return;
  storyBar = 0;
  const play = () => {
    if (document.hidden) return;
    const notes = KALIMBA[storyBar % KALIMBA.length];
    notes.forEach((m, i) => kalimbaNote(m, i * 0.25));
    tone({ freq: 440 * Math.pow(2, (notes[0] - 24 - 69) / 12), type: 'triangle', dur: 1.8, vol: 0.06, filter: 900 });
    storyBar++;
  };
  play();
  storyTimer = setInterval(play, 2000);
}
export function stopStoryTune() {
  clearInterval(storyTimer);
  storyTimer = null;
}

// Plateau 3D de Mathilde & Guillaume : dé qui claque, plouf du bain
export function sfxDiceHit(v = 1) {
  noiseHit({ dur: 0.03, vol: 0.12 * v, freq: 2200 });
  tone({ freq: 340, type: 'triangle', dur: 0.05, vol: 0.06 * v, filter: 2500 });
}
export function sfxSplash() {
  noiseHit({ dur: 0.4, vol: 0.18, freq: 700 });
  tone({ freq: 500, type: 'sine', dur: 0.3, vol: 0.06, to: 180, filter: 2000 });
}

// -----------------------------------------------------------------------------
// Sabrina : coupure "disque rayé" puis beat de conduite de nuit (original,
// cloche façon boîte à rythmes, basse 808 qui glisse, charleston)
// -----------------------------------------------------------------------------
export function sfxScratch() {
  tone({ freq: 900, type: 'sawtooth', dur: 0.12, vol: 0.08, to: 180, filter: 2500 });
  tone({ freq: 300, type: 'sawtooth', start: 0.13, dur: 0.16, vol: 0.08, to: 1200, filter: 2500 });
  noiseHit({ dur: 0.28, vol: 0.12, freq: 1500 });
}
// Beat techno de boîte de nuit (original) : 4 temps à la grosse caisse,
// charleston ouvert à contretemps, clap sur 2 et 4, basse roulante, accords
// hypnotiques dont le filtre s'ouvre petit à petit.
let clubTimer = null;
let clubBar = 0;
const m2f = (m) => 440 * Math.pow(2, (m - 69) / 12);
const CLUB_ROOTS = [33, 33, 36, 31]; // la, la, do, sol (basse)
const CLUB_STABS = [
  [57, 60, 64, 67],
  [57, 60, 64, 69],
  [60, 64, 67, 71],
  [55, 59, 62, 67]
];
export function startClubBeat() {
  if (clubTimer || !audio()) return;
  clubBar = 0;
  const beat = 60 / 130;
  const s16 = beat / 4;
  const play = () => {
    if (document.hidden) return;
    const root = CLUB_ROOTS[clubBar % CLUB_ROOTS.length];
    const stab = CLUB_STABS[clubBar % CLUB_STABS.length];
    const open = Math.min(5200, 900 + clubBar * 420); // le filtre s'ouvre
    for (let b = 0; b < 4; b++) {
      const t = b * beat;
      tone({ freq: 150, type: 'sine', start: t, dur: 0.26, vol: 0.34, to: 45, filter: 900 });
      noiseHit({ start: t + beat / 2, dur: 0.07, vol: 0.05, freq: 7600 });
      if (b === 1 || b === 3) noiseHit({ start: t, dur: 0.11, vol: 0.1, freq: 1500 });
      for (let k = 1; k < 4; k++) tone({ freq: m2f(root + 12), type: 'sawtooth', start: t + k * s16, dur: s16 * 0.9, vol: 0.07, filter: 420 });
    }
    [2, 6, 10, 11, 14].forEach((k) => stab.forEach((m) => tone({ freq: m2f(m), type: 'square', start: k * s16, dur: 0.07, vol: 0.018, filter: open })));
    clubBar++;
  };
  play();
  clubTimer = setInterval(play, 4 * (60 / 130) * 1000);
}
export function stopClubBeat() {
  clearInterval(clubTimer);
  clubTimer = null;
}
