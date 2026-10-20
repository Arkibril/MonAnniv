import React, { useState, useEffect } from 'react';
import CodeLogin from './components/CodeLogin';
import PersonalizedIntro from './components/PersonalizedIntro';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import AdminPortal from './components/AdminPortal';
import ConfigBanner from './components/ConfigBanner';
import { loginWithCode, fetchAnswers } from './lib/supabase';
import { EVENT_CONFIG } from './config/event';

const STORAGE_KEY_GUEST = 'monanniv_current_guest';

export default function App() {
  const [currentGuest, setCurrentGuest] = useState(null);
  const [guestAnswers, setGuestAnswers] = useState({});
  const [activeView, setActiveView] = useState('home'); // 'home', 'onboarding', 'dashboard', 'admin'
  const [showIntro, setShowIntro] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Initialisation au chargement
  useEffect(() => {
    // Vérifier si l'URL demande l'admin (ex: /admin ou #/admin)
    const checkHashRoute = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      if (hash === '#/admin' || path.endsWith('/admin')) {
        setActiveView('admin');
      }
    };
    checkHashRoute();
    window.addEventListener('hashchange', checkHashRoute);

    // Récupérer les paramètres d'URL (ex: ?view=quiz ou ?test_guest=...)
    const params = new URLSearchParams(window.location.search);
    const requestedView = params.get('view');
    const testGuestCode = params.get('test_guest');

    if (testGuestCode) {
      handleLogin(testGuestCode).then(() => {
        if (requestedView === 'quiz' || requestedView === 'onboarding') {
          setShowIntro(false);
          setActiveView('onboarding');
        }
      });
    } else {
      // Récupérer la session invité mémorisée
      try {
        const saved = localStorage.getItem(STORAGE_KEY_GUEST);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.code) {
            setCurrentGuest(parsed);
            loadGuestAnswers(parsed.id);
            setActiveView(requestedView === 'quiz' || requestedView === 'onboarding' ? 'onboarding' : (prev => prev === 'admin' ? 'admin' : 'dashboard'));
          }
        }
      } catch (e) {
        console.error('Erreur lecture session:', e);
      }
    }

    return () => window.removeEventListener('hashchange', checkHashRoute);
  }, []);

  // Charger les réponses de l'invité connecté
  const loadGuestAnswers = async (guestId) => {
    try {
      const allAnswers = await fetchAnswers();
      const myAnswers = allAnswers.filter((a) => a.guest_id === guestId);
      const map = {};
      myAnswers.forEach((a) => {
        map[a.question_id] = a.value;
      });
      setGuestAnswers(map);
      return map;
    } catch (err) {
      console.error('Erreur loadGuestAnswers:', err);
      return {};
    }
  };

  // Connexion avec un code d'invitation
  const handleLogin = async (code) => {
    setIsLoggingIn(true);
    try {
      const guestData = await loginWithCode(code);
      setCurrentGuest(guestData);
      localStorage.setItem(STORAGE_KEY_GUEST, JSON.stringify(guestData));

      const answersMap = await loadGuestAnswers(guestData.id);

      // Lance toujours l'animation personnalisée d'entrée après connexion
      setShowIntro(true);
      // Le quiz s'affiche TOUJOURS immédiatement après l'animation personnalisée
      setActiveView('onboarding');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Fin de l'animation d'entrée : mène TOUJOURS au quizz
  const handleIntroComplete = () => {
    setShowIntro(false);
    setActiveView('onboarding');
  };

  // Fin du questionnaire d'onboarding
  const handleFinishOnboarding = () => {
    setActiveView('dashboard');
  };

  // Rejouer l'animation personnalisée
  const handleReplayAnimation = () => {
    setShowIntro(true);
  };

  // Ouvrir le questionnaire pour modifier ses réponses
  const handleOpenSurvey = () => {
    setActiveView('onboarding');
  };

  // Déconnexion
  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY_GUEST);
    setCurrentGuest(null);
    setGuestAnswers({});
    setActiveView('login');
    window.location.hash = '';
  };

  // Navigation manuelle (ex: vers Admin)
  const handleNavigate = (view) => {
    setActiveView(view);
    if (view === 'admin') {
      window.location.hash = '#/admin';
    } else {
      window.location.hash = '';
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
      {/* Bannière d'aide de configuration Supabase */}
      <ConfigBanner />

      {/* Animation d'entrée plein écran personnalisée selon le seed */}
      {showIntro && currentGuest && (
        <PersonalizedIntro
          guest={currentGuest}
          onComplete={handleIntroComplete}
        />
      )}

      {/* Contenu principal selon la vue active */}
      <main style={{ flex: 1 }}>
        {activeView === 'admin' ? (
          <AdminPortal onBackToSite={() => handleNavigate(currentGuest ? 'dashboard' : 'login')} />
        ) : !currentGuest ? (
          <CodeLogin
            onLoginSuccess={handleLogin}
            isLoggingIn={isLoggingIn}
          />
        ) : activeView === 'onboarding' ? (
          <Onboarding
            guest={currentGuest}
            initialAnswers={guestAnswers}
            onFinish={handleFinishOnboarding}
          />
        ) : (
          <Dashboard
            guest={currentGuest}
            onOpenSurvey={handleOpenSurvey}
            onReplayAnimation={handleReplayAnimation}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Footer discret */}
      <footer style={{
        textAlign: 'center',
        padding: '24px 16px',
        borderTop: '1px solid var(--border-light)',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        background: '#ffffff'
      }}>
        <div style={{ color: '#09090b', fontWeight: 600 }}>
          {EVENT_CONFIG.title} • {EVENT_CONFIG.datesProposed}
        </div>
        <div style={{ marginTop: '4px', color: 'var(--text-dim)' }}>
          Supabase Postgres & Realtime
        </div>
        <div style={{ marginTop: '8px' }}>
          <button
            onClick={() => handleNavigate(activeView === 'admin' ? (currentGuest ? 'dashboard' : 'login') : 'admin')}
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-dim)',
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            {activeView === 'admin' ? '← Retour au site' : 'Accès Organisateur (Admin)'}
          </button>
        </div>
      </footer>
    </div>
  );
}
