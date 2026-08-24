(function () {
  'use strict';

  var STORAGE_KEY = 'solution_phone_consent_v1';
  var storedChoice = null;
  try { storedChoice = localStorage.getItem(STORAGE_KEY); } catch (error) {}

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  var granted = storedChoice === 'accepted';
  window.gtag('consent', 'default', {
    ad_storage: granted ? 'granted' : 'denied',
    analytics_storage: granted ? 'granted' : 'denied',
    ad_user_data: granted ? 'granted' : 'denied',
    ad_personalization: granted ? 'granted' : 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500
  });

  function consentState(choice) {
    var allow = choice === 'accepted';
    return {
      ad_storage: allow ? 'granted' : 'denied',
      analytics_storage: allow ? 'granted' : 'denied',
      ad_user_data: allow ? 'granted' : 'denied',
      ad_personalization: allow ? 'granted' : 'denied'
    };
  }

  function saveChoice(choice) {
    try { localStorage.setItem(STORAGE_KEY, choice); } catch (error) {}
    storedChoice = choice;
    window.gtag('consent', 'update', consentState(choice));
    var banner = document.getElementById('sp-consent');
    if (banner) banner.remove();
  }

  function normalizePhone(value) {
    var digits = String(value || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.indexOf('00') === 0) return '+' + digits.slice(2);
    if (digits.indexOf('0') === 0) return '+33' + digits.slice(1);
    return '+' + digits;
  }

  function enhancedLeadData(contact) {
    if (storedChoice !== 'accepted' || !contact) return null;
    var email = String(contact.email || '').trim().toLowerCase();
    var phone = normalizePhone(contact.phone);
    var data = {};
    if (email) data.email = email;
    if (phone) data.phone_number = phone;
    return Object.keys(data).length ? data : null;
  }

  window.SolutionPhoneConsent = {
    choice: function () { return storedChoice; },
    accept: function () { saveChoice('accepted'); },
    refuse: function () { saveChoice('refused'); },
    enhancedLeadData: enhancedLeadData
  };

  function installBanner() {
    if (storedChoice || document.getElementById('sp-consent')) return;
    var style = document.createElement('style');
    style.textContent = '#sp-consent{position:fixed;z-index:2147483646;left:12px;right:12px;bottom:76px;max-width:620px;margin:auto;padding:12px 13px;background:#111;color:#fff;border:1px solid rgba(255,255,255,.18);box-shadow:0 18px 60px rgba(0,0,0,.34);font:12px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}#sp-consent p{margin:0 0 9px}#sp-consent strong{display:inline;margin-right:4px}#sp-consent-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}#sp-consent button{min-height:38px;padding:0 9px;border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;font:700 11px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer}#sp-consent-accept{background:#e30613!important;border-color:#e30613!important}#sp-consent a{color:#fff}@media(min-width:721px){#sp-consent{bottom:16px;font-size:13px}#sp-consent button{font-size:12px}}';
    document.head.appendChild(style);
    var banner = document.createElement('section');
    banner.id = 'sp-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Choix des cookies');
    banner.innerHTML = '<p><strong>Mesure d’audience facultative.</strong>Sans accord, aucun cookie analytique ou publicitaire. <a href="politique-confidentialite.html">En savoir plus</a>.</p><div id="sp-consent-actions"><button id="sp-consent-refuse" type="button">Continuer sans mesure</button><button id="sp-consent-accept" type="button">Accepter</button></div>';
    document.body.appendChild(banner);
    banner.querySelector('#sp-consent-refuse').addEventListener('click', function () { saveChoice('refused'); });
    banner.querySelector('#sp-consent-accept').addEventListener('click', function () { saveChoice('accepted'); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installBanner, { once: true });
  else installBanner();
})();
