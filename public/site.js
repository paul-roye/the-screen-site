// Script commun des pages du site (index.html, cagnotte.html).
// Chaque partie ne s'active que si la page a les éléments qu'elle pilote.
(function () {
  'use strict';
  var SITE = window.SITE || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var h = function (nom, attrs, enfants) {
    var el = document.createElement(nom);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'texte') el.textContent = attrs[k];
      else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) el.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    });
    (enfants || []).forEach(function (e) { if (e) el.appendChild(e); });
    return el;
  };
  var lireJson = function (url, options) {
    return fetch(url, options).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) throw new Error(d.erreur || 'Le site ne répond pas (' + r.status + ').');
        return d;
      });
    });
  };
  var MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  var MOIS_LONGS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var dateFr = function (iso, long) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    if (!m) return iso || '';
    return Number(m[3]) + ' ' + (long ? MOIS_LONGS : MOIS)[Number(m[2]) - 1] + ' ' + m[1];
  };

  /* ---------- Thème de la page (gardé dans ce navigateur) ---------- */
  function ambiance(nom, garder) {
    if (nom === 'strahd') document.documentElement.dataset.ambiance = 'strahd';
    else delete document.documentElement.dataset.ambiance;
    $$('#ambiances button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.ambiance === nom)); });
    if (garder) { try { localStorage.setItem('ambiance', nom); } catch (e) {} }
  }
  $$('#ambiances button').forEach(function (b) { b.addEventListener('click', function () { ambiance(b.dataset.ambiance, true); }); });
  ambiance(document.documentElement.dataset.ambiance === 'strahd' ? 'strahd' : 'aeldran', false);

  /* ---------- Versions et téléchargements : donnees/versions.json, zips dans telechargements/ ---------- */
  var depot = SITE.depot || '';
  var lienVersion = function (v) {
    return v && v.fichier ? 'telechargements/' + v.fichier : null;
  };
  if ($('[data-version], [data-telecharge]')) {
    lireJson('donnees/versions.json').then(function (versions) {
      $$('[data-version]').forEach(function (el) { var v = versions[el.dataset.version]; if (v && v.version) el.textContent = v.version; });
      $$('[data-date]').forEach(function (el) { var v = versions[el.dataset.date]; if (v && v.date) el.textContent = dateFr(v.date); });
      $$('[data-nouveautes]').forEach(function (el) { var v = versions[el.dataset.nouveautes]; if (v && v.nouveautes) el.textContent = v.nouveautes; });
      $$('[data-points]').forEach(function (ul) {
        var v = versions[ul.dataset.points];
        if (!v || !v.points || !v.points.length) return;
        ul.textContent = '';
        v.points.forEach(function (p) { ul.appendChild(h('li', { texte: p })); });
      });
      $$('[data-telecharge]').forEach(function (a) {
        var url = lienVersion(versions[a.dataset.telecharge]);
        if (url) a.href = url;
      });
    }).catch(function () { /* la page garde les valeurs écrites dans le HTML */ });
    $$('[data-versions]').forEach(function (a) { if (depot) a.href = 'https://github.com/' + depot + '/tree/main/public/telechargements'; });
  }

  /* ---------- Le plan de table : ambiances du ruban et tour de jeu ---------- */
  var plan = $('#plan');
  if (plan) {
    var legende = $('#legende-tour'), scene = 'taverne', tour = -1;
    var NOMS = { taverne: 'Taverne : ambre chaud, comme un feu de cheminée.', foret: 'Forêt : vert profond sous les feuillages.', donjon: 'Donjon : pierre froide, lueur bleutée.', orage: 'Orage : violet, traversé d’éclairs.' };
    var peindre = function () {
      plan.style.setProperty('--led', 'var(--led-' + (tour === 4 ? 'monstres' : scene) + ')');
      $$('.place, .tour', plan).forEach(function (e) { e.classList.toggle('actif', Number(e.dataset.i) === tour); });
    };
    $$('[data-scene]', plan).forEach(function (b) {
      b.addEventListener('click', function () {
        scene = b.dataset.scene; tour = -1;
        $$('[data-scene]', plan).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        legende.textContent = NOMS[scene];
        peindre();
      });
    });
    $('#tour').addEventListener('click', function () {
      tour = (tour + 1) % 5;
      legende.textContent = tour === 4 ? 'Au tour des monstres : tout le cadre vire au rouge.' : 'Au tour de la place ' + (tour + 1) + ' : le cadre s’allume devant elle.';
      peindre();
    });
  }

  /* ---------- Le schéma du tableau de bord de The Screen ---------- */
  var grille = $('#grille');
  if (grille) {
    var MODES = {
      exploration: [['Personnages', 8, 2], ['Horloge', 4, 1], ['Musique', 4, 1], ['Ici', 4, 3], ['Déroulé', 4, 3], ['Rencontres', 4, 2], ['PNJ', 4, 1]],
      ville: [['Personnages', 8, 2], ['Horloge', 4, 1], ['Musique', 4, 1], ['Ici', 4, 3], ['PNJ', 4, 3], ['Marchands', 4, 2], ['Factions', 4, 1]],
      voyage: [['Personnages', 8, 2], ['Horloge', 4, 2], ['Trajets', 6, 3], ['Rencontres', 6, 2], ['Babioles', 3, 1], ['Musique', 3, 1]],
      rencontre: [['Personnages', 8, 2], ['Dés', 4, 2], ['Combat', 5, 3], ['Écran des joueurs', 7, 3]]
    };
    var poser = function (mode) {
      grille.textContent = '';
      MODES[mode].forEach(function (o) {
        grille.appendChild(h('div', { class: 'outil', texte: o[0], style: 'grid-column: span ' + o[1] + '; grid-row: span ' + o[2] }));
      });
      $$('#modes button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === mode)); });
    };
    $$('#modes button').forEach(function (b) { b.addEventListener('click', function () { poser(b.dataset.mode); }); });
    poser('exploration');
  }

  /* ---------- Capture d'écran d'une extension : captures/<nom>.png ---------- */
  var fenetre = $('#capture');
  if (fenetre) {
    var image = $('#capture-image'), cadre = $('#capture-cadre');
    image.addEventListener('load', function () { image.hidden = false; cadre.hidden = true; });
    image.addEventListener('error', function () { image.hidden = true; cadre.hidden = false; });
    $$('[data-capture]').forEach(function (b) {
      b.addEventListener('click', function () {
        $('#capture-titre').textContent = b.dataset.capture;
        $('#capture-vue').textContent = b.dataset.vue || '';
        image.hidden = true; cadre.hidden = false;
        image.alt = b.dataset.vue || b.dataset.capture;
        image.src = b.dataset.image || '';
        if (fenetre.showModal) fenetre.showModal(); else fenetre.setAttribute('open', '');
      });
    });
    var fermer = function () { if (fenetre.close) fenetre.close(); else fenetre.removeAttribute('open'); };
    $('#capture-fermer').addEventListener('click', fermer);
    fenetre.addEventListener('click', function (e) { if (e.target === fenetre) fermer(); });
  }

  /* ---------- Le journal de fabrication de The Table : donnees/journal.json ---------- */
  var journal = $('#journal-liste');
  if (journal) {
    lireJson('donnees/journal.json').then(function (nouvelles) {
      if (!Array.isArray(nouvelles) || !nouvelles.length) return;
      journal.textContent = '';
      nouvelles.forEach(function (n) {
        var photos = (n.photos || []).map(function (p) {
          var src = typeof p === 'string' ? p : p.src;
          return h('img', { src: src, alt: (p && p.alt) || n.titre, loading: 'lazy' });
        });
        journal.appendChild(h('article', { class: 'nouvelle' }, [
          h('time', { datetime: n.date, texte: dateFr(n.date, true) }),
          h('h3', { texte: n.titre }),
          h('p', { texte: n.texte }),
          photos.length ? h('div', { class: 'photos' }, photos) : null
        ]));
      });
    }).catch(function () { /* la page garde les nouvelles écrites dans le HTML */ });
  }

  /* ---------- Anti-robot (Turnstile), seulement si une clé de site est réglée ---------- */
  if (SITE.turnstile && $('.garde')) {
    window.surTurnstile = function () {
      $$('.garde').forEach(function (el) { el.dataset.widget = window.turnstile.render(el, { sitekey: SITE.turnstile, theme: 'auto' }); });
    };
    document.head.appendChild(h('script', { src: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=surTurnstile', async: true, defer: true }));
  }
  var jetonDe = function (form) {
    var el = $('.garde', form);
    return el && window.turnstile && el.dataset.widget !== undefined ? (window.turnstile.getResponse(el.dataset.widget) || '') : '';
  };

  /* ---------- Envoi d'un formulaire à l'API ---------- */
  function brancher(form, chemin, corps, merci) {
    if (!form) return;
    var message = $('.message', form), bouton = $('button[type="submit"]', form);
    var dire = function (texte, etat) { message.textContent = texte; message.dataset.etat = etat; message.hidden = false; };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var donnees = corps();
      if (typeof donnees === 'string') { dire(donnees, 'erreur'); return; }
      donnees.site = $('.pot', form).value;
      donnees.jeton = jetonDe(form);
      if (SITE.turnstile && !donnees.jeton) { dire('Cochez d’abord la vérification anti-robot.', 'erreur'); return; }
      bouton.disabled = true;
      lireJson(chemin, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(donnees) })
        .then(function (reponse) { dire(typeof merci === 'function' ? merci(reponse) : merci, 'ok'); form.reset(); form.dispatchEvent(new CustomEvent('envoye', { detail: reponse })); })
        .catch(function (err) { dire(err.message || 'L’envoi a échoué. Réessayez dans un instant.', 'erreur'); })
        .then(function () {
          bouton.disabled = false;
          var el = $('.garde', form);
          if (el && window.turnstile && el.dataset.widget !== undefined) window.turnstile.reset(el.dataset.widget);
        });
    });
  }

  /* ---------- Idée ou bug ---------- */
  var retour = $('#f-retour');
  if (retour) {
    var genre = 'idee';
    $$('#bascule button').forEach(function (b) {
      b.addEventListener('click', function () {
        genre = b.dataset.genre;
        $$('#bascule button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        $$('[data-pour]', retour).forEach(function (c) { c.hidden = c.dataset.pour !== genre; });
        $('#r-texte-l').textContent = genre === 'bug' ? 'Ce qui s’est passé' : 'Votre idée';
        $('#r-envoyer').textContent = genre === 'bug' ? 'Envoyer le bug' : 'Envoyer l’idée';
        $('.message', retour).hidden = true;
      });
    });
    // Le chemin dépend du genre choisi : on le lit au moment de l'envoi.
    var message = $('.message', retour), bouton = $('#r-envoyer');
    var dire = function (texte, etat) { message.textContent = texte; message.dataset.etat = etat; message.hidden = false; };
    retour.addEventListener('submit', function (e) {
      e.preventDefault();
      var bug = genre === 'bug';
      var donnees = {
        outil: $('#r-outil').value, texte: $('#r-texte').value.trim(), auteur: $('#r-prenom').value.trim(),
        site: $('.pot', retour).value, jeton: jetonDe(retour)
      };
      if (bug) { donnees.version = $('#r-version').value.trim(); donnees.attendu = $('#r-attendu').value.trim(); }
      else {
        donnees.titre = $('#r-titre').value.trim();
        if (!donnees.titre) { dire('Donnez un titre à votre idée, en quelques mots.', 'erreur'); return; }
      }
      if (SITE.turnstile && !donnees.jeton) { dire('Cochez d’abord la vérification anti-robot.', 'erreur'); return; }
      bouton.disabled = true;
      lireJson(bug ? '/api/bugs' : '/api/idees', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(donnees) })
        .then(function () {
          dire(bug ? 'Bug reçu, merci. Il part vers le projet concerné.' : 'Idée reçue, merci. Elle paraîtra dans la boîte après relecture.', 'ok');
          ['#r-texte', '#r-titre', '#r-version', '#r-attendu'].forEach(function (s) { $(s).value = ''; });
        })
        .catch(function (err) { dire(err.message || 'L’envoi a échoué. Réessayez dans un instant.', 'erreur'); })
        .then(function () {
          bouton.disabled = false;
          var el = $('.garde', retour);
          if (el && window.turnstile && el.dataset.widget !== undefined) window.turnstile.reset(el.dataset.widget);
        });
    });
  }

  /* ---------- La boîte à idées ---------- */
  var liste = $('#idees');
  if (liste) {
    var NOMS_OUTILS = { 'the-screen': 'The Screen', scribe: 'The Screen · Scribe', party: 'The Seat · Party', 'wild-shape': 'The Seat · Wild Shape', companion: 'The Seat · Companion', 'the-table': 'The Table' };
    var etat = $('#idees-etat');
    var soutenues = {};
    try { soutenues = JSON.parse(localStorage.getItem('idees-soutenues') || '{}') || {}; } catch (e) {}
    var garder = function () { try { localStorage.setItem('idees-soutenues', JSON.stringify(soutenues)); } catch (e) {} };
    var ligne = function (idee) {
      var compte = h('span', { texte: String(idee.voix) });
      var bouton = h('button', { class: 'voix', type: 'button', 'aria-pressed': String(!!soutenues[idee.id]), 'aria-label': 'Soutenir cette idée' }, [document.createTextNode('▲ '), compte]);
      bouton.addEventListener('click', function () {
        bouton.disabled = true;
        lireJson('/api/idees/' + idee.id + '/vote', { method: 'POST' }).then(function (r) {
          compte.textContent = String(r.voix);
          bouton.setAttribute('aria-pressed', String(!!r.soutenue));
          if (r.soutenue) soutenues[idee.id] = 1; else delete soutenues[idee.id];
          garder();
        }).catch(function () {}).then(function () { bouton.disabled = false; });
      });
      var detail = h('span', { class: 'petit' }, [h('b', { texte: NOMS_OUTILS[idee.outil] || idee.outil })]);
      if (idee.texte) detail.appendChild(document.createTextNode(' · ' + idee.texte));
      return h('li', {}, [bouton, h('strong', { texte: idee.titre }), detail]);
    };
    lireJson('/api/idees').then(function (d) {
      liste.textContent = '';
      (d.idees || []).forEach(function (i) { liste.appendChild(ligne(i)); });
      if (!(d.idees || []).length) etat.textContent = 'Pas encore d’idée : proposez la première.';
    }).catch(function () { etat.textContent = 'La boîte à idées n’est pas joignable pour l’instant.'; });
  }

  /* ---------- Nouvelles par courriel ---------- */
  brancher($('#f-lettre'), '/api/lettre', function () {
    var sujets = [['l-screen', 'the-screen'], ['l-seat', 'the-seat'], ['l-table', 'the-table']]
      .filter(function (p) { return $('#' + p[0]).checked; }).map(function (p) { return p[1]; });
    if (!sujets.length) return 'Cochez au moins un sujet.';
    return { courriel: $('#l-courriel').value.trim(), sujets: sujets };
  }, 'Inscription enregistrée. Merci !');

  /* ---------- La cagnotte de The Table : comptes par palier et promesse ---------- */
  function compterPaliers() {
    if (!$('[data-compte]')) return;
    lireJson('/api/promesses').then(function (d) {
      $$('.palier').forEach(function (li) {
        var compte = $('[data-compte]', li);
        if (!compte) return;
        var palier = Number($('.rang b', li).textContent), seuil = Number(compte.dataset.compte), n = Number((d.paliers || {})[palier] || 0);
        compte.textContent = n + (n > 1 ? ' participations' : ' participation') + ' sur ' + seuil + (n >= seuil ? ' : palier atteint.' : '.');
        $$('.losanges i', li).forEach(function (i, ix) { i.classList.toggle('plein', ix < n); });
      });
    }).catch(function () { /* la page garde « 0 participation » */ });
  }
  compterPaliers();
  var promesse = $('#f-promesse');
  brancher(promesse, '/api/promesses', function () {
    return { prenom: $('#p-prenom').value.trim(), palier: Number($('#p-palier').value), code: $('#p-code').value.trim(), mot: $('#p-mot').value.trim() };
  }, 'Promesse enregistrée, merci ! Ton MJ te recontacte quand un palier est atteint.');
  if (promesse) promesse.addEventListener('envoye', compterPaliers);
})();
