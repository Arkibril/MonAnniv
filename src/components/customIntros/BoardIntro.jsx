import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EVENT_CONFIG } from '../../config/event';
import { createBoardScene, SQUARES, LAST, DOG_COLORS } from '../../themes/board/scene';
import { sfxWoaf, sfxBoing, sfxLevelComplete, sfxDiceHit, sfxSplash, sfxSparkle, setMuted, isMuted, getAudioGraph } from '../../themes/heist/sound';
import './BoardIntro.css';

// =============================================================================
// Intro de Mathilde & Guillaume : un vrai petit jeu de plateau en 3D
// (three.js, création originale). Leurs deux chiens font la course jusqu'au
// gâteau de l'anniv de Jibril ; on lance le dé chacun son tour.
// =============================================================================

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function BoardIntro({ guest, onComplete }) {
  const host = EVENT_CONFIG.hostName || 'Jibril';
  const names = useMemo(() => {
    const parts = String(guest?.first_name || '')
      .split(/\s*[&+,/]\s*|\s+et\s+/i)
      .map((p) => p.trim())
      .filter(Boolean);
    return parts.length >= 2 ? parts.slice(0, 2) : [parts[0] || 'Toi', host];
  }, [guest, host]);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const alive = useRef(true);
  const doneRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [turn, setTurn] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(`${names[0]}, lance le dé !`);
  const [lastRoll, setLastRoll] = useState(null);
  const [winner, setWinner] = useState(null);
  const [muted, setMutedState] = useState(isMuted());

  useEffect(() => {
    alive.current = true;
    try {
      sceneRef.current = createBoardScene(canvasRef.current, { names });
      sceneRef.current.setActive(0);
      setReady(true);
    } catch (e) {
      // WebGL indisponible : on laisse passer au quiz
      console.error(e);
      setFailed(true);
    }
    return () => {
      alive.current = false;
      sceneRef.current?.destroy();
      sceneRef.current = null;
    };
  }, [names]);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete?.();
  }, [onComplete]);

  async function roll() {
    const sc = sceneRef.current;
    if (!sc || busy || winner !== null) return;
    getAudioGraph();
    setBusy(true);
    const who = turn;
    const v = 1 + Math.floor(Math.random() * 6);
    setMessage(`${names[who]} lance le dé…`);
    await sc.rollDie(v, (strength) => sfxDiceHit(strength));
    if (!alive.current) return;
    setLastRoll(v);
    setMessage(`${names[who]} fait ${v} !`);
    await wait(250);
    let pos = await sc.move(who, v, (k) => sfxBoing(1 + k * 0.07));
    if (!alive.current) return;

    let again = false;
    const sq = SQUARES[pos];
    if (sq.kind === 'bone' || sq.kind === 'bath' || sq.kind === 'ball') {
      setMessage(sq.text);
      if (sq.kind === 'bone') {
        sfxWoaf(0, 1.15);
        sfxSparkle();
        await sc.effect('bone', who);
        pos = await sc.move(who, 2, (k) => sfxBoing(1.2 + k * 0.1));
      } else if (sq.kind === 'bath') {
        sfxSplash();
        sfxWoaf(0.15, 0.7);
        await sc.effect('bath', who);
        pos = await sc.move(who, -2, () => sfxBoing(0.8));
      } else {
        sfxWoaf(0, 1.3);
        await sc.effect('ball', who);
        again = true;
      }
    }
    if (!alive.current) return;
    if (pos >= LAST) {
      setWinner(who);
      setMessage(`${names[who]} arrive au gâteau en premier !`);
      sfxLevelComplete();
      sfxWoaf(0.35, 1.2);
      sfxWoaf(0.6, 1.4);
      sc.celebrate(who);
      setBusy(false);
      return;
    }
    await wait(350);
    sc.overview();
    const next = again ? who : 1 - who;
    sc.setActive(next);
    setTurn(next);
    setMessage(again ? `${names[who]} rejoue !` : `À ${names[next]} de lancer le dé !`);
    setBusy(false);
  }

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };

  return (
    <div className="bd" role="dialog" aria-modal="true" aria-label={`Bienvenue ${names.join(' et ')}`}>
      <canvas ref={canvasRef} className="bd-canvas" aria-label="Plateau de jeu en 3D" />

      <header className="bd-head">
        <h1 className="bd-title">La course à l’anniv</h1>
        <p className="bd-legend">
          {names.map((n, i) => (
            <span key={n} className={`bd-legend__item${turn === i && winner === null ? ' is-turn' : ''}`}>
              <i style={{ background: DOG_COLORS[i].base }} aria-hidden="true" />
              {n}
            </span>
          ))}
        </p>
      </header>

      <div className="bd-controls">
        <p className="bd-msg" aria-live="polite">
          {failed ? `Le plateau 3D ne peut pas s’afficher ici. Pas grave : ${host} vous invite quand même à son anniv !` : message}
        </p>
        {winner === null && !failed ? (
          <button type="button" className="bd-roll" onClick={roll} disabled={busy || !ready} aria-label={`Lancer le dé pour ${names[turn]}`} autoFocus>
            <span className="bd-roll__die" aria-hidden="true">
              {lastRoll ? ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][lastRoll - 1] : '🎲'}
            </span>
            <span>{busy ? 'Ça roule…' : `Lancer le dé (${names[turn]})`}</span>
          </button>
        ) : (
          <div className="bd-win">
            {winner !== null && <p className="bd-win__title">🏆 {names[winner]} gagne !</p>}
            <p className="bd-win__text">Vous êtes invités tous les deux à l’anniv de {host} 🎂</p>
            <button type="button" className="bd-btn" onClick={finish} autoFocus>
              Commencer le quiz
            </button>
          </div>
        )}
      </div>

      <button type="button" className="bd-mute" onClick={toggleMute} aria-label={muted ? 'Activer le son' : 'Couper le son'}>
        {muted ? '🔇' : '🔊'}
      </button>
      {winner === null && (
        <button type="button" className="bd-skip" onClick={finish}>
          Passer
        </button>
      )}
    </div>
  );
}
