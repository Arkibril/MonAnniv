import React, { useEffect, useMemo, useRef } from 'react';
import { MISSIONS } from './game/engine';
import { EVENT_CONFIG } from '../../config/event';
import './RomainTracker.css';

// =============================================================================
// Tracker du héros (Romain) : écran de suivi en pixel art, création originale.
// Avatar pixelisé à partir de sa photo, XP du quiz, missions et meilleure
// partie du mini-jeu, équipe, compte à rebours avant la fête.
// =============================================================================

export const romainStatsKey = (guest) => `monanniv_romain_stats_${guest?.id || 'x'}`;

export function saveRomainRun(guest, res, won) {
  try {
    const k = romainStatsKey(guest);
    const cur = JSON.parse(localStorage.getItem(k) || '{}');
    const next = { ...cur, wins: (cur.wins || 0) + (won ? 1 : 0), fails: (cur.fails || 0) + (won ? 0 : 1) };
    if (won && res) {
      const b = cur.best || {};
      next.best = {
        score: Math.max(b.score || 0, res.score || 0),
        kills: Math.max(b.kills || 0, res.kills || 0),
        lives: Math.max(b.lives || 0, res.lives || 0),
        stars: Math.max(b.stars || 0, res.stars || 0),
        reached: true
      };
    }
    localStorage.setItem(k, JSON.stringify(next));
  } catch {
    /* stockage indisponible */
  }
}

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
function firstPartyDate() {
  const m = String(EVENT_CONFIG.datesProposed || '').toLowerCase().match(/(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)/);
  if (!m) return null;
  const month = MONTHS.findIndex((x) => x.normalize('NFD').replace(/[̀-ͯ]/g, '') === m[2].normalize('NFD').replace(/[̀-ͯ]/g, ''));
  const now = new Date();
  let d = new Date(now.getFullYear(), month, Number(m[1]));
  if (d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) d = new Date(now.getFullYear() + 1, month, Number(m[1]));
  return d;
}

// Avatar : la photo réduite à 18 × 18 pixels puis agrandie sans lissage
function PixelAvatar() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const small = document.createElement('canvas');
      small.width = 18;
      small.height = 18;
      const sctx = small.getContext('2d');
      sctx.fillStyle = '#e5212e';
      sctx.fillRect(0, 0, 18, 18);
      const s = Math.min(img.width, img.height);
      sctx.drawImage(img, (img.width - s) / 2, 0, s, s, 1, 1, 16, 16);
      // palette réduite (rouge, noir, blanc et quelques tons) pour l'effet 8 bits
      const data = sctx.getImageData(0, 0, 18, 18);
      for (let i = 0; i < data.data.length; i += 4) {
        for (let k = 0; k < 3; k++) data.data[i + k] = Math.round(data.data[i + k] / 51) * 51;
      }
      sctx.putImageData(data, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(small, 0, 0, c.width, c.height);
    };
    img.src = '/romain/visage.png';
  }, []);
  return <canvas ref={ref} width={108} height={108} className="rt-avatar" aria-label="Avatar pixelisé de Romain" role="img" />;
}

function Bar({ value, segments = 10 }) {
  const full = Math.round(Math.max(0, Math.min(1, value)) * segments);
  return (
    <span className="rt-bar" aria-hidden="true">
      {Array.from({ length: segments }, (_, i) => (
        <i key={i} className={i < full ? 'is-on' : ''} />
      ))}
    </span>
  );
}

export default function RomainTracker({ guest, guests = [], answers = [], totalQuestions = 8 }) {
  const stats = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(romainStatsKey(guest)) || '{}');
    } catch {
      return {};
    }
  }, [guest]);
  const mine = answers.filter((a) => a.guest_id === guest?.id);
  const answeredQ = new Set(mine.map((a) => a.question_id)).size;
  const xp = totalQuestions ? answeredQ / totalQuestions : 0;
  const level = 1 + answeredQ + (stats.best?.stars || 0);
  const answeredGuests = new Set(answers.map((a) => a.guest_id)).size;
  const confirmed = answers.filter((a) => a.question_id === 'q_presence' && a.value === 'yes').length;
  const best = stats.best || {};
  const party = firstPartyDate();
  const days = party ? Math.max(0, Math.ceil((party - new Date()) / 86400000)) : null;
  const missionState = (m) => {
    if (m.id === 'reach') return Boolean(best.reached);
    if (m.id === 'kills') return (best.kills || 0) >= (m.goal || 5);
    return (best.score || 0) >= (m.goal || 10);
  };

  return (
    <section className="rt" aria-labelledby="rt-title" data-rise>
      <div className="rt-head">
        <h2 id="rt-title" className="rt-title">
          Suivi du héros
        </h2>
        <span className="rt-lv">NIV. {level}</span>
      </div>

      <div className="rt-grid">
        <div className="rt-id">
          <PixelAvatar />
          <p className="rt-name">{(guest?.first_name || 'Romain').toUpperCase()}</p>
          <p className="rt-small">Héros de la fête</p>
        </div>

        <div className="rt-stats">
          <p className="rt-row">
            <span>XP DU QUIZ</span>
            <b>
              {answeredQ}/{totalQuestions}
            </b>
          </p>
          <Bar value={xp} />
          <p className="rt-row">
            <span>MISSIONS</span>
            <b>
              {MISSIONS.filter(missionState).length}/{MISSIONS.length}
            </b>
          </p>
          <ul className="rt-missions">
            {MISSIONS.map((m) => (
              <li key={m.id} className={missionState(m) ? 'is-done' : ''}>
                <i aria-hidden="true" />
                {m.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rt-tiles">
        <div className="rt-tile">
          <span>MEILLEURE PARTIE</span>
          <b>{best.reached ? `${'★'.repeat(best.stars || 1)}${'☆'.repeat(3 - (best.stars || 1))}` : '---'}</b>
          <small>{best.reached ? `${best.score || 0} objets · ${best.kills || 0} drones` : 'Pas encore gagnée'}</small>
        </div>
        <div className="rt-tile">
          <span>PARTIES</span>
          <b>{(stats.wins || 0) + (stats.fails || 0)}</b>
          <small>
            {stats.wins || 0} gagnée{(stats.wins || 0) > 1 ? 's' : ''} · {stats.fails || 0} ratée{(stats.fails || 0) > 1 ? 's' : ''}
          </small>
        </div>
        <div className="rt-tile">
          <span>ÉQUIPE</span>
          <b>
            {answeredGuests}/{guests.length || '?'}
          </b>
          <small>
            ont répondu · {confirmed} confirmé{confirmed > 1 ? 's' : ''}
          </small>
        </div>
        <div className="rt-tile rt-tile--red">
          <span>AVANT LA FÊTE</span>
          <b>{days === null ? '?' : `J-${days}`}</b>
          <small>si c’est le 1er week-end proposé</small>
        </div>
      </div>
    </section>
  );
}
