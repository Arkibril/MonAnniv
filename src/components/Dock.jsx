import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { BarChart3, PencilLine, Sparkles } from 'lucide-react';

// Barre de navigation flottante en capsule noire, la vue active en pastille blanche
export default function Dock({ active = 'votes', onVotes, onAnswers, onReplay }) {
  const ref = useRef(null);

  const items = [
    { id: 'votes', label: 'Votes', icon: BarChart3, onClick: onVotes },
    { id: 'answers', label: 'Mes réponses', icon: PencilLine, onClick: onAnswers },
    { id: 'replay', label: 'Mon intro', icon: Sparkles, onClick: onReplay },
  ];

  // La capsule remonte du bas de l'écran à l'arrivée sur la page
  useLayoutEffect(() => {
    const dock = ref.current;
    if (!dock || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const tween = gsap.from(dock, { y: 90, opacity: 0, duration: 0.9, ease: 'expo.out', delay: 0.3, clearProps: 'transform,opacity' });
    return () => tween.kill();
  }, []);

  return (
    <div className="dock-wrap">
      <nav className="dock" ref={ref} aria-label="Navigation">
        {items.map(({ id, label, icon: Icon, onClick }) => (
          <button
            key={id}
            type="button"
            className="dock__item"
            aria-current={active === id ? 'page' : undefined}
            aria-label={label}
            onClick={onClick}
          >
            <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
            <span className="dock__label">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
