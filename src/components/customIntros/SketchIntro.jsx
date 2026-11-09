import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chibi, BoilDefs, Bubble, Pencil, friendLook, INK, PAPER } from '../../themes/sketch/Chibi';
import { fetchGuests } from '../../lib/supabase';
import {
  sfxScribble,
  sfxPop,
  sfxPage,
  sfxBoing,
  sfxSparkle,
  startStoryTune,
  stopStoryTune,
  getAudioGraph,
  setMuted,
  isMuted
} from '../../themes/heist/sound';
import './SketchIntro.css';

// =============================================================================
// Intro "carnet de croquis" pour les illustratrices et illustrateurs (Assiya) :
// animation 2D image par image à 12 images/s ("en deux"), traits qui
// frémissent (line boil), chibis dessinés au crayon puis coloriés au feutre.
// =============================================================================

const FPS = 12;
const norm = (s = '') => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const steps3 = (k) => (k <= 0 ? 0 : k < 0.34 ? 0.25 : k < 0.67 ? 0.55 : 1);


function castFor(guest) {
  const n = norm(guest?.first_name);
  const name = (guest?.first_name || 'toi').trim();
  if (n === 'assiya') {
    return {
      name: 'Assiya',
      hero: { hair: 'curlyLong', hairColor: '#6b6b78', hoodie: '#ffb3c7', prop: 'stylus', badge: '✎' },
      partner: { name: 'Sacha', hair: 'short', hairColor: '#6b6b78', hoodie: '#74c0fc', badge: '🎧' },
      lines: {
        hello: 'Coucou Assiya !\nC’est toi… en chibi !',
        partner: 'Et voilà Sacha ! ♥',
        invite: 'Jibril vous invite\nà son anniv !',
        friends: 'Toute la bande\nest là !'
      }
    };
  }
  return {
    name,
    hero: { hair: 'short', hairColor: '#6b6b78', hoodie: '#5ee6b8', prop: 'pencil', badge: '✎' },
    lines: {
      hello: `Salut ${name} !\nC’est toi… en chibi !`,
      invite: 'Jibril t’invite\nà son anniv !',
      friends: 'Toute la bande\nest là !'
    }
  };
}

// Prénoms des invités (couples séparés), sans le héros ni son ou sa partenaire
function friendList(guests, cast) {
  const skip = new Set([norm(cast.name), cast.partner ? norm(cast.partner.name) : '']);
  const out = [];
  (guests || [])
    .slice()
    .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
    .forEach((g) => {
      String(g.first_name || '')
        .split(/\s*[&+,/]\s*|\s+et\s+/i)
        .map((p) => p.trim())
        .filter(Boolean)
        .forEach((p) => {
          const words = p.split(/\s+/);
          const label = words.length > 1 ? `${words[0]} ${words[1][0]}.` : p;
          if (skip.has(norm(p))) return;
          if (out.some((o) => o.label === label)) return;
          out.push({ label, emoji: g.emoji || '🎉' });
        });
    });
  return out.slice(0, 14);
}

function buildScript(cast, nFriends) {
  const segs = {};
  let t = 0;
  const seg = (name, len) => {
    segs[name] = { start: t, len };
    t += len;
  };
  seg('flip', 12);
  seg('drawHero', 36);
  seg('colorHero', 9);
  seg('alive', 6);
  seg('hello', 28);
  if (cast.partner) seg('partner', 34);
  seg('cake', 28);
  seg('friends', Math.max(8, nFriends * 3 + 8));
  seg('jump', 26);
  seg('invite', 30);
  segs.end = t;
  return segs;
}

const JUMP = ['squash', 'stretch', 'top', 'top', 'fall', 'squash', 'stand', 'stand'];

// --------------------------------------------------------------- dessins
function Cake({ x, y, draw = 1, color = 1, flame = 0 }) {
  const parts = [
    { d: `M${x - 58},${y} a58,12 0 1,0 116,0 a58,12 0 1,0 -116,0`, fill: '#e9ecef' },
    { d: `M${x - 44},${y - 4} v-40 h88 v40 Z`, fill: '#ffd8a8' },
    { d: `M${x - 44},${y - 34} q11,10 22,0 q11,10 22,0 q11,10 22,0 q11,10 22,0 v-10 h-88 Z`, fill: '#ff8fab' },
    { d: `M${x - 30},${y - 44} v-30 h60 v30 Z`, fill: '#fff3bf' },
    { d: `M${x - 30},${y - 66} q10,8 20,0 q10,8 20,0 q10,8 20,0 v-8 h-60 Z`, fill: '#b197fc' },
    { d: `M${x - 16},${y - 74} v-20 h6 v20 Z M${x - 3},${y - 74} v-24 h6 v24 Z M${x + 10},${y - 74} v-20 h6 v20 Z`, fill: '#74c0fc' }
  ];
  const n = parts.length;
  return (
    <g>
      {parts.map((p, i) => {
        const k = clamp01(draw * n - i);
        if (k <= 0) return null;
        return (
          <path
            key={i}
            d={p.d}
            fill={p.fill}
            fillOpacity={color}
            stroke={INK}
            strokeWidth="3.2"
            strokeLinejoin="round"
            {...(k < 1 ? { pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - k } : {})}
          />
        );
      })}
      {color >= 1 &&
        [-13, 0, 13].map((dx, i) => (
          <path
            key={dx}
            d={`M${x + dx},${y - 96 - (i === 1 ? 4 : 0)} q-6,-8 0,-${16 + ((flame + i) % 2) * 4} q6,8 0,${16 + ((flame + i) % 2) * 4} Z`}
            fill="#ffa94d"
            stroke={INK}
            strokeWidth="2.4"
          />
        ))}
    </g>
  );
}

function InviteCard({ draw = 1 }) {
  const d = 'M70,96 L430,84 L436,214 L64,226 Z';
  return (
    <g transform="rotate(-2 250 155)">
      <path d={d} fill={PAPER} stroke={INK} strokeWidth="3.4" strokeLinejoin="round" {...(draw < 1 ? { pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - draw, fillOpacity: 0 } : {})} />
      {draw >= 1 && (
        <>
          <text x="250" y="132" textAnchor="middle" fontSize="27" fontFamily="'Patrick Hand', sans-serif" fill={INK}>
            Invitation ✦ L’anniv de Jibril
          </text>
          <text x="250" y="170" textAnchor="middle" fontSize="20" fontFamily="'Patrick Hand', sans-serif" fill={INK}>
            Réponds au quiz pour choisir
          </text>
          <text x="250" y="198" textAnchor="middle" fontSize="20" fontFamily="'Patrick Hand', sans-serif" fill={INK}>
            la date, la ville et le thème 🎂
          </text>
          <path d="M150,178 C210,186 290,184 352,176" stroke="#ffd43b" strokeWidth="12" strokeLinecap="round" opacity="0.45" fill="none" />
        </>
      )}
    </g>
  );
}

const DOODLES = Array.from({ length: 16 }, (_, i) => {
  const r = (k) => {
    const v = Math.sin(i * 91.7 + k * 13.1) * 10000;
    return v - Math.floor(v);
  };
  return { x: 30 + r(1) * 440, y: 40 + r(2) * 200, kind: ['star', 'spiral', 'heart'][i % 3], c: ['#ffd43b', '#ff8fab', '#74c0fc', '#63e6be', '#b197fc'][i % 5], rot: r(3) * 60 - 30 };
});
function Doodle({ x, y, kind, c, rot, draw }) {
  const d =
    kind === 'star'
      ? 'M0,-14 L4,-4 L14,-4 L6,3 L9,13 L0,7 L-9,13 L-6,3 L-14,-4 L-4,-4 Z'
      : kind === 'heart'
        ? 'M0,10 C-14,0 -12,-12 -4,-12 C0,-12 0,-8 0,-6 C0,-8 0,-12 4,-12 C12,-12 14,0 0,10 Z'
        : 'M0,0 C4,-4 10,0 8,6 C6,14 -6,14 -10,6 C-14,-4 -4,-14 6,-12';
  return (
    <path
      transform={`translate(${x},${y}) rotate(${rot})`}
      d={d}
      fill={kind === 'spiral' ? 'none' : c}
      stroke={kind === 'spiral' ? c : INK}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(draw < 1 ? { pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - draw } : {})}
    />
  );
}

// --------------------------------------------------------------- composant
export default function SketchIntro({ guest, onComplete }) {
  const cast = useMemo(() => castFor(guest), [guest]);
  const [phase, setPhase] = useState('cover'); // cover | story | done
  const [f, setF] = useState(0);
  const [friends, setFriends] = useState([]);
  const [muted, setMutedState] = useState(isMuted());
  const [boil, setBoil] = useState(0);
  const lastCue = useRef(-1);
  const t0 = useRef(0);
  const doneRef = useRef(false);
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const script = useMemo(() => buildScript(cast, friends.length), [cast, friends.length]);

  useEffect(() => {
    let alive = true;
    fetchGuests()
      .then((list) => alive && setFriends(friendList(list, cast)))
      .catch(() => {});
    return () => {
      alive = false;
      stopStoryTune();
    };
  }, [cast]);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    stopStoryTune();
    onComplete?.();
  }, [onComplete]);

  // ----------------------------------------------------------- horloge 12 i/s
  useEffect(() => {
    t0.current = performance.now();
    lastCue.current = -1;
    if (phase === 'story') setF(0);
    const id = setInterval(() => {
      const frame = Math.floor(((performance.now() - t0.current) * FPS) / 1000);
      if (!reduced) setBoil(Math.floor((frame * 2) / 3) % 3);
      if (phase === 'story') setF(frame);
    }, 1000 / FPS / 2);
    return () => clearInterval(id);
  }, [phase, reduced]);

  // ----------------------------------------------------------- sons calés sur les images
  useEffect(() => {
    if (phase !== 'story') return;
    for (let fr = lastCue.current + 1; fr <= f; fr++) cue(fr);
    lastCue.current = f;
    if (f >= script.end) setPhase('done');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, phase]);

  function within(name, fr) {
    const s = script[name];
    return s && fr >= s.start && fr < s.start + s.len ? fr - s.start : -1;
  }

  function cue(fr) {
    if (fr === 0) sfxPage();
    let k;
    if ((k = within('drawHero', fr)) >= 0 && k % 2 === 0) sfxScribble();
    if (within('alive', fr) === 2) sfxPop(1);
    if (within('hello', fr) === 0) sfxPop(1.25);
    if ((k = within('partner', fr)) >= 0) {
      if (k < 16 && k % 2 === 0) sfxScribble();
      if (k === 20) {
        sfxPop(1.4);
        sfxSparkle();
      }
    }
    if ((k = within('cake', fr)) >= 0) {
      if (k < 12 && k % 2 === 0) sfxScribble();
      if (k === 15) sfxSparkle();
    }
    if ((k = within('friends', fr)) >= 0 && k % 3 === 0 && k / 3 < friends.length) sfxPop(0.85 + (k / 3) * 0.04);
    if ((k = within('jump', fr)) >= 0 && k % 8 === 1) sfxBoing();
    if ((k = within('invite', fr)) >= 0 && k < 10 && k % 2 === 0) sfxScribble();
    if (within('invite', fr) === 11) sfxSparkle();
  }

  const openBook = () => {
    getAudioGraph(); // débloque le son (geste de l'utilisateur)
    startStoryTune();
    setPhase('story');
  };
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };

  // ----------------------------------------------------------- scène (une image = un dessin)
  const renderScene = () => {
    const fr = phase === 'story' ? f : script.end + 100;
    const L = (name) => (script[name] ? fr - script[name].start : -1);
    const after = (name) => script[name] && fr >= script[name].start + script[name].len;
    const inSeg = (name) => script[name] && fr >= script[name].start && fr < script[name].start + script[name].len;
    const done = phase === 'done';

    const flipFrame = inSeg('flip') ? Math.floor(L('flip') / 3) : 4;

    const heroX = cast.partner ? 196 : 250;
    const heroY = 430;
    const draw = inSeg('drawHero') ? (L('drawHero') + 1) / script.drawHero.len : after('drawHero') ? 1 : 0;
    const color = inSeg('colorHero') ? steps3((L('colorHero') + 1) / script.colorHero.len) : after('colorHero') ? 1 : 0;
    let pose = 'stand';
    let eyes = 'open';
    let mouth = 'smile';
    if (inSeg('alive')) {
      const k = L('alive');
      eyes = k < 2 ? 'blink' : 'open';
      pose = ['stand', 'stand', 'squash', 'stretch', 'squash', 'stand'][k];
    }
    if (inSeg('hello')) {
      const k = L('hello');
      pose = Math.floor(k / 3) % 2 ? 'wave2' : 'wave1';
      mouth = k < 18 && Math.floor(k / 2) % 2 ? 'open' : 'smile';
      if (k > 20) eyes = 'happy';
    }
    if (inSeg('partner')) {
      const k = L('partner');
      pose = k < 18 ? 'draw' : 'cheer';
      eyes = k > 20 ? 'happy' : 'open';
    }
    if (inSeg('cake')) {
      const k = L('cake');
      pose = k < 12 ? 'draw' : Math.floor(k / 3) % 2 ? 'cheer' : 'stand';
      mouth = k >= 12 && k < 26 && Math.floor(k / 2) % 2 ? 'open' : 'smile';
    }
    if (inSeg('friends')) pose = Math.floor(L('friends') / 4) % 2 ? 'wave2' : 'wave1';
    if (inSeg('jump')) {
      pose = JUMP[L('jump') % JUMP.length];
      eyes = 'happy';
      mouth = 'open';
    }
    if (inSeg('invite') || done) {
      pose = done ? (Math.floor(boil / 2) ? 'cheer' : 'stand') : 'cheer';
      eyes = 'happy';
    }

    let bubble = null;
    const bub = (name, text) => {
      if (inSeg(name)) bubble = { text, draw: Math.min(1, (L(name) + 1) / 4) };
    };
    bub('hello', cast.lines.hello);
    if (cast.partner) bub('partner', cast.lines.partner);
    if (inSeg('cake') && L('cake') >= 12) bubble = { text: cast.lines.invite, draw: Math.min(1, (L('cake') - 11) / 4) };
    bub('friends', cast.lines.friends);

    const partner =
      cast.partner && (inSeg('partner') || after('partner'))
        ? (() => {
            const k = inSeg('partner') ? L('partner') : 99;
            let ppose = k >= 20 && k < 23 ? ['squash', 'stretch', 'squash'][k - 20] : 'stand';
            if (inSeg('jump')) ppose = JUMP[(L('jump') + 2) % JUMP.length];
            if (inSeg('friends')) ppose = Math.floor(L('friends') / 4) % 2 ? 'wave1' : 'wave2';
            return { draw: Math.min(1, (k + 1) / 16), color: k < 16 ? 0 : steps3((k - 15) / 4), pose: ppose, heart: k >= 20 && k < 34 };
          })()
        : null;

    const cakeShown = inSeg('cake') || after('cake');
    const cakeDraw = inSeg('cake') ? Math.min(1, (L('cake') + 1) / 12) : 1;
    const cakeColor = inSeg('cake') ? (L('cake') < 12 ? 0 : steps3((L('cake') - 11) / 3)) : 1;

    const fk = inSeg('friends') ? L('friends') : after('friends') ? 999 : -1;
    const half = Math.ceil(friends.length / 2);
    const rows = [friends.slice(0, half), friends.slice(half)];

    let pencil = null;
    if (inSeg('drawHero')) {
      const k = L('drawHero');
      pencil = { x: heroX + Math.sin(k * 1.9) * 52, y: heroY - 190 + (k / script.drawHero.len) * 180 + Math.cos(k * 2.7) * 10 };
    } else if (inSeg('partner') && L('partner') < 16) {
      const k = L('partner');
      pencil = { x: 345 + Math.sin(k * 1.9) * 40, y: 260 + (k / 16) * 160 };
    } else if (inSeg('cake') && L('cake') < 12) {
      const k = L('cake');
      pencil = { x: 95 + Math.sin(k * 2.1) * 44, y: 330 + (k / 12) * 96 };
    } else if (inSeg('invite') && L('invite') < 10) {
      const k = L('invite');
      pencil = { x: 80 + (k / 10) * 340, y: 100 + Math.cos(k * 2.2) * 40 };
    }

    const doodleN = inSeg('jump') ? Math.min(DOODLES.length, Math.floor(L('jump') / 1.5)) : after('jump') ? DOODLES.length : 0;

    return (
      <svg className="sk-svg" viewBox="0 0 500 640" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Animation : le carnet de ${cast.name}`}>
        <BoilDefs id="sk" />
        <g filter={reduced ? undefined : `url(#sk-boil-${boil})`}>
          {DOODLES.slice(0, doodleN).map((d, i) => (
            <Doodle key={i} {...d} draw={after('jump') ? 1 : Math.min(1, (L('jump') - i * 1.5) / 2)} />
          ))}

          {cakeShown && <Cake x={95} y={430} draw={cakeDraw} color={cakeColor} flame={Math.floor(fr / 2) + boil} />}

          {rows.map((row, ri) =>
            row.map((fd, i) => {
              const idx = ri === 0 ? i : half + i;
              const k = fk - idx * 3;
              if (k < 0) return null;
              const n = row.length;
              const x = n === 1 ? 250 : 40 + (420 * i) / (n - 1) + (ri ? 18 : 0);
              const y = ri === 0 ? 528 : 606;
              let fpose = k === 0 ? 'squash' : k === 1 ? 'stretch' : 'stand';
              if (inSeg('jump')) fpose = JUMP[(L('jump') + idx) % JUMP.length];
              else if (k > 2 && Math.floor((fr + idx * 5) / 6) % 5 === 0) fpose = 'wave1';
              const party = inSeg('jump');
              return (
                <Chibi key={fd.label} x={x} y={y} scale={0.4} pose={fpose} eyes={party ? 'happy' : 'open'} mouth={party ? 'open' : 'smile'} {...friendLook(fd.label)} above={fd.emoji} name={fd.label} nameSize={34} />
              );
            })
          )}

          {partner && (
            <Chibi x={345} y={heroY} scale={1.08} {...cast.partner} pose={partner.pose} draw={partner.draw} color={partner.color} eyes={partner.heart ? 'happy' : 'open'} flip>
              {partner.heart && (
                <text x="-40" y="-150" fontSize="34" transform="scale(-1,1)">
                  ❤️
                </text>
              )}
            </Chibi>
          )}

          {(draw > 0 || after('drawHero')) && <Chibi x={heroX} y={heroY} scale={1.22} {...cast.hero} pose={pose} eyes={eyes} mouth={mouth} draw={draw} color={color} />}

          {bubble && <Bubble x={cast.partner ? 120 : 150} y={40} w={300} h={104} text={bubble.text} draw={bubble.draw} size={25} />}

          {(inSeg('invite') || done) && <InviteCard draw={inSeg('invite') ? Math.min(1, (L('invite') + 1) / 10) : 1} />}

          {pencil && <Pencil x={pencil.x} y={pencil.y} />}
        </g>

        {flipFrame < 3 && (
          <g>
            <path
              d={flipFrame === 0 ? 'M18,8 L482,8 L482,632 L18,632 Z' : flipFrame === 1 ? 'M18,8 L330,40 L330,600 L18,632 Z' : 'M18,8 L90,70 L90,570 L18,632 Z'}
              fill="#3d5a80"
              stroke={INK}
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {flipFrame === 0 && (
              <text x="250" y="320" textAnchor="middle" fontSize="40" fill="#fff" fontFamily="'Patrick Hand', sans-serif">
                Le carnet de {cast.name}
              </text>
            )}
          </g>
        )}
      </svg>
    );
  };

  return (
    <div className={`sk-intro sk-intro--${phase}`} role="dialog" aria-modal="true" aria-label={`Bienvenue ${cast.name}`}>
      <div className="sk-paper" aria-hidden="true" />

      {phase === 'cover' && (
        <div className="sk-cover">
          <div className="sk-book">
            <div className="sk-book__strap" aria-hidden="true" />
            <div className="sk-book__label">
              <span className="sk-book__small">Le carnet de</span>
              <span className="sk-book__name">{cast.name}</span>
            </div>
            <svg className="sk-book__doodles" viewBox="0 0 200 260" aria-hidden="true">
              <BoilDefs id="skc" />
              <g filter={reduced ? undefined : `url(#skc-boil-${boil})`} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M30,40 L34,50 L44,50 L36,56 L39,66 L30,60 L21,66 L24,56 L16,50 L26,50 Z" />
                <path d="M160,200 C164,196 170,200 168,206 C166,214 154,214 150,206 C146,196 156,186 166,188" />
                <path d="M150,48 C136,38 138,26 146,26 C150,26 150,30 150,32 C150,30 150,26 154,26 C162,26 164,38 150,48 Z" />
                <path d="M40,214 q10,-12 20,0 t20,0 t20,0" />
              </g>
            </svg>
          </div>
          <button type="button" className="sk-btn" onClick={openBook} autoFocus>
            Ouvrir le carnet
          </button>
          <p className="sk-hint">Monte le son ✎</p>
        </div>
      )}

      {(phase === 'story' || phase === 'done') && <div className="sk-stage">{renderScene()}</div>}

      {phase === 'story' && (
        <button type="button" className="sk-skip" onClick={() => setPhase('done')}>
          Passer
        </button>
      )}

      {phase === 'done' && (
        <div className="sk-bottom">
          <button type="button" className="sk-btn" onClick={finish} autoFocus>
            Commencer le quiz
          </button>
        </div>
      )}

      <button type="button" className="sk-mute" onClick={toggleMute} aria-label={muted ? 'Activer le son' : 'Couper le son'}>
        {muted ? '🔇' : '🔊'}
      </button>
    </div>
  );
}
