import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowRight, RotateCcw, Volume2 } from 'lucide-react';
import { startRealisticExplosion, warmUpExplosion } from '../../utils/realisticExplosion';
import { EVENT_CONFIG } from '../../config/event';
import { QUESTIONS } from '../../config/questions';
import './LenaikIntro.css';

// =============================================================================
// Intro sur-mesure de Lénaïk
// -----------------------------------------------------------------------------
// 1. Accroche  : page blanche, "FUCK YOU / BRO." imprimé comme le T-shirt.
// 2. Ouverture : au clic, le son démarre et la page se fend en deux portes
//                (la typo se déchire) pour révéler la photo.
// 3. Montée    : titre en masques, lent travelling avant sur Lénaïk.
// 4. Anticipation (silence de la réplique, 4,3 → 4,78 s) : viseur + roquette.
// 5. Impact à 4,78 s (début du "boom" dans le son) : explosion temps réel,
//    titre soufflé, tremblement caméra, la fumée envahit l'écran.
// 6. Pont      : la fumée devient blanche, écran calme qui annonce le quiz
//                (même barre de progression que l'écran suivant).
// La chronologie 2→5 suit l'horloge du fichier audio pour rester synchro.
// =============================================================================

const AUDIO_SRC = '/lenaik/Raze%20Ultimate%20Voice%20Line.mp3';
const PHOTO_SRC = '/lenaik/IMG_3534.jpg';
const PHOTO_W = 2160;
const PHOTO_H = 2880;
const PHOTO_POS = { x: 0.5, y: 0.3 }; // object-position de la photo
const TARGET = { x: 0.47, y: 0.47 }; // poitrine de Lénaïk sur la photo (fractions)
const IMPACT_AT = 4.78; // s : début du "boom" dans la réplique de Raze
const PRINT_1 = 'Fuck you';
const PRINT_2 = 'Bro.';

// Position à l'écran d'un point de la photo affichée en object-fit: cover
function coverPoint(boxW, boxH) {
  const scale = Math.max(boxW / PHOTO_W, boxH / PHOTO_H);
  const w = PHOTO_W * scale;
  const h = PHOTO_H * scale;
  return {
    x: (boxW - w) * PHOTO_POS.x + TARGET.x * w,
    y: (boxH - h) * PHOTO_POS.y + TARGET.y * h
  };
}

function PrintType({ hidden }) {
  return (
    <div className="lx-print" aria-hidden={hidden || undefined}>
      <span className="lx-print-line lx-print-line--1">
        {PRINT_1.split('').map((c, i) => (
          <span key={i} className="lx-char" data-i={i} style={c === ' ' ? { width: '0.28em' } : undefined}>
            {c === ' ' ? ' ' : c}
          </span>
        ))}
      </span>
      <span className="lx-print-line lx-print-line--2">
        {PRINT_2.split('').map((c, i) => (
          <span key={i} className="lx-char" data-i={i}>
            {c}
          </span>
        ))}
      </span>
    </div>
  );
}

export default function LenaikIntro({ guest, onComplete, isReplay = false }) {
  const [runId, setRunId] = useState(0);
  const doneRef = useRef(false);

  // onComplete ne doit partir qu'une seule fois, quoi qu'il arrive
  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete?.();
  }, [onComplete]);

  return (
    <IntroRun
      key={runId}
      guest={guest}
      isReplay={isReplay}
      autoStart={runId > 0}
      onFinish={finish}
      onReplay={() => setRunId((n) => n + 1)}
    />
  );
}

function IntroRun({ guest, isReplay, autoStart, onFinish, onReplay }) {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const ctaRef = useRef(null);
  const bridgeBtnRef = useRef(null);
  const phaseRef = useRef('tease');
  const showTlRef = useRef(null);
  const postTlRef = useRef(null);
  const tickRef = useRef(null);
  const stopExplosionRef = useRef(() => {});
  const targetRef = useRef({ x: 0, y: 0 });

  const [phase, setPhase] = useState('tease');
  const [target, setTarget] = useState({ x: 0, y: 0 });

  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const name = guest?.first_name || 'Lénaïk';
  const host = EVENT_CONFIG.hostName || 'Jibril';
  const total = QUESTIONS.length;

  const goPhase = useCallback((p) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  // --- Point d'impact (suit le redimensionnement) ---------------------------
  useLayoutEffect(() => {
    const measure = () => {
      const r = rootRef.current?.getBoundingClientRect();
      if (!r) return;
      const p = coverPoint(r.width, r.height);
      targetRef.current = p;
      setTarget(p);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // --- Audio ----------------------------------------------------------------
  useEffect(() => {
    const audio = new Audio(AUDIO_SRC);
    audio.preload = 'auto';
    audioRef.current = audio;
    // Textures de l'explosion pré-calculées pendant l'accroche
    const warm = setTimeout(warmUpExplosion, 900);
    return () => {
      clearTimeout(warm);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    };
  }, []);

  // --- Nettoyage global -----------------------------------------------------
  useEffect(() => {
    return () => {
      if (tickRef.current) gsap.ticker.remove(tickRef.current);
      showTlRef.current?.kill();
      postTlRef.current?.kill();
      stopExplosionRef.current();
    };
  }, []);

  // --- 1. Accroche ----------------------------------------------------------
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // États de départ des éléments révélés plus tard
      gsap.set('.lx-line-inner', { yPercent: 108 });
      gsap.set('.lx-sub', { autoAlpha: 0 });

      if (autoStart) return; // "Revoir l'intro" : on enchaîne directement

      if (reduced) {
        gsap.from(['.lx-print', '.lx-tease-cta'], { autoAlpha: 0, duration: 0.3, ease: 'power1.out' });
        return;
      }

      const byIndex = (step) => (i, el) => Number(el.dataset.i) * step;
      const tl = gsap.timeline({ delay: 0.35 });
      tl.from('.lx-print-line--1 .lx-char', {
        autoAlpha: 0,
        scale: 1.45,
        filter: 'blur(6px)',
        duration: 0.32,
        ease: 'power3.out',
        stagger: byIndex(0.045)
      })
        .from(
          '.lx-print-line--2 .lx-char',
          { autoAlpha: 0, scale: 2.3, duration: 0.3, ease: 'power4.out', stagger: byIndex(0.06) },
          '-=0.04'
        )
        // l'impact de "BRO." secoue un peu la page
        .from('.lx-door-inner', { y: 14, duration: 0.45, ease: 'power3.out' }, '-=0.1')
        .from(
          '.lx-tease-cta > *',
          { autoAlpha: 0, y: 14, duration: 0.55, ease: 'expo.out', stagger: 0.08 },
          '-=0.25'
        );
    }, rootRef);

    const focusTimer = setTimeout(() => ctaRef.current?.focus({ preventScroll: true }), reduced ? 300 : 1700);
    return () => {
      clearTimeout(focusTimer);
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 6. Écran-pont vers le quiz ---------------------------------------------
  const showBridge = useCallback(() => {
    if (phaseRef.current === 'bridge') return;
    goPhase('bridge');
    stopExplosionRef.current();
    const q = (s) => rootRef.current?.querySelectorAll(s);
    gsap.set(q('.lx-whiteout'), { autoAlpha: 1 });
    gsap.set([stageRef.current, ...q('.lx-door'), ...q('.lx-skip')], { autoAlpha: 0 });
    gsap.set(q('.lx-bridge'), { autoAlpha: 1 });
    gsap.fromTo(
      q('.lx-bridge .lx-reveal'),
      { autoAlpha: 0, y: reduced ? 0 : 16 },
      { autoAlpha: 1, y: 0, duration: reduced ? 0.25 : 0.7, ease: 'expo.out', stagger: reduced ? 0 : 0.07 }
    );
    gsap.fromTo(
      q('.lx-preview-on'),
      { width: 6 },
      { width: 22, duration: reduced ? 0 : 0.6, ease: 'expo.out', delay: reduced ? 0 : 0.45 }
    );
    setTimeout(() => bridgeBtnRef.current?.focus({ preventScroll: true }), 450);
  }, [goPhase, reduced]);

  // --- 5. Impact --------------------------------------------------------------
  const impact = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const q = (s) => root.querySelectorAll(s);
    const t = targetRef.current;
    gsap.set([...q('.lx-reticle'), ...q('.lx-rocket')], { autoAlpha: 0 });

    const post = gsap.timeline();
    postTlRef.current = post;

    if (reduced) {
      post.to(q('.lx-whiteout'), { autoAlpha: 1, duration: 0.4, ease: 'power1.inOut' }, 0.1);
      post.add(showBridge, 0.6);
      return;
    }

    stopExplosionRef.current = startRealisticExplosion(canvasRef.current, {
      x: t.x,
      y: t.y,
      onFrame: ({ shakeX, shakeY, shakeRot }) => {
        if (stageRef.current) gsap.set(stageRef.current, { x: shakeX, y: shakeY, rotation: shakeRot });
      }
    });

    // Le titre est soufflé dans la direction opposée à l'impact
    const blast = (axis) => (i, el) => {
      const r = el.getBoundingClientRect();
      const dx = r.left + r.width / 2 - t.x;
      const dy = r.top + r.height / 2 - t.y;
      const len = Math.hypot(dx, dy) || 1;
      const force = 260 + i * 60;
      return axis === 'x' ? (dx / len) * force : (dy / len) * force;
    };
    post.to(
      q('.lx-line-inner'),
      {
        x: blast('x'),
        y: blast('y'),
        rotate: (i) => (i % 2 ? 9 : -7),
        autoAlpha: 0,
        filter: 'blur(10px)',
        duration: 0.75,
        ease: 'expo.out'
      },
      0
    );
    post.to(q('.lx-sub'), { autoAlpha: 0, y: 40, duration: 0.5, ease: 'expo.out' }, 0);
    // Coup de poing dans la caméra puis retour
    post.to(q('.lx-photo'), { scale: 1.14, duration: 0.1, ease: 'power4.out' }, 0);
    post.to(q('.lx-photo'), { scale: 1.09, duration: 1.4, ease: 'expo.out' }, 0.1);
    // La scène s'assombrit sous la fumée
    post.to(q('.lx-tint--dim'), { opacity: 0.6, duration: 1.6, ease: 'power2.out' }, 0.15);
    post.to(q('.lx-skip'), { autoAlpha: 0, duration: 0.2 }, 1.4);
    // La fumée vire au blanc : on rejoint le blanc du site
    post.to(q('.lx-whiteout'), { autoAlpha: 1, duration: 0.95, ease: 'power2.inOut' }, 1.8);
    post.add(showBridge, 2.8);
  }, [reduced, showBridge]);

  // --- 2→4. Ouverture synchronisée sur le son -------------------------------
  const start = useCallback(() => {
    if (phaseRef.current !== 'tease') return;
    goPhase('show');
    const root = rootRef.current;
    const q = (s) => root.querySelectorAll(s);
    const t = targetRef.current;

    const audio = audioRef.current;
    if (audio) {
      try {
        audio.currentTime = 0;
        const p = audio.play();
        if (p?.catch) p.catch(() => {}); // son bloqué : l'horloge interne prend le relais
      } catch {
        /* ignore */
      }
    }

    const tl = gsap.timeline({ paused: true });
    showTlRef.current = tl;

    tl.to(q('.lx-tease-cta'), { autoAlpha: 0, y: 8, duration: 0.18, ease: 'power2.in' }, 0);

    if (reduced) {
      tl.to(q('.lx-door'), { autoAlpha: 0, duration: 0.4, ease: 'power1.inOut' }, 0.05);
      tl.set(q('.lx-line-inner'), { yPercent: 0 }, 0);
      tl.fromTo(q('.lx-title'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0.5);
      tl.to(q('.lx-sub'), { autoAlpha: 1, duration: 0.4 }, 0.8);
      tl.to(q('.lx-skip'), { autoAlpha: 1, duration: 0.2 }, 0.6);
    } else {
      // Les portes s'ouvrent : la typo du T-shirt se déchire en deux
      tl.to(q('.lx-door--l'), { xPercent: -102, duration: 1.05, ease: 'power4.inOut' }, 0.08);
      tl.to(q('.lx-door--r'), { xPercent: 102, duration: 1.05, ease: 'power4.inOut' }, 0.08);
      tl.fromTo(q('.lx-photo'), { scale: 1.16 }, { scale: 1, duration: 1.6, ease: 'expo.out' }, 0.1);
      tl.fromTo(q('.lx-tint--dim'), { opacity: 0.65 }, { opacity: 0, duration: 1.3, ease: 'power2.out' }, 0.1);
      // Lent travelling avant sur Lénaïk jusqu'à l'impact
      tl.to(q('.lx-photo'), { scale: 1.075, duration: IMPACT_AT - 1.7, ease: 'sine.inOut' }, 1.7);
      // Titre : chaque ligne sort de son masque
      tl.fromTo(
        q('.lx-line-inner'),
        { yPercent: 108, rotate: 4 },
        { yPercent: 0, rotate: 0, duration: 0.95, ease: 'expo.out', stagger: 0.12 },
        0.8
      );
      tl.fromTo(q('.lx-sub'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out' }, 1.35);
      tl.to(q('.lx-skip'), { autoAlpha: 1, duration: 0.3, ease: 'power1.out' }, 1.1);

      // Le viseur se verrouille sur Lénaïk : il apparaît au pic de la voix,
      // large, puis se resserre lentement jusqu'au silence avant l'impact.
      tl.fromTo(
        q('.lx-reticle'),
        { autoAlpha: 0, scale: 3.4, rotate: -90 },
        { autoAlpha: 0.9, duration: 0.35, ease: 'power1.out' },
        2.85
      );
      tl.to(q('.lx-reticle'), { scale: 1, rotate: 0, duration: 4.35 - 2.85, ease: 'power2.inOut' }, 2.85);
      tl.to(q('.lx-reticle'), { autoAlpha: 1, scale: 0.92, duration: 0.12, ease: 'power2.out' }, 4.35);
      tl.to(q('.lx-tint--dim'), { opacity: 0.3, duration: 0.5, ease: 'power2.inOut' }, 4.25);
      tl.to(q('.lx-title'), { scale: 0.985, transformOrigin: '0% 100%', duration: 0.5, ease: 'power2.inOut' }, 4.25);

      // La roquette arrive du coin haut-gauche et accélère vers la cible
      const sx = -60;
      const sy = Math.max(-60, t.y - (t.x + 60) * 0.62);
      const angle = (Math.atan2(t.y - sy, t.x - sx) * 180) / Math.PI;
      tl.fromTo(
        q('.lx-rocket'),
        { autoAlpha: 1, x: sx, y: sy, rotation: angle },
        { x: t.x, y: t.y, duration: IMPACT_AT - 4.2, ease: 'power2.in' },
        4.2
      );
    }

    // Horloge : on suit le fichier audio quand il joue, sinon le temps réel.
    // Petit rattrapage progressif pour absorber la latence de démarrage du son.
    let clock = 0;
    let last = performance.now();
    let impacted = false;
    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const a = audioRef.current;
      const audioLive = a && !a.paused && !a.ended && a.currentTime > 0;
      if (audioLive) {
        const diff = clock - a.currentTime;
        const rate = diff > 0.03 ? 0.8 : diff < -0.03 ? 1.25 : 1;
        clock += dt * rate;
        if (Math.abs(clock - a.currentTime) > 0.5) clock = a.currentTime;
      } else {
        clock += dt;
      }
      tl.time(Math.min(clock, IMPACT_AT));
      if (!impacted && clock >= IMPACT_AT) {
        impacted = true;
        gsap.ticker.remove(tick);
        tickRef.current = null;
        impact();
      }
    };
    tickRef.current = tick;
    gsap.ticker.add(tick);
  }, [goPhase, impact, reduced]);

  // "Revoir l'intro" : démarrage immédiat
  useEffect(() => {
    if (autoStart) {
      gsap.set(rootRef.current.querySelectorAll('.lx-tease-cta'), { autoAlpha: 0 });
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Passer ----------------------------------------------------------------
  const skip = useCallback(
    (e) => {
      e?.stopPropagation();
      if (phaseRef.current === 'bridge') return;
      if (tickRef.current) gsap.ticker.remove(tickRef.current);
      tickRef.current = null;
      showTlRef.current?.pause();
      postTlRef.current?.kill();
      audioRef.current?.pause();
      gsap.to(rootRef.current.querySelectorAll('.lx-whiteout'), {
        autoAlpha: 1,
        duration: reduced ? 0 : 0.3,
        ease: 'power2.out',
        onComplete: showBridge
      });
    },
    [reduced, showBridge]
  );

  // --- Vers le quiz ------------------------------------------------------------
  const proceed = useCallback(() => {
    gsap.to(rootRef.current.querySelectorAll('.lx-bridge-card'), {
      autoAlpha: 0,
      y: reduced ? 0 : -10,
      duration: reduced ? 0.1 : 0.22,
      ease: 'power2.in',
      onComplete: onFinish
    });
  }, [onFinish, reduced]);

  return (
    <div
      ref={rootRef}
      className="lx-root"
      data-phase={phase}
      onClick={phase === 'tease' ? start : undefined}
      role="dialog"
      aria-modal="true"
      aria-label={`Message pour ${name}`}
    >
      {/* ------------------- Scène : photo, titre, viseur, explosion ------------------- */}
      <div ref={stageRef} className="lx-stage" aria-hidden={phase === 'bridge' || undefined}>
        <div className="lx-stage-inner">
          <img
            className="lx-photo"
            src={PHOTO_SRC}
            alt={`${name}, de nuit à Strasbourg`}
            style={{
              objectPosition: `${PHOTO_POS.x * 100}% ${PHOTO_POS.y * 100}%`,
              transformOrigin: `${target.x}px ${target.y}px`
            }}
            draggable={false}
          />
          <div className="lx-tint lx-tint--base" />
          <div className="lx-tint lx-tint--dim" />

          <div className="lx-title-wrap">
            <h1 className="lx-title">
              <span className="lx-line">
                <span className="lx-line-inner">Tu es convié</span>
              </span>
              <span className="lx-line">
                <span className="lx-line-inner">à la party.</span>
              </span>
            </h1>
            <p className="lx-sub">L'anniversaire de {host}</p>
          </div>

          <div className="lx-reticle" style={{ left: target.x, top: target.y }} aria-hidden="true">
            <span className="lx-reticle-dot" />
          </div>
          <div className="lx-rocket" aria-hidden="true">
            <span className="lx-rocket-trail" />
            <span className="lx-rocket-head" />
          </div>

          <canvas ref={canvasRef} className="lx-canvas" aria-hidden="true" />
        </div>
      </div>

      {/* ------------------- Accroche : deux portes blanches ------------------- */}
      <div className="lx-door lx-door--l">
        <div className="lx-door-inner">
          <PrintType />
        </div>
      </div>
      <div className="lx-door lx-door--r" aria-hidden="true">
        <div className="lx-door-inner">
          <PrintType hidden />
        </div>
      </div>

      <div className="lx-tease-cta">
        <p className="lx-tease-msg">
          <strong>{name}</strong>, {host} t'a laissé un message. Monte le son.
        </p>
        <button
          ref={ctaRef}
          type="button"
          className="lx-btn"
          onClick={(e) => {
            e.stopPropagation();
            start();
          }}
        >
          <Volume2 size={18} aria-hidden="true" />
          <span>Écouter le message</span>
        </button>
      </div>

      <button type="button" className="lx-skip" onClick={skip}>
        Passer l'intro
      </button>

      {/* ------------------- Pont vers le quiz ------------------- */}
      <div className="lx-whiteout" />
      <div className="lx-bridge" onClick={(e) => e.stopPropagation()}>
        <div className="lx-bridge-card">
          {isReplay ? (
            <>
              <h2 className="lx-bridge-title lx-reveal">Toujours aussi efficace.</h2>
              <p className="lx-bridge-text lx-reveal">
                Tes réponses sont bien enregistrées. Tu peux les modifier quand tu veux depuis le tableau de bord.
              </p>
            </>
          ) : (
            <>
              <h2 className="lx-bridge-title lx-reveal">Maintenant, le sérieux.</h2>
              <p className="lx-bridge-text lx-reveal">
                {total} questions rapides pour caler la date, la ville et le thème. Compte une minute : chaque
                réponse s'enregistre toute seule.
              </p>
              <div className="lx-preview lx-reveal" aria-hidden="true">
                <div className="lx-preview-head">
                  <div className="dots">
                    {QUESTIONS.map((q, i) => (
                      <span key={q.id} className={`dots__dot ${i === 0 ? 'dots__dot--on lx-preview-on' : ''}`} />
                    ))}
                  </div>
                  <span className="lx-preview-count tabular">1/{total}</span>
                </div>
                <p className="lx-preview-q">{QUESTIONS[0]?.title}</p>
              </div>
            </>
          )}

          <div className="lx-bridge-actions lx-reveal">
            <button ref={bridgeBtnRef} type="button" className="btn btn--ink btn--lg" onClick={proceed}>
              <span>{isReplay ? 'Revenir au tableau de bord' : 'Commencer le quiz'}</span>
              <ArrowRight size={17} aria-hidden="true" />
            </button>
            <button type="button" className="btn btn--link" onClick={onReplay}>
              <RotateCcw size={16} aria-hidden="true" />
              <span>Revoir l'intro</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
