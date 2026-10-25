import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { ChevronLeft, Check, AlertCircle, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import gsap from 'gsap';
import { QUESTIONS } from '../config/questions';
import { saveAnswer } from '../lib/supabase';

// Retire les emojis et la ponctuation finale d'un libellé d'étiquette
const cleanTag = (text = '') =>
  text.replace(/\p{Extended_Pictographic}|️/gu, '').replace(/\s*!+\s*$/, '').trim();

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Onboarding({ guest, initialAnswers = {}, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersMap, setAnswersMap] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const panelRef = useRef(null);
  const isNavigatingRef = useRef(false);
  const savedTimerRef = useRef(null);
  const directionRef = useRef(1);

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
  const currentVal = answersMap[currentQ.id];
  const isLast = currentIndex === totalQuestions - 1;
  const isMulti = currentQ.type === 'multiple_choice';

  // Arrivée d'une question : le panneau glisse, puis les options montent en cascade
  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el || prefersReduced()) {
      isNavigatingRef.current = false;
      return undefined;
    }
    const dir = directionRef.current;
    const tl = gsap.timeline({ onComplete: () => { isNavigatingRef.current = false; } });
    tl.fromTo(el, { x: dir * 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'expo.out', clearProps: 'transform,opacity' });
    const items = el.querySelectorAll('.option, [data-rise]');
    if (items.length) {
      tl.fromTo(items, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'expo.out', stagger: 0.045, clearProps: 'transform,opacity' }, 0.06);
    }
    return () => tl.kill();
  }, [currentIndex]);

  const handleSaveValue = async (val) => {
    setAnswersMap((prev) => ({ ...prev, [currentQ.id]: val }));
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

  const popCheck = (target) => {
    if (prefersReduced()) return;
    const check = target.querySelector('.option__check');
    if (check) gsap.fromTo(check, { scale: 0.5 }, { scale: 1, duration: 0.45, ease: 'back.out(2.4)', clearProps: 'transform' });
  };

  const handleSelect = (e, optionId) => {
    popCheck(e.currentTarget);
    if (isMulti) {
      const list = Array.isArray(currentVal) ? currentVal : [];
      const updated = list.includes(optionId) ? list.filter((id) => id !== optionId) : [...list, optionId];
      handleSaveValue(updated);
    } else {
      handleSaveValue(optionId);
    }
  };

  const goTo = (newIndex, direction) => {
    if (isNavigatingRef.current) return;
    const el = panelRef.current;
    directionRef.current = direction;

    if (!el || prefersReduced()) {
      setCurrentIndex(newIndex);
      window.scrollTo({ top: 0 });
      return;
    }

    isNavigatingRef.current = true;
    gsap.to(el, {
      x: direction * -40,
      opacity: 0,
      duration: 0.18,
      ease: 'power2.in',
      onComplete: () => {
        setCurrentIndex(newIndex);
        window.scrollTo({ top: 0 });
      },
    });
  };

  const handleNext = () => {
    if (currentQ.required && (currentVal === undefined || currentVal === '')) {
      setErrorMsg('Choisis une réponse pour continuer.');
      return;
    }
    setErrorMsg('');

    if (!isLast) {
      goTo(currentIndex + 1, 1);
    } else {
      confetti({
        particleCount: 110,
        spread: 80,
        startVelocity: 40,
        scalar: 0.9,
        colors: ['#0b0b0c', '#6b4eff', '#c9c9d1', '#ffffff'],
        origin: { y: 0.85 },
        disableForReducedMotion: true,
      });
      onFinish();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setErrorMsg('');
      goTo(currentIndex - 1, -1);
    }
  };

  const status = savedFeedback ? 'Enregistré' : isSaving ? 'Enregistrement…' : '';

  return (
    <>
      <div className="topbar">
        <div className="topbar__inner">
          <button
            type="button"
            onClick={handlePrev}
            className="round"
            disabled={currentIndex === 0}
            aria-label="Question précédente"
          >
            <ChevronLeft size={22} strokeWidth={2.2} aria-hidden="true" />
          </button>

          <div className="topbar__spacer" style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              className="dots"
              role="progressbar"
              aria-label="Progression du questionnaire"
              aria-valuemin={1}
              aria-valuemax={totalQuestions}
              aria-valuenow={currentIndex + 1}
              aria-valuetext={`Question ${currentIndex + 1} sur ${totalQuestions}`}
            >
              {QUESTIONS.map((q, i) => (
                <span
                  key={q.id}
                  className={`dots__dot ${i === currentIndex ? 'dots__dot--on' : i < currentIndex ? 'dots__dot--done' : ''}`}
                />
              ))}
            </div>
          </div>

          <span
            className="caption tabular"
            aria-live="polite"
            style={{ minWidth: 44, textAlign: 'right', color: savedFeedback ? 'var(--success)' : undefined }}
          >
            {status || `${currentIndex + 1}/${totalQuestions}`}
          </span>
        </div>
      </div>

      <div className="page page--cta" style={{ paddingTop: 12 }}>
        <div ref={panelRef}>
          <h1 className="title">{currentQ.title}</h1>
          {currentQ.subtitle && (
            <p className="lede" style={{ marginTop: 12 }}>{currentQ.subtitle}</p>
          )}

          <div style={{ marginTop: 26 }}>
            {isMulti && (
              <p className="caption" data-rise style={{ padding: '0 4px 10px' }}>
                Plusieurs choix possibles{currentQ.required ? '' : ' · facultatif'}
              </p>
            )}

            {(currentQ.type === 'single_choice' || isMulti) && (
              <div className="options" role={isMulti ? 'group' : 'radiogroup'} aria-label={currentQ.title}>
                {currentQ.options.map((opt) => {
                  const isSelected = isMulti
                    ? Array.isArray(currentVal) && currentVal.includes(opt.id)
                    : currentVal === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role={isMulti ? 'checkbox' : 'radio'}
                      aria-checked={isSelected}
                      className={`option ${isMulti ? 'option--multi' : ''}`}
                      onClick={(e) => handleSelect(e, opt.id)}
                    >
                      <span className="option__emoji" aria-hidden="true">{opt.emoji}</span>
                      <span className="option__body">
                        <span className="option__label">
                          {opt.label}
                          {opt.badge && <span className="option__tag">{cleanTag(opt.badge)}</span>}
                        </span>
                        {opt.sublabel && <span className="option__sub">{opt.sublabel}</span>}
                      </span>
                      <span className="option__check" aria-hidden="true">
                        <Check size={16} strokeWidth={3} />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {currentQ.type === 'text' && (
              <div data-rise>
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
                <div className="field-hint" style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span>Visible par tous sur le mur des messages · facultatif</span>
                  <span className="tabular">{(currentVal || '').length}/{currentQ.maxLength || 250}</span>
                </div>
              </div>
            )}

            {!currentQ.required && currentQ.type === 'single_choice' && (
              <p className="field-hint" data-rise>Facultatif, tu peux passer.</p>
            )}
          </div>

          {errorMsg && (
            <p className="field-msg" role="alert" style={{ marginTop: 16 }}>
              <AlertCircle size={16} aria-hidden="true" />
              <span>{errorMsg}</span>
            </p>
          )}
        </div>
      </div>

      <div className="cta-bar">
        <div className="cta-bar__inner">
          <button
            id="onboarding-next-btn"
            type="button"
            onClick={handleNext}
            className="btn btn--ink btn--lg btn--block"
          >
            {isLast ? 'Voir les résultats' : 'Continuer'}
            <span className="btn__knob" aria-hidden="true"><ArrowRight size={18} strokeWidth={2.4} /></span>
          </button>
        </div>
      </div>
    </>
  );
}
