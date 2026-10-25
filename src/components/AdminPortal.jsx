import React, { useState } from 'react';
import {
  Check, Trash2, Download, RefreshCw, AlertCircle, Eye, EyeOff
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
      <div className="page page--center">
        <div style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}>
          <h1 className="title-1">Espace organisateur</h1>
          <p className="subhead" style={{ marginTop: 8 }}>
            Gère la liste des invités et récupère leurs réponses.
          </p>

          <form onSubmit={handleLogin} noValidate style={{ marginTop: 32 }}>
            <label htmlFor="admin-password-input" className="headline" style={{ display: 'block', padding: '0 4px 8px' }}>
              Mot de passe
            </label>
            <div className="field-wrap">
              <input
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (authError) setAuthError(''); }}
                className={`field ${authError ? 'field--invalid' : ''}`}
                aria-invalid={Boolean(authError)}
                autoFocus
              />
              <button
                type="button"
                className="icon-btn field-wrap__action"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                style={{ color: 'var(--label-2)' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {authError && (
              <p className="field-error" role="alert">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{authError}</span>
              </p>
            )}

            <button
              id="admin-login-btn"
              type="submit"
              disabled={isVerifying || !password}
              className="btn btn--filled btn--large btn--block"
              style={{ marginTop: 24 }}
            >
              {isVerifying ? 'Vérification…' : 'Se connecter'}
            </button>
          </form>

          {!isSupabaseConfigured && (
            <p className="footnote" style={{ marginTop: 20, padding: '0 4px' }}>
              Mode démo : le mot de passe est <strong style={{ color: 'var(--label)' }}>anniv2026</strong>.
            </p>
          )}
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'guests', label: `Invités (${guests.length})` },
    { id: 'bulk', label: 'Importer' },
    { id: 'export', label: 'Exporter' },
    { id: 'security', label: 'Sécurité' }
  ];

  return (
    <>
      <header className="navbar">
        <div className="navbar__inner">
          <span className="navbar__title">Espace organisateur</span>
          <div className="navbar__actions">
            <button
              type="button"
              onClick={() => loadGuestList()}
              className="icon-btn"
              aria-label="Actualiser la liste"
              disabled={isLoadingGuests}
            >
              <RefreshCw size={18} className={isLoadingGuests ? 'animate-spin' : ''} />
            </button>
            <button type="button" onClick={onBackToSite} className="btn btn--plain btn--small">
              Voir le site
            </button>
          </div>
        </div>
      </header>

      <div className="page" style={{ paddingTop: 36 }}>
        <h1 className="large-title">Invités.</h1>
        <p className="lede" style={{ marginTop: 10 }}>
          {answeredCount} sur {guests.length} {answeredCount > 1 ? 'ont' : 'a'} répondu.
        </p>

        <div className="segmented" role="tablist" aria-label="Sections" style={{ marginTop: 28 }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              className="segmented__item"
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'guests' && (
          <div style={{ marginTop: 32 }}>
            <form onSubmit={handleCreateGuest} noValidate>
              <div className="section-header">
                <h2 className="headline">Ajouter un invité</h2>
              </div>
              <div className="group add-guest">
                <label htmlFor="admin-guest-emoji" className="sr-only">Emoji</label>
                <select
                  id="admin-guest-emoji"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="field"
                  style={{ padding: '0 10px', fontSize: 22, textAlign: 'center', cursor: 'pointer' }}
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
                />
                <button
                  id="admin-add-guest-btn"
                  type="submit"
                  disabled={isCreating || !firstName.trim()}
                  className="btn btn--filled btn--large add-guest__submit"
                >
                  {isCreating ? 'Ajout…' : 'Ajouter'}
                </button>
              </div>
              {formError ? (
                <p className="field-error" role="alert">
                  <AlertCircle size={16} aria-hidden="true" />
                  <span>{formError}</span>
                </p>
              ) : (
                <p className="section-footer">Le prénom sert de code d'accès.</p>
              )}
            </form>

            <section className="section" style={{ marginTop: 36 }}>
              <div className="section-header">
                <h2 className="headline">Liste des invités</h2>
                <span className="section-header__meta">{guests.length}</span>
              </div>
              <div className="group">
                {guests.length === 0 ? (
                  <p className="empty">
                    {isLoadingGuests ? 'Chargement…' : 'Aucun invité pour l\'instant. Ajoute le premier ci-dessus.'}
                  </p>
                ) : guests.map((g) => (
                  <div key={g.id} className="row" style={{ '--row-inset': '70px' }}>
                    <span className="avatar" aria-hidden="true">{g.emoji}</span>
                    <span className="row__body">
                      <span className="row__title" style={{ fontWeight: 600 }}>{g.first_name}</span>
                      <span className="row__subtitle" style={g.answers_count > 0 ? { color: 'var(--green-text)' } : undefined}>
                        {g.answers_count > 0 ? 'A répondu' : 'En attente'}
                      </span>
                    </span>
                    <span className="row__trail" style={{ gap: 2 }}>
                      <button
                        type="button"
                        onClick={() => copyInvitationMessage(g)}
                        className="btn btn--tinted btn--small"
                        aria-label={`Copier le message d'invitation pour ${g.first_name}`}
                      >
                        {copiedMsgId === g.id ? (
                          <><Check size={15} strokeWidth={2.6} aria-hidden="true" /> Copié</>
                        ) : 'Copier'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(g.id, g.first_name)}
                        className="icon-btn icon-btn--danger"
                        aria-label={`Supprimer ${g.first_name}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </span>
                  </div>
                ))}
              </div>
              <p className="section-footer">
                « Copier » copie le message d'invitation avec le lien du site et le prénom à saisir, prêt pour WhatsApp ou SMS.
              </p>
            </section>
          </div>
        )}

        {activeTab === 'bulk' && (
          <form onSubmit={handleBulkCreate} noValidate style={{ marginTop: 32 }}>
            <div className="section-header">
              <h2 className="headline">Importer une liste</h2>
            </div>
            <label htmlFor="admin-bulk-input" className="sr-only">Liste de prénoms</label>
            <textarea
              id="admin-bulk-input"
              rows={7}
              placeholder={`Lucas\nSarah\nMaxime\nJulie`}
              value={bulkText}
              onChange={(e) => { setBulkText(e.target.value); if (bulkError) setBulkError(''); }}
              className={`field ${bulkError ? 'field--invalid' : ''}`}
            />
            {bulkError ? (
              <p className="field-error" role="alert">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{bulkError}</span>
              </p>
            ) : (
              <p className="section-footer">Un prénom par ligne, ou séparés par des virgules. Un emoji est choisi au hasard pour chacun.</p>
            )}
            <button
              type="submit"
              disabled={isBulkCreating || !bulkText.trim()}
              className="btn btn--filled btn--large btn--block"
              style={{ marginTop: 20 }}
            >
              {isBulkCreating ? 'Import…' : 'Importer les invités'}
            </button>
          </form>
        )}

        {activeTab === 'export' && (
          <div style={{ marginTop: 32 }}>
            <div className="section-header">
              <h2 className="headline">Exporter les réponses</h2>
            </div>
            <div className="group" style={{ padding: '18px 16px' }}>
              <p className="body-text" style={{ fontSize: 15, color: 'var(--label-2)' }}>
                Un fichier CSV avec chaque invité, son code et toutes ses réponses. S'ouvre dans Numbers, Excel ou Google Sheets.
              </p>
              <button
                type="button"
                onClick={handleExportCSV}
                className="btn btn--filled"
                style={{ marginTop: 16 }}
              >
                <Download size={17} aria-hidden="true" />
                Télécharger le CSV
              </button>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} noValidate style={{ marginTop: 32 }}>
            <div className="section-header">
              <h2 className="headline">Changer le mot de passe</h2>
            </div>
            <label htmlFor="admin-new-password" className="sr-only">Nouveau mot de passe</label>
            <input
              id="admin-new-password"
              type="password"
              autoComplete="new-password"
              placeholder="Nouveau mot de passe"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`field ${pwdFeedback.type === 'error' ? 'field--invalid' : ''}`}
            />
            {pwdFeedback.text ? (
              <p
                className={pwdFeedback.type === 'error' ? 'field-error' : 'field-error'}
                role={pwdFeedback.type === 'error' ? 'alert' : 'status'}
                style={pwdFeedback.type === 'success' ? { color: 'var(--green-text)' } : undefined}
              >
                {pwdFeedback.type === 'error' ? <AlertCircle size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
                <span>{pwdFeedback.text}</span>
              </p>
            ) : (
              <p className="section-footer">Au moins 4 caractères. Stocké chiffré (bcrypt) dans la base.</p>
            )}
            <button type="submit" className="btn btn--filled btn--large btn--block" style={{ marginTop: 20 }}>
              Enregistrer
            </button>
          </form>
        )}
      </div>
    </>
  );
}
