const endpoint = 'https://kdvxcnjfrmvlnrymfyug.supabase.co/functions/v1/evan-brain'
const key = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_3Mub3jSj8wUC8mfFtAuhdA_P4Ljnnhb'
const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  Origin: 'http://localhost:4175',
  'Content-Type': 'application/json',
}

const cases = [
  ['horaires', 'le magasin est-il ouvert lundi ?', 'business_fact', /9h15 à 12h15/],
  ['adresse', 'quelle est votre adresse ?', 'business_fact', /21 rue Gambetta/],
  ['contact', 'comment appeler la boutique ?', 'business_fact', /03 85 33 06 89/],
  ['écran connecté', 'combien coûte un écran iPhone 13 ?', 'live_price', /compatible 45 €.*ReLife 115 €/],
  ['écran qualité absente expliquée', 'combien coûte un écran iPhone 15 ?', 'live_price', /compatible 50 €.*Soft OLED 105 €.*ReLife 185 €.*LTPS Prime n’est pas proposé/],
  ['batterie connectée', 'prix batterie iPhone 14 Pro', 'live_price', /compatible 65 €.*originale 115 €/],
  ['prix absent', 'prix écran iPhone 17 Pro', 'live_price', /pas de tarif validé/],
  ['stock connecté', 'avez-vous un iPhone 13 reconditionné en stock ?', 'live_stock', /iPhone 13/i],
  ['ordinateur', 'combien coûte un écran ordinateur ?', 'knowledge', /100 et 170 €/],
  ['charge honnête', 'mon iPhone charge mal', 'knowledge', /nettoyage du connecteur à 10 €/],
  ['QualiRépar', 'comment fonctionne le bonus QualiRépar ?', 'knowledge', /25 €/],
  ['batterie Android', 'combien coûte une batterie Samsung ?', 'knowledge', /30 €.*45 €/],
  ['virus Android', 'mon téléphone Android a des publicités et des virus', 'knowledge', /10 €/],
  ['transfert', 'je veux transférer mes données vers un nouveau smartphone', 'knowledge', /30 €/],
  ['vitre arrière Android', 'prix vitre arrière Samsung', 'knowledge', /35 €/],
  ['sans rendez-vous', 'est-ce que je dois prendre rendez-vous ?', 'knowledge', /sans rendez-vous/i],
  ['qualité écran Android', 'écran Samsung compatible ou Service Pack ?', 'knowledge', /compatible.*Service Pack/i],
  ['garantie', 'quelle garantie après une réparation ?', 'knowledge', /garanti/i],
  ['oxydation sûre', 'que faire si mon téléphone est oxydé ?', 'diagnostic', /éteindre.*ne plus le charger.*oxydation/i],
  ['chauffe dangereuse', 'mon téléphone chauffe très fort et sent le brûlé', 'knowledge', /débranchez-le.*ne le rechargez plus.*inflammables/i],
  ['réseau mobile orienté', 'j ai un probleme de reseau sur mon iphone', 'diagnostic', /couverture[\s\S]*SIM\/eSIM[\s\S]*réglage[\s\S]*modèle exact/i],
  ['hors périmètre', 'réparez-vous les réfrigérateurs ?', 'outside_scope', /ne peux pas confirmer/],
]

let failures = 0
for (const [name, message, expectedMode, expectedAnswer] of cases) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, context: { page: 'automated-eval', consent_to_store: false } }),
  })
  const data = await response.json()
  const stockIsClean = name !== 'stock connecté' || !/ipad/i.test(data.answer || '')
  const networkIsClean = name !== 'réseau mobile orienté' || (!/panne de carte mère peut|Je…/i.test(data.answer || '') && data.diagnostic_active === true)
  const passed = response.ok && data.mode === expectedMode && expectedAnswer.test(data.answer || '') && stockIsClean && networkIsClean
  if (!passed) failures += 1
  console.log(`${passed ? '✓' : '✗'} ${name} — ${data.mode || response.status}`)
  if (!passed) console.log(data)
}

const eventResponse = await fetch(endpoint, {
  method: 'POST',
  headers,
  body: JSON.stringify({ event: 'assistant_opened', event_metadata: { source: 'automated_eval' }, context: { page: 'automated-eval', consent_to_store: false } }),
})
const eventData = await eventResponse.json()
const eventPassed = eventResponse.ok && eventData.event_recorded === true && Boolean(eventData.conversation_token)
if (!eventPassed) failures += 1
console.log(`${eventPassed ? '✓' : '✗'} mesure de conversion`)

if (failures) {
  console.error(`\n${failures} test(s) en échec.`)
  process.exitCode = 1
} else {
  console.log(`\n${cases.length + 1} tests réussis.`)
}
