import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { EVENT_CONFIG } from '../../config/event';
import {
  startRomance,
  stopRomance,
  setMuted,
  isMuted,
  sfxProjector,
  sfxTicket,
  sfxCurtain
} from '../../themes/heist/sound';
import './LolaIntro.css';

// =============================================================================
// Intro de Lola : "L'Anniv de Jibril", le film
// 1. Salle obscure : bouton pour lancer la bande-annonce (débloque le son)
// 2. Bande-annonce de comédie romantique : décompte, studio, cartons,
//    ville sous la neige, parapluie rouge sous la pluie, lettre qui s'ouvre
// 3. L'affiche du film, avec de fausses critiques (blagues)
// 4. Ciné-club : choix du siège, impression du ticket à son nom
// 5. Le rideau s'ouvre → le quiz
// Tout est dessiné à la main (SVG / CSS), aucune image de film existant.
// =============================================================================

const ROWS = ['A', 'B', 'C', 'D', 'E'];
const COLS = 8;
// Sièges déjà pris (le reste de la bande)
const TAKEN = new Set(['A2', 'A3', 'B6', 'C1', 'C7', 'D4', 'D5', 'E2', 'E8', 'B3']);

const SNOW = Array.from({ length: 46 }, (_, i) => ({
  left: (i * 23.7) % 100,
  size: 2 + ((i * 7) % 5),
  delay: (i * 0.37) % 5,
  dur: 5 + ((i * 1.3) % 5),
  drift: ((i * 11) % 30) - 15
}));
const RAIN = Array.from({ length: 60 }, (_, i) => ({
  left: (i * 17.3) % 100,
  delay: (i * 0.13) % 1.2,
  dur: 0.55 + ((i * 7) % 5) / 10,
  len: 14 + ((i * 5) % 18)
}));
const WINDOWS = Array.from({ length: 64 }, (_, i) => ({
  x: (i * 37) % 380,
  y: 120 + ((i * 53) % 150),
  on: (i * 7) % 3 !== 0
}));

function Skyline() {
  // Silhouette de ville d'hiver (dessin original)
  return (
    <svg className="lo-skyline" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="lo-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1430" />
          <stop offset="1" stopColor="#3a2346" />
        </linearGradient>
        <clipPath id="lo-blocks">
          <path d="M0,300 V170 h30 v-40 h26 v60 h20 v-90 h34 v70 h16 v-30 h30 v80 h22 v-120 l14,-20 l14,20 v60 h28 v40 h26 v-70 h30 v50 h20 v-30 h40 V300 Z" />
        </clipPath>
      </defs>
      <rect width="400" height="300" fill="url(#lo-night)" />
      <circle cx="318" cy="60" r="22" fill="#f6ecd8" opacity="0.9" />
      <circle cx="310" cy="54" r="22" fill="#0f1835" opacity="0.85" />
      <path d="M0,300 V170 h30 v-40 h26 v60 h20 v-90 h34 v70 h16 v-30 h30 v80 h22 v-120 l14,-20 l14,20 v60 h28 v40 h26 v-70 h30 v50 h20 v-30 h40 V300 Z" fill="#120c22" />
      <g clipPath="url(#lo-blocks)">
        {WINDOWS.map((w, i) => (
          <rect key={i} x={w.x + 6} y={w.y} width="5" height="7" fill={w.on ? '#ffd98a' : '#231a35'} opacity={w.on ? 0.9 : 1} className={w.on && i % 5 === 0 ? 'lo-win-blink' : undefined} />
        ))}
      </g>
      <path d="M0,300 V286 Q100,276 200,284 T400,282 V300 Z" fill="#f6ecd8" opacity="0.9" />
    </svg>
  );
}

function Umbrella() {
  // Parapluie rouge, seul point de couleur sous la pluie
  return (
    <svg className="lo-umbrella" viewBox="0 0 200 220" aria-hidden="true">
      <path d="M20,90 Q100,-10 180,90 Q160,78 140,90 Q120,78 100,90 Q80,78 60,90 Q40,78 20,90 Z" fill="#c8102e" />
      <path d="M100,8 V90" stroke="#7d0a1d" strokeWidth="2" />
      <path d="M60,90 Q80,30 100,8 M140,90 Q120,30 100,8" stroke="#7d0a1d" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M100,90 V170 q0,14 -12,14 q-10,0 -10,-10" stroke="#1b0a0e" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* silhouette sous le parapluie */}
      <circle cx="100" cy="112" r="11" fill="#1b0a0e" />
      <path d="M84,214 L90,130 Q100,122 110,130 L118,214 Z" fill="#1b0a0e" />
      <path d="M90,135 Q78,150 88,170" stroke="#1b0a0e" strokeWidth="6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function Envelope() {
  return (
    <div className="lo-env" aria-hidden="true">
      <div className="lo-env__back" />
      <div className="lo-env__card">
        <span className="lo-env__card-small">Vous êtes conviée à</span>
        <span className="lo-env__card-big">une invitation</span>
      </div>
      <div className="lo-env__front" />
      <div className="lo-env__flap" />
      <div className="lo-env__seal">
        <svg viewBox="0 0 40 40">
          <path d="M20,32 C8,23 6,16 10,11 C14,6 19,9 20,13 C21,9 26,6 30,11 C34,16 32,23 20,32 Z" fill="#f3dfa2" />
        </svg>
      </div>
    </div>
  );
}

function HeartMark({ size = 46 }) {
  // Emblème du studio fictif : un cœur dans un rond de bobine
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" aria-hidden="true">
      <circle cx="30" cy="30" r="27" fill="none" stroke="currentColor" strokeWidth="2" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <circle key={a} cx={30 + Math.cos((a * Math.PI) / 180) * 18} cy={30 + Math.sin((a * Math.PI) / 180) * 18} r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      ))}
      <path d="M30,38 C22,32 20,27 23,24 C26,21 29,23 30,26 C31,23 34,21 37,24 C40,27 38,32 30,38 Z" fill="currentColor" />
    </svg>
  );
}

function Sparkle({ className = '', style }) {
  // Étincelle à quatre branches, comme un reflet sur le néon
  return (
    <svg className={`lo-sparkle ${className}`} style={style} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20,0 C21,14 26,19 40,20 C26,21 21,26 20,40 C19,26 14,21 0,20 C14,19 19,14 20,0 Z" fill="#fff" />
    </svg>
  );
}

// Titre en néon écrit à la main : "L'Anniv" + "de Jibril", avec étincelles
const HOST = EVENT_CONFIG.hostName || 'Jibril';
const FILM = `L'Anniv de ${HOST}`;

function NeonTitle({ as: Tag = 'h1', className = '' }) {
  return (
    <Tag className={`lo-neon ${className}`} aria-label={FILM}>
      <span className="lo-neon__name" aria-hidden="true">L'Anniv</span>
      <span className="lo-neon__sub" aria-hidden="true">de {HOST}</span>
      <Sparkle className="lo-sparkle--a" />
      <Sparkle className="lo-sparkle--b" />
      <Sparkle className="lo-sparkle--c" />
    </Tag>
  );
}

// Les quatre petites mentions dans les coins, façon générique d'émission
function Corners({ tl, tr, bl, br }) {
  return (
    <div className="lo-corners" aria-hidden="true">
      <span className="lo-corners__tl">{tl}</span>
      <span className="lo-corners__tr">{tr}</span>
      <span className="lo-corners__bl">{bl}</span>
      <span className="lo-corners__br">{br}</span>
    </div>
  );
}

function Barcode() {
  const bars = useMemo(() => Array.from({ length: 34 }, (_, i) => 1 + ((i * 7 + 3) % 4)), []);
  let x = 0;
  return (
    <svg className="lo-ticket__barcode" viewBox="0 0 120 30" preserveAspectRatio="none" aria-hidden="true">
      {bars.map((w, i) => {
        const r = <rect key={i} x={x} y="0" width={i % 2 ? w * 0.6 : w} height="30" fill={i % 2 ? 'transparent' : '#2a060d'} />;
        x += w + 0.8;
        return r;
      })}
    </svg>
  );
}

export default function LolaIntro({ guest, onComplete, isReplay = false }) {
  const rootRef = useRef(null);
  const tlRef = useRef(null);
  const doneRef = useRef(false);
  const [phase, setPhase] = useState('lobby'); // lobby | trailer | poster | club | ticket | opening
  const [seat, setSeat] = useState(null);
  const [muted, setMutedState] = useState(isMuted());
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const name = (guest?.first_name || 'Lola').trim();

  useEffect(() => () => stopRomance(), []);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    stopRomance();
    onComplete?.();
  }, [onComplete]);

  // ---------------------------------------------------------------- bande-annonce
  const startTrailer = () => {
    startRomance();
    sfxProjector();
    const root = rootRef.current;
    if (reduced || !root) {
      setPhase(reduced ? 'poster' : 'trailer');
      return;
    }
    gsap
      .timeline({ onComplete: () => setPhase('trailer') })
      .to(root.querySelector('.lo-lobby'), { autoAlpha: 0, duration: 0.35 }, 0)
      .to(root.querySelector('.lo-curtain--l'), { xPercent: -100, duration: 1.1, ease: 'power3.inOut' }, 0.1)
      .to(root.querySelector('.lo-curtain--r'), { xPercent: 100, duration: 1.1, ease: 'power3.inOut' }, 0.1)
      .to(root.querySelector('.lo-valance'), { yPercent: -100, duration: 0.8, ease: 'power3.in' }, 0.4);
  };

  useLayoutEffect(() => {
    if (phase !== 'trailer') return undefined;
    const root = rootRef.current;
    if (reduced) {
      const t = setTimeout(() => setPhase('poster'), 600);
      return () => clearTimeout(t);
    }
    const ctx = gsap.context(() => {
      const qa = (s) => root.querySelectorAll(s);
      const show = (sel, at, hold, fade = 0.6) => {
        tl.fromTo(sel, { autoAlpha: 0 }, { autoAlpha: 1, duration: fade, ease: 'power2.out' }, at);
        tl.to(sel, { autoAlpha: 0, duration: fade, ease: 'power2.in' }, at + hold);
      };
      const tl = gsap.timeline({ onComplete: () => setPhase('poster') });
      tlRef.current = tl;

      // Bandes noires qui se referment en format cinéma
      tl.fromTo(qa('.lo-bar'), { scaleY: 0 }, { scaleY: 1, duration: 0.9, ease: 'power3.inOut' }, 0);

      // 1. Décompte de bobine 3, 2, 1
      tl.set('.lo-leader', { autoAlpha: 1 }, 0.2);
      ['3', '2', '1'].forEach((n, i) => {
        tl.set('.lo-leader__num', { textContent: n }, 0.2 + i * 0.7);
        tl.fromTo('.lo-leader__sweep', { rotate: 0 }, { rotate: 360, duration: 0.7, ease: 'none' }, 0.2 + i * 0.7);
      });
      tl.to('.lo-leader', { autoAlpha: 0, duration: 0.15 }, 2.3);

      // 2. Studio
      tl.fromTo('.lo-studio', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.9, ease: 'power2.out' }, 2.6);
      tl.fromTo('.lo-studio__mark', { scale: 0.7, rotate: -40 }, { scale: 1, rotate: 0, duration: 1.6, ease: 'expo.out' }, 2.6);
      tl.fromTo('.lo-studio__shine', { xPercent: -160 }, { xPercent: 160, duration: 1.3, ease: 'power2.inOut' }, 3.1);
      tl.fromTo('.lo-studio__pre', { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.7 }, 3.6);
      tl.to('.lo-studio', { autoAlpha: 0, duration: 0.6 }, 4.9);

      // 3. Carton
      show('.lo-card--1', 5.5, 1.9, 0.7);
      tl.fromTo('.lo-card--1 .lo-card__text', { letterSpacing: '0.02em' }, { letterSpacing: '0.12em', duration: 2.6, ease: 'none' }, 5.5);

      // 4. Ville sous la neige
      show('.lo-city', 8.1, 3.2, 0.9);
      tl.fromTo('.lo-skyline', { scale: 1.18, yPercent: 4 }, { scale: 1, yPercent: 0, duration: 4.2, ease: 'none' }, 8.1);
      tl.fromTo('.lo-city .lo-sub', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 8.8);

      // 5. Carton
      show('.lo-card--2', 11.7, 1.4, 0.5);

      // 6. Pluie et parapluie rouge
      show('.lo-rain', 13.8, 3.1, 0.7);
      tl.fromTo('.lo-umbrella', { xPercent: -60, rotate: -6 }, { xPercent: 12, rotate: 3, duration: 3.8, ease: 'sine.inOut' }, 13.8);
      tl.fromTo('.lo-rain .lo-sub', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 14.5);

      // 7. La lettre
      tl.fromTo('.lo-letter', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 17.4);
      tl.fromTo('.lo-env', { y: 60, rotate: -4, scale: 0.9 }, { y: 0, rotate: 0, scale: 1, duration: 1, ease: 'expo.out' }, 17.4);
      tl.to('.lo-env__seal', { scale: 1.25, autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, 18.5);
      tl.to('.lo-env__flap', { rotateX: 180, duration: 0.7, ease: 'power2.inOut' }, 18.7);
      tl.set('.lo-env__flap', { zIndex: 0 }, 19.05);
      tl.to('.lo-env__card', { yPercent: -62, duration: 0.9, ease: 'back.out(1.4)' }, 19.3);
      tl.to('.lo-letter', { autoAlpha: 0, duration: 0.6 }, 21.2);

      // 8. Critiques qui claquent
      const quotes = qa('.lo-quote');
      quotes.forEach((el, i) => {
        tl.fromTo(el, { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'power3.out' }, 21.9 + i * 0.95);
        tl.to(el, { autoAlpha: 0, duration: 0.2 }, 21.9 + i * 0.95 + 0.75);
      });

      // 9. Titre
      const tStart = 21.9 + quotes.length * 0.95 + 0.2;
      tl.fromTo('.lo-titlecard', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, tStart);
      // le néon s'allume en grésillant
      tl.fromTo('.lo-titlecard .lo-spot', { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.8, ease: 'expo.out' }, tStart);
      tl.call(() => root.querySelector('.lo-titlecard .lo-neon')?.classList.add('lo-neon--ignite'), null, tStart + 0.4);
      tl.fromTo('.lo-titlecard .lo-sparkle', { scale: 0, rotate: -90 }, { scale: 1, rotate: 0, duration: 0.6, ease: 'back.out(2)', stagger: 0.15 }, tStart + 1.6);
      tl.to('.lo-titlecard', { autoAlpha: 0, duration: 0.7 }, tStart + 3.6);
    }, root);
    return () => {
      ctx.revert();
      tlRef.current = null;
    };
  }, [phase, reduced]);

  const skipTrailer = () => {
    tlRef.current?.kill();
    setPhase('poster');
  };

  // ---------------------------------------------------------------- affiche
  useLayoutEffect(() => {
    if (phase !== 'poster' || reduced) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo('.lo-poster', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, ease: 'power2.out' });
      gsap.fromTo('.lo-poster .lo-spot', { scale: 0.7 }, { scale: 1, duration: 1.4, ease: 'expo.out' });
      gsap.fromTo('.lo-poster .lo-corners span', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, stagger: 0.08, delay: 0.5 });
      gsap.fromTo('.lo-poster [data-rise]', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.09, delay: 0.35 });
    }, rootRef.current);
    return () => ctx.revert();
  }, [phase, reduced]);

  // ---------------------------------------------------------------- ciné-club
  useLayoutEffect(() => {
    if (phase !== 'club' || reduced) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo('.lo-club__marquee', { autoAlpha: 0, y: -20 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out' });
      gsap.fromTo('.lo-seat', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: { each: 0.012, from: 'center' }, delay: 0.25 });
    }, rootRef.current);
    return () => ctx.revert();
  }, [phase, reduced]);

  const printTicket = () => {
    if (!seat) return;
    sfxTicket();
    setPhase('ticket');
  };

  useLayoutEffect(() => {
    if (phase !== 'ticket') return undefined;
    const ctx = gsap.context(() => {
      if (reduced) return;
      gsap.fromTo('.lo-ticket', { yPercent: -105 }, { yPercent: 0, duration: 1.1, ease: 'steps(14)' });
      gsap.fromTo('.lo-ticket-wrap__after', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.6, delay: 1.2 });
    }, rootRef.current);
    return () => ctx.revert();
  }, [phase, reduced]);

  const enterTheater = () => {
    setPhase('opening');
    sfxCurtain();
    if (reduced) {
      setTimeout(finish, 300);
      return;
    }
    const root = rootRef.current;
    gsap
      .timeline({ onComplete: finish })
      .to(root.querySelector('.lo-ticket-wrap'), { autoAlpha: 0, y: 20, duration: 0.4 }, 0)
      .to(root.querySelector('.lo-curtain--l'), { xPercent: -100, duration: 1.6, ease: 'power3.inOut' }, 0.3)
      .to(root.querySelector('.lo-curtain--r'), { xPercent: 100, duration: 1.6, ease: 'power3.inOut' }, 0.3)
      .fromTo(root.querySelector('.lo-glow'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, 0.6)
      .to(root, { autoAlpha: 0, duration: 0.5 }, 1.8);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };

  const date = EVENT_CONFIG.datesProposed?.split(',')[0]?.replace(/Week-ends du/i, '').trim();
  const showCurtains = phase === 'club' || phase === 'ticket' || phase === 'opening' || phase === 'lobby';

  return (
    <div className={`lo-intro lo-intro--${phase}`} ref={rootRef} role="dialog" aria-modal="true" aria-label={`${FILM}, avec ${name}`}>
      <div className="lo-grain" aria-hidden="true" />
      <div className="lo-vignette" aria-hidden="true" />

      {/* Rideau de velours (salle) */}
      {showCurtains && (
        <>
          <div className="lo-glow" aria-hidden="true" />
          <div className="lo-curtain lo-curtain--l" aria-hidden="true" />
          <div className="lo-curtain lo-curtain--r" aria-hidden="true" />
          <div className="lo-valance" aria-hidden="true" />
        </>
      )}

      <button type="button" className="lo-mute" onClick={toggleMute} aria-label={muted ? 'Activer le son' : 'Couper le son'}>
        {muted ? '🔇' : '🔊'}
      </button>

      {/* ------------------------------------------------------------- lobby */}
      {phase === 'lobby' && (
        <div className="lo-lobby">
          <div className="lo-spot" aria-hidden="true" />
          <Corners tl="Séance privée" tr="Avant-première" bl="Une comédie romantique avec du gâteau, des bougies et toute la bande" br={`Invitée spéciale : ${name}`} />
          <NeonTitle className="lo-neon--on" />
          <button type="button" className="lo-btn lo-btn--neon" onClick={startTrailer} autoFocus>
            <span className="lo-btn__play" aria-hidden="true">▶</span>
            {isReplay ? 'Revoir la bande-annonce' : 'Lancer la bande-annonce'}
          </button>
          <p className="lo-lobby__hint">Monte le son, c'est mieux.</p>
        </div>
      )}

      {/* ------------------------------------------------------------ trailer */}
      {phase === 'trailer' && (
        <div className="lo-trailer">
          <div className="lo-bar lo-bar--top" aria-hidden="true" />
          <div className="lo-bar lo-bar--bottom" aria-hidden="true" />

          <div className="lo-scene lo-leader" aria-hidden="true">
            <div className="lo-leader__ring" />
            <div className="lo-leader__sweep" />
            <span className="lo-leader__num">3</span>
          </div>

          <div className="lo-scene lo-studio">
            <div className="lo-studio__mark">
              <HeartMark size={64} />
            </div>
            <div className="lo-studio__name">
              Jibril Pictures
              <span className="lo-studio__shine" aria-hidden="true" />
            </div>
            <div className="lo-studio__pre">présente</div>
          </div>

          <div className="lo-scene lo-card lo-card--1">
            <p className="lo-card__text">Cet hiver…</p>
          </div>

          <div className="lo-scene lo-city">
            <Skyline />
            <div className="lo-snow" aria-hidden="true">
              {SNOW.map((f, i) => (
                <i key={i} style={{ left: `${f.left}%`, width: f.size, height: f.size, animationDelay: `-${f.delay}s`, animationDuration: `${f.dur}s`, '--drift': `${f.drift}px` }} />
              ))}
            </div>
            <p className="lo-sub">{name} pensait que décembre serait un mois tranquille.</p>
          </div>

          <div className="lo-scene lo-card lo-card--2">
            <p className="lo-card__text lo-card__text--italic">Elle avait tort.</p>
          </div>

          <div className="lo-scene lo-rain">
            <div className="lo-rain__drops" aria-hidden="true">
              {RAIN.map((d, i) => (
                <i key={i} style={{ left: `${d.left}%`, height: d.len, animationDelay: `-${d.delay}s`, animationDuration: `${d.dur}s` }} />
              ))}
            </div>
            <div className="lo-street" aria-hidden="true" />
            <Umbrella />
            <p className="lo-sub">Car un soir, sous la pluie, elle reçut une lettre…</p>
          </div>

          <div className="lo-scene lo-letter">
            <Envelope />
          </div>

          <div className="lo-quotes" aria-hidden="true">
            <p className="lo-quote">
              <span className="lo-quote__stars">★★★★★</span>
              « On a pleuré. Surtout au moment du gâteau. »<cite>Le Journal de Jibril</cite>
            </p>
            <p className="lo-quote">
              <span className="lo-quote__stars">★★★★★</span>
              « La comédie romantique de l'hiver. »<cite>Ciné-Club du Salon</cite>
            </p>
            <p className="lo-quote">
              <span className="lo-quote__stars">★★★★☆</span>
              « Une étoile en moins : il manquait du pop-corn. »<cite>La Maman de Jibril</cite>
            </p>
          </div>

          <div className="lo-scene lo-titlecard">
            <div className="lo-stage" aria-hidden="true" />
            <div className="lo-spot" aria-hidden="true" />
            <NeonTitle as="h2" />
          </div>

          <button type="button" className="lo-skip" onClick={skipTrailer}>
            Passer la bande-annonce
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- affiche */}
      {phase === 'poster' && (
        <div className="lo-poster-wrap">
          <div className="lo-stage" aria-hidden="true" />
          <article className="lo-poster" aria-label={`Affiche : ${FILM}`}>
            <div className="lo-spot" aria-hidden="true" />
            <Corners tl="Histoire vraie" tr="Hiver 2026" bl="Une soirée où les souvenirs se jouent comme des scènes de film" br={`Avec ${name}`} />
            <div className="lo-poster__center">
              <NeonTitle className="lo-neon--on" />
              <p className="lo-poster__tagline" data-rise>Elle avait tout prévu. Sauf cette invitation.</p>
              <div className="lo-poster__quotes" data-rise>
                <p>« Le film de l'année. »<span>Jibril</span></p>
                <p>« Je ne m'en suis pas remis. »<span>Un invité</span></p>
              </div>
              <p className="lo-poster__date" data-rise>Prochainement · {date ? `à partir du ${date}` : 'cet hiver'}</p>
              <button type="button" className="lo-btn lo-btn--neon lo-poster__cta" data-rise onClick={() => setPhase('club')}>
                Prendre mon ticket
              </button>
            </div>
          </article>
        </div>
      )}

      {/* ------------------------------------------------------------ ciné-club */}
      {phase === 'club' && (
        <div className="lo-club">
          <div className="lo-club__marquee">
            <div className="lo-bulbs" aria-hidden="true">
              {Array.from({ length: 18 }, (_, i) => <i key={i} style={{ '--i': i }} />)}
            </div>
            <p className="lo-club__kicker">Ciné-club de Jibril</p>
            <p className="lo-club__film">{FILM}</p>
            <div className="lo-bulbs" aria-hidden="true">
              {Array.from({ length: 18 }, (_, i) => <i key={i} style={{ '--i': i + 1 }} />)}
            </div>
          </div>

          <p className="lo-club__ask">Choisis ta place.</p>
          <div className="lo-screen" aria-hidden="true">Écran</div>
          <div className="lo-seats" role="radiogroup" aria-label="Sièges">
            {ROWS.map((r) => (
              <div className="lo-seats__row" key={r}>
                <span className="lo-seats__label" aria-hidden="true">{r}</span>
                {Array.from({ length: COLS }, (_, c) => {
                  const id = `${r}${c + 1}`;
                  const taken = TAKEN.has(id);
                  const on = seat === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={taken ? `Siège ${id}, occupé` : `Siège ${id}`}
                      disabled={taken}
                      className={`lo-seat${taken ? ' lo-seat--taken' : ''}${on ? ' lo-seat--on' : ''}${c === 3 ? ' lo-seat--aisle' : ''}`}
                      onClick={() => setSeat(id)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <p className="lo-club__legend">
            <span className="lo-dot lo-dot--free" /> libre <span className="lo-dot lo-dot--taken" /> déjà pris par la bande
          </p>
          <button type="button" className="lo-btn lo-btn--gold" disabled={!seat} onClick={printTicket}>
            {seat ? `Imprimer mon ticket · siège ${seat}` : 'Choisis un siège'}
          </button>
        </div>
      )}

      {/* --------------------------------------------------------------- ticket */}
      {(phase === 'ticket' || phase === 'opening') && (
        <div className="lo-ticket-wrap">
          <div className="lo-slot" aria-hidden="true" />
          <div className="lo-ticket-clip">
            <div className="lo-ticket" role="img" aria-label={`Ticket : ${name}, salle 1, siège ${seat}`}>
              <div className="lo-ticket__main">
                <p className="lo-ticket__house">
                  <HeartMark size={22} /> Ciné-club de Jibril
                </p>
                <p className="lo-ticket__film">{EVENT_CONFIG.title}</p>
                <dl className="lo-ticket__grid">
                  <div><dt>Spectatrice</dt><dd>{name}</dd></div>
                  <div><dt>Salle</dt><dd>1</dd></div>
                  <div><dt>Rang</dt><dd>{seat?.[0]}</dd></div>
                  <div><dt>Siège</dt><dd>{seat?.slice(1)}</dd></div>
                </dl>
                <p className="lo-ticket__note">Pop-corn offert. Mouchoirs conseillés.</p>
              </div>
              <div className="lo-ticket__stub">
                <span className="lo-ticket__admit">Entrée</span>
                <span className="lo-ticket__seat">{seat}</span>
                <Barcode />
              </div>
            </div>
          </div>
          <div className="lo-ticket-wrap__after">
            <button type="button" className="lo-btn lo-btn--gold" onClick={enterTheater} disabled={phase === 'opening'} autoFocus>
              Entrer dans la salle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
