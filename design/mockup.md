# Design mock‑up – Solution Phone

## Home page
- **Header** : logo Montserrat, navigation en blanc, bouton CTA rouge `#E10600` « Obtenir un devis ». 
- **Hero** : image pleine largeur (WebP), texte centré « Réparation express, garantie 12 mois », bouton « Parler à Sébastien » qui ouvre le widget Jason.
- **Section FAQ** : cartes avec icône `?`, texte court, bouton « Voir la réponse » qui déclenche le widget.
- **Footer** : liens légaux, icônes réseaux (Instagram, Facebook, GBP) en blanc.

## Page produit (ex. iPhone 13 reconditionné)
- **Galerie** : images `srcset` + lazy‑load, overlay prix `#E10600`.
- **Infos** : titre Montserrat, description, tableau caractéristiques.
- **CTA** : bouton rouge « Ajouter au panier », second bouton « Chat avec Sébastien ».
- **Schema.org** : balise `Product` + `Offer`.

## FAQ page
- **Accordéon** : chaque question est un `details/summary` avec style Montserrat.
- **Bouton fallback** : `« Pas de réponse ? »` qui ouvre le widget.
- **JSON‑LD** injecté via `scripts/seo_update.js`.

## Formulaire captation de leads
- **Titre** : « Téléchargez notre guide d’entretien gratuit ». 
- **Champ email** (type email) + prénom. 
- **Checkbox RGPD** (non cochée par défaut) avec texte : « J’accepte que mes données soient utilisées pour recevoir le guide ». 
- **Bouton** : rouge `#E10600`, texte « Télécharger ».
- **Design** : bordure `1px solid #E10600`, fond blanc, police Montserrat.

> Tous les éléments respectent la charte couleur (`#0D0D0D / #FFFFFF / #E10600`) et la police Montserrat.
