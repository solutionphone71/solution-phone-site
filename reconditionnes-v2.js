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

  var state = { items: [], cat: 'all', family: 'all', budget: 'all', batteryMin: 0, sort: 'recent', query: '', tradeKey: '', tradeCond: 'tres_bon', tradeOther: '', signature: '', loaded: false };

  var TRADE_CONDITIONS = {
    tres_bon: { label: 'Très bon état' },
    correct:  { label: 'État correct' },
    fissure:  { label: 'Écran fissuré ou batterie faible' }
  };

  var TRADE_MODELS = {
    ip11:  { label: 'iPhone 11', brand: 'iphone' },
    ip11p: { label: 'iPhone 11 Pro / Pro Max', brand: 'iphone' },
    ip12:  { label: 'iPhone 12', brand: 'iphone' },
    ip12p: { label: 'iPhone 12 Pro / Pro Max', brand: 'iphone' },
    ip13:  { label: 'iPhone 13', brand: 'iphone' },
    ip13p: { label: 'iPhone 13 Pro / Pro Max', brand: 'iphone' },
    ip14:  { label: 'iPhone 14', brand: 'iphone' },
    ip14p: { label: 'iPhone 14 Pro / Pro Max', brand: 'iphone' },
    ip15:  { label: 'iPhone 15', brand: 'iphone' },
    ip15p: { label: 'iPhone 15 Pro / Pro Max', brand: 'iphone' },
    ip16:  { label: 'iPhone 16', brand: 'iphone' },
    ip16p: { label: 'iPhone 16 Pro / Pro Max', brand: 'iphone' },
    s21:   { label: 'Samsung Galaxy S21 / S21+', brand: 'samsung' },
    s21u:  { label: 'Samsung Galaxy S21 Ultra', brand: 'samsung' },
    s22:   { label: 'Samsung Galaxy S22 / S22+', brand: 'samsung' },
    s22u:  { label: 'Samsung Galaxy S22 Ultra', brand: 'samsung' },
    s23:   { label: 'Samsung Galaxy S23 / S23+', brand: 'samsung' },
    s23u:  { label: 'Samsung Galaxy S23 Ultra', brand: 'samsung' },
    s24:   { label: 'Samsung Galaxy S24 / S24+', brand: 'samsung' },
    s24u:  { label: 'Samsung Galaxy S24 Ultra', brand: 'samsung' },
    a54:   { label: 'Samsung Galaxy A54 / A55', brand: 'samsung' },
    autre: { label: 'Autre modèle', brand: 'autre', custom: true }
  };

  function getTradeSelection(modelKey, condKey, otherName){
    var entry = modelKey && TRADE_MODELS[modelKey];
    if (!entry) return null;
    var condCode = TRADE_CONDITIONS[condKey] ? condKey : 'tres_bon';
    var cond = TRADE_CONDITIONS[condCode];
    var customLabel = entry.custom
      ? String(otherName || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/·/g, '-').replace(/\s+/g, ' ').trim().slice(0, 60)
      : '';
    return {
      key: modelKey,
      brand: entry.brand,
      label: entry.custom ? (customLabel || entry.label) : entry.label,
      custom: !!entry.custom,
      condKey: condCode,
      condLabel: cond.label
    };
  }

  function currentTrade(){
    return getTradeSelection(state.tradeKey, state.tradeCond, state.tradeOther);
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
    var firstWord = words[0] || '';
    var letter = firstWord.charAt(0);
    var family = letter === 'S' ? 'Galaxy S' : letter === 'Z' ? 'Galaxy Z' : letter === 'A' ? 'Galaxy A' : 'Galaxy';
    var rank = 0;
    var variant = 1;
    var sMatch = /^S(\d{2})$/.exec(firstWord);
    if (sMatch) {
      rank = 10 + (parseInt(sMatch[1], 10) - 18) * 0.9;
      if (words.indexOf('Ultra') >= 0) variant = 4;
      else if (words.indexOf('+') >= 0) variant = 2;
      else if (words.indexOf('FE') >= 0) variant = 0;
    } else if (letter === 'Z') {
      var zNumMatch = /(\d+)/.exec(words.join(' '));
      rank = 10 + (zNumMatch ? parseInt(zNumMatch[1], 10) : 3);
      variant = /Fold/i.test(name) ? 3 : 2;
    } else if (/^A(\d{2})$/.test(firstWord)) {
      var aNum = parseInt(firstWord.slice(1), 10);
      rank = 6 + (aNum % 10) * 0.6 + Math.floor(aNum / 10) * 0.1;
    }
    return { name: name, brand: 'samsung', family: family, rank: rank, variant: variant };
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

  /* ---------- Filtrage, tri & rendu vitrine ---------- */
  function matchesFilters(i, opts){
    var f = opts || state;
    var budget = f.budget || 'all';
    if (budget === 'u250' && i.price >= 250) return false;
    if (budget === '250-450' && (i.price < 250 || i.price > 450)) return false;
    if (budget === 'o450' && i.price <= 450) return false;
    if (budget === 'u300' && i.price >= 300) return false;
    if (budget === 'u500' && i.price >= 500) return false;

    var minBat = Number(f.batteryMin) || 0;
    if (minBat > 0) {
      var batVal = i.condition === 'neuf' ? 100 : (i.battery || 0);
      if (batVal < minBat) return false;
    }

    var query = f.query || '';
    if (query) {
      var hay = deaccent([i.model, i.storage, i.color, i.grade, i.price, i.condition].join(' ')).toLowerCase();
      var qTokens = deaccent(query).toLowerCase().trim().split(/\s+/);
      for (var k = 0; k < qTokens.length; k++) {
        if (qTokens[k] && hay.indexOf(qTokens[k]) === -1) return false;
      }
    }
    return true;
  }

  function matchesCategory(i, cat){
    if (!cat || cat === 'all') return true;
    if (cat === 'neuf') return i.condition === 'neuf';
    return i.condition !== 'neuf' && i.brand === cat;
  }

  function filterItems(items, opts){
    var f = opts || state;
    var cat = f.cat || 'all';
    var family = f.family || 'all';
    return (items || []).filter(function(i){
      if (!matchesFilters(i, f)) return false;
      if (!matchesCategory(i, cat)) return false;
      if (family !== 'all' && i.family !== family) return false;
      return true;
    });
  }

  function sortItems(items, sortMode){
    var mode = sortMode || 'recent';
    return (items || []).slice().sort(function(a, b){
      if (mode === 'price_asc') {
        if (a.price !== b.price) return a.price - b.price;
        if (a.storageNum !== b.storageNum) return a.storageNum - b.storageNum;
        return a.model.localeCompare(b.model, 'fr');
      }
      if (mode === 'price_desc') {
        if (a.price !== b.price) return b.price - a.price;
        if (a.storageNum !== b.storageNum) return b.storageNum - a.storageNum;
        return a.model.localeCompare(b.model, 'fr');
      }
      if (a.rank !== b.rank) return b.rank - a.rank;
      if (a.variant !== b.variant) return b.variant - a.variant;
      if (a.price !== b.price) return a.price - b.price;
      if (a.storageNum !== b.storageNum) return a.storageNum - b.storageNum;
      return a.model.localeCompare(b.model, 'fr');
    });
  }

  function inCat(cat){
    return state.items.filter(function(i){
      return matchesFilters(i, state) && matchesCategory(i, cat);
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

  function syncFilterControls(){
    var budgetsEl = document.getElementById('rcBudgets');
    if (budgetsEl) {
      budgetsEl.querySelectorAll('.rc-budget').forEach(function(el){
        el.setAttribute('aria-pressed', String(el.getAttribute('data-budget') === state.budget));
      });
    }
    var quickEl = document.getElementById('rcQuickFilters');
    if (quickEl) {
      var isAll = state.cat === 'all' && state.budget === 'all' && !state.batteryMin && state.family === 'all' && !String(state.query || '').trim();
      quickEl.querySelectorAll('.rc-pill').forEach(function(el){
        var q = el.getAttribute('data-quick');
        var pressed = false;
        if (q === 'all') pressed = isAll;
        else if (q === 'iphone' || q === 'samsung') pressed = state.cat === q;
        else if (q === 'u300' || q === 'u500') pressed = state.budget === q;
        else if (q === 'bat95') pressed = state.batteryMin >= 95;
        el.setAttribute('aria-pressed', String(pressed));
      });
    }
    var sortEl = document.getElementById('rcSort');
    if (sortEl && sortEl.value !== state.sort) {
      sortEl.value = state.sort;
    }
  }

  function render(){
    updateSummary();
    var cats = ['all', 'iphone', 'samsung', 'autre', 'neuf'];
    var counts = {};
    cats.forEach(function(c){ counts[c] = inCat(c).length; });
    document.querySelectorAll('#rcTabs .rc-tab').forEach(function(b){
      var c = b.getAttribute('data-cat');
      var nEl = b.querySelector('.rc-n');
      if (nEl) nEl.textContent = counts[c] != null ? counts[c] : 0;
      b.hidden = c !== 'all' && !counts[c] && c !== state.cat;
      b.setAttribute('aria-pressed', String(c === state.cat));
    });
    syncFilterControls();

    var items = inCat(state.cat);
    var families = groupBy(items, 'family');
    var familyNames = Object.keys(families).sort(function(a, b){
      var ra = families[a][0].rank, rb = families[b][0].rank;
      if (ra !== rb) return rb - ra;
      return a.localeCompare(b, 'fr');
    });
    if (state.family !== 'all' && !families[state.family]) state.family = 'all';
    renderChips(familyNames, families, items.length);

    var shown = sortItems(state.family === 'all' ? items : families[state.family], state.sort);
    var countEl = document.getElementById('rcCount');
    if (countEl) {
      countEl.textContent = shown.length + ' smartphone' + (shown.length > 1 ? 's' : '') + ' affiché' + (shown.length > 1 ? 's' : '');
    }

    var list = document.getElementById('rcList');
    if (!shown.length) {
      var qNote = state.query ? ' pour « ' + escapeHtml(state.query) + ' »' : ' avec ces filtres';
      var hasActiveFilters = state.cat !== 'all' || state.budget !== 'all' || state.batteryMin > 0 || state.family !== 'all' || !!state.query;
      list.innerHTML = '<div class="rc-status"><p>Aucun téléphone en stock' + qNote + ' pour le moment.</p>'
        + '<div class="sp-empty-actions">'
        + (hasActiveFilters ? '<button type="button" class="rc-reset-filters-btn sp-btn-outline-dark">Réinitialiser les filtres</button>' : '')
        + '<button type="button" class="rc-empty-alert-btn sp-btn-red" data-sp-track="alerte_arrivage" data-sp-cta-location="reconditionnes_empty_search">Être prévenu du prochain arrivage</button>'
        + '<a class="sp-btn-outline-dark" data-sp-track="whatsapp" data-sp-cta-location="reconditionnes_empty_search" href="' + whatsappLink('Bonjour Solution Phone, je cherche un smartphone' + (state.query ? ' (' + state.query + ')' : '') + '. Avez-vous des arrivages prévus ?') + '" target="_blank" rel="noopener">Demander sur WhatsApp</a>'
        + '</div></div>';
      return;
    }

    var trade = currentTrade();
    list.innerHTML = '<div class="rc-grid">' + shown.map(function(r){ return cardHtml(r, trade); }).join('') + '</div>';
    list.querySelectorAll('img[data-model-img]').forEach(function(img){
      img.addEventListener('error', function(){
        var box = img.parentNode;
        if (!box) return;
        var modelName = img.getAttribute('data-model-name') || 'Smartphone';
        box.classList.add('rc-card-media--placeholder');
        box.innerHTML = placeholderInnerHtml(modelName);
      }, { once: true });
    });
  }

  function groupBy(items, key){
    var out = {};
    items.forEach(function(i){ (out[i[key]] = out[i[key]] || []).push(i); });
    return out;
  }

  function renderChips(names, families, total){
    var box = document.getElementById('rcChips');
    if (!box) return;
    if (names.length < 2) { box.innerHTML = ''; return; }
    var html = chipHtml('all', 'Toutes les séries', total);
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

  function placeholderInnerHtml(modelName){
    return '<div class="rc-placeholder" aria-hidden="true">'
      + '<svg class="rc-placeholder-icon" viewBox="0 0 64 96" width="52" height="78" fill="none" xmlns="http://www.w3.org/2000/svg">'
      + '<rect x="10" y="6" width="44" height="84" rx="9" stroke="#0D0D0D" stroke-width="2.5" fill="#FFFFFF"/>'
      + '<rect x="25" y="12" width="14" height="3" rx="1.5" fill="#0D0D0D" opacity="0.28"/>'
      + '<circle cx="32" cy="81" r="2.2" fill="#E10600"/>'
      + '</svg>'
      + '<span class="rc-placeholder-label">' + escapeHtml(modelName) + '</span>'
      + '</div>';
  }

  function cardHtml(r, explicitTrade){
    var trade = explicitTrade !== undefined ? explicitTrade : currentTrade();
    var isNeuf = r.condition === 'neuf';
    var img = modelImage(r);
    var mediaHtml = img
      ? '<div class="rc-card-media"><img data-model-img data-model-name="' + escapeHtml(r.model) + '" src="' + escapeHtml(img) + '" alt="' + escapeHtml(r.model + (r.color ? ' ' + r.color : '') + ' — Solution Phone Mâcon') + '" width="240" height="180" loading="lazy" decoding="async"></div>'
      : '<div class="rc-card-media rc-card-media--placeholder">' + placeholderInnerHtml(r.model) + '</div>';

    var badges = ['<span class="rc-badge rc-badge--stock"><span class="rc-stock-dot" aria-hidden="true"></span>En stock à Mâcon</span>'];
    if (isNeuf) {
      badges.push('<span class="rc-badge rc-badge--new">Neuf</span>');
    } else if (r.grade) {
      badges.push('<span class="rc-badge rc-badge--grade">Grade ' + escapeHtml(r.grade) + '</span>');
    }
    if (isNeuf) {
      badges.push('<span class="rc-badge rc-badge--bat rc-badge--bat-high rc-badge--bat-100">Batterie 100&nbsp;%</span>');
    } else if (r.battery) {
      var batClass = 'rc-badge rc-badge--bat'
        + (r.battery >= 90 ? ' rc-badge--bat-high' : '')
        + (r.battery === 100 ? ' rc-badge--bat-100' : '');
      badges.push('<span class="' + batClass + '">Batterie ' + r.battery + '&nbsp;%</span>');
    }
    badges.push('<span class="rc-badge rc-badge--warranty">Garantie 12&nbsp;mois</span>');

    var specParts = [];
    if (r.storage) {
      specParts.push('<span class="rc-card-storage">' + escapeHtml(r.storage).replace(' ', '&nbsp;') + '</span>');
    }
    if (r.color) {
      specParts.push('<span class="rc-card-color">' + (r.colorHex ? '<span class="rc-dot" style="background:' + r.colorHex + '" aria-hidden="true"></span>' : '') + escapeHtml(r.color) + '</span>');
    }
    var specsHtml = specParts.length
      ? '<p class="rc-card-specs">' + specParts.join('<span class="rc-spec-sep" aria-hidden="true">·</span>') + '</p>'
      : '';

    var desc = describe(r, trade);
    var shortModel = r.model + (r.storage ? ' ' + r.storage : '');

    return '<article class="rc-card">'
      + '<div class="rc-card-badges">' + badges.join('') + '</div>'
      + mediaHtml
      + '<div class="rc-card-body">'
      + '<h3 class="rc-card-title">' + escapeHtml(r.model) + '</h3>'
      + specsHtml
      + '<div class="rc-card-pricing">'
      + '<div class="rc-card-price-main"><span class="rc-card-price">' + formatPrice(r.price) + '</span><span class="rc-card-ttc">TTC</span></div>'
      + '</div>'
      + '</div>'
      + '<div class="rc-card-actions">'
      + '<button type="button" class="rc-reserve-mail" data-sp-track="reservation_24h" data-sp-cta-location="reconditionnes_stock_card" data-reserve-item="' + escapeHtml(desc) + '" data-reserve-model="' + escapeHtml(shortModel) + '" data-reserve-price="' + escapeHtml(String(r.price)) + '" aria-label="Réserver 24h (gratuit) : ' + escapeHtml(desc) + '">Réserver 24h (gratuit)</button>'
      + '<a class="rc-reserve-wa" data-sp-track="whatsapp" data-sp-cta-location="reconditionnes_stock_card" href="' + reserveLink(r, trade) + '" target="_blank" rel="noopener" aria-label="Demander sur WhatsApp : ' + escapeHtml(desc) + '">WhatsApp</a>'
      + '</div>'
      + '</article>';
  }

  function formatPrice(p){ return String(p).replace('.', ',') + '&nbsp;€'; }
  function plainPrice(p){ return String(p).replace('.', ',') + ' €'; }

  function describeTrade(trade){
    if (!trade) return '';
    return 'Reprise à estimer : ' + trade.label + ' (' + trade.condLabel + ')';
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
      parts.push('Reprise à estimer : ' + trade.label + ' (' + trade.condLabel + ')');
    }
    return parts.join(' · ');
  }

  function reserveLink(r, explicitTrade){
    var msg = 'Bonjour Solution Phone, je souhaite réserver ce téléphone vu sur le site : ' + describe(r, explicitTrade) + '. Est-il toujours disponible ?';
    return whatsappLink(msg);
  }

  function buildTradeWhatsAppMessage(trade){
    if (!trade) {
      return 'Bonjour Solution Phone, je souhaite faire estimer la reprise de mon ancien téléphone (paiement cash ou déduction sur un reconditionné).';
    }
    return 'Bonjour Solution Phone, je souhaite faire estimer la reprise de mon ' + trade.label + ' (' + trade.condLabel + ') — paiement cash ou déduction immédiate sur un reconditionné au 21 rue Gambetta.';
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
        rangeEl.innerHTML = 'Estimation gratuite en 2&nbsp;min sur WhatsApp ou au 21&nbsp;rue&nbsp;Gambetta (paiement cash ou déduction immédiate sur votre reconditionné)';
        rangeEl.classList.remove('is-active');
      } else {
        rangeEl.innerHTML = 'Reprise sélectionnée : <strong>' + escapeHtml(t.label) + '</strong> (' + escapeHtml(t.condLabel) + ')';
        rangeEl.classList.add('is-active');
      }
    }
    if (!sumEl) return;
    if (!t) {
      sumEl.innerHTML = 'Sélectionnez votre modèle et son état : votre demande de reprise est jointe automatiquement à votre message WhatsApp ou à votre réservation 24&nbsp;h (pièce d’identité requise en boutique).';
    } else {
      sumEl.innerHTML = 'Estimation gratuite en 2&nbsp;min sur WhatsApp ou au 21&nbsp;rue&nbsp;Gambetta (paiement cash ou déduction immédiate sur votre reconditionné, pièce d’identité requise). La mention «&nbsp;Reprise à estimer : ' + escapeHtml(t.label) + ' (' + escapeHtml(t.condLabel) + ')&nbsp;» est jointe automatiquement à vos clics Réserver 24&nbsp;h / WhatsApp.';
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
        if (state.query.trim() && state.cat !== 'all' && !inCat(state.cat).length && inCat('all').length > 0) {
          state.cat = 'all';
        }
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
        render();
      });
    }
    var quickEl = document.getElementById('rcQuickFilters');
    if (quickEl) {
      quickEl.addEventListener('click', function(e){
        var b = e.target.closest('.rc-pill');
        if (!b) return;
        var q = b.getAttribute('data-quick') || 'all';
        if (q === 'all') {
          state.cat = 'all';
          state.budget = 'all';
          state.batteryMin = 0;
          state.family = 'all';
          state.query = '';
          if (searchEl) searchEl.value = '';
        } else if (q === 'iphone' || q === 'samsung') {
          state.cat = state.cat === q ? 'all' : q;
          state.family = 'all';
        } else if (q === 'u300' || q === 'u500') {
          state.budget = state.budget === q ? 'all' : q;
          state.family = 'all';
        } else if (q === 'bat95') {
          state.batteryMin = state.batteryMin >= 95 ? 0 : 95;
          state.family = 'all';
        }
        render();
      });
    }
    var sortEl = document.getElementById('rcSort');
    if (sortEl) {
      sortEl.addEventListener('change', function(){
        var val = sortEl.value || 'recent';
        state.sort = (val === 'price_asc' || val === 'price_desc') ? val : 'recent';
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
          ? describeTrade(t) + ' — estimation gratuite en 2 min sur WhatsApp ou au 21 rue Gambetta (paiement cash ou déduction immédiate sur un reconditionné).'
          : 'Reprise de mon ancien téléphone à estimer (paiement cash ou déduction immédiate sur un reconditionné).';
        var ctx = t
          ? 'Reprise à estimer jointe à votre demande : ' + t.label + ' (' + t.condLabel + ').'
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
      var resetBtn = e.target.closest('.rc-reset-filters-btn');
      if (resetBtn) {
        state.cat = 'all';
        state.budget = 'all';
        state.batteryMin = 0;
        state.family = 'all';
        state.query = '';
        if (searchEl) searchEl.value = '';
        render();
        return;
      }
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
      var ctx = 'Réservation 24h (sans engagement) pré-remplie : '
        + (modelLabel || desc)
        + (price > 0 ? ' · ' + plainPrice(price) : '')
        + (trade ? ' · ' + describeTrade(trade) : '')
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
    toItem: toItem,
    matchesFilters: matchesFilters,
    filterItems: filterItems,
    sortItems: sortItems,
    cardHtml: cardHtml,
    whatsappLink: whatsappLink,
    TRADE_MODELS: TRADE_MODELS,
    TRADE_CONDITIONS: TRADE_CONDITIONS,
    getTradeSelection: getTradeSelection,
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
