/*
 * Menu commun Solution Phone — fichier IDENTIQUE sur les 3 sites :
 *   https://solution-phone.fr · https://reparation-iphone-macon.fr · https://solution-accessoires.fr
 * Il construit le menu (desktop + panneau mobile) et masque l'ancienne navigation de la page.
 * Si ce fichier ne se charge pas, l'ancienne navigation reste visible (secours).
 * Pour modifier le menu : modifier ce fichier puis le copier à l'identique dans les 3 dépôts
 * et augmenter le paramètre ?v= des balises qui le chargent.
 */
(function () {
  'use strict';
  if (window.__menuCommun) return;
  window.__menuCommun = true;

  var WA = 'https://wa.me/33783921884';
  var SP = 'https://solution-phone.fr';
  var RI = 'https://reparation-iphone-macon.fr';
  var SA = 'https://solution-accessoires.fr';
  var PHONE_SP = { href: 'tel:+33385330689', label: '03 85 33 06 89' };
  var PHONE_SA = { href: 'tel:+33602849953', label: '06 02 84 99 53' };

  var SITES = {
    phone: { host: 'solution-phone.fr', name: 'Solution Phone', sub: 'Atelier indépendant · Mâcon', logo: '/img/logo-ui.webp', phone: PHONE_SP },
    iphone: { host: 'reparation-iphone-macon.fr', name: 'Solution Phone', sub: 'Réparation iPhone · Mâcon', badge: 'SP', phone: PHONE_SP },
    acc: { host: 'solution-accessoires.fr', name: 'Solution Accessoires', sub: 'Une boutique Solution Phone · Mâcon', logo: '/img/logo-ui.webp', phone: PHONE_SA }
  };

  function wa(text) { return WA + '?text=' + encodeURIComponent(text); }

  var GROUPS = [
    { id: 'reparer', label: 'Réparer', items: [
      { label: 'Réparation iPhone', href: RI + '/' },
      { label: 'Samsung & Android', href: SP + '/reparation-samsung.html' },
      { label: 'Écran cassé', href: SP + '/ecran-iphone-casse-macon.html' },
      { label: 'Batterie', href: SP + '/remplacement-batterie-telephone-macon.html' },
      { label: 'Tous les tarifs & devis', href: SP + '/#devis' }
    ] },
    { id: 'acheter', label: 'Acheter', accent: true, items: [
      { label: 'Smartphones reconditionnés', href: SP + '/reconditionnes.html' },
      { label: 'Accessoires', href: SA + '/' },
      { label: 'Protection d’écran', meta: 'Verre trempé, hydrogel', href: SA + '/#hydrogel' },
      { label: 'Boutique en ligne', href: SP + '/accessoires.html' }
    ] },
    { id: 'services', label: 'Services', items: [
      { label: 'Nettoyage virus Android', meta: '10 à 20 €', href: SP + '/#services' },
      { label: 'Transfert de données', meta: 'dès 20 €', href: SP + '/#services' },
      { label: 'Nettoyage connecteur de charge', meta: '10 €', href: SP + '/#services' },
      { label: 'Rachat smartphone, tablette, PC', meta: 'Même cassé · offre rapide', href: SA + '/rachat-smartphone.html' },
      { label: '−25 € QualiRépar', meta: 'Bonus réparation', href: RI + '/qualirepar.html' }
    ] },
    { id: 'boutiques', label: 'Nos boutiques', items: [
      { label: 'Solution Phone', meta: 'Réparation · 03 85 33 06 89', href: SP + '/atelier.html' },
      { label: 'Solution Accessoires', meta: '06 02 84 99 53', href: SA + '/' },
      { label: 'Solution Informatique', meta: 'PC, Mac, consoles, trottinettes', href: SP + '/solution-informatique.html' },
      { label: 'Horaires & plan', meta: '21 rue Gambetta, Mâcon', href: SP + '/magasin/macon/' },
      { label: 'Avis Google', meta: '★ 4,7/5', href: 'https://g.page/r/CbyQ_wiFpddjEBM', ext: true }
    ] }
  ];

  var WA_QUOTE = wa('Bonjour, je souhaite un devis. Mon appareil et mon besoin : ');

  /* Anciennes navigations remplacées par le menu commun (masquées seulement quand ce script tourne). */
  var LEGACY = [
    'header.topbar', 'header.nav', 'nav.nav', 'header.sticky', 'nav#nav', 'header.wrap',
    '#sp-burger', '#sp-drawer', '.sp-global-header', '.sp-global-panel',
    '.sp-detail-header', '.sp-detail-panel', 'header.site-header',
    'body > nav:not([class]):not([id])'
  ];

  function detectSite() {
    var s = document.currentScript || document.querySelector('script[src*="menu-commun.js"]');
    var key = s && s.getAttribute('data-site');
    if (key && SITES[key]) return key;
    var h = location.hostname.replace(/^www\./, '');
    for (var k in SITES) if (SITES[k].host === h) return k;
    return 'phone';
  }
  var siteKey = detectSite();
  var site = SITES[siteKey];

  var ICON_TEL = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>';
  var ICON_CHEV = '<svg class="mc-chev" viewBox="0 0 12 12" width="10" height="10" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M2.5 4.5 6 8l3.5-3.5"/></svg>';

  var CSS = [
    /* Masquage des anciennes navigations */
    'html.mc-js :is(' + LEGACY.join(',') + '):not(#mc-root){display:none!important}',
    /* Remise à zéro : protège le menu des styles de chaque page (Tailwind, nav{position:fixed}…) */
    ':is(#mc-root,#mc-panel,#mc-footer),:is(#mc-root,#mc-panel,#mc-footer) :not(svg,svg *){all:revert;box-sizing:border-box}',
    ':is(#mc-root,#mc-panel,#mc-footer){--mc-ink:#1d1d1f;--mc-mute:#6e6e73;--mc-line:rgba(0,0,0,.1);--mc-red:#e30613;--mc-wa:#0b7a3e;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",Arial,sans-serif;color:#1d1d1f;-webkit-font-smoothing:antialiased;letter-spacing:-.01em;line-height:1.3;text-align:left}',
    ':is(#mc-root,#mc-panel) svg{display:block;flex:none}',
    /* Barre */
    '#mc-root{position:sticky;top:0;left:0;right:0;z-index:10030;display:block;width:100%;height:var(--mc-h,64px);margin:0;padding:0;background:rgba(255,255,255,.86);border-bottom:1px solid rgba(0,0,0,.08);-webkit-backdrop-filter:saturate(180%) blur(20px);backdrop-filter:saturate(180%) blur(20px)}',
    '#mc-root.mc-fixed{position:fixed}',
    '#mc-root .mc-bar{display:flex;align-items:center;gap:18px;height:100%;max-width:1280px;margin:0 auto;padding:0 clamp(16px,3vw,40px)}',
    '#mc-root .mc-brand{display:flex;align-items:center;gap:10px;min-width:0;color:#1d1d1f;text-decoration:none;white-space:nowrap}',
    '#mc-root .mc-brand img{width:36px;height:36px;object-fit:contain;display:block}',
    '#mc-root .mc-badge{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#d92d28;color:#fff;font-size:11px;font-weight:800;letter-spacing:0}',
    '#mc-root .mc-brand strong{display:block;font-size:15px;font-weight:650;letter-spacing:-.02em}',
    '#mc-root .mc-brand small{display:block;margin-top:1px;font-size:11px;color:#6e6e73;font-weight:400}',
    '#mc-root .mc-nav{display:flex;align-items:center;margin-left:auto}',
    '#mc-root .mc-groups{display:flex;align-items:center;gap:4px;margin:0;padding:0;list-style:none}',
    '#mc-root .mc-group{position:relative;list-style:none;margin:0;padding:0}',
    '#mc-root .mc-trigger{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 12px;border:0;border-radius:8px;background:transparent;color:#1d1d1f;font-weight:500;font-size:14px;line-height:1;font-family:inherit;cursor:pointer;white-space:nowrap}',
    '#mc-root .mc-trigger:hover,#mc-root .mc-trigger[aria-expanded="true"]{background:rgba(0,0,0,.05)}',
    '#mc-root .mc-trigger:focus-visible,#mc-root a:focus-visible,#mc-panel :is(a,button):focus-visible,#mc-footer a:focus-visible{outline:2px solid #0071e3;outline-offset:2px}',
    '#mc-root .mc-chev{transition:transform .2s}',
    '#mc-root .mc-trigger[aria-expanded="true"] .mc-chev{transform:rotate(180deg)}',
    /* Déclencheur « Acheter » : style du bouton rouge « Boutique » en relief (boutique-nav.css) */
    '#mc-root .mc-trigger.mc-accent{height:auto;min-height:36px;margin:0 4px 4px;padding:8px 15px;border:1px solid #f06870;border-bottom-color:#ae1722;border-radius:10px;background:linear-gradient(155deg,#ed3847 0%,#cc1424 60%,#ae101d 100%);color:#fff;font-weight:700;box-shadow:0 4px 0 #800c17,0 7px 12px #a10d2026,inset 0 1px 0 #ffffff55;text-shadow:0 1px 1px #65091355;transition:transform .16s,box-shadow .16s}',
    '#mc-root .mc-trigger.mc-accent:hover,#mc-root .mc-trigger.mc-accent[aria-expanded="true"]{transform:translateY(-2px);box-shadow:0 6px 0 #800c17,0 10px 16px #a10d2033,inset 0 1px 0 #ffffff55;background:linear-gradient(155deg,#ed3847 0%,#cc1424 60%,#ae101d 100%)}',
    '#mc-root .mc-trigger.mc-accent:active{transform:translateY(3px);box-shadow:0 1px 0 #800c17,inset 0 1px 0 #ffffff33}',
    '#mc-root .mc-trigger.mc-accent:focus-visible{outline:3px solid #222;outline-offset:4px}',
    /* Sous-menus */
    '#mc-root .mc-drop{position:absolute;top:calc(100% + 10px);left:0;z-index:2;display:block;min-width:290px;max-width:calc(100vw - 32px);margin:0;padding:8px;list-style:none;background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:14px;box-shadow:0 18px 40px rgba(0,0,0,.12)}',
    '#mc-root .mc-drop[hidden]{display:none}',
    '#mc-root .mc-drop::before{content:"";position:absolute;left:0;right:0;top:-12px;height:12px}',
    '#mc-root .mc-group:last-child .mc-drop{left:auto;right:0}',
    '#mc-root .mc-drop li,#mc-panel .mc-acc-list li{list-style:none;margin:0;padding:0}',
    '#mc-root .mc-drop a{display:flex;flex-direction:column;gap:2px;padding:10px 12px;border-radius:9px;color:#1d1d1f;text-decoration:none;font-size:14px;font-weight:500}',
    '#mc-root .mc-drop a:hover,#mc-root .mc-drop a:focus{background:#f5f5f7;outline:none}',
    '#mc-root .mc-drop a:focus-visible{outline:2px solid #0071e3;outline-offset:-2px}',
    ':is(#mc-root,#mc-panel) .mc-meta{display:block;font-size:12px;font-weight:400;color:#6e6e73}',
    /* Actions à droite */
    '#mc-root .mc-actions{display:flex;align-items:center;gap:10px;margin-left:8px}',
    '#mc-root .mc-tel{display:inline-flex;align-items:center;gap:7px;min-height:40px;padding:0 6px;color:#1d1d1f;text-decoration:none;font-size:14px;font-weight:600;white-space:nowrap}',
    '#mc-root .mc-tel:hover{color:#000;text-decoration:underline}',
    ':is(#mc-root,#mc-panel) .mc-wa{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 17px;border-radius:999px;background:var(--mc-wa);color:#fff;text-decoration:none;font-size:14px;font-weight:600;white-space:nowrap}',
    ':is(#mc-root,#mc-panel) .mc-wa:hover{background:#086332}',
    '#mc-root .mc-burger{display:none;align-items:center;justify-content:center;min-width:44px;height:44px;padding:0 14px;border:1px solid rgba(0,0,0,.12);border-radius:999px;background:#fff;color:#1d1d1f;font-weight:600;font-size:14px;line-height:1;font-family:inherit;cursor:pointer}',
    '@media(max-width:1120px){#mc-root .mc-brand small{display:none}#mc-root .mc-bar{gap:12px}#mc-root .mc-trigger{padding:0 9px}}',
    '@media(max-width:1010px){#mc-root .mc-tel span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}#mc-root .mc-tel{justify-content:center;min-width:40px}}',
    '@media(max-width:899.98px){#mc-root{--mc-h:58px}#mc-root .mc-nav,#mc-root .mc-actions .mc-wa{display:none}#mc-root .mc-actions{margin-left:auto;gap:6px}#mc-root .mc-burger{display:inline-flex}#mc-root .mc-tel{width:44px;height:44px;min-height:44px;border:1px solid rgba(0,0,0,.12);border-radius:50%;padding:0}#mc-root .mc-brand img{width:32px;height:32px}#mc-root .mc-brand small{display:block;font-size:10.5px}#mc-root .mc-bar{padding:0 14px}}',
    '@media(max-width:360px){#mc-root .mc-brand small{display:none}}',
    /* Panneau mobile */
    '#mc-panel{position:fixed;inset:0;z-index:2147483100;display:block;background:rgba(0,0,0,.32)}',
    '#mc-panel[hidden]{display:none}',
    '#mc-panel .mc-sheet{position:absolute;top:0;right:0;bottom:0;display:flex;flex-direction:column;width:min(100%,440px);background:#fff;box-shadow:-20px 0 50px rgba(0,0,0,.15)}',
    '#mc-panel .mc-sheet-head{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:58px;padding:0 14px 0 20px;border-bottom:1px solid rgba(0,0,0,.08)}',
    '#mc-panel .mc-sheet-title{font-size:15px;font-weight:650}',
    '#mc-panel .mc-close{display:inline-flex;align-items:center;justify-content:center;min-width:44px;height:44px;padding:0 14px;border:1px solid rgba(0,0,0,.12);border-radius:999px;background:#fff;color:#1d1d1f;font-weight:600;font-size:14px;line-height:1;font-family:inherit;cursor:pointer}',
    '#mc-panel .mc-sheet-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:6px 20px 20px}',
    '#mc-panel .mc-acc{border-bottom:1px solid rgba(0,0,0,.08)}',
    '#mc-panel .mc-acc-btn{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:56px;padding:0;border:0;background:transparent;color:#1d1d1f;font-weight:600;font-size:19px;line-height:1.2;font-family:inherit;letter-spacing:-.02em;cursor:pointer;text-align:left}',
    '#mc-panel .mc-acc-btn.mc-accent{color:#e30613}',
    '#mc-panel .mc-acc-btn .mc-chev{width:14px;height:14px;transition:transform .2s}',
    '#mc-panel .mc-acc-btn[aria-expanded="true"] .mc-chev{transform:rotate(180deg)}',
    '#mc-panel .mc-acc-list{margin:0;padding:0 0 12px;list-style:none}',
    '#mc-panel .mc-acc-list[hidden]{display:none}',
    '#mc-panel .mc-acc-list a{display:flex;flex-direction:column;justify-content:center;gap:2px;min-height:48px;padding:6px 0;color:#1d1d1f;text-decoration:none;font-size:16px;font-weight:450}',
    '#mc-panel .mc-sheet-foot{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px 20px calc(14px + env(safe-area-inset-bottom));border-top:1px solid rgba(0,0,0,.08);background:#fbfbfd}',
    '#mc-panel .mc-sheet-foot a{min-height:48px;font-size:15px}',
    '#mc-panel .mc-sheet-foot .mc-tel{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:1px solid rgba(0,0,0,.14);border-radius:999px;background:#fff;color:#1d1d1f;text-decoration:none;font-weight:600;white-space:nowrap}',
    'html.mc-lock,html.mc-lock body{overflow:hidden!important}',
    /* Liens en pied de page (HTML statique, stylé ici) */
    '#mc-footer{display:block;margin:0;padding:28px clamp(16px,4vw,40px) 32px;background:#f5f5f7;border-top:1px solid rgba(0,0,0,.08);color:#1d1d1f;font-size:13px}',
    '#mc-footer .mc-f-in{display:block;max-width:1100px;margin:0 auto}',
    '#mc-footer .mc-f-title{display:block;margin:0 0 10px;font-size:13px;font-weight:600;color:#1d1d1f}',
    '#mc-footer ul{display:flex;flex-wrap:wrap;gap:6px 18px;margin:0 0 10px;padding:0;list-style:none}',
    '#mc-footer li{list-style:none;margin:0;padding:0}',
    '#mc-footer a{color:#424245;text-decoration:none;line-height:1.9}',
    '#mc-footer a:hover{color:#000;text-decoration:underline}',
    '@media(max-width:899.98px){#mc-footer{padding-bottom:104px}#mc-footer ul{gap:2px 16px}}',
    '@media(prefers-reduced-motion:reduce){#mc-root .mc-chev,#mc-panel .mc-chev,#mc-root .mc-trigger.mc-accent{transition:none}}'
  ].join('\n');

  var style = document.createElement('style');
  style.id = 'mc-style';
  style.textContent = CSS;
  (document.head || document.documentElement).appendChild(style);
  document.documentElement.classList.add('mc-js');

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function linkAttrs(it) {
    var a = ' href="' + esc(it.href) + '"';
    if (it.ext) a += ' target="_blank" rel="noopener"';
    try {
      var u = new URL(it.href);
      if (u.hostname.replace(/^www\./, '') === site.host && u.pathname === location.pathname && !u.hash) a += ' aria-current="page"';
    } catch (e) {}
    return a;
  }
  function itemHtml(it) {
    return '<li><a' + linkAttrs(it) + '><span>' + esc(it.label) + '</span>' + (it.meta ? '<span class="mc-meta">' + esc(it.meta) + '</span>' : '') + '</a></li>';
  }
  function brandHtml() {
    var mark = site.logo ? '<img src="' + site.logo + '" alt="" width="36" height="36">' : '<span class="mc-badge" aria-hidden="true">' + site.badge + '</span>';
    return '<a class="mc-brand" href="/" aria-label="' + esc(site.name) + ' — accueil">' + mark + '<span><strong>' + esc(site.name) + '</strong><small>' + esc(site.sub) + '</small></span></a>';
  }
  function telHtml() {
    return '<a class="mc-tel" href="' + site.phone.href + '" aria-label="Appeler le ' + site.phone.label + '">' + ICON_TEL + '<span>' + site.phone.label + '</span></a>';
  }
  function waHtml() {
    return '<a class="mc-wa" href="' + esc(WA_QUOTE) + '" target="_blank" rel="noopener">Devis WhatsApp</a>';
  }

  function build() {
    if (document.getElementById('mc-root')) return;
    var body = document.body;

    /* Mesure de l'ancienne navigation (fixe ou non) avant de la masquer — sans affichage intermédiaire. */
    function legacyInfo() {
      var root = document.documentElement, info = { fixed: false, h: 0 };
      root.classList.remove('mc-js');
      document.querySelectorAll(LEGACY.join(',')).forEach(function (el) {
        var cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        if (cs.position === 'fixed' && el.getBoundingClientRect().top <= 1) { info.fixed = true; info.h = Math.max(info.h, el.offsetHeight); }
      });
      root.classList.add('mc-js');
      return info;
    }
    var legacy = legacyInfo();

    var header = document.createElement('div');
    header.id = 'mc-root';
    header.setAttribute('data-site', siteKey);
    var groupsHtml = GROUPS.map(function (g) {
      return '<li class="mc-group" data-group="' + g.id + '">' +
        '<button class="mc-trigger' + (g.accent ? ' mc-accent' : '') + '" type="button" id="mc-t-' + g.id + '" aria-expanded="false" aria-controls="mc-d-' + g.id + '">' + esc(g.label) + ICON_CHEV + '</button>' +
        '<ul class="mc-drop" id="mc-d-' + g.id + '" aria-labelledby="mc-t-' + g.id + '" hidden>' + g.items.map(itemHtml).join('') + '</ul></li>';
    }).join('');
    header.innerHTML = '<div class="mc-bar">' + brandHtml() +
      '<div class="mc-nav" role="navigation" aria-label="Menu principal"><ul class="mc-groups">' + groupsHtml + '</ul></div>' +
      '<div class="mc-actions">' + telHtml() + waHtml() +
      '<button class="mc-burger" type="button" aria-expanded="false" aria-controls="mc-panel" aria-haspopup="dialog">Menu</button></div></div>';

    var panel = document.createElement('div');
    panel.id = 'mc-panel';
    panel.hidden = true;
    panel.innerHTML = '<div class="mc-sheet" role="dialog" aria-modal="true" aria-labelledby="mc-sheet-title">' +
      '<div class="mc-sheet-head"><span class="mc-sheet-title" id="mc-sheet-title">' + esc(site.name) + '</span><button class="mc-close" type="button">Fermer</button></div>' +
      '<div class="mc-sheet-body" role="navigation" aria-label="Menu principal (mobile)">' + GROUPS.map(function (g) {
        return '<div class="mc-acc"><button class="mc-acc-btn' + (g.accent ? ' mc-accent' : '') + '" type="button" id="mc-pt-' + g.id + '" aria-expanded="false" aria-controls="mc-pl-' + g.id + '">' + esc(g.label) + ICON_CHEV + '</button>' +
          '<ul class="mc-acc-list" id="mc-pl-' + g.id + '" aria-labelledby="mc-pt-' + g.id + '" hidden>' + g.items.map(itemHtml).join('') + '</ul></div>';
      }).join('') + '</div>' +
      '<div class="mc-sheet-foot">' + telHtml() + waHtml() + '</div></div>';

    body.insertBefore(header, body.firstChild);
    body.appendChild(panel);

    /* Barre fixe si l'ancienne était fixe (la page a déjà réservé la place), sinon collante. */
    var basePad = parseFloat(getComputedStyle(body).paddingTop) || 0;
    function applyMode() {
      if (!legacy.fixed) return;
      header.classList.add('mc-fixed');
      var extra = header.offsetHeight - legacy.h;
      body.style.paddingTop = extra > 0 ? (basePad + extra) + 'px' : '';
    }
    applyMode();
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { if (legacy.fixed) { body.style.paddingTop = ''; basePad = parseFloat(getComputedStyle(body).paddingTop) || 0; legacy = legacyInfo(); applyMode(); } }, 150);
    });

    /* Ancres : laisser la place du menu. */
    var html = document.documentElement;
    var sp = getComputedStyle(html).scrollPaddingTop;
    if (!sp || sp === 'auto' || sp === '0px') html.style.scrollPaddingTop = '76px';

    /* ---------- Desktop : menus déroulants ---------- */
    var groups = [].slice.call(header.querySelectorAll('.mc-group'));
    var triggers = groups.map(function (g) { return g.querySelector('.mc-trigger'); });
    var hoverable = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var closeTimer = null, hoverOpenedAt = 0;

    function setOpen(g, open) {
      var t = g.querySelector('.mc-trigger'), d = g.querySelector('.mc-drop');
      t.setAttribute('aria-expanded', String(open));
      d.hidden = !open;
    }
    function closeAll(except) { groups.forEach(function (g) { if (g !== except) setOpen(g, false); }); }
    function isOpen(g) { return g.querySelector('.mc-trigger').getAttribute('aria-expanded') === 'true'; }
    function items(g) { return [].slice.call(g.querySelectorAll('.mc-drop a')); }

    groups.forEach(function (g, i) {
      var t = triggers[i];
      t.addEventListener('click', function () {
        if (isOpen(g) && Date.now() - hoverOpenedAt < 400) return;
        var open = !isOpen(g);
        closeAll(g);
        setOpen(g, open);
      });
      t.addEventListener('keydown', function (e) {
        var k = e.key;
        if (k === 'ArrowDown' || k === 'ArrowUp') {
          e.preventDefault(); closeAll(g); setOpen(g, true);
          var list = items(g); (k === 'ArrowDown' ? list[0] : list[list.length - 1]).focus();
        } else if (k === 'ArrowRight' || k === 'ArrowLeft') {
          e.preventDefault();
          var wasOpen = isOpen(g), n = triggers[(i + (k === 'ArrowRight' ? 1 : triggers.length - 1)) % triggers.length];
          closeAll(); n.focus(); if (wasOpen) setOpen(groups[triggers.indexOf(n)], true);
        } else if (k === 'Escape') { setOpen(g, false); }
      });
      g.querySelector('.mc-drop').addEventListener('keydown', function (e) {
        var list = items(g), idx = list.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') { e.preventDefault(); list[(idx + 1) % list.length].focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); list[(idx - 1 + list.length) % list.length].focus(); }
        else if (e.key === 'Home') { e.preventDefault(); list[0].focus(); }
        else if (e.key === 'End') { e.preventDefault(); list[list.length - 1].focus(); }
        else if (e.key === 'Escape') { e.preventDefault(); setOpen(g, false); t.focus(); }
        else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault(); var n = triggers[(i + (e.key === 'ArrowRight' ? 1 : triggers.length - 1)) % triggers.length];
          closeAll(); n.focus();
        }
      });
      g.addEventListener('focusout', function (e) { if (!g.contains(e.relatedTarget)) setOpen(g, false); });
      if (hoverable) {
        g.addEventListener('mouseenter', function () {
          clearTimeout(closeTimer);
          if (!isOpen(g)) { closeAll(g); setOpen(g, true); hoverOpenedAt = Date.now(); }
        });
        g.addEventListener('mouseleave', function () {
          clearTimeout(closeTimer);
          closeTimer = setTimeout(function () { if (!g.contains(document.activeElement) || document.activeElement === t) setOpen(g, false); }, 180);
        });
      }
    });
    document.addEventListener('click', function (e) { if (!header.contains(e.target)) closeAll(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.hidden) closeAll(); });

    /* ---------- Mobile : panneau plein écran ---------- */
    var burger = header.querySelector('.mc-burger');
    var closeBtn = panel.querySelector('.mc-close');
    var sheet = panel.querySelector('.mc-sheet');
    function focusables() {
      return [].slice.call(sheet.querySelectorAll('a[href],button:not([disabled])')).filter(function (el) { return el.offsetParent !== null; });
    }
    function openPanel() {
      closeAll();
      panel.hidden = false;
      burger.setAttribute('aria-expanded', 'true');
      html.classList.add('mc-lock');
      closeBtn.focus();
    }
    function closePanel(restore) {
      if (panel.hidden) return;
      panel.hidden = true;
      burger.setAttribute('aria-expanded', 'false');
      html.classList.remove('mc-lock');
      if (restore !== false) burger.focus();
    }
    burger.addEventListener('click', function () { if (panel.hidden) openPanel(); else closePanel(); });
    closeBtn.addEventListener('click', function () { closePanel(); });
    panel.addEventListener('click', function (e) {
      if (!sheet.contains(e.target)) { closePanel(); return; }
      var a = e.target.closest('a[href]');
      if (a) closePanel(false);
    });
    panel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); closePanel(); return; }
      if (e.key !== 'Tab') return;
      var f = focusables(); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    [].forEach.call(panel.querySelectorAll('.mc-acc-btn'), function (b) {
      b.addEventListener('click', function () {
        var open = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', String(open));
        document.getElementById(b.getAttribute('aria-controls')).hidden = !open;
      });
    });
    var mq = window.matchMedia('(min-width: 900px)');
    var onMq = function () { if (mq.matches) closePanel(false); };
    if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);

    /* Garder le menu tout en haut si un autre script insère un bandeau avant lui. */
    window.addEventListener('load', function () {
      if (body.firstElementChild !== header && !header.classList.contains('mc-fixed')) body.insertBefore(header, body.firstChild);
    });
  }

  function safeBuild() {
    try { build(); } catch (err) {
      /* En cas d'erreur, l'ancienne navigation redevient visible. */
      document.documentElement.classList.remove('mc-js');
      var r = document.getElementById('mc-root'); if (r) r.remove();
      if (window.console) console.warn('menu-commun', err);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', safeBuild); else safeBuild();
})();
