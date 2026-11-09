import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowRight } from 'lucide-react';
import { EVENT_CONFIG } from '../../config/event';
import { usePrefersReducedMotion } from '../../motion/usePrefersReducedMotion';

// =============================================================================
// Accueil simple (Sacha) : un bienvenue et l'explication du site, dans le
// design de base. Pas d'avance automatique : on prend le temps de lire.
// =============================================================================
export default function GeneralWelcome({ guest, onComplete }) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const firstName = (guest?.first_name || '').trim();
  const host = EVENT_CONFIG.hostName || 'Jibril';
  const withPartner = firstName.toLowerCase() === 'sacha';

  useEffect(() => {
    buttonRef.current?.focus({ preventScroll: true });
    if (reduced || !rootRef.current) return undefined;
    const ctx = gsap.context(() => {
      gsap.from('[data-rise]', { y: 22, opacity: 0, duration: 0.7, ease: 'expo.out', stagger: 0.07, delay: 0.15, clearProps: 'transform,opacity' });
    }, rootRef);
    return () => ctx.revert();
  }, [reduced]);

  const steps = [
    {
      title: 'Tu réponds à quelques questions',
      text: 'Deux minutes : le week-end qui t’arrange, Paris ou Strasbourg, le thème de la soirée, ce que tu bois et ce que tu manges.'
    },
    {
      title: 'Tu dis si tu seras là',
      text: `${host} a besoin de savoir qui vient pour tout organiser.`
    },
    {
      title: 'Tu vois les votes de tout le monde',
      text: 'Les résultats s’affichent en direct, et tu peux changer tes réponses quand tu veux.'
    }
  ];

  return (
    <div className="welcome welcome--general" role="dialog" aria-modal="true" aria-label={`Bienvenue ${firstName}`} ref={rootRef}>
      <div className="welcome__body welcome__body--general">
        <span className="gw-emoji" aria-hidden="true" data-rise>
          {guest?.emoji || '🎉'}
        </span>
        <h1 className="display" data-rise>
          <span className="display__pre">Bienvenue,</span>
          {firstName}.
        </h1>
        <p className="lede" data-rise style={{ margin: '14px auto 0' }}>
          Tu es invité à l’anniversaire de {host}. Ce petit site sert à organiser la soirée tous ensemble.
        </p>

        <ol className="gw-steps">
          {steps.map((s, i) => (
            <li key={s.title} className="gw-step" data-rise>
              <span className="gw-step__n" aria-hidden="true">
                {i + 1}
              </span>
              <span>
                <strong className="gw-step__title">{s.title}</strong>
                <span className="gw-step__text">{s.text}</span>
              </span>
            </li>
          ))}
        </ol>

        {withPartner && (
          <p className="gw-note" data-rise>
            Assiya a son propre accès : chacun vote pour soi.
          </p>
        )}

        <div data-rise style={{ marginTop: 26 }}>
          <button ref={buttonRef} type="button" onClick={onComplete} className="btn btn--ink btn--lg btn--block" style={{ maxWidth: 400 }}>
            C’est parti
            <span className="btn__knob" aria-hidden="true">
              <ArrowRight size={18} strokeWidth={2.4} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
