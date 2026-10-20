import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
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
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* Canvas déterministe sur fond blanc pur */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 1
        }}
      />

      {/* Carte centrale épurée */}
      <div className="glass-card" style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '480px',
        width: '100%',
        padding: '40px 32px',
        textAlign: 'center',
        background: '#ffffff',
        border: '1px solid #e4e4e7',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)'
      }}>
        {/* Bulle d'emoji sobre */}
        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          background: '#f4f4f5',
          border: '1px solid #e4e4e7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
          margin: '0 auto 20px'
        }}>
          <span>{guest.emoji || params.mascotEmoji}</span>
        </div>

        {/* Badge Vibe Minimaliste */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: '#f4f4f5',
          border: '1px solid #e4e4e7',
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.78rem',
          color: '#52525b',
          fontWeight: 600,
          marginBottom: '16px'
        }}>
          <Sparkles size={12} color="#09090b" />
          <span>Vibe {params.palette.name}</span>
        </div>

        {/* Message d'accueil */}
        <h1 style={{
          fontSize: 'clamp(1.8rem, 5vw, 2.2rem)',
          fontWeight: 800,
          marginBottom: '10px',
          letterSpacing: '-0.03em',
          color: '#09090b'
        }}>
          Bienvenue {guest.first_name}.
        </h1>

        <p style={{
          fontSize: '1.05rem',
          color: '#52525b',
          marginBottom: '20px',
          fontWeight: 400,
          lineHeight: 1.5
        }}>
          Tu es invité(e) à l'anniversaire de <strong style={{ color: '#09090b', fontWeight: 600 }}>{EVENT_CONFIG.hostName}</strong>.
        </p>

        {/* Indicateur de signature */}
        <div style={{
          fontSize: '0.78rem',
          color: '#a1a1aa',
          fontFamily: 'monospace',
          marginBottom: '28px'
        }}>
          Code vérifié : <span style={{ color: '#09090b', fontWeight: 600 }}>{guest.code}</span>
        </div>

        {/* Barre de progression épurée */}
        <div style={{
          width: '100%',
          height: '4px',
          background: '#f4f4f5',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          marginBottom: '24px'
        }}>
          <div style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: '#09090b',
            transition: 'width 0.1s linear'
          }} />
        </div>

        {/* Bouton pour continuer */}
        <button
          onClick={onComplete}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '13px',
            fontSize: '0.95rem'
          }}
        >
          <span>Continuer vers les questions</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
