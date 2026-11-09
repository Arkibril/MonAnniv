// =============================================================================
// Plateau de jeu 3D de Mathilde & Guillaume (three.js, création originale).
// Une table en bois, un plateau rond, un chemin en spirale jusqu'au gâteau,
// deux pions chiens, un dé qui roule vraiment et une caméra qui suit le jeu.
// =============================================================================
import * as THREE from '../../vendor/three.module.js';
import gsap from 'gsap';

export const SQUARES = [
  { kind: 'start', label: 'DÉPART', color: '#fff3bf' },
  { kind: 'plain', color: '#ffc9c9' },
  { kind: 'bone', icon: '🦴', color: '#ffe8a3', text: 'Un os ! Avance de 2 cases.' },
  { kind: 'plain', color: '#d0ebff' },
  { kind: 'bath', icon: '🛁', color: '#c5f6fa', text: 'Le bain… Recule de 2 cases.' },
  { kind: 'plain', color: '#d3f9d8' },
  { kind: 'ball', icon: '🎾', color: '#e5dbff', text: 'Une balle ! Rejoue.' },
  { kind: 'plain', color: '#ffc9c9' },
  { kind: 'bone', icon: '🦴', color: '#ffe8a3', text: 'Encore un os ! Avance de 2 cases.' },
  { kind: 'bath', icon: '🛁', color: '#c5f6fa', text: 'Re-bain… Recule de 2 cases.' },
  { kind: 'plain', color: '#d0ebff' },
  { kind: 'ball', icon: '🎾', color: '#e5dbff', text: 'Encore une balle ! Rejoue.' },
  { kind: 'plain', color: '#d3f9d8' },
  { kind: 'goal', color: '#ffd8a8' }
];
export const LAST = SQUARES.length - 1;

export const DOG_COLORS = [
  { fur: '#f2cf96', ear: '#b9783f', base: '#ff6b6b' },
  { fur: '#7a5536', ear: '#3d2a1c', base: '#4dabf7' }
];

const INK = '#3b2414';

// Chemin en spirale (de l'extérieur vers le gâteau au centre)
function spiral() {
  const pts = [];
  let r = 4.75;
  let a = Math.PI / 2;
  for (let i = 0; i < LAST; i++) {
    pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
    a -= 1.92 / r;
    r -= 0.215;
  }
  pts.push(new THREE.Vector3(0, 0, 0));
  return pts;
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...extra });

// ---------------------------------------------------------------- modèles
function makeDog(colors) {
  const g = new THREE.Group();
  const fur = mat(colors.fur, { roughness: 0.8 });
  const ear = mat(colors.ear, { roughness: 0.8 });
  const dark = mat('#2a1a10', { roughness: 0.3 });
  const white = mat('#ffffff', { roughness: 0.2 });
  // socle du pion
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.58, 0.16, 32), mat(colors.base, { roughness: 0.35 }));
  base.position.y = 0.08;
  g.add(base);
  const body = new THREE.Group();
  body.position.y = 0.16;
  g.add(body);
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 18), fur);
  torso.scale.set(0.9, 0.85, 1.15);
  torso.position.set(0, 0.48, -0.05);
  body.add(torso);
  // pattes
  [[-0.2, 0.22], [0.2, 0.22], [-0.2, -0.3], [0.2, -0.3]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.32, 10), fur);
    leg.position.set(x, 0.16, z);
    body.add(leg);
  });
  // queue
  const tail = new THREE.Group();
  tail.position.set(0, 0.6, -0.5);
  const tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.38, 8), fur);
  tailMesh.position.y = 0.17;
  tail.add(tailMesh);
  tail.rotation.x = -0.6;
  body.add(tail);
  // tête
  const head = new THREE.Group();
  head.position.set(0, 0.92, 0.32);
  body.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 18), fur);
  head.add(skull);
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 12), mat('#fff3e0', { roughness: 0.8 }));
  snout.scale.set(1.15, 0.85, 1);
  snout.position.set(0, -0.08, 0.27);
  head.add(snout);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), dark);
  nose.position.set(0, -0.03, 0.43);
  head.add(nose);
  [-0.13, 0.13].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), dark);
    eye.position.set(x, 0.07, 0.29);
    head.add(eye);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), white);
    shine.position.set(x + 0.02, 0.1, 0.34);
    head.add(shine);
    const earMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), ear);
    earMesh.scale.set(0.55, 1.25, 0.35);
    earMesh.position.set(x * 2.35, -0.02, -0.02);
    earMesh.rotation.z = x > 0 ? 0.35 : -0.35;
    head.add(earMesh);
  });
  const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mat('#ff8fab'));
  tongue.scale.set(1, 0.5, 1.2);
  tongue.position.set(0, -0.19, 0.33);
  head.add(tongue);
  // collier
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 8, 24), mat('#ff3b3b', { roughness: 0.4 }));
  collar.rotation.x = Math.PI / 2 + 0.35;
  collar.position.set(0, 0.74, 0.22);
  body.add(collar);
  const tag = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16), mat('#ffd43b', { metalness: 0.6, roughness: 0.3 }));
  tag.rotation.x = Math.PI / 2;
  tag.position.set(0, 0.6, 0.38);
  body.add(tag);
  g.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  g.userData = { body, head, tail };
  return g;
}

function makeLabel(text, color) {
  const tex = canvasTex(512, 160, (ctx, w, h) => {
    ctx.font = "700 84px 'Fredoka', 'Nunito', system-ui, sans-serif";
    const tw = Math.min(w - 20, ctx.measureText(text).width + 70);
    ctx.fillStyle = '#fff6e5';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 10;
    const x = (w - tw) / 2;
    ctx.beginPath();
    ctx.roundRect(x, 18, tw, h - 36, 60);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + 46, h / 2, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + 76, h / 2 + 4);
  });
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sp.scale.set(1.9, 0.6, 1);
  sp.renderOrder = 10;
  return sp;
}

function makeDie() {
  const faces = [3, 4, 1, 6, 2, 5]; // +X, -X, +Y, -Y, +Z, -Z (faces opposées = 7)
  const PIPS = {
    1: [[0.5, 0.5]],
    2: [[0.27, 0.27], [0.73, 0.73]],
    3: [[0.27, 0.27], [0.5, 0.5], [0.73, 0.73]],
    4: [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]],
    5: [[0.27, 0.27], [0.73, 0.27], [0.5, 0.5], [0.27, 0.73], [0.73, 0.73]],
    6: [[0.27, 0.25], [0.73, 0.25], [0.27, 0.5], [0.73, 0.5], [0.27, 0.75], [0.73, 0.75]]
  };
  const mats = faces.map((v) =>
    mat('#ffffff', {
      roughness: 0.35,
      map: canvasTex(256, 256, (ctx, w) => {
        ctx.fillStyle = '#fffdf8';
        ctx.fillRect(0, 0, w, w);
        ctx.fillStyle = v === 1 ? '#e03131' : INK;
        PIPS[v].forEach(([x, y]) => {
          ctx.beginPath();
          ctx.arc(x * w, y * w, w * (v === 1 ? 0.13 : 0.085), 0, Math.PI * 2);
          ctx.fill();
        });
      })
    })
  );
  const geo = new THREE.BoxGeometry(0.9, 0.9, 0.9, 1, 1, 1);
  const die = new THREE.Mesh(geo, mats);
  die.castShadow = true;
  return die;
}

// rotation qui met la face "v" vers le haut
function faceUp(v) {
  const q = new THREE.Quaternion();
  const X = new THREE.Vector3(1, 0, 0);
  const Z = new THREE.Vector3(0, 0, 1);
  if (v === 6) q.setFromAxisAngle(X, Math.PI);
  else if (v === 2) q.setFromAxisAngle(X, -Math.PI / 2);
  else if (v === 5) q.setFromAxisAngle(X, Math.PI / 2);
  else if (v === 3) q.setFromAxisAngle(Z, Math.PI / 2);
  else if (v === 4) q.setFromAxisAngle(Z, -Math.PI / 2);
  return q;
}

function makeBone() {
  const g = new THREE.Group();
  const m = mat('#fffaf0', { roughness: 0.5 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.56, 12), m);
  shaft.rotation.z = Math.PI / 2;
  g.add(shaft);
  [[-0.3, 0.07], [-0.3, -0.07], [0.3, 0.07], [0.3, -0.07]].forEach(([x, y]) => {
    const k = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), m);
    k.position.set(x, y, 0);
    g.add(k);
  });
  return g;
}
function makeBall() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 18), mat('#c0eb75', { roughness: 0.9 })));
  const seam = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.018, 6, 40), mat('#ffffff'));
  seam.rotation.x = 1.1;
  g.add(seam);
  return g;
}
function makeBath() {
  const g = new THREE.Group();
  const tub = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 0.3, 24, 1, true), mat('#ffffff', { side: THREE.DoubleSide, roughness: 0.25 }));
  g.add(tub);
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.4, 24), mat('#74c0fc', { roughness: 0.1, transparent: true, opacity: 0.9 }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.08;
  g.add(water);
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.06 + Math.random() * 0.05, 10, 8), mat('#ffffff', { transparent: true, opacity: 0.85 }));
    b.position.set((Math.random() - 0.5) * 0.5, 0.14, (Math.random() - 0.5) * 0.5);
    g.add(b);
  }
  return g;
}
function makeCake() {
  const g = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.1, 0.08, 40), mat('#f1f3f5', { roughness: 0.3 }));
  plate.position.y = 0.04;
  g.add(plate);
  const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.5, 40), mat('#ffd8a8'));
  t1.position.y = 0.33;
  g.add(t1);
  const icing1 = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.07, 10, 40), mat('#ff8fab'));
  icing1.rotation.x = Math.PI / 2;
  icing1.position.y = 0.58;
  g.add(icing1);
  const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 40), mat('#fff3bf'));
  t2.position.y = 0.78;
  g.add(t2);
  const icing2 = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.06, 10, 40), mat('#b197fc'));
  icing2.rotation.x = Math.PI / 2;
  icing2.position.y = 0.98;
  g.add(icing2);
  const flames = [];
  [0, 1, 2, 3, 4].forEach((i) => {
    const a = (i / 5) * Math.PI * 2;
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.3, 10), mat(['#74c0fc', '#ff8fab', '#8ce99a', '#ffd43b', '#b197fc'][i]));
    candle.position.set(Math.cos(a) * 0.3, 1.13, Math.sin(a) * 0.3);
    g.add(candle);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffa94d' }));
    flame.scale.set(1, 1.7, 1);
    flame.position.set(candle.position.x, 1.34, candle.position.z);
    g.add(flame);
    flames.push(flame);
  });
  g.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  g.userData.flames = flames;
  return g;
}

// ---------------------------------------------------------------- scène
export function createBoardScene(canvas, { names }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#2d1b10');
  scene.fog = new THREE.Fog('#2d1b10', 22, 46);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);

  // lumières chaudes de salon
  scene.add(new THREE.HemisphereLight('#fff1d6', '#4a2e1a', 1.1));
  const sun = new THREE.DirectionalLight('#ffe0b0', 2.4);
  sun.position.set(6, 14, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
  sun.shadow.bias = -0.0008;
  scene.add(sun);
  const lamp = new THREE.PointLight('#ffb36b', 18, 18, 2);
  lamp.position.set(-5, 5, -3);
  scene.add(lamp);

  // table en bois
  const wood = canvasTex(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#9a5f34';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      const y = Math.random() * h;
      ctx.strokeStyle = `rgba(${Math.random() < 0.5 ? '60,30,12' : '200,140,80'},${0.05 + Math.random() * 0.12})`;
      ctx.lineWidth = 1 + Math.random() * 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 64) ctx.lineTo(x, y + Math.sin(x * 0.01 + i) * 6);
      ctx.stroke();
    }
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = 'rgba(40,20,8,0.35)';
      ctx.fillRect(0, (k + 1) * (h / 6) - 2, w, 4);
    }
  });
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
  wood.repeat.set(3, 3);
  const table = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), mat('#ffffff', { map: wood, roughness: 0.7 }));
  table.rotation.x = -Math.PI / 2;
  table.receiveShadow = true;
  scene.add(table);

  // plateau rond
  const pts = spiral();
  const boardTop = canvasTex(1024, 1024, (ctx, w) => {
    const c = w / 2;
    ctx.fillStyle = '#fff6e5';
    ctx.fillRect(0, 0, w, w);
    // empreintes de pattes
    ctx.fillStyle = 'rgba(201,145,87,0.18)';
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const r = 470;
      const x = c + Math.cos(a) * r;
      const y = c + Math.sin(a) * r;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
      [[-14, -14], [0, -20], [14, -14]].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.arc(x + dx * 0.8, y + dy * 0.8, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#e3c79b';
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = c + (p.z / 6) * c;
      const y = c - (p.x / 6) * c;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.stroke();
    ctx.lineWidth = 10;
    ctx.strokeStyle = INK;
    ctx.beginPath();
    ctx.arc(c, c, c - 8, 0, Math.PI * 2);
    ctx.stroke();
  });
  const board = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.1, 0.4, 96), [
    mat('#c2462f', { roughness: 0.5 }),
    mat('#ffffff', { map: boardTop, roughness: 0.8 }),
    mat('#5c2a1a')
  ]);
  board.position.y = 0.2;
  board.receiveShadow = true;
  board.castShadow = true;
  scene.add(board);
  const top = 0.4;

  // cases
  const tileGeo = new THREE.ExtrudeGeometry(roundedRectShape(1.42, 1.42, 0.26), { depth: 0.14, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2, curveSegments: 6 });
  tileGeo.rotateX(-Math.PI / 2);
  const tileTop = top + 0.18;
  const props = [];
  SQUARES.forEach((sq, i) => {
    const p = pts[i];
    if (sq.kind === 'goal') return;
    const next = pts[Math.min(i + 1, LAST)];
    const prev = pts[Math.max(i - 1, 0)];
    const dir = new THREE.Vector3().subVectors(next, prev);
    const tile = new THREE.Mesh(tileGeo, mat(sq.color, { roughness: 0.45 }));
    tile.position.set(p.x, top, p.z);
    tile.rotation.y = -Math.atan2(dir.z, dir.x);
    tile.castShadow = true;
    tile.receiveShadow = true;
    scene.add(tile);
    const decal = new THREE.Mesh(
      new THREE.PlaneGeometry(1.3, 1.3),
      new THREE.MeshStandardMaterial({
        transparent: true,
        roughness: 0.8,
        map: canvasTex(256, 256, (ctx, w) => {
          ctx.fillStyle = 'rgba(59,36,20,0.55)';
          ctx.font = "700 54px 'Fredoka', 'Nunito', system-ui, sans-serif";
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          if (sq.label) {
            ctx.fillStyle = INK;
            ctx.font = "700 46px 'Fredoka', 'Nunito', system-ui, sans-serif";
            ctx.fillText(sq.label, w / 2, w / 2);
          } else {
            ctx.fillText(String(i), w / 2, w / 2);
          }
        })
      })
    );
    decal.rotation.x = -Math.PI / 2; // chiffres lisibles depuis la caméra
    decal.position.set(p.x, tileTop + 0.002, p.z);
    scene.add(decal);
    let prop = null;
    if (sq.kind === 'bone') prop = makeBone();
    if (sq.kind === 'ball') prop = makeBall();
    if (sq.kind === 'bath') prop = makeBath();
    if (prop) {
      prop.position.set(p.x, tileTop + (sq.kind === 'bath' ? 0.16 : 0.7), p.z);
      prop.traverse((o) => {
        if (o.isMesh) o.castShadow = true;
      });
      scene.add(prop);
      props.push({ prop, kind: sq.kind, base: prop.position.y, i });
    }
  });
  // le gâteau au centre (arrivée)
  const cake = makeCake();
  cake.position.set(0, top, 0);
  scene.add(cake);

  // pions
  const dogs = [0, 1].map((who) => {
    const dog = makeDog(DOG_COLORS[who]);
    dog.userData.label = makeLabel(names[who], DOG_COLORS[who].base);
    scene.add(dog.userData.label);
    scene.add(dog);
    return dog;
  });
  const squarePos = (i, who, together) => {
    const p = pts[i];
    if (i === LAST) return new THREE.Vector3(who ? 0.55 : -0.55, top + 1.12, 0.35);
    const off = together ? (who ? 0.38 : -0.38) : 0;
    const nxt = pts[Math.min(i + 1, LAST)];
    const dir = new THREE.Vector3().subVectors(nxt, p).normalize();
    const side = new THREE.Vector3(-dir.z, 0, dir.x);
    return new THREE.Vector3(p.x + side.x * off, tileTop, p.z + side.z * off);
  };
  const state = { pos: [0, 0] };
  const place = () => {
    const together = state.pos[0] === state.pos[1];
    dogs.forEach((dog, who) => {
      dog.position.copy(squarePos(state.pos[who], who, together));
      faceAlong(dog, state.pos[who]);
    });
  };
  function faceAlong(dog, i) {
    const p = pts[i];
    const nxt = pts[Math.min(i + 1, LAST)];
    if (i >= LAST) {
      dog.rotation.y = 0;
      return;
    }
    dog.rotation.y = Math.atan2(nxt.x - p.x, nxt.z - p.z);
  }
  place();

  // dé
  const die = makeDie();
  die.position.set(3.2, -2, 6.8); // caché sous la table au début
  scene.add(die);

  // confettis / éclaboussures
  const bits = [];
  const bitGeo = new THREE.PlaneGeometry(0.14, 0.09);
  function burst(origin, colors, n, speed = 4, kind = 'confetti') {
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(kind === 'splash' ? new THREE.SphereGeometry(0.06, 8, 6) : bitGeo, new THREE.MeshStandardMaterial({ color: colors[i % colors.length], side: THREE.DoubleSide, roughness: 0.6 }));
      m.position.copy(origin);
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.8);
      m.userData.v = new THREE.Vector3(Math.cos(a) * s * 0.5, s * (0.8 + Math.random() * 0.6), Math.sin(a) * s * 0.5);
      m.userData.spin = new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8);
      m.userData.life = 2.6;
      scene.add(m);
      bits.push(m);
    }
  }

  // ------------------------------------------------------------ caméra
  const cam = { mode: 'overview', look: new THREE.Vector3(0, 0.6, 0.6), focus: new THREE.Vector3() };
  function overview() {
    const aspect = camera.aspect;
    // recule la caméra en vertical pour que le plateau tienne en largeur
    const dist = aspect < 1 ? 13 + (1 - aspect) * 15 : 13;
    // la cible est un peu devant le centre : le plateau remonte et laisse la place aux boutons
    return { pos: new THREE.Vector3(0, dist * 0.92, dist * 0.78 + (aspect < 1 ? 0 : 1.6)), look: new THREE.Vector3(0, 0.4, aspect < 1 ? 1.4 : 2.4) };
  }
  let followTarget = null;

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < h ? 55 : 45;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);
  const ov = overview();
  camera.position.copy(ov.pos).add(new THREE.Vector3(0, 6, 6));
  camera.lookAt(ov.look);

  // ------------------------------------------------------------ boucle
  const clock = new THREE.Clock();
  let raf = 0;
  let active = 0;
  function frame() {
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;
    // caméra
    let wantPos;
    let wantLook;
    if (cam.mode === 'follow' && followTarget) {
      const target = followTarget.position;
      const fromCenter = new THREE.Vector3(target.x, 0, target.z);
      const out = fromCenter.length() > 0.5 ? fromCenter.clone().normalize() : new THREE.Vector3(0, 0, 1);
      // un peu en retrait, côté extérieur du plateau, pour voir le chien et la suite du chemin
      wantPos = new THREE.Vector3(target.x + out.x * 4.5, 8.5, target.z + out.z * 4.5 + 5.5);
      wantLook = new THREE.Vector3(target.x, target.y + 0.6, target.z);
    } else if (cam.mode === 'die') {
      wantPos = new THREE.Vector3(die.position.x * 0.6, 7.5, die.position.z + 6.5);
      wantLook = die.position.clone();
    } else {
      const o = overview();
      wantPos = o.pos;
      wantLook = o.look;
    }
    const k = 1 - Math.exp(-dt * 2.6);
    camera.position.lerp(wantPos, k);
    cam.look.lerp(wantLook, k);
    camera.lookAt(cam.look);

    // vie des chiens : respiration, queue qui remue
    dogs.forEach((dog, who) => {
      const { body, tail, head } = dog.userData;
      body.scale.y = 1 + Math.sin(t * 3 + who) * 0.025;
      tail.rotation.z = Math.sin(t * (who === active ? 14 : 6) + who) * 0.6;
      head.rotation.z = Math.sin(t * 1.3 + who * 2) * 0.06;
      const label = dog.userData.label;
      const stacked = state.pos[0] === state.pos[1] && who === 1 ? 0.62 : 0;
      label.position.set(dog.position.x, dog.position.y + 2.05 + stacked, dog.position.z);
      label.material.opacity = who === active ? 1 : 0.75;
      label.scale.set(who === active ? 2.05 : 1.75, who === active ? 0.65 : 0.55, 1);
    });
    // accessoires qui flottent
    props.forEach(({ prop, kind, base }, i) => {
      if (kind === 'bath') return;
      prop.rotation.y = t * 1.2 + i;
      prop.position.y = base + Math.sin(t * 2 + i) * 0.08;
    });
    cake.userData.flames.forEach((f, i) => {
      f.scale.y = 1.6 + Math.sin(t * 18 + i * 2) * 0.35;
    });
    // confettis
    for (let i = bits.length - 1; i >= 0; i--) {
      const m = bits[i];
      m.userData.v.y -= 9 * dt;
      m.position.addScaledVector(m.userData.v, dt);
      m.rotation.x += m.userData.spin.x * dt;
      m.rotation.y += m.userData.spin.y * dt;
      m.userData.life -= dt;
      if (m.position.y < top + 0.05 && m.userData.v.y < 0) {
        m.position.y = top + 0.05;
        m.userData.v.set(0, 0, 0);
        m.userData.spin.set(0, 0, 0);
      }
      if (m.userData.life <= 0) {
        scene.remove(m);
        m.material.dispose();
        bits.splice(i, 1);
      }
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  // ------------------------------------------------------------ actions
  const api = {
    setActive(who) {
      active = who;
    },
    // lance le dé : il roule, rebondit et s'arrête sur "value"
    rollDie(value, onHit) {
      cam.mode = 'die';
      const from = new THREE.Vector3(-4 + Math.random() * 8, 4.5, 8.5);
      const to = new THREE.Vector3(-1.5 + Math.random() * 3, top + 0.45, 6.6 + Math.random() * 0.6);
      // le dé atterrit sur la table, devant le plateau
      to.y = 0.45;
      const q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6));
      const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2);
      const q1 = yaw.multiply(faceUp(value));
      const axis = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      const p = { t: 0 };
      die.position.copy(from);
      const hits = [0.42, 0.7, 0.86];
      let nextHit = 0;
      return new Promise((resolve) => {
        gsap.to(p, {
          t: 1,
          duration: 1.35,
          ease: 'none',
          onUpdate: () => {
            const tt = p.t;
            die.position.x = from.x + (to.x - from.x) * Math.min(1, tt * 1.15);
            die.position.z = from.z + (to.z - from.z) * Math.min(1, tt * 1.15);
            // un grand arc puis deux petits rebonds
            let y;
            if (tt < 0.42) y = to.y + (from.y - to.y) * (1 - Math.pow(tt / 0.42, 2));
            else if (tt < 0.7) {
              const u = (tt - 0.42) / 0.28;
              y = to.y + 1.1 * 4 * u * (1 - u);
            } else if (tt < 0.86) {
              const u = (tt - 0.7) / 0.16;
              y = to.y + 0.35 * 4 * u * (1 - u);
            } else y = to.y;
            die.position.y = y;
            if (nextHit < hits.length && tt >= hits[nextHit]) {
              onHit?.(1 - nextHit * 0.3);
              nextHit++;
            }
            const spin = new THREE.Quaternion().setFromAxisAngle(axis, (1 - tt) * 16);
            const tumbling = q0.clone().multiply(spin);
            const settle = Math.max(0, (tt - 0.62) / 0.38);
            die.quaternion.copy(tumbling).slerp(q1, Math.min(1, settle * settle * (3 - 2 * settle)));
          },
          onComplete: () => {
            die.quaternion.copy(q1);
            setTimeout(resolve, 380);
          }
        });
      });
    },
    // fait avancer (ou reculer) un chien case par case, en sautant
    async move(who, steps, onHop) {
      const dog = dogs[who];
      followTarget = dog;
      cam.mode = 'follow';
      const dir = steps > 0 ? 1 : -1;
      for (let k = 0; k < Math.abs(steps); k++) {
        const from = state.pos[who];
        const to = Math.max(0, Math.min(LAST, from + dir));
        if (to === from) break;
        state.pos[who] = to;
        const together = state.pos[0] === state.pos[1];
        const a = dog.position.clone();
        const b = squarePos(to, who, together);
        dog.rotation.y = Math.atan2(b.x - a.x, b.z - a.z) + (dir < 0 ? 0 : 0);
        onHop?.(k, dir);
        await new Promise((resolve) => {
          const p = { t: 0 };
          gsap.to(p, {
            t: 1,
            duration: 0.34,
            ease: 'none',
            onUpdate: () => {
              const tt = p.t;
              dog.position.lerpVectors(a, b, tt);
              dog.position.y = a.y + (b.y - a.y) * tt + Math.sin(Math.PI * tt) * 0.9;
              const squash = tt < 0.15 ? 1 - tt * 1.5 : tt > 0.85 ? 1 - (1 - tt) * 1.5 : 1.08;
              dog.userData.body.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
            },
            onComplete: () => {
              dog.userData.body.scale.set(1, 1, 1);
              resolve();
            }
          });
        });
        // l'autre chien se décale s'ils partagent la case
        const other = dogs[1 - who];
        other.position.copy(squarePos(state.pos[1 - who], 1 - who, state.pos[0] === state.pos[1]));
      }
      faceAlong(dog, state.pos[who]);
      return state.pos[who];
    },
    async effect(kind, who) {
      const dog = dogs[who];
      const p = dog.position.clone();
      if (kind === 'bone') {
        await new Promise((r) => gsap.to(dog.rotation, { y: dog.rotation.y + Math.PI * 2, duration: 0.6, ease: 'power2.inOut', onComplete: r }));
        burst(p.clone().add(new THREE.Vector3(0, 1.2, 0)), ['#ffe066', '#ffffff'], 18, 3);
      } else if (kind === 'bath') {
        burst(p.clone().add(new THREE.Vector3(0, 0.6, 0)), ['#74c0fc', '#a5d8ff', '#ffffff'], 26, 4, 'splash');
        await new Promise((r) => gsap.to(dog.userData.body.rotation, { z: 0.35, duration: 0.08, yoyo: true, repeat: 7, ease: 'sine.inOut', onComplete: r }));
        dog.userData.body.rotation.z = 0;
      } else if (kind === 'ball') {
        await new Promise((r) => gsap.to(dog.position, { y: p.y + 1.2, duration: 0.25, yoyo: true, repeat: 3, ease: 'power2.out', onComplete: r }));
        dog.position.y = p.y;
      }
    },
    celebrate(who) {
      followTarget = dogs[who];
      cam.mode = 'follow';
      burst(new THREE.Vector3(0, 2.2, 0), ['#ff6b6b', '#ffd43b', '#4dabf7', '#8ce99a', '#b197fc', '#ff8fab'], 140, 7);
      dogs.forEach((dog, i) => {
        gsap.to(dog.position, { y: dog.position.y + 0.8, duration: 0.3, yoyo: true, repeat: 9, ease: 'power2.out', delay: i * 0.15 });
      });
      setTimeout(() => {
        cam.mode = 'overview';
      }, 2600);
    },
    overview() {
      cam.mode = 'overview';
    },
    get positions() {
      return [...state.pos];
    },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        const m = o.material;
        if (Array.isArray(m)) m.forEach((x) => {
          x.map?.dispose();
          x.dispose();
        });
        else if (m) {
          m.map?.dispose();
          m.dispose();
        }
      });
    }
  };
  return api;
}
