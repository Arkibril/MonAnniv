import React, { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { createGame, MISSIONS, ITEMS_PER_FOCUS } from '../../themes/comic/game/engine';
import { saveRomainRun } from '../../themes/comic/RomainTracker';
import {
  sfxHook, sfxRelease, sfxCollect, sfxFail, sfxMissionPassed, sfxHurt, sfxShoot, sfxBoom,
  sfxFocusIn, sfxFocusOut, sfxMission, setMuted, isMuted
} from '../../themes/heist/sound';
import RomainEmblem from '../../themes/comic/RomainEmblem';
import HalloweenWebs from '../../themes/comic/HalloweenWebs';
import './RomainIntro.css';

// =============================================================================
// Intro de Romain : un vrai mini-jeu d'arcade (création originale).
// Couverture de comic → jeu au grappin → arrivée à la fête → quiz.
// =============================================================================

export default function RomainIntro({ guest, onComplete, isReplay = false }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const shotPressRef = useRef(false);
  const doneRef = useRef(false);
  const [screen, setScreen] = useState('cover'); // cover | game | fail | win
  const [score, setScore] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fails, setFails] = useState(0);
  const [started, setStarted] = useState(false);
  const [muted, setMutedState] = useState(isMuted());
  const [hud, setHud] = useState({ lives: 3, maxLives: 3, energy: 1, focus: false, kills: 0, score: 0 });
  const [result, setResult] = useState(null);
  const [failReason, setFailReason] = useState('chute');
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
      onHud: setHud,
      onFail: (reason) => {
        saveRomainRun(guest, null, false);
        setFailReason(reason);
        setFails((f) => f + 1);
        setScreen('fail');
      },
      onWin: (res) => {
        saveRomainRun(guest, res, true);
        setResult(res);
        setScreen('win');
      },
      sfx: {
        hook: sfxHook, release: sfxRelease, collect: sfxCollect, fail: sfxFail, win: sfxMissionPassed,
        hurt: sfxHurt, shoot: sfxShoot, boom: sfxBoom, focus: sfxFocusIn, focusOut: sfxFocusOut, mission: sfxMission
      }
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
    const g = gameRef.current;
    if (!g) return;
    if (e.button === 2) {
      g.power();
      return;
    }
    // FOCUS : on tire s'il reste des ennemis à l'écran ; sinon on quitte le
    // ralenti et l'appui sert à s'accrocher comme d'habitude
    if (g.isFocus() && g.hasTargets()) {
      shotPressRef.current = true;
      g.shoot(e.clientX, e.clientY);
      return;
    }
    if (g.isFocus()) g.endFocus();
    shotPressRef.current = false;
    setStarted(true);
    g.press();
  }, []);
  // un appui qui a servi à tirer ne doit pas lâcher le grappin en se relevant
  const up = useCallback(() => {
    if (shotPressRef.current) {
      shotPressRef.current = false;
      return;
    }
    gameRef.current?.release();
  }, []);

  useEffect(() => {
    if (screen !== 'game') return undefined;
    const kd = (e) => {
      const g = gameRef.current;
      if (!g) return;
      if ((e.code === 'KeyF' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') && !e.repeat) {
        g.power();
      } else if (e.code === 'Enter' && g.isFocus()) {
        g.shoot(); // tir automatique sur la cible la plus proche
      } else if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (g.isFocus() && g.hasTargets()) {
          shotPressRef.current = true;
          g.shoot();
          return;
        }
        if (g.isFocus()) g.endFocus();
        shotPressRef.current = false;
        setStarted(true);
        g.press();
      }
    };
    const ku = (e) => {
      if (e.code !== 'Space') return;
      if (shotPressRef.current) {
        shotPressRef.current = false;
        return;
      }
      gameRef.current?.release();
    };
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
    setResult(null);
    setScreen('game');
  };

  const missionDone = (id) => {
    if (id === 'reach') return screen === 'win';
    if (id === 'kills') return hud.kills >= 5;
    return hud.score >= 10;
  };
  const missionCount = (m) => (m.id === 'kills' ? `${Math.min(hud.kills, 5)}/5` : m.id === 'cakes' ? `${Math.min(hud.score, 10)}/10` : '');

  return (
    <div ref={rootRef} className="rc-intro" role="dialog" aria-modal="true" aria-label={`Mini-jeu de ${name}`}>
      {screen === 'cover' && (
        <div className="rc-cover">
          <HalloweenWebs corners={['tl', 'tr', 'bl', 'br']} />
          <div className="rc-cover-panel">
            <RomainEmblem size={78} className="rc-cover-emblem" />
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
                {/* cape noire doublée de rouge */}
                <path d="M70,66 Q22,78 8,118 L58,104 Z" fill="#0d0d10" stroke="#141018" strokeWidth="5" strokeLinejoin="round" />
                <path d="M68,72 Q30,84 18,112 L56,100 Z" fill="#e5212e" />
                {/* cheveux longs */}
                <path d="M62,30 Q40,52 36,92 Q60,96 92,74 Q114,52 104,26 Z" fill="#5a3a22" stroke="#141018" strokeWidth="4" strokeLinejoin="round" />
                {/* combinaison rouge, flancs et ceinture noirs */}
                <ellipse cx="80" cy="96" rx="25" ry="30" fill="#e5212e" stroke="#141018" strokeWidth="5" />
                <path d="M57,84 Q55,100 60,116" stroke="#0d0d10" strokeWidth="7" fill="none" />
                <path d="M103,84 Q105,100 100,116" stroke="#0d0d10" strokeWidth="7" fill="none" />
                <rect x="57" y="110" width="46" height="7" fill="#0d0d10" />
                <rect x="76" y="109" width="9" height="9" fill="#ffd21a" stroke="#141018" strokeWidth="1.5" />
                <path d="M68,68 Q80,78 92,68 L88,64 L72,64 Z" fill="#0d0d10" />
                {/* blason ✌️ éclair */}
                <polygon points="80,80 91,86 91,98 80,104 69,98 69,86" fill="#0d0d10" stroke="#fff" strokeWidth="2" />
                <path d="M73,85 L78.5,98 L81.5,98 L87,85 L84,85 L80,94 L76,85 Z" fill="#fff" />
                <path d="M81.5,86 L78,92 L80.5,92 L78.6,97 L83,90.5 L80.6,90.5 Z" fill="#ffd21a" />
                {/* bras vers le grappin, gant noir */}
                <path d="M92,74 L102,62" stroke="#141018" strokeWidth="13" strokeLinecap="round" />
                <path d="M92,74 L102,62" stroke="#e5212e" strokeWidth="8" strokeLinecap="round" />
                <circle cx="102" cy="62" r="6.5" fill="#0d0d10" />
                {/* jambes rouges, bottes noires */}
                <path d="M70,122 L58,150 M90,122 L102,148" stroke="#141018" strokeWidth="14" strokeLinecap="round" />
                <path d="M70,122 L58,150 M90,122 L102,148" stroke="#e5212e" strokeWidth="9" strokeLinecap="round" />
                <path d="M62,140 L58,150 M98,138 L102,148" stroke="#0d0d10" strokeWidth="10" strokeLinecap="round" />
                {/* visage de Romain */}
                <image href="/romain/visage.png" x="57" y="17" width="54" height="54" clipPath="url(#rc-face-clip)" />
                <circle cx="84" cy="44" r="27" fill="none" stroke="#141018" strokeWidth="5" />
              </svg>
              <span className="rc-pow rc-pow--1">BAM !</span>
              <span className="rc-pow rc-pow--2">✌️ WHOOSH !</span>
            </div>
            <p className="rc-cover-text">
              Des drones casse-fête veulent gâcher l'anniversaire. Balance-toi jusqu'à la fête, évite les lasers et les
              mines, et active ton pouvoir <b>FOCUS ⚡</b> pour ralentir le temps et les dégommer.
            </p>
            <ul className="rc-missions-list">
              {MISSIONS.map((m) => (
                <li key={m.id}>★ {m.label}</li>
              ))}
            </ul>
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
            <span className="rc-lives" aria-label={`${hud.lives} vies`}>
              {Array.from({ length: hud.maxLives }, (_, i) => (
                <span key={i} className={i < hud.lives ? '' : 'is-lost'}>❤️</span>
              ))}
            </span>
            <span className="rc-score" aria-live="polite">🎂 {score}</span>
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

          <ul className="rc-missions" aria-label="Missions">
            {MISSIONS.map((m) => (
              <li key={m.id} className={missionDone(m.id) ? 'is-done' : ''}>
                {missionDone(m.id) ? '✔' : '★'} {m.id === 'reach' ? 'Fête' : m.id === 'kills' ? 'Drones' : 'Objets'}{' '}
                <b>{missionCount(m)}</b>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className={`rc-power ${hud.energy >= 1 ? 'is-ready' : ''} ${hud.focus ? 'is-active' : ''}`}
            style={{ '--charge': hud.focus ? 1 : hud.energy }}
            onPointerDown={(e) => {
              e.stopPropagation();
              gameRef.current?.power();
            }}
            aria-label="Activer le pouvoir FOCUS"
            disabled={screen !== 'game'}
          >
            <span className="rc-power-fill" aria-hidden="true" />
            <span className="rc-power-label">
              {hud.focus || hud.energy >= 1 ? '⚡ FOCUS' : `⚡ ${Math.round(hud.energy * ITEMS_PER_FOCUS)}/${ITEMS_PER_FOCUS}`}
            </span>
          </button>

          {screen === 'game' && !started && (
            <div className="rc-tuto" aria-live="polite">
              <span className="rc-hand" aria-hidden="true">👆</span>
              <p>
                <b>Maintiens</b> pour t'accrocher, <b>relâche</b> pour t'envoler !
                <br />
                <b>⚡ FOCUS</b> (illimité) : le temps ralentit, touche les drones pour tirer.
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
                  {failReason === 'vies' ? 'Les casse-fête ont eu ta peau' : 'Tu es tombé'} à {Math.round(progress * 100)} % de
                  la fête.
                  <br />
                  {hud.kills} drone{hud.kills > 1 ? 's' : ''} détruit{hud.kills > 1 ? 's' : ''}, {score} objet{score > 1 ? 's' : ''}.
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
                <p className="rc-stars" aria-label={`${result?.stars || 1} étoiles sur 3`}>
                  {[1, 2, 3].map((n) => (
                    <span key={n} className={n <= (result?.stars || 1) ? 'is-on' : ''}>★</span>
                  ))}
                </p>
                <ul className="rc-results">
                  <li className="is-done">✔ Fête atteinte</li>
                  <li className={(result?.kills || 0) >= 5 ? 'is-done' : ''}>
                    {(result?.kills || 0) >= 5 ? '✔' : '✘'} Drones détruits : {result?.kills || 0}/5
                  </li>
                  <li className={(result?.score || 0) >= 10 ? 'is-done' : ''}>
                    {(result?.score || 0) >= 10 ? '✔' : '✘'} Objets ramassés : {result?.score || 0}/10
                  </li>
                </ul>
                <button type="button" className="rc-btn" onClick={finish} autoFocus>
                  {isReplay ? 'REVENIR AU TABLEAU DE BORD' : 'PASSER AU QUIZ ▶'}
                </button>
                <button type="button" className="rc-link" onClick={retry}>
                  {(result?.stars || 1) < 3 ? 'Rejouer pour les 3 étoiles' : 'Rejouer pour le fun'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
