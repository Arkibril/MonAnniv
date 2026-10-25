import React, { useEffect, useRef, useState } from 'react';
import { Player } from '@remotion/player';
import gsap from 'gsap';
import { AlertCircle, ArrowRight, UserRound } from 'lucide-react';
import { EVENT_CONFIG } from '../config/event';
import { isSupabaseConfigured } from '../lib/supabase';
import { MosaicComposition, MOSAIC_SIZE } from '../motion/MosaicComposition';
import { usePrefersReducedMotion } from '../motion/usePrefersReducedMotion';

export default function CodeLogin({ onLoginSuccess, isLoggingIn }) {
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const bodyRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  // Entrée : le texte monte sous la mosaïque, élément par élément
  useEffect(() => {
    if (reduced || !bodyRef.current) return;
    const items = bodyRef.current.querySelectorAll('[data-rise]');
    const tween = gsap.from(items, {
      y: 22,
      opacity: 0,
      duration: 0.7,
      ease: 'expo.out',
      stagger: 0.07,
      delay: 0.1,
      clearProps: 'transform,opacity',
    });
    return () => tween.kill();
  }, [reduced]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      triggerError('Écris ton prénom pour ouvrir ton invitation.');
      return;
    }
    try {
      setErrorMessage('');
      await onLoginSuccess(code.trim());
    } catch (err) {
      triggerError(err.message || 'Prénom introuvable. Vérifie l\'orthographe.');
    }
  };

  const triggerError = (msg) => {
    setErrorMessage(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 440);
  };

  return (
    <div className="login">
      <div className="login__stage" aria-hidden="true">
        <Player
          component={MosaicComposition}
          durationInFrames={MOSAIC_SIZE.durationInFrames}
          compositionWidth={MOSAIC_SIZE.width}
          compositionHeight={MOSAIC_SIZE.height}
          fps={MOSAIC_SIZE.fps}
          autoPlay={!reduced}
          loop
          controls={false}
          clickToPlay={false}
          doubleClickToFullscreen={false}
          spaceKeyToPlayOrPause={false}
          initialFrame={reduced ? 60 : 0}
          acknowledgeRemotionLicense
          style={{ width: '100%', height: '100%' }}
        />
        <div className="login__stage-fade" />
      </div>

      <div className="login__body" ref={bodyRef}>
        <h1 className="display" data-rise>
          <span className="display__pre">L'anniversaire de</span>
          {EVENT_CONFIG.hostName}.
        </h1>
        <p className="lede" data-rise style={{ marginTop: 14 }}>
          Trois week-ends, deux villes, une soirée. Dis-nous ce qui te va et suis les votes en direct.
        </p>

        <form onSubmit={handleSubmit} noValidate style={{ marginTop: 30 }} data-rise>
          <label htmlFor="guest-code-input" className="sr-only">Ton prénom</label>
          <div className={`askbar ${errorMessage ? 'askbar--invalid' : ''} ${isShaking ? 'shake' : ''}`}>
            <UserRound size={20} className="askbar__icon" aria-hidden="true" />
            <input
              id="guest-code-input"
              className="askbar__input"
              type="text"
              autoComplete="given-name"
              autoCapitalize="words"
              spellCheck="false"
              enterKeyHint="go"
              placeholder="Ton prénom"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={errorMessage ? 'guest-code-error' : 'guest-code-hint'}
              maxLength={40}
              disabled={isLoggingIn}
            />
            <button
              id="guest-login-btn"
              type="submit"
              className="askbar__go"
              disabled={isLoggingIn || !code.trim()}
              aria-label="Ouvrir mon invitation"
            >
              <ArrowRight size={22} strokeWidth={2.4} className={isLoggingIn ? 'animate-spin' : ''} aria-hidden="true" />
            </button>
          </div>

          {errorMessage ? (
            <p id="guest-code-error" className="field-msg" role="alert">
              <AlertCircle size={16} aria-hidden="true" />
              <span>{errorMessage}</span>
            </p>
          ) : (
            <p id="guest-code-hint" className="field-hint">
              Majuscules et accents, peu importe.
            </p>
          )}
        </form>

        <div className="chips" data-rise style={{ marginTop: 26 }} aria-label="Au programme">
          <span className="chip chip--soft">🗓️ 19 déc. · 25 déc. · 1er janv.</span>
          <span className="chip chip--soft">📍 Paris ou Strasbourg</span>
        </div>

        {!isSupabaseConfigured && (
          <div data-rise style={{ marginTop: 28 }}>
            <p className="caption" style={{ padding: '0 2px 10px' }}>Prénoms de démonstration</p>
            <div className="chips">
              {['Camille', 'Thomas', 'Sarah'].map((c) => (
                <button
                  key={c}
                  type="button"
                  className="chip"
                  onClick={() => { setCode(c); setErrorMessage(''); }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
