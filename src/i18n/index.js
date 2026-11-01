import { createContext, useCallback, useContext, useMemo } from 'react';
import { QUESTIONS } from '../config/questions';
import { TR_STRINGS, TR_QUESTIONS, TR_WORDS } from './tr';

// Langue de l'interface : 'fr' par défaut, 'tr' pour la session d'Eray.
const LangContext = createContext('fr');
export const LangProvider = LangContext.Provider;
export const useLang = () => useContext(LangContext);

// t('Texte français') → traduction si disponible, sinon le texte d'origine
export function useT() {
  const lang = useLang();
  return useCallback((fr) => (lang === 'tr' ? TR_STRINGS[fr] ?? fr : fr), [lang]);
}

// "3 votes" / "3 oy"
export function usePlural() {
  const lang = useLang();
  return useCallback(
    (n, word) => (lang === 'tr' ? `${n} ${TR_WORDS[word] ?? word}` : `${n} ${word}${n > 1 ? 's' : ''}`),
    [lang]
  );
}

function localizeQuestions(map) {
  return QUESTIONS.map((q) => {
    const tq = map[q.id];
    if (!tq) return q;
    return {
      ...q,
      title: tq.title ?? q.title,
      subtitle: tq.subtitle ?? q.subtitle,
      badge: tq.badge ?? q.badge,
      placeholder: tq.placeholder ?? q.placeholder,
      options: q.options?.map((o) => ({ ...o, ...(tq.options?.[o.id] || {}) }))
    };
  });
}

// Les questions du quiz dans la langue de l'invité (mêmes identifiants)
export function useQuestions() {
  const lang = useLang();
  return useMemo(() => (lang === 'tr' ? localizeQuestions(TR_QUESTIONS) : QUESTIONS), [lang]);
}
