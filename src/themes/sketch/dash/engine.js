// =============================================================================
// Moteur du niveau de Julien : rendu canvas, boucle calée sur l'horloge audio,
// tentatives, barre de progression, mode entraînement.
// Gameplay façon jeu de rythme à un bouton ; graphismes et musique originaux.
// =============================================================================
import { createSim, STEP, SPEED, spikeBox } from './physics';
import { LEVEL, BEAT } from './level';
import { createSong, SONG_LENGTH } from './music';
import { sfxExplode, sfxLevelComplete } from '../../heist/sound';

const TAU = Math.PI * 2;

// Couleurs du cube (choisies dans le menu "Mon cube")
export const CUBE_LOOKS = [
  { main: '#5ee6b8', accent: '#ffe066' },
  { main: '#ff8fd8', accent: '#74c0fc' },
  { main: '#ffa94d', accent: '#b197fc' },
  { main: '#74c0fc', accent: '#a9e34b' },
  { main: '#ff6b6b', accent: '#ffe066' },
  { main: '#ffffff', accent: '#5ee6b8' }
];

// Le cube de Julien : carré bicolore avec un visage géométrique (création originale)
export function paintCube(ctx, size, look = CUBE_LOOKS[0]) {
  const h = size / 2;
  const lw = Math.max(2, size * 0.09);
  ctx.lineJoin = 'miter';
  ctx.fillStyle = look.main;
  ctx.fillRect(-h, -h, size, size);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = lw;
  ctx.strokeRect(-h + lw / 2, -h + lw / 2, size - lw, size - lw);
  // cadre intérieur de la couleur secondaire
  const ih = h * 0.72;
  ctx.fillStyle = look.accent;
  ctx.fillRect(-ih, -ih, ih * 2, ih * 2);
  ctx.lineWidth = lw * 0.8;
  ctx.strokeRect(-ih, -ih, ih * 2, ih * 2);
  ctx.fillStyle = look.main;
  const ii = h * 0.5;
  ctx.fillRect(-ii, -ii, ii * 2, ii * 2);
  ctx.strokeRect(-ii, -ii, ii * 2, ii * 2);
  // yeux carrés et bouche
  ctx.fillStyle = '#000';
  ctx.fillRect(-h * 0.36, -h * 0.3, h * 0.2, h * 0.28);
  ctx.fillRect(h * 0.16, -h * 0.3, h * 0.2, h * 0.28);
  ctx.fillRect(-h * 0.3, h * 0.14, h * 0.6, h * 0.14);
  // reflet
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(-h + lw, -h + lw, size - lw * 2, h * 0.16);
}
const lerp = (a, b, k) => a + (b - a) * k;
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (c1, c2, k) => {
  const a = hex(c1);
  const b = hex(c2);
  return `rgb(${Math.round(lerp(a[0], b[0], k))},${Math.round(lerp(a[1], b[1], k))},${Math.round(lerp(a[2], b[2], k))})`;
};

export function createDash(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  const sim = createSim(LEVEL);
  const song = createSong();
  const objs = LEVEL.objects;
  const startX = 0;
  const totalX = LEVEL.endX - startX;

  let raf = 0;
  let mode = 'ready'; // ready | running | dead | won | paused
  let holding = false;
  let attempts = opts.initialAttempts || 0;
  let best = opts.initialBest || 0;
  let sessionAttempts = 0;
  let playTime = 0;
  let practice = false;
  let checkpoint = LEVEL.checkpoints[0];
  let deadAt = 0;
  let wonAt = 0;
  let clock0 = 0; // repli si pas d'audio
  let camY = 0;
  let shake = 0;
  let particles = [];
  let rings = [];
  let attemptText = { x: 3, n: 1 };
  let autoplay = null; // tests : une décision (appui ou non) tous les 4 pas
  let stepIdx = 0;
  let lastBeat = -1;
  let pulse = 0;
  let toast = null;
  const W = () => canvas.width;
  const H = () => canvas.height;
  let dpr = 1;
  let bs = 30; // taille d'un bloc en pixels
  let originY = 0;
  let portrait = false;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    portrait = r.height > r.width;
    // en vertical on zoome (le jeu est pensé à l'horizontale, comme l'original)
    bs = Math.min(canvas.height / 12.5, canvas.width / (portrait ? 11.5 : 19));
    originY = canvas.height * (portrait ? 0.66 : 0.8);
  }
  resize();
  window.addEventListener('resize', resize);

  const songTime = () => (song ? song.time() : (performance.now() - clock0) / 1000);

  function startMusic(offset) {
    if (song) song.start(offset);
    else clock0 = performance.now() - offset * 1000;
  }

  function begin() {
    attempts++;
    sessionAttempts++;
    attemptText = { x: SPEED * checkpoint.t + 4, n: attempts };
    sim.reset(practice ? checkpoint : null);
    stepIdx = 0;
    if (!practice) checkpoint = LEVEL.checkpoints[0];
    particles = [];
    rings = [];
    mode = 'running';
    startMusic(sim.state.t);
    opts.onAttempt?.(attempts);
  }

  function die() {
    mode = 'dead';
    deadAt = performance.now();
    holding = false;
    song?.stop(true);
    sfxExplode();
    shake = 14;
    const s = sim.state;
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * TAU;
      const v = 4 + Math.random() * 9;
      particles.push({ x: s.x, y: s.y + 0.5, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.7, max: 0.7, size: 0.18 + Math.random() * 0.22, color: '#7cf2c8' });
    }
    rings.push({ x: s.x, y: s.y + 0.5, r: 0.3, life: 0.45, max: 0.45 });
    const pct = Math.min(100, Math.floor(((s.x - startX) / totalX) * 100));
    if (!practice && pct > best) {
      best = pct;
      if (attempts > 1) toast = { text: `Nouveau record ! ${pct} %`, t: performance.now() };
    }
    opts.onDeath?.({ attempts, percent: pct, best, practice });
  }

  function win() {
    mode = 'won';
    wonAt = performance.now();
    if (practice) {
      song?.stop();
    }
    sfxLevelComplete();
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * TAU;
      const v = 3 + Math.random() * 12;
      particles.push({ x: sim.state.x, y: sim.state.y + 0.5, vx: Math.cos(a) * v, vy: Math.sin(a) * v + 4, life: 1.4, max: 1.4, size: 0.2 + Math.random() * 0.25, color: ['#ffd43b', '#7cf2c8', '#ff8fd8', '#ffffff'][i % 4] });
    }
    const stats = { attempts, sessionAttempts, jumps: sim.state.jumps, practice, playTime };
    setTimeout(() => opts.onWin?.(stats), 1900);
  }

  // ------------------------------------------------------------ simulation
  function update(dtReal) {
    const s = sim.state;
    if (mode === 'running') {
      const target = songTime();
      let n = 0;
      playTime += dtReal;
      while (s.t + STEP <= target && n < 120) {
        const hold = autoplay ? autoplay[stepIdx >> 2] === '1' : holding;
        stepIdx++;
        sim.step(hold);
        n++;
        for (const e of s.events) {
          if (e === 'pad' || e === 'orb') rings.push({ x: s.x, y: s.y + 0.5, r: 0.4, life: 0.35, max: 0.35, color: '#ffd43b' });
          if (e === 'portal') {
            rings.push({ x: s.x, y: s.y + 0.5, r: 0.5, life: 0.5, max: 0.5, color: s.mode === 'ship' ? '#ff6bd6' : '#7cff9b' });
          }
        }
        if (s.dead) {
          die();
          break;
        }
        if (s.won) {
          win();
          break;
        }
        // points de reprise en mode entraînement
        if (practice) {
          for (const cp of LEVEL.checkpoints) if (cp.t > checkpoint.t && s.t >= cp.t + 0.05) checkpoint = cp;
        }
      }
      // particules du cube qui glisse / du vaisseau
      if (mode === 'running' && Math.random() < 0.6) {
        if (s.mode === 'ship') {
          particles.push({ x: s.x - 0.6, y: s.y + 0.3, vx: -2 - Math.random() * 2, vy: (Math.random() - 0.5) * 2, life: 0.4, max: 0.4, size: 0.14, color: '#ff9ce8' });
        } else if (s.grounded) {
          particles.push({ x: s.x - 0.5, y: s.y + 0.05, vx: -3 - Math.random() * 2, vy: 1 + Math.random() * 2, life: 0.3, max: 0.3, size: 0.12, color: '#ffffff' });
        }
      }
    } else if (mode === 'dead') {
      if (performance.now() - deadAt > 750) begin();
    } else if (mode === 'won') {
      sim.state.x += SPEED * dtReal;
    }
    // beat
    const st = songTime();
    const beat = Math.floor(st / BEAT);
    if (beat !== lastBeat && mode === 'running') {
      lastBeat = beat;
      pulse = 1;
    }
    pulse *= Math.pow(0.02, dtReal);
    shake *= Math.pow(0.0005, dtReal);
    particles = particles.filter((p) => {
      p.life -= dtReal;
      p.x += p.vx * dtReal;
      p.y += p.vy * dtReal;
      p.vy -= 9 * dtReal;
      return p.life > 0;
    });
    rings = rings.filter((r) => (r.life -= dtReal) > 0);
  }

  // ------------------------------------------------------------ rendu
  function section(x) {
    const b = x / (SPEED * BEAT);
    let cur = LEVEL.sections[0];
    let prev = cur;
    for (const sct of LEVEL.sections) if (b >= sct.b) {
      prev = cur;
      cur = sct;
    }
    const k = Math.min(1, (b - cur.b) / 2); // fondu sur 2 temps
    return { cur, prev, k };
  }

  function draw() {
    const s = sim.state;
    const w = W();
    const h = H();
    const camX = s.x - (w / bs) * (portrait ? 0.24 : 0.3);
    const wantCamY = s.mode === 'ship' ? 5 - (originY - h / 2) / bs : Math.max(0, s.y - 4);
    camY = lerp(camY, wantCamY, 0.08);
    const sx = (x) => (x - camX) * bs;
    const sy = (y) => originY - (y - camY) * bs;
    const { cur, prev, k } = section(s.x);
    const c0 = mix(prev.bg[0], cur.bg[0], k);
    const c1 = mix(prev.bg[1], cur.bg[1], k);
    const ground = mix(prev.ground, cur.ground, k);
    const line = mix(prev.line, cur.line, k);

    ctx.save();
    if (shake > 0.3) ctx.translate((Math.random() - 0.5) * shake * dpr, (Math.random() - 0.5) * shake * dpr);

    // fond
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, c0);
    g.addColorStop(1, c1);
    ctx.fillStyle = g;
    ctx.fillRect(-20, -20, w + 40, h + 40);
    // grands carrés du décor (parallaxe)
    ctx.save();
    ctx.globalAlpha = 0.09 + pulse * 0.05;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * dpr;
    const par = camX * bs * 0.18;
    const size = bs * 4;
    for (let gx = -((par % (size * 1.6)) + size * 1.6); gx < w + size; gx += size * 1.6) {
      for (let gy = (h * 0.08) % size; gy < originY; gy += size * 1.6) {
        ctx.strokeRect(gx, gy - ((camY * bs * 0.18) % size), size, size);
      }
    }
    ctx.restore();

    // plafond (vaisseau)
    if (s.mode === 'ship' && Number.isFinite(s.ceil)) {
      const cy = sy(s.ceil);
      ctx.fillStyle = ground;
      ctx.fillRect(0, -20, w, cy + 20);
      ctx.fillStyle = line;
      ctx.fillRect(0, cy - 2 * dpr, w, 3 * dpr);
    }

    // objets
    const x0 = camX - 2;
    const x1 = camX + w / bs + 2;
    for (const o of objs) {
      const ow = o.w || 1;
      if (o.x + ow < x0) continue;
      if (o.x > x1) break;
      drawObject(o, sx, sy, line);
    }

    // sol
    const gy = sy(0);
    ctx.fillStyle = ground;
    ctx.fillRect(0, gy, w, h - gy + 20);
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2 * dpr;
    const tile = bs * 2;
    for (let tx = -((camX * bs) % tile); tx < w; tx += tile) ctx.strokeRect(tx, gy, tile, tile);
    ctx.restore();
    ctx.fillStyle = line;
    ctx.globalAlpha = 0.35 + pulse * 0.4;
    ctx.fillRect(0, gy - 3 * dpr, w, 7 * dpr);
    ctx.globalAlpha = 1;
    ctx.fillRect(0, gy - 1 * dpr, w, 2.5 * dpr);

    // texte "Tentative N" posé dans le décor
    if (attemptText) {
      ctx.save();
      ctx.font = `700 ${Math.round(bs * 0.95)}px 'Lilita One', 'Arial Black', sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(3, bs * 0.14);
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.strokeText(`Tentative ${attemptText.n}`, sx(attemptText.x), sy(4.2));
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Tentative ${attemptText.n}`, sx(attemptText.x), sy(4.2));
      ctx.restore();
    }

    // aide au tout premier essai
    if (sessionAttempts === 1 && attempts <= 1) {
      ctx.save();
      ctx.font = `700 ${Math.round(bs * 0.7)}px 'Lilita One', 'Arial Black', sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.textAlign = 'center';
      ctx.fillText('Appuie pour sauter !', sx(29), sy(3));
      ctx.fillText('Maintiens pour voler ↑', sx(212), sy(6));
      ctx.fillText('Appuie dans l’anneau !', sx(192), sy(4.6));
      ctx.restore();
    }

    // points de reprise
    if (practice) {
      for (const cp of LEVEL.checkpoints) {
        if (cp.t === 0) continue;
        const px = sx(SPEED * cp.t);
        const py = sy(cp.y + 0.5);
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = cp.t <= checkpoint.t ? '#7cff9b' : 'rgba(124,255,155,0.35)';
        ctx.fillRect(-bs * 0.22, -bs * 0.22, bs * 0.44, bs * 0.44);
        ctx.restore();
      }
    }

    // anneaux et particules
    for (const r of rings) {
      const kk = 1 - r.life / r.max;
      ctx.strokeStyle = r.color || '#ffffff';
      ctx.globalAlpha = 1 - kk;
      ctx.lineWidth = 4 * dpr;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + kk * 2.2) * bs, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      const ps = p.size * bs;
      ctx.fillRect(sx(p.x) - ps / 2, sy(p.y) - ps / 2, ps, ps);
    }
    ctx.globalAlpha = 1;

    // joueur
    if (mode !== 'dead') drawPlayer(sx(s.x), sy(s.y), s);

    ctx.restore();

    // interface : barre de progression
    const pct = Math.max(0, Math.min(1, (s.x - startX) / totalX));
    const bw = Math.min(w * 0.46, 420 * dpr);
    const bx = (w - bw) / 2;
    const by = 16 * dpr;
    const bh = 12 * dpr;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    roundRect(bx - 3 * dpr, by - 3 * dpr, bw + 6 * dpr, bh + 6 * dpr, 9 * dpr);
    ctx.fill();
    ctx.fillStyle = '#7cff9b';
    roundRect(bx, by, Math.max(bh, bw * pct), bh, 6 * dpr);
    ctx.fill();
    ctx.font = `700 ${Math.round(15 * dpr)}px 'Lilita One', 'Arial Black', sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.floor(pct * 100)} %`, bx + bw + 12 * dpr, by + bh / 2);
    if (practice) {
      ctx.fillStyle = '#7cff9b';
      ctx.fillText('Entraînement', bx, by + bh + 16 * dpr);
    } else if (best > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(`Record : ${best} %`, bx, by + bh + 16 * dpr);
    }
    if (toast && performance.now() - toast.t < 1600) {
      ctx.save();
      ctx.font = `700 ${Math.round(26 * dpr)}px 'Lilita One', 'Arial Black', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd43b';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 5 * dpr;
      ctx.strokeText(toast.text, w / 2, h * 0.3);
      ctx.fillText(toast.text, w / 2, h * 0.3);
      ctx.restore();
    }
    if (mode === 'won') {
      const e = Math.min(1, (performance.now() - wonAt) / 380);
      const sc = 1 + (1 - e) * 1.8;
      ctx.save();
      ctx.translate(w / 2, h * 0.42);
      ctx.scale(sc, sc);
      ctx.font = `700 ${Math.round(Math.min(64 * dpr, w / 9))}px 'Lilita One', 'Arial Black', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 9 * dpr;
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.strokeText(practice ? 'Entraînement réussi !' : 'NIVEAU TERMINÉ !', 0, 0);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(practice ? 'Entraînement réussi !' : 'NIVEAU TERMINÉ !', 0, 0);
      ctx.restore();
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawObject(o, sx, sy, line) {
    const lw = Math.max(2, bs * 0.08);
    if (o.type === 'block') {
      const x = sx(o.x);
      const y = sy(o.y + o.h);
      const ww = o.w * bs;
      const hh = o.h * bs;
      ctx.fillStyle = 'rgba(10,6,24,0.72)';
      ctx.fillRect(x, y, ww, hh);
      ctx.strokeStyle = line;
      ctx.lineWidth = lw;
      ctx.strokeRect(x + lw / 2, y + lw / 2, ww - lw, hh - lw);
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = lw * 0.6;
      for (let i = 0; i < o.w - 0.01; i += 1) {
        for (let j = 0; j < o.h - 0.01; j += 1) {
          ctx.strokeRect(x + i * bs + bs * 0.22, y + j * bs + bs * 0.22, bs * 0.56, bs * 0.56);
        }
      }
      ctx.globalAlpha = 1;
    } else if (o.type === 'spike') {
      const x = sx(o.x);
      const base = sy(o.y);
      const top = sy(o.y + 1);
      ctx.beginPath();
      if (o.down) {
        ctx.moveTo(x, top);
        ctx.lineTo(x + bs, top);
        ctx.lineTo(x + bs / 2, base);
      } else {
        ctx.moveTo(x, base);
        ctx.lineTo(x + bs / 2, top);
        ctx.lineTo(x + bs, base);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(10,6,24,0.85)';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = lw;
      ctx.lineJoin = 'round';
      ctx.stroke();
      void spikeBox;
    } else if (o.type === 'pad') {
      const x = sx(o.x);
      const y = sy(o.y);
      ctx.fillStyle = '#ffd43b';
      ctx.beginPath();
      ctx.ellipse(x + bs / 2, y, bs * 0.46, bs * 0.2, 0, Math.PI, 0);
      ctx.fill();
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(performance.now() / 120);
      ctx.fillRect(x + bs * 0.45, y - bs * 0.75, bs * 0.1, bs * 0.4);
      ctx.globalAlpha = 1;
    } else if (o.type === 'orb') {
      const cx = sx(o.x + 0.5);
      const cy = sy(o.y + 0.5);
      const used = sim.state.used.has(o);
      const r = bs * (0.36 + 0.04 * Math.sin(performance.now() / 140));
      ctx.lineWidth = lw * 1.4;
      ctx.strokeStyle = used ? 'rgba(255,212,59,0.35)' : '#ffd43b';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = used ? 'rgba(255,212,59,0.15)' : 'rgba(255,212,59,0.55)';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.55, 0, TAU);
      ctx.fill();
    } else if (o.type === 'portal') {
      const cx = sx(o.x + 0.5);
      const cy = sy(sim.state.mode === 'ship' || o.mode === 'ship' ? 2.5 : 1.5);
      const color = o.mode === 'ship' ? '#ff6bd6' : '#7cff9b';
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = color;
      ctx.lineWidth = lw * 1.6;
      ctx.beginPath();
      ctx.ellipse(0, 0, bs * 0.55, bs * 1.6, 0, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPlayer(px, py, s) {
    const size = bs;
    ctx.save();
    if (s.mode === 'ship') {
      // vaisseau (création originale) avec le cube aux commandes
      ctx.translate(px, py - size * 0.32);
      ctx.rotate(s.rot);
      const look = opts.look || CUBE_LOOKS[0];
      // flamme du réacteur
      ctx.fillStyle = Math.random() < 0.5 ? '#ffd43b' : '#ff922b';
      ctx.beginPath();
      ctx.moveTo(-size * 0.62, -size * 0.12);
      ctx.lineTo(-size * (0.95 + Math.random() * 0.25), 0);
      ctx.lineTo(-size * 0.62, size * 0.12);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = Math.max(2, size * 0.08);
      ctx.strokeStyle = '#000';
      ctx.fillStyle = look.main;
      ctx.beginPath();
      ctx.moveTo(size * 0.72, size * 0.05);
      ctx.lineTo(size * 0.2, -size * 0.2);
      ctx.lineTo(-size * 0.62, -size * 0.22);
      ctx.lineTo(-size * 0.62, size * 0.3);
      ctx.lineTo(size * 0.5, size * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = look.accent;
      ctx.fillRect(-size * 0.5, size * 0.06, size * 0.7, size * 0.14);
      ctx.strokeRect(-size * 0.5, size * 0.06, size * 0.7, size * 0.14);
      ctx.translate(-size * 0.1, -size * 0.42);
      drawCube(size * 0.5);
    } else {
      ctx.translate(px, py - size / 2);
      ctx.rotate(s.rot);
      drawCube(size);
    }
    ctx.restore();
  }

  function drawCube(size) {
    paintCube(ctx, size, opts.look);
  }

  // ------------------------------------------------------------ boucle
  let last = performance.now();
  function frame(now) {
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    if (mode !== 'paused' && mode !== 'ready') update(dt);
    draw();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  function onVisibility() {
    if (document.hidden && mode === 'running') pause();
  }
  document.addEventListener('visibilitychange', onVisibility);

  function pause() {
    if (mode !== 'running') return;
    mode = 'paused';
    holding = false;
    song?.stop(true);
    opts.onPause?.();
  }
  function resume() {
    if (mode !== 'paused') return;
    mode = 'running';
    startMusic(sim.state.t);
  }

  const api = {
    start() {
      if (mode === 'ready') begin();
    },
    press() {
      holding = true;
    },
    release() {
      holding = false;
    },
    pause,
    resume,
    restart() {
      song?.stop(true);
      checkpoint = LEVEL.checkpoints[0];
      begin();
    },
    setPractice(v) {
      practice = v;
      checkpoint = LEVEL.checkpoints[0];
      song?.stop(true);
      begin();
    },
    get practice() {
      return practice;
    },
    get mode() {
      return mode;
    },
    get attempts() {
      return attempts;
    },
    progress: () => Math.max(0, Math.min(1, (sim.state.x - startX) / totalX)),
    autoplay(bits) {
      autoplay = bits;
    },
    destroy() {
      cancelAnimationFrame(raf);
      song?.stop();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    }
  };
  void SONG_LENGTH;
  return api;
}

// =============================================================================
// Fond animé du menu : le cube court et saute sur le sol, les couleurs du
// décor défilent doucement (comme l'écran titre d'un jeu de rythme).
// =============================================================================
export function createMenuScene(canvas, getLook) {
  const ctx = canvas.getContext('2d');
  let raf = 0;
  let dpr = 1;
  let bs = 40;
  let t = 0;
  let y = 0;
  let vy = 0;
  let rot = 0;
  let nextJump = 0.8;
  let last = performance.now();
  const sections = LEVEL.sections;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    bs = Math.min(canvas.height / 9, canvas.width / 11);
  }
  resize();
  window.addEventListener('resize', resize);

  function frame(now) {
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    t += dt;
    // petit cube qui saute de temps en temps
    nextJump -= dt;
    if (nextJump <= 0 && y <= 0) {
      vy = 20.4;
      nextJump = 0.5 + Math.random() * 1.4;
    }
    vy -= 97 * dt;
    y += vy * dt;
    if (y > 0) rot += (Math.PI / 0.42) * dt;
    if (y <= 0) {
      y = 0;
      vy = 0;
      rot = Math.round(rot / (Math.PI / 2)) * (Math.PI / 2);
    }
    const w = canvas.width;
    const h = canvas.height;
    const cyc = (t / 6) % sections.length;
    const i0 = Math.floor(cyc);
    const k = cyc - i0;
    const a = sections[i0];
    const b = sections[(i0 + 1) % sections.length];
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, mix(a.bg[0], b.bg[0], k));
    g.addColorStop(1, mix(a.bg[1], b.bg[1], k));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const camX = t * SPEED;
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2 * dpr;
    const size = bs * 3.2;
    for (let gx = -((camX * bs * 0.2) % (size * 1.6)) - size; gx < w + size; gx += size * 1.6) {
      for (let gy = size * 0.2; gy < h; gy += size * 1.6) ctx.strokeRect(gx, gy, size, size);
    }
    ctx.restore();
    const groundY = h * 0.78;
    ctx.fillStyle = mix(a.ground, b.ground, k);
    ctx.fillRect(0, groundY, w, h - groundY);
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2 * dpr;
    for (let tx = -((camX * bs) % (bs * 2)); tx < w; tx += bs * 2) ctx.strokeRect(tx, groundY, bs * 2, bs * 2);
    ctx.restore();
    ctx.fillStyle = mix(a.line, b.line, k);
    ctx.fillRect(0, groundY - 1.5 * dpr, w, 3 * dpr);
    ctx.save();
    ctx.translate(w * 0.22, groundY - y * bs - bs / 2);
    ctx.rotate(rot);
    paintCube(ctx, bs, getLook());
    ctx.restore();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return {
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    }
  };
}
