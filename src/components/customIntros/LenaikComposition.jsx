import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring, Img, Audio } from 'remotion';

export const LenaikComposition = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1 : frame 0 à 45
  const opacity1 = interpolate(frame, [0, 36, 44], [1, 1, 0], {
    extrapolateRight: 'clamp'
  });

  // Phase 2 : Déclenchement à frame 46
  const startPhase2 = 46;
  const frameInPhase2 = Math.max(0, frame - startPhase2);

  const opacity2 = interpolate(frame, [startPhase2, startPhase2 + 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  // Animation de zoom cinématique de l'image
  const imageScale = interpolate(frameInPhase2, [0, 30], [1.3, 1.0], {
    extrapolateRight: 'clamp'
  });

  const line1 = "Fuck you";
  const line2 = "NIGGY.";
  const titleWords = ["TU", "ES", "CONVIÉ", "À", "LA", "PARTY !"];

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
      textAlign: 'center',
      position: 'relative',
      userSelect: 'none',
      overflow: 'hidden'
    }}>
      {/* Audio Remotion : Joué STRICTEMENT UNE FOIS au début de la phase 2 */}
      {frame >= startPhase2 && (
        <Audio
          src="/lenaik/Raze%20Ultimate%20Voice%20Line.mp3"
          volume={1}
        />
      )}

      {/* ====================================================================
          PHASE 1 : LETTRES ANIMÉES EN REMOTION
          ==================================================================== */}
      {frame < 46 && (
        <div style={{
          opacity: opacity1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 0.95,
          letterSpacing: '-0.04em',
          fontWeight: 900,
          padding: '24px'
        }}>
          {/* Ligne 1 : "Fuck you" lettre par lettre avec spring */}
          <div style={{
            fontSize: 'clamp(4rem, 14vw, 7.5rem)',
            color: '#000000',
            display: 'flex',
            justifyContent: 'center'
          }}>
            {line1.split('').map((char, index) => {
              const charSpring = spring({
                frame: Math.max(0, frame - index * 2),
                fps,
                config: { damping: 12, stiffness: 120 }
              });
              const translateY = interpolate(charSpring, [0, 1], [-60, 0]);
              return (
                <span
                  key={index}
                  style={{
                    display: 'inline-block',
                    whiteSpace: char === ' ' ? 'pre' : 'normal',
                    transform: `translateY(${translateY}px) scale(${charSpring})`,
                    opacity: charSpring
                  }}
                >
                  {char}
                </span>
              );
            })}
          </div>

          {/* Ligne 2 : "BRO." avec slam spring */}
          <div style={{
            fontSize: 'clamp(4.5rem, 16vw, 8.5rem)',
            color: '#000000',
            textTransform: 'uppercase',
            display: 'flex',
            justifyContent: 'center',
            marginTop: '8px'
          }}>
            {line2.split('').map((char, index) => {
              const charSpring = spring({
                frame: Math.max(0, frame - 14 - index * 3),
                fps,
                config: { damping: 14, stiffness: 140 }
              });
              const scale = interpolate(charSpring, [0, 1], [2, 1]);
              return (
                <span
                  key={index}
                  style={{
                    display: 'inline-block',
                    transform: `scale(${scale})`,
                    opacity: charSpring
                  }}
                >
                  {char}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          PHASE 2 : IMAGE EN PLEIN ÉCRAN ANIMÉE + MOTS EN SPRING
          ==================================================================== */}
      {frame >= 46 && (
        <div style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: opacity2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden'
        }}>
          {/* L'image en gros qui couvre tout le fond avec zoom cinématique */}
          <Img
            src="/lenaik/IMG_3534.jpg"
            alt="Lénaïk"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              transform: `scale(${imageScale})`
            }}
          />

          {/* Voile noir dégradé pour garantir la clarté parfaite */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.80) 0%, rgba(0, 0, 0, 0.12) 42%, rgba(0, 0, 0, 0.85) 100%)',
            pointerEvents: 'none'
          }} />

          {/* Titre mot par mot en haut */}
          <div style={{
            position: 'relative',
            zIndex: 10,
            padding: '48px 24px 0',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '12px 18px'
          }}>
            {titleWords.map((word, idx) => {
              const wordSpring = spring({
                frame: Math.max(0, frameInPhase2 - 4 - idx * 3),
                fps,
                config: { damping: 13, stiffness: 110 }
              });
              const translateY = interpolate(wordSpring, [0, 1], [-50, 0]);
              return (
                <span
                  key={idx}
                  style={{
                    display: 'inline-block',
                    fontSize: 'clamp(2.4rem, 8vw, 4.4rem)',
                    fontWeight: 900,
                    lineHeight: 1.05,
                    letterSpacing: '-0.035em',
                    textTransform: 'uppercase',
                    color: '#ffffff',
                    textShadow: '0 4px 24px rgba(0, 0, 0, 0.95), 0 2px 8px rgba(0, 0, 0, 0.9)',
                    transform: `translateY(${translateY}px) scale(${wordSpring})`,
                    opacity: wordSpring
                  }}
                >
                  {word}
                </span>
              );
            })}
          </div>

          {/* Sous-titre en bas */}
          <div style={{
            position: 'relative',
            zIndex: 10,
            paddingBottom: '40px'
          }}>
            {(() => {
              const subSpring = spring({
                frame: Math.max(0, frameInPhase2 - 20),
                fps,
                config: { damping: 15, stiffness: 90 }
              });
              const translateY = interpolate(subSpring, [0, 1], [30, 0]);
              return (
                <div style={{
                  fontSize: 'clamp(1.15rem, 4vw, 1.6rem)',
                  fontWeight: 700,
                  color: '#ffffff',
                  textShadow: '0 2px 16px rgba(0, 0, 0, 0.95)',
                  letterSpacing: '-0.01em',
                  transform: `translateY(${translateY}px)`,
                  opacity: subSpring
                }}>
                  L'Anniversaire de Jibril 🎂
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
