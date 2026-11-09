# Le site de The Screen, The Seat et The Table

Site public de présentation des outils de Nizzren pour jouer à D&D 5.5 avec D&D Beyond. Ce dépôt est public : rien de personnel ni de secret dans ses fichiers. Interface en français. Mise en ligne et usage : `README.md`.

- **The Screen** : le gestionnaire de campagne du MJ (dépôt privé `cos_campaign_manager`), avec son extension du MJ, The Screen · Scribe.
- **The Seat** : les extensions Chrome des joueurs (dans le même dépôt, `extensions/`) : The Seat · Party (`groupe`), The Seat · Wild Shape (`druide`), The Seat · Companion (`compagnon`), et The Seat · Spark, l'appli des joueurs de The Table, à venir.
- **The Table** : la table de jeu avec écran à plat et ruban de lumière (dépôt `the-table`).

Ce dépôt est la **référence** pour les pages de The Table (`public/the-table.html`, `public/cagnotte.html`) : les anciennes pages de `the-table/site/` ne sont plus à jour.

## Règles

- **Pages statiques, sans build.** Pas de Node ni d'outil de build sur les postes de l'auteur. Cloudflare Pages sert `public/` et exécute `functions/` ; la base est D1 (`schema.sql`), liée sous le nom `DB`.
- **Ton.** Dire ce que fait l'outil, sans slogan ni formule creuse. Le site **vouvoie** ; seule `cagnotte.html`, qui s'adresse aux joueurs de la table, **tutoie**. Dans la démo, l'appli simulée tutoie le joueur : c'est la voix de l'appli.
- **The Table.** Pas de détails techniques (coffre, carte électronique, ventilation, Wi-Fi). Le MJ pilote la table depuis The Screen **ou** depuis sa télécommande (téléphone). Les ambiances, c'est le MJ qui les crée selon sa campagne.
- **Aucun téléchargement mis en avant en haut de page** : The Screen est un outil parmi les autres.
- **Style.** `public/site.css` reprend les jetons de la charte « Médiéval glorieux » du gestionnaire ; le thème « Malédiction de Strahd » reprend Barovie Néon. Couleurs, polices et formes par les variables, jamais en dur. `the-table.html` garde pour l'instant le style du projet The Table, dans son propre `<style>`.
- **Marques.** Pas de « D&D » dans le nom d'un outil ; la mention « non officiel, sans lien avec Wizards of the Coast » reste en pied de page. Les captures d'écran se font sur une campagne inventée, sans images de livres ni icônes de D&D Beyond.
- **Données tenues par les autres projets** : `public/donnees/versions.json` (à chaque version publiée), `public/donnees/journal.json` et `public/photos/` (le journal de The Table), `public/captures/`.
- **Secrets** : jamais dans le dépôt. Seules la clé de site Turnstile et le nom du dépôt GitHub sont dans `public/config.js`, et ils sont publics.

## Vérifier

- Les pages : `python -m http.server 8791 --directory public`, puis regarder en 1280 px et en largeur téléphone, dans les deux thèmes. Aucun défilement horizontal.
- L'API ne tourne pas en local sans Node : elle se vérifie en ligne, par la liste « À essayer une fois en ligne » du `README.md`.
