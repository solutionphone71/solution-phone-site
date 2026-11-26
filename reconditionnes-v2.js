/*
 * Page Reconditionnés — stock en direct (version 2).
 *
 * Source des données : INCHANGÉE. Même appel que l'ancienne page :
 *   GET https://vps-8066c206.vps.ovh.net/api/public/catalog?resource=stock
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

  var PUBLIC_CATALOG_URL = 'https://vps-8066c206.vps.ovh.net/api/public/catalog';
  var WHATSAPP = 'https://wa.me/33783921884';

  var state = { items: [], cat: 'iphone', family: 'all', budget: 'all', query: '', tradeKey: '', tradeCond: 'tres_bon', tradeOther: '', signature: '', loaded: false };

  var TRADE_CONDITIONS = {
    tres_bon: { label: 'Très bon état', factor: 1.0 },
    correct:  { label: 'État correct', factor: 0.78 },
    fissure:  { label: 'Écran fissuré ou batterie faible', factor: 0.48 }
  };

  var TRADE_MODELS = {
    ip11:  { label: 'iPhone 11', brand: 'iphone', val: 85 },
    ip11p: { label: 'iPhone 11 Pro / Pro Max', brand: 'iphone', val: 115 },
    ip12:  { label: 'iPhone 12', brand: 'iphone', val: 125 },
    ip12p: { label: 'iPhone 12 Pro / Pro Max', brand: 'iphone', val: 175 },
    ip13:  { label: 'iPhone 13', brand: 'iphone', val: 185 },
    ip13p: { label: 'iPhone 13 Pro / Pro Max', brand: 'iphone', val: 250 },
    ip14:  { label: 'iPhone 14', brand: 'iphone', val: 235 },
    ip14p: { label: 'iPhone 14 Pro / Pro Max', brand: 'iphone', val: 340 },
    ip15:  { label: 'iPhone 15', brand: 'iphone', val: 330 },
    ip15p: { label: 'iPhone 15 Pro / Pro Max', brand: 'iphone', val: 460 },
    ip16:  { label: 'iPhone 16', brand: 'iphone', val: 440 },
    ip16p: { label: 'iPhone 16 Pro / Pro Max', brand: 'iphone', val: 600 },
    s21:   { label: 'Samsung Galaxy S21 / S21+', brand: 'samsung', val: 90 },
    s21u:  { label: 'Samsung Galaxy S21 Ultra', brand: 'samsung', val: 145 },
    s22:   { label: 'Samsung Galaxy S22 / S22+', brand: 'samsung', val: 135 },
    s22u:  { label: 'Samsung Galaxy S22 Ultra', brand: 'samsung', val: 210 },
    s23:   { label: 'Samsung Galaxy S23 / S23+', brand: 'samsung', val: 210 },
    s23u:  { label: 'Samsung Galaxy S23 Ultra', brand: 'samsung', val: 290 },
    s24:   { label: 'Samsung Galaxy S24 / S24+', brand: 'samsung', val: 300 },
    s24u:  { label: 'Samsung Galaxy S24 Ultra', brand: 'samsung', val: 440 },
    a54:   { label: 'Samsung Galaxy A54 / A55', brand: 'samsung', val: 95 },
    autre: { label: 'Autre modèle', brand: 'autre', val: 0, custom: true }
  };

  function round5(n){
    return Math.max(0, Math.round(n / 5) * 5);
  }

  function estimateTradeIn(modelKey, condKey, otherName){
    var entry = modelKey && TRADE_MODELS[modelKey];
    if (!entry) return null;
    var condCode = TRADE_CONDITIONS[condKey] ? condKey : 'tres_bon';
    var cond = TRADE_CONDITIONS[condCode];
    if (entry.custom) {
      var customLabel = String(otherName || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
      return {
        key: modelKey,
        brand: entry.brand,
        label: customLabel || entry.label,
        custom: true,
        condKey: condCode,
        condLabel: cond.label,
        min: null,
        max: null,
        amount: 0
      };
    }
    var mid = round5(entry.val * cond.factor);
    var min = Math.max(15, round5(mid * 0.88));
    var max = Math.max(min + 10, round5(mid * 1.12));
    return {
      key: modelKey,
      brand: entry.brand,
      label: entry.label,
      custom: false,
      condKey: condCode,
      condLabel: cond.label,
      min: min,
      max: max,
      amount: mid
    };
  }

  function currentTrade(){
    return estimateTradeIn(state.tradeKey, state.tradeCond, state.tradeOther);
  }

  function formatNetRange(price, trade){
    var p = Number(price) || 0;
    if (!trade || trade.custom || p <= 0) return null;
    var netMin = Math.max(0, p - trade.max);
    var netMax = Math.max(0, p - trade.min);
    var shortLabel = netMin === netMax
      ? '~' + plainPrice(netMin)
      : '~' + String(netMin) + ' à ' + plainPrice(netMax);
    var htmlLabel = netMin === netMax
      ? '~' + formatPrice(netMin)
      : '~' + String(netMin) + '–' + formatPrice(netMax);
    return { netMin: netMin, netMax: netMax, shortLabel: shortLabel, htmlLabel: htmlLabel };
  }

  function budgetFromPrice(price){
    var p = Number(price) || 0;
    if (p > 0 && p < 250) return 'u250';
    if (p > 450) return 'o450';
    return '250-450';
  }

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
  function whatsappLink(message){
    return WHATSAPP + '?text=' + encodeURIComponent(message);
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
        document.getElementById('rcList').innerHTML = '<p class="rc-status">Le stock ne peut pas s’afficher pour le moment. Demandez les disponibilités sur <a href="' + whatsappLink('Bonjour Solution Phone, quels smartphones reconditionnés avez-vous en boutique ?') + '" target="_blank" rel="noopener">WhatsApp</a> ou au <a href="tel:+33385330689">03 85 33 06 89</a>.</p>';
      });
  }

  /* ---------- Rendu ---------- */
  function matchesFilters(i){
    if (state.budget === 'u250' && i.price >= 250) return false;
    if (state.budget === '250-450' && (i.price < 250 || i.price > 450)) return false;
    if (state.budget === 'o450' && i.price <= 450) return false;
    if (state.query) {
      var hay = deaccent([i.model, i.storage, i.color, i.grade, i.price].join(' ')).toLowerCase();
      var qTokens = deaccent(state.query).toLowerCase().trim().split(/\s+/);
      for (var k = 0; k < qTokens.length; k++) {
        if (qTokens[k] && hay.indexOf(qTokens[k]) === -1) return false;
      }
    }
    return true;
  }

  function inCat(cat){
    return state.items.filter(function(i){
      if (!matchesFilters(i)) return false;
      if (cat === 'neuf') return i.condition === 'neuf';
      return i.condition !== 'neuf' && i.brand === cat;
    });
  }

  function updateSummary(){
    var n = state.items.length;
    var now = new Date();
    var time = ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2);
    document.getElementById('rcSummary').textContent = n
      ? n + ' téléphone' + (n > 1 ? 's' : '') + ' disponible' + (n > 1 ? 's' : '') + ' à l’atelier · catalogue consulté à ' + time
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
      var qNote = state.query ? ' pour « ' + escapeHtml(state.query) + ' »' : ' dans cette catégorie';
      list.innerHTML = '<div class="rc-status"><p>Aucun téléphone en stock' + qNote + ' pour le moment.</p>'
        + '<div class="sp-empty-actions">'
        + '<button type="button" class="rc-empty-alert-btn sp-btn-red" data-sp-track="alerte_arrivage" data-sp-cta-location="reconditionnes_empty_search">Être prévenu du prochain arrivage</button>'
        + '<a class="sp-btn-outline-dark" data-sp-track="whatsapp" data-sp-cta-location="reconditionnes_empty_search" href="' + whatsappLink('Bonjour Solution Phone, je cherche un smartphone' + (state.query ? ' (' + state.query + ')' : '') + '. Avez-vous des arrivages prévus ?') + '" target="_blank" rel="noopener">Demander sur WhatsApp</a>'
        + '</div></div>';
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
    var resolver = typeof window !== 'undefined' && window.SolutionPhoneIphoneImages;
    return resolver ? (resolver.resolve(item.model) || '') : '';
  }

  function modelHtml(name, rows){
    rows = rows.slice().sort(function(a, b){ return a.price - b.price || a.storageNum - b.storageNum; });
    var min = rows[0].price;
    var trade = currentTrade();
    var netHead = formatNetRange(min, trade);
    var netLead = netHead ? ' · soit dès ~' + formatPrice(netHead.netMin) + ' avec reprise' : '';
    var img = modelImage(rows[0]);
    var isNeuf = rows[0].condition === 'neuf';
    var html = '<article class="rc-model">'
      + '<header class="rc-model-head">'
      + (img ? '<div class="rc-model-img"><img data-model-img src="' + escapeHtml(img) + '" alt="" width="96" height="72" loading="lazy" decoding="async"></div>' : '')
      + '<div><h3>' + escapeHtml(name) + '</h3><p>' + rows.length + ' en stock · dès ' + formatPrice(min) + netLead + '</p></div>'
      + '</header>'
      + '<table class="rc-table"><caption class="rc-sr">' + escapeHtml(name) + ' : exemplaires en stock</caption>'
      + '<colgroup><col class="c-sto"><col class="c-col"><col class="c-eta"><col class="c-bat"><col class="c-pri"><col class="c-act"></colgroup>'
      + '<thead><tr><th scope="col">Stockage</th><th scope="col">Couleur</th><th scope="col">État</th><th scope="col">Batterie</th>'
      + '<th scope="col" class="rc-num">Prix</th><th scope="col" class="rc-act"><span class="rc-sr">Réservation</span></th></tr></thead><tbody>';
    rows.forEach(function(r){ html += rowHtml(r, isNeuf, trade); });
    return html + '</tbody></table></article>';
  }

  function na(label){ return '<span class="rc-na" aria-hidden="true">—</span><span class="rc-sr">' + label + '</span>'; }

  function rowHtml(r, isNeuf, trade){
    var color = r.color
      ? (r.colorHex ? '<span class="rc-dot" style="background:' + r.colorHex + '" aria-hidden="true"></span>' : '') + escapeHtml(r.color)
      : na('non précisée');
    var grade = isNeuf ? 'Neuf' : (r.grade ? escapeHtml(r.grade) : na('non précisé'));
    var battery = r.battery ? r.battery + '&nbsp;%' : na(isNeuf ? 'neuf' : 'non indiquée');
    var net = formatNetRange(r.price, trade);
    var netHtml = net
      ? '<span class="rc-net">' + net.htmlLabel + ' <span class="rc-net-sub">reprise déduite</span></span>'
      : '';
    var desc = describe(r, trade);
    var shortModel = r.model + (r.storage ? ' ' + r.storage : '');
    return '<tr>'
      + '<td>' + (r.storage ? escapeHtml(r.storage).replace(' ', '&nbsp;') : na('non précisé')) + '</td>'
      + '<td>' + color + '</td>'
      + '<td>' + grade + '</td>'
      + '<td>' + battery + '</td>'
      + '<td class="rc-num rc-price">' + formatPrice(r.price) + netHtml + '</td>'
      + '<td class="rc-act"><span class="rc-act-group">'
      + '<button type="button" class="rc-reserve-mail" data-sp-track="reconditionnes" data-sp-cta-location="reconditionnes_stock_row" data-reserve-item="' + escapeHtml(desc) + '" data-reserve-model="' + escapeHtml(shortModel) + '" data-reserve-price="' + escapeHtml(String(r.price)) + '" aria-label="Réserver 24h en boutique : ' + escapeHtml(desc) + '">Réserver 24h</button>'
      + '<a class="rc-reserve-wa" data-sp-track="whatsapp" data-sp-cta-location="reconditionnes_stock_row" href="' + reserveLink(r, trade) + '" target="_blank" rel="noopener" aria-label="Demander sur WhatsApp : ' + escapeHtml(desc) + '">WhatsApp</a>'
      + '</span></td>'
      + '</tr>';
  }

  function formatPrice(p){ return String(p).replace('.', ',') + '&nbsp;€'; }
  function plainPrice(p){ return String(p).replace('.', ',') + ' €'; }

  function describeTrade(trade){
    if (!trade) return '';
    if (trade.custom) {
      return 'Reprise à estimer : ' + trade.label + ' (' + trade.condLabel + ')';
    }
    return 'Reprise simulée : ' + trade.label + ' (' + trade.condLabel + ', fourchette indicative ' + trade.min + ' à ' + plainPrice(trade.max) + ')';
  }

  function describe(r, explicitTrade){
    var parts = [r.model];
    if (r.storage) parts.push(r.storage);
    if (r.color) parts.push(r.color);
    if (r.condition === 'neuf') parts.push('neuf');
    else if (r.grade) parts.push('grade ' + r.grade);
    if (r.battery) parts.push('batterie ' + r.battery + ' %');
    parts.push(plainPrice(r.price));
    var trade = explicitTrade !== undefined ? explicitTrade : currentTrade();
    if (trade) {
      if (trade.custom) {
        parts.push('reprise à estimer : ' + trade.label + ' (' + trade.condLabel + ')');
      } else {
        var net = formatNetRange(r.price, trade);
        parts.push('reprise simulée : ' + trade.label + ' (' + trade.condLabel + ', ' + trade.min + ' à ' + plainPrice(trade.max) + ' indicatif)');
        if (net) parts.push('net estimé : ' + net.shortLabel);
      }
    }
    return parts.join(' · ');
  }

  function reserveLink(r, explicitTrade){
    var msg = 'Bonjour Solution Phone, je souhaite réserver ce téléphone vu sur le site : ' + describe(r, explicitTrade) + '. Est-il toujours disponible ?';
    return whatsappLink(msg);
  }

  function buildTradeWhatsAppMessage(trade){
    if (!trade) {
      return 'Bonjour Solution Phone, je souhaite faire estimer la reprise de mon téléphone pour l\'achat d\'un reconditionné.';
    }
    if (trade.custom) {
      return 'Bonjour Solution Phone, je souhaite faire estimer la reprise de mon téléphone (' + trade.label + ' — ' + trade.condLabel + ') pour un paiement cash ou en déduction sur un reconditionné.';
    }
    return 'Bonjour Solution Phone, j\'ai simulé la reprise de mon ' + trade.label + ' (' + trade.condLabel + ', estimation indicative ' + trade.min + ' à ' + plainPrice(trade.max) + ') et je souhaite confirmer la reprise au 21 rue Gambetta.';
  }

  function trackTradeSimulation(trade){
    if (!trade || typeof window === 'undefined') return;
    if (window.SolutionPhoneBoost && typeof window.SolutionPhoneBoost.trackEvent === 'function') {
      window.SolutionPhoneBoost.trackEvent('sp_trade_simulate', {
        cta_type: 'reprise',
        cta_location: 'reconditionnes_trade_sim',
        trade_brand: trade.brand,
        trade_condition: trade.condKey
      });
    }
  }

  function prefillLeadSection(options){
    if (typeof window !== 'undefined' && window.SolutionPhoneBoost && typeof window.SolutionPhoneBoost.prefillLeadForm === 'function') {
      return window.SolutionPhoneBoost.prefillLeadForm(options);
    }
    if (typeof document === 'undefined') return false;
    var section = document.getElementById('demande-conseil');
    if (!section) return false;
    var form = section.querySelector('form[data-sp-lead-form]');
    if (!form) return false;
    var besoinEl = form.querySelector('select[name="besoin"]');
    var budgetEl = form.querySelector('select[name="budget"]');
    var modeleEl = form.querySelector('input[name="modele"]');
    var detailsEl = form.querySelector('textarea[name="details"]');
    var prenomEl = form.querySelector('input[name="prenom"]');
    var ctxEl = document.getElementById('rcLeadContext');
    var confirmEl = section.querySelector('[data-sp-lead-confirm]');
    if (besoinEl && options.besoin) {
      var curNeed = String(besoinEl.value || '').trim();
      if (!(options.preserveNeed && (curNeed === 'reservation_24h' || curNeed === 'alerte_arrivage'))) {
        besoinEl.value = options.besoin;
      }
    }
    if (budgetEl && options.budget) budgetEl.value = options.budget;
    if (modeleEl && typeof options.modele === 'string') modeleEl.value = String(options.modele).slice(0, 80);
    if (detailsEl && options.details) {
      if ((options.replaceTradeDetails || options.appendDetails) && detailsEl.value && detailsEl.value.trim()) {
        if (detailsEl.value.indexOf(options.details) === -1) {
          detailsEl.value = (detailsEl.value.trim() + ' · ' + options.details).slice(0, 500);
        }
      } else {
        detailsEl.value = String(options.details).slice(0, 500);
      }
    }
    if (ctxEl && options.contextMessage) {
      ctxEl.textContent = options.contextMessage;
      ctxEl.hidden = false;
    }
    if (confirmEl) confirmEl.hidden = true;
    if (typeof section.scrollIntoView === 'function') {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    var target = (!modeleEl || (modeleEl.value && modeleEl.value.trim())) ? prenomEl : modeleEl;
    if (target && typeof target.focus === 'function') target.focus();
    return true;
  }

  function updateTradeSummary(){
    var sumEl = document.getElementById('rcTradeSummary');
    var rangeEl = document.getElementById('rcTradeRange');
    var otherWrap = document.getElementById('rcTradeOtherWrap');
    var waBtn = document.getElementById('rcTradeWaBtn');
    var t = currentTrade();

    if (otherWrap) {
      otherWrap.hidden = state.tradeKey !== 'autre';
    }
    if (waBtn) {
      waBtn.href = whatsappLink(buildTradeWhatsAppMessage(t));
    }
    if (rangeEl) {
      if (!t) {
        rangeEl.innerHTML = 'Sélectionnez votre modèle pour afficher la fourchette indicative';
        rangeEl.classList.remove('is-active');
      } else if (t.custom) {
        rangeEl.innerHTML = 'Estimation personnalisée en 5&nbsp;min en boutique ou sur WhatsApp';
        rangeEl.classList.add('is-active');
      } else {
        rangeEl.innerHTML = 'Fourchette indicative : <strong>' + formatPrice(t.min) + ' – ' + formatPrice(t.max) + '</strong>';
        rangeEl.classList.add('is-active');
      }
    }
    if (!sumEl) return;
    if (!t) {
      sumEl.innerHTML = 'Estimation indicative, confirmation en 5&nbsp;min au 21&nbsp;rue&nbsp;Gambetta — paiement cash ou déduction immédiate sur un reconditionné (pièce d’identité requise).';
    } else if (t.custom) {
      sumEl.innerHTML = 'Reprise de votre <strong>' + escapeHtml(t.label) + '</strong> (' + escapeHtml(t.condLabel) + ') : estimation indicative personnalisée, confirmation en 5&nbsp;min au 21&nbsp;rue&nbsp;Gambetta — paiement cash ou déduction immédiate sur un reconditionné.';
    } else {
      sumEl.innerHTML = '<strong>−' + formatPrice(t.min) + ' à −' + formatPrice(t.max) + '</strong> déduits à titre indicatif ci-dessous pour votre ' + escapeHtml(t.label) + ' (' + escapeHtml(t.condLabel) + '). Estimation indicative, confirmation en 5&nbsp;min au 21&nbsp;rue&nbsp;Gambetta — paiement cash ou déduction immédiate sur un reconditionné.';
    }
  }

  function openArrivalAlert(){
    var trade = currentTrade();
    var tradeText = describeTrade(trade);
    var searched = String(state.query || '').trim();
    var details = 'Merci de me prévenir dès le prochain arrivage en boutique à Mâcon.'
      + (tradeText ? ' · ' + tradeText : '');
    prefillLeadSection({
      besoin: 'alerte_arrivage',
      modele: searched,
      details: details,
      contextMessage: 'Alerte arrivage Mâcon activée' + (searched ? ' pour « ' + searched + ' »' : '') + ' — indiquez vos coordonnées ci-dessous.'
    });
  }

  function bindDom(){
    var tabsEl = document.getElementById('rcTabs');
    var chipsEl = document.getElementById('rcChips');
    var listEl = document.getElementById('rcList');
    if (!tabsEl || !listEl) return;

    tabsEl.addEventListener('click', function(e){
      var b = e.target.closest('.rc-tab');
      if (!b) return;
      state.cat = b.getAttribute('data-cat');
      state.family = 'all';
      render();
    });
    if (chipsEl) {
      chipsEl.addEventListener('click', function(e){
        var b = e.target.closest('.rc-chip');
        if (!b) return;
        state.family = b.getAttribute('data-family');
        render();
        var again = document.querySelector('#rcChips .rc-chip[data-family="' + CSS.escape(state.family) + '"]');
        if (again) again.focus();
      });
    }

    var searchEl = document.getElementById('rcSearch');
    if (searchEl) {
      searchEl.addEventListener('input', function(){
        state.query = searchEl.value || '';
        state.family = 'all';
        render();
      });
    }
    var budgetsEl = document.getElementById('rcBudgets');
    if (budgetsEl) {
      budgetsEl.addEventListener('click', function(e){
        var b = e.target.closest('.rc-budget');
        if (!b) return;
        state.budget = b.getAttribute('data-budget') || 'all';
        state.family = 'all';
        budgetsEl.querySelectorAll('.rc-budget').forEach(function(el){
          el.setAttribute('aria-pressed', String(el === b));
        });
        render();
      });
    }
    var tradeModelEl = document.getElementById('rcTradeModel');
    if (tradeModelEl) {
      tradeModelEl.addEventListener('change', function(){
        state.tradeKey = tradeModelEl.value || '';
        updateTradeSummary();
        trackTradeSimulation(currentTrade());
        if (state.loaded) render();
      });
    }
    var tradeOtherEl = document.getElementById('rcTradeOther');
    var tradeOtherTimer = null;
    if (tradeOtherEl) {
      tradeOtherEl.addEventListener('input', function(){
        state.tradeOther = tradeOtherEl.value || '';
        updateTradeSummary();
        if (tradeOtherTimer) clearTimeout(tradeOtherTimer);
        tradeOtherTimer = setTimeout(function(){
          tradeOtherTimer = null;
          if (state.loaded) render();
        }, 200);
      });
      tradeOtherEl.addEventListener('change', function(){
        if (tradeOtherTimer) { clearTimeout(tradeOtherTimer); tradeOtherTimer = null; }
        state.tradeOther = tradeOtherEl.value || '';
        updateTradeSummary();
        if (state.loaded) render();
      });
    }
    var tradeCondEl = document.getElementById('rcTradeCond');
    if (tradeCondEl) {
      tradeCondEl.addEventListener('click', function(e){
        var b = e.target.closest('.rc-cond-btn');
        if (!b) return;
        var nextCond = b.getAttribute('data-cond') || 'tres_bon';
        state.tradeCond = TRADE_CONDITIONS[nextCond] ? nextCond : 'tres_bon';
        tradeCondEl.querySelectorAll('.rc-cond-btn').forEach(function(el){
          el.setAttribute('aria-pressed', String(el === b));
        });
        updateTradeSummary();
        trackTradeSimulation(currentTrade());
        if (state.loaded) render();
      });
    }
    var tradeApplyBtn = document.getElementById('rcTradeApplyBtn');
    if (tradeApplyBtn) {
      tradeApplyBtn.addEventListener('click', function(){
        var t = currentTrade();
        var details = t
          ? describeTrade(t) + ' — souhait : déduction sur un smartphone reconditionné ou rachat cash au 21 rue Gambetta.'
          : 'Je souhaite faire estimer la reprise de mon ancien téléphone en déduction sur un reconditionné.';
        var ctx = t
          ? (t.custom
              ? 'Reprise à estimer ajoutée à votre demande : ' + t.label + ' (' + t.condLabel + ').'
              : 'Reprise simulée appliquée : ' + t.label + ' (' + t.min + ' à ' + plainPrice(t.max) + ' indicatif).')
          : 'Demande de reprise pré-remplie — précisez le modèle souhaité ci-dessous.';
        prefillLeadSection({
          besoin: 'reconditionne',
          preserveNeed: true,
          details: details,
          replaceTradeDetails: true,
          contextMessage: ctx
        });
      });
    }
    var arrivalBtn = document.getElementById('rcArrivalAlertBtn');
    if (arrivalBtn) {
      arrivalBtn.addEventListener('click', openArrivalAlert);
    }

    listEl.addEventListener('click', function(e){
      var alertBtn = e.target.closest('.rc-empty-alert-btn');
      if (alertBtn) {
        openArrivalAlert();
        return;
      }
      var btn = e.target.closest('[data-reserve-item]');
      if (!btn) return;
      var desc = btn.getAttribute('data-reserve-item') || '';
      var modelLabel = btn.getAttribute('data-reserve-model') || '';
      var price = Number(btn.getAttribute('data-reserve-price') || 0);
      var trade = currentTrade();
      var net = formatNetRange(price, trade);
      var ctx = 'Réservation 24h (sans engagement) pré-remplie : '
        + (modelLabel || desc)
        + (price > 0 ? ' · ' + plainPrice(price) : '')
        + (net ? ' (net estimé après reprise : ' + net.shortLabel + ')' : '')
        + '.';
      var handled = prefillLeadSection({
        besoin: 'reservation_24h',
        budget: budgetFromPrice(price),
        modele: modelLabel,
        details: 'Réservation 24h (sans engagement) : ' + desc + ' — Je souhaite passer le voir au 21 rue Gambetta.',
        contextMessage: ctx
      });
      if (!handled) {
        if (typeof window !== 'undefined' && typeof window.SolutionPhoneOpenQuoteModal === 'function') {
          window.SolutionPhoneOpenQuoteModal(
            'Pré-réservation vitrine 24h (sans engagement) : ' + desc + ' — Je souhaite passer le voir au 21 rue Gambetta.',
            'Réserver ce smartphone 24h en boutique'
          );
        } else if (typeof window !== 'undefined') {
          window.open(whatsappLink('Bonjour Solution Phone, je souhaite réserver ce téléphone vu sur le site : ' + desc), '_blank');
        }
      }
    });

    updateTradeSummary();
    loadStock();
    setInterval(loadStock, 60000); // actualisation toutes les 60 s (comme avant)
  }

  var publicApi = {
    normalizeModel: normalizeModel,
    normalizeColor: normalizeColor,
    whatsappLink: whatsappLink,
    TRADE_MODELS: TRADE_MODELS,
    TRADE_CONDITIONS: TRADE_CONDITIONS,
    estimateTradeIn: estimateTradeIn,
    formatNetRange: formatNetRange,
    budgetFromPrice: budgetFromPrice,
    describeTrade: describeTrade,
    describe: describe,
    buildTradeWhatsAppMessage: buildTradeWhatsAppMessage
  };

  if (typeof window !== 'undefined') {
    window.SolutionPhoneRecond = publicApi;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = publicApi;
  }
  if (typeof document !== 'undefined') {
    bindDom();
  }
})();
