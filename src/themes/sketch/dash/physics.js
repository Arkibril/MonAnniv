// =============================================================================
// Physique du niveau de Julien (jeu de rythme "cube qui saute", création
// originale). Unités : blocs. y vers le haut, sol à y = 0.
// Pas fixe de 1/240 s. Le joueur avance à vitesse constante : x = SPEED · t,
// donc la position est toujours calée sur la musique.
// Ce fichier n'utilise pas le DOM : le jeu ET le solveur de test s'en servent.
// =============================================================================

export const STEP = 1 / 240;
export const SPEED = 10.5; // blocs / s (4,5 blocs par temps à 140 BPM)
export const GRAVITY = 97; // cube
export const JUMP_V = 20.4; // sommet ≈ 2,15 blocs, 0,42 s en l'air
export const PAD_V = 27; // trampoline jaune : sommet ≈ 3,75 blocs
export const ORB_V = 20.4; // anneau jaune : comme un saut, en plein vol
export const MAX_FALL = 28;
export const SHIP_UP = 52;
export const SHIP_G = 44;
export const SHIP_MAX = 9;
export const SHIP_H = 0.62; // hauteur de la boîte de collision du vaisseau
export const LAND_TOL = 0.2; // tolérance pour atterrir sur un bloc
// rotation du cube en l'air : un saut ≈ un demi-tour
export const SPIN = Math.PI / (2 * JUMP_V / GRAVITY);

const overlap = (a0, a1, b0, b1) => a0 < b1 && a1 > b0;

// Boîte de collision d'un pic (petite, pour être juste)
export function spikeBox(o) {
  if (o.down) return { x0: o.x + 0.32, x1: o.x + 0.68, y0: o.y + 0.48, y1: o.y + 1 };
  return { x0: o.x + 0.32, x1: o.x + 0.68, y0: o.y, y1: o.y + 0.52 };
}

export function createSim(level) {
  const objs = level.objects; // triés par x
  const state = {};

  function reset(cp) {
    state.t = cp ? cp.t : 0;
    state.x = SPEED * state.t;
    state.y = cp ? cp.y : 0;
    state.vy = 0;
    state.mode = cp ? cp.mode : 'cube';
    state.floor = cp ? cp.floor : 0;
    state.ceil = cp ? cp.ceil : Infinity;
    state.grounded = state.mode === 'cube';
    state.dead = false;
    state.won = false;
    state.rot = 0;
    state.used = new Set();
    state.jumps = 0;
    state.lo = 0; // index du premier objet encore utile
    state.events = []; // événements de ce pas (saut, pad, orbe, portail…)
    return state;
  }

  function playerBox() {
    const h = state.mode === 'ship' ? SHIP_H : 1;
    return { x0: state.x - 0.5, x1: state.x + 0.5, y0: state.y, y1: state.y + h, h };
  }

  // Avance d'un pas fixe. holding = bouton maintenu.
  function step(holding) {
    if (state.dead || state.won) return state;
    state.events.length = 0;
    const dt = STEP;
    const prevY = state.y;
    const h = state.mode === 'ship' ? SHIP_H : 1;
    const prevTop = prevY + h;

    state.t += dt;
    state.x = SPEED * state.t;

    if (state.mode === 'cube') {
      if (holding && state.grounded) {
        state.vy = JUMP_V;
        state.grounded = false;
        state.jumps++;
        state.events.push('jump');
      }
      state.vy = Math.max(state.vy - GRAVITY * dt, -MAX_FALL);
      state.y += state.vy * dt;
      if (!state.grounded) state.rot += SPIN * dt;
      if (state.y <= state.floor) {
        if (!state.grounded) state.events.push('land');
        state.y = state.floor;
        state.vy = 0;
        state.grounded = true;
      }
    } else {
      state.vy += (holding ? SHIP_UP : -SHIP_G) * dt;
      state.vy = Math.max(-SHIP_MAX, Math.min(SHIP_MAX, state.vy));
      state.y += state.vy * dt;
      if (state.y <= state.floor) {
        state.y = state.floor;
        state.vy = Math.max(0, state.vy);
      }
      if (state.y + SHIP_H >= state.ceil) {
        state.y = state.ceil - SHIP_H;
        state.vy = Math.min(0, state.vy);
      }
      state.rot = Math.atan2(state.vy, SPEED) * -1;
    }

    // objets proches
    while (state.lo < objs.length && objs[state.lo].x + (objs[state.lo].w || 1) < state.x - 2) state.lo++;
    let supported = state.y <= state.floor + 1e-6;
    const box = playerBox();
    for (let i = state.lo; i < objs.length; i++) {
      const o = objs[i];
      if (o.x > state.x + 1.5) break;
      const w = o.w || 1;
      const hh = o.h || 1;
      if (o.type === 'block') {
        const top = o.y + hh;
        const bottom = o.y;
        if (!overlap(box.x0, box.x1, o.x, o.x + w)) continue;
        // posé dessus ?
        if (state.mode === 'cube' && state.grounded && Math.abs(state.y - top) < 1e-3) {
          supported = true;
          continue;
        }
        if (!overlap(state.y, state.y + box.h, bottom, top)) {
          if (state.mode === 'cube' && Math.abs(state.y - top) < 1e-3) supported = true;
          continue;
        }
        if (prevY >= top - LAND_TOL && state.vy <= 0) {
          if (state.mode === 'cube' && !state.grounded) state.events.push('land');
          state.y = top;
          state.vy = state.mode === 'ship' ? Math.max(0, state.vy) : 0;
          if (state.mode === 'cube') state.grounded = true;
          supported = true;
        } else if (state.mode === 'ship' && prevTop <= bottom + LAND_TOL && state.vy >= 0) {
          state.y = bottom - SHIP_H;
          state.vy = Math.min(0, state.vy);
        } else {
          state.dead = true;
          return state;
        }
      } else if (o.type === 'spike') {
        const sb = spikeBox(o);
        if (overlap(box.x0 + 0.1, box.x1 - 0.1, sb.x0, sb.x1) && overlap(state.y + 0.08, state.y + box.h - 0.08, sb.y0, sb.y1)) {
          state.dead = true;
          return state;
        }
      } else if (o.type === 'pad') {
        if (state.mode === 'cube' && !state.used.has(o) && overlap(box.x0, box.x1, o.x, o.x + 1) && state.y <= o.y + 0.3 && state.y >= o.y - 0.2) {
          state.used.add(o);
          state.vy = PAD_V;
          state.grounded = false;
          state.events.push('pad');
        }
      } else if (o.type === 'orb') {
        if (holding && state.mode === 'cube' && !state.grounded && !state.used.has(o)) {
          const dx = state.x - (o.x + 0.5);
          const dy = state.y + 0.5 - (o.y + 0.5);
          if (dx * dx + dy * dy < 1.1 * 1.1) {
            state.used.add(o);
            state.vy = ORB_V;
            state.events.push('orb');
          }
        }
      } else if (o.type === 'portal') {
        if (!state.used.has(o) && state.x >= o.x + 0.5) {
          state.used.add(o);
          state.mode = o.mode;
          state.floor = o.floor ?? 0;
          state.ceil = o.ceil ?? Infinity;
          state.events.push('portal');
          if (o.mode === 'cube') {
            state.grounded = state.y <= state.floor + 1e-3;
            state.rot = 0;
          } else {
            state.grounded = false;
            state.vy *= 0.5;
          }
        }
      }
    }
    if (state.mode === 'cube' && state.grounded && !supported) state.grounded = false;
    if (state.mode === 'cube' && state.grounded) state.rot = Math.round(state.rot / (Math.PI / 2)) * (Math.PI / 2);

    if (state.x >= level.endX) {
      state.won = true;
      state.events.push('win');
    }
    return state;
  }

  reset();
  return { state, step, reset };
}
