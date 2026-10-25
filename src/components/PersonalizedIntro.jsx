import React, { useEffect, useRef } from 'react';
import { Player } from '@remotion/player';
import gsap from 'gsap';
import { ArrowRight } from 'lucide-react';
import { EVENT_CONFIG } from '../config/event';
import LenaikIntro from './customIntros/LenaikIntro';
import { WelcomeComposition, WELCOME_SIZE } from '../motion/WelcomeComposition';
import { usePrefersReducedMotion } from '../motion/usePrefersReducedMotion';

const AUTO_ADVANCE_S = 8;

export default function PersonalizedIntro({ guest, onComplete }) {
  // Intro sur-mesure pour Lénaïk : on n'y touche pas
  const normalizedName = (guest?.first_name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const isLenaik = normalizedName.includes('lenaik') || (guest?.code || '').startsWith('LNAK');

  if (isLenaik) {
    return <LenaikIntro onComplete={onComplete} />;
  }
  return <WelcomeIntro guest={guest} onComplete={onComplete} />;
}

function WelcomeIntro({ guest, onComplete }) {
  const reduced = usePrefersReducedMotion();
  const bodyRef = useRef(null);
  const timerRef = useRef(null);
  const buttonRef = useRef(null);

  const firstName = guest?.first_name || '';
  const initial = firstName.trim().charAt(0).toUpperCase() || 'J';

  useEffect(() => {
    buttonRef.current?.focus({ preventScroll: true });

    const tl = gsap.timeline();
    if (!reduced && bodyRef.current) {
      tl.from(bodyRef.current.querySelectorAll('[data-rise]'), {
        y: 26,
        opacity: 0,
        duration: 0.8,
        ease: 'expo.out',
        stagger: 0.08,
        delay: 0.9,
        clearProps: 'transform,opacity',
      });
    }

    // Avance automatique, avec une barre qui montre le temps restant
    const bar = gsap.to(timerRef.current, {
      scaleX: 1,
      duration: AUTO_ADVANCE_S,
      ease: 'none',
      onComplete,
    });

    return () => {
      tl.kill();
      bar.kill();
    };
  }, [onComplete, reduced]);

  if (!guest) return null;

  return (
    <div className="welcome" role="dialog" aria-modal="true" aria-label={`Bienvenue ${firstName}`}>
      <div className="welcome__stage" aria-hidden="true">
        <Player
          component={WelcomeComposition}
          inputProps={{ seed: guest.code || firstName, emoji: guest.emoji || '🎉', initial }}
          durationInFrames={WELCOME_SIZE.durationInFrames}
          compositionWidth={WELCOME_SIZE.width}
          compositionHeight={WELCOME_SIZE.height}
          fps={WELCOME_SIZE.fps}
          autoPlay={!reduced}
          loop={false}
          moveToBeginningWhenEnded={false}
          initialFrame={reduced ? WELCOME_SIZE.durationInFrames - 1 : 0}
          controls={false}
          clickToPlay={false}
          doubleClickToFullscreen={false}
          spaceKeyToPlayOrPause={false}
          acknowledgeRemotionLicense
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      <div className="welcome__body" ref={bodyRef}>
        <h1 className="display" data-rise>
          <span className="display__pre">Bienvenue,</span>
          {firstName}.
        </h1>
        <p className="lede" data-rise style={{ margin: '14px auto 0' }}>
          Tu es invité{EVENT_CONFIG.hostGender === 'f' ? 'e' : '(e)'} à l'anniversaire de {EVENT_CONFIG.hostName}. Quelques questions, deux minutes, et tu vois les votes de tout le monde.
        </p>

        <div data-rise style={{ marginTop: 30 }}>
          <button
            ref={buttonRef}
            type="button"
            onClick={onComplete}
            className="btn btn--ink btn--lg btn--block"
            style={{ maxWidth: 400 }}
          >
            Répondre aux questions
            <span className="btn__knob" aria-hidden="true"><ArrowRight size={18} strokeWidth={2.4} /></span>
          </button>
          <div className="welcome__timer" aria-hidden="true">
            <div className="welcome__timer-fill" ref={timerRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
