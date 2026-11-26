#!/usr/bin/env node
/**
 * seo_update.js — Synchronise de façon idempotente les questions de
 * data/custom_faq.json dans le bloc JSON-LD FAQPage de faq.html
 * sans jamais dupliquer les balises <script type="application/ld+json">.
 */
const fs = require('fs');
const path = require('path');

function mergeFaqQuestions(existingEntities, incomingFaqs) {
  const seen = new Set(
    (existingEntities || []).map((q) => String(q.name || '').trim().toLowerCase())
  );
  const merged = Array.isArray(existingEntities) ? existingEntities.slice() : [];
  for (const item of incomingFaqs) {
    const key = String(item.question || '').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push({
      '@type': 'Question',
      name: item.question.trim(),
      acceptedAnswer: {
        '@type': 'Answer',
        text: String(item.answer || '').trim()
      }
    });
  }
  return merged;
}

function updateFAQPage(filePath, faqs) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fichier introuvable : ${filePath}`);
  }
  const html = fs.readFileSync(filePath, 'utf8');
  const scriptRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let updated = false;

  const newHtml = html.replace(scriptRegex, (fullMatch, jsonText) => {
    if (updated) return fullMatch;
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed['@type'] === 'FAQPage') {
        parsed.mainEntity = mergeFaqQuestions(parsed.mainEntity, faqs);
        updated = true;
        return `<script type="application/ld+json">\n${JSON.stringify(parsed, null, 2)}\n</script>`;
      }
      if (Array.isArray(parsed['@graph'])) {
        const faqNode = parsed['@graph'].find((n) => n['@type'] === 'FAQPage');
        if (faqNode) {
          faqNode.mainEntity = mergeFaqQuestions(faqNode.mainEntity, faqs);
          updated = true;
          return `<script type="application/ld+json">\n${JSON.stringify(parsed, null, 2)}\n</script>`;
        }
      }
    } catch (e) {
      // Laisse intact un autre bloc non-FAQ
    }
    return fullMatch;
  });

  if (updated) {
    fs.writeFileSync(filePath, newHtml, 'utf8');
    console.log('FAQPage JSON-LD mis à jour :', filePath);
    return true;
  }

  if (faqs.length === 0) {
    console.log('Aucune question personnalisée à injecter pour', filePath);
    return false;
  }

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: mergeFaqQuestions([], faqs)
  };
  const injected = html.replace(
    /<\/head>/i,
    `<script type="application/ld+json">\n${JSON.stringify(jsonld, null, 2)}\n</script>\n</head>`
  );
  fs.writeFileSync(filePath, injected, 'utf8');
  console.log('FAQPage JSON-LD créé :', filePath);
  return true;
}

if (require.main === module) {
  const faqFile = path.join(__dirname, '..', 'data', 'custom_faq.json');
  if (fs.existsSync(faqFile)) {
    const data = JSON.parse(fs.readFileSync(faqFile, 'utf8'));
    const faqs = Object.entries(data).map(([question, answer]) => ({ question, answer }));
    ['faq.html'].forEach((p) => updateFAQPage(path.join(__dirname, '..', p), faqs));
  }
}

module.exports = { updateFAQPage, mergeFaqQuestions };
