import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { sfxMissionPassed } from './sound';

const REWARD = 25122;
const fmt = (n) => Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ');

// Écran de fin du quiz pour le thème "jeu" : bandeau, titre doré,
// récompense qui défile, puis retour automatique au tableau de bord.
export default function MissionPassed({ onDone }) {
  const rootRef = useRef(null);
  const cashRef = useRef(null);
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    gsap.to(rootRef.current, { autoAlpha: 0, duration: 0.35, ease: 'power2.in', onComplete: onDone });
  }, [onDone]);

  useEffect(() => {
    sfxMissionPassed();
    const t = setTimeout(finish, 4800);
    const onKey = (e) => (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') && finish();
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [finish]);

  useLayoutEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const counter = { v: 0 };
    const ctx = gsap.context(() => {
      if (reduced) {
        cashRef.current.textContent = `+ ${fmt(REWARD)} $`;
        return;
      }
      const tl = gsap.timeline();
      tl.from(rootRef.current, { autoAlpha: 0, duration: 0.3 })
        .from('.hx-passed-band', { scaleY: 0, duration: 0.45, ease: 'expo.out' }, 0.05)
        .from('.hx-passed-title', { scale: 1.6, autoAlpha: 0, duration: 0.55, ease: 'expo.out' }, 0.15)
        .from('.hx-passed-sub', { autoAlpha: 0, y: 10, duration: 0.4, ease: 'expo.out' }, 0.55)
        .from('.hx-passed-cash', { autoAlpha: 0, duration: 0.2 }, 0.75)
        .to(counter, {
          v: REWARD,
          duration: 1.4,
          ease: 'power2.out',
          onUpdate: () => {
            if (cashRef.current) cashRef.current.textContent = `+ ${fmt(counter.v)} $`;
          }
        }, 0.75)
        .from('.hx-passed-hint', { autoAlpha: 0, duration: 0.4 }, 1.6);
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="hx-passed" role="dialog" aria-label="Mission réussie" onClick={finish}>
      <div className="hx-passed-band">
        <h1 className="hx-passed-title">Mission réussie</h1>
        <p className="hx-passed-sub">Invitation confirmée, réponses enregistrées</p>
        <span className="hx-passed-cash" ref={cashRef}>+ 0 $</span>
      </div>
      <button type="button" className="hx-passed-hint" onClick={finish}>
        Appuie pour voir les votes
      </button>
    </div>
  );
}
