import React, { useState, useEffect, useMemo } from 'react';
import { Users, MessageCircle, Flame, Sparkles, Edit3 } from 'lucide-react';
import { QUESTIONS } from '../config/questions';
import { fetchGuests, fetchAnswers, subscribeToAnswers, isSupabaseConfigured } from '../lib/supabase';

export default function Dashboard({ guest, onOpenSurvey, onReplayAnimation, onLogout }) {
  const [guests, setGuests] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pulseQuestionId, setPulseQuestionId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [loadedGuests, loadedAnswers] = await Promise.all([
          fetchGuests(),
          fetchAnswers()
        ]);
        if (isMounted) {
          setGuests(loadedGuests);
          setAnswers(loadedAnswers);
          setLoading(false);
        }
      } catch (err) {
        console.error('Erreur de chargement du dashboard:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    const unsubscribe = subscribeToAnswers((payload) => {
      const newOrUpdated = payload.new || payload;
      if (!newOrUpdated || !newOrUpdated.guest_id) return;

      setPulseQuestionId(newOrUpdated.question_id);
      setTimeout(() => setPulseQuestionId(null), 1000);

      setAnswers((prevAnswers) => {
        const index = prevAnswers.findIndex(
          (a) => a.guest_id === newOrUpdated.guest_id && a.question_id === newOrUpdated.question_id
        );
        if (index >= 0) {
          const clone = [...prevAnswers];
          clone[index] = newOrUpdated;
          return clone;
        } else {
          return [...prevAnswers, newOrUpdated];
        }
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const guestsMap = useMemo(() => {
    const map = {};
    guests.forEach((g) => {
      map[g.id] = g;
    });
    return map;
  }, [guests]);

  const guestsWhoAnswered = useMemo(() => {
    const answeredIds = new Set(answers.map((a) => a.guest_id));
    return guests.filter((g) => answeredIds.has(g.id));
  }, [guests, answers]);

  const wallMessages = useMemo(() => {
    return answers
      .filter((a) => a.question_id === 'q_message' && a.value && typeof a.value === 'string' && a.value.trim().length > 0)
      .map((a) => {
        const author = guestsMap[a.guest_id] || { first_name: 'Invité(e)', emoji: '✨' };
        return {
          id: a.id,
          text: a.value,
          authorName: author.first_name,
          authorEmoji: author.emoji,
          updatedAt: a.updated_at
        };
      })
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [answers, guestsMap]);

  const calculateStats = (question) => {
    const questionAnswers = answers.filter((a) => a.question_id === question.id);
    const totalVotes = questionAnswers.length;

    // Palette monochrome épurée pour les options
    const monoColors = ['#09090b', '#52525b', '#71717a', '#a1a1aa'];

    if (question.type === 'single_choice') {
      const counts = {};
      question.options.forEach((opt) => (counts[opt.id] = 0));
      questionAnswers.forEach((a) => {
        if (counts[a.value] !== undefined) {
          counts[a.value] += 1;
        }
      });

      const optionsWithStats = question.options.map((opt, i) => {
        const count = counts[opt.id] || 0;
        const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        return { ...opt, count, percent, color: monoColors[i % monoColors.length] };
      });

      return { totalVotes, options: optionsWithStats };
    }

    if (question.type === 'multiple_choice') {
      const counts = {};
      question.options.forEach((opt) => (counts[opt.id] = 0));
      let totalSelections = 0;

      questionAnswers.forEach((a) => {
        if (Array.isArray(a.value)) {
          a.value.forEach((val) => {
            if (counts[val] !== undefined) {
              counts[val] += 1;
              totalSelections += 1;
            }
          });
        }
      });

      const optionsWithStats = question.options
        .map((opt, i) => {
          const count = counts[opt.id] || 0;
          const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          return { ...opt, count, percent, color: monoColors[i % monoColors.length] };
        })
        .sort((a, b) => b.count - a.count);

      return { totalVotes, options: optionsWithStats, totalSelections };
    }

    return { totalVotes, options: [] };
  };

  const dateQuestion = QUESTIONS.find((q) => q.isDateQuestion || q.id === 'q_date');
  const dateStats = dateQuestion ? calculateStats(dateQuestion) : null;

  return (
    <div className="container" style={{ paddingBottom: '80px', background: '#ffffff' }}>
      {/* Profil de l'invité connecté et Déconnexion */}
      {guest && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-light)',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>{guest.emoji || '🎉'}</span>
            <span style={{ fontWeight: 700, color: '#09090b', fontSize: '0.95rem' }}>{guest.first_name}</span>
            <span style={{
              fontFamily: 'monospace',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              padding: '2px 7px',
              borderRadius: '4px'
            }}>
              {guest.code}
            </span>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="btn-ghost"
              style={{ fontSize: '0.8rem', padding: '5px 10px', color: '#71717a' }}
            >
              Déconnexion
            </button>
          )}
        </div>
      )}

      {/* En-tête du Dashboard épuré */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#16a34a'
              }} />
              <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
                {isSupabaseConfigured ? 'Direct Supabase Realtime actif' : 'Mode Démo local actif'}
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.3rem)', color: '#09090b', letterSpacing: '-0.03em' }}>
              Tableau des Votes en Direct.
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onOpenSurvey}
              className="btn-secondary"
            >
              <Edit3 size={14} />
              <span>Modifier mes réponses</span>
            </button>
            <button
              onClick={onReplayAnimation}
              className="btn-secondary"
            >
              <Sparkles size={14} />
              <span>Mon animation</span>
            </button>
          </div>
        </div>

        {/* Chiffres clés */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#09090b'
            }}>
              <Users size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#09090b' }}>
                {guestsWhoAnswered.length} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {guests.length}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Invités ayant répondu</div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#09090b'
            }}>
              <MessageCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#09090b' }}>{wallMessages.length}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Messages sur le Mur d'Or</div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          1. LE GRAND DUEL DES DATES (10 OU 11 OCTOBRE)
          ===================================================================== */}
      {dateQuestion && dateStats && (
        <section style={{ marginBottom: '32px' }}>
          <div className="glass-card" style={{
            padding: '28px 24px',
            background: '#ffffff',
            border: '1.5px solid #09090b'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="badge-pill">
                <Flame size={12} color="#09090b" />
                <span>Vote Prioritaire</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                {dateStats.totalVotes} vote{dateStats.totalVotes > 1 ? 's' : ''} au total
              </div>
            </div>

            <h2 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.6rem)', fontWeight: 800, marginBottom: '6px', color: '#09090b' }}>
              {dateQuestion.title}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
              {dateQuestion.subtitle}
            </p>

            {/* Cartes épurées côte à côte */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginBottom: '20px'
            }}>
              {dateStats.options.map((opt) => (
                <div
                  key={opt.id}
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '1.6rem', marginBottom: '4px' }}>{opt.emoji}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#09090b', marginBottom: opt.badge ? '4px' : '8px' }}>
                    {opt.label}
                  </div>
                  {opt.badge && (
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        background: '#09090b',
                        color: '#ffffff',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        {opt.badge}
                      </span>
                    </div>
                  )}
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 900,
                    fontFamily: 'var(--font-heading)',
                    color: '#09090b',
                    lineHeight: 1
                  }}>
                    {opt.count}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {opt.percent}% des votes
                  </div>
                </div>
              ))}
            </div>

            {/* Barre proportionnelle monochrome */}
            {dateStats.totalVotes > 0 && (
              <div style={{
                height: '8px',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
                display: 'flex',
                background: 'var(--bg-subtle)'
              }}>
                {dateStats.options.map((opt) => (
                  <div
                    key={opt.id}
                    title={`${opt.label}: ${opt.count} votes (${opt.percent}%)`}
                    style={{
                      height: '100%',
                      width: `${opt.percent}%`,
                      background: opt.color || '#09090b',
                      transition: 'width 0.3s ease'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* =====================================================================
          2. AUTRES QUESTIONS DU QUESTIONNAIRE
          ===================================================================== */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px', color: '#09090b' }}>
          Tendances de la Soirée.
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {QUESTIONS.filter((q) => !q.isDateQuestion && q.type !== 'text').map((q) => {
            const stats = calculateStats(q);
            return (
              <div key={q.id} className="glass-card" style={{ padding: '20px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '14px'
                }}>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#09090b' }}>{q.title}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {stats.totalVotes} rép.
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {stats.options.map((opt) => (
                    <div key={opt.id}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.85rem',
                        marginBottom: '4px'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#09090b' }}>
                          <span>{opt.emoji}</span>
                          <span>{opt.label}</span>
                        </span>
                        <span style={{ fontWeight: 600, color: '#09090b', fontSize: '0.8rem' }}>
                          {opt.count} ({opt.percent}%)
                        </span>
                      </div>
                      <div style={{
                        height: '6px',
                        background: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${opt.percent}%`,
                          background: '#09090b',
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          3. MUR DES MESSAGES
          ===================================================================== */}
      <section style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#09090b' }}>
              Le Mur d'Or des Invités.
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Les messages et petits mots d'encouragement
            </p>
          </div>
          <span className="badge-pill">
            <MessageCircle size={12} />
            <span>{wallMessages.length} message{wallMessages.length > 1 ? 's' : ''}</span>
          </span>
        </div>

        {wallMessages.length === 0 ? (
          <div className="glass-card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>Aucun message pour le moment. Laisse un mot lors du questionnaire !</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: '12px'
          }}>
            {wallMessages.map((msg) => (
              <div
                key={msg.id}
                className="glass-card"
                style={{
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  background: '#ffffff'
                }}
              >
                <p style={{
                  fontSize: '0.92rem',
                  lineHeight: '1.5',
                  color: '#09090b'
                }}>
                  "{msg.text}"
                </p>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderTop: '1px solid var(--border-light)',
                  paddingTop: '10px'
                }}>
                  <span style={{ fontSize: '1.1rem' }}>{msg.authorEmoji}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#09090b' }}>{msg.authorName}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================================
          4. INVITÉS QUI ONT RÉPONDU
          ===================================================================== */}
      <section>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '14px', color: '#09090b' }}>
          Ils ont déjà répondu ({guestsWhoAnswered.length}).
        </h2>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          {guestsWhoAnswered.map((g) => (
            <div
              key={g.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-light)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem',
                color: '#09090b'
              }}
            >
              <span>{g.emoji}</span>
              <span style={{ fontWeight: 500 }}>{g.first_name}</span>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#16a34a'
              }} />
            </div>
          ))}
          {guestsWhoAnswered.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Aucune réponse pour l'instant. Les votes apparaîtront ici dès validation !
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
