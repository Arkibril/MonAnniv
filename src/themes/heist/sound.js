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
