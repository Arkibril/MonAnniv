// =============================================================================
// Mini-jeu de Romain : "Grappin City" (création originale)
// -----------------------------------------------------------------------------
// Le héros (combinaison turquoise, cape orange, lunettes jaunes) se balance
// d'un crochet à l'autre avec son grappin jusqu'à la fête de Jibril.
// Contrôle : maintenir = s'accrocher au crochet le plus proche devant,
//            relâcher = se lâcher et voler.
// Danger   : barrières laser, mines flottantes, drones "casse-fête" (3 vies).
// Pouvoir  : FOCUS = le temps ralentit, chaque appui tire un éclair sur
//            l'endroit visé (énergie rechargée en ramassant des objets).
// Missions : atteindre la fête, détruire 5 drones, ramasser 10 objets.
// Monde logique : 800 unités de haut, mis à l'échelle de l'écran.
// Indépendant du framerate (pas fixe de 1/120 s).
// =============================================================================

const H = 800;
const GROUND = 770;
const GRAVITY = 1650;
const HOOK_RANGE = 470;
const STEP = 1 / 120;
const TAU = Math.PI * 2;

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const MISSIONS = [
  { id: 'reach', label: 'Atteindre la fête de Jibril' },
  { id: 'kills', label: 'Détruire 5 drones casse-fête', goal: 5 },
  { id: 'cakes', label: 'Ramasser 10 objets de fête', goal: 10 }
];
const MAX_LIVES = 3;
const FOCUS_TIME = 2.8; // secondes réelles
const FOCUS_SPEED = 0.2; // vitesse du monde pendant le FOCUS

function buildLevel() {
  const r = seeded(42);
  const anchors = [];
  let x = 420;
  for (let i = 0; i < 16; i++) {
    anchors.push({ x, y: 150 + r() * 170, ph: r() * TAU });
    x += 300 + r() * 110;
  }
  const finishX = x + 160;
  // Gâteaux et ballons : en bas des arcs de balancement
  const items = [];
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i];
    const b = anchors[i + 1];
    items.push({ x: (a.x + b.x) / 2, y: Math.max(a.y, b.y) + 200 + r() * 90, kind: i % 3, got: false, t: 0 });
    if (i % 2 === 0) items.push({ x: a.x + 40, y: a.y + 330, kind: (i + 1) % 3, got: false, t: 0 });
  }
  // Décor : deux rangées d'immeubles (parallaxe)
  const far = [];
  const near = [];
  for (let bx = -200; bx < finishX + 1600; ) {
    const w = 70 + r() * 90;
    far.push({ x: bx, w, h: 160 + r() * 260, lit: r() });
    bx += w + 6;
  }
  for (let bx = -200; bx < finishX + 1600; ) {
    const w = 90 + r() * 120;
    near.push({ x: bx, w, h: 90 + r() * 200, lit: r() });
    bx += w + 14 + r() * 30;
  }
  const stars = Array.from({ length: 90 }, () => ({ x: r(), y: r() * 0.55, s: 0.5 + r() * 1.6 }));

  // Obstacles : barrières laser (basses ou hautes) et mines flottantes
  const lasers = [];
  const mines = [];
  for (let i = 2; i < anchors.length - 1; i++) {
    const a = anchors[i];
    const b = anchors[i + 1];
    const mx = (a.x + b.x) / 2;
    if (i % 3 === 0) lasers.push({ x: mx + 30, y1: 575, y2: GROUND, ph: r() * TAU });
    else if (i % 3 === 1) lasers.push({ x: mx - 10, y1: -400, y2: 230, ph: r() * TAU });
    if (i % 4 === 2) mines.push({ x: mx - 60, y: Math.max(a.y, b.y) + 150, ph: r() * TAU, alive: true });
  }
  // Ennemis : drones "casse-fête" qui chassent le héros
  const enemies = [];
  for (let i = 1; i < anchors.length; i++) {
    if (i % 2 === 1 || i > anchors.length - 4) {
      enemies.push({ x0: anchors[i].x + 140, y0: 300 + r() * 230, x: anchors[i].x + 140, y: 400, ph: r() * TAU, alive: true, t: 0, chase: 0 });
    }
  }
  return { anchors, items, finishX, far, near, stars, lasers, mines, enemies };
}

const ITEM_EMOJI = ['🎂', '🎈', '🥂'];

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ onScore?:(n:number)=>void, onProgress?:(p:number)=>void, onFail?:()=>void, onWin?:(score:number)=>void,
 *           sfx?: { hook?:()=>void, release?:()=>void, collect?:()=>void, fail?:()=>void, win?:()=>void }, name?: string }} opts
 */
export function createGame(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  const level = buildLevel();
  const sfx = opts.sfx || {};
  let dpr = 1;
  let W = 0; // largeur visible en unités du monde
  let scale = 1;
  let offY = 0; // sur téléphone (portrait), le ciel occupe le haut de l'écran

  const state = {
    mode: 'ready', // ready | play | fail | win
    hero: { x: 150, y: 560, vx: 0, vy: 0, rot: 0 },
    rope: null, // { anchor, len }
    holding: false,
    cam: { x: 0, y: 0 },
    score: 0,
    popups: [],
    trail: [],
    particles: [],
    shake: 0,
    time: 0,
    slowmo: 0,
    lives: MAX_LIVES,
    invuln: 0,
    energy: 1,
    focus: 0,
    shots: [],
    lastShot: 0,
    kills: 0,
    aim: null,
    god: false,
    done: { kills: false, cakes: false },
    banner: null,
    hudKey: ''
  };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    // on garde au moins ~640 unités visibles en largeur pour voir les crochets suivants
    scale = Math.min(canvas.height / H, canvas.width / 640);
    W = canvas.width / scale;
    offY = Math.max(0, canvas.height / scale - H);
  }
  resize();
  window.addEventListener('resize', resize);

  function reset() {
    state.mode = 'ready';
    state.hero = { x: 150, y: 560, vx: 0, vy: 0, rot: 0 };
    state.rope = null;
    state.holding = false;
    state.score = 0;
    state.popups = [];
    state.trail = [];
    state.particles = [];
    state.cam = { x: 0, y: 0 };
    level.items.forEach((it) => {
      it.got = false;
      it.t = 0;
    });
    level.mines.forEach((m) => (m.alive = true));
    level.enemies.forEach((e) => {
      e.alive = true;
      e.x = e.x0;
      e.y = e.y0;
      e.chase = 0;
    });
    state.lives = MAX_LIVES;
    state.invuln = 0;
    state.energy = 1;
    state.focus = 0;
    state.shots = [];
    state.kills = 0;
    state.done = { kills: false, cakes: false };
    state.banner = null;
    state.hudKey = '';
    opts.onScore?.(0);
    opts.onProgress?.(0);
  }

  function popup(text, x, y, color = '#ffd400') {
    state.popups.push({ text, x, y, t: 0, color });
  }

  function burst(x, y, color, n = 14, speed = 380) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const s = speed * (0.3 + Math.random() * 0.7);
      state.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, life: 0.5 + Math.random() * 0.4, color });
    }
  }

  function pickAnchor() {
    const h = state.hero;
    let best = null;
    let bestScore = Infinity;
    for (const a of level.anchors) {
      if (a.x < h.x - 60) continue;
      const d = Math.hypot(a.x - h.x, a.y - h.y);
      if (d > HOOK_RANGE) continue;
      // préférence pour les crochets devant et au-dessus
      const sc = d - (a.x - h.x) * 0.35;
      if (sc < bestScore) {
        bestScore = sc;
        best = a;
      }
    }
    return best;
  }

  function attach() {
    const a = pickAnchor();
    if (!a) return;
    const h = state.hero;
    const len = Math.max(120, Math.min(360, Math.hypot(a.x - h.x, a.y - h.y)));
    state.rope = { anchor: a, len };
    sfx.hook?.();
  }

  function press() {
    if (state.mode === 'ready') {
      state.mode = 'play';
      const h = state.hero;
      h.vx = 560;
      h.vy = -720;
      state.holding = true;
      // on s'accroche dès que le crochet est à portée
      return;
    }
    if (state.mode !== 'play') return;
    state.holding = true;
    if (!state.rope) attach();
  }

  function release() {
    state.holding = false;
    if (state.rope && state.mode === 'play') {
      state.rope = null;
      const h = state.hero;
      const speed = Math.hypot(h.vx, h.vy);
      sfx.release?.();
      if (speed > 900 && h.vy < -150) {
        popup(['WHOOSH !', 'ZOOM !', 'SUPER !'][Math.floor(Math.random() * 3)], h.x, h.y - 60, '#ffffff');
        state.slowmo = 0.22;
      }
    }
  }

  function laserOn(L) {
    return Math.sin(state.time * 1.7 + L.ph) > -0.55;
  }

  function hurt(word) {
    if (state.invuln > 0 || state.god || state.mode !== 'play') return;
    state.lives -= 1;
    state.invuln = 1.8;
    state.shake = 0.4;
    popup(word, state.hero.x, state.hero.y - 70, '#ff5a36');
    sfx.hurt?.();
    if (state.lives <= 0) {
      state.mode = 'fail';
      state.rope = null;
      state.focus = 0;
      burst(state.hero.x, state.hero.y, '#ffffff', 24, 420);
      sfx.fail?.();
      setTimeout(() => opts.onFail?.('vies'), 700);
    }
  }

  function updateEnemies(dt) {
    const h = state.hero;
    for (const e of level.enemies) {
      if (!e.alive) continue;
      e.t += dt;
      const dx = h.x - e.x;
      // il repère le héros quand il approche, puis fonce vers lui
      if (dx > -260 && dx < 520 && state.mode === 'play') e.chase = Math.min(1, e.chase + dt * 0.8);
      const baseX = e.x0 + Math.sin(e.t * 1.2 + e.ph) * 70;
      const baseY = e.y0 + Math.sin(e.t * 2.1 + e.ph) * 55;
      const tx = baseX + (h.x - baseX) * e.chase * 0.42;
      const ty = baseY + (h.y - baseY) * e.chase * 0.42;
      e.x += (tx - e.x) * Math.min(1, dt * 1.6);
      e.y += (ty - e.y) * Math.min(1, dt * 1.6);
    }
  }

  function checkMissions() {
    if (!state.done.kills && state.kills >= 5) {
      state.done.kills = true;
      state.banner = { text: 'MISSION : 5 DRONES DÉTRUITS ✔', t: 0 };
      sfx.mission?.();
    }
    if (!state.done.cakes && state.score >= 10) {
      state.done.cakes = true;
      state.banner = { text: 'MISSION : 10 OBJETS RAMASSÉS ✔', t: 0 };
      sfx.mission?.();
    }
  }

  function emitHud() {
    const key = [state.lives, Math.round(state.energy * 20), state.focus > 0, state.kills, state.score].join('|');
    if (key === state.hudKey) return;
    state.hudKey = key;
    opts.onHud?.({
      lives: state.lives,
      maxLives: MAX_LIVES,
      energy: state.energy,
      focus: state.focus > 0,
      kills: state.kills,
      score: state.score
    });
  }

  function power() {
    if (state.mode !== 'play' || state.focus > 0 || state.energy < 1) return false;
    state.energy = 0;
    state.focus = FOCUS_TIME;
    state.shake = 0.15;
    popup('FOCUS !', state.hero.x, state.hero.y - 80, '#13b5a6');
    sfx.focus?.();
    return true;
  }

  function toWorld(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const px = (clientX - rect.left) * dpr;
    const py = (clientY - rect.top) * dpr;
    return { x: px / scale + state.cam.x, y: py / scale - offY };
  }

  function nearestTarget() {
    const h = state.hero;
    let best = null;
    let bd = 900;
    for (const e of [...level.enemies, ...level.mines]) {
      if (!e.alive) continue;
      const ey = e.y0 !== undefined ? e.y : e.y + Math.sin(state.time * 2 + e.ph) * 10;
      const d = Math.hypot(e.x - h.x, ey - h.y);
      if (d < bd && e.x > h.x - 200) {
        bd = d;
        best = { x: e.x, y: ey };
      }
    }
    return best;
  }

  // Tir : vers un point de l'écran, ou vers la cible la plus proche
  function shoot(clientX, clientY) {
    if (state.mode !== 'play' || state.focus <= 0) return;
    const now = performance.now();
    if (now - state.lastShot < 110) return;
    state.lastShot = now;
    const h = state.hero;
    const target = clientX === undefined ? nearestTarget() : toWorld(clientX, clientY);
    if (!target) return;
    state.aim = target;
    const ox = h.x + 10;
    const oy = h.y - 8;
    const d = Math.hypot(target.x - ox, target.y - oy) || 1;
    state.shots.push({ x: ox, y: oy, vx: ((target.x - ox) / d) * 2600, vy: ((target.y - oy) / d) * 2600, t: 0, px: ox, py: oy });
    burst(ox, oy, '#ffd400', 6, 220);
    sfx.shoot?.();
  }

  function updateShots(dt) {
    for (const b of state.shots) {
      b.px = b.x;
      b.py = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.t += dt;
      for (const e of level.enemies) {
        if (!e.alive || Math.hypot(e.x - b.x, e.y - b.y) > 38) continue;
        e.alive = false;
        b.t = 99;
        state.kills += 1;
        burst(e.x, e.y, '#b06cff', 26, 520);
        burst(e.x, e.y, '#ffd400', 14, 380);
        popup(['POW !', 'BAM !', 'KRAK !', 'ZAP !'][state.kills % 4], e.x, e.y - 30, '#ffd400');
        sfx.boom?.();
      }
      for (const m of level.mines) {
        if (!m.alive) continue;
        const my = m.y + Math.sin(state.time * 2 + m.ph) * 10;
        if (Math.hypot(m.x - b.x, my - b.y) > 34) continue;
        m.alive = false;
        b.t = 99;
        burst(m.x, my, '#ff5a36', 26, 520);
        popup('BOUM !', m.x, my - 30, '#ff5a36');
        sfx.boom?.();
      }
    }
    state.shots = state.shots.filter((b) => b.t < 0.5);
  }

  function stepPhysics(dt) {
    const h = state.hero;
    if (state.mode === 'ready') {
      h.y = 560 + Math.sin(state.time * 3) * 2;
      return;
    }
    if (state.mode !== 'play') return;

    // accroche automatique dès qu'un crochet est à portée pendant l'appui
    if (state.holding && !state.rope) attach();

    h.vy += GRAVITY * dt;
    h.vx *= 1 - 0.05 * dt;

    if (state.rope) {
      const a = state.rope.anchor;
      // élan : petite poussée tangentielle dans le sens du mouvement
      let dx = h.x - a.x;
      let dy = h.y - a.y;
      let d = Math.hypot(dx, dy) || 1;
      const tx = -dy / d;
      const ty = dx / d;
      const vt = h.vx * tx + h.vy * ty;
      const push = 520 * Math.sign(vt || 1) * dt;
      h.vx += tx * push;
      h.vy += ty * push;
      // la corde raccourcit doucement (on remonte)
      state.rope.len = Math.max(120, state.rope.len - 40 * dt);
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      // contrainte : distance = longueur de corde (corde tendue)
      dx = h.x - a.x;
      dy = h.y - a.y;
      d = Math.hypot(dx, dy) || 1;
      if (d > state.rope.len) {
        const nx = dx / d;
        const ny = dy / d;
        h.x = a.x + nx * state.rope.len;
        h.y = a.y + ny * state.rope.len;
        const vr = h.vx * nx + h.vy * ny;
        if (vr > 0) {
          h.vx -= vr * nx;
          h.vy -= vr * ny;
        }
      }
    } else {
      h.x += h.vx * dt;
      h.y += h.vy * dt;
    }

    // vitesse max raisonnable
    const sp = Math.hypot(h.vx, h.vy);
    if (sp > 1500) {
      h.vx *= 1500 / sp;
      h.vy *= 1500 / sp;
    }
    if (h.y < 40) {
      h.y = 40;
      h.vy = Math.abs(h.vy) * 0.3;
    }

    h.rot += (Math.atan2(h.vy, Math.max(80, Math.abs(h.vx))) * 0.6 - h.rot) * Math.min(1, dt * 8);

    // objets
    for (const it of level.items) {
      if (it.got) continue;
      if (Math.hypot(it.x - h.x, it.y - h.y) < 48) {
        it.got = true;
        state.score += 1;
        state.energy = Math.min(1, state.energy + 0.34);
        opts.onScore?.(state.score);
        popup('+1 ' + ITEM_EMOJI[it.kind], it.x, it.y - 30);
        burst(it.x, it.y, '#ffd400', 12, 300);
        sfx.collect?.();
      }
    }

    // dangers
    for (const L of level.lasers) {
      if (laserOn(L) && Math.abs(h.x - L.x) < 14 && h.y > L.y1 && h.y < L.y2) hurt('ZZZT !');
    }
    for (const m of level.mines) {
      if (!m.alive) continue;
      const my = m.y + Math.sin(state.time * 2 + m.ph) * 10;
      if (Math.hypot(m.x - h.x, my - h.y) < 40) {
        m.alive = false;
        burst(m.x, my, '#ff5a36', 26, 520);
        hurt('BOUM !');
      }
    }
    for (const e of level.enemies) {
      if (!e.alive) continue;
      if (Math.hypot(e.x - h.x, e.y - h.y) < 44) {
        e.alive = false;
        burst(e.x, e.y, '#b06cff', 20, 420);
        hurt('AÏE !');
      }
    }
    if (state.mode !== 'play') return;

    opts.onProgress?.(Math.max(0, Math.min(1, (h.x - 150) / (level.finishX - 150))));

    // arrivée
    if (h.x >= level.finishX) {
      state.mode = 'win';
      state.rope = null;
      h.x = level.finishX + 120;
      h.y = 470 - 45;
      h.vx = 0;
      h.vy = 0;
      h.rot = 0;
      burst(h.x, h.y, '#ffd400', 40, 600);
      burst(h.x, h.y, '#19c3b3', 30, 500);
      popup('BRAVO !', h.x, h.y - 80, '#ffd400');
      state.shake = 0.5;
      sfx.win?.();
      const stars = 1 + (state.kills >= 5 ? 1 : 0) + (state.score >= 10 ? 1 : 0);
      setTimeout(() => opts.onWin?.({ score: state.score, kills: state.kills, lives: state.lives, stars }), 900);
      return;
    }
    // chute
    if (h.y > GROUND - 20) {
      state.mode = 'fail';
      state.rope = null;
      h.y = GROUND - 20;
      burst(h.x, h.y, '#ffffff', 20, 400);
      popup('OUPS !', h.x, h.y - 90, '#ff5a36');
      state.shake = 0.45;
      sfx.fail?.();
      setTimeout(() => opts.onFail?.('chute'), 700);
    }
  }

  function update(dt) {
    const realDt = dt;
    // FOCUS : le monde ralentit fortement, les tirs restent à vitesse réelle
    if (state.focus > 0) {
      state.focus = Math.max(0, state.focus - realDt);
      if (state.focus === 0) sfx.focusOut?.();
      dt *= FOCUS_SPEED;
    } else if (state.slowmo > 0) {
      state.slowmo -= dt;
      dt *= 0.45;
    }
    state.time += dt;
    state.invuln = Math.max(0, state.invuln - realDt);
    updateEnemies(dt);
    updateShots(realDt);
    checkMissions();
    if (state.banner) {
      state.banner.t += realDt;
      if (state.banner.t > 2.2) state.banner = null;
    }
    emitHud();
    let acc = dt;
    while (acc > 0) {
      const s = Math.min(STEP, acc);
      stepPhysics(s);
      acc -= s;
    }
    const h = state.hero;
    // traînée
    if (state.mode === 'play') {
      state.trail.push({ x: h.x, y: h.y });
      if (state.trail.length > 18) state.trail.shift();
    }
    // caméra
    const targetX = h.x - W * 0.34;
    state.cam.x += (targetX - state.cam.x) * Math.min(1, dt * 6);
    state.cam.y = 0;
    state.shake = Math.max(0, state.shake - dt);
    state.popups.forEach((p) => (p.t += dt));
    state.popups = state.popups.filter((p) => p.t < 1.1);
    state.particles.forEach((p) => {
      p.t += dt;
      p.vy += 900 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    });
    state.particles = state.particles.filter((p) => p.t < p.life);
    level.items.forEach((it) => (it.t += dt));
  }

  // ---------------------------------------------------------------- Dessin
  function drawBackground() {
    const g = ctx.createLinearGradient(0, -offY, 0, H);
    g.addColorStop(0, '#1b1446');
    g.addColorStop(0.55, '#3d1f6e');
    g.addColorStop(1, '#ff7a59');
    ctx.fillStyle = g;
    ctx.fillRect(0, -offY, W, H + offY);
    // étoiles
    ctx.fillStyle = '#fff';
    for (const s of level.stars) {
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(state.time * 2 + s.x * 40);
      ctx.fillRect(s.x * W, s.y * (H + offY) - offY, s.s, s.s);
    }
    ctx.globalAlpha = 1;
    // lune
    ctx.fillStyle = '#ffe9b0';
    ctx.beginPath();
    ctx.arc(W * 0.8, 130, 54, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,233,176,0.18)';
    ctx.beginPath();
    ctx.arc(W * 0.8, 130, 90, 0, TAU);
    ctx.fill();
  }

  function drawCity(list, parallax, color, winColor, base) {
    const ox = -state.cam.x * parallax;
    for (const b of list) {
      const x = b.x + ox;
      if (x + b.w < -50 || x > W + 50) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x, base - b.h, b.w, b.h + 40);
      ctx.fillStyle = winColor;
      for (let wy = base - b.h + 14; wy < base - 10; wy += 22) {
        for (let wx = x + 10; wx < x + b.w - 10; wx += 18) {
          if (((wx * 13 + wy * 7) | 0) % 5 < 2 * b.lit) ctx.fillRect(wx, wy, 7, 10);
        }
      }
    }
  }

  // Visage de Romain (photo découpée) : grosse tête façon pub de jeu mobile
  const face = new Image();
  let faceReady = false;
  face.onload = () => (faceReady = true);
  face.src = opts.faceSrc || '/romain/visage.png';

  function drawHero(h) {
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.rot);
    const flap = Math.sin(state.time * 18) * 6;
    const speed = Math.min(1, Math.hypot(h.vx, h.vy) / 1200);
    // cape orange
    ctx.fillStyle = '#ff6a1a';
    ctx.strokeStyle = '#141018';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-6, -16);
    ctx.quadraticCurveTo(-48, -4 + flap, -62, 20 + flap);
    ctx.lineTo(-18, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // jambes (pantalon noir)
    ctx.strokeStyle = '#141018';
    ctx.lineWidth = 13;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-5, 16);
    ctx.lineTo(-14, 40);
    ctx.moveTo(6, 16);
    ctx.lineTo(17, 38);
    ctx.stroke();
    ctx.strokeStyle = '#2a2730';
    ctx.lineWidth = 8;
    ctx.stroke();
    // polaire beige avec panneaux noirs sur les côtés
    ctx.fillStyle = '#d8d1b4';
    ctx.strokeStyle = '#141018';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 25, 0, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#1d1b22';
    ctx.fillRect(-20, -25, 5, 50);
    ctx.fillRect(15, -25, 5, 50);
    ctx.restore();
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 25, 0, 0, TAU);
    ctx.stroke();
    // col noir + fermeture éclair + chaîne
    ctx.fillStyle = '#1d1b22';
    ctx.beginPath();
    ctx.moveTo(-11, -22);
    ctx.lineTo(0, -12);
    ctx.lineTo(11, -22);
    ctx.lineTo(8, -26);
    ctx.lineTo(-8, -26);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8a8470';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(0, 4);
    ctx.stroke();
    ctx.strokeStyle = '#d9d9d9';
    ctx.beginPath();
    ctx.arc(0, -20, 8, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // emblème de héros : étoile jaune avec un R
    ctx.fillStyle = '#ffd400';
    ctx.strokeStyle = '#141018';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? 3.6 : 8;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      ctx.lineTo(9 + Math.cos(a) * rr, 2 + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#141018';
    ctx.font = 'bold 7px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('R', 9, 3);
    // bras (vers le crochet si accroché), manches beiges
    ctx.strokeStyle = '#141018';
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(8, -12);
    ctx.lineTo(state.rope ? 20 : 24, state.rope ? -32 : -2);
    ctx.stroke();
    ctx.strokeStyle = '#d8d1b4';
    ctx.lineWidth = 7;
    ctx.stroke();
    // cheveux longs châtains qui flottent derrière
    const hx = 2;
    const hy = -42;
    const R = 25;
    ctx.fillStyle = '#5a3a22';
    ctx.strokeStyle = '#141018';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(hx - R * 0.6, hy - R * 0.9);
    ctx.quadraticCurveTo(hx - R - 22 * speed - 8, hy + 4 + flap * 0.6, hx - R - 14 - 26 * speed, hy + R + 6);
    ctx.quadraticCurveTo(hx - R * 0.2, hy + R + 2, hx + R * 0.7, hy + R * 0.6);
    ctx.quadraticCurveTo(hx + R + 4, hy - R * 0.2, hx + R * 0.4, hy - R);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // tête : vraie photo si chargée, sinon dessin
    if (faceReady) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(hx, hy, R, 0, TAU);
      ctx.clip();
      ctx.drawImage(face, hx - R, hy - R, R * 2, R * 2);
      ctx.restore();
      ctx.strokeStyle = '#141018';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(hx, hy, R, 0, TAU);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#f0cfb4';
      ctx.strokeStyle = '#141018';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(hx, hy, R * 0.8, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#6b4a30';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(hx - 6, hy + 8);
      ctx.lineTo(hx + 8, hy + 8);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Pose de victoire : deux "V" avec les mains, comme sur sa photo
  function drawVictory(h) {
    ctx.save();
    ctx.translate(h.x, h.y - 70);
    ctx.font = '34px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    const bob = Math.sin(state.time * 8) * 4;
    ctx.fillText('✌️', -34, bob);
    ctx.fillText('✌️', 40, -bob);
    ctx.restore();
  }

  function drawAnchor(a) {
    const bob = Math.sin(state.time * 2 + a.ph) * 4;
    const y = a.y + bob;
    const inRange = state.mode === 'play' && !state.rope && pickAnchor() === a;
    // mini-drone porteur
    ctx.fillStyle = '#2a2140';
    ctx.strokeStyle = '#141018';
    ctx.lineWidth = 3;
    ctx.fillRect(a.x - 22, y - 34, 44, 10);
    ctx.strokeRect(a.x - 22, y - 34, 44, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    const spin = Math.sin(state.time * 40) * 14;
    ctx.fillRect(a.x - 30 - spin / 2, y - 38, 16 + spin, 3);
    ctx.fillRect(a.x + 14 - spin / 2, y - 38, 16 + spin, 3);
    ctx.strokeStyle = '#141018';
    ctx.beginPath();
    ctx.moveTo(a.x, y - 24);
    ctx.lineTo(a.x, y - 12);
    ctx.stroke();
    // anneau
    ctx.strokeStyle = inRange ? '#ffffff' : '#ffd400';
    ctx.lineWidth = inRange ? 7 : 6;
    ctx.beginPath();
    ctx.arc(a.x, y, 12, 0, TAU);
    ctx.stroke();
    if (inRange) {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(a.x, y, 22 + Math.sin(state.time * 10) * 3, 0, TAU);
      ctx.stroke();
    }
    a.drawY = y;
  }

  function drawFinish() {
    const x = level.finishX;
    // immeuble de la fête
    ctx.fillStyle = '#251a3c';
    ctx.strokeStyle = '#141018';
    ctx.lineWidth = 5;
    ctx.fillRect(x - 40, 470, 380, 400);
    ctx.strokeRect(x - 40, 470, 380, 400);
    ctx.fillStyle = '#ffd400';
    for (let wy = 500; wy < 760; wy += 46) for (let wx = x - 10; wx < x + 320; wx += 50) ctx.fillRect(wx, wy, 22, 28);
    // enseigne
    const glow = 0.75 + 0.25 * Math.sin(state.time * 6);
    ctx.save();
    ctx.shadowColor = '#ff3d8b';
    ctx.shadowBlur = 24 * glow;
    ctx.fillStyle = '#ff3d8b';
    ctx.font = '900 34px Bangers, Impact, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('LA FÊTE DE JIBRIL', x - 20, 452);
    ctx.restore();
    // ballons
    ['#ff3d8b', '#19c3b3', '#ffd400'].forEach((c, i) => {
      const bx = x + 40 + i * 34;
      const by = 380 + Math.sin(state.time * 2 + i) * 8;
      ctx.strokeStyle = '#141018';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, by + 22);
      ctx.lineTo(bx + 4, 470);
      ctx.stroke();
      ctx.fillStyle = c;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(bx, by, 16, 21, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
    });
  }

  function drawLaser(L) {
    const on = laserOn(L);
    const top = Math.max(L.y1, -offY);
    ctx.fillStyle = '#2a2140';
    ctx.strokeStyle = '#141018';
    ctx.lineWidth = 3;
    // bornes émettrices
    [top, L.y2 - 14].forEach((y) => {
      ctx.fillRect(L.x - 12, y, 24, 14);
      ctx.strokeRect(L.x - 12, y, 24, 14);
    });
    if (on) {
      ctx.save();
      ctx.shadowColor = '#ff2a4a';
      ctx.shadowBlur = 18;
      ctx.fillStyle = 'rgba(255,42,74,0.9)';
      ctx.fillRect(L.x - 4, top + 14, 8, L.y2 - top - 28);
      ctx.fillStyle = '#fff';
      ctx.fillRect(L.x - 1.5, top + 14, 3, L.y2 - top - 28);
      ctx.restore();
    } else {
      ctx.strokeStyle = 'rgba(255,42,74,0.35)';
      ctx.setLineDash([6, 10]);
      ctx.beginPath();
      ctx.moveTo(L.x, top + 14);
      ctx.lineTo(L.x, L.y2 - 14);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawMine(m) {
    const y = m.y + Math.sin(state.time * 2 + m.ph) * 10;
    ctx.save();
    ctx.translate(m.x, y);
    ctx.rotate(state.time * 0.8);
    ctx.fillStyle = '#1d1b22';
    ctx.strokeStyle = '#141018';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      ctx.rotate(TAU / 8);
      ctx.beginPath();
      ctx.moveTo(-5, -18);
      ctx.lineTo(0, -30);
      ctx.lineTo(5, -18);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = Math.sin(state.time * 8) > 0 ? '#ff2a4a' : '#7a1020';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawEnemy(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(Math.sin(e.t * 3) * 0.15);
    // hélices
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    const sp = Math.sin(state.time * 45) * 12;
    ctx.fillRect(-34 - sp / 2, -30, 20 + sp, 3);
    ctx.fillRect(14 - sp / 2, -30, 20 + sp, 3);
    ctx.strokeStyle = '#141018';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-24, -28);
    ctx.lineTo(-14, -14);
    ctx.moveTo(24, -28);
    ctx.lineTo(14, -14);
    ctx.stroke();
    // corps violet
    ctx.fillStyle = '#7a3fd1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, TAU);
    ctx.fill();
    ctx.stroke();
    // visière et œil rouge furieux
    ctx.fillStyle = '#141018';
    ctx.beginPath();
    ctx.ellipse(2, -2, 15, 9, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ff2a4a';
    ctx.beginPath();
    ctx.arc(4 - Math.sign(e.x - state.hero.x) * 4, -2, 5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#141018';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-12, -14);
    ctx.lineTo(8, -9);
    ctx.stroke();
    // chapeau de fête volé
    ctx.fillStyle = '#ffd400';
    ctx.beginPath();
    ctx.moveTo(-8, -20);
    ctx.lineTo(0, -40);
    ctx.lineTo(8, -20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    // cible pendant le FOCUS
    if (state.focus > 0) {
      ctx.strokeStyle = '#13b5a6';
      ctx.lineWidth = 3;
      const r = 34 + Math.sin(state.time * 30) * 3;
      ctx.beginPath();
      ctx.arc(e.x, e.y, r, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(e.x - r - 8, e.y);
      ctx.lineTo(e.x - r + 6, e.y);
      ctx.moveTo(e.x + r - 6, e.y);
      ctx.lineTo(e.x + r + 8, e.y);
      ctx.stroke();
    }
  }

  function drawShots() {
    for (const b of state.shots) {
      ctx.save();
      ctx.shadowColor = '#ffd400';
      ctx.shadowBlur = 16;
      ctx.strokeStyle = '#ffd400';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(b.x - b.vx * 0.03, b.y - b.vy * 0.03);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
  }

  // Habillage du FOCUS : teinte, bandes noires façon cinéma, viseur
  function drawFocusOverlay() {
    const vh = H + offY;
    const k = Math.min(1, state.focus / 0.25, (FOCUS_TIME - state.focus) / 0.15 + 0.2);
    ctx.save();
    ctx.globalAlpha = 0.42 * k;
    ctx.fillStyle = '#2a0f5c';
    ctx.fillRect(0, -offY, W, vh);
    ctx.globalAlpha = 1;
    const bar = vh * 0.07 * k;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, -offY, W, bar);
    ctx.fillRect(0, H - bar, W, bar + 10);
    // jauge de temps restant
    ctx.fillStyle = '#13b5a6';
    ctx.fillRect(W * 0.2, -offY + (H + offY) * 0.17 + 40, W * 0.6 * (state.focus / FOCUS_TIME), 6);
    ctx.font = `${Math.round(34)}px Bangers, Impact, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#141018';
    const ty = -offY + (H + offY) * 0.17 + 20;
    ctx.strokeText('FOCUS : TOUCHE LES DRONES !', W / 2, ty, W - 30);
    ctx.fillStyle = '#ffd400';
    ctx.fillText('FOCUS : TOUCHE LES DRONES !', W / 2, ty, W - 30);
    ctx.restore();
  }

  function drawBanner() {
    const b = state.banner;
    const a = b.t < 0.2 ? b.t / 0.2 : b.t > 1.9 ? Math.max(0, 1 - (b.t - 1.9) / 0.3) : 1;
    ctx.save();
    ctx.globalAlpha = a;
    const y = -offY + (H + offY) * 0.24;
    ctx.fillStyle = '#ffd400';
    ctx.strokeStyle = '#141018';
    ctx.lineWidth = 5;
    const w = Math.min(W - 40, 520);
    ctx.fillRect(W / 2 - w / 2, y - 30, w, 54);
    ctx.strokeRect(W / 2 - w / 2, y - 30, w, 54);
    ctx.fillStyle = '#141018';
    ctx.font = '30px Bangers, Impact, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.text, W / 2, y - 2, w - 24);
    ctx.restore();
  }

  function drawComicText(text, x, y, size, color, t) {
    const s = t < 0.15 ? 0.6 + (t / 0.15) * 0.6 : 1.2 - Math.min(0.2, (t - 0.15) * 0.5);
    const alpha = t > 0.8 ? Math.max(0, 1 - (t - 0.8) / 0.3) : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y - t * 40);
    ctx.rotate(-0.08);
    ctx.scale(s, s);
    ctx.font = `${size}px Bangers, Impact, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#141018';
    ctx.strokeText(text, 0, 0);
    ctx.fillStyle = color;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, 0, offY * scale);
    drawBackground();
    drawCity(level.far, 0.25, '#2b1d52', 'rgba(255,214,120,0.35)', 690);
    drawCity(level.near, 0.55, '#1f1538', 'rgba(255,214,120,0.55)', 740);

    const sx = state.shake > 0 ? (Math.random() - 0.5) * 18 * state.shake : 0;
    const sy = state.shake > 0 ? (Math.random() - 0.5) * 18 * state.shake : 0;
    ctx.save();
    ctx.translate(-state.cam.x + sx, sy);

    // immeuble de départ
    ctx.fillStyle = '#251a3c';
    ctx.strokeStyle = '#141018';
    ctx.lineWidth = 5;
    ctx.fillRect(40, 600, 230, 260);
    ctx.strokeRect(40, 600, 230, 260);

    drawFinish();
    for (const a of level.anchors) {
      if (a.x < state.cam.x - 80 || a.x > state.cam.x + W + 80) continue;
      drawAnchor(a);
    }
    const inView = (x) => x > state.cam.x - 100 && x < state.cam.x + W + 100;
    level.lasers.forEach((L) => inView(L.x) && drawLaser(L));
    level.mines.forEach((m) => m.alive && inView(m.x) && drawMine(m));
    level.enemies.forEach((e) => e.alive && inView(e.x) && drawEnemy(e));

    // objets
    ctx.font = '40px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const it of level.items) {
      if (it.got || it.x < state.cam.x - 60 || it.x > state.cam.x + W + 60) continue;
      ctx.fillText(ITEM_EMOJI[it.kind], it.x, it.y + Math.sin(it.t * 3 + it.x) * 6);
    }

    // traînée de vitesse
    const h = state.hero;
    if (state.trail.length > 2) {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      state.trail.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
    }

    // corde du grappin
    if (state.rope) {
      const a = state.rope.anchor;
      ctx.strokeStyle = '#141018';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(h.x + 14, h.y - 26);
      ctx.lineTo(a.x, a.drawY ?? a.y);
      ctx.stroke();
      ctx.strokeStyle = '#e8e2d4';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    if (!(state.invuln > 0 && Math.floor(state.time * 20) % 2)) drawHero(h);
    if (state.mode === 'win') drawVictory(h);
    drawShots();

    // particules
    for (const p of state.particles) {
      ctx.globalAlpha = 1 - p.t / p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const p of state.popups) drawComicText(p.text, p.x, p.y, 44, p.color, p.t);

    // sol
    ctx.restore();
    ctx.fillStyle = '#120c20';
    ctx.fillRect(0, GROUND, W, H - GROUND + 40);
    ctx.fillStyle = 'rgba(255,90,54,0.5)';
    ctx.fillRect(0, GROUND, W, 3);
    if (state.focus > 0) drawFocusOverlay();
    if (state.banner) drawBanner();
  }

  let raf = 0;
  let last = performance.now();
  let running = true;
  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame((t) => {
    last = t;
    loop(t);
  });

  return {
    press,
    release,
    restart: reset,
    power,
    shoot,
    isFocus: () => state.focus > 0,
    setGod: (v) => (state.god = v),
    get mode() {
      return state.mode;
    },
    // pour les tests automatiques
    debug: () => ({ ...state.hero, mode: state.mode, rope: Boolean(state.rope), score: state.score, finishX: level.finishX, lives: state.lives, kills: state.kills, energy: state.energy, focus: state.focus }),
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    }
  };
}
