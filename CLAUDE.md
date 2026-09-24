# Consignes pour les agents — solution-phone.fr

Tout en français (commits, textes, rapports). Parler simplement au dirigeant.

## Règle visuelle
- Ne jamais utiliser de photo de microscope, d'outils alignés, de tapis ou de plan de travail dans une page publique.
- Préférer les photos humaines de la boutique, les appareils, les composants propres, les visuels de marque ou un bloc typographique sans photo.
- Avant de terminer une modification visuelle, exécuter `sh scripts/check-forbidden-visuals.sh`.

## Faits métier (source unique)
- Solution Phone, 21 rue Gambetta, 71000 Mâcon, depuis 2014 ; 3 boutiques côte à côte (Solution Phone, Solution Accessoires, Solution Informatique), EURL Solution Phone, RCS Mâcon 801 044 785.
- GPS : 46.3025, 4.8297.
- Téléphones : Solution Phone 03 85 33 06 89 ; Solution Accessoires 06 02 84 99 53 ; Solution Informatique 07 48 34 87 43 ; WhatsApp 07 83 92 18 84 ; contact@solution-phone.fr.
- Horaires Solution Phone : lundi 9h15–12h15 / 14h–19h ; mardi–samedi 9h15–19h ; dimanche fermé. Solution Accessoires : mardi–samedi 10h–12h / 14h–19h.
- Équipe : cinq personnes, dont trois réparateurs.
- Délai : « généralement en moins d'une heure si la pièce est en stock ».
- Garanties : réparations 6 mois ; reconditionnés 12 mois (30 points de contrôle) ; hydrogel : défaut du produit 6 mois seulement.
- Paiements : carte, espèces (1 000 € maximum), Apple Pay, virement. Pas de chèque, pas de paiement en plusieurs fois.
- Avis : « 4,7/5 · plus de 700 avis Google » (Solution Accessoires : « 5,0/5 · 20 avis »).
- QualiRépar (formulation unique) : « Réparateur labellisé QualiRépar. 25 € déjà déduits de nos tarifs de réparation de smartphone : grâce au Bonus Réparation QualiRépar quand la réparation est éligible, offerts par Solution Phone sinon. » Jamais « certifié », « l'État finance », « agréé par l'État ».
- Toujours afficher le prix final ; message WhatsApp « Bonjour Solution Phone, … » sans « urgente ».

## À ne pas casser
- Parcours devis de l'accueil, page reconditionnés, consentement cookies (rien avant accord), barre de contact, plan « Voir le plan », bloc « Depuis 2014 », menu commun.
- Ne changer aucune URL ; une page supprimée devient une redirection (meta refresh + canonical + lien).
- Supprimer un fichier seulement après un `grep -r` sur tout le dépôt prouvant qu'il n'est référencé nulle part.
- CGV : les clauses juridiques sont revues par un avocat, ne pas les réécrire.
