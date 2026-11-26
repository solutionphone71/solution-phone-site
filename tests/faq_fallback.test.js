// Tests automatisés (Bun / Jest + Supertest) : serveur, sécurité, SEO & conversion
const request = require('supertest');
const app = require('../faq_fallback_server');
const boost = require('../conversion-boost');
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
