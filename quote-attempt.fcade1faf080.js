(function (root, build) {
  'use strict';
  const api = build();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.defineProperty(root, 'SolutionPhoneQuoteAttempts', { value: api });
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const prefix = 'sp-public-quote-attempt-v1:';
  const ttl = 24 * 60 * 60 * 1000;
  const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
  const hex = /^[a-f0-9]{64}$/;
  const references = Object.freeze({ v1: /^DV-\d{8}-[A-F0-9]{6}$/, v2: /^WEB-[A-F0-9]{20}$/ });
  const fields = ['email', 'form_type', 'name', 'page', 'phone', 'request', 'website'];
  const encode = new TextEncoder();
  function fail(code) {
    const error = new Error(code);
    error.name = 'QuoteAttemptError';
    error.code = code;
    return error;
  }
function acceptsQuoteReference(receiver, receipt) {
  if (receipt?.received !== true || typeof receipt.reference !== 'string') return false;
  if (receiver === 'v2') return references.v2.test(receipt.reference);
  if (receiver !== 'v1') return false;
  return receipt.relayedTo === 'v2' ? references.v2.test(receipt.reference)
    : receipt.relayedTo === undefined && references.v1.test(receipt.reference);
}
  function isReceiver(v) { return v === 'v1' || v === 'v2'; }
  function canonical(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input) ||
        Object.keys(input).some(k => !fields.includes(k))) throw fail('invalid_quote_payload');
    const values = Object.create(null);
    for (const field of fields) {
      if (!Object.hasOwn(input, field)) continue;
      const val = input[field];
      if (typeof val !== 'string' && !(field === 'phone' && val === null))
        throw fail('invalid_quote_payload');
      values[field] = val;
    }
    for (const field of ['name', 'email', 'request', 'form_type', 'page'])
      if (typeof values[field] !== 'string') throw fail('invalid_quote_payload');
    const body = JSON.stringify(values);
    if (body.length > 8192 || encode.encode(body).byteLength > 24000) throw fail('invalid_quote_payload');
    return { values: Object.freeze(values), body };
  }
  const toHex = bytes => Array.from(bytes, n => n.toString(16).padStart(2, '0')).join('');
  const fromHex = text => Uint8Array.from(text.match(/../g), n => parseInt(n, 16));

  function create({ storage, crypto, now = Date.now }) {
    const busy = new Set();
    function read(key) {
      try { return storage.getItem(key); }
      catch { throw fail('quote_storage_unavailable'); }
    }
    function write(key, value) {
      try {
        storage.setItem(key, value);
        if (storage.getItem(key) !== value) throw Error();
      } catch { throw fail('quote_storage_unavailable'); }
    }
    async function fingerprint(secret, key, receiver, token, at, body) {
      try {
        const hmac = await crypto.subtle.importKey('raw', fromHex(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const binding = JSON.stringify([key, receiver, token, at, body]);
        return toHex(new Uint8Array(await crypto.subtle.sign('HMAC', hmac, encode.encode(binding))));
      } catch { throw fail('quote_storage_unavailable'); }
    }
    async function submit({ slot, defaultReceiver, payload, send }) {
      if (!/^[a-z0-9_/-]{1,180}$/.test(slot ?? '') || !isReceiver(defaultReceiver) || typeof send !== 'function')
        throw fail('invalid_quote_form');
      if (busy.has(slot)) throw fail('quote_in_flight');
      busy.add(slot);
      try {
        const { values, body } = canonical(payload);
        const key = prefix + slot;
        let raw = read(key);
        let attempt;
        const time = now();
        if (!Number.isSafeInteger(time) || time < 0) throw fail('quote_attempt_needs_review');
        if (raw !== null) {
          try {
            if (typeof raw !== 'string' || raw.length > 400) throw Error();
            attempt = JSON.parse(raw);
            if (!attempt || Object.keys(attempt).sort().join(',') !== 'at,mac,receiver,salt,token'
              || !isReceiver(attempt.receiver) || !uuid.test(attempt.token) || !hex.test(attempt.salt) || !hex.test(attempt.mac)
              || !Number.isSafeInteger(attempt.at) || attempt.at < 0 || attempt.at > time || time - attempt.at >= ttl)
              throw Error();
          } catch { throw fail('quote_attempt_needs_review'); }
          if (await fingerprint(attempt.salt, key, attempt.receiver, attempt.token, attempt.at, body) !== attempt.mac)
            throw fail('quote_payload_changed');
          if (read(key) !== raw) throw fail('quote_attempt_needs_review');
        } else {
          let token, salt;
          try {
            token = crypto.randomUUID();
            salt = toHex(crypto.getRandomValues(new Uint8Array(32)));
            if (!uuid.test(token) || !hex.test(salt)) throw Error();
          } catch { throw fail('quote_storage_unavailable'); }
          attempt = { at: time, receiver: defaultReceiver, token, salt,
            mac: await fingerprint(salt, key, defaultReceiver, token, time, body) };
          if (read(key) !== null) throw fail('quote_attempt_needs_review');
          raw = JSON.stringify(attempt);
          write(key, raw);
        }
        // Sender selects only the named receiver; it must reject non-2xx.
        // A missing or ambiguous acknowledgment must never clear the pin.
        const receipt = await send({ receiver: attempt.receiver, clientToken: attempt.token, payload: values });
        if (!acceptsQuoteReference(attempt.receiver, receipt)) throw fail('quote_receipt_unconfirmed');
        try { if (read(key) === raw) storage.removeItem(key); }
        catch { /* Confirmed receipt is authoritative; retain the safe pin if cleanup fails. */ }
        return receipt;
      } finally {
        busy.delete(slot);
      }
    }
    return Object.freeze({ submit });
  }
  let browserInstance;
  function open() {
    if (browserInstance) return browserInstance;
    let storage, crypto;
    try { storage = window.sessionStorage; crypto = window.crypto; }
    catch { throw fail('quote_storage_unavailable'); }
    browserInstance = create({ storage, crypto });
    return browserInstance;
  }
  return Object.freeze({ create, open, ttl });
});
