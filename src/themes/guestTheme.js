// Thème visuel propre à certains invités.
// 'heist' : ambiance menu de jeu vidéo (Alexia), appliquée à toute sa session.

const normalize = (s = '') =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function getGuestTheme(guest) {
  if (!guest) return null;
  const name = normalize(guest.first_name);
  if (name.includes('alexia')) return 'heist';
  return null;
}
