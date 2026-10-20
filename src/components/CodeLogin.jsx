import React, { useState } from 'react';
import { KeyRound, ArrowRight, AlertCircle, Info, Sparkles } from 'lucide-react';
import { EVENT_CONFIG } from '../config/event';
import { isSupabaseConfigured } from '../lib/supabase';

export default function CodeLogin({ onLoginSuccess, isLoggingIn }) {
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      triggerError('Saisis ton code d\'accès pour continuer.');
      return;
    }

    try {
      setErrorMessage('');
      await onLoginSuccess(code.trim());
    } catch (err) {
      triggerError(err.message || 'Code incorrect. Vérifie les majuscules et le tiret.');
    }
  };

  const triggerError = (msg) => {
    setErrorMessage(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  const fillDemoCode = (demoCode) => {
    setCode(demoCode);
    setErrorMessage('');
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      background: '#ffffff'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px'
      }}>
        {/* En-tête épuré */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '16px'
          }} className="badge-pill">
            <Sparkles size={12} color="#09090b" />
            <span>Invitation Privée</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 2.5rem)',
            fontWeight: 800,
            marginBottom: '10px',
            letterSpacing: '-0.03em',
            color: '#09090b'
          }}>
            L'Anniversaire d'{EVENT_CONFIG.hostName}.
          </h1>

          <p style={{
            color: 'var(--text-muted)',
            fontSize: '0.95rem',
            maxWidth: '360px',
            margin: '0 auto',
            lineHeight: 1.5
          }}>
            {EVENT_CONFIG.subtitle}
          </p>
        </div>

        {/* Carte blanche épurée */}
        <div className={`glass-card ${isShaking ? 'animate-shake' : ''}`} style={{
          padding: '36px 28px',
          background: '#ffffff',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#09090b'
              }}>
                <KeyRound size={22} />
              </div>

              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px', color: '#09090b' }}>
                Entre ton code d'accès
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Reçu personnellement par SMS ou WhatsApp
              </p>
            </div>

            {/* Champ Code épuré */}
            <div style={{ marginBottom: '20px' }}>
              <input
                id="guest-code-input"
                type="text"
                autoComplete="off"
                spellCheck="false"
                placeholder="EX: LUNA-4821"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="input-code"
                maxLength={16}
                disabled={isLoggingIn}
                autoFocus
              />
            </div>

            {/* Message d'erreur discret */}
            {errorMessage && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Bouton Noir Pur */}
            <button
              id="guest-login-btn"
              type="submit"
              disabled={isLoggingIn || !code.trim()}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '0.98rem' }}
            >
              {isLoggingIn ? (
                <span>Vérification...</span>
              ) : (
                <>
                  <span>Découvrir mon invitation</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Raccourcis codes de test */}
          {!isSupabaseConfigured && (
            <div style={{
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-light)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}>
                <Info size={13} color="#71717a" />
                <span>Codes de test disponibles :</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {['CAMILLE-1024', 'THOMAS-8492', 'SARAH-3912'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => fillDemoCode(c)}
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-light)',
                      color: '#09090b',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      fontWeight: 500
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Note minimale */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '0.78rem',
          color: 'var(--text-dim)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <span>Pas d'email ni mot de passe</span>
          <span>•</span>
          <span>Accès privé et sécurisé</span>
        </div>
      </div>
    </div>
  );
}
