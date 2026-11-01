// =============================================================================
// Moteur d'explosion temps réel (Canvas 2D)
// -----------------------------------------------------------------------------
// - Indépendant du framerate (60 / 120 Hz) : tout est piloté par le temps réel.
// - Feu : boules de "flammes" texturées (sprites de nuage générés en code) qui
//   refroidissent avec l'âge : blanc → jaune → orange → rouge sombre.
// - Fumée : volutes sombres, plus lentes, qui montent (convection) et
//   finissent par envahir l'écran. Une couche derrière le feu, une devant.
// - Étincelles avec flou de mouvement, débris en rotation, braises flottantes.
// - Onde de choc, éclair initial, lumière de l'incendie et tremblement caméra
//   ("trauma" qui décroît) renvoyé via onFrame pour bouger la scène DOM.
// =============================================================================

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// --- Génération de textures -------------------------------------------------

// Texture de volute : boules ombrées (lumière en haut à gauche) qui se
// chevauchent, façon "chou-fleur". En niveaux de gris : la couleur est
// appliquée ensuite par multiplication, ce qui garde le relief.
function makePuffSprite(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const r = size / 2;

  const blobs = [];
  for (let i = 0; i < 36; i++) {
    const ang = Math.random() * TAU;
    const dist = Math.pow(Math.random(), 1.3) * r * 0.48;
    blobs.push({
      x: r + Math.cos(ang) * dist,
      y: r + Math.sin(ang) * dist,
      br: rand(0.12, 0.3) * size,
      lum: rand(0.62, 1)
    });
  }
  // les plus gros d'abord, les petits par-dessus (détails)
  blobs.sort((a, b) => b.br - a.br);
  for (const b of blobs) {
    const hx = b.x - b.br * 0.35;
    const hy = b.y - b.br * 0.4;
    const grad = g.createRadialGradient(hx, hy, b.br * 0.05, b.x, b.y, b.br);
    const L = Math.round(255 * b.lum);
    const M = Math.round(255 * b.lum * 0.85);
    const D = Math.round(255 * b.lum * 0.66);
    grad.addColorStop(0, `rgba(${L},${L},${L},1)`);
    grad.addColorStop(0.6, `rgba(${M},${M},${M},1)`);
    grad.addColorStop(0.84, `rgba(${D},${D},${D},0.55)`);
    grad.addColorStop(1, `rgba(${D},${D},${D},0)`);
    g.fillStyle = grad;
    g.beginPath();
    g.arc(b.x, b.y, b.br, 0, TAU);
    g.fill();
  }

  // Bord extérieur adouci (pas de cercle net)
  g.globalCompositeOperation = 'destination-in';
  const m = g.createRadialGradient(r, r, r * 0.45, r, r, r);
  m.addColorStop(0, 'rgba(0,0,0,1)');
  m.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = m;
  g.fillRect(0, 0, size, size);
  return c;
}

function tintSprite(sprite, color) {
  const c = document.createElement('canvas');
  c.width = sprite.width;
  c.height = sprite.height;
  const g = c.getContext('2d');
  g.drawImage(sprite, 0, 0);
  // multiplication : garde l'ombrage du gris
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  // on récupère la forme (alpha) d'origine
  g.globalCompositeOperation = 'destination-in';
  g.drawImage(sprite, 0, 0);
  return c;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function buildRamp(stops, steps) {
  const rgb = stops.map(hexToRgb);
  const out = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / (steps - 1)) * (rgb.length - 1);
    const k = Math.min(rgb.length - 2, Math.floor(t));
    const f = t - k;
    const c = rgb[k].map((v, j) => Math.round(v + (rgb[k + 1][j] - v) * f));
    out.push(`rgb(${c[0]},${c[1]},${c[2]})`);
  }
  return out;
}

// Température du feu (du plus chaud au plus froid)
const FIRE_STOPS = ['#fffaf0', '#ffe9a8', '#ffc25c', '#ff8a24', '#e8501a', '#a3290f', '#4a160b'];
// Fumée : éclairée par le feu au début, puis grise et froide
const SMOKE_STOPS = ['#a5602f', '#5e4637', '#423c38', '#373535', '#2f3135'];
const FIRE_STEPS = 14;
const SMOKE_STEPS = 8;

let cachedTextures = null;
function getTextures() {
  if (cachedTextures) return cachedTextures;
  const variants = [makePuffSprite(224), makePuffSprite(224), makePuffSprite(224), makePuffSprite(224)];
  const fireRamp = buildRamp(FIRE_STOPS, FIRE_STEPS);
  const smokeRamp = buildRamp(SMOKE_STOPS, SMOKE_STEPS);
  cachedTextures = {
    fire: variants.map((v) => fireRamp.map((col) => tintSprite(v, col))),
    smoke: variants.map((v) => smokeRamp.map((col) => tintSprite(v, col)))
  };
  return cachedTextures;
}

// Pré-calcul optionnel (à appeler avant l'impact pour éviter un à-coup)
export function warmUpExplosion() {
  try {
    getTextures();
  } catch {
    // canvas indisponible : on ignore
  }
}

// --- Moteur ------------------------------------------------------------------

/**
 * @param {HTMLCanvasElement} canvas
 * @param {object} opts
 * @param {number} [opts.x] centre de l'impact (px, coordonnées viewport)
 * @param {number} [opts.y]
 * @param {(state: {elapsed:number, shakeX:number, shakeY:number, shakeRot:number}) => void} [opts.onFrame]
 * @param {() => void} [opts.onComplete]
 * @returns {() => void} stop
 */
export function startRealisticExplosion(canvas, opts = {}) {
  if (!canvas) return () => {};
  // Compatibilité avec l'ancienne signature (canvas, onPeak, onComplete)
  if (typeof opts === 'function') opts = {};

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  const width = canvas.clientWidth || window.innerWidth;
  const height = canvas.clientHeight || window.innerHeight;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cx = opts.x ?? width / 2;
  const cy = opts.y ?? height / 2;
  // échelle écran (plancher pour que l'explosion reste imposante sur téléphone)
  const S = Math.max(Math.min(width, height), 560) / 800;
  const diag = Math.hypot(width, height);
  const tex = getTextures();

  // --- Particules ---
  const fire = [];
  const smokeBack = [];
  const smokeFront = [];
  const sparks = [];
  const debris = [];
  const embers = [];

  function spawnFireBurst(ox, oy, count, power, delayMax, sizeMul = 1) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU;
      // vitesses étalées (certaines quasi nulles) : le cœur reste plein, pas de "donut"
      const sp = (0.06 + 0.94 * Math.pow(Math.random(), 0.85)) * power * S;
      fire.push({
        x: ox + Math.cos(a) * rand(0, 18) * S,
        y: oy + Math.sin(a) * rand(0, 18) * S,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp * 0.82 - rand(20, 90) * S,
        s0: rand(50, 95) * S * sizeMul,
        s1: rand(210, 380) * S * sizeMul,
        age: -rand(0, delayMax),
        life: rand(1.0, 1.85),
        rot: Math.random() * TAU,
        vr: rand(-1.2, 1.2),
        v: (Math.random() * 4) | 0,
        heat: rand(0, 0.12) // certaines boules démarrent un peu moins chaudes
      });
    }
  }

  function spawnSmoke(list, count, power, delayMin, delayMax, sizeMul, alphaMul) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU;
      const sp = rand(0.2, 1) * power * S;
      list.push({
        x: cx + Math.cos(a) * rand(0, 60) * S,
        y: cy + Math.sin(a) * rand(0, 50) * S,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp * 0.7 - rand(30, 110) * S,
        s0: rand(100, 170) * S * sizeMul,
        s1: rand(440, 720) * S * sizeMul,
        age: -rand(delayMin, delayMax),
        life: rand(3.0, 4.6),
        rot: Math.random() * TAU,
        vr: rand(-0.35, 0.35),
        v: (Math.random() * 4) | 0,
        a: rand(0.55, 0.9) * alphaMul
      });
    }
  }

  function spawnSparks(ox, oy, count, power, delayMax) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU;
      const sp = rand(0.3, 1) * power * S;
      sparks.push({
        x: ox,
        y: oy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - rand(0, 250) * S,
        age: -rand(0, delayMax),
        life: rand(0.5, 1.35),
        w: rand(1.2, 3.2) * Math.max(0.8, S)
      });
    }
  }

  // Boule principale + lobes secondaires (une vraie explosion n'est pas ronde)
  spawnFireBurst(cx, cy, 58, 700, 0.1, 1.05);
  for (let k = 0; k < 4; k++) {
    const a = rand(0, TAU);
    const d = rand(60, 170) * S;
    spawnFireBurst(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7 - 40 * S, 12, 420, 0.06, 0.85);
    fire.slice(-10).forEach((p) => (p.age -= rand(0.06, 0.2)));
  }
  spawnSmoke(smokeBack, 42, 360, 0.04, 0.5, 1, 1);
  // la fumée avant arrive quand le feu refroidit et l'avale
  spawnSmoke(smokeFront, 28, 260, 0.6, 1.25, 1.05, 0.9);
  spawnSparks(cx, cy, 150, 2300, 0.05);
  spawnSparks(cx, cy, 40, 1300, 0.25);

  for (let i = 0; i < 34; i++) {
    const a = Math.random() * TAU;
    const sp = rand(350, 1500) * S;
    const n = 3 + ((Math.random() * 3) | 0);
    const pts = [];
    for (let k = 0; k < n; k++) {
      const pa = (k / n) * TAU + rand(-0.4, 0.4);
      const pr = rand(0.5, 1);
      pts.push([Math.cos(pa) * pr, Math.sin(pa) * pr]);
    }
    debris.push({
      x: cx,
      y: cy,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - rand(150, 500) * S,
      size: rand(4, 13) * S,
      rot: Math.random() * TAU,
      vr: rand(-14, 14),
      age: 0,
      life: rand(1.2, 2.2),
      pts,
      burning: Math.random() < 0.45
    });
  }

  for (let i = 0; i < 55; i++) {
    const a = Math.random() * TAU;
    const d = rand(0, 220) * S;
    embers.push({
      x: cx + Math.cos(a) * d,
      y: cy + Math.sin(a) * d * 0.7,
      vx: rand(-40, 40) * S,
      vy: rand(-140, -30) * S,
      age: -rand(0.25, 1.4),
      life: rand(1.6, 3.4),
      r: rand(0.8, 1.9) * Math.max(0.8, S),
      ph: Math.random() * TAU
    });
  }

  // Ondes de choc (rapide et lumineuse, puis lente et poussiéreuse)
  const shocks = [
    { delay: 0, speed: 5.5, reach: diag * 0.95, life: 0.55, w: 22, light: true },
    { delay: 0.05, speed: 3.2, reach: diag * 0.7, life: 0.9, w: 60, light: false }
  ];

  // --- Boucle ---
  let raf = 0;
  let last = performance.now();
  let elapsed = 0;
  let stopped = false;
  let trauma = 1;
  const DURATION = 4.4;

  function drawPuff(sprite, x, y, size, rot, alpha) {
    if (alpha <= 0.002 || size <= 1) return;
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function updateSmoke(list, dt) {
    for (const p of list) {
      p.age += dt;
      if (p.age < 0 || p.age > p.life) continue;
      const drag = Math.exp(-2.1 * dt);
      p.vx *= drag;
      p.vy = p.vy * drag - 90 * S * dt; // convection
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
  }

  function drawSmoke(list) {
    ctx.globalCompositeOperation = 'source-over';
    for (const p of list) {
      if (p.age < 0 || p.age > p.life) continue;
      const t = p.age / p.life;
      const size = p.s0 + (p.s1 - p.s0) * (1 - Math.pow(1 - t, 2.4));
      const fadeIn = clamp01(p.age / 0.35);
      const alpha = p.a * fadeIn * Math.pow(1 - t, 1.25);
      const idx = Math.min(SMOKE_STEPS - 1, Math.floor(Math.pow(clamp01(p.age / 1.6), 0.7) * (SMOKE_STEPS - 1)));
      drawPuff(tex.smoke[p.v][idx], p.x, p.y, size, p.rot, alpha);
    }
  }

  function frame(now) {
    if (stopped) return;
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    elapsed += dt;
    trauma = Math.max(0, trauma - dt * 1.35);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, width, height);

    // 1. Lumière de l'incendie sur la scène
    const glow = Math.exp(-elapsed * 1.6);
    if (glow > 0.01) {
      ctx.globalCompositeOperation = 'lighter';
      const R = diag * 0.75;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      g.addColorStop(0, `rgba(255,170,80,${0.42 * glow})`);
      g.addColorStop(0.35, `rgba(255,110,40,${0.16 * glow})`);
      g.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Fumée arrière
    updateSmoke(smokeBack, dt);
    drawSmoke(smokeBack);

    // 3. Ondes de choc : anneau d'air comprimé, bords doux
    for (const s of shocks) {
      const a = elapsed - s.delay;
      if (a < 0 || a > s.life) continue;
      const t = a / s.life;
      const r = s.reach * (1 - Math.exp(-a * s.speed));
      const w = Math.max(6, s.w * S * (1.4 - t * 0.6));
      const alpha = Math.pow(1 - t, 1.8);
      const inner = Math.max(0, r - w);
      const g = ctx.createRadialGradient(cx, cy, inner, cx, cy, r + w);
      const col = s.light ? '255,232,200' : '40,32,28';
      const peak = s.light ? 0.32 * alpha : 0.16 * alpha;
      g.addColorStop(0, `rgba(${col},0)`);
      g.addColorStop(0.5, `rgba(${col},${peak})`);
      g.addColorStop(1, `rgba(${col},0)`);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = s.light ? 'lighter' : 'source-over';
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r + w, 0, TAU);
      ctx.arc(cx, cy, inner, 0, TAU, true);
      ctx.fill();
    }

    // 4. Débris (sombres, avec braise pour certains)
    ctx.globalCompositeOperation = 'source-over';
    for (const d of debris) {
      d.age += dt;
      if (d.age > d.life) continue;
      const drag = Math.exp(-1.1 * dt);
      d.vx *= drag;
      d.vy = d.vy * drag + 1500 * S * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.rot += d.vr * dt;
      const alpha = 1 - Math.pow(d.age / d.life, 3);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = d.burning ? '#2a1a12' : '#151312';
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rot);
      ctx.beginPath();
      d.pts.forEach(([px, py], k) => (k ? ctx.lineTo(px * d.size, py * d.size) : ctx.moveTo(px * d.size, py * d.size)));
      ctx.closePath();
      ctx.fill();
      if (d.burning) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(255,140,40,${0.6 * (1 - d.age / d.life)})`;
        ctx.beginPath();
        ctx.arc(0, 0, d.size * 0.45, 0, TAU);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // 5. Feu (additif)
    ctx.globalCompositeOperation = 'lighter';
    for (const p of fire) {
      p.age += dt;
      if (p.age < 0 || p.age > p.life) continue;
      const drag = Math.exp(-3.4 * dt);
      p.vx *= drag;
      p.vy = p.vy * drag - 300 * S * dt; // l'air chaud monte : panache vers le haut
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      const t = p.age / p.life;
      const size = p.s0 + (p.s1 - p.s0) * (1 - Math.pow(1 - t, 3));
      const cool = clamp01(Math.pow(t, 0.6) + p.heat);
      const idx = Math.min(FIRE_STEPS - 1, Math.floor(cool * (FIRE_STEPS - 1)));
      const fadeIn = clamp01(p.age / 0.05);
      // Flammes chaudes en additif (lumière), flammes refroidies opaques :
      // c'est ce contraste qui donne du relief aux volutes.
      const hot = cool < 0.36;
      ctx.globalCompositeOperation = hot ? 'lighter' : 'source-over';
      const alpha = fadeIn * Math.pow(1 - t, 1.1) * (hot ? 0.55 : 0.72);
      drawPuff(tex.fire[p.v][idx], p.x, p.y, size, p.rot, alpha);
    }

    // 6. Étincelles (traînées = flou de mouvement)
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (const p of sparks) {
      p.age += dt;
      if (p.age < 0 || p.age > p.life) continue;
      const drag = Math.exp(-2.2 * dt);
      p.vx *= drag;
      p.vy = p.vy * drag + 1100 * S * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const t = p.age / p.life;
      const tail = 0.045;
      ctx.globalAlpha = Math.pow(1 - t, 1.2);
      ctx.strokeStyle = t < 0.25 ? '#fffdf5' : t < 0.6 ? '#ffd166' : '#ff7a2a';
      ctx.lineWidth = p.w * (1 - t * 0.6);
      ctx.beginPath();
      ctx.moveTo(p.x - p.vx * tail, p.y - p.vy * tail);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    // 7. Fumée avant (enveloppe le feu)
    updateSmoke(smokeFront, dt);
    drawSmoke(smokeFront);

    // 8. Braises qui flottent
    ctx.globalCompositeOperation = 'lighter';
    for (const e of embers) {
      e.age += dt;
      if (e.age < 0 || e.age > e.life) continue;
      e.vy -= 18 * S * dt;
      e.x += (e.vx + Math.sin(e.age * 3 + e.ph) * 30 * S) * dt;
      e.y += e.vy * dt;
      const t = e.age / e.life;
      const flicker = 0.65 + 0.35 * Math.sin(e.age * 22 + e.ph);
      ctx.globalAlpha = clamp01(e.age / 0.2) * (1 - t) * flicker;
      ctx.fillStyle = '#ff9a3c';
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r * 2.1, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fff0c8';
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, TAU);
      ctx.fill();
    }

    // 9. Éclair initial (cœur blanc qui sature la caméra)
    const flash = elapsed < 0.04 ? 1 : Math.exp(-(elapsed - 0.04) * 9);
    if (flash > 0.01) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 1;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, diag * 0.6);
      g.addColorStop(0, `rgba(255,255,255,${flash})`);
      g.addColorStop(0.25, `rgba(255,236,190,${0.85 * flash})`);
      g.addColorStop(1, `rgba(255,150,60,${0.08 * flash})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // Tremblement caméra : amplitude ∝ trauma²
    if (opts.onFrame) {
      const k = trauma * trauma;
      const t = elapsed * 38;
      opts.onFrame({
        elapsed,
        shakeX: k * 26 * Math.max(0.7, S) * (Math.sin(t * 1.3) + 0.5 * Math.sin(t * 3.1 + 1.7)),
        shakeY: k * 20 * Math.max(0.7, S) * (Math.sin(t * 1.7 + 0.6) + 0.5 * Math.sin(t * 2.9)),
        shakeRot: k * 1.4 * Math.sin(t * 1.1 + 2.1)
      });
    }

    if (elapsed < DURATION) {
      raf = requestAnimationFrame(frame);
    } else {
      stopped = true;
      opts.onComplete?.();
    }
  }

  raf = requestAnimationFrame((t) => {
    last = t;
    frame(t);
  });

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
  };
}
