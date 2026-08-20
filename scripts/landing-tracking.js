(function () {
  'use strict';

  function track(name, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, { transport_type: 'beacon', ...(params || {}) });
    }
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href') || '';
    if (href.indexOf('wa.me/') !== -1) {
      track('contact_whatsapp', { method: 'whatsapp', page: location.pathname, source: 'landing_page' });
    }
    if (href.indexOf('tel:') === 0) {
      var number = href.slice(4).replace(/\s/g, '');
      track('contact_phone', {
        method: 'phone',
        page: location.pathname,
        phone_number: number,
        phone_destination: number === '+33385330689' ? 'atelier_fixe' : 'autre'
      });
    }
  });
})();
