/* Lecture en temps réel des tarifs Android Solution Phone V2 (25 € QualiRépar déjà déduits) */
(function () {
  'use strict';
  var root = document.getElementById('sp-android-live-pricing');
  if (!root || !window.fetch) return;
  var brand = (root.getAttribute('data-brand') || '').trim().toLowerCase();
  var targets = (root.getAttribute('data-models') || '').split('|').map(function (s) {
    return s.trim().toLowerCase().replace(/\s+/g, ' ');
  }).filter(Boolean);
  var displayModel = root.getAttribute('data-display') || 'ce modèle';

  function norm(s) {
    return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }
  function num(v) {
    if (v === '' || v === null || v === undefined) return null;
    var n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  fetch('https://vps-8066c206.vps.ovh.net/api/public/catalog?resource=prices', {
    signal: window.AbortSignal && AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
  })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      var list = (data && data.prices && data.prices.android) || [];
      if (!list.length) return;
      var row = null;
      for (var t = 0; t < targets.length && !row; t++) {
        for (var i = 0; i < list.length; i++) {
          if (norm(list[i].marque) === brand && norm(list[i].modele) === targets[t]) {
            row = list[i];
            break;
          }
        }
      }
      if (!row) return;

      var lines = [
        ['Écran Compatible Incell', 'Solution économique testée en atelier', num(row.ecran_compatible_incell !== '' ? row.ecran_compatible_incell : row.ecran_compatible)],
        ['Écran Compatible OLED', 'Noirs profonds, finesse et contraste OLED', num(row.ecran_compatible_oled)],
        ['Écran Original (Service Pack)', 'Bloc écran constructeur neuf d’origine', num(row.ecran_service_pack)],
        ['Batterie Compatible', 'Autonomie retrouvée · garantie 6 mois', num(row.batterie_compatible)],
        ['Batterie Originale', 'Batterie constructeur d’origine', num(row.batterie_originale)],
        ['Connecteur de charge USB-C', 'Nettoyage 10 € tenté d’abord (suffit 9 fois sur 10)', num(row.connecteur)],
        ['Vitre arrière', 'Remplacement propre avec collage étanche', num(row.vitre_arriere)]
      ];

      var hasPositive = lines.some(function (l) { return l[2] !== null && l[2] > 0; });
      if (!hasPositive) return;

      var rowsHtml = lines.filter(function (l) { return l[2] !== 0; }).map(function (l) {
        var priceCell = l[2] !== null && l[2] > 0
          ? '<strong style="font-size:1.08rem;color:#1d1d1f">' + l[2] + '&nbsp;€ TTC</strong>'
          : '<a href="#devis-rapide" data-open-quote-modal data-quote-title="Devis ' + esc(displayModel) + '" data-quote-prefill="' + esc(displayModel + ' — ' + l[0] + ' : merci de me confirmer le tarif et la disponibilité.') + '" style="color:#e30613;font-weight:700;text-decoration:underline">Vérifier prix 24h →</a>';
        return '<tr style="border-bottom:1px solid rgba(0,0,0,.07)">'
          + '<td style="padding:12px 10px"><strong>' + esc(l[0]) + '</strong><br><small style="color:#6e6e73">' + esc(l[1]) + '</small></td>'
          + '<td style="padding:12px 10px;text-align:right;white-space:nowrap">' + priceCell + '</td>'
          + '</tr>';
      }).join('');

      var body = root.querySelector('[data-live-tbody]');
      var stamp = root.querySelector('[data-live-stamp]');
      if (body) body.innerHTML = rowsHtml;
      if (stamp) stamp.textContent = 'Tarifs synchronisés en direct avec l’atelier le ' + new Date().toLocaleDateString('fr-FR') + ' (25 € QualiRépar déjà déduits)';
    })
    .catch(function () {});
})();
