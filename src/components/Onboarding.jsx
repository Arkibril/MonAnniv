import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft, Check, CheckCircle2, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import gsap from 'gsap';
import { QUESTIONS } from '../config/questions';
import { saveAnswer } from '../lib/supabase';

export default function Onboarding({ guest, initialAnswers = {}, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersMap, setAnswersMap] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const cardRef = useRef(null);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    const map = {};
    if (initialAnswers && typeof initialAnswers === 'object') {
      Object.keys(initialAnswers).forEach((qid) => {
        map[qid] = initialAnswers[qid];
      });
    }
    setAnswersMap(map);
  }, [initialAnswers]);

  // Animation d'entrée GSAP au chargement
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 35, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.4)' }
      );
    }
  }, []);

  const currentQ = QUESTIONS[currentIndex];
  const totalQuestions = QUESTIONS.length;
  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;
  const currentVal = answersMap[currentQ.id];

  const handleSaveValue = async (val) => {
    setAnswersMap(prev => ({ ...prev, [currentQ.id]: val }));
    setIsSaving(true);
    setErrorMsg('');

    try {
      await saveAnswer(guest.code, currentQ.id, val);
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 1200);
    } catch (err) {
      console.error(err);
      setErrorMsg('Erreur de sauvegarde. Vérifiez votre connexion.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectSingle = async (optionId) => {
    await handleSaveValue(optionId);
  };

  const handleToggleMultiple = async (optionId) => {
    const currentList = Array.isArray(currentVal) ? currentVal : [];
    const exists = currentList.includes(optionId);
    const updated = exists
      ? currentList.filter(id => id !== optionId)
      : [...currentList, optionId];
    await handleSaveValue(updated);
  };

  // Transition GSAP fluide entre les questions
  const transitionToQuestion = (newIndex, direction = 1) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    if (!cardRef.current) {
      setCurrentIndex(newIndex);
      isNavigatingRef.current = false;
      return;
    }

    const xExit = direction === 1 ? -40 : 40;
    const xEnter = direction === 1 ? 40 : -40;

    // 1. Sortie de la carte actuelle
    gsap.to(cardRef.current, {
      x: xExit,
      opacity: 0,
      scale: 0.97,
      filter: 'blur(6px)',
      duration: 0.22,
      ease: 'power2.in',
      onComplete: () => {
        // Changement d'état
        setCurrentIndex(newIndex);

        // 2. Entrée de la nouvelle carte
        gsap.fromTo(
          cardRef.current,
          { x: xEnter, opacity: 0, scale: 0.97, filter: 'blur(6px)' },
          {
            x: 0,
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
            duration: 0.38,
            ease: 'back.out(1.4)',
            onComplete: () => {
              isNavigatingRef.current = false;
            }
          }
        );

        // 3. Stagger élégant sur les options
        gsap.fromTo(
          '.option-item-anim',
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, stagger: 0.04, duration: 0.3, ease: 'power2.out', delay: 0.05 }
        );
      }
    });
  };

  const handleNext = () => {
    if (currentQ.required && (currentVal === undefined || currentVal === '')) {
      setErrorMsg('Merci de répondre à cette question pour continuer.');
      return;
    }
    setErrorMsg('');

    if (currentIndex < totalQuestions - 1) {
      transitionToQuestion(currentIndex + 1, 1);
    } else {
      confetti({
        particleCount: 100,
        spread: 70,
        colors: ['#09090b', '#71717a', '#d4d4d8', '#27272a'],
        origin: { y: 0.6 }
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

  return (
    <div style={{
      minHeight: 'calc(100vh - 100px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      background: '#ffffff'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '560px'
      }}>
        {/* Barre de progression épurée en noir (capsule) */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.88rem',
            marginBottom: '10px'
          }}>
            <span style={{ fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
              Question 0{currentIndex + 1} <span style={{ color: '#94a3b8', fontWeight: 500 }}>/ 0{totalQuestions}</span>
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: savedFeedback ? '#16a34a' : '#94a3b8'
            }}>
              {savedFeedback ? (
                <>
                  <CheckCircle2 size={14} color="#16a34a" />
                  <span>Enregistré</span>
                </>
              ) : isSaving ? (
                <span>Sauvegarde...</span>
              ) : null}
            </span>
          </div>

          {/* Capsule bar avec fill strictly en NOIR */}
          <div style={{
            height: '10px',
            background: '#e4e4e7',
            borderRadius: '9999px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: '#000000',
              borderRadius: '9999px',
              transition: 'width 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
            }} />
          </div>
        </div>

        {/* Carte de la question (Style moderne fidèle à la référence) */}
        <div ref={cardRef} style={{
          padding: '38px 30px',
          background: '#ffffff',
          borderRadius: '28px',
          border: '1px solid #eef0f3',
          boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.07), 0 0 1px 1px rgba(0, 0, 0, 0.04)',
          willChange: 'transform, opacity'
        }}>
          {/* Header catégorie style "General Knowledge" */}
          <div style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            color: '#94a3b8',
            marginBottom: '10px',
            letterSpacing: '-0.01em'
          }}>
            {currentQ.badge ? currentQ.badge.replace(/[⭐🔥]/g, '').trim() : "Anniversaire de Jibril"}
          </div>

          <h2 style={{
            fontSize: 'clamp(1.35rem, 4.2vw, 1.65rem)',
            fontWeight: 800,
            marginBottom: currentQ.subtitle ? '8px' : '26px',
            letterSpacing: '-0.025em',
            color: '#1e293b',
            lineHeight: 1.35
          }}>
            {currentQ.title}
          </h2>

          {currentQ.subtitle && (
            <p style={{
              color: '#64748b',
              fontSize: '0.92rem',
              marginBottom: '26px',
              lineHeight: 1.55
            }}>
              {currentQ.subtitle}
            </p>
          )}

          {/* Type : Choix unique (Pillules très arrondies avec état vert + checkmark circulaire) */}
          {currentQ.type === 'single_choice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {currentQ.options.map((opt) => {
                const isSelected = currentVal === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className="option-item-anim"
                    onClick={() => handleSelectSingle(opt.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      borderRadius: '20px',
                      background: isSelected ? '#dcfce7' : '#ffffff',
                      border: isSelected ? '1.5px solid #86efac' : '1.5px solid #e2e8f0',
                      boxShadow: isSelected ? '0 2px 8px rgba(34, 197, 94, 0.12)' : '0 1px 2px rgba(0, 0, 0, 0.02)',
                      transition: 'all 0.18s ease',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '1.35rem', flexShrink: 0 }}>{opt.emoji}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: isSelected ? '#0f172a' : '#1e293b'
                          }}>
                            {opt.label}
                          </span>
                          {opt.badge && (
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              background: isSelected ? '#15803d' : '#09090b',
                              color: '#ffffff',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              letterSpacing: '0.01em',
                              whiteSpace: 'nowrap'
                            }}>
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.sublabel && (
                          <span style={{
                            fontSize: '0.82rem',
                            fontWeight: 500,
                            color: isSelected ? '#166534' : '#64748b',
                            lineHeight: 1.3
                          }}>
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Cercle vert avec Checkmark blanc identique au design de référence */}
                    {isSelected && (
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#22c55e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginLeft: '12px',
                        boxShadow: '0 2px 6px rgba(34, 197, 94, 0.35)'
                      }}>
                        <Check size={16} color="#ffffff" strokeWidth={3.2} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Type : Choix multiple (Même design de pillule avec checkmark vert) */}
          {currentQ.type === 'multiple_choice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {currentQ.options.map((opt) => {
                const isChecked = Array.isArray(currentVal) && currentVal.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className="option-item-anim"
                    onClick={() => handleToggleMultiple(opt.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      borderRadius: '20px',
                      background: isChecked ? '#dcfce7' : '#ffffff',
                      border: isChecked ? '1.5px solid #86efac' : '1.5px solid #e2e8f0',
                      boxShadow: isChecked ? '0 2px 8px rgba(34, 197, 94, 0.12)' : '0 1px 2px rgba(0, 0, 0, 0.02)',
                      transition: 'all 0.18s ease',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '1.35rem', flexShrink: 0 }}>{opt.emoji}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
                        <span style={{
                          fontSize: '1rem',
                          fontWeight: 700,
                          color: isChecked ? '#0f172a' : '#1e293b'
                        }}>
                          {opt.label}
                        </span>
                        {opt.sublabel && (
                          <span style={{
                            fontSize: '0.82rem',
                            fontWeight: 500,
                            color: isChecked ? '#166534' : '#64748b',
                            lineHeight: 1.3
                          }}>
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {isChecked && (
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#22c55e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginLeft: '12px',
                        boxShadow: '0 2px 6px rgba(34, 197, 94, 0.35)'
                      }}>
                        <Check size={16} color="#ffffff" strokeWidth={3.2} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Type : Texte libre */}
          {currentQ.type === 'text' && (
            <div>
              <textarea
                rows={4}
                maxLength={currentQ.maxLength || 250}
                placeholder={currentQ.placeholder || 'Écris ton message ici...'}
                value={currentVal || ''}
                onChange={(e) => handleSaveValue(e.target.value)}
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '20px',
                  color: '#0f172a',
                  padding: '16px 20px',
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                  resize: 'none',
                  outline: 'none',
                  transition: 'border-color 0.15s'
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                color: '#64748b',
                marginTop: '10px',
                padding: '0 6px'
              }}>
                <span>Visible sur le mur des messages</span>
                <span>{(currentVal || '').length} / {currentQ.maxLength || 250}</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div style={{
              marginTop: '16px',
              padding: '12px 18px',
              borderRadius: '16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '0.88rem'
            }}>
              {errorMsg}
            </div>
          )}

          {/* Navigation avec boutons capsules arrondis */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '32px',
            paddingTop: '20px',
            borderTop: '1px solid #f1f5f9'
          }}>
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="btn-ghost"
              style={{
                visibility: currentIndex === 0 ? 'hidden' : 'visible',
                borderRadius: '9999px',
                padding: '10px 18px'
              }}
            >
              <ArrowLeft size={16} />
              <span>Précédent</span>
            </button>

            <button
              id="onboarding-next-btn"
              type="button"
              onClick={handleNext}
              className="btn-primary"
              style={{
                borderRadius: '9999px',
                padding: '12px 24px',
                fontSize: '0.95rem',
                fontWeight: 700
              }}
            >
              <span>{currentIndex === totalQuestions - 1 ? 'Voir les résultats en direct' : 'Suivant'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
