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
            // Les codes sont désormais les prénoms : on rafraîchit la session
            // (une ancienne session avec un code type LNAK-4821 est mise à jour).
            loginWithCode(parsed.first_name)
              .then((fresh) => {
                if (fresh && fresh.id === parsed.id && fresh.code !== parsed.code) {
                  setCurrentGuest(fresh);
                  localStorage.setItem(STORAGE_KEY_GUEST, JSON.stringify(fresh));
                }
              })
              .catch(() => {});
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

  const showGuestChrome = currentGuest && activeView !== 'admin' && !showIntro;

  return (
    <>
      {/* Bannière d'aide de configuration Supabase */}
      <ConfigBanner />

      {/* Animation d'entrée plein écran personnalisée selon le seed */}
      {showIntro && currentGuest && (
        <PersonalizedIntro
          guest={currentGuest}
          onComplete={handleIntroComplete}
        />
      )}

      {showGuestChrome && (
        <header className="navbar">
          <div className="navbar__inner">
            <span className="navbar__title">{EVENT_CONFIG.title}</span>
            <div className="navbar__actions">
              <span className="avatar avatar--sm" aria-hidden="true">{currentGuest.emoji || '🎉'}</span>
              <span className="footnote navbar__name" style={{ color: 'var(--label)', marginRight: 4 }}>{currentGuest.first_name}</span>
              <button type="button" className="btn btn--plain btn--small" onClick={handleLogout}>
                Se déconnecter
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Contenu principal selon la vue active */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
          />
        )}
      </main>

      <footer className="site-footer">
        <div>{EVENT_CONFIG.title} · {EVENT_CONFIG.datesProposed}</div>
        <button
          type="button"
          onClick={() => handleNavigate(activeView === 'admin' ? (currentGuest ? 'dashboard' : 'login') : 'admin')}
        >
          {activeView === 'admin' ? 'Retour au site' : 'Espace organisateur'}
        </button>
      </footer>
    </>
  );
}
