#!/usr/bin/env node
/**
 * Serveur Express local exposant :
 *  - GET /faq-fallback : recherche dans data/custom_faq.json via scripts/faq_fallback.py
 *  - POST /api/lead : réception des demandes de devis / conseil reconditionné
 */
const express = require('express');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const BLOCKED_PREFIXES = [
  '/data',
  '/scripts',
  '/tests',
  '/seo',
  '/supabase',
  '/node_modules',
  '/docs',
  '/design'
];

const BLOCKED_FILES = new Set([
  '/AGENTS.md',
  '/CLAUDE.md',
  '/README.md',
  '/AUDIT-V2-CONTINU.md',
  '/SEBASTIEN-ACCEPTATION.md',
  '/SEBASTIEN-ARCHITECTURE.md',
  '/package.json',
  '/package-lock.json',
  '/bun.lock',
  '/faq_fallback_server.js',
  '/_config.yml'
]);

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Empêche l'exposition HTTP des fichiers internes et scripts serveur
app.use((req, res, next) => {
  let reqPath;
  try {
    reqPath = decodeURIComponent(req.path || '/');
  } catch (e) {
    return res.status(400).end();
  }
  const segments = reqPath.split('/').filter(Boolean);
  if (segments.some((seg) => seg.startsWith('.'))) {
    return res.status(404).end();
  }
  if (BLOCKED_FILES.has(reqPath)) {
    return res.status(404).end();
  }
  if (BLOCKED_PREFIXES.some((prefix) => reqPath === prefix || reqPath.startsWith(prefix + '/'))) {
    // Autorise uniquement les scripts publics de consentement/tracking
    if (reqPath !== '/scripts/consent-tracking.js' && reqPath !== '/scripts/landing-tracking.js') {
      return res.status(404).end();
    }
  }
  return next();
});

// Sert uniquement la racine publique du site (jamais le répertoire parent)
app.use(express.static(__dirname, { dotfiles: 'ignore' }));

const REFURBISHED_SUGGESTIONS = [
  { name: 'iPhone 13 reconditionné', warranty: '12 mois', url: '/reconditionnes.html#stock' },
  { name: 'Samsung Galaxy S23 reconditionné', warranty: '12 mois', url: '/reconditionnes.html#stock' },
  { name: 'Reprise de votre ancien téléphone', warranty: 'Estimation 10 min', url: '/rachat-reprise-telephone-macon.html' }
];

app.get('/faq-fallback', (req, res) => {
  const question = String(req.query.question || '').trim();
  if (!question) {
    return res.status(400).json({ status: 'error', error: 'question missing' });
  }
  const scriptPath = path.join(__dirname, 'scripts', 'faq_fallback.py');
  const child = spawn('python3', [scriptPath, question]);
  let stdout = '';
  child.stdout.on('data', (data) => { stdout += data.toString(); });
  child.stderr.on('data', (data) => { console.error('stderr:', data.toString()); });
  child.on('error', () => {
    if (!res.headersSent) {
      res.status(500).json({ status: 'error', error: 'Failed to execute FAQ script' });
    }
  });
  child.on('close', () => {
    if (res.headersSent) return;
    try {
      const json = JSON.parse(stdout);
      res.json(json);
    } catch (e) {
      res.status(500).json({ status: 'error', error: 'Invalid response from script' });
    }
  });
});

app.post('/api/lead', async (req, res) => {
  const { prenom, email, consent, besoin, modele, website } = req.body || {};
  if (String(website || '').trim()) {
    return res.status(400).json({ error: 'Requête refusée.' });
  }
  const cleanPrenom = String(prenom || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
  const cleanEmail = String(email || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 254);
  const safeModele = escapeHtml(String(modele || '').trim().slice(0, 80));
  const hasConsent = consent === true || consent === 'on' || consent === 'true';

  if (!cleanPrenom || !cleanEmail || !hasConsent) {
    return res.status(400).json({ error: 'Champs obligatoires manquants (prénom, e-mail, consentement).' });
  }
  if (cleanPrenom.length < 2) {
    return res.status(400).json({ error: 'Indiquez votre prénom (au moins 2 caractères).' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail) || cleanEmail.length < 5 || cleanEmail.length > 254) {
    return res.status(400).json({ error: 'Adresse e-mail invalide.' });
  }

  // Envoi optionnel via Brevo (uniquement si BREVO_API_KEY est configuré)
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  if (BREVO_API_KEY && typeof fetch === 'function') {
    try {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: { name: 'Solution Phone Mâcon', email: 'contact@solution-phone.fr' },
          to: [{ email: cleanEmail, name: cleanPrenom }],
          subject: 'Votre demande chez Solution Phone Mâcon',
          htmlContent: `<p>Bonjour,</p><p>Votre demande (${besoin === 'reconditionne' ? 'conseil smartphone reconditionné' : 'devis de réparation'}${safeModele ? ' — ' + safeModele : ''}) a bien été enregistrée.</p><p>Découvrez notre stock reconditionné garanti 12 mois : <a href="https://solution-phone.fr/reconditionnes.html">Voir le stock à Mâcon</a>.</p><p>L’équipe Solution Phone · 21 rue Gambetta, 71000 Mâcon · 03 85 33 06 89</p>`
        })
      });
    } catch (e) {
      console.error('Brevo send error');
    }
  }

  return res.json({
    status: 'ok',
    received: true,
    message: 'Votre demande a bien été enregistrée par Solution Phone Mâcon.',
    suggestions: REFURBISHED_SUGGESTIONS
  });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`FAQ fallback server listening on port ${PORT}`));
}

app.escapeHtml = escapeHtml;
module.exports = app;
