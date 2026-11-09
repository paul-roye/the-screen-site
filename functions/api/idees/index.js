// /api/idees : la boîte à idées.
//  GET  : les idées publiées, avec leur nombre de voix.
//  POST : une idée proposée par un visiteur, en attente de relecture.
import { OUTILS, json, erreur, lireCorps, texte, empreinte, controler } from '../../../lib/outils.js';

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT i.id, i.outil, i.titre, i.texte, COUNT(v.idee) AS voix
       FROM idees i LEFT JOIN voix v ON v.idee = i.id
      WHERE i.statut = 'publiee'
      GROUP BY i.id
      ORDER BY voix DESC, i.id ASC`
  ).all();
  return json({ idees: results });
}

export async function onRequestPost({ request, env }) {
  const corps = await lireCorps(request);
  const emp = await empreinte(request, env);
  const refus = await controler(request, env, corps, 'idees', emp);
  if (refus) return refus;

  const outil = texte(corps.outil, 40);
  const titre = texte(corps.titre, 120);
  if (!OUTILS.includes(outil)) return erreur('Choisissez un outil dans la liste.');
  if (!titre) return erreur('Donnez un titre à votre idée.');

  await env.DB.prepare('INSERT INTO idees (outil, titre, texte, auteur, empreinte) VALUES (?, ?, ?, ?, ?)')
    .bind(outil, titre, texte(corps.texte, 2000), texte(corps.auteur, 60), emp).run();
  return json({ ok: true }, 201);
}
