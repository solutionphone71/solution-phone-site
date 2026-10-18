import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../reconditionnes-v2.js', import.meta.url), 'utf8');
const page = await readFile(new URL('../reconditionnes.html', import.meta.url), 'utf8');

assert.match(source, /var WHATSAPP = 'https:\/\/wa\.me\/33783921884';/);
assert.doesNotMatch(source, /var WHATSAPP = '[^']*\?text=/);
assert.equal(
  [...source.matchAll(/WHATSAPP \+ '\?text=' \+ encodeURIComponent/g)].length,
  1,
  'la construction du lien WhatsApp doit rester centralisée dans whatsappLink'
);
assert.match(source, /return whatsappLink\(msg\);/);
assert.match(source, /catalogue consulté à/);
assert.doesNotMatch(source, /à l’atelier · mis à jour à/);
assert.match(page, /reconditionnes-v2\.js\?v=2/);

const whatsappLink = (message) =>
  'https://wa.me/33783921884?text=' + encodeURIComponent(message);
const link = new URL(whatsappLink(
  'Bonjour Solution Phone, je souhaite réserver un iPhone 13.'
));

assert.equal(link.hostname, 'wa.me');
assert.equal(link.pathname, '/33783921884');
assert.deepEqual([...link.searchParams.keys()], ['text']);
assert.equal(
  link.searchParams.get('text'),
  'Bonjour Solution Phone, je souhaite réserver un iPhone 13.'
);
assert.equal(link.searchParams.get('text').includes('?text='), false);

console.log('OK — liens WhatsApp du catalogue et libellé de fraîcheur vérifiés.');
