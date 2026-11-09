// Fonctions communes de l'API (functions/api/…). Hors de functions/ pour ne pas devenir une route.

// Les outils dont on peut parler dans une idée ou un bug : les valeurs du champ « Outil » des formulaires.
export const OUTILS = ['the-screen', 'scribe', 'party', 'wild-shape', 'companion', 'the-table'];

export const json = (donnees, statut = 200) => new Response(JSON.stringify(donnees), {
  status: statut,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

export const erreur = (message, statut = 400) => json({ erreur: message }, statut);

// Le corps JSON de la requête, ou un objet vide s'il est illisible.
export async function lireCorps(request) {
  try {
    const corps = await request.json();
    return corps && typeof corps === 'object' ? corps : {};
  } catch {
    return {};
  }
}

// Un texte nettoyé et borné.
export const texte = (valeur, max) => String(valeur ?? '').trim().slice(0, max);

const adresse = (request) => request.headers.get('CF-Connecting-IP') || '';

// Une empreinte du visiteur (son adresse IP hachée avec un sel) : pour limiter les envois et compter une voix par personne,
// sans garder l'adresse elle-même.
export async function empreinte(request, env) {
  const octets = new TextEncoder().encode(adresse(request) + '|' + (env.SEL || 'the-screen-site'));
  const hache = await crypto.subtle.digest('SHA-256', octets);
  return [...new Uint8Array(hache)].slice(0, 16).map((o) => o.toString(16).padStart(2, '0')).join('');
}

// Vérification anti-robot (Turnstile). Sans secret réglé (TURNSTILE_SECRET), rien n'est vérifié :
// à régler avant de donner l'adresse du site.
export async function humain(request, env, jeton) {
  if (!env.TURNSTILE_SECRET) return true;
  if (!jeton) return false;
  const corps = new FormData();
  corps.append('secret', env.TURNSTILE_SECRET);
  corps.append('response', String(jeton));
  if (adresse(request)) corps.append('remoteip', adresse(request));
  try {
    const reponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: corps });
    const resultat = await reponse.json();
    return !!resultat.success;
  } catch {
    return false;
  }
}

// Pas plus de cinq envois par heure et par visiteur dans une table. `table` vient toujours du code, jamais de la requête.
export async function tropVite(env, table, emp) {
  const ligne = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE empreinte = ? AND cree > datetime('now', '-1 hour')`).bind(emp).first();
  return (ligne?.n ?? 0) >= 5;
}

// Comparaison de deux chaînes en temps constant.
function egales(a, b) {
  if (a.length !== b.length) return false;
  let ecart = 0;
  for (let i = 0; i < a.length; i++) ecart |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return ecart === 0;
}

// La requête porte-t-elle l'un des jetons attendus (en-tête « Authorization: Bearer … ») ?
export function autorise(request, ...jetons) {
  const recu = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  return !!recu && jetons.some((j) => j && egales(recu, String(j)));
}

// Les contrôles communs à tout envoi d'un visiteur. Rend une réponse d'erreur, ou null si tout va bien.
export async function controler(request, env, corps, table, emp) {
  if (corps.site) return json({ ok: true }, 201); // champ piège rempli : un robot, on fait comme si
  if (!(await humain(request, env, corps.jeton))) return erreur('La vérification anti-robot a échoué. Rechargez la page et réessayez.', 403);
  if (await tropVite(env, table, emp)) return erreur('Trop d’envois en peu de temps. Réessayez dans une heure.', 429);
  return null;
}
