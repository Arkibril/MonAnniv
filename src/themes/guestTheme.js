// Thème visuel propre à certains invités.
// 'heist' : ambiance menu de jeu vidéo (Alexia), appliquée à toute sa session.

const normalize = (s = '') =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function getGuestTheme(guest) {
  if (!guest) return null;
  const name = normalize(guest.first_name);
  if (name.includes('alexia')) return 'heist';
  if (name.trim() === 'eray') return 'kebab';
  if (name.trim() === 'romain') return 'comic';
  if (name.trim() === 'lola') return 'cinema';
  if (name.trim() === 'baptiste') return 'dank';
  return null;
}

// Langue de l'interface pour l'invité ('tr' pour Eray, 'fr' sinon)
export function getGuestLang(guest) {
  return getGuestTheme(guest) === 'kebab' ? 'tr' : 'fr';
}

// Thèmes qui ne servent qu'à l'intro : le quiz garde le design de base
// (Baptiste : intro MLG, puis quiz clean comme la page d'accueil).
const INTRO_ONLY = new Set(['dank']);
export function getPageTheme(guest) {
  const theme = getGuestTheme(guest);
  return INTRO_ONLY.has(theme) ? null : theme;
}
