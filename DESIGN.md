# DESIGN — MonAnniv (style Apple)

Source de vérité : `src/index.css` (tokens dans `:root`, composants en classes).

## Principes
- Interface claire façon iOS / apple.com : fond gris système, surfaces blanches, un seul accent bleu.
- Typographie système Apple (SF Pro via `-apple-system`), aucune police web chargée.
- Listes groupées « inset » pour tout ce qui se choisit ou se lit en liste.
- Les emojis sont du contenu (options, avatars d'invités), jamais des icônes d'interface. Les icônes viennent de lucide-react.

## Tokens
| Rôle | Valeur |
|---|---|
| Fond | `--bg` #f5f5f7 |
| Surface | `--surface` #ffffff |
| Texte | `--label` #1d1d1f · `--label-2` #6e6e73 · `--label-3` #8e8e93 (placeholders) |
| Accent | `--accent` #0071e3 (hover #0077ed) |
| Succès / direct | `--green` #34c759 · texte #248a3d |
| Erreur | `--red` #ff3b30 · texte #d70015 |
| Séparateurs | rgba(60,60,67,.16 / .29), 0.5px |
| Rayons | 10 / 14 / 20 px, pilules 980px, feuille 24px |
| Mouvement | ease-out `cubic-bezier(.22,1,.36,1)`, 160ms / 320ms |

## Échelle typographique
Large title 34–48px/700/-0.028em · Title 1 26–32px · Title 2 22px · Headline 17px/600 · Body 17px · Subhead 15px · Footnote 13px.

## Composants
- `.btn` + `--filled` (action principale), `--tinted`, `--gray`, `--plain` ; `--large` (52px, rayon 14) pour les actions pleine largeur.
- `.field` (52px, bordure fine, halo bleu au focus, `--invalid` rouge) + `.field-error` sous le champ.
- `.group` / `.row` : lignes avec emoji en tête, titre, sous-titre, coche iOS (`.check`) ou cercle (`.circle-check`) pour le choix multiple.
- `.segmented` : contrôle segmenté (onglets admin).
- `.navbar` : barre translucide collante (flou 20px).
- `.meter` : barres de résultats ; la réponse en tête est bleue, les autres grises.
- `.bubble` : mur des messages façon Messages (gris, les siens en bleu à droite).
- `.avatar`, `.people` : invités en pastilles rondes.

## Exceptions
- L'intro vidéo sur-mesure de Lénaïk (`customIntros/`) garde son propre univers cinématographique.
