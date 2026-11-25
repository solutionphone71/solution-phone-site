# Audit préliminaire – Solution Phone (2026‑11‑26)

## 1️⃣ Technique
- Aucun serveur Express détecté avant l’ajout du fallback ; le script `faq_fallback_server.js` crée le point d’entrée `/faq-fallback`.
- Le widget `jason-widget.js` était dépourvu de gestion du fallback ; il a été enrichi d’un appel à `getFaqAnswer`.
- Le projet ne possédait pas de `package.json` ; il a été créé avec les dépendances nécessaires (`express`).
- Pas de tests automatisés – nous ajoutons un test Jest basique.

## 2️⃣ SEO
- Plusieurs pages manquaient de balises `<title>` et `<meta name="description">`.
- Aucun **Schema.org FAQ** n’était présent ; le script `scripts/seo_update.js` injecte le JSON‑LD basé sur `data/custom_faq.json`.
- Images sans attributs `alt` ; à corriger dans les pages produit.
- Performance : LCP > 3 s sur la page d’accueil à cause d’images lourdes.

## 3️⃣ UX / Conversion
- Formulaire de contact simple, pas de lead‑magnet.
- Aucun suivi d’événements (Google Tag Manager) ; nous ajoutons un container GTM.
- Aucune A/B‑testing de CTA.

## 4️⃣ Recommandations rapides (à implémenter)
1. **Installer les dépendances** → `npm install && npm i express`.
2. **Lancer le serveur** → `npm start`.
3. **Générer le sitemap** → `node scripts/generate_sitemap.js`.
4. **Exécuter les tests CI** → `npm test`.
5. **Déployer le Docker** → `docker build -t solution-phone-faq .` puis `docker run -p 3000:3000 solution-phone-faq`.
6. **Mettre en place GTM** (copier le snippet dans `gtm_container.js`).
7. **Créer le lead‑magnet** (`forms/lead.html`).
8. **Planifier le script Metricool** (`scripts/metricool_sync.py`).
9. **Configurer le monitoring** (`monitoring/grafana_dashboard.json`).

---
*Ce rapport sera mis à jour au fur et à mesure de la mise en œuvre des phases 1‑6.*