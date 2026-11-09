// POST /api/lettre : s'inscrire aux nouvelles par courriel. La liste ne se lit que par /api/admin.
import { json, erreur, lireCorps, texte, empreinte, controler } from '../../lib/outils.js';

const SUJETS = ['the-screen', 'the-seat', 'the-table'];

export async function onRequestPost({ request, env }) {
  const corps = await lireCorps(request);
  const emp = await empreinte(request, env);
  const refus = await controler(request, env, corps, 'abonnes', emp);
  if (refus) return refus;

  const courriel = texte(corps.courriel, 200).toLowerCase();
  const sujets = (Array.isArray(corps.sujets) ? corps.sujets : []).filter((s) => SUJETS.includes(s));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(courriel)) return erreur('Cette adresse ne ressemble pas à un courriel.');
  if (!sujets.length) return erreur('Cochez au moins un sujet.');

  await env.DB.prepare(
    `INSERT INTO abonnes (courriel, sujets, empreinte) VALUES (?, ?, ?)
     ON CONFLICT (courriel) DO UPDATE SET sujets = excluded.sujets`
  ).bind(courriel, sujets.join(','), emp).run();
  return json({ ok: true }, 201);
}
