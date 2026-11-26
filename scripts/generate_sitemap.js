#!/usr/bin/env node
/**
 * generate_sitemap.js — Génère sitemap.xml à partir des vraies pages publiées
 * de solution-phone.fr (en respectant les exclusions de _config.yml et en ignorant
 * les redirections meta refresh, 404.html et forms/).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'https://solution-phone.fr';
const TODAY = new Date().toISOString().slice(0, 10);

const HIGH_PRIORITY = new Set([
  'reparation-iphone.html',
  'reparation-samsung.html',
  'reparation-xiaomi-redmi-macon.html',
  'reparation-google-pixel-macon.html',
  'ecran-iphone-casse-macon.html',
  'remplacement-ecran-samsung-macon.html',
  'remplacement-batterie-telephone-macon.html',
  'reparation-telephone-macon.html',
  'reconditionnes.html',
  'pc-mac-reconditionnes-macon.html',
  'rachat-reprise-telephone-macon.html',
  'solution-informatique.html',
  'reparation-ordinateur-pc-mac-macon.html'
]);

function loadExclusions() {
  const cfgPath = path.join(ROOT, '_config.yml');
  if (!fs.existsSync(cfgPath)) return new Set();
  const lines = fs.readFileSync(cfgPath, 'utf8').split(/\r?\n/);
  const excl = new Set(['404.html', 'forms']);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      excl.add(trimmed.slice(2).trim().replace(/\/+$/, ''));
    }
  }
  return excl;
}

function isExcluded(relPath, exclusions) {
  for (const ex of exclusions) {
    if (relPath === ex || relPath.startsWith(ex + '/')) return true;
  }
  return false;
}

function collectHtmlFiles(dir, exclusions, acc = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full).split(path.sep).join('/');
    if (isExcluded(rel, exclusions)) continue;
    if (entry.isDirectory()) {
      collectHtmlFiles(full, exclusions, acc);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      const content = fs.readFileSync(full, 'utf8');
      if (/http-equiv=["']refresh["']/i.test(content)) continue;
      acc.push(rel);
    }
  }
  return acc;
}

function toUrlPath(rel) {
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
  return '/' + rel;
}

function buildSitemap() {
  const exclusions = loadExclusions();
  const files = collectHtmlFiles(ROOT, exclusions).sort((a, b) => {
    if (a === 'index.html') return -1;
    if (b === 'index.html') return 1;
    return a.localeCompare(b);
  });

  const urls = files.map((rel) => {
    const urlPath = toUrlPath(rel);
    const priority = rel === 'index.html' ? '1.0' : HIGH_PRIORITY.has(rel) ? '0.9' : '0.8';
    const changefreq = rel === 'reconditionnes.html' ? 'daily' : priority === '1.0' ? 'weekly' : 'monthly';
    return [
      '  <url>',
      `    <loc>${BASE_URL}${urlPath}</loc>`,
      `    <lastmod>${TODAY}</lastmod>`,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      '  </url>'
    ].join('\n');
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
  console.log(`Sitemap généré : ${files.length} URLs publiées.`);
}

if (require.main === module) {
  buildSitemap();
}

module.exports = { buildSitemap, loadExclusions, toUrlPath };
