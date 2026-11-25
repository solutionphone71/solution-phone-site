// generate_sitemap.js – simple sitemap generator
const fs = require('fs');
const path = require('path');

const baseUrl = 'https://solution-phone.fr';
const pages = [
  '/index.html',
  '/reconditionnes.html',
  '/faq.html',
  '/contact.html',
  '/about.html',
];
let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
pages.forEach(p => {
  xml += `  <url><loc>${baseUrl}${p}</loc></url>\n`;
});
xml += `</urlset>`;
fs.writeFileSync(path.join(__dirname, '..', 'sitemap.xml'), xml);
console.log('Sitemap generated.');
