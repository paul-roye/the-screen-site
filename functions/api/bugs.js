// POST /api/bugs : un bug signalé par un visiteur. Les bugs ne sont pas publics : ils se lisent par /api/retours et /api/admin.
import { OUTILS, json, erreur, lireCorps, texte, empreinte, controler } from '../../lib/outils.js';

export async function onRequestPost({ request, env }) {
  const corps = await lireCorps(request);
  const emp = await empreinte(request, env);
  const refus = await controler(request, env, corps, 'bugs', emp);
  if (refus) return refus;

  const outil = texte(corps.outil, 40);
  const passe = texte(corps.texte, 4000);
  if (!OUTILS.includes(outil)) return erreur('Choisissez un outil dans la liste.');
  if (!passe) return erreur('Décrivez ce qui s’est passé.');

  await env.DB.prepare('INSERT INTO bugs (outil, version, texte, attendu, auteur, empreinte) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(outil, texte(corps.version, 40), passe, texte(corps.attendu, 2000), texte(corps.auteur, 60), emp).run();
  return json({ ok: true }, 201);
}
