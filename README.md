# solution-phone.fr — site de Solution Phone (Mâcon)

Site public de **Solution Phone**, atelier de réparation de smartphones, tablettes et ordinateurs
au 21 rue Gambetta, 71000 Mâcon, depuis 2014. Réparateur labellisé QualiRépar.

## Publication

- Hébergement : **GitHub Pages** (Jekyll), domaine `solution-phone.fr` (fichier `CNAME`).
- Tout fichier du dépôt est publié, **sauf** ceux listés dans `_config.yml` (documents internes,
  outils, anciennes pages). Ne jamais exclure `scripts/consent-tracking.js` ni `scripts/landing-tracking.js`.
- GitHub Pages ne fait pas de redirection 301 : une page supprimée est remplacée par une page
  de redirection (`meta refresh` + `canonical` + lien visible), jamais par une 404.

## Pages principales

| Page | Rôle |
| --- | --- |
| `index.html` | Accueil, parcours devis (`quote-journey.js`, `quote-catalog.js`), assistant IA |
| `reparation-iphone.html`, `reparation-samsung.html` | Réparation par marque |
| `ecran-iphone-casse-macon.html`, `remplacement-batterie-telephone-macon.html`, `reparation-telephone-macon.html` | Pages de référencement local |
| `reconditionnes.html` | Stock de smartphones reconditionnés (`reconditionnes-v2.js`) |
| `accessoires.html`, `hydrogel.html` | Accessoires et protections d'écran |
| `atelier.html`, `magasin/macon/` | Équipe, magasin, accès, horaires des 3 boutiques |
| `faq.html`, `actualites.html` | Questions fréquentes, conseils |
| `cgv.html`, `politique-confidentialite.html` | Mentions légales, CGV, données personnelles |
| `roulette.html` | Jeu en boutique (ne pas modifier la mécanique) |

## Éléments communs

- `menu-commun.js` : menu commun aux 3 sites (chargé par `premium-nav.js`) — géré par un autre chantier.
- `contact-dock.js` / `.css` : barre fixe WhatsApp · appel · e-mail en bas d'écran.
- `scripts/consent-tracking.js` : bandeau cookies ; **rien n'est chargé avant l'accord** (Google Analytics, Crisp).
- `qualirepar-top.js` : bandeau QualiRépar (formulation unique et prudente).
- `accessibilite.css` : focus visible, contrastes, tailles minimales (chargée en dernier).
- `plan-acces.js` : plan Google Maps chargé seulement au clic sur « Voir le plan ».
- Prix : fonction Supabase `public-catalog` (prix finaux, 25 € déjà déduits).

## Contrôles avant publication

```sh
sh scripts/check-forbidden-visuals.sh   # aucune photo interdite (microscope, outils, plan de travail)
python3 scripts/verifier-site.py        # JSON-LD, liens et images locaux, sitemap, versions ?v=, faits clés
python3 -m http.server 4191             # vérification visuelle (mobile 375 px et ordinateur)
```

Les faits métier (adresse, horaires, téléphones, garanties, prix repères, formulation QualiRépar)
sont décrits dans `AGENTS.md`.
