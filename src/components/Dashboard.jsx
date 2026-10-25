import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { QUESTIONS } from '../config/questions';
import { fetchGuests, fetchAnswers, subscribeToAnswers, isSupabaseConfigured } from '../lib/supabase';

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const cleanTag = (text = '') =>
  text.replace(/\p{Extended_Pictographic}|️/gu, '').replace(/\s*!+\s*$/, '').trim();

const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

// Chiffre qui défile jusqu'à sa nouvelle valeur
function CountUp({ value }) {
  const ref = useRef(null);
  const last = useRef(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (prefersReduced()) {
      el.textContent = value;
      last.current = value;
      return undefined;
    }
    const obj = { n: last.current };
    const tween = gsap.to(obj, {
      n: value,
      duration: 0.9,
      ease: 'expo.out',
      onUpdate: () => { el.textContent = Math.round(obj.n); },
    });
    last.current = value;
    return () => tween.kill();
  }, [value]);
  return <span ref={ref} className="tabular">{value}</span>;
}

// Barre de résultat : elle pousse jusqu'à sa part, et se réajuste en direct
function Bar({ opt, isLeader, delay = 0 }) {
  const fillRef = useRef(null);
  useLayoutEffect(() => {
    const el = fillRef.current;
    if (!el) return undefined;
    if (prefersReduced()) {
      el.style.width = `${opt.percent}%`;
      return undefined;
    }
    const tween = gsap.to(el, { width: `${opt.percent}%`, duration: 1.1, ease: 'expo.out', delay });
    return () => tween.kill();
  }, [opt.percent, delay]);

  return (
    <div className={`bar ${isLeader ? 'bar--lead' : ''}`}>
      <div className="bar__top">
        <span className="bar__emoji" aria-hidden="true">{opt.emoji}</span>
        <span className="bar__label">{opt.label}</span>
        <span className="bar__count"><CountUp value={opt.count} /></span>
        <span className="bar__pct tabular">{opt.percent}%</span>
      </div>
      <div
        className="bar__track"
        role="meter"
        aria-label={`${opt.label} : ${opt.count} vote${opt.count > 1 ? 's' : ''}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={opt.percent}
      >
        <div className="bar__fill" ref={fillRef} style={{ width: 0 }} />
      </div>
    </div>
  );
}

export default function Dashboard({ guest }) {
  const [guests, setGuests] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const rootRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [loadedGuests, loadedAnswers] = await Promise.all([fetchGuests(), fetchAnswers()]);
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
      const row = payload.new || payload;
      if (!row || !row.guest_id) return;
      setAnswers((prev) => {
        const index = prev.findIndex((a) => a.guest_id === row.guest_id && a.question_id === row.question_id);
        if (index >= 0) {
          const clone = [...prev];
          clone[index] = row;
          return clone;
        }
        return [...prev, row];
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Entrée de la page : les blocs montent en cascade une fois les données là
  useLayoutEffect(() => {
    if (loading || prefersReduced() || !rootRef.current) return undefined;
    const tween = gsap.from(rootRef.current.querySelectorAll('[data-rise]'), {
      y: 24,
      opacity: 0,
      duration: 0.8,
      ease: 'expo.out',
      stagger: 0.06,
      clearProps: 'transform,opacity',
    });
    return () => tween.kill();
  }, [loading]);

  const guestsMap = useMemo(() => {
    const map = {};
    guests.forEach((g) => { map[g.id] = g; });
    return map;
  }, [guests]);

  const guestsWhoAnswered = useMemo(() => {
    const answeredIds = new Set(answers.map((a) => a.guest_id));
    return guests.filter((g) => answeredIds.has(g.id));
  }, [guests, answers]);

  const wallMessages = useMemo(() => answers
    .filter((a) => a.question_id === 'q_message' && typeof a.value === 'string' && a.value.trim().length > 0)
    .map((a) => {
      const author = guestsMap[a.guest_id] || { first_name: 'Invité(e)', emoji: '✨' };
      return {
        id: a.id || `${a.guest_id}-msg`,
        text: a.value,
        authorId: a.guest_id,
        authorName: author.first_name,
        authorEmoji: author.emoji,
        updatedAt: a.updated_at,
      };
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)), [answers, guestsMap]);

  const calculateStats = (question) => {
    const questionAnswers = answers.filter((a) => a.question_id === question.id);
    const totalVotes = questionAnswers.length;
    const counts = {};
    question.options.forEach((opt) => { counts[opt.id] = 0; });

    if (question.type === 'single_choice') {
      questionAnswers.forEach((a) => { if (counts[a.value] !== undefined) counts[a.value] += 1; });
    } else if (question.type === 'multiple_choice') {
      questionAnswers.forEach((a) => {
        if (Array.isArray(a.value)) a.value.forEach((v) => { if (counts[v] !== undefined) counts[v] += 1; });
      });
    }

    let options = question.options.map((opt) => {
      const count = counts[opt.id] || 0;
      const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      return { ...opt, count, percent };
    });
    if (question.type === 'multiple_choice') options = options.sort((a, b) => b.count - a.count);
    return { totalVotes, options };
  };

  const leaderOf = (stats) => {
    if (!stats || stats.totalVotes === 0) return null;
    const max = Math.max(...stats.options.map((o) => o.count));
    const top = stats.options.filter((o) => o.count === max);
    return top.length === 1 ? top[0] : null;
  };

  const dateQuestion = QUESTIONS.find((q) => q.isDateQuestion || q.id === 'q_date');
  const dateStats = dateQuestion ? calculateStats(dateQuestion) : null;
  const dateLeader = leaderOf(dateStats);
  const otherQuestions = QUESTIONS.filter((q) => !q.isDateQuestion && q.type !== 'text');

  const answered = guestsWhoAnswered.length;

  return (
    <div className="page page--wide page--nav" ref={rootRef}>
      <header className="dash-top" style={{ marginTop: 8 }}>
        <div data-rise>
          <h1 className="display">Les votes.</h1>
          <p className="lede" style={{ marginTop: 14 }}>
            {loading
              ? 'Chargement des réponses…'
              : `${answered} invité${answered > 1 ? 's' : ''} sur ${guests.length} ${answered > 1 ? 'ont' : 'a'} répondu, ${plural(wallMessages.length, 'message')} sur le mur.`}
          </p>
          <div style={{ marginTop: 16 }}>
            <span className="live">
              <span className="live__dot" aria-hidden="true" />
              {isSupabaseConfigured ? 'En direct' : 'Démo locale'}
            </span>
          </div>
        </div>

        {dateQuestion && dateStats && (
          <section className="card card--ink hero-vote" data-rise aria-labelledby="vote-weekend" style={{ marginTop: 28 }}>
            <div className="card__head" style={{ marginBottom: 0 }}>
              <h2 id="vote-weekend" className="headline">Le week-end</h2>
              <span className="card__meta">{plural(dateStats.totalVotes, 'vote')}</span>
            </div>
            <p className="hero-vote__leader">
              {dateStats.totalVotes === 0
                ? 'Pas encore de vote'
                : dateLeader
                  ? dateLeader.label.replace(/^Week-end du /, '')
                  : 'Égalité pour l\'instant'}
            </p>
            <p className="hero-vote__note">
              {dateLeader ? 'En tête pour le moment.' : 'Ton vote peut faire la différence.'}
            </p>
            <div className="bars" style={{ marginTop: 22 }}>
              {dateStats.options.map((opt, i) => (
                <Bar key={opt.id} opt={opt} isLeader={dateLeader?.id === opt.id} delay={0.15 + i * 0.06} />
              ))}
            </div>
          </section>
        )}
      </header>

      <section className="section" style={{ marginTop: 44 }}>
        <div className="section__head" data-rise>
          <h2 className="title-2">Le reste des votes</h2>
        </div>
        <div className="results-grid">
          {otherQuestions.map((q, qi) => {
            const stats = calculateStats(q);
            const leader = leaderOf(stats);
            return (
              <article key={q.id} className="card" data-rise aria-labelledby={`res-${q.id}`}>
                <div className="card__head">
                  <h3 id={`res-${q.id}`} className="headline">{q.title}</h3>
                  <span className="card__meta">
                    {plural(stats.totalVotes, q.type === 'multiple_choice' ? 'réponse' : 'vote')}
                  </span>
                </div>
                {q.badge && (
                  <span className="chip chip--soft" style={{ background: '#fff', marginBottom: 16 }}>{cleanTag(q.badge)}</span>
                )}
                <div className="bars">
                  {stats.options.map((opt, i) => (
                    <Bar key={opt.id} opt={opt} isLeader={leader?.id === opt.id} delay={0.2 + qi * 0.04 + i * 0.04} />
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section" style={{ marginTop: 44 }} aria-labelledby="wall">
        <div className="section__head" data-rise>
          <h2 id="wall" className="title-2">Le mur des messages</h2>
          <span className="section__meta">{plural(wallMessages.length, 'message')}</span>
        </div>
        {wallMessages.length === 0 ? (
          <p className="card empty" data-rise>
            Aucun message pour l'instant. Laisse le premier depuis « Mes réponses ».
          </p>
        ) : (
          <div className="notes">
            {wallMessages.map((msg) => {
              const mine = guest && msg.authorId === guest.id;
              return (
                <figure key={msg.id} className={`note ${mine ? 'note--mine' : ''}`} data-rise style={{ margin: 0 }}>
                  <figcaption className="note__who">
                    <span className="avatar avatar--sm" aria-hidden="true">{msg.authorEmoji}</span>
                    <span className="note__name">{mine ? 'Toi' : msg.authorName}</span>
                  </figcaption>
                  <blockquote className="note__text" style={{ margin: 0 }}>{msg.text}</blockquote>
                </figure>
              );
            })}
          </div>
        )}
      </section>

      <section className="section" style={{ marginTop: 44 }} aria-labelledby="people">
        <div className="section__head" data-rise>
          <h2 id="people" className="title-2">Ils ont répondu</h2>
          <span className="section__meta">{answered} sur {guests.length}</span>
        </div>
        {answered === 0 ? (
          <p className="card empty" data-rise>Personne n'a encore répondu. Les prénoms apparaîtront ici.</p>
        ) : (
          <ul className="people" role="list" data-rise>
            {guestsWhoAnswered.map((g) => (
              <li key={g.id} className="person">
                <span className="avatar avatar--sm" aria-hidden="true">{g.emoji}</span>
                {g.first_name}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
