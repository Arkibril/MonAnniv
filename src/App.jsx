import React, { useState, useEffect, useCallback } from 'react';
import CodeLogin from './components/CodeLogin';
import PersonalizedIntro from './components/PersonalizedIntro';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import AdminPortal from './components/AdminPortal';
import ConfigBanner from './components/ConfigBanner';
import Dock from './components/Dock';
import { LogOut } from 'lucide-react';
import { loginWithCode, fetchAnswers } from './lib/supabase';

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
  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    setActiveView('onboarding');
    window.scrollTo({ top: 0 });
  }, []);

  // Fin du questionnaire d'onboarding
  const handleFinishOnboarding = () => {
    setActiveView('dashboard');
    window.scrollTo({ top: 0 });
  };

  // Rejouer l'animation personnalisée
  const handleReplayAnimation = () => {
    setShowIntro(true);
  };

  // Ouvrir le questionnaire pour modifier ses réponses
  const handleOpenSurvey = () => {
    setActiveView('onboarding');
    window.scrollTo({ top: 0 });
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

  const showGuestChrome = currentGuest && activeView === 'dashboard' && !showIntro;

  const hour = new Date().getHours();
  const hello = hour >= 18 || hour < 5 ? 'Bonsoir,' : 'Salut,';

  return (
    <>
      <ConfigBanner />

      {/* Animation d'entrée plein écran personnalisée */}
      {showIntro && currentGuest && (
        <PersonalizedIntro guest={currentGuest} onComplete={handleIntroComplete} />
      )}

      {showGuestChrome && (
        <header className="topbar topbar--wide">
          <div className="topbar__inner">
            <div className="greet">
              <span className="avatar avatar--white" aria-hidden="true">{currentGuest.emoji || '🎉'}</span>
              <span className="greet__text">
                <span className="greet__hello">{hello}</span>
                <span className="greet__name">{currentGuest.first_name}</span>
              </span>
            </div>
            <button type="button" className="round" onClick={handleLogout} aria-label="Se déconnecter">
              <LogOut size={19} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
        </header>
      )}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeView === 'admin' ? (
          <AdminPortal onBackToSite={() => handleNavigate(currentGuest ? 'dashboard' : 'login')} />
        ) : !currentGuest ? (
          <CodeLogin onLoginSuccess={handleLogin} isLoggingIn={isLoggingIn} />
        ) : activeView === 'onboarding' ? (
          <Onboarding guest={currentGuest} initialAnswers={guestAnswers} onFinish={handleFinishOnboarding} />
        ) : (
          <Dashboard guest={currentGuest} />
        )}
      </main>

      {showGuestChrome && (
        <Dock
          active="votes"
          onVotes={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          onAnswers={handleOpenSurvey}
          onReplay={handleReplayAnimation}
        />
      )}

      {activeView !== 'onboarding' && !showIntro && (
        <footer className={`site-footer ${showGuestChrome ? 'site-footer--lifted' : ''}`}>
          <button
            type="button"
            className="btn btn--link btn--sm"
            onClick={() => handleNavigate(activeView === 'admin' ? (currentGuest ? 'dashboard' : 'login') : 'admin')}
          >
            {activeView === 'admin' ? 'Retour au site' : 'Espace organisateur'}
          </button>
        </footer>
      )}
    </>
  );
}
