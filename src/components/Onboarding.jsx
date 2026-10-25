import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Check, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import gsap from 'gsap';
import { QUESTIONS } from '../config/questions';
import { saveAnswer } from '../lib/supabase';

// Retire les emojis et la ponctuation finale d'un libellé d'étiquette
const cleanTag = (text = '') =>
  text.replace(/\p{Extended_Pictographic}|️/gu, '').replace(/\s*!+\s*$/, '').trim();

export default function Onboarding({ guest, initialAnswers = {}, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersMap, setAnswersMap] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const panelRef = useRef(null);
  const isNavigatingRef = useRef(false);
  const savedTimerRef = useRef(null);

  useEffect(() => {
    const map = {};
    if (initialAnswers && typeof initialAnswers === 'object') {
      Object.keys(initialAnswers).forEach((qid) => {
        map[qid] = initialAnswers[qid];
      });
    }
    setAnswersMap(map);
  }, [initialAnswers]);

  const currentQ = QUESTIONS[currentIndex];
  const totalQuestions = QUESTIONS.length;
  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;
  const currentVal = answersMap[currentQ.id];
  const isLast = currentIndex === totalQuestions - 1;

  const handleSaveValue = async (val) => {
    setAnswersMap(prev => ({ ...prev, [currentQ.id]: val }));
    setIsSaving(true);
    setErrorMsg('');

    try {
      await saveAnswer(guest.code, currentQ.id, val);
      setSavedFeedback(true);
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSavedFeedback(false), 1400);
    } catch (err) {
      console.error(err);
      setErrorMsg('Ta réponse n\'a pas pu être enregistrée. Vérifie ta connexion et réessaie.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleMultiple = async (optionId) => {
    const currentList = Array.isArray(currentVal) ? currentVal : [];
    const updated = currentList.includes(optionId)
      ? currentList.filter(id => id !== optionId)
      : [...currentList, optionId];
    await handleSaveValue(updated);
  };

  // Transition façon « push » iOS entre les questions
  const transitionToQuestion = (newIndex, direction = 1) => {
    if (isNavigatingRef.current) return;
    const el = panelRef.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!el || reduce) {
      setCurrentIndex(newIndex);
      window.scrollTo({ top: 0 });
      return;
    }

    isNavigatingRef.current = true;
    gsap.to(el, {
      x: direction * -32,
      opacity: 0,
      duration: 0.18,
      ease: 'power2.in',
      onComplete: () => {
        setCurrentIndex(newIndex);
        window.scrollTo({ top: 0 });
        gsap.fromTo(
          el,
          { x: direction * 32, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.42,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
            onComplete: () => { isNavigatingRef.current = false; }
          }
        );
      }
    });
  };

  const handleNext = () => {
    if (currentQ.required && (currentVal === undefined || currentVal === '')) {
      setErrorMsg('Choisis une réponse pour continuer.');
      return;
    }
    setErrorMsg('');

    if (!isLast) {
      transitionToQuestion(currentIndex + 1, 1);
    } else {
      confetti({
        particleCount: 120,
        spread: 75,
        startVelocity: 38,
        colors: ['#0071e3', '#34c759', '#ff9f0a', '#ff375f', '#bf5af2', '#ffd60a'],
        origin: { y: 0.7 },
        disableForReducedMotion: true
      });
      onFinish();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setErrorMsg('');
      transitionToQuestion(currentIndex - 1, -1);
    }
  };

  const status = savedFeedback ? 'Enregistré' : isSaving ? 'Enregistrement…' : '';

  return (
    <div className="page">
      {/* Progression */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 44, marginBottom: 6 }}>
          {currentIndex > 0 ? (
            <button type="button" onClick={handlePrev} className="btn btn--plain" style={{ marginLeft: -10, gap: 2 }}>
              <ChevronLeft size={22} strokeWidth={2.2} aria-hidden="true" />
              <span>Précédent</span>
            </button>
          ) : <span />}
          <span className="footnote tabular" aria-live="polite">
            {status ? (
              <span style={{ color: savedFeedback ? 'var(--green-text)' : 'var(--label-2)' }}>{status}</span>
            ) : (
              <>Question {currentIndex + 1} sur {totalQuestions}</>
            )}
          </span>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-label="Progression du questionnaire"
          aria-valuemin={1}
          aria-valuemax={totalQuestions}
          aria-valuenow={currentIndex + 1}
        >
          <div className="progress__fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div ref={panelRef}>
        <h1 className="title-1" style={{ padding: '0 4px' }}>
          {currentQ.title}
        </h1>
        {currentQ.subtitle && (
          <p className="subhead" style={{ marginTop: 10, padding: '0 4px' }}>
            {currentQ.subtitle}
          </p>
        )}

        <div style={{ marginTop: 28 }}>
          {currentQ.type === 'multiple_choice' && (
            <p className="footnote" style={{ padding: '0 16px 8px', textTransform: 'none' }}>
              Plusieurs choix possibles{currentQ.required ? '' : ' · facultatif'}
            </p>
          )}

          {(currentQ.type === 'single_choice' || currentQ.type === 'multiple_choice') && (
            <div
              className="group"
              role={currentQ.type === 'single_choice' ? 'radiogroup' : 'group'}
              aria-label={currentQ.title}
            >
              {currentQ.options.map((opt) => {
                const isMulti = currentQ.type === 'multiple_choice';
                const isSelected = isMulti
                  ? Array.isArray(currentVal) && currentVal.includes(opt.id)
                  : currentVal === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role={isMulti ? 'checkbox' : 'radio'}
                    aria-checked={isSelected}
                    className={`row row--with-lead ${isSelected ? 'row--selected' : ''}`}
                    onClick={() => (isMulti ? handleToggleMultiple(opt.id) : handleSaveValue(opt.id))}
                  >
                    <span className="row__lead" aria-hidden="true">{opt.emoji}</span>
                    <span className="row__body">
                      <span className="row__title">
                        {opt.label}
                        {opt.badge && <> <span className="tag">{cleanTag(opt.badge)}</span></>}
                      </span>
                      {opt.sublabel && <span className="row__subtitle">{opt.sublabel}</span>}
                    </span>
                    <span className="row__trail">
                      {isMulti ? (
                        <span className="circle-check"><Check size={14} strokeWidth={3} /></span>
                      ) : (
                        <Check className="check" strokeWidth={2.6} />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {currentQ.type === 'text' && (
            <div>
              <label htmlFor="onboarding-message" className="sr-only">{currentQ.title}</label>
              <textarea
                id="onboarding-message"
                rows={5}
                className="field"
                maxLength={currentQ.maxLength || 250}
                placeholder={currentQ.placeholder || 'Écris ton message ici…'}
                value={currentVal || ''}
                onChange={(e) => handleSaveValue(e.target.value)}
              />
              <div className="section-footer" style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span>Visible par tous sur le mur des messages · facultatif</span>
                <span className="tabular">{(currentVal || '').length}/{currentQ.maxLength || 250}</span>
              </div>
            </div>
          )}

          {!currentQ.required && currentQ.type === 'single_choice' && (
            <p className="section-footer">Facultatif, tu peux passer.</p>
          )}
        </div>

        {errorMsg && (
          <p className="field-error" role="alert" style={{ marginTop: 16 }}>
            <AlertCircle size={16} aria-hidden="true" />
            <span>{errorMsg}</span>
          </p>
        )}

        <button
          id="onboarding-next-btn"
          type="button"
          onClick={handleNext}
          className="btn btn--filled btn--large btn--block"
          style={{ marginTop: 32 }}
        >
          {isLast ? 'Voir les résultats' : 'Continuer'}
        </button>
      </div>
    </div>
  );
}
