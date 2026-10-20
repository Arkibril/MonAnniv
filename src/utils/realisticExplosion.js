// Moteur d'explosion 100% en code physique photoréaliste HTML5 Canvas (Style Blockbuster / Raze Ultimate)
// Simulation complète sans vidéo : Éclair aveuglant, ondes de choc supersoniques,
// boules de feu incandescents multi-couches, étincelles véloces avec traînées,
// fumée volumétrique convective et shrapnels en rotation physique.

export function startRealisticExplosion(canvas, onPeak, onComplete) {
  if (!canvas) return () => {};

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.scale(dpr, dpr);

  const centerX = width / 2;
  const centerY = height / 2;

  let frameCount = 0;
  let peakTriggered = false;

  // 1. ÉTINCELLES ULTRA-VÉLOCES AVEC TRAÎNÉES LUMINEUSES ET GRAVITÉ
  class Spark {
    constructor() {
      this.x = centerX;
      this.y = centerY;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 32 + 12;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.size = Math.random() * 3.5 + 1.5;
      this.life = 1;
      this.decay = Math.random() * 0.022 + 0.014;
      this.color = Math.random() > 0.4 ? '#ffffff' : Math.random() > 0.5 ? '#ffea00' : '#ff4400';
      this.history = [];
    }
    update() {
      this.history.push({ x: this.x, y: this.y });
      if (this.history.length > 7) this.history.shift();
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.94;
      this.vy *= 0.94;
      this.vy += 0.25; // Légère gravité
      this.life -= this.decay;
    }
    draw() {
      if (this.life <= 0 || this.history.length < 2) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.size;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.history[0].x, this.history[0].y);
      for (let i = 1; i < this.history.length; i++) {
        ctx.lineTo(this.history[i].x, this.history[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  // 2. BOULES DE FEU INCANDESCENTES (DÉGRADÉ RADIAL DU BLANC ÉBLOUISSANT AU ROUGE BRAISE)
  class Fireball {
    constructor() {
      this.x = centerX + (Math.random() - 0.5) * 60;
      this.y = centerY + (Math.random() - 0.5) * 60;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 16 + 4;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - 1.2;
      this.radius = Math.random() * 35 + 25;
      this.maxRadius = this.radius * (Math.random() * 2.2 + 1.8);
      this.life = 1;
      this.decay = Math.random() * 0.026 + 0.016;
      this.hue = Math.random() * 35 + 12; // Orange incandescent à jaune solaire
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.93;
      this.vy *= 0.93;
      this.radius += (this.maxRadius - this.radius) * 0.11;
      this.life -= this.decay;
    }
    draw() {
      if (this.life <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.life);
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
      grad.addColorStop(0, `hsla(${this.hue + 25}, 100%, 98%, ${this.life})`);
      grad.addColorStop(0.3, `hsla(${this.hue}, 100%, 58%, ${this.life * 0.9})`);
      grad.addColorStop(0.65, `hsla(${Math.max(0, this.hue - 15)}, 100%, 45%, ${this.life * 0.5})`);
      grad.addColorStop(1, `hsla(${Math.max(0, this.hue - 20)}, 100%, 25%, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 3. FUMÉE VOLUMÉTRIQUE TURBULENTE SOMBRE (CONVECTION THERMIQUE NATURELLE)
  class Smoke {
    constructor() {
      this.x = centerX + (Math.random() - 0.5) * 80;
      this.y = centerY + (Math.random() - 0.5) * 80;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 11 + 3;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - 2.2; // Forte dérive ascendante (thermique)
      this.radius = Math.random() * 40 + 30;
      this.life = 1;
      this.decay = Math.random() * 0.014 + 0.009;
      this.gray = Math.floor(Math.random() * 30 + 15);
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.95;
      this.vy *= 0.95;
      this.radius += 1.4;
      this.life -= this.decay;
    }
    draw() {
      if (this.life <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.life * 0.7);
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
      grad.addColorStop(0, `rgba(${this.gray}, ${this.gray}, ${this.gray}, 0.9)`);
      grad.addColorStop(0.5, `rgba(${this.gray}, ${this.gray}, ${this.gray}, 0.5)`);
      grad.addColorStop(1, `rgba(${this.gray}, ${this.gray}, ${this.gray}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 4. SHRAPNELS ET ÉCLATS EN ROTATION RAPIDE AVEC GRAVITÉ
  class Shrapnel {
    constructor() {
      this.x = centerX;
      this.y = centerY;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 28 + 8;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.size = Math.random() * 14 + 6;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.5;
      this.life = 1;
      this.decay = Math.random() * 0.018 + 0.012;
      this.color = Math.random() > 0.5 ? '#111111' : '#f97316';
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.45; // Gravité réaliste
      this.vx *= 0.96;
      this.rotation += this.rotSpeed;
      this.life -= this.decay;
    }
    draw() {
      if (this.life <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 0.6);
      ctx.restore();
    }
  }

  // 5. DOUBLE ONDE DE CHOC SUPERSONIQUE
  class Shockwave {
    constructor(speedMult = 1, delay = 0, color = 'rgba(255, 140, 20') {
      this.x = centerX;
      this.y = centerY;
      this.radius = 12;
      this.maxRadius = Math.max(width, height) * 1.35;
      this.lineWidth = 55 * speedMult;
      this.life = 1;
      this.speed = 46 * speedMult;
      this.delay = delay;
      this.color = color;
    }
    update() {
      if (this.delay > 0) {
        this.delay--;
        return;
      }
      this.radius += this.speed;
      this.speed *= 0.96;
      this.life = Math.max(0, 1 - (this.radius / this.maxRadius));
    }
    draw() {
      if (this.delay > 0 || this.life <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.life * 0.9);
      ctx.lineWidth = Math.max(3, this.lineWidth * this.life);
      ctx.strokeStyle = `${this.color}, ${this.life})`;
      ctx.shadowColor = '#ff3300';
      ctx.shadowBlur = 50;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Création d'une salve massive de plus de 400 particules
  const sparks = Array.from({ length: 130 }, () => new Spark());
  const fireballs = Array.from({ length: 110 }, () => new Fireball());
  const smoke = Array.from({ length: 75 }, () => new Smoke());
  const shrapnels = Array.from({ length: 55 }, () => new Shrapnel());
  const shockwaves = [
    new Shockwave(1, 0, 'rgba(255, 230, 160'),
    new Shockwave(0.75, 4, 'rgba(255, 90, 20')
  ];

  let animationFrameId;
  let isDone = false;

  function render() {
    frameCount++;
    ctx.clearRect(0, 0, width, height);

    // Éclair initial incandescent (frames 1 à 6)
    if (frameCount <= 6) {
      const flashAlpha = 1 - frameCount / 6;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const flashGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.8);
      flashGrad.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha * 0.95})`);
      flashGrad.addColorStop(0.3, `rgba(255, 200, 80, ${flashAlpha * 0.7})`);
      flashGrad.addColorStop(1, 'rgba(255, 80, 0, 0)');
      ctx.fillStyle = flashGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // Étape 1 : Fumée et Shrapnels (mode standard)
    ctx.globalCompositeOperation = 'source-over';
    smoke.forEach(s => { s.update(); s.draw(); });
    shrapnels.forEach(d => { d.update(); d.draw(); });

    // Étape 2 : Ondes de choc, Boules de feu et Étincelles (mode 'lighter' pour intensité pure)
    ctx.globalCompositeOperation = 'lighter';
    shockwaves.forEach(sw => { sw.update(); sw.draw(); });
    fireballs.forEach(f => { f.update(); f.draw(); });
    sparks.forEach(sp => { sp.update(); sp.draw(); });

    // Pic de l'explosion déclenché après 18 frames (~300ms)
    if (!peakTriggered && frameCount >= 18) {
      peakTriggered = true;
      if (onPeak) onPeak();
    }

    // Continuité du rendu
    const hasAlive = sparks.some(s => s.life > 0) ||
      fireballs.some(f => f.life > 0) ||
      smoke.some(s => s.life > 0) ||
      shockwaves.some(sw => sw.life > 0);

    if (hasAlive && frameCount < 180) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      if (!isDone && onComplete) {
        isDone = true;
        onComplete();
      }
    }
  }

  render();

  return () => {
    cancelAnimationFrame(animationFrameId);
  };
}
