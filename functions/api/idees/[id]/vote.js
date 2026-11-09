// POST /api/idees/<id>/vote : soutenir une idée publiée, ou retirer son soutien (une voix par visiteur).
import { json, erreur, empreinte } from '../../../../lib/outils.js';

export async function onRequestPost({ request, env, params }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return erreur('Idée inconnue.', 404);
  const idee = await env.DB.prepare("SELECT id FROM idees WHERE id = ? AND statut = 'publiee'").bind(id).first();
  if (!idee) return erreur('Idée inconnue.', 404);

  const emp = await empreinte(request, env);
  const deja = await env.DB.prepare('SELECT 1 AS oui FROM voix WHERE idee = ? AND empreinte = ?').bind(id, emp).first();
  if (deja) await env.DB.prepare('DELETE FROM voix WHERE idee = ? AND empreinte = ?').bind(id, emp).run();
  else await env.DB.prepare('INSERT INTO voix (idee, empreinte) VALUES (?, ?)').bind(id, emp).run();

  const compte = await env.DB.prepare('SELECT COUNT(*) AS n FROM voix WHERE idee = ?').bind(id).first();
  return json({ voix: compte?.n ?? 0, soutenue: !deja });
}
