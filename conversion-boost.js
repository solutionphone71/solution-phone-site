/* Module de captation devis & conseil reconditionnés — Solution Phone Mâcon */
(function (root) {
  'use strict';

  var PRODUCTION_ENDPOINT = 'https://vps-8066c206.vps.ovh.net/api/public/quote-request';
  var LOCAL_ENDPOINT = '/api/lead';

  var BUDGET_LABELS = {
    u250: 'Moins de 250 €',
    '250-450': '250 à 450 €',
    o450: '450 € et +'
  };

  var SUGGESTIONS = {
    iphone: [
      {
        name: 'iPhone 13 reconditionné',
        detail: 'Contrôlé 30 points · Garantie 12 mois',
        href: '/reconditionnes.html#stock'
      },
      {
        name: 'iPhone 14 / 14 Pro reconditionné',
        detail: 'Stock réel en boutique à Mâcon',
        href: '/reconditionnes.html#stock'
      },
      {
        name: 'Reprise de votre ancien smartphone',
        detail: 'Valeur déduite immédiatement au comptoir',
        href: '/rachat-reprise-telephone-macon.html'
      }
    ],
    samsung: [
      {
        name: 'Samsung Galaxy S23 / S24 reconditionné',
        detail: 'Contrôlé 30 points · Garantie 12 mois',
        href: '/reconditionnes.html#stock'
      },
      {
        name: 'Samsung Galaxy A54 / A55 reconditionné',
        detail: 'Excellent rapport qualité-prix en boutique',
        href: '/reconditionnes.html#stock'
      },
      {
        name: 'Reprise de votre ancien smartphone',
        detail: 'Estimation en 10 min au 21 rue Gambetta',
        href: '/rachat-reprise-telephone-macon.html'
      }
    ],
    budget: [
      {
        name: 'Smartphones reconditionnés dès 169 €',
        detail: 'Testés 30 points · Garantie 12 mois',
        href: '/reconditionnes.html#stock'
      },
      {
        name: 'iPhone & Samsung en stock à Mâcon',
        detail: 'Batterie contrôlée · Transfert de données possible',
        href: '/reconditionnes.html#stock'
      },
      {
        name: 'Comparer : réparer ou remplacer ?',
        detail: 'Notre outil honnête pour décider sans payer trop cher',
        href: '/reparer-ou-remplacer-telephone-macon.html'
      }
    ]
  };

  function cleanText(value, max) {
    if (typeof value !== 'string') return '';
    var cleaned = value
      .replace(/[\u0000-\u001f\u007f]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return typeof max === 'number' ? cleaned.slice(0, max) : cleaned;
  }

  function formatBudget(code) {
    var key = String(code || '').trim();
    return BUDGET_LABELS[key] || key;
  }

  function pickSuggestions(brand, budget) {
    var b = String(brand || '').toLowerCase();
    if (b.indexOf('iphone') !== -1 || b.indexOf('apple') !== -1) {
      return SUGGESTIONS.iphone;
    }
    if (b.indexOf('samsung') !== -1 || b.indexOf('galaxy') !== -1) {
      return SUGGESTIONS.samsung;
    }
    if (budget === 'u250') {
      return SUGGESTIONS.budget;
    }
    return SUGGESTIONS.budget;
  }

  function normalizeNeed(raw) {
    var v = String(raw || '').trim();
    if (v === 'reconditionne' || v === 'reservation_24h' || v === 'alerte_arrivage') {
      return v;
    }
    return 'devis';
  }

  var NEED_TAGS = {
    reconditionne: '[Conseil reconditionné]',
    reservation_24h: '[Réservation 24h]',
    alerte_arrivage: '[Alerte arrivage]',
    devis: '[Devis réparation]'
  };

  var NEED_SUBMIT_LABELS = {
    reconditionne: 'Demander un devis / conseil',
    reservation_24h: 'Confirmer ma réservation 24h',
    alerte_arrivage: 'Activer mon alerte arrivage',
    devis: 'Demander un devis réparation'
  };

  function buildWhatsAppUrl(payload) {
    var need = normalizeNeed(payload && payload.besoin);
    var parts = ['Bonjour Solution Phone,'];
    if (need === 'reservation_24h') {
      parts.push('je souhaite réserver ce smartphone 24h en boutique');
    } else if (need === 'alerte_arrivage') {
      parts.push('je souhaite être prévenu du prochain arrivage');
    } else if (need === 'reconditionne') {
      parts.push('je souhaite des conseils pour acheter un smartphone reconditionné');
    } else {
      parts.push('je souhaite un devis de réparation');
    }
    if (payload && payload.modele) {
      parts.push('(' + payload.modele + ')');
    }
    var budgetLabel = formatBudget(payload && payload.budget);
    if (budgetLabel) {
      parts.push('— budget : ' + budgetLabel);
    }
    if (payload && payload.details) {
      parts.push('— précisions : ' + payload.details);
    }
    return 'https://wa.me/33783921884?text=' + encodeURIComponent(parts.join(' '));
  }

  function makeToken() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 3) | 8).toString(16);
    });
  }

  function resolveEndpoint(form, loc) {
    var custom = form && form.getAttribute && form.getAttribute('data-sp-endpoint');
    if (custom) return custom;
    var hostname = loc && loc.hostname ? String(loc.hostname) : '';
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return LOCAL_ENDPOINT;
    }
    return PRODUCTION_ENDPOINT;
  }

  function buildQuoteRequestBody(payload, pagePath, isLocalEndpoint) {
    if (isLocalEndpoint) {
      return payload;
    }
    var besoin = normalizeNeed(payload && payload.besoin);
    var pieces = [NEED_TAGS[besoin] || '[Devis réparation]'];
    var modele = cleanText(payload && payload.modele, 80);
    if (modele) pieces.push('Modèle : ' + modele);
    var budgetLabel = formatBudget(payload && payload.budget);
    if (budgetLabel) pieces.push('Budget : ' + budgetLabel);
    var details = cleanText(payload && payload.details, 1500);
    if (details) pieces.push('Précisions : ' + details);
    var requestText = cleanText(pieces.join(' · '), 1800);
    if (requestText.length < 10) {
      requestText += ' — demande depuis solution-phone.fr';
    }
    return {
      name: cleanText(payload && payload.prenom, 120),
      email: cleanText(payload && payload.email, 254).toLowerCase(),
      phone: cleanText((payload && (payload.telephone || payload.phone)) || '', 40),
      request: requestText.slice(0, 1800),
      form_type: 'main_quote',
      page: cleanText(pagePath, 240) || '/',
      client_token: makeToken(),
      website: ''
    };
  }

  var ALLOWED_ANALYTICS_KEYS = [
    'cta_type',
    'cta_location',
    'page_path',
    'sp_need',
    'form_status',
    'trade_brand',
    'trade_condition'
  ];

  function sanitizePath(rawPath) {
    if (typeof rawPath !== 'string') return '/';
    var noQuery = rawPath.split('?')[0].split('#')[0];
    var cleaned = cleanText(noQuery, 200);
    if (!cleaned) return '/';
    return cleaned.charAt(0) === '/' ? cleaned : '/' + cleaned;
  }

  function looksLikePii(value) {
    if (typeof value !== 'string' || !value) return false;
    if (value.indexOf('@') !== -1) return true;
    var digits = value.replace(/\D/g, '');
    if (digits.length >= 8) return true;
    return false;
  }

  function sanitizeAnalyticsParams(raw, pagePath) {
    var safe = {};
    var src = raw && typeof raw === 'object' ? raw : {};
    for (var i = 0; i < ALLOWED_ANALYTICS_KEYS.length; i++) {
      var key = ALLOWED_ANALYTICS_KEYS[i];
      if (!Object.prototype.hasOwnProperty.call(src, key)) continue;
      var val = src[key];
      if (val === undefined || val === null) continue;
      var str = key === 'page_path' ? sanitizePath(String(val)) : cleanText(String(val), 80);
      if (!str || looksLikePii(str)) continue;
      safe[key] = str;
    }
    if (!safe.page_path) {
      safe.page_path = sanitizePath(pagePath || '/');
    }
    return safe;
  }

  function hasAnalyticsConsent(win) {
    try {
      if (!win || !win.SolutionPhoneConsent) return true;
      if (typeof win.SolutionPhoneConsent.accepted === 'function') {
        return !!win.SolutionPhoneConsent.accepted();
      }
      if (typeof win.SolutionPhoneConsent.choice === 'function') {
        return win.SolutionPhoneConsent.choice() === 'accepted';
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  function trackEvent(eventName, params, targetWin) {
    var win = targetWin || (typeof window !== 'undefined' ? window : null);
    var cleanEvent = cleanText(String(eventName || ''), 64);
    if (!win || !cleanEvent || !hasAnalyticsConsent(win)) return false;

    var locPath = win.location && win.location.pathname ? String(win.location.pathname) : '/';
    var safeParams = sanitizeAnalyticsParams(params, locPath);
    var dispatched = false;

    if (typeof win.gtag === 'function') {
      try {
        var gtagParams = { transport_type: 'beacon' };
        for (var gk in safeParams) {
          if (Object.prototype.hasOwnProperty.call(safeParams, gk)) {
            gtagParams[gk] = safeParams[gk];
          }
        }
        win.gtag('event', cleanEvent, gtagParams);
        dispatched = true;
      } catch (e) {}
    }

    if (!dispatched) {
      try {
        if (Array.isArray(win.dataLayer)) {
          var dlEntry = { event: cleanEvent };
          for (var k in safeParams) {
            if (Object.prototype.hasOwnProperty.call(safeParams, k)) {
              dlEntry[k] = safeParams[k];
            }
          }
          win.dataLayer.push(dlEntry);
          dispatched = true;
        }
      } catch (e) {}
    }

    return dispatched;
  }

  function inferCtaLocation(el) {
    if (!el) return 'page';
    if (typeof el.getAttribute === 'function') {
      var direct = cleanText(el.getAttribute('data-sp-cta-location') || '', 60);
      if (direct) return direct;
    }
    if (typeof el.closest === 'function') {
      var locHost = el.closest('[data-sp-cta-location]');
      if (locHost && typeof locHost.getAttribute === 'function') {
        var inherited = cleanText(locHost.getAttribute('data-sp-cta-location') || '', 60);
        if (inherited) return inherited;
      }
      if (el.closest('[data-sp-lead-confirm]')) return 'lead_confirm';
      if (el.closest('[data-sp-lead-widget]')) return 'lead_widget';
      if (el.closest('.sp-boost-band')) return 'boost_band';
      if (el.closest('.sp-boost-strip')) return 'boost_strip';
      if (el.closest('.sp-mail-recond-upsell')) return 'mail_upsell';
      if (el.closest('header, nav')) return 'header';
      if (el.closest('footer, #mc-footer')) return 'footer';
    }
    return 'page';
  }

  function classifyCta(el) {
    if (!el || typeof el.getAttribute !== 'function') return null;
    var explicitType = cleanText(el.getAttribute('data-sp-track') || '', 40).toLowerCase();
    var href = String(el.getAttribute('href') || '').trim();
    var ctaType = explicitType;

    if (!ctaType && href) {
      var low = href.toLowerCase();
      if (low.indexOf('wa.me/') !== -1) {
        ctaType = 'whatsapp';
      } else if (low.indexOf('tel:') === 0) {
        ctaType = 'appel';
      } else if (low.indexOf('reconditionnes.html') !== -1) {
        ctaType = 'reconditionnes';
      } else if (low.indexOf('rachat-reprise-telephone-macon.html') !== -1) {
        ctaType = 'reprise';
      } else if (
        low.indexOf('forms/lead.html') !== -1 ||
        low.indexOf('#devis') !== -1 ||
        low.indexOf('#demande-conseil') !== -1 ||
        low.indexOf('#mail-form') !== -1 ||
        low.indexOf('#tarifs') !== -1
      ) {
        ctaType = 'devis';
      }
    }

    if (!ctaType) return null;
    return {
      cta_type: ctaType,
      cta_location: inferCtaLocation(el)
    };
  }

  function initCtaTracking(targetDoc, targetWin) {
    var doc = targetDoc || (typeof document !== 'undefined' ? document : null);
    var win = targetWin || (typeof window !== 'undefined' ? window : null);
    if (!doc || typeof doc.addEventListener !== 'function') return;
    if (doc.__spCtaTrackBound) return;
    doc.__spCtaTrackBound = true;

    doc.addEventListener('click', function (event) {
      try {
        var rawTarget = event && event.target;
        var target = rawTarget && rawTarget.nodeType === 3 ? rawTarget.parentElement : rawTarget;
        if (!target || typeof target.closest !== 'function') return;
        var el = target.closest('[data-sp-track], a[href]');
        if (!el) return;
        var info = classifyCta(el);
        if (!info) return;
        trackEvent('sp_cta_click', info, win);
      } catch (e) {}
    });
  }

  function renderSuggestions(sugEl, list) {
    if (!sugEl) return;
    sugEl.innerHTML = '';
    list.forEach(function (item) {
      var a = document.createElement('a');
      a.className = 'sp-lead-sug-item';
      a.href = item.href;
      if (typeof a.setAttribute === 'function') {
        var sugType = String(item.href || '').indexOf('rachat-reprise') !== -1 ? 'reprise' : 'reconditionnes';
        a.setAttribute('data-sp-track', sugType);
        a.setAttribute('data-sp-cta-location', 'lead_suggestions');
      }

      var strong = document.createElement('strong');
      strong.textContent = item.name;
      var span = document.createElement('span');
      span.textContent = item.detail;
      var em = document.createElement('em');
      em.textContent = 'Découvrir →';

      a.appendChild(strong);
      a.appendChild(span);
      a.appendChild(em);
      sugEl.appendChild(a);
    });
  }

  function syncDynamicCta(form, submitBtn, defaultBtnLabel) {
    if (!form || !submitBtn) return;
    if (!form.getAttribute || form.getAttribute('data-sp-dynamic-cta') !== '1') return;
    var besoinEl = form.querySelector ? form.querySelector('select[name="besoin"]') : null;
    if (!besoinEl || besoinEl === submitBtn) return;
    var need = normalizeNeed(besoinEl.value);
    submitBtn.textContent = NEED_SUBMIT_LABELS[need] || defaultBtnLabel;
  }

  function stripTradeClauses(text) {
    var parts = String(text || '').split(/\s+·\s+/);
    var kept = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i].trim();
      if (!p) continue;
      if (/^(?:reprise\s+à\s+estimer\s*:|reprise\s+de\s+mon\s+ancien\s+téléphone\b|je souhaite faire estimer la reprise\b)/i.test(p)) {
        var suffixMatch = p.match(/\s+—\s+(Je souhaite passer.*)$/);
        if (suffixMatch && suffixMatch[1]) {
          kept.push(suffixMatch[1].trim());
        }
        continue;
      }
      kept.push(p);
    }
    return cleanText(kept.join(' · '), 500);
  }

  function prefillLeadForm(options, targetDoc) {
    var doc = targetDoc || (typeof document !== 'undefined' ? document : null);
    if (!doc) return false;
    var opts = options && typeof options === 'object' ? options : {};
    var section =
      (opts.sectionId && doc.getElementById && doc.getElementById(opts.sectionId)) ||
      (doc.getElementById && doc.getElementById('demande-conseil')) ||
      (doc.querySelector && doc.querySelector('[data-sp-lead-widget]'));
    var form =
      (section && section.querySelector && section.querySelector('form[data-sp-lead-form]')) ||
      (doc.querySelector && doc.querySelector('form[data-sp-lead-form]'));
    if (!form) return false;

    var besoinEl = form.querySelector && form.querySelector('select[name="besoin"]');
    var budgetEl = form.querySelector && form.querySelector('select[name="budget"]');
    var modeleEl = form.querySelector && form.querySelector('input[name="modele"]');
    var detailsEl = form.querySelector && form.querySelector('textarea[name="details"]');
    var prenomEl = form.querySelector && form.querySelector('input[name="prenom"]');
    var submitBtn = form.querySelector && form.querySelector('button[type="submit"]');

    if (besoinEl && opts.besoin) {
      var currentNeed = String(besoinEl.value || '').trim();
      var keepCurrent =
        opts.preserveNeed &&
        (currentNeed === 'reservation_24h' || currentNeed === 'alerte_arrivage');
      if (!keepCurrent) {
        besoinEl.value = normalizeNeed(opts.besoin);
      }
      syncDynamicCta(form, submitBtn, submitBtn ? submitBtn.textContent : 'Envoyer');
    }
    if (budgetEl && opts.budget) {
      budgetEl.value = String(opts.budget);
    }
    if (modeleEl && typeof opts.modele === 'string') {
      modeleEl.value = cleanText(opts.modele, 80);
    }
    if (detailsEl && typeof opts.details === 'string') {
      var incoming = cleanText(opts.details, 500);
      if (opts.replaceTradeDetails && detailsEl.value && detailsEl.value.trim()) {
        var baseDetails = stripTradeClauses(detailsEl.value);
        detailsEl.value = baseDetails
          ? (incoming ? cleanText(baseDetails + ' · ' + incoming, 500) : baseDetails)
          : incoming;
      } else if (opts.appendDetails && detailsEl.value && detailsEl.value.trim()) {
        var existing = cleanText(detailsEl.value, 500);
        if (incoming && existing.indexOf(incoming) === -1) {
          detailsEl.value = cleanText(existing + ' · ' + incoming, 500);
        }
      } else if (incoming) {
        detailsEl.value = incoming;
      }
    }

    var ctxEl = (section && section.querySelector && section.querySelector('[data-sp-lead-context]')) ||
      (doc.getElementById && doc.getElementById('rcLeadContext'));
    if (ctxEl && opts.contextMessage) {
      ctxEl.textContent = cleanText(opts.contextMessage, 240);
      ctxEl.hidden = false;
    }

    var confirmEl = section && section.querySelector && section.querySelector('[data-sp-lead-confirm]');
    if (confirmEl) confirmEl.hidden = true;

    if (opts.scroll !== false && section && typeof section.scrollIntoView === 'function') {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (opts.focus !== false) {
      var focusTarget = (!modeleEl || (modeleEl.value && modeleEl.value.trim())) ? prenomEl : modeleEl;
      if (focusTarget && typeof focusTarget.focus === 'function') {
        try {
          focusTarget.focus({ preventScroll: true });
        } catch (e) {
          focusTarget.focus();
        }
      }
    }
    return true;
  }

  function initForm(form) {
    if (!form || form.dataset.spBoostBound === '1') return;
    form.dataset.spBoostBound = '1';

    var container = form.closest('[data-sp-lead-widget]') || form.parentElement;
    var errorEl = container ? container.querySelector('[data-sp-lead-error]') : null;
    var confirmEl = container ? container.querySelector('[data-sp-lead-confirm]') : null;
    var confirmTitleEl = confirmEl ? confirmEl.querySelector('h2, h3') : null;
    var summaryEl = container ? container.querySelector('[data-sp-lead-summary]') : null;
    var sugEl = container ? container.querySelector('[data-sp-lead-suggestions]') : null;
    var waEl = container ? container.querySelector('[data-sp-lead-wa]') : null;
    var submitBtn = form.querySelector('button[type="submit"]');
    var defaultBtnLabel = submitBtn ? submitBtn.textContent : 'Envoyer';

    var besoinEl = form.querySelector ? form.querySelector('select[name="besoin"]') : null;
    if (besoinEl && besoinEl !== submitBtn && typeof besoinEl.addEventListener === 'function') {
      besoinEl.addEventListener('change', function () {
        syncDynamicCta(form, submitBtn, defaultBtnLabel);
      });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (submitBtn && submitBtn.disabled) return;

      if (errorEl) {
        errorEl.textContent = '';
        errorEl.hidden = true;
      }

      var data = new FormData(form);
      // Champ pot de miel anti-spam
      if (String(data.get('website') || '').trim()) {
        return;
      }

      var besoin = String(data.get('besoin') || 'devis').trim();
      var modele = cleanText(String(data.get('modele') || ''), 80);
      var budget = String(data.get('budget') || '').trim();
      var details = cleanText(String(data.get('details') || ''), 1500);
      var prenom = cleanText(String(data.get('prenom') || ''), 120);
      var email = cleanText(String(data.get('email') || ''), 254).toLowerCase();
      var telephone = cleanText(String(data.get('telephone') || ''), 40);
      var consent = data.get('consent');

      if (!prenom || !email || !consent) {
        if (errorEl) {
          errorEl.textContent = 'Merci de renseigner votre prénom, votre e-mail et de cocher la case de consentement.';
          errorEl.hidden = false;
        }
        return;
      }

      if (prenom.length < 2) {
        if (errorEl) {
          errorEl.textContent = 'Merci d’indiquer votre prénom (au moins 2 caractères).';
          errorEl.hidden = false;
        }
        return;
      }

      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length >= 5 && email.length <= 254;
      if (!emailOk) {
        if (errorEl) {
          errorEl.textContent = 'Merci de saisir une adresse e-mail valide.';
          errorEl.hidden = false;
        }
        return;
      }

      var payload = {
        besoin: besoin,
        modele: modele,
        budget: budget,
        details: details,
        prenom: prenom,
        email: email,
        telephone: telephone,
        consent: true
      };

      var loc = (typeof window !== 'undefined' && window.location) || (typeof location !== 'undefined' ? location : null);
      var endpoint = resolveEndpoint(form, loc);
      var isLocal = endpoint === LOCAL_ENDPOINT || /\/api\/lead(?:[?#]|$)/.test(String(endpoint || ''));
      var body = buildQuoteRequestBody(
        payload,
        (loc && loc.pathname) || '/',
        isLocal
      );

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours…';
      }

      var showResult = function (sentOk, reference) {
        if (confirmTitleEl) {
          confirmTitleEl.textContent = sentOk
            ? 'Demande enregistrée'
            : 'Finalisez votre demande en 1 clic sur WhatsApp';
        }
        if (summaryEl) {
          if (sentOk) {
            summaryEl.textContent =
              'Merci ' +
              prenom +
              ', votre demande a bien été transmise à l’équipe Solution Phone à Mâcon' +
              (reference ? ' (référence ' + reference + ')' : '') +
              '. Vous pouvez aussi consulter nos suggestions reconditionnés ou écrire directement sur WhatsApp.';
          } else {
            summaryEl.textContent =
              'L’envoi automatique n’a pas abouti pour le moment. Envoyez votre récapitulatif prérempli sur WhatsApp ci-dessous ou appelez le 03 85 33 06 89 pour une réponse immédiate.';
          }
        }

        renderSuggestions(sugEl, pickSuggestions(modele, budget));
        if (waEl) {
          waEl.href = buildWhatsAppUrl(payload);
        }
        if (confirmEl) {
          confirmEl.hidden = false;
          if (typeof confirmEl.scrollIntoView === 'function') {
            confirmEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      };

      var canFetch =
        typeof window !== 'undefined' &&
        typeof window.fetch === 'function' &&
        loc &&
        String(loc.protocol || '').indexOf('http') === 0;

      if (canFetch) {
        window
          .fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          })
          .then(function (response) {
            return response
              .json()
              .catch(function () {
                return {};
              })
              .then(function (resPayload) {
                if (!response.ok || !(resPayload.received || resPayload.status === 'ok')) {
                  throw new Error(resPayload.error || 'Envoi impossible');
                }
                return resPayload;
              });
          })
          .then(function (resPayload) {
            try {
              form.reset();
            } catch (e) {}
            var ctxBanner = container && container.querySelector && container.querySelector('[data-sp-lead-context]');
            if (ctxBanner) ctxBanner.hidden = true;
            var formLoc =
              (form.getAttribute && cleanText(form.getAttribute('data-sp-cta-location') || '', 60)) ||
              'lead_form';
            trackEvent('sp_lead_submitted', {
              sp_need: normalizeNeed(besoin),
              cta_type: 'formulaire',
              cta_location: formLoc,
              form_status: 'ok'
            });
            showResult(true, resPayload && resPayload.reference ? String(resPayload.reference) : '');
          })
          .catch(function () {
            var formLoc =
              (form.getAttribute && cleanText(form.getAttribute('data-sp-cta-location') || '', 60)) ||
              'lead_form';
            trackEvent('sp_lead_fallback', {
              sp_need: normalizeNeed(besoin),
              cta_type: 'formulaire',
              cta_location: formLoc,
              form_status: 'fallback'
            });
            showResult(false, '');
          })
          .finally(function () {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = defaultBtnLabel;
              syncDynamicCta(form, submitBtn, defaultBtnLabel);
            }
          });
      } else {
        showResult(false, '');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = defaultBtnLabel;
          syncDynamicCta(form, submitBtn, defaultBtnLabel);
        }
      }
    });
  }

  function boot() {
    if (typeof document === 'undefined') return;
    var forms = document.querySelectorAll('form[data-sp-lead-form]');
    for (var i = 0; i < forms.length; i++) {
      initForm(forms[i]);
    }
    initCtaTracking(document, root);
  }

  var api = {
    PRODUCTION_ENDPOINT: PRODUCTION_ENDPOINT,
    LOCAL_ENDPOINT: LOCAL_ENDPOINT,
    cleanText: cleanText,
    formatBudget: formatBudget,
    normalizeNeed: normalizeNeed,
    pickSuggestions: pickSuggestions,
    buildWhatsAppUrl: buildWhatsAppUrl,
    resolveEndpoint: resolveEndpoint,
    buildQuoteRequestBody: buildQuoteRequestBody,
    sanitizePath: sanitizePath,
    sanitizeAnalyticsParams: sanitizeAnalyticsParams,
    trackEvent: trackEvent,
    classifyCta: classifyCta,
    initCtaTracking: initCtaTracking,
    prefillLeadForm: prefillLeadForm,
    initForm: initForm
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (root) {
    root.SolutionPhoneBoost = api;
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }
})(typeof window !== 'undefined' ? window : null);
