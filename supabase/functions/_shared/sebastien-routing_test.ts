import { businessFactAnswer, knowledgeMatchAllowed, networkKnowledgeSlug } from './sebastien-routing.ts'

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message)
}

Deno.test('répond aux vrais horaires de boutique', () => {
  assert(businessFactAnswer('le magasin est il ouvert lundi')?.topic === 'Horaires de la boutique', 'horaires non reconnus')
})

Deno.test('ne confond pas fuseau horaire et horaires de boutique', () => {
  assert(businessFactAnswer('mon telephone change de fuseau horaire') === null, 'faux positif horaires')
  assert(!knowledgeMatchAllowed('l heure de mon telephone est fausse', 'haut-parleur-externe'), 'faux positif haut-parleur')
})

Deno.test('ne confond pas ouverture d application et horaires de boutique', () => {
  assert(businessFactAnswer('mon smartphone redemarre quand j ouvre l application calendrier') === null, 'faux positif application')
  assert(businessFactAnswer('l application photos ne s ouvre plus') === null, 'faux positif ouverture application')
})

Deno.test('comprend les formulations naturelles sur l ouverture', () => {
  assert(businessFactAnswer('vous ouvrez a quelle heure mardi')?.topic === 'Horaires de la boutique', 'question naturelle non reconnue')
})

Deno.test('ne confond pas une coque qui s ouvre avec le magasin', () => {
  assert(businessFactAnswer('la charniere est cassee et la coque s ouvre pouvez vous la reparer') === null, 'faux positif ouverture magasin')
})

Deno.test('ne confond pas contact liquide et coordonnées de boutique', () => {
  assert(businessFactAnswer('mon telephone ne s allume plus apres contact avec l eau') === null, 'faux positif contact liquide')
  assert(businessFactAnswer('comment vous contacter')?.topic === 'Contacter la boutique', 'demande de contact non reconnue')
})

Deno.test('ne confond pas carte bancaire et demande de paiement', () => {
  assert(!knowledgeMatchAllowed('le mode avion s active pres de ma carte bancaire', 'moyens-paiement'), 'faux positif paiement')
})

Deno.test('conserve une vraie question sur les moyens de paiement', () => {
  assert(knowledgeMatchAllowed('est ce que je peux payer par carte bancaire', 'moyens-paiement'), 'paiement légitime rejeté')
})

Deno.test('ne transforme pas toute panne ordinateur en prix d écran', () => {
  assert(!knowledgeMatchAllowed('mon ordinateur fait un bruit etrange apres une chute', 'prix-ecran-ordinateur'), 'faux prix écran PC')
  assert(!knowledgeMatchAllowed('mon ecran de telephone est casse', 'prix-ecran-ordinateur'), 'écran téléphone classé comme écran PC')
  assert(!knowledgeMatchAllowed('mon ecran est casse', 'prix-ecran-ordinateur'), 'appareil ambigu classé comme écran PC')
  assert(knowledgeMatchAllowed('la dalle de mon ordinateur est cassee', 'prix-ecran-ordinateur'), 'vraie panne écran PC rejetée')
})

Deno.test('filtre les tarifs PC par symptôme explicite', () => {
  assert(!knowledgeMatchAllowed('mon pc fait un bruit etrange', 'prix-batterie-pc-mac'), 'faux prix batterie PC')
  assert(!knowledgeMatchAllowed('mon pc fait un bruit etrange', 'prix-nettoyage-virus-pc'), 'faux nettoyage virus PC')
  assert(knowledgeMatchAllowed('la batterie de mon macbook ne tient plus la charge', 'prix-batterie-pc-mac'), 'vraie batterie Mac rejetée')
  assert(knowledgeMatchAllowed('mon ordinateur affiche des publicites et semble infecte', 'prix-nettoyage-virus-pc'), 'vrai virus PC rejeté')
})

Deno.test('oriente un problème réseau mobile vers le diagnostic réseau', () => {
  assert(networkKnowledgeSlug('j ai un probleme de reseau sur mon iphone') === 'aucun-reseau-sim', 'réseau iPhone non reconnu')
  assert(networkKnowledgeSlug('aucun service sur mon samsung') === 'aucun-reseau-sim', 'aucun service non reconnu')
  assert(networkKnowledgeSlug('ma esim ne marche plus') === 'aucun-reseau-sim', 'eSIM non reconnue')
})

Deno.test('ne confond pas Wi-Fi et réseau mobile', () => {
  assert(networkKnowledgeSlug('le wifi de mon iphone ne fonctionne plus') === null, 'Wi-Fi classé comme réseau mobile')
})

Deno.test('ne présente pas la carte mère sans symptôme explicite', () => {
  assert(!knowledgeMatchAllowed('j ai un probleme de reseau sur mon iphone', 'carte-mere-microsoudure'), 'carte mère proposée trop tôt')
  assert(knowledgeMatchAllowed('mon iphone indique une panne baseband', 'carte-mere-microsoudure'), 'baseband explicite rejeté')
})
