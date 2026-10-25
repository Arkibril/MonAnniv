import React, { useState, useEffect, useMemo } from 'react';
import { QUESTIONS } from '../config/questions';
import { fetchGuests, fetchAnswers, subscribeToAnswers, isSupabaseConfigured } from '../lib/supabase';

export default function Dashboard({ guest, onOpenSurvey, onReplayAnimation }) {
  const [guests, setGuests] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

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
          authorId: a.guest_id,
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
  const otherQuestions = QUESTIONS.filter((q) => !q.isDateQuestion && q.type !== 'text');

  const cleanTag = (text = '') =>
    text.replace(/\p{Extended_Pictographic}|️/gu, '').replace(/\s*!+\s*$/, '').trim();

  const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

  // Une ligne de résultat : emoji, libellé, compte, barre
  const ResultRow = ({ opt, isLeader }) => (
    <div className="row" style={{ display: 'block', '--row-inset': '60px' }}>
      <div className="result-row">
        <span className="row__lead" aria-hidden="true">{opt.emoji}</span>
        <span className="row__title" style={{ minWidth: 0 }}>
          {opt.label}
          {isLeader && <> <span className="tag">En tête</span></>}
          {!isLeader && opt.badge && <> <span className="tag tag--gray">{cleanTag(opt.badge)}</span></>}
        </span>
        <span className="row__trail">
          <span style={{ color: 'var(--label)', fontWeight: 600 }}>{opt.count}</span>
          <span style={{ minWidth: '3.2ch', textAlign: 'right', fontSize: 15 }}>{opt.percent}%</span>
        </span>
        <div
          className="meter"
          role="meter"
          aria-label={`${opt.label} : ${opt.count} vote(s)`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={opt.percent}
        >
          <div
            className={`meter__fill ${isLeader ? '' : 'meter__fill--muted'}`}
            style={{ width: `${opt.percent}%` }}
          />
        </div>
      </div>
    </div>
  );

  const leaderId = (stats) => {
    if (!stats || stats.totalVotes === 0) return null;
    const max = Math.max(...stats.options.map((o) => o.count));
    const top = stats.options.filter((o) => o.count === max);
    return top.length === 1 ? top[0].id : null;
  };

  const dateLeader = leaderId(dateStats);

  return (
    <div className="page page--wide">
      {/* En-tête */}
      <header style={{ maxWidth: 640 }}>
        <h1 className="large-title rise-in">Les votes.</h1>
        <p className="lede rise-in rise-in--d1" style={{ marginTop: 12 }}>
          {loading
            ? 'Chargement des réponses…'
            : `${guestsWhoAnswered.length} invité${guestsWhoAnswered.length > 1 ? 's' : ''} sur ${guests.length} ${guestsWhoAnswered.length > 1 ? 'ont' : 'a'} répondu, ${plural(wallMessages.length, 'message')} sur le mur.`}
        </p>
        <div className="rise-in rise-in--d2" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
          <button type="button" onClick={onOpenSurvey} className="btn btn--filled">
            Modifier mes réponses
          </button>
          <button type="button" onClick={onReplayAnimation} className="btn btn--gray">
            Revoir mon animation
          </button>
          <span className="live" style={{ marginLeft: 6 }}>
            <span className="live__dot" aria-hidden="true" />
            {isSupabaseConfigured ? 'En direct' : 'Démo locale'}
          </span>
        </div>
      </header>

      {/* Le week-end : vote principal */}
      {dateQuestion && dateStats && (
        <section className="section" style={{ marginTop: 48 }}>
          <div className="section-header">
            <h2 className="section-header__title">Le week-end</h2>
            <span className="section-header__meta">{plural(dateStats.totalVotes, 'vote')}</span>
          </div>
          <div className="group">
            {dateStats.options.map((opt) => (
              <ResultRow key={opt.id} opt={opt} isLeader={opt.id === dateLeader} />
            ))}
          </div>
          {dateQuestion.subtitle && (
            <p className="section-footer">{dateQuestion.subtitle.replace(/^💡\s*/, '')}</p>
          )}
        </section>
      )}

      {/* Les autres questions */}
      <div className="results-grid">
        {otherQuestions.map((q) => {
          const stats = calculateStats(q);
          const leader = leaderId(stats);
          return (
            <section key={q.id} className="section">
              <div className="section-header">
                <h2 className="headline">{q.title}</h2>
                <span className="section-header__meta">
                  {plural(stats.totalVotes, q.type === 'multiple_choice' ? 'réponse' : 'vote')}
                </span>
              </div>
              <div className="group">
                {stats.options.map((opt) => (
                  <ResultRow key={opt.id} opt={opt} isLeader={opt.id === leader} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Mur des messages */}
      <section className="section" style={{ marginTop: 48 }}>
        <div className="section-header">
          <h2 className="section-header__title">Le mur des messages</h2>
          <span className="section-header__meta">{plural(wallMessages.length, 'message')}</span>
        </div>
        <div className="group">
          {wallMessages.length === 0 ? (
            <p className="empty">
              Aucun message pour l'instant. Laisse le premier en modifiant tes réponses.
            </p>
          ) : (
            <div className="thread">
              {wallMessages.map((msg) => {
                const mine = guest && msg.authorId === guest.id;
                return (
                  <div key={msg.id} className={`bubble-line ${mine ? 'bubble-line--mine' : ''}`}>
                    <span className="avatar avatar--sm" aria-hidden="true">{msg.authorEmoji}</span>
                    <div className="bubble-wrap">
                      <div className="bubble-author">{mine ? 'Toi' : msg.authorName}</div>
                      <p className="bubble">{msg.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Invités ayant répondu */}
      <section className="section" style={{ marginTop: 48 }}>
        <div className="section-header">
          <h2 className="section-header__title">Ils ont répondu</h2>
          <span className="section-header__meta">{guestsWhoAnswered.length} sur {guests.length}</span>
        </div>
        <div className="group">
          {guestsWhoAnswered.length === 0 ? (
            <p className="empty">Personne n'a encore répondu. Les prénoms apparaîtront ici.</p>
          ) : (
            <ul className="people" role="list">
              {guestsWhoAnswered.map((g) => (
                <li key={g.id} className="person">
                  <span className="avatar" aria-hidden="true">{g.emoji}</span>
                  <span className="person__name">{g.first_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
