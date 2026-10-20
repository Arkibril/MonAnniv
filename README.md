# 🎂 Mon Anniversaire — Site Interactif & Votes en Temps Réel

Un site web moderne, élégant et mobile-first pour inviter vos amis à votre anniversaire, avec **codes secrets personnels**, **animation d'entrée déterministe unique par invité**, **questionnaire interactif** et **tableau de bord en direct (Supabase Realtime)**.

Ce projet est **100 % gratuit à héberger** et utilise **Supabase (offre gratuite)** pour la base de données PostgreSQL, les politiques RLS et le temps réel.

---

## 🌟 Fonctionnalités

1. **Connexion par code secret unique** :
   - Aucun mot de passe ni email requis pour vos invités.
   - Un code simple et mémorisable (ex: `CAMILLE-1024`, `MAXIME-4821`).
   - Mémorisation automatique de la session dans le navigateur.

2. **Animation d'accueil déterministe (Canvas)** :
   - Chaque code invité génère un seed mathématique unique.
   - Le seed détermine une palette néon/champagne, la forme et le mouvement des particules (feux d'artifice, cascade de confettis, vortex galactique, lucioles féériques) et un emoji totem.
   - Message personnalisé : *"Bienvenue [Prénom], tu es invité(e) à l'anniversaire de [Hôte] !"*.
   - Bouton *"Rejouer mon animation"* disponible à tout moment.

3. **Questionnaire d'Onboarding fluide** :
   - Une question par écran avec transitions soignées et barre de progression.
   - Le grand duel des dates : *"Tu préfères le 10 ou le 11 ?"*.
   - Confirmation de présence (Oui / Peut-être / Non).
   - Préférences alimentaires et boissons (choix multiples).
   - Ambiance musicale pour la soirée.
   - Mot doux / suggestion pour le mur des messages (200 caractères max).
   - Sauvegarde instantanée dans Supabase via des fonctions RPC sécurisées.

4. **Tableau de bord des votes en temps réel** :
   - Mise en avant du vote 10 vs 11 avec jauge animée proportionnelle et compteurs réactifs.
   - Statistiques en direct pour chaque question.
   - **Le Mur d'Or des invités** : affichage en direct des messages libres postés par les amis.
   - Liste des invités ayant déjà répondu.
   - Synchronisation instantanée via **Supabase Realtime**.

5. **Espace Organisateur (`/admin`)** :
   - Protection par mot de passe vérifié côté base de données (hash bcrypt dans Postgres, jamais exposé dans le bundle JavaScript).
   - Création individuelle d'un invité avec choix d'emoji.
   - Importation en masse (collez une liste de prénoms, les codes sont générés automatiquement).
   - Bouton **"Copier le message d'invitation"** en 1 clic prêt à être envoyé par SMS ou WhatsApp.
   - Exportation complète de tous les invités et leurs réponses au format **CSV / Excel**.
   - Interface pour changer le mot de passe administrateur.

---

## 🛠️ Stack Technique

- **Front-end** : [Vite](https://vitejs.dev/) + [React](https://react.dev/), Vanilla CSS moderne (Glassmorphism, Dark Festival, responsive mobile-first), Lucide Icons, Canvas Confetti.
- **Base de données & Temps Réel** : [Supabase](https://supabase.com) (PostgreSQL 15+, Row Level Security, Supabase Realtime).
- **Sécurité** : Fonctions RPC `SECURITY DEFINER` avec `search_path` strict. Table `guest_codes` et mot de passe admin totalement inaccessibles au public.

---

## 🚀 Guide de démarrage pas à pas

### Étape 1 : Créer votre projet Supabase gratuit

1. Rendez-vous sur [supabase.com](https://supabase.com) et créez un compte gratuit (ou connectez-vous avec GitHub).
2. Cliquez sur **"New Project"**.
3. Donnez un nom à votre projet (ex: `MonAnniv`), définissez un mot de passe pour la base de données Postgres, et choisissez une région proche (ex: `Frankfurt` ou `London`).
4. Patientez environ 1 minute pendant que Supabase initialise votre instance.

---

### Étape 2 : Exécuter le schéma SQL (`schema.sql`)

1. Dans votre projet Supabase, cliquez sur l'onglet **SQL Editor** dans la barre latérale gauche (icône `>_`).
2. Cliquez sur **"New query"**.
3. Ouvrez le fichier [`supabase/schema.sql`](supabase/schema.sql) de ce projet, copiez **l'intégralité** de son contenu, collez-le dans l'éditeur SQL de Supabase.
4. Cliquez sur **"Run"** (ou `Ctrl + Enter`).
5. Le message `Success. No rows returned` confirme que toutes les tables, politiques de sécurité (RLS), fonctions RPC et canaux temps réel sont créés !

---

### Étape 3 : Configurer les variables d'environnement (`.env`)

1. Dans Supabase, cliquez sur l'icône **Project Settings** (l'engrenage en bas à gauche), puis sur **Data API** (ou **API**).
2. Vous y trouverez deux valeurs :
   - **Project URL** (ex: `https://xyzcompany.supabase.co`)
   - **Project API Keys** -> clé étiquetée **`anon public`** (commence par `eyJ...`)
3. À la racine de votre projet local, ouvrez le fichier `.env` (créé à partir de [`.env.example`](.env.example)) et collez vos valeurs :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon-publique-ici
```

> ⚠️ **IMPORTANT :** Ne copiez **JAMAIS** la clé `service_role` dans le fichier `.env` du frontend. Seule la clé `anon` doit être utilisée.

---

### Étape 4 : Définir ou modifier le mot de passe administrateur

Par défaut, le script SQL initialise le mot de passe de l'espace `/admin` à : **`anniv2026`**.

Vous pouvez modifier ce mot de passe de deux façons :

#### Option A : Directement depuis l'espace `/admin`
1. Connectez-vous sur votre site sur `/admin` avec `anniv2026`.
2. Allez dans l'onglet **Sécurité**.
3. Saisissez votre nouveau mot de passe et cliquez sur **Enregistrer**.

#### Option B : Directement en SQL dans Supabase (en cas d'oubli)
Exécutez cette requête dans l'éditeur SQL de Supabase :

```sql
UPDATE public.admin_settings 
SET value_hash = crypt('VotreNouveauMotDePasseSecret', gen_salt('bf')),
    updated_at = now()
WHERE key = 'admin_password';
```

---

### Étape 5 : Lancer le projet en local

Installez les dépendances et lancez le serveur de développement :

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:5173](http://localhost:5173) dans votre navigateur !

---

### Étape 6 : Déploiement gratuit (Vercel ou Netlify)

Le site est conçu pour être déployé en un clic sur Vercel ou Netlify avec zéro coût.

#### Déploiement sur Vercel :
1. Poussez votre code sur GitHub ou GitLab.
2. Allez sur [vercel.com](https://vercel.com) et cliquez sur **"Add New Project"**.
3. Importez votre dépôt GitHub.
4. Dans la section **Environment Variables**, ajoutez :
   - `VITE_SUPABASE_URL` = votre URL Supabase
   - `VITE_SUPABASE_ANON_KEY` = votre clé publique anon
5. Cliquez sur **Deploy**. Votre site est en ligne avec HTTPS gratuit !

#### Déploiement sur Netlify :
1. Rendez-vous sur [netlify.com](https://netlify.com) et connectez votre dépôt.
2. Build command : `npm run build`
3. Publish directory : `dist`
4. Dans **Site configuration > Environment variables**, ajoutez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
5. Cliquez sur **Deploy site**.

---

## 🎨 Personnalisation Facile

Tous les paramètres de votre anniversaire sont regroupés dans deux fichiers simples à modifier :

### 1. Informations de l'anniversaire : [`src/config/event.js`](src/config/event.js)
Modifiez votre prénom, votre âge, les dates proposées et le texte d'ambiance :
```javascript
export const EVENT_CONFIG = {
  hostName: "Alexandre",
  datesProposed: "10 ou 11 Octobre",
  title: "L'Anniversaire d'Alexandre",
  subtitle: "Soirée festive, musique, verres & souvenirs mémorables 🥂"
};
```

### 2. Questions du sondage : [`src/config/questions.js`](src/config/questions.js)
Vous pouvez ajouter, modifier ou supprimer des questions en toute simplicité (formats : `single_choice`, `multiple_choice`, `text`).

---

## 🔒 Sécurité et Bonnes Pratiques

- **Row Level Security (RLS)** : Activé sur toutes les tables de la base de données.
- **Séparation stricte** : La table `guest_codes` (contenant les codes secrets) et la table `admin_settings` n'ont **aucune politique SELECT publique**. Elles sont invisibles depuis le client web.
- **Fonctions RPC** : Toutes les écritures et vérifications s'exécutent en `SECURITY DEFINER` avec un `search_path` verrouillé (`public, extensions`), empêchant toute injection ou usurpation.
- **Déterministe & Léger** : L'animation d'entrée est générée en HTML5 Canvas sans surcharge de librairies lourdes, garantissant une fluidité à 60 FPS sur mobile.
