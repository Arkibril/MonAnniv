import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createDash, createMenuScene, paintCube, CUBE_LOOKS } from '../../themes/sketch/dash/engine';
import { createSong } from '../../themes/sketch/dash/music';
import { LEVEL } from '../../themes/sketch/dash/level';
import { getAudioGraph, setMuted, isMuted, sfxPop } from '../../themes/heist/sound';
import './JulienDash.css';

// =============================================================================
// Intro de Julien : écran titre d'un jeu de rythme (création originale),
// puis son niveau "Anniv Rush". Il doit le finir en mode normal pour
// accéder au quiz.
// =============================================================================

export const julienPassedKey = (guest) => `monanniv_julien_level_${guest?.id || 'x'}`;
const statsKey = (guest) => `monanniv_julien_stats_${guest?.id || 'x'}`;
const lookKey = (guest) => `monanniv_julien_look_${guest?.id || 'x'}`;
const read = (k, fallback) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* stockage indisponible */
  }
};

// Julien doit avoir fini son niveau pour accéder au quiz
export function julienGateOk(guest) {
  try {
    return Boolean(localStorage.getItem(julienPassedKey(guest)));
  } catch {
    return true;
  }
}

function CubePreview({ look, size = 46 }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = size * dpr;
    c.height = size * dpr;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.save();
    ctx.translate(c.width / 2, c.height / 2);
    paintCube(ctx, c.width * 0.86, look);
    ctx.restore();
  }, [look, size]);
  return <canvas ref={ref} style={{ width: size, height: size }} aria-hidden="true" />;
}

export default function JulienDash({ guest, onComplete, isReplay = false }) {
  const [phase, setPhase] = useState('menu'); // menu | level | results
  const [panel, setPanel] = useState(null); // kit | info
  const [lookIdx, setLookIdx] = useState(() => read(lookKey(guest), 0));
  const [stats, setStats] = useState(() => read(statsKey(guest), { attempts: 0, best: 0 }));
  const [result, setResult] = useState(null);
  const [paused, setPaused] = useState(false);
  const [practice, setPractice] = useState(false);
  const [practiceDone, setPracticeDone] = useState(false);
  const [muted, setMutedState] = useState(isMuted());
  const [passed, setPassed] = useState(() => julienGateOk(guest));
  const bgRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const menuSongRef = useRef(null);
  const lookRef = useRef(CUBE_LOOKS[lookIdx] || CUBE_LOOKS[0]);
  const doneRef = useRef(false);
  lookRef.current = CUBE_LOOKS[lookIdx] || CUBE_LOOKS[0];

  // ----------------------------------------------------------- fond + musique du menu
  useEffect(() => {
    if (phase === 'level' || !bgRef.current) return undefined;
    const scene = createMenuScene(bgRef.current, () => lookRef.current);
    return () => scene.destroy();
  }, [phase]);

  const startMenuMusic = useCallback(() => {
    if (menuSongRef.current) return;
    const song = createSong();
    if (!song) return;
    song.start(4 * 4 * (60 / 140), 0.1, [4, 8]); // la partie "groove" en boucle
    menuSongRef.current = song;
  }, []);
  const stopMenuMusic = useCallback(() => {
    menuSongRef.current?.stop();
    menuSongRef.current = null;
  }, []);

  useEffect(() => {
    if (phase === 'menu') startMenuMusic();
    else stopMenuMusic();
  }, [phase, startMenuMusic, stopMenuMusic]);
  useEffect(() => () => stopMenuMusic(), [stopMenuMusic]);

  // le premier appui débloque le son (iPhone)
  const unlock = () => getAudioGraph();

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    stopMenuMusic();
    engineRef.current?.destroy();
    onComplete?.();
  }, [onComplete, stopMenuMusic]);

  // ----------------------------------------------------------- niveau
  useEffect(() => {
    if (phase !== 'level' || !canvasRef.current) return undefined;
    const engine = createDash(canvasRef.current, {
      look: lookRef.current,
      initialAttempts: stats.attempts,
      initialBest: stats.best,
      onDeath: ({ attempts, best }) => {
        const next = { attempts, best };
        setStats(next);
        write(statsKey(guest), next);
      },
      onWin: (st) => {
        if (st.practice) {
          setPracticeDone(true);
          return;
        }
        const next = { attempts: st.attempts, best: 100 };
        setStats(next);
        write(statsKey(guest), next);
        try {
          localStorage.setItem(julienPassedKey(guest), String(Date.now()));
        } catch {
          /* stockage indisponible */
        }
        setPassed(true);
        setResult(st);
        setPhase('results');
      },
      onPause: () => setPaused(true)
    });
    engineRef.current = engine;
    if (typeof window !== 'undefined' && window.__DASH_TEST__) window.__dash = engine;
    engine.start();
    const keys = ['Space', 'ArrowUp', 'KeyW', 'Enter'];
    const down = (e) => {
      if (keys.includes(e.code)) {
        e.preventDefault();
        if (!e.repeat) engine.press();
      }
      if (e.code === 'Escape' || e.code === 'KeyP') engine.pause();
    };
    const up = (e) => {
      if (keys.includes(e.code)) engine.release();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const play = () => {
    unlock();
    sfxPop(1.3);
    setPanel(null);
    setPaused(false);
    setPractice(false);
    setPracticeDone(false);
    setPhase('level');
  };
  const pickLook = (i) => {
    setLookIdx(i);
    write(lookKey(guest), i);
    sfxPop(1 + i * 0.08);
  };
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };
  const resume = () => {
    setPaused(false);
    engineRef.current?.resume();
  };
  const switchPractice = () => {
    const next = !practice;
    setPractice(next);
    setPaused(false);
    setPracticeDone(false);
    engineRef.current?.setPractice(next);
  };
  const restart = () => {
    setPaused(false);
    engineRef.current?.restart();
  };
  const backToMenu = () => {
    setPaused(false);
    setPracticeDone(false);
    setPhase('menu');
  };

  const fmtTime = (s) => `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, '0')} s`;

  return (
    <div className={`jd jd--${phase}`} role="dialog" aria-modal="true" aria-label="Bienvenue Julien" onPointerDown={unlock}>
      {phase !== 'level' && <canvas ref={bgRef} className="jd-bg" aria-hidden="true" />}

      {phase === 'menu' && (
        <div className="jd-menu">
          <h1 className="jd-title" aria-label="Julien Dash">
            <span className="jd-title__a">JULIEN</span>
            <span className="jd-title__b">DASH</span>
          </h1>
          <div className="jd-row">
            <button type="button" className="jd-round jd-round--kit" onClick={() => setPanel('kit')} aria-label="Choisir mon cube">
              <CubePreview look={CUBE_LOOKS[lookIdx]} size={44} />
            </button>
            <button type="button" className="jd-play" onClick={play} aria-label="Jouer" autoFocus>
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <path d="M38,26 L76,50 L38,74 Z" fill="#fff" stroke="#1b1530" strokeWidth="7" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" className="jd-round jd-round--info" onClick={() => setPanel('info')} aria-label="Comment jouer">
              ?
            </button>
          </div>
          <p className="jd-level">
            Niveau spécial : <strong>{LEVEL.name}</strong> · ★★ Normal
          </p>
          <p className="jd-stats">
            Tentatives : {stats.attempts} · Record : {stats.best} %
          </p>
          <p className="jd-rotate">📱 Tourne ton téléphone à l’horizontale pour jouer en grand</p>
          {(passed || isReplay) && (
            <button type="button" className="jd-btn jd-btn--blue jd-skip" onClick={finish}>
              Passer au quiz
            </button>
          )}
        </div>
      )}

      {phase === 'menu' && panel === 'kit' && (
        <div className="jd-overlay" onClick={(e) => e.target === e.currentTarget && setPanel(null)}>
          <div className="jd-panel">
            <h2 className="jd-panel__title">Mon cube</h2>
            <div className="jd-kit">
              {CUBE_LOOKS.map((lk, i) => (
                <button key={i} type="button" className={`jd-swatch${i === lookIdx ? ' jd-swatch--on' : ''}`} onClick={() => pickLook(i)} aria-label={`Cube ${i + 1}`} aria-pressed={i === lookIdx}>
                  <CubePreview look={lk} size={50} />
                </button>
              ))}
            </div>
            <button type="button" className="jd-btn" onClick={() => setPanel(null)}>
              OK
            </button>
          </div>
        </div>
      )}

      {phase === 'menu' && panel === 'info' && (
        <div className="jd-overlay" onClick={(e) => e.target === e.currentTarget && setPanel(null)}>
          <div className="jd-panel">
            <h2 className="jd-panel__title">Comment jouer</h2>
            <ul className="jd-rules">
              <li>Appuie (ou Espace) pour sauter. Garde appuyé pour enchaîner les sauts.</li>
              <li>En vaisseau : maintiens pour monter, lâche pour descendre.</li>
              <li>Trampoline jaune : il te propulse tout seul. Anneau jaune : appuie dedans.</li>
              <li>Les obstacles tombent sur le rythme de la musique.</li>
              <li>Pour passer au quiz de l’anniv de Jibril, il faut finir le niveau d’une traite. Le mode entraînement est dans le menu pause.</li>
            </ul>
            <button type="button" className="jd-btn" onClick={() => setPanel(null)}>
              Compris
            </button>
          </div>
        </div>
      )}

      {phase === 'level' && (
        <div
          className="jd-level-wrap"
          onPointerDown={(e) => {
            if (e.target.closest('button')) return;
            e.preventDefault();
            engineRef.current?.press();
          }}
          onPointerUp={() => engineRef.current?.release()}
          onPointerCancel={() => engineRef.current?.release()}
          onPointerLeave={() => engineRef.current?.release()}
        >
          <canvas ref={canvasRef} className="jd-canvas" aria-label={`Niveau ${LEVEL.name}`} />
          <button type="button" className="jd-pause" onClick={() => engineRef.current?.pause()} aria-label="Pause">
            <span />
            <span />
          </button>
          {paused && (
            <div className="jd-overlay">
              <div className="jd-panel">
                <h2 className="jd-panel__title">Pause</h2>
                <button type="button" className="jd-btn" onClick={resume} autoFocus>
                  Reprendre
                </button>
                <button type="button" className="jd-btn jd-btn--blue" onClick={switchPractice}>
                  {practice ? 'Revenir au mode normal' : 'Mode entraînement'}
                </button>
                <button type="button" className="jd-btn jd-btn--blue" onClick={restart}>
                  Recommencer
                </button>
                <button type="button" className="jd-btn jd-btn--dark" onClick={backToMenu}>
                  Menu
                </button>
                <button type="button" className="jd-textbtn" onClick={toggleMute}>
                  {muted ? 'Activer le son' : 'Couper le son'}
                </button>
              </div>
            </div>
          )}
          {practiceDone && (
            <div className="jd-overlay">
              <div className="jd-panel">
                <h2 className="jd-panel__title">Entraînement réussi !</h2>
                <p className="jd-panel__text">Maintenant, le vrai essai : en mode normal, d’une traite.</p>
                <button type="button" className="jd-btn" onClick={switchPractice} autoFocus>
                  Mode normal
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'results' && result && (
        <div className="jd-overlay jd-overlay--clear">
          <div className="jd-panel jd-panel--win">
            <h2 className="jd-panel__title jd-panel__title--win">NIVEAU TERMINÉ !</h2>
            <dl className="jd-result">
              <div>
                <dt>Tentatives</dt>
                <dd>{result.attempts}</dd>
              </div>
              <div>
                <dt>Sauts</dt>
                <dd>{result.jumps}</dd>
              </div>
              <div>
                <dt>Temps de jeu</dt>
                <dd>{fmtTime(result.playTime || 0)}</dd>
              </div>
            </dl>
            <button type="button" className="jd-btn" onClick={finish} autoFocus>
              Continuer vers le quiz
            </button>
            <button type="button" className="jd-textbtn" onClick={() => setPhase('menu')}>
              Revenir au menu
            </button>
          </div>
        </div>
      )}

      {phase !== 'level' && (
        <button type="button" className="jd-mute" onClick={toggleMute} aria-label={muted ? 'Activer le son' : 'Couper le son'}>
          {muted ? '🔇' : '🔊'}
        </button>
      )}
    </div>
  );
}
