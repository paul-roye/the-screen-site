// GET /api/retours?outil=<outil>&depuis=<AAAA-MM-JJ> : les idées et les bugs d'un outil, pour le projet qui le développe.
// Lecture seule, avec le jeton JETON_RETOURS (ou JETON_ADMIN) en « Authorization: Bearer … ».
// Sans `outil` : tous les outils. Sans `depuis` : tout.
import { OUTILS, json, erreur, autorise } from '../../lib/outils.js';

export async function onRequestGet({ request, env }) {
  if (!autorise(request, env.JETON_RETOURS, env.JETON_ADMIN)) return erreur('Jeton manquant ou inconnu.', 401);

  const url = new URL(request.url);
  const outil = url.searchParams.get('outil') || '';
  const depuis = url.searchParams.get('depuis') || '';
  if (outil && !OUTILS.includes(outil)) return erreur('Outil inconnu. Outils : ' + OUTILS.join(', ') + '.');
  if (depuis && !/^\d{4}-\d{2}-\d{2}$/.test(depuis)) return erreur('`depuis` s’écrit AAAA-MM-JJ.');

  const filtre = [];
  const valeurs = [];
  if (outil) { filtre.push('outil = ?'); valeurs.push(outil); }
  if (depuis) { filtre.push('cree >= ?'); valeurs.push(depuis); }
  const ou = filtre.length ? ' WHERE ' + filtre.join(' AND ') : '';

  const idees = await env.DB.prepare(
    `SELECT id, outil, titre, texte, auteur, statut, origine, cree,
            (SELECT COUNT(*) FROM voix WHERE voix.idee = idees.id) AS voix
       FROM idees${ou} ORDER BY cree DESC`
  ).bind(...valeurs).all();
  const bugs = await env.DB.prepare(
    `SELECT id, outil, version, texte, attendu, auteur, statut, cree FROM bugs${ou} ORDER BY cree DESC`
  ).bind(...valeurs).all();
  return json({ idees: idees.results, bugs: bugs.results });
}
