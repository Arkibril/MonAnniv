import React, { useEffect, useRef, useState } from 'react';
import { EVENT_CONFIG } from '../config/event';
import { getAnimationParams, startDeterministicCanvas } from '../utils/seedAnimation';
import LenaikIntro from './customIntros/LenaikIntro';

export default function PersonalizedIntro({ guest, onComplete }) {
  // Détection d'intro sur-mesure pour Lénaïk
  const normalizedName = (guest?.first_name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const isLenaik = normalizedName.includes('lenaik') || (guest?.code || '').startsWith('LNAK');

  if (isLenaik) {
    return <LenaikIntro onComplete={onComplete} />;
  }
  return <SeededIntro guest={guest} onComplete={onComplete} />;
}

function SeededIntro({ guest, onComplete }) {
  const canvasRef = useRef(null);
  const [params, setParams] = useState(null);
  const [timeLeft, setTimeLeft] = useState(6.0);
  const TOTAL_DURATION = 6.0;

  useEffect(() => {
    if (!guest) return;
    const computedParams = getAnimationParams(guest.code);
    setParams(computedParams);

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cleanup = startDeterministicCanvas(canvasRef.current, computedParams, prefersReduced);

    const interval = 100;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return Math.max(0, prev - interval / 1000);
      });
    }, interval);

    return () => {
      cleanup();
      clearInterval(timer);
    };
  }, [guest, onComplete]);

  if (!guest || !params) return null;

  const progressPercent = ((TOTAL_DURATION - timeLeft) / TOTAL_DURATION) * 100;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Bienvenue ${guest.first_name}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--gutter)'
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}
      />

      <div
        className="sheet rise-in"
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: 420,
          padding: '40px 28px 28px',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.82)',
          WebkitBackdropFilter: 'saturate(180%) blur(24px)',
          backdropFilter: 'saturate(180%) blur(24px)'
        }}
      >
        <span className="avatar avatar--xl" aria-hidden="true" style={{ background: '#fff', boxShadow: 'var(--shadow-1)' }}>
          {guest.emoji || params.mascotEmoji}
        </span>

        <h1 className="title-1" style={{ marginTop: 22 }}>
          Bienvenue {guest.first_name}.
        </h1>
        <p className="subhead" style={{ marginTop: 8, fontSize: 17 }}>
          Tu es invité(e) à l'anniversaire de {EVENT_CONFIG.hostName}.
        </p>

        <div className="progress" style={{ marginTop: 28 }} aria-hidden="true">
          <div className="progress__fill" style={{ width: `${progressPercent}%`, transition: 'width 0.1s linear' }} />
        </div>

        <button
          type="button"
          onClick={onComplete}
          className="btn btn--filled btn--large btn--block"
          style={{ marginTop: 20 }}
        >
          Répondre aux questions
        </button>
      </div>
    </div>
  );
}
