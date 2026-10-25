---
version: 1
slug: "src-app-jsx"
primary_target: "src/App.jsx"
related_targets: []
---

Scope: toute l'interface invité (connexion, intro, questionnaire, résultats) et l'espace organisateur. Mode : Operate (la connexion est une porte d'entrée, pas une landing).
Audience/job : un ami sur iPhone, lien ouvert depuis WhatsApp, répond en 2 minutes et regarde qui vient.
Constraints : conserver toute la logique, Supabase, l'intro Lénaïk ; copie inchangée sauf libellés d'interface.

## Direction contract
THESIS: L'invitation se comporte comme une app Apple : grandes typographies système, listes groupées iOS, un seul bleu. Refuse le tableau de bord à cartes-statistiques et les pastilles vertes de quiz.
OWN-WORLD: Fond #f5f5f7, surfaces blanches arrondies 18px, séparateurs fins inset, texte #1d1d1f / #6e6e73, accent #0071e3, coches iOS, contrôle segmenté, barre de navigation translucide, bulles grises façon Messages pour le mur.
STORY: L'invité entre son prénom, est accueilli par son nom, répond question par question comme dans Réglages, puis voit les résultats et les messages comme une conversation.
FIRST VIEWPORT: Connexion : grand titre « L'anniversaire de Jibril. » à gauche-centre, sous-titre des dates, un champ « Ton prénom » et un bouton bleu pleine largeur, rien d'autre.
FORM: Apple HIG / apple.com, imposé par le brief (direction épinglée, pas de tirage). seed: none (unavailable)
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
