import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { TROLL_QUESTIONS } from '../../config/erayTroll';
import { Flag, Doner, Durum, Nazar, Cay } from '../../themes/kebab/art';
import { startMusic, setMuted, isMuted } from '../../themes/heist/sound';

// Musique de fond optionnelle d'Eray : fichier déposé dans public/eray/musique.mp3
const ERAY_MUSIC = '/eray/musique.mp3';
import './ErayIntro.css';

// =============================================================================
// Intro troll d'Eray, entièrement en turc :
// 1. Accueil kitsch : bandeau défilant, drapeau, döner qui tourne, pluie de kebabs
// 2. Faux quiz (Evet / Hayır). Mauvaise réponse → "Yazıklar olsun!" puis Google
// 3. Test réussi → confettis rouge et blanc → le vrai quiz (lui aussi en turc)
// =============================================================================

export const trollPassedKey = (guest) => `monanniv_troll_ok_${guest?.id || 'eray'}`;

const MARQUEE = '🇹🇷 HOŞ GELDİN {NAME} 🇹🇷 KEBAP · ÇAY · BAKLAVA · LAHMACUN · AYRAN · SİMİT · 🥙 · ';
const RAIN = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i * 0.73) % 6,
  duration: 6 + ((i * 1.7) % 4),
  kind: i % 3,
  size: 46 + ((i * 13) % 34)
}));

export default function ErayIntro({ guest, onComplete, isReplay = false }) {
  const rootRef = useRef(null);
  const doneRef = useRef(false);
  const [phase, setPhase] = useState('welcome'); // welcome | quiz | shame | passed
  const [index, setIndex] = useState(0);
  const [reaction, setReaction] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [shameQ, setShameQ] = useState(null);
  const [musicOn, setMusicOn] = useState(false);
  const [muted, setMutedState] = useState(isMuted());
  const lockRef = useRef(false);
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );
  const name = (guest?.first_name || 'Eray').toLocaleUpperCase('tr-TR');
  const total = TROLL_QUESTIONS.length;
  const q = TROLL_QUESTIONS[index];

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete?.();
  }, [onComplete]);

  // Entrées d'écran
  useLayoutEffect(() => {
    if (reduced) return undefined;
    const ctx = gsap.context(() => {
      if (phase === 'welcome') {
        gsap.from('.kb-hero > *', { y: 30, autoAlpha: 0, duration: 0.6, ease: 'back.out(2)', stagger: 0.09, delay: 0.15 });
        gsap.from('.kb-stamp', { scale: 2.4, rotate: -40, autoAlpha: 0, duration: 0.5, ease: 'back.out(1.6)', delay: 0.9 });
      }
      if (phase === 'shame') {
        gsap.from('.kb-shame-title', { scale: 3, autoAlpha: 0, duration: 0.45, ease: 'back.out(1.8)' });
        gsap.to('.kb-shame-title', { x: 6, repeat: 9, yoyo: true, duration: 0.05, ease: 'none', delay: 0.45 });
      }
      if (phase === 'passed') {
        gsap.from('.kb-passed > *', { y: 24, autoAlpha: 0, duration: 0.6, ease: 'back.out(2)', stagger: 0.1 });
      }
    }, rootRef);
    return () => ctx.revert();
  }, [phase, reduced]);

  // Nouvelle question
  useLayoutEffect(() => {
    if (phase !== 'quiz' || reduced) return undefined;
    const ctx = gsap.context(() => {
      gsap.from('.kb-q-card', { scale: 0.85, rotate: index % 2 ? 3 : -3, autoAlpha: 0, duration: 0.45, ease: 'back.out(2)' });
    }, rootRef);
    return () => ctx.revert();
  }, [phase, index, reduced]);

  // Honte : compte à rebours puis Google
  useEffect(() => {
    if (phase !== 'shame') return undefined;
    if (countdown <= 0) {
      const url = `https://www.google.com/search?q=${encodeURIComponent(shameQ?.search || 'nasıl türk olunur')}`;
      window.location.href = url;
      return undefined;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown, shameQ]);

  const fireConfetti = () => {
    if (reduced) return;
    const colors = ['#E30A17', '#ffffff', '#E30A17'];
    confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 }, colors });
    setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors }), 200);
    setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors }), 350);
  };

  const answer = (value) => {
    if (lockRef.current) return;
    if (q.wrong && value === q.wrong) {
      setShameQ(q);
      setCountdown(5);
      setPhase('shame');
      return;
    }
    lockRef.current = true;
    setReaction(value === 'yes' ? q.yes : q.no || q.yes);
    setTimeout(() => {
      setReaction('');
      lockRef.current = false;
      if (index + 1 < total) {
        setIndex(index + 1);
      } else {
        try {
          localStorage.setItem(trollPassedKey(guest), '1');
        } catch {
          /* stockage indisponible */
        }
        setPhase('passed');
        fireConfetti();
      }
    }, reduced ? 700 : 1150);
  };

  return (
    <div ref={rootRef} className="kb-intro" data-phase={phase} role="dialog" aria-modal="true" aria-label={`${name} için Türklük testi`}>
      {/* Bandeau qui défile */}
      <div className="kb-marquee" aria-hidden="true">
        <div className="kb-marquee-track">
          {[0, 1].map((k) => (
            <span key={k}>{MARQUEE.replace('{NAME}', name).repeat(3)}</span>
          ))}
        </div>
      </div>

      {musicOn && (
        <button
          type="button"
          className="kb-mute"
          aria-label={muted ? 'Sesi aç' : 'Sesi kapat'}
          onClick={() => {
            const next = !isMuted();
            setMuted(next);
            setMutedState(next);
          }}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      )}

      {/* Pluie de kebabs */}
      {!reduced && phase !== 'shame' && (
        <div className="kb-rain" aria-hidden="true">
          {RAIN.map((r, i) => (
            <span
              key={i}
              className="kb-drop"
              style={{ left: `${r.left}%`, animationDelay: `${r.delay}s`, animationDuration: `${r.duration}s` }}
            >
              {r.kind === 0 ? <Doner size={r.size * 0.7} /> : r.kind === 1 ? <Durum size={r.size * 0.7} /> : <Nazar size={r.size * 0.55} />}
            </span>
          ))}
        </div>
      )}

      {phase === 'welcome' && (
        <div className="kb-screen">
          <div className="kb-hero">
            <Flag size={150} wave />
            <h1 className="kb-title">
              HOŞ GELDİN
              <br />
              {name}!
            </h1>
            <div className="kb-spit">
              <Doner size={130} />
            </div>
            <p className="kb-text">
              Bu siteye sadece <b>gerçek Türkler</b> girebilir.
              <br />
              Önce Türklük testini geçmen lazım kanka.
            </p>
            <button
              type="button"
              className="kb-btn"
              onClick={() => {
                // le clic autorise le son : musique de fond si le fichier existe
                startMusic(ERAY_MUSIC).then(setMusicOn);
                setPhase('quiz');
              }}
              autoFocus
            >
              TESTE BAŞLA 🥙
            </button>
          </div>
          <div className="kb-stamp" aria-hidden="true">
            KEBAP KALİTE
            <br />
            KONTROL ONAYLI ✅
          </div>
          <Cay size={64} className="kb-deco kb-deco--cay" />
          <Nazar size={70} className="kb-deco kb-deco--nazar" />
          <Durum size={92} className="kb-deco kb-deco--durum" />
        </div>
      )}

      {phase === 'quiz' && (
        <div className="kb-screen">
          <div className="kb-q-card" key={q.id}>
            <p className="kb-q-count">
              SORU {index + 1} / {total}
              <span className="kb-q-dots" aria-hidden="true">
                {TROLL_QUESTIONS.map((_, i) => (
                  <span key={i} className={i <= index ? 'is-on' : ''}>🥙</span>
                ))}
              </span>
            </p>
            <h2 className="kb-q-title">{q.question}</h2>
            {reaction ? (
              <p className="kb-reaction" role="status">{reaction}</p>
            ) : (
              <div className="kb-answers">
                <button type="button" className="kb-btn kb-btn--yes" onClick={() => answer('yes')}>
                  EVET ✅
                </button>
                <button type="button" className="kb-btn kb-btn--no" onClick={() => answer('no')}>
                  HAYIR ❌
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {phase === 'shame' && (
        <div className="kb-screen kb-shame" role="alert">
          <h1 className="kb-shame-title">YAZIKLAR OLSUN!</h1>
          <p className="kb-shame-text">{shameQ?.shame}</p>
          <p className="kb-shame-text">REZALET. 🤦‍♂️</p>
          <p className="kb-shame-count">
            Google'a yönlendiriliyorsun… <b>{countdown}</b>
          </p>
        </div>
      )}

      {phase === 'passed' && (
        <div className="kb-screen">
          <div className="kb-passed">
            <Flag size={130} wave />
            <h1 className="kb-title">TEBRİKLER {name}!</h1>
            <p className="kb-text">
              Türklüğün resmen onaylandı: <b>%100 TÜRK</b> 🇹🇷
              <br />
              Şimdi gerçek sorular geliyor. Bu sefer ciddiyiz.
            </p>
            <button type="button" className="kb-btn" onClick={finish} autoFocus>
              {isReplay ? 'PANELE DÖN' : 'GERÇEK QUİZE GEÇ'} ➜
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
