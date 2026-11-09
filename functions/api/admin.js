// /api/admin : pour l'auteur du site seul, avec le jeton JETON_ADMIN en « Authorization: Bearer … ».
//  GET  : tout ce que le site a reçu (idées, bugs, promesses, abonnés).
//  POST : { table, id, action } pour relire une idée, clore un bug ou supprimer une ligne.
import { json, erreur, lireCorps, autorise } from '../../lib/outils.js';

// Ce qu'on peut faire sur chaque table : action → requête SQL (avec un seul paramètre, l'identifiant).
const ACTIONS = {
  idees: {
    publier: "UPDATE idees SET statut = 'publiee' WHERE id = ?",
    refuser: "UPDATE idees SET statut = 'refusee' WHERE id = ?",
    supprimer: 'DELETE FROM idees WHERE id = ?',
  },
  bugs: {
    traiter: "UPDATE bugs SET statut = 'traite' WHERE id = ?",
    rouvrir: "UPDATE bugs SET statut = 'nouveau' WHERE id = ?",
    supprimer: 'DELETE FROM bugs WHERE id = ?',
  },
  promesses: { supprimer: 'DELETE FROM promesses WHERE id = ?' },
  abonnes: { supprimer: 'DELETE FROM abonnes WHERE courriel = ?' },
};

export async function onRequestGet({ request, env }) {
  if (!autorise(request, env.JETON_ADMIN)) return erreur('Jeton manquant ou inconnu.', 401);
  const [idees, bugs, promesses, abonnes] = await Promise.all([
    env.DB.prepare('SELECT id, outil, titre, texte, auteur, statut, origine, cree, (SELECT COUNT(*) FROM voix WHERE voix.idee = idees.id) AS voix FROM idees ORDER BY cree DESC').all(),
    env.DB.prepare('SELECT id, outil, version, texte, attendu, auteur, statut, cree FROM bugs ORDER BY cree DESC').all(),
    env.DB.prepare('SELECT id, prenom, palier, mot, cree FROM promesses ORDER BY cree DESC').all(),
    env.DB.prepare('SELECT courriel, sujets, cree FROM abonnes ORDER BY cree DESC').all(),
  ]);
  return json({ idees: idees.results, bugs: bugs.results, promesses: promesses.results, abonnes: abonnes.results });
}

export async function onRequestPost({ request, env }) {
  if (!autorise(request, env.JETON_ADMIN)) return erreur('Jeton manquant ou inconnu.', 401);
  const corps = await lireCorps(request);
  const requete = ACTIONS[corps.table]?.[corps.action];
  if (!requete) return erreur('Action inconnue.');
  if (corps.id === undefined || corps.id === null || corps.id === '') return erreur('Identifiant manquant.');
  if (corps.table === 'idees' && corps.action === 'supprimer') await env.DB.prepare('DELETE FROM voix WHERE idee = ?').bind(corps.id).run();
  await env.DB.prepare(requete).bind(corps.id).run();
  return json({ ok: true });
}
