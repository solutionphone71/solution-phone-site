(function () {
  'use strict';

  // Choix des cookies (CNIL) :
  // - sans accord, Google Analytics (gtag.js) et le chat Crisp ne sont PAS chargés ;
  // - après « Accepter », gtag.js est chargé et les fonctions enregistrées via
  //   SolutionPhoneConsent.onAccept() (ex. chargement de Crisp) sont exécutées ;
  // - tout lien portant l'attribut data-sp-consent-manage rouvre le choix ;
  // - le choix est redemandé après 13 mois.

  var STORAGE_KEY = 'solution_phone_consent_v1';
  var DATE_KEY = 'solution_phone_consent_date_v1';
  var MAX_AGE_MS = 395 * 24 * 60 * 60 * 1000; // environ 13 mois
  var GA_ID = 'G-3QP90K1TLM';
  var GA_SRC = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;

  function readStorage(key) {
    try { return localStorage.getItem(key); } catch (error) { return null; }
  }
  function writeStorage(key, value) {
    try { localStorage.setItem(key, value); } catch (error) {}
  }
  function removeStorage(key) {
    try { localStorage.removeItem(key); } catch (error) {}
  }

  var storedChoice = readStorage(STORAGE_KEY);
  if (storedChoice !== 'accepted' && storedChoice !== 'refused') storedChoice = null;
  if (storedChoice) {
    var savedAt = Number(readStorage(DATE_KEY));
    if (!savedAt) writeStorage(DATE_KEY, String(Date.now()));
    else if (Date.now() - savedAt > MAX_AGE_MS) {
      storedChoice = null;
      removeStorage(STORAGE_KEY);
      removeStorage(DATE_KEY);
    }
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  // Durée de vie des cookies Google Analytics limitée à 13 mois (recommandation CNIL).
  window.gtag('set', { cookie_expires: 395 * 24 * 60 * 60 });

  // Seule la mesure d’audience est demandée : les finalités publicitaires
  // (ad_storage, ad_user_data, ad_personalization) restent toujours refusées.
  var granted = storedChoice === 'accepted';
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    analytics_storage: granted ? 'granted' : 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500
  });

  function consentState(choice) {
    var allow = choice === 'accepted';
    return {
      ad_storage: 'denied',
      analytics_storage: allow ? 'granted' : 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    };
  }

  var acceptCallbacks = [];
  var gaLoaded = false;
  var chatRequested = false;

  function pageUsesAnalytics() {
    var queue = window.dataLayer || [];
    for (var i = 0; i < queue.length; i++) {
      if (queue[i] && queue[i][0] === 'config') return true;
    }
    return false;
  }

  function loadAnalytics() {
    if (gaLoaded || storedChoice !== 'accepted' || !pageUsesAnalytics()) return;
    gaLoaded = true;
    var script = document.createElement('script');
    script.async = true;
    script.src = GA_SRC;
    document.head.appendChild(script);
  }

  function runAcceptCallbacks() {
    var callbacks = acceptCallbacks.slice();
    acceptCallbacks.length = 0;
    for (var i = 0; i < callbacks.length; i++) {
      try { callbacks[i](); } catch (error) {}
    }
  }

  function onAccept(callback) {
    if (typeof callback !== 'function') return;
    if (storedChoice === 'accepted') {
      try { callback(); } catch (error) {}
      return;
    }
    acceptCallbacks.push(callback);
  }

  function applyAccepted() {
    loadAnalytics();
    runAcceptCallbacks();
  }

  function deleteTrackingCookies() {
    var cookies = document.cookie ? document.cookie.split(';') : [];
    var host = location.hostname;
    var parts = host.split('.');
    var domains = [''];
    for (var i = 0; i < parts.length - 1; i++) {
      var domain = parts.slice(i).join('.');
      domains.push(';domain=' + domain, ';domain=.' + domain);
    }
    for (var c = 0; c < cookies.length; c++) {
      var name = cookies[c].split('=')[0].trim();
      if (!/^(_ga|_gid|_gat|_gcl|crisp)/i.test(name)) continue;
      for (var d = 0; d < domains.length; d++) {
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/' + domains[d];
      }
    }
  }

  function removeBanner() {
    var banner = document.getElementById('sp-consent');
    if (banner) banner.remove();
  }

  function saveChoice(choice) {
    var previous = storedChoice;
    writeStorage(STORAGE_KEY, choice);
    writeStorage(DATE_KEY, String(Date.now()));
    storedChoice = choice;
    window.gtag('consent', 'update', consentState(choice));
    removeBanner();
    if (choice === 'accepted') {
      applyAccepted();
      if (chatRequested && typeof window.openCrispFloat === 'function') {
        chatRequested = false;
        window.openCrispFloat();
      }
    } else {
      // Refus : on efface aussi les cookies _ga*/crisp éventuellement déjà
      // présents (visite précédente, autre page), puis, si l’accord avait été
      // donné, on recharge la page pour décharger Google Analytics et Crisp.
      deleteTrackingCookies();
      if (previous === 'accepted') location.reload();
      else chatRequested = false;
    }
  }

  // Aucune donnée personnelle (e-mail, téléphone) n’est envoyée à Google :
  // la fonction est conservée pour compatibilité mais ne renvoie plus rien.
  function enhancedLeadData() {
    return null;
  }

  function isFramedBySite() {
    try {
      return window.self !== window.top && !!window.parent.SolutionPhoneConsent;
    } catch (error) {
      return false;
    }
  }

  function installBanner(options) {
    options = options || {};
    if (!document.body) return;
    removeBanner();
    if (!document.getElementById('sp-consent-style')) {
      var style = document.createElement('style');
      style.id = 'sp-consent-style';
      style.textContent = '#sp-consent{position:fixed;z-index:2147483646;left:12px;right:12px;bottom:84px;max-width:620px;margin:auto;padding:12px 13px;background:#111;color:#fff;border:1px solid rgba(255,255,255,.18);box-shadow:0 18px 60px rgba(0,0,0,.34);font:12px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;text-align:left}#sp-consent p{margin:0 0 9px;color:#fff}#sp-consent strong{display:inline;margin-right:4px;color:#fff}#sp-consent-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}#sp-consent button{min-height:44px;padding:0 9px;border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;font:700 12px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer}#sp-consent-accept{background:#C00510!important;border-color:#C00510!important}#sp-consent button:focus-visible,#sp-consent a:focus-visible{outline:3px solid #fff;outline-offset:2px}#sp-consent a{color:#fff;text-decoration:underline}@media(min-width:721px){#sp-consent{bottom:88px;font-size:13px}#sp-consent button{font-size:13px}}';
      document.head.appendChild(style);
    }
    var banner = document.createElement('section');
    banner.id = 'sp-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Choix des cookies');
    var intro = options.chat
      ? '<p><strong>Le chat en direct nécessite votre accord.</strong>Il utilise le service Crisp, qui dépose des cookies. Vous pouvez aussi nous appeler ou nous écrire sur WhatsApp. '
      : '<p><strong>Mesure d’audience et chat en direct facultatifs.</strong>Google Analytics et le chat Crisp ne sont activés qu’avec votre accord ; sans accord, aucun de leurs cookies n’est déposé. ';
    var current = storedChoice === 'accepted' ? 'Choix actuel : accepté. ' : storedChoice === 'refused' ? 'Choix actuel : refusé. ' : '';
    banner.innerHTML = intro + current + '<a href="/politique-confidentialite.html#cookies">En savoir plus</a>.</p><div id="sp-consent-actions"><button id="sp-consent-refuse" type="button">Continuer sans accepter</button><button id="sp-consent-accept" type="button">Accepter</button></div>';
    document.body.appendChild(banner);
    banner.querySelector('#sp-consent-refuse').addEventListener('click', function () { saveChoice('refused'); });
    banner.querySelector('#sp-consent-accept').addEventListener('click', function () { saveChoice('accepted'); });
  }

  function manage(options) {
    options = options || {};
    if (options.chat) chatRequested = true;
    installBanner(options);
    var first = document.getElementById('sp-consent-accept');
    if (first && options.focus !== false) first.focus();
  }

  window.SolutionPhoneConsent = {
    choice: function () { return storedChoice; },
    accepted: function () { return storedChoice === 'accepted'; },
    accept: function () { saveChoice('accepted'); },
    refuse: function () { saveChoice('refused'); },
    manage: manage,
    onAccept: onAccept,
    enhancedLeadData: enhancedLeadData
  };

  // Liens « Gérer mes cookies » présents dans les pieds de page.
  document.addEventListener('click', function (event) {
    var target = event.target;
    var link = target && target.closest ? target.closest('[data-sp-consent-manage]') : null;
    if (!link) return;
    event.preventDefault();
    manage();
  });

  // Synchronisation entre onglets et avec l'assistant intégré (iframe).
  window.addEventListener('storage', function (event) {
    if (event.key !== STORAGE_KEY) return;
    var choice = event.newValue === 'accepted' || event.newValue === 'refused' ? event.newValue : null;
    if (choice === storedChoice) return;
    var previous = storedChoice;
    storedChoice = choice;
    if (!choice) return;
    window.gtag('consent', 'update', consentState(choice));
    removeBanner();
    if (choice === 'accepted') applyAccepted();
    else if (previous === 'accepted') location.reload();
  });

  function onReady() {
    if (storedChoice === 'refused') deleteTrackingCookies();
    if (storedChoice === 'accepted') applyAccepted();
    else if (!storedChoice && !isFramedBySite()) installBanner();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady, { once: true });
  else onReady();
})();
