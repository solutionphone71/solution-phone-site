// Tests automatisés (Bun / Jest + Supertest) : serveur, sécurité, SEO & conversion
const request = require('supertest');
const app = require('../faq_fallback_server');
const boost = require('../conversion-boost');
const recond = require('../reconditionnes-v2');
const { toUrlPath, loadExclusions } = require('../scripts/generate_sitemap');
const { mergeFaqQuestions } = require('../scripts/seo_update');
const { validateQuotePayload } = require('../supabase/functions/quote-request/validation.ts');

describe('GET /faq-fallback', () => {
  test('returns 400 when question is missing', async () => {
    const response = await request(app).get('/faq-fallback');
    expect(response.statusCode).toBe(400);
    expect(response.body.status).toBe('error');
  });

  test('returns JSON response for an unknown question', async () => {
    const response = await request(app)
      .get('/faq-fallback')
      .query({ question: 'Question inexistante test' });
    expect(response.statusCode).toBe(200);
    expect(['known', 'sent', 'error']).toContain(response.body.status);
  });
});

describe('POST /api/lead', () => {
  test('returns 400 when required fields are missing', async () => {
    const response = await request(app).post('/api/lead').send({ prenom: 'Test' });
    expect(response.statusCode).toBe(400);
  });

  test('returns 400 when email format is invalid or TLD is too short', async () => {
    for (const badEmail of ['pas-un-email', 'a@b.c']) {
      const response = await request(app)
        .post('/api/lead')
        .send({ prenom: 'Alex', email: badEmail, consent: true });
      expect(response.statusCode).toBe(400);
    }
  });

  test('returns 400 when prenom is shorter than 2 chars or honeypot is filled', async () => {
    const shortName = await request(app)
      .post('/api/lead')
      .send({ prenom: 'A', email: 'alex@example.com', consent: true });
    expect(shortName.statusCode).toBe(400);

    const bot = await request(app)
      .post('/api/lead')
      .send({ prenom: 'Alex', email: 'alex@example.com', consent: true, website: 'http://spam.example' });
    expect(bot.statusCode).toBe(400);
  });

  test('returns 200 with received=true and refurbished suggestions on valid lead', async () => {
    const response = await request(app).post('/api/lead').send({
      prenom: 'Alex',
      email: 'alex@example.com',
      consent: true,
      besoin: 'devis',
      modele: 'iPhone 13'
    });
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.received).toBe(true);
    expect(Array.isArray(response.body.suggestions)).toBe(true);
    expect(response.body.suggestions.length).toBeGreaterThan(0);
  });
});

describe('Sécurité statique & échappement HTML (faq_fallback_server.js)', () => {
  test('blocks internal files and directories', async () => {
    for (const blocked of ['/AGENTS.md', '/data/custom_faq.json', '/package.json', '/scripts/faq_fallback.py', '/faq_fallback_server.js']) {
      const res = await request(app).get(blocked);
      expect(res.statusCode).toBe(404);
    }
  });

  test('serves public site assets and consent script', async () => {
    const htmlRes = await request(app).get('/reconditionnes.html');
    expect(htmlRes.statusCode).toBe(200);
    const consentRes = await request(app).get('/scripts/consent-tracking.js');
    expect(consentRes.statusCode).toBe(200);
  });

  test('returns 400 on malformed percent-encoded URL instead of crashing with 500', async () => {
    const res = await request(app).get('/%E0%A4%A');
    expect(res.statusCode).toBe(400);
  });

  test('escapes HTML injection payloads', () => {
    expect(app.escapeHtml('<script>alert("x")</script>')).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  });
});

describe('Logique conversion-boost.js', () => {
  test('formats budget codes into readable French labels', () => {
    expect(boost.formatBudget('u250')).toBe('Moins de 250 €');
    expect(boost.formatBudget('250-450')).toBe('250 à 450 €');
    expect(boost.formatBudget('o450')).toBe('450 € et +');
  });

  test('builds compliant WhatsApp URL without raw budget codes or "urgente"', () => {
    const url = boost.buildWhatsAppUrl({
      besoin: 'reconditionne',
      modele: 'iPhone 13',
      budget: 'u250',
      details: '128 Go'
    });
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain('Bonjour Solution Phone,');
    expect(decoded).toContain('Moins de 250 €');
    expect(decoded).not.toContain('u250');
    expect(decoded.toLowerCase()).not.toContain('urgente');
  });

  test('resolves production quote-request endpoint on solution-phone.fr and /api/lead on localhost', () => {
    expect(boost.resolveEndpoint(null, { hostname: 'solution-phone.fr' })).toBe(boost.PRODUCTION_ENDPOINT);
    expect(boost.resolveEndpoint(null, { hostname: 'localhost' })).toBe('/api/lead');
  });

  test('builds valid production quote-request payload accepted by Supabase validation.ts (reconditionne & devis)', () => {
    const recondBody = boost.buildQuoteRequestBody(
      { besoin: 'reconditionne', modele: 'Samsung S23', budget: '250-450', details: 'Reprise', prenom: 'Alex', email: 'Alex@Example.com' },
      '/reconditionnes.html',
      false
    );
    expect(recondBody.name).toBe('Alex');
    expect(recondBody.email).toBe('alex@example.com');
    expect(recondBody.form_type).toBe('main_quote');
    expect(recondBody.request).toContain('[Conseil reconditionné]');
    expect(recondBody.request).toContain('Samsung S23');
    expect(recondBody.request).toContain('250 à 450 €');
    expect(recondBody.website).toBe('');
    expect(typeof recondBody.client_token).toBe('string');
    const recondValidation = validateQuotePayload(recondBody);
    expect(recondValidation.error).toBeUndefined();
    expect(recondValidation.data.form_type).toBe('main_quote');

    const devisBody = boost.buildQuoteRequestBody(
      { besoin: 'devis', modele: 'iPhone 13', budget: '', details: 'Écran fissuré', prenom: 'Marie', email: 'marie@example.fr', telephone: '06 12 34 56 78' },
      '/reparation-iphone.html',
      false
    );
    expect(devisBody.form_type).toBe('main_quote');
    expect(devisBody.request).toContain('[Devis réparation]');
    expect(devisBody.phone).toBe('06 12 34 56 78');
    const devisValidation = validateQuotePayload(devisBody);
    expect(devisValidation.error).toBeUndefined();
    expect(devisValidation.data.phone).toBe('06 12 34 56 78');
  });

  test('handles edge cases (minimal fields, long inputs, control chars) and stays valid for validation.ts', () => {
    const minimalBody = boost.buildQuoteRequestBody(
      { besoin: 'reconditionne', modele: '', budget: '', details: '', prenom: 'Al', email: 'al@example.fr' },
      '',
      false
    );
    const minimalValidation = validateQuotePayload(minimalBody);
    expect(minimalValidation.error).toBeUndefined();
    expect(minimalValidation.data.page).toBe('/');
    expect(minimalValidation.data.request.length).toBeGreaterThanOrEqual(10);

    const longBody = boost.buildQuoteRequestBody(
      {
        besoin: 'devis',
        modele: 'iPhone\n15\tPro',
        budget: 'o450',
        details: 'A'.repeat(2500),
        prenom: 'Jean-Baptiste ' + 'X'.repeat(200),
        email: '  TEST@EXAMPLE.FR  ',
        telephone: '06 00 00 00 00 ' + '9'.repeat(50)
      },
      '/' + 'p'.repeat(300),
      false
    );
    expect(longBody.name.length).toBeLessThanOrEqual(120);
    expect(longBody.request.length).toBeLessThanOrEqual(1800);
    expect(longBody.page.length).toBeLessThanOrEqual(240);
    expect(longBody.phone.length).toBeLessThanOrEqual(40);
    const longValidation = validateQuotePayload(longBody);
    expect(longValidation.error).toBeUndefined();
  });

  test('picks brand-appropriate refurbished suggestions', () => {
    expect(boost.pickSuggestions('Samsung S23', '250-450')[0].name).toContain('Samsung');
    expect(boost.pickSuggestions('iPhone 14', 'o450')[0].name).toContain('iPhone');
    expect(boost.pickSuggestions('', 'u250')[0].name).toContain('169 €');
  });

  test('initForm() DOM handler validates inputs, isolates analytics errors, and posts valid production payloads', async () => {
    const fs = require('fs');
    const path = require('path');
    const vm = require('vm');
    const source = fs.readFileSync(path.join(__dirname, '..', 'conversion-boost.js'), 'utf8');

    async function runSubmit(fields, opts = {}) {
      let submitHandler = null;
      let fetchCalls = [];
      let resetCount = 0;
      const confirmTitleEl = { textContent: '' };
      const summaryEl = { textContent: '' };
      const errorEl = { textContent: '', hidden: true };
      const confirmEl = { hidden: true, querySelector: () => confirmTitleEl };
      const sugEl = { innerHTML: '', children: [], appendChild(el) { this.children.push(el); } };
      const waEl = { href: '' };
      const submitBtn = { disabled: false, textContent: 'Demander un devis' };
      const container = {
        querySelector(sel) {
          if (sel === '[data-sp-lead-error]') return errorEl;
          if (sel === '[data-sp-lead-confirm]') return confirmEl;
          if (sel === '[data-sp-lead-summary]') return summaryEl;
          if (sel === '[data-sp-lead-suggestions]') return sugEl;
          if (sel === '[data-sp-lead-wa]') return waEl;
          return null;
        }
      };
      const form = {
        dataset: {},
        parentElement: container,
        closest: () => container,
        querySelector: () => submitBtn,
        getAttribute: () => opts.customEndpoint || null,
        reset() { resetCount++; },
        addEventListener(ev, fn) { if (ev === 'submit') submitHandler = fn; }
      };
      const dataLayer = [];
      if (opts.throwOnTrack) {
        dataLayer.push = () => { throw new Error('GTM blocked'); };
      }
      const win = {
        dataLayer,
        location: opts.location || { hostname: 'solution-phone.fr', pathname: '/reconditionnes.html', protocol: 'https:' },
        fetch: async (url, init) => {
          fetchCalls.push({ url, body: JSON.parse(init.body) });
          const status = opts.httpStatus || 200;
          return {
            ok: status >= 200 && status < 300,
            status,
            json: async () => (status >= 200 && status < 300
              ? { received: true, reference: 'DV-20261126-TEST01' }
              : { error: 'Erreur ' + status })
          };
        }
      };
      const ctx = {
        window: win,
        document: {
          readyState: 'complete',
          querySelectorAll: () => [form],
          createElement: () => ({ appendChild() {}, className: '', href: '', textContent: '' })
        },
        FormData: class { get(k) { return Object.prototype.hasOwnProperty.call(fields, k) ? fields[k] : null; } },
        crypto: globalThis.crypto,
        console
      };
      vm.runInNewContext(source, ctx);
      submitHandler({ preventDefault() {} });
      await new Promise((r) => setTimeout(r, 15));
      return { fetchCalls, resetCount, errorEl, confirmEl, confirmTitleEl, summaryEl, submitBtn, waEl, dataLayer };
    }

    // 1. Valid refurbished lead (no bare global location, only window.location)
    const ok = await runSubmit({
      besoin: 'reconditionne', modele: 'iPhone 13', budget: '250-450', details: '128 Go',
      prenom: 'Alex', email: 'Alex@Example.fr', consent: 'on', website: ''
    });
    expect(ok.fetchCalls.length).toBe(1);
    expect(ok.fetchCalls[0].url).toBe(boost.PRODUCTION_ENDPOINT);
    expect(validateQuotePayload(ok.fetchCalls[0].body).error).toBeUndefined();
    expect(ok.fetchCalls[0].body.form_type).toBe('main_quote');
    expect(ok.confirmEl.hidden).toBe(false);
    expect(ok.confirmTitleEl.textContent).toBe('Demande enregistrée');
    expect(ok.summaryEl.textContent).toContain('DV-20261126-TEST01');
    expect(ok.resetCount).toBe(1);
    expect(ok.submitBtn.disabled).toBe(false);
    expect(ok.dataLayer.length).toBe(1);
    expect(ok.dataLayer[0].event).toBe('sp_lead_submitted');
    expect(ok.dataLayer[0].sp_need).toBe('reconditionne');
    expect(ok.dataLayer[0].cta_type).toBe('formulaire');
    expect(JSON.stringify(ok.dataLayer[0])).not.toContain('Alex');
    expect(JSON.stringify(ok.dataLayer[0])).not.toContain('@');

    // 2. Client-side validation: 1-char prenom & 1-char TLD email
    const shortName = await runSubmit({ prenom: 'A', email: 'alex@example.fr', consent: 'on', website: '' });
    expect(shortName.fetchCalls.length).toBe(0);
    expect(shortName.errorEl.hidden).toBe(false);

    const shortTld = await runSubmit({ prenom: 'Alex', email: 'a@b.c', consent: 'on', website: '' });
    expect(shortTld.fetchCalls.length).toBe(0);
    expect(shortTld.errorEl.hidden).toBe(false);

    // 3. Honeypot short-circuit
    const bot = await runSubmit({ prenom: 'Alex', email: 'alex@example.fr', consent: 'on', website: 'http://bot' });
    expect(bot.fetchCalls.length).toBe(0);
    expect(bot.errorEl.hidden).toBe(true);
    expect(bot.confirmEl.hidden).toBe(true);

    // 4. Analytics exception after HTTP 200 must NOT turn confirmation into failure UI
    const trackErr = await runSubmit(
      { besoin: 'reconditionne', prenom: 'Alex', email: 'alex@example.fr', consent: 'on', website: '' },
      { throwOnTrack: true }
    );
    expect(trackErr.fetchCalls.length).toBe(1);
    expect(trackErr.confirmTitleEl.textContent).toBe('Demande enregistrée');
    expect(trackErr.summaryEl.textContent).toContain('DV-20261126-TEST01');
    expect(trackErr.submitBtn.disabled).toBe(false);

    // 5. Server 429 / 500 -> WhatsApp fallback, form not reset, button restored
    for (const status of [400, 429, 500]) {
      const fail = await runSubmit(
        { besoin: 'devis', modele: 'Samsung S23', prenom: 'Alex', email: 'alex@example.fr', consent: 'on', website: '' },
        { httpStatus: status }
      );
      expect(fail.fetchCalls.length).toBe(1);
      expect(fail.confirmEl.hidden).toBe(false);
      expect(fail.confirmTitleEl.textContent).toContain('WhatsApp');
      expect(fail.resetCount).toBe(0);
      expect(fail.submitBtn.disabled).toBe(false);
    }
  });

  test('trackEvent() prefers gtag with beacon (no double-push), strips PII, enforces opt-in consent, and isolates errors', () => {
    const dl = [];
    const gtagCalls = [];
    const win = {
      location: { pathname: '/reconditionnes.html?email=client@test.fr#stock' },
      dataLayer: dl,
      gtag: (cmd, name, params) => gtagCalls.push({ cmd, name, params }),
      SolutionPhoneConsent: { choice: () => 'accepted', accepted: () => true }
    };

    const ok = boost.trackEvent(
      'sp_cta_click',
      {
        cta_type: 'reconditionnes',
        cta_location: 'home_recond_band',
        email: 'client@example.fr',
        prenom: 'Jean',
        telephone: '0612345678',
        imei: '356938035643809'
      },
      win
    );
    expect(ok).toBe(true);
    // Must dispatch once via gtag (beacon) without double-pushing into dataLayer
    expect(dl.length).toBe(0);
    expect(gtagCalls.length).toBe(1);
    expect(gtagCalls[0].cmd).toBe('event');
    expect(gtagCalls[0].name).toBe('sp_cta_click');
    expect(gtagCalls[0].params).toEqual({
      transport_type: 'beacon',
      cta_type: 'reconditionnes',
      cta_location: 'home_recond_band',
      page_path: '/reconditionnes.html'
    });
    expect(JSON.stringify(gtagCalls[0].params)).not.toContain('client@');
    expect(JSON.stringify(gtagCalls[0].params)).not.toContain('0612345678');
    expect(JSON.stringify(gtagCalls[0].params)).not.toContain('356938035643809');

    // Falls back to dataLayer.push when gtag is absent or throws
    const fallbackDl = [];
    const okFallback = boost.trackEvent(
      'sp_cta_click',
      { cta_type: 'devis', cta_location: 'hero' },
      {
        location: { pathname: '/' },
        dataLayer: fallbackDl,
        gtag: () => { throw new Error('gtag blocked'); },
        SolutionPhoneConsent: { choice: () => 'accepted', accepted: () => true }
      }
    );
    expect(okFallback).toBe(true);
    expect(fallbackDl).toEqual([
      { event: 'sp_cta_click', cta_type: 'devis', cta_location: 'hero', page_path: '/' }
    ]);

    // Values that look like PII inside an allowed key are dropped
    const sanitized = boost.sanitizeAnalyticsParams({
      cta_type: 'client@example.fr',
      cta_location: '06 12 34 56 78',
      sp_need: 'devis'
    }, '/index.html');
    expect(sanitized.cta_type).toBeUndefined();
    expect(sanitized.cta_location).toBeUndefined();
    expect(sanitized.sp_need).toBe('devis');

    // Explicit consent refusal AND pending (null) consent both block dispatch (CNIL opt-in)
    for (const consentMock of [
      { choice: () => 'refused', accepted: () => false },
      { choice: () => null, accepted: () => false }
    ]) {
      const blockedDl = [];
      const blockedGtag = [];
      const res = boost.trackEvent('sp_cta_click', { cta_type: 'devis' }, {
        location: { pathname: '/' },
        dataLayer: blockedDl,
        gtag: (...args) => blockedGtag.push(args),
        SolutionPhoneConsent: consentMock
      });
      expect(res).toBe(false);
      expect(blockedDl.length).toBe(0);
      expect(blockedGtag.length).toBe(0);
    }

    // Throwing dataLayer/gtag never crashes caller
    const brokenWin = {
      location: { pathname: '/' },
      dataLayer: Object.assign([], { push: () => { throw new Error('blocked'); } }),
      gtag: () => { throw new Error('blocked'); }
    };
    expect(() => boost.trackEvent('sp_cta_click', { cta_type: 'appel' }, brokenWin)).not.toThrow();
  });

  test('classifyCta() and initCtaTracking() track all key CTA types without double-binding', () => {
    const makeEl = (attrs, closestMap = {}) => ({
      getAttribute: (k) => (Object.prototype.hasOwnProperty.call(attrs, k) ? attrs[k] : null),
      closest: (sel) => closestMap[sel] || null
    });

    expect(boost.classifyCta(makeEl({ 'data-sp-track': 'devis', 'data-sp-cta-location': 'hero' }))).toEqual({
      cta_type: 'devis',
      cta_location: 'hero'
    });
    expect(boost.classifyCta(makeEl({ href: 'https://wa.me/33783921884?text=Bonjour' }))).toEqual({
      cta_type: 'whatsapp',
      cta_location: 'page'
    });
    expect(boost.classifyCta(makeEl({ href: 'tel:+33385330689' }))).toEqual({
      cta_type: 'appel',
      cta_location: 'page'
    });
    expect(boost.classifyCta(makeEl({ href: 'reconditionnes.html#stock' }))).toEqual({
      cta_type: 'reconditionnes',
      cta_location: 'page'
    });
    expect(boost.classifyCta(makeEl({ href: 'rachat-reprise-telephone-macon.html' }))).toEqual({
      cta_type: 'reprise',
      cta_location: 'page'
    });
    expect(boost.classifyCta(makeEl({ href: '#demande-conseil' }))).toEqual({
      cta_type: 'devis',
      cta_location: 'page'
    });
    expect(boost.classifyCta(makeEl({ href: 'cgv.html' }))).toBeNull();

    // Delegated listener + idempotency + text node target handling
    const listeners = [];
    const doc = {
      addEventListener(ev, fn) {
        if (ev === 'click') listeners.push(fn);
      }
    };
    const dl = [];
    const win = { location: { pathname: '/reparation-iphone.html' }, dataLayer: dl };
    boost.initCtaTracking(doc, win);
    boost.initCtaTracking(doc, win); // second call must be a no-op
    expect(listeners.length).toBe(1);

    const ctaEl = makeEl({ 'data-sp-track': 'reconditionnes', 'data-sp-cta-location': 'reparation_iphone_strip' });
    listeners[0]({ target: { nodeType: 3, parentElement: { closest: () => ctaEl } } });
    expect(dl.length).toBe(1);
    expect(dl[0]).toEqual({
      event: 'sp_cta_click',
      cta_type: 'reconditionnes',
      cta_location: 'reparation_iphone_strip',
      page_path: '/reparation-iphone.html'
    });
  });

  test('supports reservation_24h and alerte_arrivage in quote-request payload, WhatsApp URL, and CNIL tracking', () => {
    const resBody = boost.buildQuoteRequestBody(
      {
        besoin: 'reservation_24h',
        modele: 'iPhone 14 Pro 128 Go',
        budget: 'o450',
        details: 'Réservation 24h : iPhone 14 Pro · 128 Go · Noir · 649 € · Reprise à estimer : iPhone 12 (Très bon état)',
        prenom: 'Claire',
        email: 'claire@example.fr',
        telephone: '06 11 22 33 44'
      },
      '/reconditionnes.html',
      false
    );
    expect(resBody.form_type).toBe('main_quote');
    expect(resBody.request).toContain('[Réservation 24h]');
    expect(resBody.request).toContain('iPhone 14 Pro 128 Go');
    expect(validateQuotePayload(resBody).error).toBeUndefined();

    const alertBody = boost.buildQuoteRequestBody(
      {
        besoin: 'alerte_arrivage',
        modele: 'iPhone 15 Pro 256 Go',
        budget: 'o450',
        details: 'Merci de me prévenir dès le prochain arrivage.',
        prenom: 'Lucas',
        email: 'lucas@example.fr'
      },
      '/reconditionnes.html',
      false
    );
    expect(alertBody.form_type).toBe('main_quote');
    expect(alertBody.request).toContain('[Alerte arrivage]');
    expect(alertBody.request).toContain('iPhone 15 Pro 256 Go');
    expect(validateQuotePayload(alertBody).error).toBeUndefined();

    const waAlert = decodeURIComponent(boost.buildWhatsAppUrl({
      besoin: 'alerte_arrivage',
      modele: 'Galaxy S24 Ultra',
      budget: 'o450',
      details: '256 Go'
    }));
    expect(waAlert).toContain('prochain arrivage');
    expect(waAlert).toContain('Galaxy S24 Ultra');
    expect(waAlert).toContain('450 € et +');
    expect(waAlert).not.toContain('o450');

    const waRes = decodeURIComponent(boost.buildWhatsAppUrl({
      besoin: 'reservation_24h',
      modele: 'iPhone 13 128 Go',
      budget: '250-450',
      details: 'Noir'
    }));
    expect(waRes).toContain('réserver ce smartphone 24h');
    expect(waRes).toContain('iPhone 13 128 Go');

    // CNIL opt-in trade-in event keeps allowed brand/condition keys and strips PII
    const gtagCalls = [];
    const tracked = boost.trackEvent(
      'sp_trade_simulate',
      {
        cta_type: 'reprise',
        cta_location: 'reconditionnes_trade_sim',
        trade_brand: 'iphone',
        trade_condition: 'correct',
        email: 'secret@example.fr'
      },
      {
        location: { pathname: '/reconditionnes.html' },
        gtag: (cmd, name, params) => gtagCalls.push({ cmd, name, params }),
        SolutionPhoneConsent: { choice: () => 'accepted', accepted: () => true }
      }
    );
    expect(tracked).toBe(true);
    expect(gtagCalls[0].name).toBe('sp_trade_simulate');
    expect(gtagCalls[0].params.trade_brand).toBe('iphone');
    expect(gtagCalls[0].params.trade_condition).toBe('correct');
    expect(JSON.stringify(gtagCalls[0].params)).not.toContain('secret@');
  });

  test('prefillLeadForm() fills fields, appends trade-in without duplication, updates CTA, and focuses properly', () => {
    let scrolled = false;
    let focused = '';
    const besoinEl = { value: 'reconditionne' };
    const budgetEl = { value: '250-450' };
    const modeleEl = { value: '', focus() { focused = 'modele'; } };
    const detailsEl = { value: '' };
    const prenomEl = { value: '', focus() { focused = 'prenom'; } };
    const submitBtn = { textContent: 'Demander un devis / conseil' };
    const ctxEl = { textContent: '', hidden: true };
    const confirmEl = { hidden: false };
    const form = {
      getAttribute: (k) => (k === 'data-sp-dynamic-cta' ? '1' : null),
      querySelector(sel) {
        if (sel === 'select[name="besoin"]') return besoinEl;
        if (sel === 'select[name="budget"]') return budgetEl;
        if (sel === 'input[name="modele"]') return modeleEl;
        if (sel === 'textarea[name="details"]') return detailsEl;
        if (sel === 'input[name="prenom"]') return prenomEl;
        if (sel === 'button[type="submit"]') return submitBtn;
        return null;
      }
    };
    const section = {
      scrollIntoView() { scrolled = true; },
      querySelector(sel) {
        if (sel === 'form[data-sp-lead-form]') return form;
        if (sel === '[data-sp-lead-context]') return ctxEl;
        if (sel === '[data-sp-lead-confirm]') return confirmEl;
        return null;
      }
    };
    const doc = {
      getElementById: (id) => (id === 'demande-conseil' ? section : id === 'rcLeadContext' ? ctxEl : null),
      querySelector: () => null
    };

    const okRes = boost.prefillLeadForm({
      besoin: 'reservation_24h',
      budget: 'o450',
      modele: 'iPhone 14 Pro 128 Go',
      details: 'Réservation 24h : iPhone 14 Pro 128 Go · 599 €',
      contextMessage: 'Réservation 24h pré-remplie'
    }, doc);
    expect(okRes).toBe(true);
    expect(besoinEl.value).toBe('reservation_24h');
    expect(budgetEl.value).toBe('o450');
    expect(modeleEl.value).toBe('iPhone 14 Pro 128 Go');
    expect(submitBtn.textContent).toBe('Confirmer ma réservation 24h');
    expect(ctxEl.hidden).toBe(false);
    expect(confirmEl.hidden).toBe(true);
    expect(scrolled).toBe(true);
    expect(focused).toBe('prenom');

    // Applying a trade-in with preserveNeed keeps reservation_24h + CTA and replaces any outdated trade-in cleanly
    boost.prefillLeadForm({
      besoin: 'reconditionne',
      preserveNeed: true,
      details: 'Reprise à estimer : iPhone 12 (Très bon état) — estimation gratuite en 2 min sur WhatsApp ou au 21 rue Gambetta (paiement cash ou déduction immédiate sur un reconditionné).',
      replaceTradeDetails: true
    }, doc);
    expect(besoinEl.value).toBe('reservation_24h');
    expect(submitBtn.textContent).toBe('Confirmer ma réservation 24h');
    expect(modeleEl.value).toBe('iPhone 14 Pro 128 Go');
    expect(detailsEl.value).toContain('Réservation 24h');
    expect(detailsEl.value).toContain('Reprise à estimer : iPhone 12 (Très bon état)');

    // Switching trade-in model replaces the old trade-in clause instead of concatenating two phones
    boost.prefillLeadForm({
      besoin: 'reconditionne',
      preserveNeed: true,
      details: 'Reprise à estimer : iPhone 13 (Très bon état) — estimation gratuite en 2 min sur WhatsApp ou au 21 rue Gambetta (paiement cash ou déduction immédiate sur un reconditionné).',
      replaceTradeDetails: true
    }, doc);
    expect(besoinEl.value).toBe('reservation_24h');
    expect(detailsEl.value).toContain('Réservation 24h');
    expect(detailsEl.value).toContain('Reprise à estimer : iPhone 13 (Très bon état)');
    expect(detailsEl.value).not.toContain('iPhone 12');

    // Reservation that already embedded a trade-in clause gets cleanly replaced without duplication and keeps the visit suffix
    detailsEl.value = 'Réservation 24h (sans engagement) : iPhone 14 · 128 Go · 499 € · Reprise à estimer : iPhone 12 (Très bon état) — Je souhaite passer le voir au 21 rue Gambetta.';
    boost.prefillLeadForm({
      besoin: 'reconditionne',
      preserveNeed: true,
      details: 'Reprise à estimer : iPhone 13 (État correct) — estimation gratuite en 2 min sur WhatsApp ou au 21 rue Gambetta (paiement cash ou déduction immédiate sur un reconditionné).',
      replaceTradeDetails: true
    }, doc);
    expect(detailsEl.value).toContain('iPhone 14');
    expect(detailsEl.value).toContain('Je souhaite passer le voir au 21 rue Gambetta.');
    expect(detailsEl.value).toContain('Reprise à estimer : iPhone 13 (État correct)');
    expect(detailsEl.value).not.toContain('iPhone 12');
    expect(detailsEl.value).not.toContain('fourchette');

    // Arrival alert with empty model explicitly clears stale model from prior reservation, focuses modele, and updates CTA
    boost.prefillLeadForm({
      besoin: 'alerte_arrivage',
      modele: '',
      details: 'Alerte arrivage Mâcon',
      contextMessage: 'Alerte activée'
    }, doc);
    expect(besoinEl.value).toBe('alerte_arrivage');
    expect(modeleEl.value).toBe('');
    expect(submitBtn.textContent).toBe('Activer mon alerte arrivage');
    expect(focused).toBe('modele');
  });
});

describe('Reprise sans montant chiffré & vitrine reconditionnés (reconditionnes-v2.js)', () => {
  test('selects trade-in models and conditions without any numeric amounts or euro ranges', () => {
    expect(recond.formatNetRange).toBeUndefined();
    expect(recond.estimateTradeIn).toBeUndefined();

    for (const key of Object.keys(recond.TRADE_MODELS)) {
      expect(recond.TRADE_MODELS[key].val).toBeUndefined();
    }
    for (const condKey of Object.keys(recond.TRADE_CONDITIONS)) {
      expect(recond.TRADE_CONDITIONS[condKey].factor).toBeUndefined();
    }

    for (const key of ['ip11', 'ip12', 'ip13', 'ip14', 'ip15', 'ip16', 'ip16p', 's21', 's21u', 's22', 's22u', 's23', 's23u', 's24', 's24u', 'a54']) {
      const tb = recond.getTradeSelection(key, 'tres_bon');
      const co = recond.getTradeSelection(key, 'correct');
      const fi = recond.getTradeSelection(key, 'fissure');
      expect(tb).not.toBeNull();
      expect(tb.custom).toBe(false);
      expect(tb.condLabel).toBe('Très bon état');
      expect(co.condLabel).toBe('État correct');
      expect(fi.condLabel).toBe('Écran fissuré ou batterie faible');
      expect(tb.min).toBeUndefined();
      expect(tb.max).toBeUndefined();
      expect(tb.amount).toBeUndefined();
    }

    const custom = recond.getTradeSelection('autre', 'correct', '  Google Pixel 8\nPro ');
    expect(custom.custom).toBe(true);
    expect(custom.label).toBe('Google Pixel 8 Pro');
    expect(custom.condLabel).toBe('État correct');

    const customDefault = recond.getTradeSelection('autre', 'unknown_cond', '');
    expect(customDefault.label).toBe('Autre modèle');
    expect(customDefault.condKey).toBe('tres_bon');

    expect(recond.getTradeSelection('', 'tres_bon')).toBeNull();
    expect(recond.getTradeSelection('inexistant', 'tres_bon')).toBeNull();
  });

  test('attaches clean trade-in mention (model + condition, zero euro estimate) to item description and WhatsApp message', () => {
    const trade = recond.getTradeSelection('ip13', 'tres_bon');
    const tradeDesc = recond.describeTrade(trade);
    expect(tradeDesc).toBe('Reprise à estimer : iPhone 13 (Très bon état)');
    expect(tradeDesc).not.toContain('€');

    const item = { model: 'iPhone 14 Pro', storage: '128 Go', color: 'Noir', condition: 'reconditionne', grade: 'A', battery: 91, price: 599 };
    const desc = recond.describe(item, trade);
    expect(desc).toContain('iPhone 14 Pro');
    expect(desc).toContain('599 €');
    expect(desc).toContain('Reprise à estimer : iPhone 13 (Très bon état)');
    expect(desc).not.toContain('net estimé');
    expect(desc).not.toContain('indicatif');

    const waMsg = recond.buildTradeWhatsAppMessage(trade);
    expect(waMsg).toContain('iPhone 13');
    expect(waMsg).toContain('Très bon état');
    expect(waMsg).toContain('21 rue Gambetta');
    expect(waMsg).not.toContain('€');
    expect(waMsg).not.toContain('indicative');

    const waUrl = recond.whatsappLink(waMsg);
    expect(waUrl.startsWith('https://wa.me/33783921884?text=')).toBe(true);

    const waDefault = recond.buildTradeWhatsAppMessage(null);
    expect(waDefault).toContain('reprise');
    expect(waDefault).not.toContain('€');

    expect(recond.budgetFromPrice(199)).toBe('u250');
    expect(recond.budgetFromPrice(350)).toBe('250-450');
    expect(recond.budgetFromPrice(599)).toBe('o450');
  });

  test('filters stock by brand, budget (<300 €, <500 €), battery 95%+, and sorts cleanly', () => {
    const sample = [
      recond.toItem({ modele: 'iPhone 13', stockage: 128, couleur: 'Noir', grade: 'A', batterie: 95, vente: 399 }, 'reconditionne'),
      recond.toItem({ modele: 'iPhone 15 Pro', stockage: 256, couleur: 'Titane naturel', grade: 'A+', batterie: 98, vente: 799 }, 'reconditionne'),
      recond.toItem({ modele: 'iPhone 11', stockage: 64, couleur: 'Blanc', grade: 'B', batterie: 86, vente: 219 }, 'reconditionne'),
      recond.toItem({ modele: 'Samsung Galaxy S24', stockage: 128, couleur: 'Gris', grade: 'A', batterie: 94, vente: 489 }, 'reconditionne'),
      recond.toItem({ modele: 'Samsung Galaxy A54', stockage: 128, couleur: 'Noir', grade: 'A', batterie: 100, vente: 249 }, 'reconditionne'),
      recond.toItem({ modele: 'iPhone 16', stockage: 128, couleur: 'Bleu', grade: '', batterie: 0, vente: 869 }, 'neuf')
    ];

    // Budget quick filters (<300 € and <500 €)
    const u300 = recond.filterItems(sample, { cat: 'all', budget: 'u300' });
    expect(u300.map((i) => i.model)).toEqual(['iPhone 11', 'Samsung Galaxy A54']);

    const u500 = recond.filterItems(sample, { cat: 'all', budget: 'u500' });
    expect(u500.length).toBe(4);
    expect(u500.every((i) => i.price < 500)).toBe(true);

    // Battery 95%+ boundary: 94 excluded, 95 & 98 & 100 & neuf included
    const bat95 = recond.filterItems(sample, { cat: 'all', batteryMin: 95 });
    expect(bat95.map((i) => i.model)).toEqual(['iPhone 13', 'iPhone 15 Pro', 'Samsung Galaxy A54', 'iPhone 16']);

    // Combined filters: iPhone + <500 € + battery 95%+
    const combo = recond.filterItems(sample, { cat: 'iphone', budget: 'u500', batteryMin: 95 });
    expect(combo.map((i) => i.model)).toEqual(['iPhone 13']);

    // Samsung filter excludes iPhone and neuf
    const samsungOnly = recond.filterItems(sample, { cat: 'samsung' });
    expect(samsungOnly.map((i) => i.model)).toEqual(['Samsung Galaxy S24', 'Samsung Galaxy A54']);

    // Accent-insensitive multi-token search
    const searched = recond.filterItems(sample, { cat: 'all', query: 'titane 256' });
    expect(searched.map((i) => i.model)).toEqual(['iPhone 15 Pro']);

    // Sorting: price_asc, price_desc, recent
    const asc = recond.sortItems(sample, 'price_asc');
    expect(asc[0].price).toBe(219);
    expect(asc[asc.length - 1].price).toBe(869);

    const desc = recond.sortItems(sample, 'price_desc');
    expect(desc[0].price).toBe(869);
    expect(desc[desc.length - 1].price).toBe(219);

    const recent = recond.sortItems(sample, 'recent');
    expect(recent[0].model).toBe('iPhone 16');
    expect(recent[1].model).toBe('Samsung Galaxy S24');
  });

  test('renders e-commerce product card with badges, battery highlights, TTC price only (no numeric trade-in deduction), CTAs, and XSS escaping', () => {
    const itemHighBat = recond.toItem(
      { modele: 'iPhone 14 Pro', stockage: 128, couleur: 'Noir', grade: 'A+', batterie: 96, vente: 599 },
      'reconditionne'
    );
    const trade = recond.getTradeSelection('ip13', 'tres_bon');
    const htmlWithTrade = recond.cardHtml(itemHighBat, trade);

    expect(htmlWithTrade).toContain('class="rc-card"');
    expect(htmlWithTrade).toContain('En stock à Mâcon');
    expect(htmlWithTrade).toContain('Grade A+');
    expect(htmlWithTrade).toContain('rc-badge--bat-high');
    expect(htmlWithTrade).toContain('Batterie 96&nbsp;%');
    expect(htmlWithTrade).toContain('Garantie 12&nbsp;mois');
    expect(htmlWithTrade).toContain('599&nbsp;€');
    expect(htmlWithTrade).not.toContain('rc-net-pill');
    expect(htmlWithTrade).not.toContain('reprise déduite');
    expect(htmlWithTrade).toContain('Reprise à estimer : iPhone 13 (Très bon état)');
    expect(htmlWithTrade).toContain('Réserver 24h (gratuit)');
    expect(htmlWithTrade).toContain('data-sp-track="reservation_24h"');
    expect(htmlWithTrade).toContain('data-sp-track="whatsapp"');
    expect(htmlWithTrade).toContain('https://wa.me/33783921884?text=');

    // Without trade-in: no trade-in mention; battery < 90%: no bat-high badge
    const itemStdBat = recond.toItem(
      { modele: 'Samsung Galaxy S23', stockage: 128, couleur: 'Vert', grade: 'B', batterie: 86, vente: 349 },
      'reconditionne'
    );
    const htmlNoTrade = recond.cardHtml(itemStdBat, null);
    expect(htmlNoTrade).not.toContain('rc-net-pill');
    expect(htmlNoTrade).not.toContain('Reprise à estimer');
    expect(htmlNoTrade).not.toContain('rc-badge--bat-high');
    expect(htmlNoTrade).toContain('Batterie 86&nbsp;%');
    expect(htmlNoTrade).toContain('rc-card-media--placeholder');

    // Battery 100% gets dedicated highlight class
    const item100 = recond.toItem(
      { modele: 'iPhone 13', stockage: 128, couleur: 'Noir', grade: 'A', batterie: 100, vente: 399 },
      'reconditionne'
    );
    expect(recond.cardHtml(item100, null)).toContain('rc-badge--bat-100');

    // XSS escaping in model / color / grade
    const xssItem = {
      condition: 'reconditionne',
      model: '<script>alert(1)</script>',
      brand: 'autre',
      family: 'Autres',
      rank: 0,
      variant: 0,
      isIphone: false,
      uncertainSE: false,
      storage: '128 Go',
      storageNum: 128,
      color: '"><img src=x>',
      colorHex: '',
      grade: 'A',
      battery: 92,
      price: 299
    };
    const safeHtml = recond.cardHtml(xssItem, null);
    expect(safeHtml).not.toContain('<script>');
    expect(safeHtml).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(safeHtml).not.toContain('<img src=x>');
  });

  test('exercises #rcTradeBox DOM end-to-end with conversion-boost.js (model, custom label with ·, condition, WhatsApp, apply & card reservation)', async () => {
    const fs = require('fs');
    const pathMod = require('path');
    const vm = require('vm');
    const recondSource = fs.readFileSync(pathMod.resolve(__dirname, '..', 'reconditionnes-v2.js'), 'utf8');

    const makeEl = (extra = {}) => {
      const listeners = {};
      const attrs = { ...(extra.attrs || {}) };
      const classes = new Set();
      return {
        value: '',
        href: '',
        hidden: false,
        innerHTML: '',
        textContent: '',
        classList: {
          add: (c) => classes.add(c),
          remove: (c) => classes.delete(c),
          contains: (c) => classes.has(c)
        },
        getAttribute: (k) => (Object.prototype.hasOwnProperty.call(attrs, k) ? attrs[k] : null),
        setAttribute: (k, v) => { attrs[k] = String(v); },
        addEventListener: (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); },
        dispatch: (ev, payload = {}) => (listeners[ev] || []).forEach((fn) => fn(payload)),
        querySelector: () => null,
        querySelectorAll: () => [],
        scrollIntoView: () => {},
        focus: () => {},
        ...extra
      };
    };

    const condBtnTb = makeEl({ attrs: { 'data-cond': 'tres_bon', 'aria-pressed': 'true' } });
    const condBtnCo = makeEl({ attrs: { 'data-cond': 'correct', 'aria-pressed': 'false' } });
    const rcTabs = makeEl();
    const rcList = makeEl();
    const rcSummary = makeEl();
    const rcCount = makeEl();
    const rcTradeModel = makeEl();
    const rcTradeOtherWrap = makeEl({ hidden: true });
    const rcTradeOther = makeEl();
    const rcTradeCond = makeEl({ querySelectorAll: () => [condBtnTb, condBtnCo] });
    const rcTradeRange = makeEl();
    const rcTradeSummary = makeEl();
    const rcTradeWaBtn = makeEl();
    const rcTradeApplyBtn = makeEl();

    // #demande-conseil form elements wired to real boost.prefillLeadForm
    const besoinEl = makeEl({ value: 'reconditionne' });
    const budgetEl = makeEl({ value: '250-450' });
    const modeleEl = makeEl({ value: '' });
    const detailsEl = makeEl({ value: '' });
    const prenomEl = makeEl({ value: '' });
    const submitBtn = makeEl({ textContent: 'Demander un devis / conseil' });
    const rcLeadContext = makeEl({ hidden: true });
    const confirmEl = makeEl({ hidden: true });
    const leadForm = makeEl({
      attrs: { 'data-sp-dynamic-cta': '1' },
      querySelector: (sel) => ({
        'select[name="besoin"]': besoinEl,
        'select[name="budget"]': budgetEl,
        'input[name="modele"]': modeleEl,
        'textarea[name="details"]': detailsEl,
        'input[name="prenom"]': prenomEl,
        'button[type="submit"]': submitBtn
      }[sel] || null)
    });
    const leadSection = makeEl({
      querySelector: (sel) => ({
        'form[data-sp-lead-form]': leadForm,
        '[data-sp-lead-context]': rcLeadContext,
        '[data-sp-lead-confirm]': confirmEl
      }[sel] || null)
    });

    const elementsById = {
      rcTabs, rcList, rcSummary, rcCount, rcTradeModel, rcTradeOtherWrap, rcTradeOther,
      rcTradeCond, rcTradeRange, rcTradeSummary, rcTradeWaBtn, rcTradeApplyBtn,
      'demande-conseil': leadSection, rcLeadContext
    };
    const fakeDoc = {
      getElementById: (id) => elementsById[id] || null,
      querySelector: () => null,
      querySelectorAll: () => []
    };

    const trackedEvents = [];
    const fakeWin = {
      SolutionPhoneBoost: {
        prefillLeadForm: (opts) => boost.prefillLeadForm(opts, fakeDoc),
        trackEvent: (name, params) => { trackedEvents.push({ name, params }); return true; }
      }
    };

    const sampleStock = {
      stock: {
        used: [{ modele: 'iPhone 14 Pro', stockage: 128, couleur: 'Noir', grade: 'A+', batterie: 96, vente: 599 }],
        new: []
      }
    };

    const ctx = {
      window: fakeWin,
      document: fakeDoc,
      fetch: async () => ({ ok: true, json: async () => sampleStock }),
      setTimeout,
      clearTimeout,
      setInterval: () => 0,
      encodeURIComponent,
      Date,
      console
    };

    vm.runInNewContext(recondSource, ctx);
    await new Promise((r) => setTimeout(r, 20));

    // 1. Initial state: no euro amounts, exact message, card rendered with TTC price only
    expect(rcTradeRange.innerHTML).toContain('Estimation gratuite en 2&nbsp;min sur WhatsApp ou au 21&nbsp;rue&nbsp;Gambetta');
    expect(rcTradeRange.innerHTML).not.toContain('€');
    expect(decodeURIComponent(rcTradeWaBtn.href)).not.toContain('€');
    expect(rcList.innerHTML).toContain('class="rc-card"');
    expect(rcList.innerHTML).toContain('599&nbsp;€');
    expect(rcList.innerHTML).not.toContain('rc-net-pill');
    expect(rcList.innerHTML).not.toContain('reprise déduite');

    // 2. Select Autre modèle + type custom model containing "·" separator + switch to État correct
    rcTradeModel.value = 'autre';
    rcTradeModel.dispatch('change');
    expect(rcTradeOtherWrap.hidden).toBe(false);
    rcTradeOther.value = 'Google Pixel 8 · 128 Go';
    rcTradeOther.dispatch('change');
    rcTradeCond.dispatch('click', { target: { closest: () => condBtnCo } });

    expect(rcTradeRange.classList.contains('is-active')).toBe(true);
    expect(rcTradeRange.innerHTML).toContain('Google Pixel 8 - 128 Go');
    expect(rcTradeRange.innerHTML).toContain('État correct');
    expect(rcTradeRange.innerHTML).not.toContain('€');
    expect(decodeURIComponent(rcTradeWaBtn.href)).toContain('Google Pixel 8 - 128 Go (État correct)');
    expect(decodeURIComponent(rcTradeWaBtn.href)).not.toContain('€');
    expect(rcList.innerHTML).toContain('Reprise à estimer : Google Pixel 8 - 128 Go (État correct)');
    expect(rcList.innerHTML).not.toContain('rc-net-pill');

    // 3. Apply trade-in to #demande-conseil, then switch to iPhone 15 and re-apply: old custom model cleanly replaced
    rcTradeApplyBtn.dispatch('click');
    expect(detailsEl.value).toContain('Reprise à estimer : Google Pixel 8 - 128 Go (État correct)');
    expect(detailsEl.value).not.toContain('€');

    rcTradeModel.value = 'ip15';
    rcTradeModel.dispatch('change');
    expect(rcTradeOtherWrap.hidden).toBe(true);
    rcTradeApplyBtn.dispatch('click');
    expect(detailsEl.value).toContain('Reprise à estimer : iPhone 15 (État correct)');
    expect(detailsEl.value).not.toContain('Pixel 8');
    expect(detailsEl.value).not.toContain('128 Go');
    expect(trackedEvents.some((e) => e.name === 'sp_trade_simulate' && e.params.trade_brand === 'iphone')).toBe(true);

    // 4. Click "Réserver 24h (gratuit)" on rendered product card -> attaches clean trade-in without euro deduction
    const cardBtn = makeEl({
      attrs: {
        'data-reserve-item': 'iPhone 14 Pro · 128 Go · Noir · grade A+ · batterie 96 % · 599 € · Reprise à estimer : iPhone 15 (État correct)',
        'data-reserve-model': 'iPhone 14 Pro 128 Go',
        'data-reserve-price': '599'
      }
    });
    rcList.dispatch('click', {
      target: {
        closest: (sel) => (sel === '[data-reserve-item]' ? cardBtn : null)
      }
    });
    expect(besoinEl.value).toBe('reservation_24h');
    expect(budgetEl.value).toBe('o450');
    expect(modeleEl.value).toBe('iPhone 14 Pro 128 Go');
    expect(detailsEl.value).toContain('599 €');
    expect(detailsEl.value).toContain('Reprise à estimer : iPhone 15 (État correct)');
    expect(detailsEl.value).not.toContain('reprise déduite');
    expect(detailsEl.value).not.toContain('fourchette');
    expect(rcLeadContext.hidden).toBe(false);
    expect(rcLeadContext.textContent).toContain('Reprise à estimer : iPhone 15 (État correct)');
  });
});

describe('Scripts SEO (generate_sitemap.js & seo_update.js)', () => {
  test('toUrlPath maps index and nested index cleanly', () => {
    expect(toUrlPath('index.html')).toBe('/');
    expect(toUrlPath('magasin/macon/index.html')).toBe('/magasin/macon/');
    expect(toUrlPath('reconditionnes.html')).toBe('/reconditionnes.html');
  });

  test('loadExclusions excludes internal directories and node_modules', () => {
    const excl = loadExclusions();
    expect(excl.has('forms')).toBe(true);
    expect(excl.has('tests')).toBe(true);
    expect(excl.has('node_modules')).toBe(true);
  });

  test('mergeFaqQuestions is idempotent and avoids duplicates', () => {
    const existing = [
      { '@type': 'Question', name: 'Quelle garantie ?', acceptedAnswer: { '@type': 'Answer', text: '6 mois.' } }
    ];
    const merged = mergeFaqQuestions(existing, [
      { question: 'quelle garantie ?', answer: 'Doublon ignoré' },
      { question: 'Délai moyen ?', answer: 'Moins d’une heure.' }
    ]);
    expect(merged.length).toBe(2);
    expect(merged[1].name).toBe('Délai moyen ?');
  });
});
