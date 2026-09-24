/*
 * Page Reconditionnés — stock en direct (version 2).
 *
 * Source des données : INCHANGÉE. Même appel que l'ancienne page :
 *   GET https://kdvxcnjfrmvlnrymfyug.supabase.co/functions/v1/public-catalog?resource=stock
 *   → { stock: { used: [...], new: [...] } }
 *   Champs lus : modele, stockage, couleur, grade, batterie, vente.
 * Rien n'est jamais écrit en base : la normalisation ci-dessous sert UNIQUEMENT à l'affichage.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * RÈGLES DE NORMALISATION DES NOMS (affichage seulement)
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Nettoyage : accents et ponctuation ignorés pour l'analyse, casse ignorée,
 *    « promax » / « po max » → « Pro Max », « + » → « Plus ».
 * 2. iPhone : reconnu si le nom contient « iphone » OU commence par un numéro
 *    de modèle iPhone (« 13 PRO », « 15 pro max », « SE2 », « XR »…).
 *    Affiché « iPhone <modèle> <variante> » avec la casse Apple :
 *    Pro, Max, Plus, mini, XR, XS, X, 16e, Air.
 *    iPhone SE (la génération est lue dans le nom, jamais devinée) :
 *      - « 2022 », « 3 », « 3e », « SE3 », « 5G »      → « iPhone SE (2022) »
 *      - « 2020 », « 2 », « 2e », « SE2 »               → « iPhone SE (2020) »
 *      - « 2016 », « 1 », « 1re », « SE1 »              → « iPhone SE (2016) »
 *      - aucune indication                              → « iPhone SE » (prudence, sans image)
 * 3. Samsung : reconnu si « samsung » ou « galaxy » est présent, ou si le nom
 *    commence par Z Flip / Z Fold / S + 2 chiffres (modèles propres à Samsung).
 *    « A54 » seul n'est PAS attribué à Samsung (Oppo a aussi des A54).
 *    Affiché « Samsung Galaxy … » : « zflip 5 » → « Z Flip5 », « s24 » → « S24 »,
 *    Ultra, FE, 5G, « plus » → « + ».
 * 4. Xiaomi : « redmi », « xiaomi », « poco », ou « Note 11 » à « Note 19 » sans
 *    marque (numéros qui n'existent que chez Redmi) → « Xiaomi Redmi Note … ».
 * 5. Google : « pixel » → « Google Pixel … ».
 * 6. iPad : « ipad 11th » → « iPad (11e génération) » ; sinon « iPad » + reste,
 *    sans interprétation (« ipad 11 » reste « iPad 11 »).
 * 7. Autres : première lettre en majuscule, références type « a78 » → « A78 ».
 * Les exemplaires dont le nom normalisé est identique sont regroupés sous un
 * même modèle (une ligne par exemplaire).
 *
 * Autres valeurs affichées :
 *  - Couleur : casse homogène (« NOIR », « noir », « Noire » → « Noir »).
 *  - Batterie : affichée seulement entre 1 et 100 % ; 0, vide ou > 100 → « — ».
 *  - Stockage : nombre → « 64 Go » ; 1000 et plus → « 1 To ».
 */
(function(){
  'use strict';

  var PUBLIC_CATALOG_URL = 'https://kdvxcnjfrmvlnrymfyug.supabase.co/functions/v1/public-catalog';
  var WHATSAPP = 'https://wa.me/33783921884';

  var state = { items: [], cat: 'iphone', family: 'all', signature: '', loaded: false };

  /* ---------- Outils texte ---------- */
  function deaccent(s){ return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function tokens(raw){
    var s = deaccent(raw).toLowerCase()
      .replace(/\+/g, ' plus ')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\bpo\s*max\b/g, 'pro max')
      .replace(/\bpromax\b/g, 'pro max')
      .trim();
    return s ? s.split(/\s+/) : [];
  }
  function cap(w){ return w ? w.charAt(0).toUpperCase() + w.slice(1) : w; }
  function without(list, drop){ return list.filter(function(t){ return drop.indexOf(t) < 0; }); }
  function escapeHtml(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }

  /* ---------- Normalisation des modèles ---------- */
  var IPHONE_START = /^(1[0-9]e?|se[0-9]?|xr|xs|x|[4-9]s?|[5]c)$/;

  function normalizeModel(raw){
    var t = tokens(raw);
    var has = function(w){ return t.indexOf(w) >= 0; };
    var first = t[0] || '';

    if (has('ipad')) return ipadName(without(t, ['ipad', 'apple']));
    if (has('iphone') || IPHONE_START.test(first)) return iphoneName(without(t, ['iphone', 'apple']));
    if (has('samsung') || has('galaxy') || /^(zflip\d*|zfold\d*|s\d{2})$/.test(first) || (first === 'z' && /^(flip|fold)/.test(t[1] || '')))
      return samsungName(without(t, ['samsung', 'galaxy']));
    if (has('redmi') || has('xiaomi') || has('poco') || (first === 'note' && /^1[1-9]$/.test(t[1] || '')))
      return xiaomiName(without(t, ['xiaomi']));
    if (has('pixel')) return pixelName(without(t, ['google', 'pixel']));
    return genericName(t, raw);
  }

  function variantWord(w){
    return ({ pro: 'Pro', max: 'Max', plus: 'Plus', mini: 'mini' })[w] || cap(w);
  }

  function iphoneName(rest){
    var joined = ' ' + rest.join(' ') + ' ';
    var isSE = rest.some(function(w){ return /^se[0-9]?$/.test(w); });
    if (isSE){
      // Les SE sont rangés après les modèles numérotés (avant l'iPhone 8), comme sur apple.fr.
      var label = 'iPhone SE', rank = 9.1;
      if (/ (2022|se3|3|3e|3eme|3rd|5g) /.test(joined)) { label = 'iPhone SE (2022)'; rank = 9.3; }
      else if (/ (2020|se2|2|2e|2eme|2nd) /.test(joined)) { label = 'iPhone SE (2020)'; rank = 9.2; }
      else if (/ (2016|se1|1|1re|1ere|1st) /.test(joined)) { label = 'iPhone SE (2016)'; rank = 9.0; }
      return { name: label, brand: 'iphone', family: 'iPhone SE', rank: rank, variant: 1, isIphone: true, uncertainSE: label === 'iPhone SE' };
    }
    rest = without(rest, ['5g', '4g']);
    var gen = rest[0] || '';
    var genLabel = ({ xr: 'XR', xs: 'XS', x: 'X', air: 'Air' })[gen] || gen;
    var variants = rest.slice(1).map(variantWord);
    var name = ['iPhone', genLabel].concat(variants).join(' ').trim();
    var v = variants.join(' ');
    var rank = gen === 'xr' || gen === 'xs' ? 10.5 : gen === 'x' ? 10 : gen === 'air' ? 17.1 : parseFloat(gen) || 0;
    if (/^\d+e$/.test(gen)) rank -= 0.1;
    var family = genLabel ? 'iPhone ' + (/^\d+e$/.test(gen) ? gen.replace(/e$/, '') : genLabel) : 'iPhone';
    return {
      name: name, brand: 'iphone', family: family, rank: rank,
      variant: v === 'Pro Max' ? 4 : v === 'Pro' ? 3 : v === 'Plus' ? 2 : v === 'mini' ? 0 : 1,
      isIphone: true
    };
  }

  function samsungName(rest){
    var s = ' ' + rest.join(' ') + ' ';
    s = s.replace(/ z ?(flip|fold) ?(\d*) /g, function(m, kind, n){ return ' Z ' + cap(kind) + n + ' '; });
    s = s.replace(/ zflip(\d*) /g, ' Z Flip$1 ').replace(/ zfold(\d*) /g, ' Z Fold$1 ');
    var words = s.trim().split(/\s+/).filter(Boolean).map(function(w){
      if (/^[a-z]\d+[a-z]?$/.test(w)) return w.toUpperCase();
      if (w === '5g' || w === '4g') return w.toUpperCase();
      if (w === 'fe') return 'FE';
      if (w === 'ultra' || w === 'lite' || w === 'edge' || w === 'note') return cap(w);
      if (w === 'plus') return '+';
      return w.charAt(0) === w.charAt(0).toUpperCase() ? w : cap(w);
    });
    var name = ('Samsung Galaxy ' + words.join(' ')).replace(/ \+/g, '+').trim();
    var letter = (words[0] || '').charAt(0);
    var family = letter === 'S' ? 'Galaxy S' : letter === 'Z' ? 'Galaxy Z' : letter === 'A' ? 'Galaxy A' : 'Galaxy';
    return { name: name, brand: 'samsung', family: family, rank: 0, variant: 0 };
  }

  function xiaomiName(rest){
    if (rest[0] === 'note') rest = ['redmi'].concat(rest);
    var words = rest.map(function(w){
      if (w === '5g' || w === '4g') return w.toUpperCase();
      if (w === 'poco') return 'POCO';
      if (w === 'plus') return '+';
      if (/^[a-z]\d+[a-z]?$/.test(w)) return w.toUpperCase();
      return cap(w);
    });
    return { name: ('Xiaomi ' + words.join(' ')).replace(/ \+/g, '+'), brand: 'autre', family: 'Xiaomi', rank: 0, variant: 0 };
  }

  function pixelName(rest){
    var words = rest.map(function(w){
      if (w === 'xl') return 'XL';
      if (w === '5g') return '5G';
      return /^\d/.test(w) ? w : cap(w);
    });
    return { name: ['Google Pixel'].concat(words).join(' '), brand: 'autre', family: 'Google Pixel', rank: 0, variant: 0 };
  }

  function ipadName(rest){
    var genIdx = -1, genNum = '';
    rest.forEach(function(w, i){
      var m = /^(\d+)(th|e|eme|nd|rd|st|re|ere)$/.exec(w);
      if (m && genIdx < 0) { genIdx = i; genNum = m[1]; }
    });
    var others = rest.filter(function(w, i){ return i !== genIdx && w !== 'gen' && w !== 'generation'; })
      .map(function(w){ return ({ pro: 'Pro', air: 'Air', mini: 'mini' })[w] || (/^\d/.test(w) ? w : cap(w)); });
    var name = ['iPad'].concat(others).join(' ');
    if (genIdx >= 0) name += ' (' + genNum + (genNum === '1' ? 're' : 'e') + ' génération)';
    return { name: name, brand: 'autre', family: 'iPad', rank: 0, variant: 0 };
  }

  var BRAND_CASE = { oppo: 'Oppo', oneplus: 'OnePlus', huawei: 'Huawei', honor: 'Honor', motorola: 'Motorola', moto: 'Moto',
    nothing: 'Nothing', sony: 'Sony', xperia: 'Xperia', nokia: 'Nokia', realme: 'realme', vivo: 'vivo', apple: 'Apple', google: 'Google' };
  function genericName(t, raw){
    if (!t.length) return { name: String(raw || '').trim(), brand: 'autre', family: 'Autres', rank: 0, variant: 0 };
    var words = t.map(function(w){
      if (BRAND_CASE[w]) return BRAND_CASE[w];
      if (w === '5g' || w === '4g') return w.toUpperCase();
      if (/^[a-z]\d+[a-z]*$/.test(w)) return w.charAt(0).toUpperCase() + w.slice(1);
      return /^\d/.test(w) ? w : cap(w);
    });
    return { name: words.join(' '), brand: 'autre', family: words[0], rank: 0, variant: 0 };
  }

  /* ---------- Autres champs ---------- */
  var COLOR_WORDS = { noire: 'noir', blanche: 'blanc', grise: 'gris', verte: 'vert', violette: 'violet', doree: 'or', dore: 'or' };
  function normalizeColor(c){
    var s = String(c || '').trim().replace(/\s+/g, ' ');
    if (!s) return '';
    if (/product\s*\)?\s*red/i.test(s)) return '(PRODUCT)RED';
    var low = s.toLowerCase();
    var key = deaccent(low);
    if (COLOR_WORDS[key]) low = COLOR_WORDS[key];
    return low.charAt(0).toUpperCase() + low.slice(1);
  }
  function colorToHex(c){
    if (!c) return '';
    var map = {
      'noir':'#1d1d1f','minuit':'#2c2c2e','graphite':'#54524f','sidéral':'#3a3a3c',
      'blanc':'#f5f5f7','argent':'#d9d9dc','lumière stellaire':'#ece8e1',
      'or':'#e3c89d','rose':'#f4c7c7','rouge':'#b8050f','(product)red':'#b8050f',
      'bleu':'#4c6fa1','vert':'#4b5945','violet':'#9a7fb3','mauve':'#c2a9d6','lilas':'#c9b5d4',
      'titane naturel':'#c5b9a5','titane bleu':'#4c5a6a','titane blanc':'#e6e4df','titane noir':'#35352f',
      'jaune':'#f4d35e','orange':'#e08a3c','gris':'#8a8d8f','corail':'#ff7e67'
    };
    var k = String(c).toLowerCase();
    if (map[k]) return map[k];
    for (var key in map) { if (k.indexOf(key) >= 0) return map[key]; }
    return '';
  }
  function normalizeStorage(s){
    if (s == null || s === '') return '';
    var str = String(s).trim();
    if (/go|gb/i.test(str)) return str.replace(/\s*(go|gb)$/i, ' Go');
    if (/to|tb/i.test(str)) return str.replace(/\s*(to|tb)$/i, ' To');
    var n = Number(str);
    if (!n) return str;
    return n >= 1000 ? Math.round(n / 1000) + ' To' : n + ' Go';
  }
  function normalizeBattery(b){
    var n = Number(b);
    return n >= 1 && n <= 100 ? Math.round(n) : null;
  }

  function toItem(p, condition){
    var m = normalizeModel(p.modele);
    var color = normalizeColor(p.couleur);
    return {
      condition: condition,
      model: m.name,
      brand: m.brand,
      family: m.family,
      rank: m.rank,
      variant: m.variant,
      isIphone: !!m.isIphone,
      uncertainSE: !!m.uncertainSE,
      storage: normalizeStorage(p.stockage),
      storageNum: Number(p.stockage) || 0,
      color: color,
      colorHex: colorToHex(color),
      grade: condition === 'neuf' ? null : (String(p.grade || '').trim().toUpperCase() || null),
      battery: condition === 'neuf' ? null : normalizeBattery(p.batterie),
      price: Number(p.vente) || 0
    };
  }

  /* ---------- Chargement (même requête que l'ancienne page) ---------- */
  function loadStock(){
    fetch(PUBLIC_CATALOG_URL + '?resource=stock')
      .then(function(r){ if (!r.ok) throw new Error('catalogue indisponible'); return r.json(); })
      .then(function(catalogue){
        var stock = catalogue.stock || {};
        var used = (stock.used || []).map(function(p){ return toItem(p, 'reconditionne'); });
        var fresh = (stock.new || []).map(function(p){ return toItem(p, 'neuf'); });
        var items = used.concat(fresh).filter(function(i){ return i.price > 0 && i.model; });
        var signature = JSON.stringify(items);
        state.loaded = true;
        if (signature === state.signature) { updateSummary(); return; }
        state.signature = signature;
        state.items = items;
        render();
      })
      .catch(function(){
        if (state.loaded && state.items.length) return; // on garde l'affichage précédent
        document.getElementById('rcSummary').textContent = 'Stock momentanément indisponible.';
        document.getElementById('rcList').innerHTML = '<p class="rc-status">Le stock ne peut pas s’afficher pour le moment. Demandez les disponibilités sur <a href="' + WHATSAPP + '?text=' + encodeURIComponent('Bonjour, quels smartphones reconditionnés avez-vous en boutique ?') + '" target="_blank" rel="noopener">WhatsApp</a> ou au <a href="tel:+33385330689">03 85 33 06 89</a>.</p>';
      });
  }

  /* ---------- Rendu ---------- */
  function inCat(cat){
    return state.items.filter(function(i){
      if (cat === 'neuf') return i.condition === 'neuf';
      return i.condition !== 'neuf' && i.brand === cat;
    });
  }

  function updateSummary(){
    var n = state.items.length;
    var now = new Date();
    var time = ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2);
    document.getElementById('rcSummary').textContent = n
      ? n + ' téléphone' + (n > 1 ? 's' : '') + ' disponible' + (n > 1 ? 's' : '') + ' à l’atelier · mis à jour à ' + time
      : 'Aucun téléphone en ligne pour le moment.';
  }

  function render(){
    updateSummary();
    var cats = ['iphone', 'samsung', 'autre', 'neuf'];
    var counts = {};
    cats.forEach(function(c){ counts[c] = inCat(c).length; });
    if (!counts[state.cat]) {
      var firstFull = cats.filter(function(c){ return counts[c]; })[0];
      if (firstFull) { state.cat = firstFull; state.family = 'all'; }
    }
    document.querySelectorAll('#rcTabs .rc-tab').forEach(function(b){
      var c = b.getAttribute('data-cat');
      b.querySelector('.rc-n').textContent = counts[c];
      // Un onglet vide (ex. aucun neuf en ce moment) est masqué, sauf s'il est affiché.
      b.hidden = !counts[c] && c !== state.cat;
      b.setAttribute('aria-pressed', String(c === state.cat));
    });

    var items = inCat(state.cat);
    var families = groupBy(items, 'family');
    var familyNames = Object.keys(families).sort(function(a, b){
      var ra = families[a][0].rank, rb = families[b][0].rank;
      if (ra !== rb) return rb - ra;
      return a.localeCompare(b, 'fr');
    });
    if (state.family !== 'all' && !families[state.family]) state.family = 'all';
    renderChips(familyNames, families, items.length);

    var shown = state.family === 'all' ? items : families[state.family];
    var list = document.getElementById('rcList');
    if (!shown.length) {
      list.innerHTML = '<p class="rc-status">Aucun téléphone dans cette catégorie pour le moment. <a href="' + WHATSAPP + '?text=' + encodeURIComponent('Bonjour, je cherche un smartphone. Avez-vous des arrivages prévus ?') + '" target="_blank" rel="noopener">Demandez-nous sur WhatsApp</a>.</p>';
      return;
    }
    var models = groupBy(shown, 'model');
    var modelNames = Object.keys(models).sort(function(a, b){
      var A = models[a][0], B = models[b][0];
      if (A.rank !== B.rank) return B.rank - A.rank;
      if (A.variant !== B.variant) return B.variant - A.variant;
      var pa = Math.max.apply(null, models[a].map(function(i){ return i.price; }));
      var pb = Math.max.apply(null, models[b].map(function(i){ return i.price; }));
      if (pa !== pb) return pb - pa;
      return a.localeCompare(b, 'fr');
    });
    list.innerHTML = modelNames.map(function(name){ return modelHtml(name, models[name]); }).join('');
    list.querySelectorAll('img[data-model-img]').forEach(function(img){
      img.addEventListener('error', function(){ var box = img.parentNode; if (box) box.remove(); }, { once: true });
    });
  }

  function groupBy(items, key){
    var out = {};
    items.forEach(function(i){ (out[i[key]] = out[i[key]] || []).push(i); });
    return out;
  }

  function renderChips(names, families, total){
    var box = document.getElementById('rcChips');
    if (names.length < 2) { box.innerHTML = ''; return; }
    var html = chipHtml('all', 'Tous', total);
    names.forEach(function(n){ html += chipHtml(n, n, families[n].length); });
    box.innerHTML = html;
  }
  function chipHtml(value, label, n){
    return '<button type="button" class="rc-chip" data-family="' + escapeHtml(value) + '" aria-pressed="' + (state.family === value) + '">'
      + escapeHtml(label) + '<span class="rc-n">' + n + '</span></button>';
  }

  function modelImage(item){
    if (!item.isIphone || item.uncertainSE) return '';
    var resolver = window.SolutionPhoneIphoneImages;
    return resolver ? (resolver.resolve(item.model) || '') : '';
  }

  function modelHtml(name, rows){
    rows = rows.slice().sort(function(a, b){ return a.price - b.price || a.storageNum - b.storageNum; });
    var min = rows[0].price;
    var img = modelImage(rows[0]);
    var isNeuf = rows[0].condition === 'neuf';
    var html = '<article class="rc-model">'
      + '<header class="rc-model-head">'
      + (img ? '<div class="rc-model-img"><img data-model-img src="' + escapeHtml(img) + '" alt="" loading="lazy" decoding="async"></div>' : '')
      + '<div><h3>' + escapeHtml(name) + '</h3><p>' + rows.length + ' en stock · dès ' + formatPrice(min) + '</p></div>'
      + '</header>'
      + '<table class="rc-table"><caption class="rc-sr">' + escapeHtml(name) + ' : exemplaires en stock</caption>'
      + '<colgroup><col class="c-sto"><col class="c-col"><col class="c-eta"><col class="c-bat"><col class="c-pri"><col class="c-act"></colgroup>'
      + '<thead><tr><th scope="col">Stockage</th><th scope="col">Couleur</th><th scope="col">État</th><th scope="col">Batterie</th>'
      + '<th scope="col" class="rc-num">Prix</th><th scope="col" class="rc-act"><span class="rc-sr">Réservation</span></th></tr></thead><tbody>';
    rows.forEach(function(r){ html += rowHtml(r, isNeuf); });
    return html + '</tbody></table></article>';
  }

  function na(label){ return '<span class="rc-na" aria-hidden="true">—</span><span class="rc-sr">' + label + '</span>'; }

  function rowHtml(r, isNeuf){
    var color = r.color
      ? (r.colorHex ? '<span class="rc-dot" style="background:' + r.colorHex + '" aria-hidden="true"></span>' : '') + escapeHtml(r.color)
      : na('non précisée');
    var grade = isNeuf ? 'Neuf' : (r.grade ? escapeHtml(r.grade) : na('non précisé'));
    var battery = r.battery ? r.battery + '&nbsp;%' : na(isNeuf ? 'neuf' : 'non indiquée');
    return '<tr>'
      + '<td>' + (r.storage ? escapeHtml(r.storage).replace(' ', '&nbsp;') : na('non précisé')) + '</td>'
      + '<td>' + color + '</td>'
      + '<td>' + grade + '</td>'
      + '<td>' + battery + '</td>'
      + '<td class="rc-num rc-price">' + formatPrice(r.price) + '</td>'
      + '<td class="rc-act"><a class="rc-reserve" href="' + reserveLink(r) + '" target="_blank" rel="noopener" aria-label="Réserver : ' + escapeHtml(describe(r)) + ' (WhatsApp)">Réserver</a></td>'
      + '</tr>';
  }

  function formatPrice(p){ return String(p).replace('.', ',') + '&nbsp;€'; }
  function plainPrice(p){ return String(p).replace('.', ',') + ' €'; }

  function describe(r){
    var parts = [r.model];
    if (r.storage) parts.push(r.storage);
    if (r.color) parts.push(r.color);
    if (r.condition === 'neuf') parts.push('neuf');
    else if (r.grade) parts.push('grade ' + r.grade);
    if (r.battery) parts.push('batterie ' + r.battery + ' %');
    parts.push(plainPrice(r.price));
    return parts.join(' · ');
  }

  function reserveLink(r){
    var msg = 'Bonjour, je souhaite réserver ce téléphone vu sur le site : ' + describe(r) + '. Est-il toujours disponible ?';
    return WHATSAPP + '?text=' + encodeURIComponent(msg);
  }

  /* ---------- Interactions ---------- */
  document.getElementById('rcTabs').addEventListener('click', function(e){
    var b = e.target.closest('.rc-tab');
    if (!b) return;
    state.cat = b.getAttribute('data-cat');
    state.family = 'all';
    render();
  });
  document.getElementById('rcChips').addEventListener('click', function(e){
    var b = e.target.closest('.rc-chip');
    if (!b) return;
    state.family = b.getAttribute('data-family');
    render();
    var again = document.querySelector('#rcChips .rc-chip[data-family="' + CSS.escape(state.family) + '"]');
    if (again) again.focus();
  });

  // Exposé pour vérification manuelle dans la console (lecture seule).
  window.SolutionPhoneRecond = { normalizeModel: normalizeModel, normalizeColor: normalizeColor };

  loadStock();
  setInterval(loadStock, 60000); // actualisation toutes les 60 s (comme avant)
})();
