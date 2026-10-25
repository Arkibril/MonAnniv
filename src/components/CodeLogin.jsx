import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { EVENT_CONFIG } from '../config/event';
import { isSupabaseConfigured } from '../lib/supabase';

export default function CodeLogin({ onLoginSuccess, isLoggingIn }) {
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);

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
    setTimeout(() => setIsShaking(false), 420);
  };

  return (
    <div className="page page--center">
      <div style={{ width: '100%', maxWidth: 440, margin: '0 auto' }}>
        <h1 className="large-title rise-in">
          L'anniversaire<br />de {EVENT_CONFIG.hostName}.
        </h1>
        <p className="lede rise-in rise-in--d1" style={{ marginTop: 14 }}>
          {EVENT_CONFIG.datesProposed}. {EVENT_CONFIG.locationHint}.
        </p>

        <form onSubmit={handleSubmit} noValidate className="rise-in rise-in--d2" style={{ marginTop: 40 }}>
          <label htmlFor="guest-code-input" className="headline" style={{ display: 'block', padding: '0 4px 8px' }}>
            Ton prénom
          </label>
          <div className={isShaking ? 'animate-shake' : ''}>
            <input
              id="guest-code-input"
              type="text"
              autoComplete="given-name"
              autoCapitalize="words"
              spellCheck="false"
              enterKeyHint="go"
              placeholder="Ex. Lénaïk"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              className={`field ${errorMessage ? 'field--invalid' : ''}`}
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={errorMessage ? 'guest-code-error' : 'guest-code-hint'}
              maxLength={40}
              disabled={isLoggingIn}
              autoFocus
            />
          </div>

          {errorMessage ? (
            <p id="guest-code-error" className="field-error" role="alert">
              <AlertCircle size={16} aria-hidden="true" />
              <span>{errorMessage}</span>
            </p>
          ) : (
            <p id="guest-code-hint" className="footnote" style={{ marginTop: 10, padding: '0 4px' }}>
              Majuscules et accents, peu importe.
            </p>
          )}

          <button
            id="guest-login-btn"
            type="submit"
            disabled={isLoggingIn || !code.trim()}
            className="btn btn--filled btn--large btn--block"
            style={{ marginTop: 24 }}
          >
            {isLoggingIn ? 'Ouverture…' : 'Ouvrir mon invitation'}
          </button>
        </form>

        {!isSupabaseConfigured && (
          <div className="rise-in rise-in--d3" style={{ marginTop: 32 }}>
            <p className="footnote" style={{ padding: '0 4px 8px' }}>Prénoms de démonstration</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Camille', 'Thomas', 'Sarah'].map((c) => (
                <button
                  key={c}
                  type="button"
                  className="btn btn--gray btn--small"
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
