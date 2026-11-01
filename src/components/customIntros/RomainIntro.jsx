import React, { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { createGame } from '../../themes/comic/game/engine';
import { sfxHook, sfxRelease, sfxCollect, sfxFail, sfxMissionPassed, setMuted, isMuted } from '../../themes/heist/sound';
import './RomainIntro.css';

// =============================================================================
// Intro de Romain : un vrai mini-jeu d'arcade (création originale).
// Couverture de comic → jeu au grappin → arrivée à la fête → quiz.
// =============================================================================

export default function RomainIntro({ guest, onComplete, isReplay = false }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const doneRef = useRef(false);
  const [screen, setScreen] = useState('cover'); // cover | game | fail | win
  const [score, setScore] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fails, setFails] = useState(0);
  const [started, setStarted] = useState(false);
  const [muted, setMutedState] = useState(isMuted());
  const name = (guest?.first_name || 'Romain').toUpperCase();

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete?.();
  }, [onComplete]);

  // Couverture animée
  useEffect(() => {
    if (screen !== 'cover') return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const ctx = gsap.context(() => {
      gsap.from('.rc-cover-panel', { scale: 0.7, rotate: -6, autoAlpha: 0, duration: 0.6, ease: 'back.out(1.8)' });
      gsap.from('.rc-cover-title span', { y: -60, autoAlpha: 0, duration: 0.5, ease: 'back.out(2.4)', stagger: 0.08, delay: 0.25 });
      gsap.from('.rc-cover-hero', { x: -220, rotate: -30, duration: 0.9, ease: 'expo.out', delay: 0.35 });
      gsap.from('.rc-pow', { scale: 0, rotate: 30, duration: 0.45, ease: 'back.out(3)', delay: 0.9, stagger: 0.12 });
      gsap.from('.rc-cover-cta', { y: 30, autoAlpha: 0, duration: 0.5, ease: 'back.out(2)', delay: 1.1 });
    }, rootRef);
    return () => ctx.revert();
  }, [screen]);

  // Lancement du jeu
  useEffect(() => {
    if (screen !== 'game' || gameRef.current) return undefined;
    const game = createGame(canvasRef.current, {
      name,
      onScore: setScore,
      onProgress: setProgress,
      onFail: () => {
        setFails((f) => f + 1);
        setScreen('fail');
      },
      onWin: () => setScreen('win'),
      sfx: { hook: sfxHook, release: sfxRelease, collect: sfxCollect, fail: sfxFail, win: sfxMissionPassed }
    });
    gameRef.current = game;
    // pour les tests automatiques
    window.__romainGame = game;
    return undefined;
  }, [screen, name]);

  useEffect(() => () => gameRef.current?.destroy(), []);

  // Victoire : confettis
  useEffect(() => {
    if (screen !== 'win') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#ffd400', '#13b5a6', '#ff6a1a', '#ff3d8b'];
    confetti({ particleCount: 140, spread: 100, origin: { y: 0.55 }, colors });
    setTimeout(() => confetti({ particleCount: 90, angle: 60, spread: 70, origin: { x: 0 }, colors }), 250);
    setTimeout(() => confetti({ particleCount: 90, angle: 120, spread: 70, origin: { x: 1 }, colors }), 400);
  }, [screen]);

  // Contrôles : appui n'importe où (souris, doigt, espace)
  const down = useCallback((e) => {
    if (e.target.closest?.('button')) return;
    e.preventDefault?.();
    setStarted(true);
    gameRef.current?.press();
  }, []);
  const up = useCallback(() => gameRef.current?.release(), []);

  useEffect(() => {
    if (screen !== 'game') return undefined;
    const kd = (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setStarted(true);
        gameRef.current?.press();
      }
    };
    const ku = (e) => e.code === 'Space' && gameRef.current?.release();
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, [screen]);

  const retry = () => {
    gameRef.current?.restart();
    setStarted(false);
    setScreen('game');
  };

  return (
    <div ref={rootRef} className="rc-intro" role="dialog" aria-modal="true" aria-label={`Mini-jeu de ${name}`}>
      {screen === 'cover' && (
        <div className="rc-cover">
          <div className="rc-cover-panel">
            <div className="rc-cover-top">
              <span className="rc-issue">N°1</span>
              <span className="rc-edition">Édition anniversaire</span>
            </div>
            <h1 className="rc-cover-title">
              <span>CAPTAIN</span> <span>{name}</span>
            </h1>
            <p className="rc-cover-sub">et le grappin de la fête</p>
            <div className="rc-cover-art" aria-hidden="true">
              <svg className="rc-cover-hero" viewBox="0 0 160 170">
                <defs>
                  <clipPath id="rc-face-clip">
                    <circle cx="84" cy="44" r="27" />
                  </clipPath>
                </defs>
                {/* corde du grappin */}
                <path d="M158,-10 L100,64" stroke="#141018" strokeWidth="7" />
                <path d="M158,-10 L100,64" stroke="#e8e2d4" strokeWidth="3" />
                {/* cape */}
                <path d="M72,70 Q26,80 12,114 L58,102 Z" fill="#ff6a1a" stroke="#141018" strokeWidth="5" strokeLinejoin="round" />
                {/* cheveux longs */}
                <path d="M62,30 Q40,52 36,92 Q60,96 92,74 Q114,52 104,26 Z" fill="#5a3a22" stroke="#141018" strokeWidth="4" strokeLinejoin="round" />
                {/* polaire beige, côtés noirs */}
                <ellipse cx="80" cy="96" rx="25" ry="30" fill="#d8d1b4" stroke="#141018" strokeWidth="5" />
                <path d="M57,84 Q55,100 60,116" stroke="#1d1b22" strokeWidth="6" fill="none" />
                <path d="M103,84 Q105,100 100,116" stroke="#1d1b22" strokeWidth="6" fill="none" />
                <path d="M68,70 L80,82 L92,70 L88,66 L72,66 Z" fill="#1d1b22" />
                <path d="M80,82 L80,104" stroke="#8a8470" strokeWidth="2" />
                <polygon points="93,88 96,95 104,95 98,99 100,107 93,103 86,107 88,99 82,95 90,95" fill="#ffd400" stroke="#141018" strokeWidth="1.5" />
                {/* bras vers le grappin */}
                <path d="M92,74 L102,62" stroke="#141018" strokeWidth="13" strokeLinecap="round" />
                <path d="M92,74 L102,62" stroke="#d8d1b4" strokeWidth="8" strokeLinecap="round" />
                {/* jambes */}
                <path d="M70,122 L58,150 M90,122 L102,148" stroke="#141018" strokeWidth="14" strokeLinecap="round" />
                <path d="M70,122 L58,150 M90,122 L102,148" stroke="#2a2730" strokeWidth="9" strokeLinecap="round" />
                {/* visage de Romain */}
                <image href="/romain/visage.png" x="57" y="17" width="54" height="54" clipPath="url(#rc-face-clip)" />
                <circle cx="84" cy="44" r="27" fill="none" stroke="#141018" strokeWidth="5" />
              </svg>
              <span className="rc-pow rc-pow--1">BAM !</span>
              <span className="rc-pow rc-pow--2">WHOOSH !</span>
            </div>
            <p className="rc-cover-text">
              Accroche-toi aux drones, ramasse les parts de gâteau et rejoins la fête de Jibril sans tomber.
            </p>
            <button type="button" className="rc-btn rc-cover-cta" onClick={() => setScreen('game')} autoFocus>
              JOUER ▶
            </button>
            {isReplay && (
              <button type="button" className="rc-link" onClick={finish}>
                Revenir au tableau de bord
              </button>
            )}
          </div>
        </div>
      )}

      {screen !== 'cover' && (
        <div
          className="rc-game"
          onPointerDown={down}
          onPointerUp={up}
          onPointerCancel={up}
          onPointerLeave={up}
          onContextMenu={(e) => e.preventDefault()}
        >
          <canvas ref={canvasRef} className="rc-canvas" />
          <div className="rc-hud">
            <span className="rc-score" aria-live="polite">🎂 × {score}</span>
            <div className="rc-progress" aria-label="Distance jusqu'à la fête">
              <div className="rc-progress-fill" style={{ transform: `scaleX(${progress})` }} />
              <span className="rc-progress-goal" aria-hidden="true">🎉</span>
            </div>
            <button
              type="button"
              className="rc-round"
              aria-label={muted ? 'Activer le son' : 'Couper le son'}
              onClick={() => {
                const next = !isMuted();
                setMuted(next);
                setMutedState(next);
              }}
            >
              {muted ? '🔇' : '🔊'}
            </button>
          </div>

          {screen === 'game' && !started && (
            <div className="rc-tuto" aria-live="polite">
              <span className="rc-hand" aria-hidden="true">👆</span>
              <p>
                <b>Maintiens</b> pour t'accrocher, <b>relâche</b> pour t'envoler !
              </p>
            </div>
          )}

          <button type="button" className={`rc-skip ${fails >= 2 ? 'rc-skip--strong' : ''}`} onClick={finish}>
            {fails >= 2 ? 'Trop dur ? Passer au quiz' : 'Passer le jeu'}
          </button>

          {screen === 'fail' && (
            <div className="rc-overlay">
              <div className="rc-card rc-card--fail">
                <p className="rc-card-big">OUPS !</p>
                <p>
                  Tu es tombé à {Math.round(progress * 100)} % de la fête. <br />
                  {score > 0 && `${score} part${score > 1 ? 's' : ''} de gâteau récupérée${score > 1 ? 's' : ''}.`}
                </p>
                <button type="button" className="rc-btn" onClick={retry} autoFocus>
                  RÉESSAYER ↻
                </button>
              </div>
            </div>
          )}

          {screen === 'win' && (
            <div className="rc-overlay">
              <div className="rc-card">
                <p className="rc-card-big">BRAVO {name} !</p>
                <p>
                  Tu es arrivé à la fête avec <b>{score} part{score > 1 ? 's' : ''} de gâteau</b>. Mission accomplie.
                </p>
                <button type="button" className="rc-btn" onClick={finish} autoFocus>
                  {isReplay ? 'REVENIR AU TABLEAU DE BORD' : 'PASSER AU QUIZ ▶'}
                </button>
                <button type="button" className="rc-link" onClick={retry}>
                  Rejouer pour battre mon score
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
