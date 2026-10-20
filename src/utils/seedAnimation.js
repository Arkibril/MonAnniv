// ==============================================================================
// MOTEUR D'ANIMATION DÉTERMINISTE : ÉDITION MINIMALISTE & ÉPURÉE
// Fond blanc pur, particules monochromes noir et nuances de gris
// ==============================================================================

export function hashString(str) {
  let hash = 5381;
  const clean = (str || 'DEFAULT').toUpperCase().trim();
  for (let i = 0; i < clean.length; i++) {
    hash = ((hash << 5) + hash) + clean.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function createRng(seed) {
  let s = seed ? Math.abs(seed) : 123456789;
  return function() {
    let t = (s += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Palettes monochromes et tons purs épurés
export const COLOR_PALETTES = [
  {
    name: 'Noir Pur & Charbon',
    colors: ['#09090b', '#18181b', '#27272a', '#52525b', '#71717a'],
    accent: '#09090b'
  },
  {
    name: 'Éditorial Monolithique',
    colors: ['#000000', '#18181b', '#3f3f46', '#52525b', '#a1a1aa'],
    accent: '#18181b'
  },
  {
    name: 'Ardoise & Gris Épuré',
    colors: ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b'],
    accent: '#0f172a'
  },
  {
    name: 'Zinc Minimaliste',
    colors: ['#18181b', '#27272a', '#3f3f46', '#71717a', '#d4d4d8'],
    accent: '#27272a'
  }
];

export const MOTION_STYLES = [
  { id: 'confetti', name: 'Pluie Géométrique Épurée' },
  { id: 'vortex', name: 'Spirale Cinétique Minimaliste' },
  { id: 'fireflies', name: 'Particules Flottantes Discrètes' },
  { id: 'fireworks', name: 'Éclats Géométriques' }
];

export const SEED_EMOJIS = ['✨', '🖤', '⚡', '🍸', '🎩', '🏛️', '🌟', '🪩', '🥂', '🍾'];

export function getAnimationParams(code) {
  const seed = hashString(code || 'ANNIV');
  const rng = createRng(seed);

  const paletteIndex = Math.floor(rng() * COLOR_PALETTES.length);
  const motionIndex = Math.floor(rng() * MOTION_STYLES.length);
  const mascotEmojiIndex = Math.floor(rng() * SEED_EMOJIS.length);

  const palette = COLOR_PALETTES[paletteIndex];
  const motionStyle = MOTION_STYLES[motionIndex].id;
  const mascotEmoji = SEED_EMOJIS[mascotEmojiIndex];

  const particleCount = 60 + Math.floor(rng() * 40); // 60 à 100 particules nettes
  const baseSpeed = 1.0 + rng() * 1.2;
  const rotationSpeed = 0.02 + rng() * 0.03;

  return {
    seed,
    palette,
    motionStyle,
    mascotEmoji,
    particleCount,
    baseSpeed,
    rotationSpeed
  };
}

export function startDeterministicCanvas(canvas, params, prefersReducedMotion = false) {
  if (!canvas) return () => {};

  const ctx = canvas.getContext('2d');
  let animationFrameId;
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const handleResize = () => {
    if (!canvas) return;
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', handleResize);

  if (prefersReducedMotion) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    return () => window.removeEventListener('resize', handleResize);
  }

  const rng = createRng(params.seed + 999);
  const particles = [];
  const { palette, motionStyle, particleCount, baseSpeed } = params;

  for (let i = 0; i < particleCount; i++) {
    const color = palette.colors[Math.floor(rng() * palette.colors.length)];
    const size = 2.5 + rng() * 5.5;
    const shape = Math.floor(rng() * 3); // 0: cercle, 1: carré géométrique, 2: croix fine

    let x = width * rng();
    let y = height * rng();
    let vx = (rng() - 0.5) * baseSpeed * 2.5;
    let vy = (rng() - 0.5) * baseSpeed * 2.5;
    let angle = rng() * Math.PI * 2;
    let angularSpeed = (rng() - 0.5) * 0.06;

    if (motionStyle === 'fireworks') {
      const burstAngle = rng() * Math.PI * 2;
      const speed = (rng() * 3.5 + 1.5) * baseSpeed;
      x = width / 2;
      y = height / 2;
      vx = Math.cos(burstAngle) * speed;
      vy = Math.sin(burstAngle) * speed;
    } else if (motionStyle === 'confetti') {
      y = -20 - rng() * 100;
      vy = (rng() * 2 + 1.2) * baseSpeed;
      vx = (rng() - 0.5) * 1.2;
    } else if (motionStyle === 'fireflies') {
      vy = -(rng() * 1.0 + 0.4) * baseSpeed;
      vx = (rng() - 0.5) * 0.6;
    }

    particles.push({
      x,
      y,
      vx,
      vy,
      size,
      color,
      shape,
      angle,
      angularSpeed,
      pulse: rng() * Math.PI * 2
    });
  }

  function render() {
    // Fond blanc pur avec effacement progressif
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;

    for (let p of particles) {
      p.pulse += 0.03;
      p.angle += p.angularSpeed;

      if (motionStyle === 'vortex') {
        const dist = Math.hypot(p.x - centerX, p.y - centerY) || 1;
        const currentAngle = Math.atan2(p.y - centerY, p.x - centerX);
        const newAngle = currentAngle + (0.012 * baseSpeed * 100) / Math.max(dist, 40);
        const newDist = (dist - 0.35 * baseSpeed + (width * 0.55)) % (width * 0.55);
        p.x = centerX + Math.cos(newAngle) * newDist;
        p.y = centerY + Math.sin(newAngle) * newDist;
      } else if (motionStyle === 'fireworks') {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.025;
        p.vx *= 0.99;
        if (p.y > height + 40 || p.x < -40 || p.x > width + 40) {
          p.x = centerX;
          p.y = centerY;
          const a = rng() * Math.PI * 2;
          const sp = (rng() * 4 + 1.5) * baseSpeed;
          p.vx = Math.cos(a) * sp;
          p.vy = Math.sin(a) * sp;
        }
      } else if (motionStyle === 'confetti') {
        p.y += p.vy;
        p.x += Math.sin(p.pulse) * 1.2 + p.vx;
        if (p.y > height + 20) {
          p.y = -20;
          p.x = width * rng();
        }
      } else if (motionStyle === 'fireflies') {
        p.y += p.vy;
        p.x += Math.sin(p.pulse * 0.6) * 0.8 + p.vx;
        if (p.y < -20) {
          p.y = height + 20;
          p.x = width * rng();
        }
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.06)';
      ctx.shadowBlur = 3;

      const dynamicSize = p.size;

      if (p.shape === 0) {
        // Cercle épuré
        ctx.beginPath();
        ctx.arc(0, 0, dynamicSize, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 1) {
        // Carré géométrique
        ctx.fillRect(-dynamicSize, -dynamicSize, dynamicSize * 2, dynamicSize * 2);
      } else {
        // Croix fine minimale
        const thickness = Math.max(1, dynamicSize * 0.35);
        ctx.fillRect(-dynamicSize * 1.2, -thickness / 2, dynamicSize * 2.4, thickness);
        ctx.fillRect(-thickness / 2, -dynamicSize * 1.2, thickness, dynamicSize * 2.4);
      }

      ctx.restore();
    }

    animationFrameId = requestAnimationFrame(render);
  }

  render();

  return () => {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', handleResize);
  };
}
