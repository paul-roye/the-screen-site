# Le site de The Screen, The Seat et The Table

La page de présentation des trois outils, avec le téléchargement des dernières versions, une boîte à idées, le signalement des bugs, les nouvelles par courriel et la cagnotte de The Table.

En ligne : https://the-screen-site.pages.dev (projet Cloudflare Pages `the-screen-site`, base D1 `the-screen-site`).

Le site est fait de pages statiques (`public/`) et d'une petite API (`functions/`) qui range ce que les visiteurs envoient dans une base D1. Il est prévu pour **Cloudflare Pages**, qui le déploie à chaque `git push`. Rien à installer sur le poste : ni Node, ni outil de build.

## Ce qu'il y a dans le dépôt

| Chemin | Contenu |
|---|---|
| `public/index.html` | La page principale : The Screen, The Seat, The Table, idées, bugs, nouvelles |
| `public/the-table.html` | La démo de The Table, côté MJ et côté joueurs (page autonome, avec son propre style) |
| `public/cagnotte.html` | La cagnotte de The Table, pour les joueurs (tutoiement) |
| `public/admin.html` | La page de l'auteur : relire les idées, lire les bugs, les promesses, les abonnés |
| `public/site.css`, `public/site.js` | Le style et le script communs à `index.html` et `cagnotte.html` |
| `public/config.js` | Deux réglages : le dépôt GitHub des téléchargements, la clé de site Turnstile |
| `public/donnees/versions.json` | Les versions en cours et le nom de leurs zips : **à mettre à jour à chaque version** |
| `public/donnees/journal.json` | Le journal de fabrication de The Table ; ses photos dans `public/photos/` |
| `public/captures/` | Les captures d'écran : `the-screen.webp` (le tableau de bord, sur la campagne témoin), et celles des extensions, `party.webp`, `wild-shape.webp`, `companion.webp` |
| `public/telechargements/` | Les zips à télécharger, servis tels quels |
| `functions/api/` | L'API : `idees`, `idees/<id>/vote`, `bugs`, `promesses`, `lettre`, `retours`, `admin` |
| `lib/outils.js` | Les fonctions communes de l'API |
| `schema.sql` | Les tables de la base D1 et les premières idées |

## Regarder les pages sur son poste

Avec Python (les formulaires et la boîte à idées ne répondent pas : l'API ne tourne que chez Cloudflare) :

```bash
python -m http.server 8791 --directory public
```

Puis ouvrir http://localhost:8791/.

## Mettre en ligne, la première fois

Les intitulés du tableau de bord Cloudflare changent parfois ; l'ordre des étapes, lui, tient.

1. **GitHub.** Créer un dépôt **public** `the-screen-site`, y pousser ce dossier. Si le dépôt porte un autre nom ou un autre propriétaire, corriger `depot` dans `public/config.js` (il ne sert qu'au lien « Versions précédentes »).
2. **Cloudflare Pages.** Créer un compte Cloudflare, puis « Workers & Pages » → créer un projet **Pages** relié au dépôt GitHub. Réglages de build : pas de framework, commande de build vide, dossier de sortie `public`.
3. **Base D1.** « Storage & Databases » → D1 → créer une base `the-screen-site`. Dans son onglet Console, coller le contenu de `schema.sql` et l'exécuter.
4. **Lier la base.** Dans le projet Pages → Settings → Bindings → ajouter une base D1, nom de variable **`DB`**, base `the-screen-site`.
5. **Secrets.** Dans le projet Pages → Settings → Variables and Secrets, ajouter (en « Secret ») :

   | Nom | Rôle |
   |---|---|
   | `JETON_ADMIN` | Le mot de passe de `admin.html`. Une longue chaîne au hasard. |
   | `JETON_RETOURS` | Lecture seule des idées et des bugs, pour les projets des outils. Une autre chaîne au hasard. |
   | `CODE_CAGNOTTE` | Le code d'invitation à donner aux joueurs. Sans lui, la cagnotte reste fermée. |
   | `SEL` | Une chaîne au hasard, qui sert à hacher les adresses IP (une voix par personne, limite d'envois). |
   | `TURNSTILE_SECRET` | La clé secrète Turnstile (étape 6). **Sans elle, aucun contrôle anti-robot.** |

6. **Turnstile.** Dans Cloudflare → Turnstile → ajouter un widget pour le domaine du site. La clé de site va dans `turnstile` de `public/config.js` (elle est publique), la clé secrète dans `TURNSTILE_SECRET`.
7. **Redéployer** (un `git push`, ou « Retry deployment ») pour que la liaison et les secrets soient pris en compte.
8. **Les zips.** Ils sont dans le dépôt, sous `public/telechargements/`, et servis tels quels : les boutons « Télécharger » pointent vers `telechargements/<zip>`. Pas de Release GitHub à créer.

### À essayer une fois en ligne

L'API n'a encore jamais tourné : elle a été écrite sans pouvoir être lancée sur le poste. Premier passage à faire, dans l'ordre :

- la boîte à idées montre les quatre idées de départ, et un clic sur ▲ change le compte ;
- une idée envoyée arrive dans `admin.html`, et paraît sur le site après « Publier » ;
- un bug envoyé arrive dans `admin.html` ;
- une inscription aux nouvelles arrive dans `admin.html` ;
- sur `cagnotte.html`, un mauvais code est refusé, le bon code ajoute une participation au palier choisi et aux paliers en dessous ;
- chaque bouton « Télécharger » rend bien son zip.

## Au quotidien

- **Une nouvelle version d'un outil** : copier son zip dans `public/telechargements/` (les anciens peuvent y rester : « Versions précédentes » mène à ce dossier sur GitHub), mettre à jour sa ligne dans `public/donnees/versions.json` (`version`, `date`, `fichier`, et pour The Screen `nouveautes` et `points`), et pousser.
- **Une nouvelle du journal de The Table** : l'ajouter en tête de `public/donnees/journal.json` (`date` en AAAA-MM-JJ, `titre`, `texte`, `photos` : des chemins comme `photos/2026-11-20-ruban.jpg`), déposer les photos dans `public/photos/`, pousser.
- **Une capture d'écran d'extension** : la déposer dans `public/captures/` sous le nom attendu ; tant qu'elle manque, la fenêtre dit « Capture à venir ».
- **Relire ce que le site a reçu** : ouvrir `/admin.html` et y coller `JETON_ADMIN`.
- **Écrire aux abonnés** : leur liste est dans `admin.html`. Le site n'envoie aucun courriel lui-même.
- **Depuis le projet d'un outil**, lire ses idées et ses bugs :

  ```powershell
  Invoke-RestMethod -Headers @{ Authorization = "Bearer $env:JETON_RETOURS" } "https://the-screen-site.pages.dev/api/retours?outil=the-screen&depuis=2026-11-01"
  ```

  Outils : `the-screen`, `scribe`, `party`, `wild-shape`, `companion`, `the-table`.

## Ce que le site garde

- Idées et bugs : le texte envoyé, le prénom ou pseudo s'il est donné.
- Promesses : le prénom, le palier, le mot pour le MJ. Le site ne montre que le nombre de participations par palier. Une promesse n'est pas un paiement : le site n'encaisse rien.
- Nouvelles par courriel : l'adresse et les sujets choisis.
- Pour chaque envoi, une empreinte de l'adresse IP (hachée avec `SEL`), jamais l'adresse elle-même.
