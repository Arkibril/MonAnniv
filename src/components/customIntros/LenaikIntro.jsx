import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { startRealisticExplosion } from '../../utils/realisticExplosion';

export default function LenaikIntro({ onComplete }) {
  // 3 étapes :
  // 1. 'blank' : Tout blanc pur pendant 1.2s de suspense
  // 2. 'tease' : Animations GSAP complètes des lettres et du prompt
  // 3. 'party' : Animations GSAP cinématiques, puis explosion 100% EN CODE physique à la 5ème seconde pour propulser vers le quiz
  const [step, setStep] = useState('blank');
  const containerRef = useRef(null);
  const audioRef = useRef(null);
  const explosionCanvasRef = useRef(null);
  const isExplodingRef = useRef(false);

  useEffect(() => {
    // Préchargement de l'audio de Raze dès l'initialisation pour lecture instantanée
    try {
      const audio = new Audio('/lenaik/Raze%20Ultimate%20Voice%20Line.mp3');
      audio.preload = 'auto';
      audio.volume = 1;
      audioRef.current = audio;
    } catch (e) {
      console.warn('Audio init error:', e);
    }

    // 1.2 seconde de blanc pur total au début
    const timerBlank = setTimeout(() => {
      setStep('tease');
    }, 1200);

    return () => clearTimeout(timerBlank);
  }, []);

  // Déclenchement de l'explosion 100% EN CODE (Canvas physique, ondes de choc, boules de feu, étincelles)
  const triggerExplosion = () => {
    if (isExplodingRef.current) return;
    isExplodingRef.current = true;

    // 1. Lancement du moteur de physique d'explosion Canvas (100% pur code, ultra-réaliste)
    if (explosionCanvasRef.current) {
      startRealisticExplosion(
        explosionCanvasRef.current,
        // Callback au pic de la détonation
        () => {
          gsap.to('.detonation-flash', {
            opacity: 1,
            duration: 0.22,
            ease: 'expo.in',
            onComplete: () => {
              setTimeout(onComplete, 220);
            }
          });
        },
        // Callback à la fin
        () => {
          onComplete();
        }
      );
    }

    // 2. Tremblement d'écran violent (Screen Shake GSAP multi-axes)
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        x: '+=32',
        y: '-=24',
        duration: 0.032,
        repeat: 22,
        yoyo: true,
        ease: 'none',
        onComplete: () => {
          gsap.set(containerRef.current, { x: 0, y: 0 });
        }
      });
    }

    // 3. Salve pyrotechnique d'éclats et de braises
    confetti({
      particleCount: 180,
      spread: 160,
      startVelocity: 62,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#ff2200', '#ff6600', '#ffea00', '#ffffff', '#ff0055']
    });

    setTimeout(() => {
      confetti({
        particleCount: 120,
        spread: 360,
        startVelocity: 45,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#ff3300', '#ff9900', '#ffffff', '#18181b']
      });
    }, 100);

    // 4. Éclatement et dissolution cinématique de l'image de fond et des textes
    const tlExp = gsap.timeline();

    tlExp.to('.party-bg-img, .party-word, .party-subtitle, .party-cta-btn', {
      scale: 1.9,
      filter: 'blur(45px) brightness(4.5)',
      opacity: 0,
      duration: 0.45,
      ease: 'power3.in'
    }, 0);

    // Onde de choc supersonique extérieure
    tlExp.fromTo('.shockwave-ring', {
      scale: 0.05,
      opacity: 1
    }, {
      scale: 6.5,
      opacity: 0,
      duration: 0.55,
      ease: 'expo.out'
    }, 0);

    // 5. Sécurité de transition vers le quiz après l'impact
    setTimeout(() => {
      onComplete();
    }, 650);
  };

  const handleProceedToParty = (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    if (step === 'tease') {
      setStep('party');
      // Le son démarre instantanément dès le clic sur continuer
      try {
        let aud = audioRef.current;
        if (!aud) {
          aud = new Audio('/lenaik/Raze%20Ultimate%20Voice%20Line.mp3');
          audioRef.current = aud;
        }
        aud.currentTime = 0;
        aud.play().catch(err => {
          console.log('Audio play error, falling back:', err);
          const fallback = new Audio('/lenaik/Raze%20Ultimate%20Voice%20Line.mp3');
          fallback.play().catch(e2 => console.log(e2));
        });

        // ====================================================================
        // DÉCLENCHEMENT DE L'EXPLOSION À LA 5ÈME SECONDE DU SON
        // ====================================================================
        const onTimeUpdate = () => {
          if (aud.currentTime >= 5.0) {
            aud.removeEventListener('timeupdate', onTimeUpdate);
            triggerExplosion();
          }
        };
        aud.addEventListener('timeupdate', onTimeUpdate);

        // Timer de sécurité calibré à 5 secondes pile
        setTimeout(() => {
          aud.removeEventListener('timeupdate', onTimeUpdate);
          triggerExplosion();
        }, 5000);
      } catch (err) {
        console.error(err);
        setTimeout(triggerExplosion, 5000);
      }
    }
  };

  // ==========================================================================
  // GSAP TIMELINE POUR LA PHASE 2 (TEASE : FUCK YOU BRO + BOUTON)
  // ==========================================================================
  useEffect(() => {
    if (step === 'tease') {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline();

        // État initial invisible pour un départ ultra-net sans saut
        gsap.set('.char-line1', {
          opacity: 0,
          y: -90,
          scale: 0.55,
          rotateX: -85,
          filter: 'blur(10px)',
          transformOrigin: '50% 100% -40px'
        });

        gsap.set('.char-line2', {
          opacity: 0,
          scale: 3.2,
          y: 45,
          rotateZ: () => gsap.utils.random(-15, 15),
          filter: 'blur(14px)'
        });

        gsap.set('.tease-prompt-btn', {
          opacity: 0,
          y: 35,
          scale: 0.75
        });

        // 1. Ligne 1 : "Fuck you" lettre par lettre avec élasticité 3D
        tl.to('.char-line1', {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          filter: 'blur(0px)',
          duration: 0.65,
          stagger: 0.045,
          ease: 'back.out(2)'
        })
          // 2. Ligne 2 : "BRO." impact puissant lettre par lettre
          .to('.char-line2', {
            opacity: 1,
            scale: 1,
            y: 0,
            rotateZ: 0,
            filter: 'blur(0px)',
            duration: 0.75,
            stagger: 0.08,
            ease: 'elastic.out(1.15, 0.45)'
          }, '-=0.25')
          // 3. Bouton "Appuyez pour continuer" surgit avec rebond
          .to('.tease-prompt-btn', {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            ease: 'back.out(2.2)',
            onComplete: () => {
              // Pulsation continue GSAP
              gsap.to('.tease-prompt-btn', {
                scale: 1.05,
                repeat: -1,
                yoyo: true,
                duration: 1.2,
                ease: 'sine.inOut'
              });
              // Mouvement de la flèche
              gsap.to('.prompt-arrow', {
                x: 5,
                repeat: -1,
                yoyo: true,
                duration: 0.7,
                ease: 'power1.inOut'
              });
            }
          }, '+=0.15');
      }, containerRef);

      return () => ctx.revert();
    }
  }, [step]);

  // ==========================================================================
  // GSAP TIMELINE POUR LA PHASE 3 (PARTY : IMAGE ZOOM + TITRE MOT PAR MOT)
  // ==========================================================================
  useEffect(() => {
    if (step === 'party') {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline();

        // 1. Flash blanc à l'impact
        tl.fromTo('.party-flash', {
          opacity: 0.95
        }, {
          opacity: 0,
          duration: 0.65,
          ease: 'power2.out'
        });

        // 2. Animation GSAP de l'image de fond : zoom cinématique + transition flou vers net
        tl.fromTo('.party-bg-img', {
          scale: 1.45,
          filter: 'blur(20px)',
          opacity: 0
        }, {
          scale: 1.0,
          filter: 'blur(0px)',
          opacity: 1,
          duration: 1.7,
          ease: 'expo.out'
        }, 0);

        // 3. Voile sombre pour le contraste
        tl.fromTo('.party-vignette', {
          opacity: 0
        }, {
          opacity: 1,
          duration: 1.1,
          ease: 'power1.out'
        }, 0.2);

        // 4. Grand Titre : chaque mot arrive individuellement en GSAP
        tl.fromTo('.party-word', {
          opacity: 0,
          y: -95,
          scale: 0.5,
          rotateX: -65,
          filter: 'blur(10px)',
          transformOrigin: '50% 50% -40px'
        }, {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          filter: 'blur(0px)',
          duration: 0.8,
          stagger: 0.08,
          ease: 'back.out(2.2)'
        }, 0.3);

        // Effet de mise en valeur sur le dernier mot ("PARTY !")
        tl.to('.party-word-last', {
          scale: 1.12,
          textShadow: '0 0 25px rgba(255, 255, 255, 0.95), 0 4px 20px rgba(0, 0, 0, 0.9)',
          duration: 0.35,
          yoyo: true,
          repeat: 1,
          ease: 'power2.inOut'
        }, '-=0.15');

        // 5. Sous-titre date
        tl.fromTo('.party-subtitle', {
          opacity: 0,
          y: 45,
          scale: 0.9,
          filter: 'blur(5px)'
        }, {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 0.75,
          ease: 'back.out(1.6)'
        }, '-=0.35');

        // 6. Bouton vers le questionnaire
        tl.fromTo('.party-cta-btn', {
          opacity: 0,
          scale: 0.6,
          y: 35
        }, {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.8,
          ease: 'elastic.out(1.2, 0.4)'
        }, '-=0.3');

        // Mouvement continu subtil de la caméra sur l'image (effet Ken Burns vivant)
        gsap.to('.party-bg-img', {
          scale: 1.06,
          x: -12,
          y: -8,
          duration: 15,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 1.7
        });
      }, containerRef);

      return () => ctx.revert();
    }
  }, [step]);

  const line1 = "Fuck you";
  const line2 = "NIGGY.";
  const titleWords = ["TU", "ES", "CONVIÉ", "À", "LA", "PARTY !"];

  return (
    <div
      ref={containerRef}
      onClick={step === 'tease' ? handleProceedToParty : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        userSelect: 'none',
        cursor: step === 'tease' ? 'pointer' : 'default',
        perspective: '1200px'
      }}
    >
      {/* ====================================================================
          ÉTAPE 1 : BLANC PUR TOTAL (Suspense 1.2s)
          ==================================================================== */}
      {step === 'blank' && (
        <div style={{ width: '100%', height: '100%', background: '#ffffff' }} />
      )}

      {/* ====================================================================
          ÉTAPE 2 : TOUT ANIME PAR GSAP (LETTRE PAR LETTRE + BOUTON)
          ==================================================================== */}
      {step === 'tease' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '24px',
          perspective: '1000px'
        }}>
          <div style={{
            fontFamily: "'Outfit', -apple-system, sans-serif",
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: '-0.04em',
            marginBottom: '40px'
          }}>
            {/* Ligne 1 : "Fuck you" animé lettre par lettre avec GSAP */}
            <div style={{
              fontSize: 'clamp(3.8rem, 13vw, 7.2rem)',
              color: '#000000',
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              {line1.split('').map((char, index) => (
                <span
                  key={index}
                  className="char-line1"
                  style={{
                    display: 'inline-block',
                    whiteSpace: char === ' ' ? 'pre' : 'normal'
                  }}
                >
                  {char}
                </span>
              ))}
            </div>

            {/* Ligne 2 : "BRO." animé lettre par lettre avec GSAP */}
            <div style={{
              fontSize: 'clamp(4.2rem, 15vw, 8.2rem)',
              color: '#000000',
              textTransform: 'uppercase',
              display: 'flex',
              justifyContent: 'center',
              marginTop: '4px'
            }}>
              {line2.split('').map((char, index) => (
                <span
                  key={index}
                  className="char-line2"
                  style={{
                    display: 'inline-block'
                  }}
                >
                  {char}
                </span>
              ))}
            </div>
          </div>

          {/* Bouton d'action animé par GSAP */}
          <div
            className="tease-prompt-btn"
            onClick={handleProceedToParty}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 28px',
              borderRadius: '9999px',
              background: '#09090b',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.22)'
            }}
          >
            <span>Appuyez pour continuer</span>
            <ChevronRight size={18} className="prompt-arrow" />
          </div>
        </div>
      )}

      {/* ====================================================================
          ÉTAPE 3 : ANIMATION GSAP CINÉMATIQUE SUR L'IMAGE & TOUS LES TEXTES
          ==================================================================== */}
      {step === 'party' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden'
        }}>
          {/* 1. L'IMAGE EN FOND : Zoom cinématique & respiration GSAP */}
          <img
            src="/lenaik/IMG_3534.jpg"
            alt="Lénaïk"
            className="party-bg-img"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              zIndex: 1
            }}
          />

          {/* 2. VOILE NOIR DÉGRADÉ : Fondu GSAP pour lisibilité absolue */}
          <div
            className="party-vignette"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.80) 0%, rgba(0, 0, 0, 0.10) 42%, rgba(0, 0, 0, 0.85) 100%)',
              zIndex: 2,
              pointerEvents: 'none'
            }}
          />

          {/* 3. FLASH BLANC INITIAL */}
          <div
            className="party-flash"
            style={{
              position: 'absolute',
              inset: 0,
              background: '#ffffff',
              zIndex: 3,
              pointerEvents: 'none'
            }}
          />

          {/* 4. ONDE DE CHOC DE L'EXPLOSION (5ÈME SECONDE) */}
          <div
            className="shockwave-ring"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '400px',
              height: '400px',
              marginTop: '-200px',
              marginLeft: '-200px',
              borderRadius: '50%',
              border: '14px solid #ff4400',
              boxShadow: '0 0 100px #ff2200, inset 0 0 80px #ffe600',
              zIndex: 35,
              pointerEvents: 'none',
              opacity: 0,
              transform: 'scale(0.05)'
            }}
          />

          {/* 5. FLASH TOTAL DE DÉTONATION (5ÈME SECONDE) */}
          <div
            className="detonation-flash"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at center, #ffffff 15%, #ff8800 65%, #ff2200 100%)',
              zIndex: 40,
              pointerEvents: 'none',
              opacity: 0
            }}
          />

          {/* 6. CANVAS PARTICULES D'EXPLOSION PHOTORÉALISTE (Feu, fumée volumétrique, étincelles à haute vélocité) */}
          <canvas
            ref={explosionCanvasRef}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 45,
              pointerEvents: 'none'
            }}
          />

          {/* 6. CONTENU TEXTUEL : CHAQUE MOT ARRIVE EN GSAP */}
          <div style={{
            position: 'relative',
            zIndex: 10,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '48px 20px 36px',
            boxSizing: 'border-box',
            textAlign: 'center'
          }}>
            {/* Titre : Mot par mot animé avec GSAP */}
            <div style={{
              maxWidth: '860px',
              marginTop: '12px',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '12px 18px',
              perspective: '800px'
            }}>
              {titleWords.map((word, idx) => {
                const isLast = idx === titleWords.length - 1;
                return (
                  <span
                    key={idx}
                    className={`party-word ${isLast ? 'party-word-last' : ''}`}
                    style={{
                      display: 'inline-block',
                      fontSize: 'clamp(2.4rem, 8vw, 4.4rem)',
                      fontWeight: 900,
                      lineHeight: 1.05,
                      letterSpacing: '-0.035em',
                      textTransform: 'uppercase',
                      color: '#ffffff',
                      textShadow: '0 4px 24px rgba(0, 0, 0, 0.95), 0 2px 8px rgba(0, 0, 0, 0.9)'
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>

            {/* Bas : Sous-titre et Bouton animés par GSAP */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '18px',
              maxWidth: '600px',
              width: '100%'
            }}>
              {/* Titre événement SANS DATE (soumis au vote dans le quiz) */}
              <div
                className="party-subtitle"
                style={{
                  fontSize: 'clamp(1.15rem, 4vw, 1.6rem)',
                  fontWeight: 700,
                  color: '#ffffff',
                  textShadow: '0 2px 16px rgba(0, 0, 0, 0.95)',
                  letterSpacing: '-0.01em'
                }}
              >
                L'Anniversaire de Jibril 🎂
              </div>

              {/* Bouton : Déclenche l'explosion immédiatement au clic ou laisse le son détoner à 5s */}
              <button
                onClick={triggerExplosion}
                className="btn-primary party-cta-btn"
                onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.05, duration: 0.2, ease: 'power2.out' })}
                onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.2, ease: 'power2.out' })}
                style={{
                  padding: '14px 34px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  background: '#ffffff',
                  color: '#09090b',
                  border: 'none',
                  boxShadow: '0 10px 35px rgba(0, 0, 0, 0.65)'
                }}
              >
                <span>Passer au questionnaire</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
