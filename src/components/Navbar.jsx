import React from 'react';
import { Sparkles, LogOut, Shield, Edit3, PartyPopper } from 'lucide-react';
import { EVENT_CONFIG } from '../config/event';

export default function Navbar({ currentGuest, onReplayAnimation, onOpenSurvey, onLogout, onNavigate, activeView }) {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-light)',
      padding: '12px 16px'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        {/* Logo / Nom de l'anniversaire */}
        <div
          onClick={() => onNavigate(currentGuest ? 'dashboard' : 'login')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: '#09090b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <PartyPopper size={18} />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1rem',
              letterSpacing: '-0.02em',
              color: '#09090b',
              lineHeight: 1.1
            }}>
              {EVENT_CONFIG.title}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)'
            }}>
              {EVENT_CONFIG.datesProposed}
            </div>
          </div>
        </div>

        {/* Actions à droite */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {currentGuest ? (
            <>
              {/* Badge invité épuré */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-light)',
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                color: '#09090b'
              }}>
                <span style={{ fontSize: '1rem' }}>{currentGuest.emoji || '🎉'}</span>
                <span style={{ fontWeight: 600 }}>{currentGuest.first_name}</span>
                <span style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'monospace',
                  background: '#ffffff',
                  border: '1px solid var(--border-light)',
                  padding: '1px 5px',
                  borderRadius: '4px'
                }}>
                  {currentGuest.code}
                </span>
              </div>

              {/* Bouton Rejouer Animation */}
              <button
                onClick={onReplayAnimation}
                title="Rejouer mon animation"
                className="btn-ghost"
                style={{ padding: '7px 10px', color: '#09090b' }}
              >
                <Sparkles size={15} />
                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Animation</span>
              </button>

              {/* Bouton Modifier réponses */}
              <button
                onClick={onOpenSurvey}
                title="Modifier mes réponses"
                className="btn-ghost"
                style={{ padding: '7px 10px', color: '#09090b' }}
              >
                <Edit3 size={15} />
                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Mes réponses</span>
              </button>

              {/* Déconnexion */}
              <button
                onClick={onLogout}
                title="Déconnexion"
                className="btn-ghost"
                style={{ padding: '7px 10px', color: '#71717a' }}
              >
                <LogOut size={15} />
              </button>
            </>
          ) : null}

          {/* Bouton Espace Organisateur */}
          <button
            onClick={() => onNavigate(activeView === 'admin' ? (currentGuest ? 'dashboard' : 'login') : 'admin')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: activeView === 'admin' ? '#09090b' : '#ffffff',
              border: '1px solid ' + (activeView === 'admin' ? '#09090b' : 'var(--border-light)'),
              color: activeView === 'admin' ? '#ffffff' : '#09090b',
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              transition: 'all 0.15s'
            }}
          >
            <Shield size={13} />
            <span>{activeView === 'admin' ? 'Quitter' : 'Admin'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
