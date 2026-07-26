export type BusinessFact = { topic: string; answer: string }

export function networkKnowledgeSlug(message: string) {
  if (/\b(wi[ -]?fi|bluetooth)\b/.test(message)) return null
  const asksMobileNetwork = /\b(reseau(?: mobile)?|aucun service|pas de reseau|sim|e[ -]?sim|appel(?:s)? impossible(?:s)?|plus de barres?)\b/.test(message)
  const mentionsPhone = /\b(telephone|smartphone|iphone|android|samsung|xiaomi|redmi|honor|huawei|oppo|realme|pixel|oneplus|motorola|appareil|sim|e[ -]?sim)\b/.test(message)
  return asksMobileNetwork && mentionsPhone ? 'aucun-reseau-sim' : null
}

export function businessFactAnswer(message: string): BusinessFact | null {
  const shopOrDateContext = /\b(boutique|magasin|solution phone|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|aujourd hui|demain|ce matin|cet apres midi|ce soir|quelle heure)\b/.test(message)
  const deviceOrAppContext = /\b(application|appli|fichier|page|photo|camera|calendrier|telephone|smartphone|ecran|message|jeu|logiciel)\b/.test(message)
  const explicitOpeningState = /\b(horaires?|ouvert|ouverte|ouverts|ouvertes|ferme|fermee|fermes|fermees|fermeture|ouverture)\b/.test(message)
  const openingVerbWithContext = /\b(ouvre|ouvrez|ouvrez vous|fermez|fermez vous)\b/.test(message) &&
    (shopOrDateContext || (/\bquand\b/.test(message) && !deviceOrAppContext))
  const asksShopHours = (explicitOpeningState || openingVerbWithContext) &&
    !/\bfuseau(?:x)? horaire|reglage horaire|heure du telephone|date et heure\b/.test(message) &&
    !(deviceOrAppContext && !shopOrDateContext)
  if (asksShopHours) {
    return {
      topic: 'Horaires de la boutique',
      answer: 'Oui, la boutique est ouverte le lundi de 9h15 à 12h15 puis de 14h à 19h. Du mardi au samedi, elle est ouverte en continu de 9h15 à 19h. Elle est fermée le dimanche.',
    }
  }
  if (/\b(adresse|ou etes vous|ou se trouve|localisation|itineraire|venir au magasin)\b/.test(message)) {
    return {
      topic: 'Adresse de la boutique',
      answer: 'Solution Phone est au 21 rue Gambetta, 71000 Mâcon. Vous pouvez venir sans rendez-vous.',
    }
  }
  const asksContactDetails = /\b(numero(?: de telephone)?|telephone de la boutique|appeler (?:la boutique|le magasin|solution phone|vous)|vous joindre|vous contacter|comment (?:vous )?contacter|je (?:veux|souhaite) (?:vous )?contacter|puis je (?:vous )?contacter|contact (?:boutique|magasin|solution phone)|vos coordonnees)\b/.test(message)
  if (asksContactDetails && !/\b(prix|tarif|combien|coute)\b/.test(message)) {
    return {
      topic: 'Contacter la boutique',
      answer: 'Vous pouvez appeler la boutique au 03 85 33 06 89 ou écrire sur WhatsApp au 07 83 92 18 84.',
    }
  }
  return null
}

export function knowledgeMatchAllowed(message: string, slug: string) {
  const asksDeviceClock = /\b(heure|date|fuseau horaire)\b/.test(message) &&
    /\b(telephone|smartphone|iphone|android|samsung|appareil)\b/.test(message)
  if (asksDeviceClock) return /heure|date|fuseau/.test(slug)
  if (slug === 'bonus-qualirepar') {
    return /\b(qualirepar|bonus|remise|25\s*(?:euros?|eur))\b/.test(message)
  }
  if (slug === 'moyens-paiement') {
    return /\b(payer|paiement|regler|acompte|especes|sans contact|apple pay|google pay|cb|carte bleue|plusieurs fois|3 fois)\b/.test(message) ||
      /moyens? de paiement|acceptez.{0,30}(?:carte|cb|especes)/.test(message)
  }
  if (slug === 'prix-ecran-ordinateur') {
    return /\b(ecran|dalle|affichage|display|image|pixels?)\b/.test(message) &&
      /\b(pc|ordinateur|macbook|imac|laptop|portable)\b/.test(message)
  }
  if (slug === 'prix-batterie-pc-mac') {
    return /\b(batterie|autonomie|chargeur|ne tient plus la charge)\b/.test(message)
  }
  if (slug === 'prix-nettoyage-virus-pc') {
    return /\b(virus|malware|logiciel malveillant|publicites?|pubs?|pop[ -]?ups?|infecte)\b/.test(message)
  }
  if (slug === 'prix-disque-windows') {
    return /\b(disque dur|ssd|windows|reinstall|demarrage|boot)\w*\b/.test(message)
  }
  if (slug === 'carte-mere-microsoudure') {
    return /\b(carte mere|micro[ -]?soudure|baseband|court circuit|composant)\b/.test(message)
  }
  return true
}
