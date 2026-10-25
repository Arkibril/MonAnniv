---
name: MonAnniv
description: L'invitation à l'anniversaire de Jibril, en petite app mobile de soirée sur fond blanc pur.
colors:
  ground: "#ffffff"
  card: "#f4f4f6"
  card-strong: "#ebebef"
  ink: "#0b0b0c"
  ink-2: "#5f5f67"
  ink-3: "#74747c"
  accent: "#6b4eff"
  accent-ink: "#5537f0"
  accent-soft: "#efebff"
  success: "#1f7a4d"
  danger: "#c4251a"
typography:
  display:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: "clamp(46px, 13vw, 68px)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: "clamp(26px, 7vw, 32px)"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "-0.03em"
  title-2:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.5
  caption:
    fontFamily: "Manrope Variable, Manrope, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 600
    lineHeight: 1.35
rounded:
  sm: "14px"
  md: "20px"
  lg: "28px"
  xl: "36px"
  pill: "999px"
spacing:
  gutter-mobile: "20px"
  gutter-desktop: "32px"
  column: "520px"
  column-wide: "1040px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.pill}"
    padding: "0 26px"
    height: "58px"
  button-soft:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
  button-round:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "50%"
    size: "44px"
  chip:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "36px"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.lg}"
    padding: "20px"
  option-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.md}"
  field:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.pill}"
    height: "58px"
---

# Design System: MonAnniv

Source de vérité : `src/index.css` (tokens dans `:root`, composants en classes). Animations : `src/motion/` (Remotion) et GSAP dans les composants.

## Overview

Une petite app mobile de soirée, inspirée des apps de référence de Jibril (GoMart, Velora, AirPods Market) : fond blanc pur, cartes gris perle aux grands arrondis, gros titres serrés, une seule action noire en pilule. Épuré sans copier Apple : pas de gris système, pas de bleu, pas de listes de réglages.

## Colors

### Primary
- **Encre** `#0b0b0c` : texte, action principale, carte du vote phare, option choisie, capsule de navigation.

### Secondary
- **Violet** `#6b4eff` (texte `#5537f0`, fond `#efebff`) : réservé au « En direct », à la sélection de texte, au curseur et à une tuile par mosaïque. Jamais sur un bouton.

### Neutral
- **Fond** `#ffffff`, toujours blanc pur.
- **Carte** `#f4f4f6`, survol `#ebebef`.
- **Gris** `#5f5f67` (texte secondaire), `#74747c` (placeholders, métadonnées).

### Named Rules
- **Un seul accent.** Le violet signale le vivant (direct, sélection), rien d'autre.
- **Choisir, c'est encrer.** Une option sélectionnée passe en carte noire, texte blanc.

## Typography

Manrope Variable, hébergée avec le site (`@fontsource-variable/manrope`), pour tout.

### Hierarchy
- **Display** 46–68px / 800 / -0.04em : « Jibril. », « Bienvenue, Camille. », « Les votes. », avec une ligne d'amorce en 22–28px / 600 au-dessus.
- **Title** 26–32px / 800 : intitulés de question.
- **Title 2** 22px / 800 : titres de section.
- **Headline** 17px / 700, **Body** 16px / 500, **Caption** 12.5px / 600.

## Layout

Colonne de 520px pour le parcours invité, 1040px pour les résultats et l'admin. Marges 20px (mobile) / 32px (≥720px). La connexion passe en deux colonnes à partir de 960px (texte à gauche, mosaïque à droite). Résultats en grille 1 / 2 / 3 colonnes.

## Elevation & Depth

### Shadow Vocabulary
- `--lift` : boutons ronds, barre prénom, puces blanches.
- `--lift-2` : survol, option choisie.
- `--float` : capsule de navigation flottante.
Toutes les ombres ont un décalage vertical et un flou doux ; aucune ombre dure.

## Shapes

Rayons 14 / 20 / 28 / 36px, pilules à 999px. Champs, boutons et puces sont toujours en pilule ; cartes en 20–36px ; tuiles de mosaïque en 30–34px.

## Components

### Buttons
- **Pilule noire** (58px) pour l'action de l'écran, avec une pastille ronde blanche et une flèche à droite.
- **Bouton rond blanc** (44px, ombre douce) pour retour, déconnexion, actualiser.
- **Pilule grise** et **pilule blanche** pour les actions secondaires (« Copier »).

### Chips
Pilules de 36px, bordure fine, blanches ; la puce active passe à l'encre (onglets admin). Puces grises pour les infos (dates, villes).

### Cards / Containers
Cartes grises `#f4f4f6` sans bordure. La carte du vote du week-end est noire (encre) et porte le résultat en tête en display.

### Inputs / Fields
Barre de saisie blanche en pilule avec icône à gauche et bouton rond noir intégré (connexion, mot de passe admin). Champs gris en pilule ailleurs, blancs au focus avec contour encre.

### Navigation
- **Barre du haut** : boutons ronds + salutation (« Bonsoir, / Camille ») avec avatar emoji.
- **Capsule flottante** noire en bas des résultats : Votes, Mes réponses, Mon intro ; l'élément actif en pastille blanche.
- **Points de pagination** en pilule pour la progression du questionnaire.

### Signature : la mosaïque et l'intro (Remotion)
- `MosaicComposition` : trois colonnes de tuiles inclinées de -14° qui défilent en boucle (dates, villes, emojis de fête), fondu blanc sur les bords.
- `WelcomeComposition` : neuf tuiles éparpillées se rangent autour de l'emoji de l'invité ; la chorégraphie dépend de son prénom.
- GSAP : montée en cascade des contenus, glissement entre questions, coche qui rebondit, barres de résultats qui poussent et chiffres qui défilent, capsule qui remonte.
- `prefers-reduced-motion` : mosaïque et intro figées sur une image fixe, transitions coupées.

## Do's and Don'ts

### Do:
- Garder le fond blanc pur partout.
- Une seule pilule noire par écran pour l'action principale.
- Les emojis sont du contenu (options, invités, tuiles), jamais des icônes d'interface : les icônes viennent de lucide-react.

### Don't:
- Pas de gris système iOS, pas de bleu, pas de listes groupées façon Réglages.
- Pas de dégradé de texte, pas de verre décoratif, pas de grilles de chiffres-clés.
- Ne pas toucher à l'intro sur-mesure de Lénaïk (`customIntros/`), qui garde son univers.
