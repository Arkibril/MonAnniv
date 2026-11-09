import React, { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { EVENT_CONFIG } from '../../config/event';
import { sfxSparkle, sfxPop, sfxBoing, sfxScratch, startStoryTune, stopStoryTune, startClubBeat, stopClubBeat, getAudioGraph, setMuted, isMuted } from '../../themes/heist/sound';
import './SabrinaIntro.css';

// =============================================================================
// Intro de Sabrina : univers kawaii pastel original, avec "Nuage", une petite
// mascotte inventée pour l'occasion. Elle apporte un cadeau… et dès que
// Sabrina l'ouvre, la vanne : tout part en boîte de nuit techno.
// =============================================================================

function Nuage({ blink, happy }) {
  return (
    <svg className="kw-nuage" viewBox="0 0 220 170" aria-hidden="true">
      <defs>
        <radialGradient id="kw-cloud" cx="40%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ffeaf3" />
        </radialGradient>
      </defs>
      {/* petits bras */}
      <ellipse cx="34" cy="112" rx="14" ry="10" fill="#fff" stroke="#f08cb4" strokeWidth="5" />
      <ellipse cx="186" cy="112" rx="14" ry="10" fill="#fff" stroke="#f08cb4" strokeWidth="5" />
      <path
        d="M52,140 C22,140 18,104 44,98 C40,66 76,52 96,70 C104,40 150,38 160,70 C186,62 206,88 190,106 C212,118 200,144 176,140 Z"
        fill="url(#kw-cloud)"
        stroke="#f08cb4"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      {/* yeux */}
      {blink ? (
        <g fill="none" stroke="#5b3a55" strokeWidth="5" strokeLinecap="round">
          <path d="M80,104 q9,6 18,0" />
          <path d="M126,104 q9,6 18,0" />
        </g>
      ) : happy ? (
        <g fill="none" stroke="#5b3a55" strokeWidth="5" strokeLinecap="round">
          <path d="M80,106 q9,-12 18,0" />
          <path d="M126,106 q9,-12 18,0" />
        </g>
      ) : (
        <g>
          <ellipse cx="89" cy="102" rx="9" ry="12" fill="#5b3a55" />
          <ellipse cx="135" cy="102" rx="9" ry="12" fill="#5b3a55" />
          <circle cx="92" cy="97" r="3.5" fill="#fff" />
          <circle cx="138" cy="97" r="3.5" fill="#fff" />
        </g>
      )}
      <ellipse cx="70" cy="120" rx="11" ry="6.5" fill="#ffb3cf" />
      <ellipse cx="154" cy="120" rx="11" ry="6.5" fill="#ffb3cf" />
      <path d="M104,118 q8,9 16,0" fill="none" stroke="#5b3a55" strokeWidth="4.5" strokeLinecap="round" />
      {/* petite étoile sur le côté */}
      <path d="M176,52 l5,10 11,2 -8,7 2,11 -10,-5 -10,5 2,-11 -8,-7 11,-2 Z" fill="#ffe066" stroke="#f0a83c" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

function Gift({ open }) {
  return (
    <svg className={`kw-gift${open ? ' kw-gift--open' : ''}`} viewBox="0 0 160 150" aria-hidden="true">
      <g className="kw-gift__box">
        <rect x="22" y="62" width="116" height="82" rx="12" fill="#c8b6ff" stroke="#7a5cc4" strokeWidth="5" />
        <rect x="70" y="62" width="20" height="82" fill="#ffd6e7" stroke="#7a5cc4" strokeWidth="4" />
        <circle cx="48" cy="96" r="5" fill="#fff" opacity="0.8" />
        <circle cx="114" cy="120" r="5" fill="#fff" opacity="0.8" />
      </g>
      <g className="kw-gift__lid">
        <rect x="14" y="44" width="132" height="26" rx="10" fill="#b197fc" stroke="#7a5cc4" strokeWidth="5" />
        <rect x="70" y="44" width="20" height="26" fill="#ffd6e7" stroke="#7a5cc4" strokeWidth="4" />
        <path d="M80,44 C60,18 36,26 50,40 C56,46 70,46 80,44 Z" fill="#ff9ec7" stroke="#d6578f" strokeWidth="4" strokeLinejoin="round" />
        <path d="M80,44 C100,18 124,26 110,40 C104,46 90,46 80,44 Z" fill="#ff9ec7" stroke="#d6578f" strokeWidth="4" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

// Boîte de nuit techno (création originale) : boule à facettes, lasers,
// piste LED, foule qui saute en rythme, et Nuage qui danse au milieu de la piste.
const BPM_CLUB = 130;

// Nuage qui danse sur la piste (lunettes de soleil, petits bras en l'air)
function DancingNuage() {
  return (
    <svg className="kw-dancer-nuage" viewBox="0 0 240 230" aria-hidden="true">
      <ellipse className="kw-dn__shadow" cx="120" cy="214" rx="78" ry="12" fill="#000" opacity="0.45" />
      <g className="kw-dn__body">
        <g className="kw-dn__arm kw-dn__arm--l">
          <path d="M58,120 L18,82" stroke="#f08cb4" strokeWidth="18" strokeLinecap="round" />
          <path d="M58,120 L18,82" stroke="#fff" strokeWidth="10" strokeLinecap="round" />
        </g>
        <g className="kw-dn__arm kw-dn__arm--r">
          <path d="M182,120 L222,82" stroke="#f08cb4" strokeWidth="18" strokeLinecap="round" />
          <path d="M182,120 L222,82" stroke="#fff" strokeWidth="10" strokeLinecap="round" />
        </g>
        {/* petits pieds */}
        <ellipse cx="94" cy="200" rx="18" ry="11" fill="#fff" stroke="#f08cb4" strokeWidth="5" />
        <ellipse cx="146" cy="200" rx="18" ry="11" fill="#fff" stroke="#f08cb4" strokeWidth="5" />
        <path
          d="M64,190 C30,190 26,150 56,144 C50,104 92,86 114,108 C124,70 178,68 188,108 C218,98 240,128 222,150 C246,164 232,192 206,190 Z"
          fill="#fff"
          stroke="#f08cb4"
          strokeWidth="7"
          strokeLinejoin="round"
        />
        <rect x="84" y="132" width="32" height="16" rx="5" fill="#111" />
        <rect x="128" y="132" width="32" height="16" rx="5" fill="#111" />
        <rect x="114" y="136" width="16" height="4" fill="#111" />
        <path d="M108,160 q14,14 28,0 Z" fill="#e8596f" stroke="#5b3a55" strokeWidth="4" strokeLinejoin="round" />
        <ellipse cx="74" cy="160" rx="10" ry="6" fill="#ffb3cf" />
        <ellipse cx="170" cy="160" rx="10" ry="6" fill="#ffb3cf" />
      </g>
    </svg>
  );
}

function Dancer({ k }) {
  const arms = k % 3;
  return (
    <svg className="kw-dancer" viewBox="0 0 80 120" style={{ '--k': k }} aria-hidden="true">
      <circle cx="40" cy="24" r="14" />
      <path d="M22,118 C22,74 26,48 40,46 C54,48 58,74 58,118 Z" />
      {arms === 0 && <path d="M28,54 L12,10 M52,54 L68,10" strokeWidth="9" strokeLinecap="round" />}
      {arms === 1 && <path d="M28,54 L10,34 M52,54 L70,8" strokeWidth="9" strokeLinecap="round" />}
      {arms === 2 && <path d="M28,54 L14,6 M52,54 L72,40" strokeWidth="9" strokeLinecap="round" />}
    </svg>
  );
}

function NightClub() {
  return (
    <div className="kw-club" style={{ '--beat': `${60 / BPM_CLUB}s` }} aria-hidden="true">
      <div className="kw-haze" />
      <div className="kw-spots">
        {[0, 1, 2, 3, 4].map((k) => (
          <i key={k} style={{ '--k': k }} />
        ))}
      </div>
      <div className="kw-lasers">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
          <i key={k} style={{ '--k': k }} />
        ))}
      </div>
      <div className="kw-ball">
        <span />
      </div>
      <div className="kw-floor">
        {Array.from({ length: 32 }, (_, k) => (
          <i key={k} style={{ '--k': k, '--c': ['#ff4fd8', '#3ff0ff', '#39ff88', '#ffd43b', '#b14fff'][(k * 7) % 5] }} />
        ))}
      </div>
      <div className="kw-crowd">
        {Array.from({ length: 9 }, (_, k) => (
          <Dancer key={k} k={k} />
        ))}
      </div>
      <div className="kw-spotlight" />
      <div className="kw-dnwrap">
        <DancingNuage />
      </div>
    </div>
  );
}

const SPARKS = Array.from({ length: 22 }, (_, i) => {
  const r = (k) => {
    const v = Math.sin(i * 57.3 + k * 11.7) * 10000;
    return v - Math.floor(v);
  };
  return { x: r(1) * 100, y: r(2) * 100, s: 10 + r(3) * 18, d: r(4) * 3, c: ['#ffffff', '#ffe066', '#ffb3cf', '#b8e0ff'][i % 4], k: i % 3 };
});

export default function SabrinaIntro({ guest, onComplete }) {
  const name = (guest?.first_name || 'Sabrina').trim();
  const host = EVENT_CONFIG.hostName || 'Jibril';
  const [step, setStep] = useState('start'); // start | hello | gift | open | night
  const [cardIn, setCardIn] = useState(false);
  const [blink, setBlink] = useState(false);
  const [muted, setMutedState] = useState(isMuted());
  const rootRef = useRef(null);
  const doneRef = useRef(false);
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(
    () => () => {
      stopStoryTune();
      stopClubBeat();
    },
    []
  );

  // la vanne : juste après l'ouverture du cadeau, tout part en boîte de nuit
  useEffect(() => {
    if (step === 'open') {
      const t = setTimeout(() => {
        stopStoryTune();
        sfxScratch();
        setStep('night');
      }, 1500);
      return () => clearTimeout(t);
    }
    if (step === 'night') {
      startClubBeat();
      const t = setTimeout(() => setCardIn(true), 3600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [step]);
  // clignement des yeux de Nuage
  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    stopStoryTune();
    stopClubBeat();
    onComplete?.();
  }, [onComplete]);

  const begin = () => {
    getAudioGraph();
    startStoryTune();
    sfxSparkle();
    setStep('hello');
  };

  useEffect(() => {
    if (reduced || !rootRef.current) return undefined;
    const ctx = gsap.context(() => {
      if (step === 'hello') {
        gsap.fromTo('.kw-nuage-wrap', { y: -260, scale: 0.6 }, { y: 0, scale: 1, duration: 1.1, ease: 'bounce.out' });
        gsap.fromTo('.kw-bubble', { scale: 0, rotate: -8 }, { scale: 1, rotate: 0, duration: 0.5, ease: 'back.out(2.5)', delay: 1 });
        gsap.to('.kw-nuage-wrap', { y: -10, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.2 });
      }
      if (step === 'gift') {
        gsap.fromTo('.kw-gift', { y: -180, scale: 0.4, rotate: -20 }, { y: 0, scale: 1, rotate: 0, duration: 0.9, ease: 'bounce.out' });
        gsap.to('.kw-gift', { rotate: 4, duration: 0.18, yoyo: true, repeat: -1, repeatDelay: 1.1, delay: 1, ease: 'sine.inOut' });
      }
      if (step === 'open') {
        gsap.fromTo('.kw-burst span', { x: 0, y: 0, scale: 0, opacity: 1 }, {
          x: () => (Math.random() - 0.5) * 420,
          y: () => -80 - Math.random() * 300,
          scale: () => 0.8 + Math.random() * 1.2,
          rotate: () => (Math.random() - 0.5) * 360,
          opacity: 0,
          duration: 1.6,
          ease: 'power2.out',
          stagger: 0.015
        });
      }
    }, rootRef);
    return () => ctx.revert();
  }, [step, reduced]);

  // Nuage dit bonjour puis apporte le cadeau
  useEffect(() => {
    if (step !== 'hello') return undefined;
    const t1 = setTimeout(() => sfxPop(1.3), 1000);
    const t2 = setTimeout(() => {
      sfxBoing(1.2);
      setStep('gift');
    }, 3600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [step]);

  const openGift = () => {
    if (step !== 'gift') return;
    sfxPop(1.6);
    sfxSparkle();
    setStep('open');
  };
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };

  return (
    <div className={`kw kw--${step}`} ref={rootRef} role="dialog" aria-modal="true" aria-label={`Bienvenue ${name}`}>
      <div className="kw-sky" aria-hidden="true">
        {SPARKS.map((sp, i) => (
          <span key={i} className={`kw-spark kw-spark--${sp.k}`} style={{ left: `${sp.x}%`, top: `${sp.y}%`, fontSize: sp.s, color: sp.c, animationDelay: `${sp.d}s` }}>
            {sp.k === 1 ? '♡' : '✦'}
          </span>
        ))}
        <div className="kw-rainbow" />
      </div>

      {step === 'start' && (
        <div className="kw-center">
          <p className="kw-kicker">Une surprise pour</p>
          <h1 className="kw-title">{name}</h1>
          <button type="button" className="kw-btn" onClick={begin} autoFocus>
            Ouvrir la surprise
          </button>
          <p className="kw-hint">Monte le son ✦</p>
        </div>
      )}

      {step !== 'start' && step !== 'night' && (
        <div className="kw-scene">
          <div className="kw-nuage-wrap">
            <div className="kw-bubble" aria-live="polite">
              {step === 'hello' ? `Coucou ${name} ! Moi c’est Nuage ♡` : step === 'gift' ? 'J’ai un cadeau pour toi ! Touche-le ✦' : 'Tadaaa ! ♡'}
            </div>
            <Nuage blink={blink} happy={step === 'open'} />
          </div>

          {(step === 'gift' || step === 'open') && (
            <button type="button" className="kw-giftbtn" onClick={openGift} disabled={step === 'open'} aria-label="Ouvrir le cadeau">
              <Gift open={step === 'open'} />
            </button>
          )}

          {step === 'open' && (
            <div className="kw-burst" aria-hidden="true">
              {Array.from({ length: 34 }, (_, k) => (
                <span key={k} style={{ color: ['#ff8fc0', '#ffd43b', '#b197fc', '#74c0fc', '#8ce99a'][k % 5] }}>
                  {['♡', '✦', '★', '♪'][k % 4]}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 'night' && (
        <>
          <NightClub />
          <p className="kw-night__caption">Et là… ça part en boîte de nuit 🪩</p>
          {cardIn && (
            <div className="kw-night__card">
              <p className="kw-card__kicker">Invitation</p>
              <h2 className="kw-card__title">{host} t’invite à son anniv !</h2>
              <p className="kw-card__text">Réponds au petit quiz pour choisir la date, la ville et le thème de la soirée.</p>
              <button type="button" className="kw-btn" onClick={finish} autoFocus>
                C’est parti 🪩
              </button>
            </div>
          )}
        </>
      )}

      <button type="button" className="kw-mute" onClick={toggleMute} aria-label={muted ? 'Activer le son' : 'Couper le son'}>
        {muted ? '🔇' : '🔊'}
      </button>
      {step !== 'night' && step !== 'start' && (
        <button
          type="button"
          className="kw-skip"
          onClick={() => {
            stopStoryTune();
            setCardIn(true);
            setStep('night');
          }}
        >
          Passer
        </button>
      )}
    </div>
  );
}
