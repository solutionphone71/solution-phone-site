// Isolated regression tests: no network, email, analytics collection or WhatsApp send.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const handlerStart = html.indexOf("$('#mail-form').addEventListener('submit',async e=>{");
assert.ok(handlerStart >= 0);
const handler = html.slice(handlerStart, html.indexOf('\n    });', handlerStart) + 8);
const sideEffect = html.match(/    function runQuoteSideEffect\(callback\)\{[^\n]+/)[0];
let count = 0;
for (const mode of ['accepted', 'refused', 'rate_limited', 'tracking_throws', 'tracking_rejects', 'reset_throws', 'double_click', 'honeypot', 'no_reference']) {
  let onSubmit, calls = 0, resets = 0, release;
  const events = [], status = { textContent: '' }, button = { disabled: false };
  const form = { addEventListener: (_, fn) => onSubmit = fn, querySelector: () => button, reset() { resets++; if (mode === 'reset_throws') throw Error('reset'); } };
  const context = {
    $: selector => selector === '#mail-form' ? form : status,
    FormData: class { entries() { return Object.entries({ Nom: 'Test isolé', email: 'test@example.invalid', Telephone: '', Demande: 'iPhone 13 écran cassé', website: mode === 'honeypot' ? 'bot' : '' }); } },
    sendQuoteRequest: async data => {
      calls++; assert.equal(data.request, 'iPhone 13 écran cassé');
      if (mode === 'double_click') await new Promise(resolve => release = resolve);
      if (mode === 'refused' || mode === 'rate_limited') throw Object.assign(Error('server'), { status: mode === 'rate_limited' ? 429 : 503 });
      return { received: true, reference: mode === 'no_reference' ? undefined : 'LOCAL-ONLY' };
    },
    trackLeadSuccess: name => { events.push(name); if (mode === 'tracking_throws') throw Error('analytics'); if (mode === 'tracking_rejects') return Promise.reject(Error('analytics')); },
    track: name => events.push(name), trackBrainEvent: name => events.push(name), current: null,
    quoteErrorMessage: error => 'error ' + error.status
  };
  vm.runInNewContext(sideEffect + '\n' + handler, context);
  const event = { preventDefault() {}, currentTarget: form };
  const pending = onSubmit(event); event.currentTarget = null;
  if (mode === 'double_click') { await onSubmit({ preventDefault() {}, currentTarget: form }); release(); }
  await pending; await Promise.resolve();
  assert.equal(calls, mode === 'honeypot' ? 0 : 1, mode + ' request count');
  assert.equal(button.disabled, false, mode + ' button restored');
  if (mode === 'honeypot') assert.equal(status.textContent, '');
  else if (mode === 'refused' || mode === 'rate_limited') { assert.match(status.textContent, /^error/); assert.deepEqual(events, ['devis_email_erreur']); assert.equal(resets, 0); }
  else { assert.match(status.textContent, /^Demande enregistrée/); assert.ok(!status.textContent.includes('undefined')); assert.equal(events.filter(x => x === 'devis_email_envoye').length, 1); assert.ok(!events.includes('devis_email_erreur')); assert.equal(resets, 1); }
  count++;
}

// The alternative iPhone-parts form uses the same post-send isolation.
const otherStart = html.indexOf("$('#quick-other-mail').addEventListener('click',async()=>{");
const otherHandler = html.slice(otherStart, html.indexOf('\n    });', otherStart) + 8);
for (const mode of ['accepted', 'refused', 'tracking_throws', 'double_click']) {
  let click, calls = 0, release;
  const classes = [], status = { classList: { add: value => classes.push(value) } }, events = [];
  const button = { disabled: false, addEventListener: (_, fn) => click = fn };
  const nodes = { '#quick-other-mail': button, '#quick-other-status': status, '#quick-model': { value: '13' }, '#quick-other-name': { value: 'Test' }, '#quick-other-email': { value: 'test@example.invalid', checkValidity: () => true }, '#quick-other-phone': { value: '' }, '#quick-other-website': { value: '' } };
  const context = { $: key => nodes[key], quickOtherRequest: () => 'iPhone 13 caméra', iphoneLabel: () => 'iPhone 13', sendQuoteRequest: async () => { calls++; if (mode === 'double_click') await new Promise(resolve => release = resolve); if (mode === 'refused') throw Error('server'); return {received:true, reference:'LOCAL-ONLY'}; }, quoteErrorMessage: () => 'server error', trackLeadSuccess: name => { events.push(name); if (mode === 'tracking_throws') throw Error('tracking'); }, track: name => events.push(name), trackBrainEvent: name => events.push(name) };
  vm.runInNewContext(sideEffect + '\n' + otherHandler, context);
  const pending = click();
  if (mode === 'double_click') { await click(); release(); }
  await pending;
  assert.equal(calls, 1); assert.equal(button.disabled, false);
  assert.deepEqual(classes, [mode === 'refused' ? 'is-error' : 'is-success']);
  assert.equal(events.filter(x => x === 'devis_email_envoye').length, mode === 'refused' ? 0 : 1);
  count++;
}

// The shared dock must also isolate accepted requests from post-send exceptions.
const dock = fs.readFileSync(path.join(root, 'contact-dock.js'), 'utf8');
const dockStart = dock.indexOf("  form.addEventListener('submit'");
const dockHandler = dock.slice(dockStart, dock.lastIndexOf('\n})();'));
const dockTrack = dock.match(/  function track\(name,params\)\{[^\n]+/)[0];
for (const mode of ['accepted', 'refused', 'tracking_throws', 'reset_throws', 'double_click']) {
  let onSubmit, calls = 0, resets = 0, release;
  const status = {}, submit = { disabled: false }, events = [];
  const form = { website: { value: '' }, nom: { value: 'Local' }, email: { value: 'test@example.invalid' }, telephone: { value: '' }, demande: { value: 'iPhone 13 écran cassé' }, addEventListener: (_, fn) => onSubmit = fn, reset() { resets++; if (mode === 'reset_throws') throw Error('reset'); } };
  const context = { form, status, submit, page: '/local-test', endpoint: 'https://example.invalid', publicKey: 'TEST', location: { href: 'https://example.invalid' }, crypto: { randomUUID: () => 'local-test' }, window: { crypto: true, gtag: (_, name) => { events.push(name); if (mode === 'tracking_throws') throw Error('gtag'); } }, fetch: async () => { calls++; if (mode === 'double_click') await new Promise(resolve => release = resolve); return { ok: mode !== 'refused', json: async () => ({ received: mode !== 'refused', reference: 'LOCAL-ONLY' }) }; } };
  vm.runInNewContext(dockTrack + '\n' + dockHandler, context);
  onSubmit({ preventDefault() {} });
  if (mode === 'double_click') { onSubmit({ preventDefault() {} }); release(); }
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 1); assert.equal(submit.disabled, false);
  if (mode === 'refused') { assert.equal(status.className, 'sp-contact-status err'); assert.equal(resets, 0); assert.equal(events.length, 0); }
  else { assert.equal(status.className, 'sp-contact-status ok'); assert.equal(resets, 1); assert.deepEqual(events, ['devis_email_envoye']); }
  count++;
}

// Check free-text model handling: always textContent + encoded WhatsApp URL.
const hydrogel = fs.readFileSync(path.join(root, 'hydrogel.html'), 'utf8');
const hydrogelStart = hydrogel.indexOf('const formulas = {');
const hydrogelEnd = hydrogel.indexOf("document.querySelectorAll('[data-formula]').forEach(btn", hydrogelStart);
const fields = new Map();
const hydrogelContext = { document: { getElementById: id => { if (!fields.has(id)) fields.set(id, {}); return fields.get(id); } }, gotoStep: n => assert.equal(n, 3) };
vm.runInNewContext(hydrogel.slice(hydrogelStart, hydrogelEnd) + "\nselectedFormula='ECOSHIELD 7H';selectHydrogelModel('Pixel <Pro> & 16');", hydrogelContext);
assert.equal(fields.get('wzRecapModel').textContent, 'Pixel <Pro> & 16');
const url = new URL(fields.get('wzWhatsApp').href);
assert.equal(url.host, 'wa.me'); assert.equal(url.pathname, '/33783921884');
assert.match(url.searchParams.get('text'), /Pixel <Pro> & 16/); assert.match(url.searchParams.get('text'), /30 €/);
assert.ok(!hydrogel.includes('id="wzForm"'));
count++;

// Optional cross-site test, pointed explicitly at the safe worktree or published copy.
if (process.argv[2]) {
  const iphone = fs.readFileSync(process.argv[2], 'utf8');
  const start = iphone.indexOf('function sendQuickQuote(event){');
  const end = iphone.indexOf('\n// ═══ PRICING', start);
  assert.ok(iphone.includes('id="devis"'));
  for (const mode of ['accepted', 'refused', 'tracking_throws', 'reset_throws', 'double_click']) {
    let calls = 0, release;
    const button = { disabled: false }, status = {}, events = [];
    const form = { querySelector: () => button, reset() { if (mode === 'reset_throws') throw Error('reset'); } };
    const nodes = { 'quick-status': status, 'quick-name': { value: 'Test' }, 'quick-email': { value: 'test@example.invalid' }, 'quick-details': { value: 'Écran cassé' }, 'hero-model': { value: 'iPhone 13' }, 'quick-website': { value: '' } };
    const context = { document: { getElementById: id => nodes[id], querySelector: () => ({ getAttribute: () => 'ecran' }) }, sendQuoteRequest: async data => { calls++; assert.match(data.request, /iPhone 13/); if (mode === 'double_click') await new Promise(resolve => release = resolve); if (mode === 'refused') throw Error('server'); return { received: true, reference: 'LOCAL-ONLY' }; }, trackQuoteSuccess: () => { events.push('success'); if (mode === 'tracking_throws') throw Error('analytics'); }, quoteErrorMessage: () => 'server error' };
    vm.runInNewContext(iphone.slice(start, end), context);
    const event = { preventDefault() {}, currentTarget: form }; context.sendQuickQuote(event); event.currentTarget = null;
    if (mode === 'double_click') { context.sendQuickQuote({ preventDefault() {}, currentTarget: form }); release(); }
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(calls, 1);
    assert.equal(status.className, mode === 'refused' ? 'quick-status error' : 'quick-status success');
    assert.equal(events.length, mode === 'refused' ? 0 : 1);
    count++;
  }
}
console.log(`${count} isolated quote UI regression tests passed; no network requests sent.`);
