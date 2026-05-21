# Site de capitalisation Massajobs

Site web statique présentant la méthode d'accompagnement de l'association Massajobs.

## Structure du projet

```
Création d'un site web/
├── index.html              # Page d'accueil
├── assets/
│   └── css/
│       └── style.css       # Feuille de style commune à toutes les pages
└── pages/
    ├── methode.html        # Index des pages "méthode"
    ├── posture.html        # Éclairer notre posture
    ├── matiere.html        # La matière de l'accompagnement
    ├── structure.html      # La structure de l'accompagnement
    ├── outils.html         # Les outils de l'accompagnement
    ├── aller-vers.html     # L'aller-vers
    ├── offre.html          # Formations et supervision
    ├── questions-reponses.html  # Q&R
    └── a-propos.html       # À propos du site
```

## Tester le site en local

Le site est composé de fichiers HTML/CSS statiques — aucun serveur n'est nécessaire pour le consulter.

**Option simple :** double-cliquez sur `index.html`, il s'ouvrira dans votre navigateur.

**Option avec serveur local** (recommandé pour tester comme en production) :

```bash
# Depuis le dossier du site, lancer un serveur local
cd "Création d'un site web"
python3 -m http.server 8000
# Puis ouvrir http://localhost:8000 dans le navigateur
```

---

# 🚀 Publier le site gratuitement sur GitHub Pages

GitHub Pages est un service gratuit qui héberge des sites statiques directement depuis un dépôt GitHub. Voici comment publier ce site, étape par étape.

## Pré-requis

- Un compte GitHub gratuit ([github.com](https://github.com))
- Le dossier du site sur votre ordinateur

## Étape 1 — Créer un dépôt GitHub

1. Connectez-vous à [github.com](https://github.com).
2. En haut à droite, cliquez sur **+** puis **"New repository"**.
3. Choisissez un nom de dépôt. Deux options :
   - **Site sous votre URL principale GitHub** (`https://votre-pseudo.github.io`) : nommez le dépôt exactement `votre-pseudo.github.io` (par exemple `massajobs.github.io`).
   - **Site sous une URL secondaire** (`https://votre-pseudo.github.io/nom-du-projet/`) : nommez-le librement, par exemple `capitalisation-massajobs`.
4. Cochez **"Public"** (obligatoire pour GitHub Pages gratuit).
5. **Ne cochez pas** "Add a README" pour l'instant.
6. Cliquez **"Create repository"**.

## Étape 2 — Mettre en ligne les fichiers du site

### Option A — Via l'interface web (la plus simple, sans installer Git)

1. Sur la page de votre dépôt fraîchement créé, cliquez **"uploading an existing file"**.
2. Faites glisser **tous les fichiers et dossiers** du site (`index.html`, le dossier `assets`, le dossier `pages`).
   - ⚠️ Important : GitHub doit recevoir les **dossiers eux-mêmes**, pas seulement les fichiers à plat. Sur Mac, vous pouvez sélectionner les éléments dans le Finder et les glisser tels quels dans la zone d'upload.
3. En bas de la page, dans la zone "Commit changes", écrivez un message comme `Première mise en ligne du site`.
4. Cliquez **"Commit changes"**.

### Option B — Via Git en ligne de commande (si vous êtes à l'aise)

```bash
cd "Création d'un site web"
git init
git add .
git commit -m "Première mise en ligne du site"
git branch -M main
git remote add origin https://github.com/votre-pseudo/nom-du-depot.git
git push -u origin main
```

## Étape 3 — Activer GitHub Pages

1. Sur la page de votre dépôt, cliquez sur l'onglet **"Settings"** (en haut à droite).
2. Dans le menu de gauche, cliquez sur **"Pages"** (section "Code and automation").
3. Sous **"Build and deployment"** → **"Source"**, sélectionnez **"Deploy from a branch"**.
4. Sous **"Branch"**, choisissez **`main`** (ou `master` selon votre cas) et **`/ (root)`**.
5. Cliquez **"Save"**.

GitHub affiche un message du type :
> Your site is live at `https://votre-pseudo.github.io/nom-du-depot/`

⏱️ Comptez 1 à 5 minutes pour que la première publication soit effective. Rafraîchissez la page Settings → Pages pour suivre l'avancement.

## Étape 4 — Visiter et partager le site

Ouvrez l'URL fournie par GitHub Pages dans votre navigateur. Le site est désormais en ligne et accessible à tout le monde.

## Mettre à jour le site

À chaque fois que vous modifiez un fichier :

**Via l'interface web :**
1. Allez sur le dépôt, cliquez sur le fichier à modifier puis sur l'icône **crayon ✏️** en haut à droite.
2. Faites vos modifications, descendez en bas et cliquez **"Commit changes"**.
3. Le site se met à jour automatiquement en 1 à 3 minutes.

**Pour ajouter ou remplacer un fichier complet :** cliquez sur **"Add file"** → **"Upload files"** depuis la racine du dépôt.

**Via Git :** `git add . && git commit -m "Mise à jour" && git push`.

## Utiliser un nom de domaine personnalisé (optionnel)

Si vous avez ou souhaitez acquérir un nom de domaine (par ex. `methode.massajobs.org`) :

1. Dans **Settings → Pages → Custom domain**, saisissez votre domaine.
2. Chez votre registrar (OVH, Gandi, etc.), ajoutez un enregistrement `CNAME` qui pointe `methode` vers `votre-pseudo.github.io`.
3. GitHub vérifie la configuration et active HTTPS automatiquement (24h à 48h).

---

## ✏️ Modifier le contenu

Toutes les pages sont des fichiers HTML simples que vous pouvez ouvrir avec n'importe quel éditeur de texte (TextEdit, Visual Studio Code, etc.) pour modifier le contenu.

**Pour changer une couleur ou la typographie globale :** modifiez les variables `--color-...` ou `--font-...` au début du fichier `assets/css/style.css`.

**Pour ajouter une nouvelle page :** dupliquez n'importe quel fichier dans `pages/`, modifiez son contenu, et ajoutez un lien vers cette nouvelle page dans la barre de navigation (`<nav class="site-nav">` présent en haut de chaque page).

---

## Licence

Contenu publié sous licence **Creative Commons CC BY-NC-SA 4.0**.
Partage et adaptation autorisés à des fins non commerciales, avec attribution à **Massajobs** et partage sous la même licence.
Pour tout usage commercial : <contact@massajobs.fr>.
