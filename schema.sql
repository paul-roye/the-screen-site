-- Base D1 du site. À coller une fois dans la console de la base (tableau de bord Cloudflare, D1, onglet Console).
-- Peut se relancer sans rien casser : chaque table n'est créée que si elle manque.

CREATE TABLE IF NOT EXISTS idees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  outil TEXT NOT NULL,                          -- the-screen, scribe, party, wild-shape, companion, the-table
  titre TEXT NOT NULL,
  texte TEXT NOT NULL DEFAULT '',
  auteur TEXT NOT NULL DEFAULT '',
  statut TEXT NOT NULL DEFAULT 'attente',       -- attente, publiee, refusee
  origine TEXT NOT NULL DEFAULT 'site',         -- site, feuille-de-route
  empreinte TEXT NOT NULL DEFAULT '',
  cree TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS voix (
  idee INTEGER NOT NULL,
  empreinte TEXT NOT NULL,
  cree TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (idee, empreinte)
);

CREATE TABLE IF NOT EXISTS bugs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  outil TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '',
  texte TEXT NOT NULL,
  attendu TEXT NOT NULL DEFAULT '',
  auteur TEXT NOT NULL DEFAULT '',
  statut TEXT NOT NULL DEFAULT 'nouveau',       -- nouveau, traite
  empreinte TEXT NOT NULL DEFAULT '',
  cree TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS promesses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prenom TEXT NOT NULL,
  palier INTEGER NOT NULL,                      -- 1 à 4
  mot TEXT NOT NULL DEFAULT '',
  empreinte TEXT NOT NULL DEFAULT '',
  cree TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS abonnes (
  courriel TEXT PRIMARY KEY,
  sujets TEXT NOT NULL,                         -- the-screen, the-seat, the-table, séparés par des virgules
  empreinte TEXT NOT NULL DEFAULT '',
  cree TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Les premières idées de la boîte, reprises des feuilles de route (une seule fois).
INSERT INTO idees (outil, titre, texte, statut, origine)
SELECT 'the-screen', 'Tactiques des monstres', 'Les tactiques tirées des suppléments, sur la ligne d’un monstre dans Combat.', 'publiee', 'feuille-de-route'
WHERE NOT EXISTS (SELECT 1 FROM idees WHERE origine = 'feuille-de-route' AND titre = 'Tactiques des monstres');

INSERT INTO idees (outil, titre, texte, statut, origine)
SELECT 'the-screen', 'Règles rapides en français', 'Les états, l’épuisement, l’abri, la lutte, en résumés à portée de clic.', 'publiee', 'feuille-de-route'
WHERE NOT EXISTS (SELECT 1 FROM idees WHERE origine = 'feuille-de-route' AND titre = 'Règles rapides en français');

INSERT INTO idees (outil, titre, texte, statut, origine)
SELECT 'the-screen', 'Le combat sur l’écran des joueurs', 'L’ordre de jeu et l’état des ennemis en mots, pendant un combat.', 'publiee', 'feuille-de-route'
WHERE NOT EXISTS (SELECT 1 FROM idees WHERE origine = 'feuille-de-route' AND titre = 'Le combat sur l’écran des joueurs');

INSERT INTO idees (outil, titre, texte, statut, origine)
SELECT 'the-table', 'Ambiance automatique selon le lieu et l’heure', 'Le ruban qui suit de lui-même le lieu des héros et le moment de la journée.', 'publiee', 'feuille-de-route'
WHERE NOT EXISTS (SELECT 1 FROM idees WHERE origine = 'feuille-de-route' AND titre = 'Ambiance automatique selon le lieu et l’heure');
