// /api/promesses : la cagnotte de The Table.
//  GET  : le nombre de participations par palier, sans aucun nom.
//  POST : une promesse, avec le code d'invitation donné par le MJ (CODE_CAGNOTTE).
// Une promesse au palier N compte pour tous les paliers de 1 à N.
import { json, erreur, lireCorps, texte, empreinte, controler } from '../../lib/outils.js';

const PALIERS = [1, 2, 3, 4];

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare('SELECT palier, COUNT(*) AS n FROM promesses GROUP BY palier').all();
  const paliers = {};
  for (const p of PALIERS) paliers[p] = results.filter((r) => r.palier >= p).reduce((somme, r) => somme + r.n, 0);
  return json({ paliers });
}

export async function onRequestPost({ request, env }) {
  const corps = await lireCorps(request);
  const emp = await empreinte(request, env);
  const refus = await controler(request, env, corps, 'promesses', emp);
  if (refus) return refus;

  if (!env.CODE_CAGNOTTE) return erreur('La cagnotte n’est pas encore ouverte.', 503);
  if (texte(corps.code, 80).toLowerCase() !== String(env.CODE_CAGNOTTE).trim().toLowerCase()) return erreur('Code d’invitation inconnu. Demande-le à ton MJ.', 403);

  const prenom = texte(corps.prenom, 60);
  const palier = Number(corps.palier);
  if (!prenom) return erreur('Indique ton prénom.');
  if (!PALIERS.includes(palier)) return erreur('Choisis un palier.');

  await env.DB.prepare('INSERT INTO promesses (prenom, palier, mot, empreinte) VALUES (?, ?, ?, ?)')
    .bind(prenom, palier, texte(corps.mot, 1000), emp).run();
  return json({ ok: true }, 201);
}
