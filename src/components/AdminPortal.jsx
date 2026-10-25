import React, { useState } from 'react';
import {
  Check, Trash2, Download, RefreshCw, AlertCircle, Eye, EyeOff, ChevronLeft, LockKeyhole, ArrowRight
} from 'lucide-react';
import { 
  adminVerifyPassword, 
  adminListGuests, 
  adminCreateGuest, 
  adminBulkCreateGuests, 
  adminDeleteGuest,
  adminChangePassword,
  fetchAnswers,
  isSupabaseConfigured
} from '../lib/supabase';
import { EVENT_CONFIG } from '../config/event';
import { QUESTIONS } from '../config/questions';

export default function AdminPortal({ onBackToSite }) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [guests, setGuests] = useState([]);
  const [isLoadingGuests, setIsLoadingGuests] = useState(false);
  const [activeTab, setActiveTab] = useState('guests');

  const [firstName, setFirstName] = useState('');
  const [emoji, setEmoji] = useState('🎉');
  const [isCreating, setIsCreating] = useState(false);

  const [bulkText, setBulkText] = useState('');
  const [isBulkCreating, setIsBulkCreating] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [pwdFeedback, setPwdFeedback] = useState({ type: '', text: '' });

  const [formError, setFormError] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [copiedMsgId, setCopiedMsgId] = useState(null);

  const EMOJI_OPTIONS = ['🎉', '🥳', '🚀', '✨', '🎸', '🌟', '🦄', '🕺', '💃', '🥂', '🍕', '🎂', '⚡', '🔥'];

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) {
      setAuthError('Entre le mot de passe organisateur.');
      return;
    }

    setIsVerifying(true);
    setAuthError('');

    try {
      const ok = await adminVerifyPassword(password);
      if (ok) {
        setIsAuthenticated(true);
        loadGuestList(password);
      } else {
        setAuthError('Mot de passe incorrect.');
      }
    } catch (err) {
      setAuthError(err.message || 'Erreur lors de la vérification.');
    } finally {
      setIsVerifying(false);
    }
  };

  const loadGuestList = async (pwd = password) => {
    setIsLoadingGuests(true);
    try {
      const data = await adminListGuests(pwd);
      setGuests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingGuests(false);
    }
  };

  const handleCreateGuest = async (e) => {
    e.preventDefault();
    if (!firstName.trim()) return;

    setIsCreating(true);
    setFormError('');
    try {
      await adminCreateGuest(password, firstName.trim(), emoji);
      setFirstName('');
      await loadGuestList();
    } catch (err) {
      setFormError(err.message || 'L\'invité n\'a pas pu être ajouté.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleBulkCreate = async (e) => {
    e.preventDefault();
    const names = bulkText
      .split(/[\n,;]+/)
      .map((n) => n.trim())
      .filter(Boolean);

    if (names.length === 0) {
      setBulkError('Colle ou écris au moins un prénom.');
      return;
    }

    setIsBulkCreating(true);
    setBulkError('');
    try {
      await adminBulkCreateGuests(password, names);
      setBulkText('');
      setActiveTab('guests');
      await loadGuestList();
    } catch (err) {
      setBulkError(err.message || 'L\'import n\'a pas abouti.');
      await loadGuestList();
    } finally {
      setIsBulkCreating(false);
    }
  };

  const handleDelete = async (guestId, guestName) => {
    if (!window.confirm(`Supprimer ${guestName} et ses réponses ?`)) return;

    try {
      await adminDeleteGuest(password, guestId);
      await loadGuestList();
    } catch (err) {
      alert(err.message || 'Erreur lors de la suppression.');
    }
  };

  const copyInvitationMessage = (guest) => {
    const siteUrl = window.location.origin;
    const msg = `Salut ${guest.first_name} ! 🎂
Tu es invité(e) à mon anniversaire (${EVENT_CONFIG.datesProposed}) !

Rends-toi sur : ${siteUrl}
Connecte-toi simplement avec ton prénom : ${guest.code}

Tu pourras y découvrir ton animation personnalisée et voter pour la date ! 🎉`;

    navigator.clipboard.writeText(msg);
    setCopiedMsgId(guest.id);
    setTimeout(() => setCopiedMsgId(null), 2500);
  };

  const handleExportCSV = async () => {
    try {
      const answers = await fetchAnswers();
      const csvRows = [];
      const headers = ['Prénom', 'Code', 'Date de création', ...QUESTIONS.map(q => q.title)];
      csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

      guests.forEach(g => {
        const guestAnswers = answers.filter(a => a.guest_id === g.id);
        const row = [
          g.first_name,
          g.code,
          new Date(g.created_at).toLocaleDateString(),
          ...QUESTIONS.map(q => {
            const ans = guestAnswers.find(a => a.question_id === q.id);
            if (!ans) return '';
            if (Array.isArray(ans.value)) return ans.value.join('; ');
            return String(ans.value);
          })
        ];
        csvRows.push(row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
      });

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invitations_anniv_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Erreur lors de l’export CSV: ' + err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setPwdFeedback({ type: 'error', text: 'Le mot de passe doit comporter au moins 4 caractères.' });
      return;
    }

    try {
      await adminChangePassword(password, newPassword);
      setPassword(newPassword);
      setNewPassword('');
      setPwdFeedback({ type: 'success', text: 'Mot de passe modifié.' });
      setTimeout(() => setPwdFeedback({ type: '', text: '' }), 4000);
    } catch (err) {
      setPwdFeedback({ type: 'error', text: err.message || 'Erreur lors du changement.' });
    }
  };

  const answeredCount = guests.filter((g) => g.answers_count > 0).length;

  if (!isAuthenticated) {
    return (
      <>
        <div className="topbar">
          <div className="topbar__inner">
            <button type="button" className="round" onClick={onBackToSite} aria-label="Retour au site">
              <ChevronLeft size={22} strokeWidth={2.2} aria-hidden="true" />
            </button>
            <span className="topbar__spacer" />
          </div>
        </div>
        <div className="page" style={{ paddingTop: 24 }}>
          <h1 className="display">
            <span className="display__pre">Espace</span>
            organisateur.
          </h1>
          <p className="lede" style={{ marginTop: 14 }}>
            Gère la liste des invités et récupère leurs réponses.
          </p>

          <form onSubmit={handleLogin} noValidate style={{ marginTop: 32 }}>
            <label htmlFor="admin-password-input" className="sr-only">Mot de passe</label>
            <div className={`askbar ${authError ? 'askbar--invalid' : ''}`}>
              <LockKeyhole size={20} className="askbar__icon" aria-hidden="true" />
              <input
                id="admin-password-input"
                className="askbar__input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (authError) setAuthError(''); }}
                aria-invalid={Boolean(authError)}
                aria-describedby={authError ? 'admin-error' : undefined}
                autoFocus
              />
              <button
                type="button"
                className="round round--ghost round--sm"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                style={{ color: 'var(--ink-2)' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <button
                id="admin-login-btn"
                type="submit"
                className="askbar__go"
                disabled={isVerifying || !password}
                aria-label="Se connecter"
              >
                <ArrowRight size={22} strokeWidth={2.4} className={isVerifying ? 'animate-spin' : ''} aria-hidden="true" />
              </button>
            </div>

            {authError && (
              <p id="admin-error" className="field-msg" role="alert">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{authError}</span>
              </p>
            )}
          </form>

          {!isSupabaseConfigured && (
            <p className="field-hint" style={{ marginTop: 18 }}>
              Mode démo : le mot de passe est <strong style={{ color: 'var(--ink)' }}>anniv2026</strong>.
            </p>
          )}
        </div>
      </>
    );
  }

  const tabs = [
    { id: 'guests', label: `Invités · ${guests.length}` },
    { id: 'bulk', label: 'Importer' },
    { id: 'export', label: 'Exporter' },
    { id: 'security', label: 'Sécurité' }
  ];

  return (
    <>
      <div className="topbar">
        <div className="topbar__inner">
          <button type="button" className="round" onClick={onBackToSite} aria-label="Voir le site">
            <ChevronLeft size={22} strokeWidth={2.2} aria-hidden="true" />
          </button>
          <span className="topbar__title">Organisateur</span>
          <button
            type="button"
            onClick={() => loadGuestList()}
            className="round"
            aria-label="Actualiser la liste"
            disabled={isLoadingGuests}
          >
            <RefreshCw size={18} strokeWidth={2.2} className={isLoadingGuests ? 'animate-spin' : ''} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="page" style={{ paddingTop: 16 }}>
        <h1 className="display">Invités.</h1>
        <p className="lede" style={{ marginTop: 12 }}>
          {answeredCount} sur {guests.length} {answeredCount > 1 ? 'ont' : 'a'} répondu.
        </p>

        <div className="chips chips--scroll" role="tablist" aria-label="Sections" style={{ marginTop: 22 }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              className="chip"
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'guests' && (
          <div style={{ marginTop: 22 }}>
            <form onSubmit={handleCreateGuest} noValidate className="card">
              <h2 className="headline" style={{ marginBottom: 14 }}>Ajouter un invité</h2>
              <div className="add-row">
                <label htmlFor="admin-guest-emoji" className="sr-only">Emoji</label>
                <select
                  id="admin-guest-emoji"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="field"
                  style={{ background: '#fff' }}
                >
                  {EMOJI_OPTIONS.map(em => (
                    <option key={em} value={em}>{em}</option>
                  ))}
                </select>
                <label htmlFor="admin-guest-name-input" className="sr-only">Prénom</label>
                <input
                  id="admin-guest-name-input"
                  type="text"
                  placeholder="Prénom"
                  autoComplete="off"
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); if (formError) setFormError(''); }}
                  className={`field ${formError ? 'field--invalid' : ''}`}
                  style={{ background: '#fff' }}
                  aria-invalid={Boolean(formError)}
                />
                <button
                  id="admin-add-guest-btn"
                  type="submit"
                  disabled={isCreating || !firstName.trim()}
                  className="btn btn--ink btn--lg"
                >
                  {isCreating ? 'Ajout…' : 'Ajouter'}
                </button>
              </div>
              {formError ? (
                <p className="field-msg" role="alert">
                  <AlertCircle size={16} aria-hidden="true" />
                  <span>{formError}</span>
                </p>
              ) : (
                <p className="field-hint">Le prénom sert de code d'accès.</p>
              )}
            </form>

            <section className="section" aria-labelledby="guest-list">
              <div className="section__head">
                <h2 id="guest-list" className="title-2">La liste</h2>
                <span className="section__meta">{guests.length}</span>
              </div>
              {guests.length === 0 ? (
                <p className="card empty">
                  {isLoadingGuests ? 'Chargement…' : 'Aucun invité pour l\'instant. Ajoute le premier ci-dessus.'}
                </p>
              ) : (
                <ul className="list" role="list">
                  {guests.map((g) => (
                    <li key={g.id} className="list-row">
                      <span className="avatar" aria-hidden="true">{g.emoji}</span>
                      <span className="list-row__body">
                        <span className="list-row__title" style={{ display: 'block' }}>{g.first_name}</span>
                        <span className={`list-row__sub ${g.answers_count > 0 ? 'list-row__sub--ok' : ''}`}>
                          {g.answers_count > 0 ? 'A répondu' : 'En attente'}
                        </span>
                      </span>
                      <span className="list-row__actions">
                        <button
                          type="button"
                          onClick={() => copyInvitationMessage(g)}
                          className="btn btn--white btn--sm"
                          aria-label={`Copier le message d'invitation pour ${g.first_name}`}
                        >
                          {copiedMsgId === g.id ? (
                            <><Check size={15} strokeWidth={2.8} aria-hidden="true" /> Copié</>
                          ) : 'Copier'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(g.id, g.first_name)}
                          className="round round--ghost round--sm round--danger"
                          aria-label={`Supprimer ${g.first_name}`}
                        >
                          <Trash2 size={17} aria-hidden="true" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="field-hint">
                « Copier » copie le message d'invitation avec le lien du site et le prénom à saisir, prêt pour WhatsApp ou SMS.
              </p>
            </section>
          </div>
        )}

        {activeTab === 'bulk' && (
          <form onSubmit={handleBulkCreate} noValidate className="card" style={{ marginTop: 22 }}>
            <h2 className="headline" style={{ marginBottom: 14 }}>Importer une liste</h2>
            <label htmlFor="admin-bulk-input" className="sr-only">Liste de prénoms</label>
            <textarea
              id="admin-bulk-input"
              rows={7}
              placeholder={`Lucas\nSarah\nMaxime\nJulie`}
              value={bulkText}
              onChange={(e) => { setBulkText(e.target.value); if (bulkError) setBulkError(''); }}
              className={`field ${bulkError ? 'field--invalid' : ''}`}
              style={{ background: '#fff' }}
            />
            {bulkError ? (
              <p className="field-msg" role="alert">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{bulkError}</span>
              </p>
            ) : (
              <p className="field-hint">Un prénom par ligne, ou séparés par des virgules. Un emoji est choisi au hasard pour chacun.</p>
            )}
            <button
              type="submit"
              disabled={isBulkCreating || !bulkText.trim()}
              className="btn btn--ink btn--lg btn--block"
              style={{ marginTop: 18 }}
            >
              {isBulkCreating ? 'Import…' : 'Importer les invités'}
            </button>
          </form>
        )}

        {activeTab === 'export' && (
          <div className="card" style={{ marginTop: 22 }}>
            <h2 className="headline">Exporter les réponses</h2>
            <p className="sub" style={{ marginTop: 6 }}>
              Un fichier CSV avec chaque invité, son prénom d'accès et toutes ses réponses. S'ouvre dans Numbers, Excel ou Google Sheets.
            </p>
            <button type="button" onClick={handleExportCSV} className="btn btn--ink btn--lg" style={{ marginTop: 18 }}>
              <Download size={18} aria-hidden="true" />
              Télécharger le CSV
            </button>
          </div>
        )}

        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} noValidate className="card" style={{ marginTop: 22 }}>
            <h2 className="headline" style={{ marginBottom: 14 }}>Changer le mot de passe</h2>
            <label htmlFor="admin-new-password" className="sr-only">Nouveau mot de passe</label>
            <input
              id="admin-new-password"
              type="password"
              autoComplete="new-password"
              placeholder="Nouveau mot de passe"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`field ${pwdFeedback.type === 'error' ? 'field--invalid' : ''}`}
              style={{ background: '#fff' }}
            />
            {pwdFeedback.text ? (
              <p
                className={`field-msg ${pwdFeedback.type === 'success' ? 'field-msg--ok' : ''}`}
                role={pwdFeedback.type === 'error' ? 'alert' : 'status'}
              >
                {pwdFeedback.type === 'error' ? <AlertCircle size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
                <span>{pwdFeedback.text}</span>
              </p>
            ) : (
              <p className="field-hint">Au moins 4 caractères. Stocké chiffré (bcrypt) dans la base.</p>
            )}
            <button type="submit" className="btn btn--ink btn--lg btn--block" style={{ marginTop: 18 }}>
              Enregistrer
            </button>
          </form>
        )}
      </div>
    </>
  );
}
