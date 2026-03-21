# Solution Phone — Site Web

Site vitrine cyberpunk rouge/noir pour **Solution Phone**, réparateur de smartphones certifié QualiRépar à Mâcon (71000).

## 📁 Structure du projet

```
solution-phone-site/
├── index.html                    ← Page principale (accueil)
├── reparation-iphone-macon.html  ← Page dédiée réparation iPhone
└── README.md
```

## 🖥️ Pages

### `index.html` — Accueil
- Barre promo QualiRépar -25€
- Hero avec badge + CTA WhatsApp
- Carrousel avis Google (5 avis)
- Ticker défilant
- Section "Pourquoi nous"
- Sélecteur d'appareils (Smartphone / PC / Tablette / Carte Mère)
- Section équipe avec **4 illustrations cyberpunk** (Sébastien, Evan, Nawfel, Rahim) embarquées en base64
- Services détaillés
- Compteurs animés (4000 réparations/an, 4.9/5, 30min, 10 ans)
- Tableau de tarifs iPhone complet
- "Comment ça marche" 3 étapes
- Contact + carte Google Maps
- Badge statut ouvert/fermé en temps réel

### `reparation-iphone-macon.html` — Réparation iPhone Mâcon
- SEO optimisé (title, meta, JSON-LD)
- Configurateur de devis instantané (modèle + panne → prix)
- Grille de pannes iPhone
- Tableaux de tarifs dynamiques (écrans 5 qualités + batteries)
  - Données chargées depuis Supabase si disponible
  - Fallback local automatique sinon
- Guide qualité des écrans
- FAQ accordéon (6 questions)
- Carrousel d'avis
- Contact + horaires

## ⚙️ Technologies

- **HTML/CSS/JS vanilla** — zéro framework, zéro dépendance npm
- **Google Fonts** — Orbitron, Rajdhani, Share Tech Mono (chargées en ligne)
- **Supabase** — tarifs iPhone en temps réel (fallback local intégré)
- **WhatsApp API** — lien direct `wa.me`
- **Images** — toutes les illustrations d'équipe sont en base64 (pas de serveur d'images requis)

## 🚀 Déploiement

### Option 1 : GitHub Pages (gratuit, recommandé)
1. Push ce repo sur GitHub
2. Settings → Pages → Source : `main` branch, dossier `/` (root)
3. Votre site sera dispo sur `https://votre-user.github.io/solution-phone-site/`

### Option 2 : Hébergement classique (OVH, Ionos...)
- Upload `index.html` et `reparation-iphone-macon.html` à la racine FTP
- Vérifier que les liens internes `href="reparation-iphone-macon.html"` sont corrects

### Option 3 : Vercel / Netlify (drop & deploy)
- Drag & drop du dossier sur app.netlify.com ou vercel.com
- Déploiement instantané

## 📞 Infos boutique

| | |
|---|---|
| **Adresse** | 21 Rue Gambetta, 71000 Mâcon |
| **Tel** | 03 85 33 06 89 |
| **WhatsApp** | 07 83 92 18 84 |
| **Email** | contact@solution-phone.fr |
| **Horaires** | Lun–Sam 9h15–12h15 / 14h–19h |

## 🛠️ Évolutions prévues

- [ ] Page Samsung / Toutes marques
- [ ] Page PC & Mac
- [ ] Blog / actualités réparation
- [ ] Formulaire de réservation en ligne
- [ ] Intégration Google Reviews en temps réel

## 📝 Notes développeur

- Les polices Google Fonts nécessitent une connexion internet. En cas d'absence de connexion, le navigateur utilise les polices système (Arial/sans-serif) — le site reste fonctionnel.
- Les tableaux de prix iPhone se chargent depuis Supabase (`kdvxcnjfrmvlnrymfyug.supabase.co`). Si Supabase est inaccessible, les données de fallback locales sont utilisées automatiquement.
- Le badge "Ouvert/Fermé" fonctionne sur le fuseau `Europe/Paris` grâce à `toLocaleString`.
