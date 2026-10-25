import React, { useState } from 'react';
import { 
  Shield, UserPlus, Users, Copy, Check, Trash2, 
  Download, RefreshCw, AlertCircle, Send, FileSpreadsheet,
  Lock, Eye, EyeOff
} from 'lucide-react';
import { 
  adminVerifyPassword, 
  adminListGuests, 
  adminCreateGuest, 
  adminBulkCreateGuests, 
  adminDeleteGuest,
  adminChangePassword,
  fetchAnswers
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

  const [copiedCode, setCopiedCode] = useState(null);
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
        setAuthError('Mot de passe incorrect. (Par défaut : anniv2026)');
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
    try {
      await adminCreateGuest(password, firstName.trim(), emoji);
      setFirstName('');
      await loadGuestList();
    } catch (err) {
      alert(err.message || 'Erreur de création');
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
      alert('Veuillez coller ou écrire au moins un prénom.');
      return;
    }

    setIsBulkCreating(true);
    try {
      await adminBulkCreateGuests(password, names);
      setBulkText('');
      setActiveTab('guests');
      await loadGuestList();
    } catch (err) {
      alert(err.message || 'Erreur lors de l’import en masse.');
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

  const copyCodeOnly = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
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
      setPwdFeedback({ type: 'success', text: 'Mot de passe modifié avec succès dans Postgres !' });
      setTimeout(() => setPwdFeedback({ type: '', text: '' }), 4000);
    } catch (err) {
      setPwdFeedback({ type: 'error', text: err.message || 'Erreur lors du changement.' });
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        background: '#ffffff'
      }}>
        <div className="glass-card" style={{
          maxWidth: '400px',
          width: '100%',
          padding: '36px 28px',
          textAlign: 'center',
          background: '#ffffff',
          border: '1px solid var(--border-light)'
        }}>
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
            <Shield size={24} />
          </div>

          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px', color: '#09090b' }}>
            Espace Organisateur
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Accès sécurisé pour gérer les invités et les codes
          </p>

          <form onSubmit={handleLogin}>
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <input
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mot de passe admin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-standard"
                style={{ paddingRight: '40px', fontSize: '0.95rem', textAlign: 'center' }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {authError && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={15} />
                <span>{authError}</span>
              </div>
            )}

            <button
              id="admin-login-btn"
              type="submit"
              disabled={isVerifying}
              className="btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              {isVerifying ? 'Vérification...' : 'Déverrouiller l\'espace'}
            </button>
          </form>

          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-light)',
            fontSize: '0.78rem',
            color: 'var(--text-dim)'
          }}>
            Mot de passe initial dans schema.sql : <code style={{ color: '#09090b', fontWeight: 600 }}>anniv2026</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '80px', background: '#ffffff' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge-pill">
              <Shield size={12} />
              <span>Organisateur connecté</span>
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2rem)', fontWeight: 800, marginTop: '6px', color: '#09090b' }}>
            Gestion des Invités.
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => loadGuestList()}
            className="btn-secondary"
            title="Rafraîchir"
            style={{ padding: '8px 12px' }}
          >
            <RefreshCw size={15} className={isLoadingGuests ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onBackToSite}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.88rem' }}
          >
            Voir le site public
          </button>
        </div>
      </div>

      {/* Onglets épurés */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--border-light)',
        paddingBottom: '12px',
        marginBottom: '24px',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveTab('guests')}
          style={{
            padding: '7px 16px',
            borderRadius: 'var(--radius-full)',
            background: activeTab === 'guests' ? '#09090b' : 'var(--bg-subtle)',
            color: activeTab === 'guests' ? '#ffffff' : '#09090b',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <Users size={15} />
          <span>Invités ({guests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bulk')}
          style={{
            padding: '7px 16px',
            borderRadius: 'var(--radius-full)',
            background: activeTab === 'bulk' ? '#09090b' : 'var(--bg-subtle)',
            color: activeTab === 'bulk' ? '#ffffff' : '#09090b',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <UserPlus size={15} />
          <span>Import en masse</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          style={{
            padding: '7px 16px',
            borderRadius: 'var(--radius-full)',
            background: activeTab === 'export' ? '#09090b' : 'var(--bg-subtle)',
            color: activeTab === 'export' ? '#ffffff' : '#09090b',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <FileSpreadsheet size={15} />
          <span>Export CSV</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          style={{
            padding: '7px 16px',
            borderRadius: 'var(--radius-full)',
            background: activeTab === 'security' ? '#09090b' : 'var(--bg-subtle)',
            color: activeTab === 'security' ? '#ffffff' : '#09090b',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <Lock size={15} />
          <span>Sécurité</span>
        </button>
      </div>

      {activeTab === 'guests' && (
        <div>
          <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#09090b' }}>
              <UserPlus size={16} />
              <span>Ajouter un invité individuel</span>
            </h2>

            <form onSubmit={handleCreateGuest} style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <select
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-light)',
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '1.2rem',
                  cursor: 'pointer'
                }}
              >
                {EMOJI_OPTIONS.map(em => (
                  <option key={em} value={em}>{em}</option>
                ))}
              </select>

              <input
                id="admin-guest-name-input"
                type="text"
                placeholder="Prénom de l'invité (ex: Maxime, Sophie...)"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input-standard"
                style={{ flex: 1, minWidth: '200px' }}
              />

              <button
                id="admin-add-guest-btn"
                type="submit"
                disabled={isCreating || !firstName.trim()}
                className="btn-primary"
                style={{ padding: '11px 20px', whiteSpace: 'nowrap' }}
              >
                {isCreating ? 'Ajout...' : 'Ajouter l\'invité'}
              </button>
            </form>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '12px'
          }}>
            {guests.map((g) => (
              <div key={g.id} className="glass-card" style={{ padding: '18px 20px', background: '#ffffff' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.6rem' }}>{g.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#09090b' }}>{g.first_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {g.answers_count > 0 ? (
                          <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ A répondu ({g.answers_count} rép.)</span>
                        ) : (
                          <span>En attente</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(g.id, g.first_name)}
                    title="Supprimer"
                    className="btn-ghost"
                    style={{ padding: '4px', color: '#71717a' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)',
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    letterSpacing: '0.08em',
                    color: '#09090b'
                  }}>
                    {g.code}
                  </span>

                  <button
                    onClick={() => copyCodeOnly(g.code)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: copiedCode === g.code ? '#16a34a' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    {copiedCode === g.code ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedCode === g.code ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>

                <button
                  onClick={() => copyInvitationMessage(g)}
                  className="btn-secondary"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    justifyContent: 'center'
                  }}
                >
                  {copiedMsgId === g.id ? (
                    <>
                      <Check size={14} color="#16a34a" />
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>Message copié !</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Copier le message d'invitation</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {guests.length === 0 && !isLoadingGuests && (
            <div className="glass-card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Aucun invité pour l'instant.
            </div>
          )}
        </div>
      )}

      {activeTab === 'bulk' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px', color: '#09090b' }}>
            Importation rapide d'une liste
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
            Collez la liste des prénoms (séparés par une virgule ou un retour à la ligne).
          </p>

          <form onSubmit={handleBulkCreate}>
            <textarea
              rows={7}
              placeholder={`Exemple :\nLucas\nSarah\nMaxime\nJulie`}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1.5px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                color: '#09090b',
                padding: '14px',
                fontSize: '0.92rem',
                fontFamily: 'inherit',
                lineHeight: '1.5',
                marginBottom: '16px'
              }}
            />

            <button
              type="submit"
              disabled={isBulkCreating || !bulkText.trim()}
              className="btn-primary"
              style={{ padding: '11px 22px' }}
            >
              {isBulkCreating ? 'Génération...' : 'Importer et générer les codes'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'export' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#09090b' }}>Exportation des données</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Téléchargez un tableur CSV avec tous les invités, leurs codes et leurs réponses.
              </p>
            </div>

            <button
              onClick={handleExportCSV}
              className="btn-primary"
              style={{ padding: '10px 18px', gap: '8px' }}
            >
              <Download size={15} />
              <span>Télécharger le CSV</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="glass-card" style={{ padding: '24px', maxWidth: '500px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px', color: '#09090b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={16} />
            <span>Modifier le mot de passe admin</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
            Le mot de passe est haché avec bcrypt dans Postgres.
          </p>

          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: '14px' }}>
              <input
                type="password"
                placeholder="Nouveau mot de passe"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-standard"
              />
            </div>

            {pwdFeedback.text && (
              <div style={{
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '14px',
                fontSize: '0.82rem',
                background: pwdFeedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${pwdFeedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                color: pwdFeedback.type === 'success' ? '#16a34a' : '#b91c1c'
              }}>
                {pwdFeedback.text}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '11px' }}
            >
              Enregistrer le nouveau mot de passe
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
