// ==============================================================================
// CONFIGURATION DU QUESTIONNAIRE D'ONBOARDING - ANNIVERSAIRE DE JIBRIL
// ==============================================================================
// Types supportés :
// - 'single_choice' : Choix unique avec boutons radio stylisés
// - 'multiple_choice': Choix multiples avec cases à cocher
// - 'text' : Texte libre avec limite de caractères
// ==============================================================================

export const QUESTIONS = [
  {
    id: "q_date",
    type: "single_choice",
    title: "Quel week-end préfères-tu pour fêter mon anniversaire ?",
    subtitle: "💡 Bon à savoir : le Vendredi 25 Décembre et le Vendredi 1er Janvier sont fériés ! C'est l'occasion idéale pour profiter d'un long week-end festif prolongé 🥂",
    badge: "Vote prioritaire ⭐",
    isDateQuestion: true, // Mise en avant spéciale dans le Dashboard
    options: [
      {
        id: "19_dec",
        label: "Week-end du 19 Décembre",
        sublabel: "Samedi 19 & Dimanche 20 Décembre",
        emoji: "🗓️"
      },
      {
        id: "25_dec",
        label: "Week-end du 25 Décembre",
        sublabel: "Vendredi 25 (Férié / Noël) au Dimanche 27 Décembre",
        badge: "Vendredi 25 Férié ! 🎄",
        emoji: "🎄"
      },
      {
        id: "01_jan",
        label: "Week-end du 1er Janvier",
        sublabel: "Vendredi 1er (Férié / Nouvel An) au Dimanche 3 Janvier",
        badge: "Vendredi 1er Férié ! 🎉",
        emoji: "🥂"
      },
      {
        id: "any",
        label: "Tous ces week-ends me vont !",
        sublabel: "Je m'adapte à la majorité, chaud(e) dans tous les cas",
        emoji: "🔥"
      }
    ],
    required: true
  },
  {
    id: "q_city",
    type: "single_choice",
    title: "Tu préfères que la soirée se passe à Paris ou à Strasbourg ?",
    subtitle: "Deux options sur la table ! Vote pour la destination qui t'arrange le plus.",
    badge: "Destination 📍",
    options: [
      {
        id: "paris",
        label: "Paris",
        sublabel: "Ambiance capitale, bars branchés, rooftop & vie nocturne 🗼",
        emoji: "🗼"
      },
      {
        id: "strasbourg",
        label: "Strasbourg",
        sublabel: "Vibes alsaciennes festives, féerie d'hiver & convivialité 🥨",
        emoji: "🥨"
      },
      {
        id: "both",
        label: "Les deux me vont, je me déplace !",
        sublabel: "Chaud(e) pour Paris comme pour Strasbourg, peu importe le lieu !",
        emoji: "🚆"
      }
    ],
    required: true
  },
  {
    id: "q_theme",
    type: "single_choice",
    title: "Quel thème d'anniversaire te chauffe le plus ?",
    subtitle: "Vote pour l'univers dans lequel tu as envie de plonger toute la nuit !",
    badge: "Thème de la soirée 🎭",
    options: [
      {
        id: "gaming",
        label: "Jeux Vidéo & Gaming",
        sublabel: "Cosplay gaming, tournois rétro & bangers geek 🎮",
        emoji: "🎮"
      },
      {
        id: "horror",
        label: "Horreur & Frissons",
        sublabel: "Manoir hanté, ambiance mystère, zombies & scream 👻",
        emoji: "👻"
      },
      {
        id: "cinema",
        label: "Cinéma, Séries & Hollywood",
        sublabel: "Tapis rouge, personnages cultes du grand écran & popcorn 🎬",
        emoji: "🎬"
      },
      {
        id: "anime",
        label: "Manga, Anime & Neo-Tokyo",
        sublabel: "Shonen légendaires, cyberpunk japonais & cosplay ⛩️",
        emoji: "⛩️"
      },
      {
        id: "y2k_2000s",
        label: "Années 2000 & Rétro Y2K",
        sublabel: "Nostalgie pop, baggy, boules à facettes & hits rétro 🪩",
        emoji: "🪩"
      },
      {
        id: "free",
        label: "Soirée libre / Tous les thèmes me vont !",
        sublabel: "Peu importe le dress code, je suis chaud(e) dans tous les cas ! ✨",
        emoji: "✨"
      }
    ],
    required: true
  },
  {
    id: "q_presence",
    type: "single_choice",
    title: "Seras-tu de la fête pour célébrer ça avec moi ?",
    subtitle: "Dis-moi si tu peux être là pour trinquer et mettre le feu.",
    options: [
      {
        id: "yes",
        label: "Présent(e) à 100% !",
        sublabel: "Je ne raterais ça pour rien au monde 🥳",
        emoji: "🎉"
      },
      {
        id: "maybe",
        label: "Peut-être / Je te redis vite",
        sublabel: "En attente de confirmation de mon planning 🤞",
        emoji: "🤞"
      },
      {
        id: "no",
        label: "Malheureusement pas possible 😢",
        sublabel: "De tout cœur avec vous par la pensée",
        emoji: "💔"
      }
    ],
    required: true
  },
  {
    id: "q_drinks",
    type: "multiple_choice",
    title: "Côté verres & bar, qu'est-ce qu'on te sert ?",
    subtitle: "Sélectionne tout ce qui te fera plaisir à siroter pendant la soirée.",
    options: [
      { id: "cocktails", label: "Cocktails & Long drinks", sublabel: "Mojito, Spritz, Gin Tonic...", emoji: "🍸" },
      { id: "beers", label: "Bières fraîches & Cidre", sublabel: "Blondes, IPA, artisanales...", emoji: "🍺" },
      { id: "wine", label: "Vin rouge, blanc ou bulles", sublabel: "Champagne, Prosecco...", emoji: "🍾" },
      { id: "shots", label: "Shots & Shooters", sublabel: "Tequila, Jäger, Rhum arrangé...", emoji: "🔥" },
      { id: "soft", label: "Sans alcool / Mocktails", sublabel: "Sodas, jus frais, mocktails fruités...", emoji: "🧃" }
    ],
    required: false
  },
  {
    id: "q_food",
    type: "multiple_choice",
    title: "Côté buffet & grignotage, tes préférences ?",
    subtitle: "Pour être certain(e) que tout le monde se régale sans restriction.",
    options: [
      { id: "apero", label: "Planches apéro & Tapas", sublabel: "Charcuterie, fromages affinés, tartinades...", emoji: "🧀" },
      { id: "street_food", label: "Street food & Finger food", sublabel: "Mini-burgers, pizzas, samoussas...", emoji: "🍕" },
      { id: "veggie", label: "Végétarien(ne) / Vegan", sublabel: "100% végétal et gourmand", emoji: "🥗" },
      { id: "gluten_free", label: "Sans gluten / Allergies", sublabel: "Prévoir des options adaptées", emoji: "🌾" },
      { id: "sweet", label: "Team desserts & sucré", sublabel: "Gâteaux, bonbons, chocolat...", emoji: "🍰" }
    ],
    required: false
  },
  {
    id: "q_music",
    type: "single_choice",
    title: "Quelle ambiance musicale pour le dancefloor ?",
    subtitle: "Un vote démocratique pour créer la playlist idéale de la nuit.",
    options: [
      { id: "urban", label: "Rap FR & US, Hip-Hop, R&B", sublabel: "Classiques et bangers du moment", emoji: "🔥" },
      { id: "pop_2000", label: "Années 2000 & Nostalgie Pop", sublabel: "Les refrains que tout le monde connaît par cœur", emoji: "🪩" },
      { id: "electro", label: "Électro, House & Tech Club", sublabel: "Rythme lourd pour danser jusqu'au matin", emoji: "⚡" },
      { id: "afro_latino", label: "Afrobeats, Reggaeton & Latino", sublabel: "Vibes solaires et entraînantes", emoji: "🌴" }
    ],
    required: false
  },
  {
    id: "q_message",
    type: "text",
    title: "Un mot doux, un son pour la playlist ou un défi pour Jibril ?",
    subtitle: "Ce message apparaîtra directement sur le Mur d'Or des invités !",
    placeholder: "Ex: Trop hâte de fêter ça avec toi ! Fais péter '...' sur la sono et prépare-toi pour le duel...",
    maxLength: 250,
    required: false
  }
];
