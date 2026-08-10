import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

const checks = [
  ['lien d’appel atelier', 'href="tel:+33385330689"'],
  ['événement appel', "track('contact_phone'"],
  ['événement WhatsApp', "track('contact_whatsapp'"],
  ['événement devis envoyé', "track('devis_email_envoye'"],
  ['événement devis après succès', "form_type:'main_quote'"],
  ['événement devis rapide après succès', "form_type:'quick_other_part'"],
  ['formulaire de secours POST', 'method="POST"'],
  ['URL source FormSubmit', 'name="_url" value="https://solution-phone.fr/"'],
];

for (const [label, needle] of checks) {
  if (!html.includes(needle)) throw new Error(`Suivi incomplet : ${label}`);
}

const successIndex = html.indexOf("track('devis_email_envoye'", html.indexOf("$('#mail-form').addEventListener('submit'"));
const responseIndex = html.indexOf('if(!r.ok', html.indexOf("$('#mail-form').addEventListener('submit'"));
if (successIndex < responseIndex) throw new Error('Le devis est compté avant la confirmation du serveur.');

const mainHandler = html.slice(html.indexOf("$('#mail-form').addEventListener('submit'"), html.indexOf('function track(name,params)'));
if (!mainHandler.includes("track('devis_autre_piece_email'")) {
  throw new Error('Le devis principal ne remonte pas encore dans la conversion Ads existante.');
}

console.log('Suivi des conversions : OK');
