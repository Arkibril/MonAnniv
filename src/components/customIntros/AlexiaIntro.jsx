import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { QUESTIONS } from '../../config/questions';
import { EVENT_CONFIG } from '../../config/event';
import HeistPoster from '../../themes/heist/HeistPoster';
import FranceMap from '../../themes/heist/FranceMap';
import {
  sfxMove, sfxTab, sfxSelect, sfxBack, sfxMissionStart,
  startAmbience, stopAmbience, setMuted, isMuted
} from '../../themes/heist/sound';
import './AlexiaIntro.css';

// =============================================================================
// Intro d'Alexia : façon menu de jeu en monde ouvert (création originale).
// 1. Écran de chargement illustré + astuces
// 2. Menu pause : onglets Mission / Carte / Réglages, liste à gauche,
//    détail à droite, navigation tactile, souris ou clavier (↑ ↓ ← → Entrée)
// 3. Carton de lancement de mission, puis le quiz (lui aussi en mode jeu)
// =============================================================================

const TIPS = [
  'Le vendredi 25 décembre est férié : de quoi faire un week-end prolongé.',
  'La soirée aura lieu à Paris ou à Strasbourg. C\'est toi qui votes.',
  'Chaque réponse s\'enregistre toute seule, tu peux revenir dessus plus tard.',
  'Le thème de la soirée se décide aussi au vote.'
];
const LOAD_MS = 3200;
const DAYS = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);
  return `${DAYS[now.getDay()]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export default function AlexiaIntro({ guest, onComplete, isReplay = false }) {
  const rootRef = useRef(null);
  const doneRef = useRef(false);
  const [phase, setPhase] = useState('loading'); // loading | menu | launch
  const [loaded, setLoaded] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [tab, setTab] = useState(0);
  const [row, setRow] = useState(0);
  const [muted, setMutedState] = useState(isMuted());
  const clock = useClock();
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const name = guest?.first_name || 'Alexia';
  const host = EVENT_CONFIG.hostName || 'Jibril';
  const total = QUESTIONS.length;

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    stopAmbience();
    onComplete?.();
  }, [onComplete]);

  useEffect(() => () => stopAmbience(), []);

  // --- 1. Chargement ---------------------------------------------------------
  useEffect(() => {
    if (phase !== 'loading') return undefined;
    const done = setTimeout(() => setLoaded(true), reduced ? 600 : LOAD_MS);
    const tips = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 2600);
    return () => {
      clearTimeout(done);
      clearInterval(tips);
    };
  }, [phase, reduced]);

  useLayoutEffect(() => {
    if (phase !== 'loading' || reduced) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo('.hx-poster', { scale: 1.12 }, { scale: 1, duration: 6, ease: 'power2.out' });
      gsap.from('.hx-lockup > *', { yPercent: 60, autoAlpha: 0, duration: 0.9, ease: 'expo.out', stagger: 0.1, delay: 0.4 });
      gsap.from('.hx-loadbar', { autoAlpha: 0, duration: 0.5, delay: 0.2 });
    }, rootRef);
    return () => ctx.revert();
  }, [phase, reduced]);

  const enterMenu = useCallback(() => {
    if (phase !== 'loading' || !loaded) return;
    sfxSelect();
    startAmbience();
    setPhase('menu');
  }, [phase, loaded]);

  // --- 2. Menu ---------------------------------------------------------------
  const tabs = ['Mission', 'Carte', 'Réglages'];

  const launch = useCallback(() => {
    sfxMissionStart();
    stopAmbience();
    setPhase('launch');
  }, []);

  const toggleSound = useCallback(() => {
    const next = !isMuted();
    setMuted(next);
    setMutedState(next);
    if (!next) sfxSelect();
  }, []);

  const replayLoading = useCallback(() => {
    sfxBack();
    stopAmbience();
    setLoaded(false);
    setRow(0);
    setTab(0);
    setPhase('loading');
  }, []);

  const lists = useMemo(
    () => [
      [
        { id: 'launch', label: isReplay ? 'Retour au jeu' : 'Lancer la mission', action: isReplay ? finish : launch, primary: true },
        { id: 'goals', label: 'Objectifs' },
        { id: 'infos', label: 'Infos de la soirée' }
      ],
      [{ id: 'map', label: 'Lieux au vote' }],
      [
        { id: 'sound', label: `Son : ${muted ? 'coupé' : 'activé'}`, action: toggleSound },
        { id: 'reload', label: 'Revoir le chargement', action: replayLoading }
      ]
    ],
    [isReplay, finish, launch, muted, toggleSound, replayLoading]
  );
  const items = lists[tab];
  const current = items[Math.min(row, items.length - 1)];

  const changeTab = useCallback((next) => {
    sfxTab();
    setTab((next + tabs.length) % tabs.length);
    setRow(0);
  }, [tabs.length]);

  const activate = useCallback((item) => {
    if (!item) return;
    if (item.action) {
      if (item.id !== 'sound' && item.id !== 'reload') sfxSelect();
      item.action();
    } else {
      sfxMove();
    }
  }, []);

  // Clavier
  useEffect(() => {
    const onKey = (e) => {
      if (phase === 'loading') {
        if (['Enter', ' ', 'Spacebar'].includes(e.key)) {
          e.preventDefault();
          enterMenu();
        }
        return;
      }
      if (phase !== 'menu') return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        sfxMove();
        setRow((r) => (r + 1) % items.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        sfxMove();
        setRow((r) => (r - 1 + items.length) % items.length);
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'e') {
        changeTab(tab + 1);
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'q') {
        changeTab(tab - 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        activate(current);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, items.length, tab, current, enterMenu, changeTab, activate]);

  // Entrée du menu
  useLayoutEffect(() => {
    if (phase !== 'menu') return undefined;
    rootRef.current?.querySelector('.hx-item--active')?.focus({ preventScroll: true });
    if (reduced) return undefined;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.from('.hx-menu-dim', { autoAlpha: 0, duration: 0.35, ease: 'power1.out' })
        .from('.hx-head', { y: -18, autoAlpha: 0, duration: 0.45, ease: 'expo.out' }, 0.05)
        .from('.hx-tab', { y: -10, autoAlpha: 0, duration: 0.35, ease: 'expo.out', stagger: 0.05 }, 0.15)
        .from('.hx-item', { x: -16, autoAlpha: 0, duration: 0.35, ease: 'expo.out', stagger: 0.04 }, 0.25)
        .from('.hx-detail', { autoAlpha: 0, duration: 0.4, ease: 'power1.out' }, 0.3)
        .from('.hx-hints', { autoAlpha: 0, duration: 0.3 }, 0.45);
    }, rootRef);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Changement d'onglet : le panneau de détail glisse légèrement
  useLayoutEffect(() => {
    if (phase !== 'menu' || reduced) return;
    const el = rootRef.current?.querySelector('.hx-detail');
    if (el) gsap.fromTo(el, { x: 12, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.3, ease: 'expo.out' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, current?.id]);

  // --- 3. Lancement de mission ------------------------------------------------
  useLayoutEffect(() => {
    if (phase !== 'launch') return undefined;
    if (reduced) {
      const t = setTimeout(finish, 1400);
      return () => clearTimeout(t);
    }
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: finish });
      tl.fromTo('.hx-launch-flash', { autoAlpha: 0.9 }, { autoAlpha: 0, duration: 0.5, ease: 'power2.out' })
        .from('.hx-launch-rule', { scaleX: 0, duration: 0.6, ease: 'expo.out', stagger: 0.06 }, 0.1)
        .from('.hx-launch-title', { yPercent: 40, autoAlpha: 0, letterSpacing: '0.2em', duration: 0.9, ease: 'expo.out' }, 0.15)
        .from('.hx-launch-sub', { autoAlpha: 0, y: 8, duration: 0.5, ease: 'expo.out' }, 0.55)
        .to('.hx-launch', { autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, 2.6);
    }, rootRef);
    return () => ctx.revert();
  }, [phase, reduced, finish]);

  // --- Rendu ---------------------------------------------------------------
  const detail = (() => {
    if (tab === 1) {
      return (
        <div className="hx-panel hx-panel--map">
          <FranceMap />
          <p className="hx-panel-foot">Deux destinations possibles. La plus votée l'emporte.</p>
        </div>
      );
    }
    if (tab === 2) {
      return (
        <div className="hx-panel">
          <h2 className="hx-panel-title">Réglages</h2>
          <p className="hx-panel-text">
            {current?.id === 'sound'
              ? 'Les sons du menu sont créés en direct par ton navigateur. Coupe-les si tu es en public.'
              : 'Relance l\'écran de chargement depuis le début.'}
          </p>
        </div>
      );
    }
    if (current?.id === 'goals') {
      return (
        <div className="hx-panel">
          <h2 className="hx-panel-title">Objectifs</h2>
          <ul className="hx-goals">
            <li>Choisir le week-end de la fête</li>
            <li>Voter pour la ville et le thème</li>
            <li>Confirmer ta présence</li>
            <li>Laisser un message à {host} (facultatif)</li>
          </ul>
        </div>
      );
    }
    if (current?.id === 'infos') {
      return (
        <div className="hx-panel">
          <h2 className="hx-panel-title">Infos de la soirée</h2>
          <dl className="hx-table">
            <div><dt>Hôte</dt><dd>{host}</dd></div>
            <div><dt>Dates</dt><dd>19 déc., 25 déc. ou 1er janv.</dd></div>
            <div><dt>Lieu</dt><dd>Paris ou Strasbourg</dd></div>
            <div><dt>Thème</dt><dd>Au vote</dd></div>
          </dl>
        </div>
      );
    }
    return (
      <div className="hx-panel hx-panel--mission">
        <p className="hx-kicker">Mission principale</p>
        <h2 className="hx-panel-title hx-panel-title--big">La fête de {host}</h2>
        <p className="hx-panel-text">
          {isReplay
            ? 'Tes réponses sont déjà enregistrées. Tu peux les modifier depuis le tableau de bord.'
            : `Réponds aux ${total} questions pour choisir la date, la ville et le thème. Compte une minute, tout s'enregistre au fur et à mesure.`}
        </p>
        <dl className="hx-table">
          <div><dt>Questions</dt><dd>{total}</dd></div>
          <div><dt>Durée</dt><dd>1 min environ</dd></div>
          <div><dt>Récompense</dt><dd className="hx-cash">25 122 $</dd></div>
        </dl>
      </div>
    );
  })();

  return (
    <div
      ref={rootRef}
      className="hx-intro"
      data-phase={phase}
      role="dialog"
      aria-modal="true"
      aria-label={`Invitation de ${host} pour ${name}`}
      onClick={phase === 'loading' ? enterMenu : undefined}
    >
      {/* Fond illustré (reste flouté derrière le menu) */}
      <div className={`hx-bg ${phase !== 'loading' ? 'hx-bg--dim' : ''}`}>
        <HeistPoster />
      </div>

      {phase === 'loading' && (
        <div className="hx-load">
          <div className="hx-lockup">
            <p className="hx-lockup-pre">Une invitation de {host}</p>
            <h1 className="hx-lockup-name">{name}</h1>
            <p className="hx-lockup-post">L'anniversaire · Hiver 2026</p>
          </div>

          <div className="hx-loadbar">
            <p className="hx-tip" aria-live="polite">
              <span className="hx-tip-label">Astuce</span> {TIPS[tipIndex]}
            </p>
            {loaded ? (
              <button type="button" className="hx-press" onClick={enterMenu} autoFocus>
                <span className="hx-key" aria-hidden="true">⏎</span>
                Appuie pour continuer
              </button>
            ) : (
              <span className="hx-loading">
                <span className="hx-spinner" aria-hidden="true" />
                Chargement
              </span>
            )}
          </div>
        </div>
      )}

      {phase === 'menu' && (
        <div className="hx-menu">
          <div className="hx-menu-dim" />
          <div className="hx-menu-inner">
            <header className="hx-head">
              <h1 className="hx-head-name">{name}</h1>
              <div className="hx-head-info">
                <span>{clock}</span>
                <span>
                  Banque <b className="hx-cash">25 122 $</b>
                </span>
              </div>
            </header>

            <div className="hx-tabs" role="tablist" aria-label="Sections du menu">
              {tabs.map((t, i) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === i}
                  className="hx-tab"
                  onClick={() => tab !== i && changeTab(i)}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="hx-body">
              <ul className="hx-list" role="menu" aria-label={tabs[tab]}>
                {items.map((it, i) => (
                  <li key={it.id} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className={`hx-item ${i === row ? 'hx-item--active' : ''} ${it.primary ? 'hx-item--primary' : ''}`}
                      onMouseEnter={() => i !== row && (sfxMove(), setRow(i))}
                      onFocus={() => setRow(i)}
                      onClick={() => {
                        setRow(i);
                        activate(it);
                      }}
                    >
                      <span>{it.label}</span>
                      {it.primary && <span className="hx-item-go" aria-hidden="true">▶</span>}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="hx-detail">{detail}</div>
            </div>

            <div className="hx-hints" aria-hidden="true">
              <span><kbd>⏎</kbd> Sélectionner</span>
              <span><kbd>↑</kbd><kbd>↓</kbd> Naviguer</span>
              <span><kbd>←</kbd><kbd>→</kbd> Onglets</span>
            </div>
          </div>
        </div>
      )}

      {phase === 'launch' && (
        <div className="hx-launch" aria-live="assertive">
          <div className="hx-launch-flash" />
          <span className="hx-launch-rule" />
          <h1 className="hx-launch-title">La fête de {host}</h1>
          <span className="hx-launch-rule" />
          <p className="hx-launch-sub">Objectif : réponds aux {total} questions</p>
        </div>
      )}
    </div>
  );
}
