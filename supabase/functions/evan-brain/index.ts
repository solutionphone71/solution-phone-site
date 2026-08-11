import { createClient } from 'npm:@supabase/supabase-js@2.95.0'
import { alignAIAnswerWithQuestion, estimateAIResponseCost, openAIOutputText, parseAIAnswer, type AIAnswer } from '../_shared/sebastien-ai.ts'
import { businessFactAnswer, knowledgeMatchAllowed, networkKnowledgeSlug } from '../_shared/sebastien-routing.ts'

const ALLOWED_ORIGINS = new Set([
  'https://solution-phone.fr',
  'https://www.solution-phone.fr',
  'https://reparation-iphone-macon.fr',
  'https://www.reparation-iphone-macon.fr',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:4174',
  'http://127.0.0.1:4174',
  'http://localhost:4175',
  'http://127.0.0.1:4175',
])

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN') ?? ''
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') ?? '1162686630271783'
const EVAN_OWNER_WHATSAPP = (Deno.env.get('EVAN_OWNER_WHATSAPP') ?? '33752624241').replace(/\D/g, '')
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? ''
const SEBASTIEN_AI_MODEL = Deno.env.get('SEBASTIEN_AI_MODEL') ?? 'gpt-5-mini'
const SEBASTIEN_AI_MONTHLY_LIMIT = Math.max(0, Number(Deno.env.get('SEBASTIEN_AI_MONTHLY_LIMIT') ?? '1000'))
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

type EvanRequest = {
  message?: string
  conversation_token?: string
  poll?: boolean
  feedback?: 'helpful' | 'not_helpful'
  knowledge_id?: string
  event?: 'assistant_opened' | 'answer_shown' | 'price_shown' | 'stock_shown' | 'handoff_offered' | 'whatsapp_clicked' | 'email_clicked'
  event_metadata?: Record<string, unknown>
  context?: {
    brand?: string
    model?: string
    consent_to_store?: boolean
    page?: string
  }
}

type KnowledgeMatch = {
  id: string
  slug: string
  category: string
  title: string
  answer: string
  follow_up_questions: string[]
  warnings: string[]
  sales_suggestions: Array<{ label: string; reason?: string }>
  confidence: number
  score: number
}

type DiagnosticStep = {
  key: string
  question: string
  options?: string[]
}

type DiagnosticFlow = {
  slug: string
  knowledge_slug: string
  title: string
  steps: DiagnosticStep[]
  completion_message: string
  destination: 'solution_phone' | 'solution_accessoires' | 'solution_informatique'
  max_questions: number
}

type DiagnosticState = {
  flow_slug: string
  knowledge_slug: string
  step_index: number
  answers: Record<string, string>
  started_at: string
  questions_asked: number
}

type LiveDirectAnswer = {
  topic: string
  answer: string
  model?: string
  repair?: 'screen' | 'battery'
  needs_detail?: boolean
  needs_handoff?: boolean
}

function corsHeaders(origin: string) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'Vary': 'Origin',
  }
  if (ALLOWED_ORIGINS.has(origin)) headers['Access-Control-Allow-Origin'] = origin
  return headers
}

function json(origin: string, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) })
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+\- ]/g, ' ')
    .replace(/\btrotinette\b/g, 'trottinette')
    .replace(/\bbateri(?:e)?\b/g, 'batterie')
    .replace(/\bchargur\b/g, 'chargeur')
    .replace(/\bcharg\b/g, 'charge')
    .replace(/\bordis?\b/g, 'ordinateur')
    .replace(/\btel\b/g, 'telephone')
    .replace(/\s+/g, ' ')
    .trim()
}

function sanitizeForLearning(value: string) {
  return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[e-mail]')
    .replace(/https?:\/\/\S+|www\.\S+/gi, '[lien]')
    .replace(/(?:\+33|0033|0)[\s.-]?[1-9](?:[\s.-]?\d{2}){4}\b/g, '[téléphone]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1200)
}

function conciseAnswer(value: string, maxLength = 300) {
  const clean = value.replace(/\s+/g, ' ').trim()
  const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean]
  let short = sentences.slice(0, 2).join(' ').replace(/\s+/g, ' ').trim()
  if (short.length > maxLength) {
    short = short.slice(0, maxLength - 1)
    const lastSpace = short.lastIndexOf(' ')
    if (lastSpace > maxLength * 0.7) short = short.slice(0, lastSpace)
    short += '…'
  }
  return short
}

function conciseAIVisible(value: string, maxLength: number) {
  const clean = value.replace(/\s+/g, ' ').trim()
  if (clean.length <= maxLength) return clean
  const clauses = clean.match(/[^.;!?]+[.;!?]+|[^.;!?]+$/g) || [clean]
  let result = ''
  for (const clause of clauses) {
    const candidate = `${result} ${clause}`.trim()
    if (candidate.length > maxLength) break
    result = candidate
  }
  if (result) return result.replace(/[;:]$/, '.')
  return conciseAnswer(clean, maxLength)
}

const TRACKED_EVENTS = new Set([
  'assistant_opened', 'answer_shown', 'price_shown', 'stock_shown',
  'handoff_offered', 'whatsapp_clicked', 'email_clicked',
])

function cleanEventMetadata(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key, item]) => /^[a-z0-9_]{1,40}$/.test(key) && ['string', 'number', 'boolean'].includes(typeof item))
    .slice(0, 12)
    .map(([key, item]) => [key, typeof item === 'string' ? item.slice(0, 160) : item]))
}

function extractIphoneModel(message: string) {
  const match = message.match(/\biphone\s*(se\s*[23]|(?:1[0-7]|[6-9]|x|xs|xr)(?:\s*(?:pro\s*max|pro|max|plus|mini|air))?)/i)
  return match ? `iPhone ${match[1].replace(/\s+/g, ' ').trim()}` : ''
}

function normalizedIphoneModel(value: string) {
  return normalize(value).replace(/^iphone\s*/, '').replace(/\bmax pro\b/, 'pro max')
}

function displayIphoneModel(value: string) {
  return value.replace(/\b(pro|max|plus|air|se)\b/gi, (word) => word.toUpperCase() === 'SE' ? 'SE' : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
}

function matchesPriceRow(requestedModel: string, rowModel: string) {
  const requested = normalizedIphoneModel(requestedModel)
  const candidates = normalizedIphoneModel(rowModel).split('/').map((item) => item.trim())
  return candidates.includes(requested) || candidates.some((item) => item === requested.replace(/ plus$/, '+'))
}

async function liveIphonePriceAnswer(message: string): Promise<LiveDirectAnswer | null> {
  const asksPrice = /\b(prix|tarif|combien|coute|cout)\b/.test(message)
  // Une vitre arrière est une réparation de dos, pas un écran avant.
  // Elle doit suivre la connaissance validée dédiée et son tarif indicatif.
  if (/\b(vitre arriere|dos arriere|face arriere)\b/.test(message)) return null
  const repair = /\b(batterie|autonomie)\b/.test(message) ? 'batterie' : /\b(ecran|vitre|affichage|tactile|dalle)\b/.test(message) ? 'ecran' : ''
  if (!asksPrice || !repair || !/\biphone\b/.test(message)) return null

  const model = displayIphoneModel(extractIphoneModel(message))
  if (!model) return {
    topic: 'Tarif iPhone',
    answer: `Quel modèle exact d’iPhone avez-vous ? Le tarif ${repair === 'ecran' ? 'de l’écran' : 'de la batterie'} dépend du modèle.`,
    needs_detail: true,
  }

  const settingKey = repair === 'ecran' ? 'ecrans_prix_json' : 'batteries_prix_json'
  const { data, error } = await admin.from('settings').select('value').eq('key', settingKey).maybeSingle()
  if (error) throw error
  if (!data?.value) return null

  let rows: Array<{ modele: string; prix: Array<number | null> }> = []
  try {
    const parsed = JSON.parse(data.value)
    rows = repair === 'ecran' ? [...(parsed.t1 || []), ...(parsed.t2 || [])] : parsed
  } catch {
    return null
  }
  const row = rows.find((item) => matchesPriceRow(model, item.modele))
  if (!row) return {
    topic: `Tarif ${model}`,
    answer: `Je n’ai pas de tarif validé en ligne pour ${model}. Envoyez le modèle sur WhatsApp ou par e-mail : l’équipe vérifiera la pièce et le prix exact.`,
    needs_handoff: true,
  }

  const prices = (row.prix || []).map(Number)
  let details: string[] = []
  let unavailable: string[] = []
  if (repair === 'ecran') {
    const compatible = [prices[0], prices[1]].filter((price) => price > 0).sort((a, b) => a - b)[0]
    const choices: Array<[string, number]> = [
      ['compatible', compatible || 0],
      ['LTPS Prime', prices[2] || 0],
      ['Soft OLED', prices[3] || 0],
      ['ReLife', prices[4] || 0],
    ]
    details = choices.filter(([, price]) => price > 0).map(([label, price]) => `${label} ${price} €`)
    unavailable = choices.filter(([, price]) => price <= 0).map(([label]) => label)
  } else {
    details = [
      prices[0] > 0 ? `compatible ${prices[0]} €` : '',
      prices[1] > 0 ? `TI reconnue ${prices[1]} €` : '',
      prices[2] > 0 ? `originale ${prices[2]} €` : '',
    ].filter(Boolean)
  }
  if (!details.length) return null
  const unavailableText = unavailable.length
    ? ` ${unavailable.join(' et ')} ${unavailable.length > 1 ? 'ne sont pas proposés' : 'n’est pas proposé'} pour ce modèle dans les tarifs actuels.`
    : ''
  return {
    topic: `${repair === 'ecran' ? 'Écran' : 'Batterie'} ${model}`,
    answer: `${repair === 'ecran' ? 'Écran' : 'Batterie'} ${model} : ${details.join(' · ')}.${unavailableText} Pièce et main-d’œuvre comprises, sous réserve de disponibilité.`,
    model,
    repair: repair === 'ecran' ? 'screen' : 'battery',
  }
}

async function liveStockAnswer(message: string): Promise<LiveDirectAnswer | null> {
  if (!/\b(reconditionne|reconditionnee|occasion|en stock|disponible|acheter un (?:telephone|smartphone|iphone))\b/.test(message)) return null
  const model = extractIphoneModel(message)
  let query = admin.from('phones')
    .select('modele, stockage, grade, batterie, couleur, vente')
    .eq('etat', 'DISPONIBLE')
    .order('created_at', { ascending: false })
    .limit(12)
  if (model) query = query.ilike('modele', '%iphone%').ilike('modele', `%${normalizedIphoneModel(model)}%`)
  const { data, error } = await query
  if (error) throw error
  const seen = new Set<string>()
  const phones = (data || []).filter((phone) => {
    const key = `${normalize(phone.modele)}|${phone.stockage || ''}|${phone.grade || ''}|${phone.vente || ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 4)
  if (!phones.length) return {
    topic: model ? `Stock ${model}` : 'Smartphones reconditionnés',
    answer: model
      ? `Je ne vois pas de ${model} disponible actuellement. Le stock change vite : l’équipe peut vous proposer un modèle proche sur WhatsApp.`
      : 'Je ne vois aucun smartphone disponible dans le stock en ligne actuellement. Demandez à l’équipe sur WhatsApp pour les arrivages.',
    needs_handoff: true,
  }
  const lines = phones.map((phone) => {
    const battery = Number(phone.batterie) > 0 ? `, batterie ${phone.batterie} %` : ''
    return `${phone.modele} ${phone.stockage || ''} Go, grade ${phone.grade || 'non précisé'}${battery} : ${Number(phone.vente)} €`
  })
  return {
    topic: model ? `Stock ${model}` : 'Smartphones reconditionnés disponibles',
    answer: `Disponibles au moment de votre demande : ${lines.join(' · ')}. Le téléphone peut être réservé après confirmation de l’équipe.`,
  }
}

function deviceDomain(message: string) {
  return /\b(ps[2345]|playstation|xbox|switch|nintendo|console)\b/.test(message)
    ? 'console'
    : /\b(trottinette|mobilite|scooter electrique)\b/.test(message)
      ? 'mobilite'
      : /\b(pc|ordinateur|macbook|imac|windows|laptop)\b/.test(message)
        ? 'informatique'
        : null
}

function matchesDeviceDomain(message: string, match: KnowledgeMatch) {
  const domain = deviceDomain(message)
  if (!domain) return false
  const searchable = normalize(`${match.slug} ${match.category} ${match.title}`)
  if (domain === 'console') return /console|playstation|xbox|nintendo|switch/.test(searchable)
  if (domain === 'mobilite') return /mobilite|trottinette|scooter/.test(searchable)
  return /informatique|ordinateur|pc|macbook|imac|windows/.test(searchable)
}

function specificKnowledgeSlug(message: string) {
  const consoleContext = /\b(ps[2345]|playstation|xbox|switch|nintendo|console)\b/.test(message)
  const mobilityContext = /\b(trottinette|mobilite|scooter electrique)\b/.test(message)
  const tabletContext = /\b(tablette|ipad|galaxy tab)\b/.test(message)
  const computerContext = /\b(pc|ordinateur|macbook|imac|windows|laptop|portable)\b/.test(message)
  const phoneContext = /\b(telephone|smartphone|iphone|android|samsung|xiaomi|redmi|honor|huawei|oppo|realme|pixel|oneplus|motorola)\b/.test(message)
  const mentionsDevice = phoneContext || tabletContext || /\b(appareil|ecran|charge|allume|eteint)\b/.test(message)
  const mentionsLiquid = /\b(eau|liquide|humidite|mouille|mouillee|oxyde|oxydation|toilettes|piscine|baignoire|evier)\b/.test(message)
  if (mentionsLiquid && mobilityContext) return 'mobilite-eau-oxydation'
  if (mentionsLiquid && (consoleContext || tabletContext)) return 'liquide-appareil-electrique'
  if (mentionsDevice && mentionsLiquid) return 'liquide-oxydation'
  if (/\b(manette|joy con|joycon|dualsense|dualshock)\b/.test(message) && /\b(charge|chargeur|batterie|autonomie|tient.*minutes)\b/.test(message)) return 'console-manette-charge'
  if (phoneContext && /\b(fumee|fume|odeur de brule|sent le brule|brulant|brulante)\b/.test(message)) return 'chauffe-pendant-charge'
  if (phoneContext && /\b(chauffe enormement|chauffe tres fort|chauffe anormalement|tres chaud|surchauffe)\b/.test(message)) return 'telephone-chauffe'
  if (computerContext && /\b(disque dur|hdd|ssd|disque)\b/.test(message) && /\b(clic|clac|claque|claquement|bruit mecanique)\w*\b/.test(message)) return 'disque-bruit-donnees'
  if (mobilityContext && /\b(chauffe|chaud|brulant|odeur|sent bizarre|fumee|fume)\w*\b/.test(message) && /\b(batterie|charge|chargeur)\b/.test(message)) return 'mobilite-batterie-danger'
  if (mobilityContext && /\b(frein(?:s|e|er|age)?|disque|plaquette|levier)\b/.test(message)) return 'mobilite-frein-reglage'
  if (mobilityContext && /\b(direction|guidon|pliage|potence|jeu)\b/.test(message)) return 'mobilite-securite-roulage'
  if (mobilityContext && /\b(pneu|crevaison|creve|degonfle|pression)\w*\b/.test(message)) return 'mobilite-pneu'
  if (mobilityContext && /\b(moteur|roue moteur|a coups|perd.*puissance|avance plus|vitesse)\b/.test(message)) return 'mobilite-moteur-puissance'
  if (mobilityContext && /\b(ne s allume plus|ne demarre plus|aucun voyant|aucun signe|completement morte|demarre puis s eteint)\b/.test(message)) return 'mobilite-demarrage-alimentation'
  if (mobilityContext && /\b(autonomie|batterie|charge|chargeur|ne charge plus|voyant.*vert)\b/.test(message)) return 'mobilite-charge-autonomie'
  if (mobilityContext && /\b(code erreur|cle rouge|afficheur|ecran|accelerateur|application|mise a jour|firmware|phare|feu arriere)\b/.test(message)) return 'mobilite-electronique'
  if (consoleContext && /\b(joystick|stick|drift|bouge tout seul)\b/.test(message)) return 'console-drift-manette'
  if (/\b(switch|nintendo)\b/.test(message) && /\b(ecran.*noir|son.*(?:mais|et).*ecran|sans image.*ecran)\b/.test(message)) return 'console-switch-ecran-noir'
  if (/\b(switch|nintendo)\b/.test(message) && /\b(charge|chargeur|dock|station d accueil|image.*tele|mode televiseur)\b/.test(message)) return 'console-switch-charge-dock'
  if (/\b(switch|nintendo)\b/.test(message) && /\b(cartouche|carte de jeu|jeu.*(?:non reconnu|pas reconnu)|lecteur.*jeu)\b/.test(message)) return 'console-switch-cartouche'
  if (consoleContext && /\b(ne s allume plus|ne demarre plus|aucun voyant|aucun signe|demarre puis s eteint)\b/.test(message)) return 'console-alimentation-demarrage'
  if (consoleContext && /\b(chauffe|surchauffe|ventilateur|bruit enorme|tres bruyant|s eteint.*chaud)\b/.test(message)) return 'console-surchauffe-ventilation'
  if (consoleContext && /\b(disque|lecteur|blu ray|jeu.*(?:non reconnu|pas reconnu)|eject)\b/.test(message)) return 'console-lecteur-disque'
  if (consoleContext && /\b(mode sans echec|mode securise|mise a jour|reparation automatique|reconstruire.*base|code erreur)\b/.test(message)) return 'console-mode-securise-mise-a-jour'
  if (consoleContext && /\b(wi[ -]?fi|reseau sans fil|stockage|ssd|manque de place|plus de place)\b/.test(message)) return 'console-wifi-stockage'
  if (computerContext && /\b(ne prend plus la charge|ne charge plus|prise.*charge|chargeur|connecteur.*charge|port.*charge)\b/.test(message)) return 'ordinateur-charge'
  if (computerContext && /\b(chauffe|surchauffe|ventilateur.*fort|ventilateur.*bruit)\b/.test(message)) return 'ordinateur-surchauffe'
  if (computerContext && /\b(charniere|coque.*ouvre|chassis.*casse|ecran.*arrache.*coque)\b/.test(message)) return 'ordinateur-charniere-coque'
  if (computerContext && /\b(clavier|touches?)\b/.test(message)) return 'ordinateur-clavier'
  if (computerContext && /\b(ports? usb|usb)\b/.test(message)) return 'ordinateur-usb'
  if (computerContext && /\b(webcam|camera)\b/.test(message)) return 'ordinateur-webcam'
  if (tabletContext && /\b(tordue|tordu|chassis.*deforme|deformee|deforme)\b/.test(message)) return 'appareil-deforme-securite'
  if (phoneContext && /\b(tactile|ne repond plus au doigt|appuie tout seul|zone.*ne repond)\b/.test(message)) return 'ecran-casse-image-visible'
  if (/\b(batterie|ecran)\b/.test(message) && /\b(gonfle|gonflee|souleve|soulevee|deforme|deformee)\b/.test(message)) return 'batterie-gonflee'
  if (tabletContext && /\b(stockage|memoire|plein|sature|manque de place|liberer.*place)\b/.test(message)) return 'tablette-stockage-logiciel'
  if (tabletContext && /\b(charge|chargeur|cable|connecteur|port.*(?:usb|charge)|aucune recharge)\b/.test(message)) return 'tablette-charge-lente-absente'
  if (tabletContext && /\b(batterie|autonomie|se vide|s eteint.*(?:pourcent|batterie))\b/.test(message)) return 'tablette-batterie-autonomie'
  if (tabletContext && /\b(ecran|vitre|tactile|affichage|dalle|image)\b/.test(message)) return 'tablette-ecran-tactile'
  if (tabletContext && /\b(bloque.*logo|bloque.*pomme|redemarre.*boucle|demarrage|mise a jour)\b/.test(message)) return 'tablette-demarrage-mise-a-jour'
  if (tabletContext && /\b(wi[ -]?fi|reseau|4g|5g|sim|e[ -]?sim)\b/.test(message)) return 'tablette-wifi-reseau'
  if (tabletContext && /\b(code|mot de passe|verrouille|indisponible|debloquer)\b/.test(message)) return 'tablette-code-donnees'
  if (tabletContext && /\b(apple pencil|s pen|stylet|magic keyboard|clavier)\b/.test(message)) return 'tablette-accessoire-stylet'
  if (tabletContext && /\b(transfer|migration|copier|nouvelle tablette|nouvel ipad)\w*\b/.test(message)) return 'tablette-transfert-donnees'
  if (tabletContext && /\b(son|audio|haut parleur|camera|bouton|volume)\b/.test(message)) return 'tablette-audio-camera-boutons'
  if (/\b(fumee|fume|odeur de brule|sent le brule|brulant|brulante)\b/.test(message)) return 'chauffe-pendant-charge'
  if (/\b(delai|combien de temps|en moins de|sous combien|minutes?|heures?)\b/.test(message) && /\b(repar|reparation|changer|remplacer|ecran|batterie)\w*\b/.test(message)) return 'delai-reparation'
  if (/\b(qualirepar|quali repar|bonus reparation|remise.*25|25.*(?:euros?|eur)|aide.*reparation)\b/.test(message)) return 'bonus-qualirepar'
  if (/\b(devis|diagnostic)\b/.test(message) && /\b(gratuit|sans engagement|payant|combien|accord|avant)\b/.test(message)) return 'diagnostic-devis-accord'
  if (/\b(depuis quand|quelle annee|combien d annees?|anciennete|date de creation|existe depuis|longtemps.*(?:repar|boutique|magasin))\b/.test(message) && /\b(solution phone|vous|votre|boutique|magasin|repar)\b/.test(message)) return 'histoire-solution-phone'
  if (/\b(ecran|affichage|dalle)\b/.test(message) && /\b(android|samsung|xiaomi|redmi|honor|huawei|pixel|oppo|realme|motorola|service pack)\b/.test(message) && /\b(qualite|compatible|origine|original|service pack|choix)\b/.test(message)) return 'choisir-qualite-ecran-android'
  if (/\b(ltps|soft oled|relife|qualite d ecran|ecran original ou compatible|4 qualites? d ecran)\b/.test(message)) return 'choisir-qualite-ecran'
  if (/\b(batterie|autonomie)\b/.test(message) && /\b(samsung|android|xiaomi|redmi|honor|huawei|oppo|realme|pixel|oneplus)\b/.test(message) && /\b(prix|tarif|combien|coute|euros?)\b/.test(message)) return 'prix-batterie-android'
  if (/\b(batterie)\b/.test(message) && /\b(ti reconnue|qualite|compatible.*originale|originale.*compatible|trois prix|3 prix)\b/.test(message) && /\b(iphone|apple)\b/.test(message)) return 'choisir-qualite-batterie-iphone'
  if (/\b(batterie)\b/.test(message) && /\b(qualite|compatible|originale|origine|constructeur|choix|budget)\b/.test(message)) return 'choisir-qualite-batterie'
  if (/\b(carte mere|micro[ -]?soudure|baseband|court circuit)\b/.test(message)) return 'carte-mere-microsoudure'
  const networkSlug = networkKnowledgeSlug(message)
  if (networkSlug) return networkSlug
  if (consoleContext && /\b(hdmi|pas d image|aucune image|ecran noir)\b/.test(message)) return 'console-port-hdmi'
  if (consoleContext) return 'service-console'
  if (tabletContext) return 'service-tablette'
  if (/\b(haut parleur|sonnerie|pas de son|son.{0,45}faible|audio.{0,45}faible|videos?.{0,20}(?:muet|sans son))\b/.test(message)) return 'haut-parleur-externe'
  if (/\b(vaut.*coup|reparer ou (?:changer|remplacer)|rentable|reparation inutile)\b/.test(message)) return 'reparer-ou-remplacer'
  if (/\b(que reparez vous|quelles reparations|quelles pieces.*changez|tout ce que vous reparez)\b/.test(message)) return 'reparations-prises-en-charge'
  if (/\b(rendez vous|rendez-vous)\b/.test(message)) return 'sans-rendez-vous'
  if (/\b(virus|malware|publicites?|pubs?|pop[ -]?ups?|application(?:s)? indesirable(?:s)?|infecte)\b/.test(message) && /\b(android|samsung|xiaomi|redmi|honor|huawei|oppo|realme|pixel|oneplus|motorola|telephone|smartphone)\b/.test(message)) return 'prix-nettoyage-virus-android'
  if (/\b(virus|malware|logiciel malveillant|publicites?|pubs?|pop[ -]?ups?|infecte)\b/.test(message) && /\b(pc|ordinateur|windows|macbook|imac|laptop)\b/.test(message)) return 'prix-nettoyage-virus-pc'
  if (/\b(disque dur|ssd|reinstall(?:er|ation)? windows|windows.*reinstall)\b/.test(message)) return 'prix-disque-windows'
  if (/\b(batterie|autonomie)\b/.test(message) && /\b(pc|ordinateur|macbook|imac|mac)\b/.test(message)) return 'prix-batterie-pc-mac'
  if (/\b(ecran|dalle|affichage)\b/.test(message) && /\b(pc|ordinateur|macbook|imac|portable)\b/.test(message)) return 'prix-ecran-ordinateur'
  if (/\b(batterie|autonomie)\b/.test(message) && /\b(samsung|android|xiaomi|redmi|honor|huawei|oppo|realme|pixel|oneplus)\b/.test(message)) return 'prix-batterie-android'
  if (/\b(sauvegard|transfer|copier)\w*\b/.test(message) && /\b(whatsapp|cle usb|photos? sur (?:une )?cle|configuration)\b/.test(message)) return 'services-transfert-sauvegarde'
  if (/\b(recuper|transfer|migration|copier)\w*\b/.test(message) && /\b(donnees?|photos?|contacts?|whatsapp|nouveau (?:telephone|smartphone))\b/.test(message)) return 'prix-transfert-smartphone-casse'
  if (/\b(vitre arriere|face arriere|dos casse|back glass)\b/.test(message) && /\b(iphone|apple)\b/.test(message)) return 'prix-vitre-arriere-iphone'
  if (/\b(vitre arriere|face arriere|dos casse|back glass)\b/.test(message) && /\b(samsung|android|xiaomi|redmi|honor|huawei|oppo|realme|pixel|oneplus|motorola)\b/.test(message)) return 'prix-vitre-arriere-android'
  if (/\b(connecteur|port usb|usb c|lightning|bouge.*cable|cable.*bouge|cable.*(?:tient|rentre)|(?:tient|rentre).*cable|charge mal)\b/.test(message)) return 'prix-connecteur-charge'
  return null
}

function rankForDeviceDomain(message: string, matches: KnowledgeMatch[]) {
  const domain = deviceDomain(message)
  const exactSlug = specificKnowledgeSlug(message)

  if (!domain && !exactSlug) return matches

  return [...matches].sort((a, b) => {
    const affinity = (match: KnowledgeMatch) => {
      const exact = exactSlug ? (match.slug === exactSlug ? 0.9 : -0.2) : 0
      if (!domain) return exact
      if (matchesDeviceDomain(message, match)) return exact + (domain === 'informatique' ? 0.4 : 0.5)
      return exact + (domain === 'informatique' ? -0.25 : -0.35)
    }
    return (Number(b.score) + affinity(b)) - (Number(a.score) + affinity(a))
  })
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function withinRateLimit(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const now = new Date()
  now.setSeconds(0, 0)
  const windowStartedAt = now.toISOString()
  const keyHash = await sha256(`${forwarded}:${now.toISOString().slice(0, 10)}:evan`)
  const { data, error } = await admin.rpc('evan_consume_rate_limit', {
    p_key_hash: keyHash,
    p_window_started_at: windowStartedAt,
    p_request_limit: 24,
  })
  if (error) {
    console.error('Rate limit check failed', error)
    return false
  }
  return data === true
}

function attributedTrafficOrigin(origin: string, page: string | undefined) {
  const label = normalize(String(page || ''))
  return /(?:^|[\/:_-])(audit|test|retest|verification|regression|codex|qa)(?:$|[\/:_-])/.test(label)
    || label === 'automated eval'
    ? 'internal-test'
    : origin
}

async function getConversation(token: string | undefined, context: EvanRequest['context'], origin: string) {
  // Les scénarios de recette doivent exercer le même moteur de réponse sans
  // créer de faux visiteurs, messages, demandes expert ou statistiques.
  if (context?.page === 'automated-eval') {
    const publicToken = isUuid(token) ? token : crypto.randomUUID()
    return {
      id: publicToken,
      public_token: publicToken,
      metadata: { page: 'automated-eval' },
      device_brand: context?.brand?.slice(0, 80) || null,
      device_model: context?.model?.slice(0, 120) || null,
    }
  }

  const trafficOrigin = attributedTrafficOrigin(origin, context?.page)

  if (isUuid(token)) {
    const { data } = await admin
      .from('evan_conversations')
      .select('id, public_token, metadata, device_brand, device_model')
      .eq('public_token', token)
      .maybeSingle()
    if (data) {
      const existingMetadata = data.metadata && typeof data.metadata === 'object' ? data.metadata : {}
      const nextMetadata = {
        ...existingMetadata,
        origin: trafficOrigin,
        last_page: context?.page?.slice(0, 200) || existingMetadata.last_page || existingMetadata.page || null,
      }
      await admin.from('evan_conversations').update({ metadata: nextMetadata }).eq('id', data.id)
      return { ...data, metadata: nextMetadata }
    }
  }

  const { data, error } = await admin
    .from('evan_conversations')
    .insert({
      channel: 'web',
      device_brand: context?.brand?.slice(0, 80) || null,
      device_model: context?.model?.slice(0, 120) || null,
      consent_to_store: context?.consent_to_store === true,
      metadata: {
        page: context?.page?.slice(0, 200) || null,
        last_page: context?.page?.slice(0, 200) || null,
        origin: trafficOrigin,
      },
    })
    .select('id, public_token, metadata, device_brand, device_model')
    .single()

  if (error) throw error
  return data
}

function expertReference() {
  return `EV-${Date.now().toString(36).slice(-5).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`
}

function quickReplies(step: DiagnosticStep | undefined) {
  return (step?.options || []).slice(0, 5).map((label) => ({ label, value: label }))
}

function diagnosticQuestionLimit(flow: DiagnosticFlow) {
  return Math.min(4, Math.max(1, Number(flow.max_questions) || 2))
}

function canCompleteDiagnosticEarly(flow: DiagnosticFlow, answers: Record<string, string>) {
  const value = (key: string) => normalize(String(answers[key] || ''))

  // Si le test montre déjà que l’accessoire est en cause, inutile d’interroger davantage.
  if (flow.slug === 'charging' && /autre chargeur fonctionne/.test(value('other_charger'))) return true

  // Les situations urgentes passent rapidement à l’atelier au lieu de prolonger le diagnostic.
  if (flow.slug === 'battery-life' && /gonflee/.test(value('symptom'))) return true
  if (flow.slug === 'data-recovery' && /pris l eau/.test(value('state'))) return true
  if (flow.slug === 'overheat' && /^oui$/.test(value('deformation'))) return true

  // Un défaut limité à certains lieux pointe d’abord vers la couverture opérateur.
  if (flow.slug === 'network' && /certains lieux/.test(value('scope'))) return true

  return false
}

function destinationPhone(destination: DiagnosticFlow['destination']) {
  if (destination === 'solution_accessoires') return '33783921884'
  if (destination === 'solution_informatique') return '33748348743'
  return '33783921884'
}

function diagnosticSummary(flow: DiagnosticFlow, answers: Record<string, string>) {
  const details = flow.steps
    .map((step) => answers[step.key] ? `${step.question} ${answers[step.key]}` : '')
    .filter(Boolean)
  return `${flow.title} — ${details.join(' · ')}`.slice(0, 1200)
}

async function getDiagnosticFlow(column: 'slug' | 'knowledge_slug', value: string) {
  const { data, error } = await admin
    .from('evan_diagnostic_flows')
    .select('slug, knowledge_slug, title, steps, completion_message, destination, max_questions')
    .eq(column, value)
    .eq('active', true)
    .maybeSingle()
  if (error) throw error
  return data as DiagnosticFlow | null
}

async function notifyOwner(reference: string, customerQuestion: string, expertRequestId: string) {
  if (!WHATSAPP_ACCESS_TOKEN || !EVAN_OWNER_WHATSAPP) return
  const text = [
    `L’assistant de Sébastien a besoin de toi — ${reference}`,
    `Client : ${customerQuestion}`,
    '',
    'Réponds directement à ce message. J’enregistrerai ta réponse dans ma mémoire.',
  ].join('\n').slice(0, 3900)
  try {
    const messageType = 'template'
    const apiResponse = await fetch(`https://graph.facebook.com/v25.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: EVAN_OWNER_WHATSAPP,
        type: 'template',
        template: {
          name: 'evan_question_equipe',
          language: { code: 'fr' },
          components: [{
            type: 'body',
            parameters: [
              { type: 'text', text: reference },
              { type: 'text', text: customerQuestion.replace(/\s+/g, ' ').trim().slice(0, 900) },
            ],
          }],
        },
      }),
    })
    const result = await apiResponse.json()
    if (!apiResponse.ok) throw new Error(result?.error?.message || `Erreur WhatsApp ${apiResponse.status}`)
    await admin.from('evan_whatsapp_events').insert({
      meta_message_id: result?.messages?.[0]?.id || null,
      direction: 'outbound',
      from_number: '33602849953',
      to_number: EVAN_OWNER_WHATSAPP,
      message_type: messageType,
      body: text,
      reference,
      expert_request_id: expertRequestId,
      processed_status: 'processed',
      processed_at: new Date().toISOString(),
      payload: result,
    })
  } catch (error) {
    await admin.from('evan_whatsapp_events').insert({
      direction: 'outbound',
      from_number: '33602849953',
      to_number: EVAN_OWNER_WHATSAPP,
      message_type: 'text',
      body: text,
      reference,
      expert_request_id: expertRequestId,
      processed_status: 'failed',
      processed_at: new Date().toISOString(),
      error_message: (error instanceof Error ? error.message : String(error)).slice(0, 1000),
    })
    console.error('owner notification failed', error)
  }
}

async function getOrCreateExpertRequest(input: {
  conversationId: string
  customerQuestion: string
  normalizedQuestion: string
  expertQuestion: string
}) {
  const { data: existing, error: existingError } = await admin
    .from('evan_expert_requests')
    .select('id,reference')
    .eq('conversation_id', input.conversationId)
    .eq('evan_summary', input.normalizedQuestion)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (existingError) throw existingError
  if (existing) return { ...existing, created: false }

  const reference = expertReference()
  const { data: created, error: createError } = await admin
    .from('evan_expert_requests')
    .insert({
      reference,
      conversation_id: input.conversationId,
      customer_question: input.customerQuestion,
      evan_summary: input.normalizedQuestion,
      expert_question: input.expertQuestion,
    })
    .select('id,reference')
    .single()
  if (createError?.code === '23505') {
    const { data: concurrent, error: concurrentError } = await admin
      .from('evan_expert_requests')
      .select('id,reference')
      .eq('conversation_id', input.conversationId)
      .eq('evan_summary', input.normalizedQuestion)
      .eq('status', 'pending')
      .maybeSingle()
    if (concurrentError) throw concurrentError
    if (concurrent) return { ...concurrent, created: false }
  }
  if (createError) throw createError
  return { ...created, created: true }
}

async function saveDirectAnswer(
  conversationId: string,
  mode: string,
  answer: string,
  eventType: 'answer_shown' | 'price_shown' | 'stock_shown',
  metadata: Record<string, unknown> = {},
) {
  const now = new Date().toISOString()
  await Promise.all([
    admin.from('evan_messages').insert({
      conversation_id: conversationId,
      role: 'evan',
      content: answer,
      confidence: 1,
      metadata: { mode, ...metadata },
    }),
    admin.from('evan_events').insert({
      conversation_id: conversationId,
      event_type: eventType,
      channel: 'web',
      metadata,
    }),
    admin.from('evan_conversations').update({
      status: 'resolved',
      last_message_at: now,
    }).eq('id', conversationId),
  ])
}

async function askOpenAI(
  conversationId: string,
  customerQuestion: string,
  context: EvanRequest['context'],
  matches: KnowledgeMatch[],
): Promise<AIAnswer | null> {
  if (!OPENAI_API_KEY || SEBASTIEN_AI_MONTHLY_LIMIT < 1) return null

  const { data: reservationId, error: reservationError } = await admin.rpc('evan_reserve_ai_call', {
    p_conversation_id: conversationId,
    p_model: SEBASTIEN_AI_MODEL,
    p_monthly_limit: SEBASTIEN_AI_MONTHLY_LIMIT,
  })
  if (reservationError) {
    console.error('AI budget reservation failed', reservationError)
    return null
  }
  if (!reservationId) return null

  const knowledgeContext = matches.slice(0, 5).map((match) => ({
    title: match.title,
    answer: conciseAnswer(match.answer, 380),
  }))
  const startedAt = Date.now()

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: SEBASTIEN_AI_MODEL,
        reasoning: { effort: 'minimal' },
        max_output_tokens: 320,
        input: [
          {
            role: 'system',
            content: `Tu es Sébastien, l’assistant numérique de Solution Phone à Mâcon. Tu aides à qualifier une panne, jamais à poser un diagnostic certain à distance. Réponds en français correct, avec chaleur et professionnalisme, en une ou deux phrases courtes ; le champ answer doit rester sous 260 caractères. Ne mets aucune question dans answer : place l’unique question éventuelle dans suggested_question et limite-la à 90 caractères. Ne mentionne jamais l’IA, une base de données ou une référence interne. N’invente jamais un prix, un stock, un délai, une compatibilité ou une réparation. Pour une demande inconnue, propose au maximum deux vérifications parmi cette liste fermée : redémarrage, retrait d’un accessoire ou d’une coque, essai comparatif avec une autre application ou un autre chargeur, mise à jour. Si le modèle et le symptôme sont déjà indiqués et qu’il n’y a aucun danger, donne immédiatement une ou deux de ces vérifications dans answer : ne demande jamais au client s’il veut les recevoir, mets suggested_question à null et needs_human à false. Pose une question seulement lorsqu’une information manquante change réellement la suite. N’invente aucune autre manipulation et n’emploie pas de formule vague comme « mode sans données ». Ne donne pas de chemin de menu ni de fonction à désactiver si cette manipulation n’est pas fournie dans les connaissances validées. Les seuls faits boutique autorisés sont : adresse 21 rue Gambetta 71000 Mâcon ; téléphone 03 85 33 06 89 ; WhatsApp 07 83 92 18 84 ; lundi 9h15–12h15 et 14h–19h ; mardi à samedi 9h15–19h ; sans rendez-vous ; réparateur labellisé QualiRépar avec bonus de 25 € si l’appareil et la réparation sont éligibles. Pour batterie gonflée, forte chauffe, fumée, odeur ou liquide, commence par une consigne de sécurité et demande une prise en charge humaine. Si la question demande un tarif précis, un stock, une disponibilité de pièce, un diagnostic matériel certain ou sort des informations fournies, mets needs_human à true. Pose au plus une question utile si le modèle ou le symptôme manque et relis son accord grammatical.`,
          },
          {
            role: 'user',
            content: JSON.stringify({
              question: sanitizeForLearning(customerQuestion),
              appareil: {
                marque: context?.brand?.slice(0, 80) || null,
                modele: context?.model?.slice(0, 120) || null,
              },
              connaissances_validees_proches: knowledgeContext,
            }),
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'sebastien_answer',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                intent: { type: 'string', enum: ['repair', 'price', 'stock', 'shop_info', 'other'] },
                answer: { type: 'string', minLength: 3, maxLength: 260 },
                needs_human: { type: 'boolean' },
                suggested_question: { type: ['string', 'null'], maxLength: 100 },
                safety: { type: ['string', 'null'], maxLength: 240 },
              },
              required: ['intent', 'answer', 'needs_human', 'suggested_question', 'safety'],
            },
          },
        },
      }),
    })

    const payload = await response.json() as Record<string, any>
    const usage = payload.usage || {}
    const inputTokens = Number(usage.input_tokens || 0)
    const cachedTokens = Number(usage.input_tokens_details?.cached_tokens || 0)
    const outputTokens = Number(usage.output_tokens || 0)
    const estimatedCost = estimateAIResponseCost(SEBASTIEN_AI_MODEL, inputTokens, cachedTokens, outputTokens)

    if (!response.ok) throw new Error(payload.error?.message || `OpenAI ${response.status}`)
    const parsedOutput = parseAIAnswer(openAIOutputText(payload))
    if (!parsedOutput) throw new Error('Réponse IA invalide ou affirmation commerciale non autorisée')
    const parsed = alignAIAnswerWithQuestion(parsedOutput, customerQuestion)

    const { error: usageSuccessError } = await admin.rpc('evan_finalize_ai_usage', {
      p_usage_id: reservationId,
      p_status: 'success',
      p_intent: parsed.intent,
      p_needs_human: Boolean(parsed.needs_human),
      p_input_tokens: inputTokens,
      p_cached_input_tokens: cachedTokens,
      p_output_tokens: outputTokens,
      p_estimated_cost_usd: estimatedCost,
      p_latency_ms: Date.now() - startedAt,
      p_error_code: null,
    })
    if (usageSuccessError) throw new Error(`Suivi usage IA impossible: ${usageSuccessError.message}`)
    return {
      intent: parsed.intent,
      answer: conciseAIVisible(`${parsed.safety ? `${parsed.safety} ` : ''}${parsed.answer}`, 260),
      needs_human: Boolean(parsed.needs_human),
      suggested_question: parsed.suggested_question ? conciseAnswer(parsed.suggested_question, 100) : null,
      safety: parsed.safety ? conciseAnswer(parsed.safety, 240) : null,
    }
  } catch (error) {
    console.error('OpenAI fallback failed', error)
    const errorCode = (error instanceof Error ? error.message : String(error))
      .replace(/sk-[A-Za-z0-9_-]+/g, '[secret]')
      .slice(0, 240)
    const { error: usageError } = await admin.rpc('evan_finalize_ai_usage', {
      p_usage_id: reservationId,
      p_status: 'error',
      p_intent: null,
      p_needs_human: null,
      p_input_tokens: 0,
      p_cached_input_tokens: 0,
      p_output_tokens: 0,
      p_estimated_cost_usd: 0,
      p_latency_ms: Date.now() - startedAt,
      p_error_code: errorCode,
    })
    if (usageError) console.error('AI usage error tracking failed', usageError)
    return null
  }
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin') || ''

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: ALLOWED_ORIGINS.has(origin) ? 204 : 403,
      headers: corsHeaders(origin),
    })
  }

  if (!ALLOWED_ORIGINS.has(origin)) return json(origin, { error: 'Origine non autorisée.' }, 403)
  if (req.method !== 'POST') return json(origin, { error: 'Méthode non autorisée.' }, 405)
  if (!(await withinRateLimit(req))) return json(origin, { error: 'Trop de demandes. Réessayez dans une minute.' }, 429)

  try {
    await admin.rpc('evan_prune_expired_conversations')
    await admin
      .from('evan_expert_requests')
      .update({ status: 'dismissed' })
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    const body = await req.json() as EvanRequest
    const isAutomatedEval = body.context?.page === 'automated-eval'

    if (body.event) {
      if (!TRACKED_EVENTS.has(body.event)) return json(origin, { error: 'Événement invalide.' }, 400)
      const eventConversation = await getConversation(body.conversation_token, body.context, origin)
      if (isAutomatedEval) {
        return json(origin, {
          conversation_token: eventConversation.public_token,
          event_recorded: true,
          simulated: true,
        })
      }
      const { error: eventError } = await admin.from('evan_events').insert({
        conversation_id: eventConversation.id,
        event_type: body.event,
        channel: body.event === 'whatsapp_clicked' ? 'whatsapp' : body.event === 'email_clicked' ? 'email' : 'web',
        metadata: {
          ...cleanEventMetadata(body.event_metadata),
          page: body.context?.page?.slice(0, 200) || null,
          origin: attributedTrafficOrigin(origin, body.context?.page),
        },
      })
      if (eventError) throw eventError
      return json(origin, { conversation_token: eventConversation.public_token, event_recorded: true })
    }

    if (body.feedback) {
      if (!isUuid(body.conversation_token) || !isUuid(body.knowledge_id) || !['helpful', 'not_helpful'].includes(body.feedback)) {
        return json(origin, { error: 'Retour invalide.' }, 400)
      }
      const { data: feedbackConversation } = await admin
        .from('evan_conversations')
        .select('id')
        .eq('public_token', body.conversation_token)
        .maybeSingle()
      if (!feedbackConversation) return json(origin, { error: 'Conversation introuvable.' }, 404)

      const { data: recorded, error: feedbackError } = await admin.rpc('evan_record_knowledge_feedback', {
        conversation_uuid: feedbackConversation.id,
        knowledge_uuid: body.knowledge_id,
        is_helpful: body.feedback === 'helpful',
      })
      if (feedbackError) throw feedbackError
      return json(origin, { feedback_recorded: Boolean(recorded) })
    }

    if (body.poll) {
      if (!isUuid(body.conversation_token)) return json(origin, { error: 'Conversation invalide.' }, 400)
      const { data: pollConversation } = await admin
        .from('evan_conversations')
        .select('id,status')
        .eq('public_token', body.conversation_token)
        .maybeSingle()
      if (!pollConversation) return json(origin, { error: 'Conversation introuvable.' }, 404)

      const { data: expertReply, error: expertReplyError } = await admin
        .from('evan_expert_requests')
        .select('status,expert_answer,learned_knowledge_id,answered_at')
        .eq('conversation_id', pollConversation.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (expertReplyError) throw expertReplyError
      if (expertReply?.status === 'answered' && expertReply.expert_answer) {
        return json(origin, {
          conversation_token: body.conversation_token,
          status: 'answered',
          answer: conciseAnswer(expertReply.expert_answer, 320),
          knowledge_id: expertReply.learned_knowledge_id || null,
          answered_at: expertReply.answered_at || null,
        })
      }
      if (expertReply?.status === 'dismissed') {
        return json(origin, {
          conversation_token: body.conversation_token,
          status: 'unavailable',
        })
      }
      return json(origin, { conversation_token: body.conversation_token, status: 'waiting' })
    }

    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 1200) : ''
    if (message.length < 3) return json(origin, { error: 'Décrivez le problème en quelques mots.' }, 400)

    const conversation = await getConversation(body.conversation_token, body.context, origin)
    const normalizedMessage = normalize(message)
    const learningQuestion = sanitizeForLearning(message)

    if (!isAutomatedEval) {
      await admin.from('evan_messages').insert({
        conversation_id: conversation.id,
        role: 'client',
        content: message,
        metadata: { normalized: normalizedMessage },
      })
    }

    const conversationMetadata = (conversation.metadata && typeof conversation.metadata === 'object')
      ? conversation.metadata as Record<string, unknown>
      : {}
    const businessFact = businessFactAnswer(normalizedMessage)
    if (businessFact) {
      if (!isAutomatedEval) {
        await Promise.all([
          admin.from('evan_messages').insert({
            conversation_id: conversation.id,
            role: 'evan',
            content: businessFact.answer,
            confidence: 1,
            metadata: { mode: 'business_fact', topic: businessFact.topic },
          }),
          admin.from('evan_conversations').update({
            status: 'resolved',
            last_message_at: new Date().toISOString(),
          }).eq('id', conversation.id),
        ])
      }
      return json(origin, {
        conversation_token: conversation.public_token,
        mode: 'business_fact',
        matched: true,
        answer: businessFact.answer,
        topic: businessFact.topic,
      })
    }
    const activeDiagnostic = conversationMetadata.diagnostic as DiagnosticState | undefined
    const cancelsDiagnostic = /\b(annuler|recommencer|nouvelle question|changer de sujet)\b/.test(normalizedMessage)

    if (activeDiagnostic && !cancelsDiagnostic) {
      const flow = await getDiagnosticFlow('slug', activeDiagnostic.flow_slug)
      if (flow) {
        const currentStep = flow.steps[activeDiagnostic.step_index]
        const answers = { ...(activeDiagnostic.answers || {}) }
        if (currentStep) answers[currentStep.key] = message
        const nextIndex = activeDiagnostic.step_index + 1
        const nextStep = flow.steps[nextIndex]
        const questionLimit = diagnosticQuestionLimit(flow)
        const reachedLimit = (activeDiagnostic.questions_asked || 1) >= questionLimit
        const enoughInformation = canCompleteDiagnosticEarly(flow, answers)

        if (nextStep && !reachedLimit && !enoughInformation) {
          const nextState: DiagnosticState = {
            ...activeDiagnostic,
            step_index: nextIndex,
            answers,
            questions_asked: (activeDiagnostic.questions_asked || 1) + 1,
          }
          const answer = `Noté. ${nextStep.question}`
          if (!isAutomatedEval) {
            await Promise.all([
              admin.from('evan_conversations').update({
                metadata: { ...conversationMetadata, diagnostic: nextState },
                device_brand: body.context?.brand?.slice(0, 80) || conversation.device_brand || undefined,
                device_model: answers.model?.slice(0, 120) || body.context?.model?.slice(0, 120) || conversation.device_model || undefined,
                last_message_at: new Date().toISOString(),
              }).eq('id', conversation.id),
              admin.from('evan_messages').insert({
                conversation_id: conversation.id,
                role: 'evan',
                content: answer,
                metadata: { mode: 'diagnostic', flow: flow.slug, step: nextIndex },
              }),
            ])
          }
          return json(origin, {
            conversation_token: conversation.public_token,
            mode: 'diagnostic',
            matched: true,
            diagnostic_active: true,
            answer,
            topic: flow.title,
            question: nextStep.question,
            quick_replies: quickReplies(nextStep),
            diagnostic_progress: { current: nextState.questions_asked, total: questionLimit },
          })
        }

        const summary = diagnosticSummary(flow, answers)
        const whatsappText = `Bonjour Sébastien, mon diagnostic est terminé : ${summary}. Pouvez-vous me confirmer la suite et le devis ?`
        const answer = conciseAnswer(flow.completion_message, 240)
        const completedMetadata = {
          ...conversationMetadata,
          diagnostic: null,
          last_diagnostic: { flow: flow.slug, answers, completed_at: new Date().toISOString() },
        }
        if (!isAutomatedEval) {
          await Promise.all([
            admin.from('evan_conversations').update({
              metadata: completedMetadata,
              status: 'resolved',
              device_model: answers.model?.slice(0, 120) || body.context?.model?.slice(0, 120) || conversation.device_model || undefined,
              last_message_at: new Date().toISOString(),
            }).eq('id', conversation.id),
            admin.from('evan_messages').insert({
              conversation_id: conversation.id,
              role: 'evan',
              content: answer,
              metadata: { mode: 'diagnostic_complete', flow: flow.slug, summary },
            }),
          ])
        }
        return json(origin, {
          conversation_token: conversation.public_token,
          mode: 'diagnostic_complete',
          matched: true,
          diagnostic_complete: true,
          answer,
          topic: flow.title,
          diagnostic_summary: summary,
          whatsapp_url: `https://wa.me/${destinationPhone(flow.destination)}?text=${encodeURIComponent(whatsappText)}`,
          quick_replies: [
            { label: 'Envoyer le diagnostic sur WhatsApp', value: 'whatsapp', action: 'whatsapp' },
            { label: 'Recevoir un devis par e-mail', value: 'mail', action: 'mail' },
          ],
        })
      }
    }

    if (activeDiagnostic && cancelsDiagnostic) {
      if (!isAutomatedEval) {
        await admin.from('evan_conversations').update({
          metadata: { ...conversationMetadata, diagnostic: null },
        }).eq('id', conversation.id)
      }
    }

    const asksAboutConsoleDisplay = /\b(ps[2345]|playstation|xbox|switch|nintendo|console|hdmi)\b/.test(normalizedMessage)
    const outsideCurrentScope = /\b(aspirateurs?|refrigerateurs?|frigos?|lave[ -]linges?|lave[ -]vaisselles?|fours?|micro[ -]ondes?|televisions?|televiseurs?|voitures?|velos?)\b/.test(normalizedMessage) &&
      !asksAboutConsoleDisplay
    if (outsideCurrentScope) {
      const answer = 'Je ne peux pas confirmer la prise en charge de cet appareil. Envoyez la demande sur WhatsApp avant de vous déplacer : l’équipe vous répondra directement.'
      const whatsappText = `Bonjour, prenez-vous en charge cette demande : ${message} ?`
      if (!isAutomatedEval) {
        await Promise.all([
          admin.from('evan_messages').insert({
            conversation_id: conversation.id,
            role: 'evan',
            content: answer,
            confidence: 0.95,
            metadata: { mode: 'outside_scope' },
          }),
          admin.from('evan_conversations').update({
            status: 'resolved',
            last_message_at: new Date().toISOString(),
          }).eq('id', conversation.id),
        ])
      }
      return json(origin, {
        conversation_token: conversation.public_token,
        mode: 'outside_scope',
        matched: true,
        answer,
        topic: 'Prise en charge à confirmer',
        whatsapp_url: `https://wa.me/33783921884?text=${encodeURIComponent(whatsappText)}`,
        quick_replies: [
          { label: 'Demander sur WhatsApp', value: 'whatsapp', action: 'whatsapp' },
          { label: 'Demander par e-mail', value: 'mail', action: 'mail' },
        ],
      })
    }

    const livePrice = await liveIphonePriceAnswer(normalizedMessage)
    if (livePrice) {
      const whatsappText = `Bonjour Sébastien, je souhaite confirmer ce tarif : ${message}`
      if (!isAutomatedEval) {
        await saveDirectAnswer(conversation.id, 'live_price', livePrice.answer, 'price_shown', {
          topic: livePrice.topic,
          model: livePrice.model || body.context?.model || '',
          needs_detail: Boolean(livePrice.needs_detail),
          needs_handoff: Boolean(livePrice.needs_handoff),
        })
      }
      return json(origin, {
        conversation_token: conversation.public_token,
        mode: 'live_price',
        matched: true,
        answer: livePrice.answer,
        topic: livePrice.topic,
        confidence: 1,
        whatsapp_url: `https://wa.me/33783921884?text=${encodeURIComponent(whatsappText)}`,
        quick_replies: livePrice.needs_detail ? [] : [
          ...(livePrice.repair === 'screen' ? [{
            label: 'Comprendre les qualités d’écran',
            value: 'Quelle différence entre Compatible, LTPS Prime, Soft OLED et ReLife ?',
            action: 'question',
          }] : []),
          { label: 'Confirmer sur WhatsApp', value: 'whatsapp', action: 'whatsapp' },
          { label: 'Recevoir par e-mail', value: 'mail', action: 'mail' },
        ],
      })
    }

    const liveStock = await liveStockAnswer(normalizedMessage)
    if (liveStock) {
      const whatsappText = `Bonjour Sébastien, je souhaite confirmer le stock pour : ${message}`
      if (!isAutomatedEval) {
        await saveDirectAnswer(conversation.id, 'live_stock', liveStock.answer, 'stock_shown', {
          topic: liveStock.topic,
          needs_handoff: Boolean(liveStock.needs_handoff),
        })
      }
      return json(origin, {
        conversation_token: conversation.public_token,
        mode: 'live_stock',
        matched: true,
        answer: liveStock.answer,
        topic: liveStock.topic,
        confidence: 1,
        whatsapp_url: `https://wa.me/33783921884?text=${encodeURIComponent(whatsappText)}`,
        quick_replies: [
          { label: 'Confirmer ou réserver sur WhatsApp', value: 'whatsapp', action: 'whatsapp' },
          { label: 'Recevoir une réponse par e-mail', value: 'mail', action: 'mail' },
        ],
      })
    }

    const exactKnowledgeSlug = specificKnowledgeSlug(normalizedMessage)
    const [searchResult, exactResult] = await Promise.all([
      admin.rpc('evan_search_knowledge', {
        query_text: normalizedMessage,
        result_limit: 5,
      }),
      exactKnowledgeSlug
        ? admin.from('evan_knowledge')
          .select('id, slug, category, title, answer, follow_up_questions, warnings, sales_suggestions, confidence')
          .eq('slug', exactKnowledgeSlug)
          .eq('status', 'validated')
          .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ])
    const { data: matches, error: searchError } = searchResult
    if (searchError) throw searchError
    if (exactResult.error) throw exactResult.error

    const rankedMatches = rankForDeviceDomain(normalizedMessage, (matches || []) as KnowledgeMatch[])
    const relevantMatches = rankedMatches.filter((match) => knowledgeMatchAllowed(normalizedMessage, match.slug))
    const exactMatch = exactResult.data
      ? { ...exactResult.data, score: 1 } as KnowledgeMatch
      : null
    const best = exactMatch || (relevantMatches[0] || null) as KnowledgeMatch | null
    const accepted = best && (
      best.slug === exactKnowledgeSlug ||
      Number(best.score) >= 0.36 ||
      (Number(best.score) >= 0.19 && matchesDeviceDomain(normalizedMessage, best))
    )

    if (accepted && best) {
      const confidence = Math.min(Number(best.confidence || 0.8), Number(best.score || 0.3) + 0.2)
      const flow = await getDiagnosticFlow('knowledge_slug', best.slug)
      let diagnosticPayload: Record<string, unknown> = {}
      let answer = conciseAnswer(best.answer)

      if (flow) {
        const questionLimit = diagnosticQuestionLimit(flow)
        const initialAnswers: Record<string, string> = {}
        let firstIndex = 0
        if (flow.steps[0]?.key === 'model' && body.context?.model) {
          initialAnswers.model = body.context.model.slice(0, 120)
          firstIndex = 1
        }
        const firstStep = flow.steps[firstIndex]
        if (firstStep) {
          const state: DiagnosticState = {
            flow_slug: flow.slug,
            knowledge_slug: flow.knowledge_slug,
            step_index: firstIndex,
            answers: initialAnswers,
            started_at: new Date().toISOString(),
            questions_asked: 1,
          }
          answer = `${conciseAnswer(best.answer, 220)}\n\n${firstStep.question}`
          diagnosticPayload = {
            diagnostic_active: true,
            question: firstStep.question,
            quick_replies: quickReplies(firstStep),
            diagnostic_progress: { current: 1, total: questionLimit },
          }
          conversationMetadata.diagnostic = state
        }
      }

      if (!isAutomatedEval) {
        await Promise.all([
          admin.from('evan_messages').insert({
            conversation_id: conversation.id,
            role: 'evan',
            content: answer,
            knowledge_id: best.id,
            confidence,
            metadata: { mode: flow ? 'diagnostic' : 'knowledge', match_score: best.score, flow: flow?.slug || null },
          }),
          admin.rpc('evan_mark_knowledge_used', { knowledge_uuid: best.id }),
          admin.from('evan_conversations').update({
            status: 'active',
            last_message_at: new Date().toISOString(),
            device_brand: body.context?.brand?.slice(0, 80) || undefined,
            device_model: body.context?.model?.slice(0, 120) || undefined,
            metadata: conversationMetadata,
          }).eq('id', conversation.id),
        ])
      }

      const knowledgeWhatsAppText = `Bonjour Sébastien, je viens du site Solution Phone. Ma demande : ${message}. Pouvez-vous me confirmer le tarif ou la solution adaptée ?`
      return json(origin, {
        conversation_token: conversation.public_token,
        mode: flow ? 'diagnostic' : 'knowledge',
        matched: true,
        answer,
        topic: best.title,
        knowledge_id: best.id,
        confidence,
        follow_up_questions: best.follow_up_questions || [],
        warnings: best.warnings || [],
        suggestions: best.sales_suggestions || [],
        ...(!flow ? {
          whatsapp_url: `https://wa.me/33783921884?text=${encodeURIComponent(knowledgeWhatsAppText)}`,
          quick_replies: [
            { label: 'Devis précis sur WhatsApp', value: 'whatsapp', action: 'whatsapp' },
            { label: 'Recevoir par e-mail', value: 'mail', action: 'mail' },
          ],
        } : {}),
        ...diagnosticPayload,
      })
    }

    // La recette automatique valide les routes déterministes. Elle ne consomme
    // ni crédit OpenAI ni file d'attente humaine.
    const aiAnswer = isAutomatedEval
      ? null
      : await askOpenAI(conversation.id, message, body.context, relevantMatches)
    if (aiAnswer) {
      const suggestedQuestion = aiAnswer.suggested_question
        ? conciseAnswer(aiAnswer.suggested_question, 100)
        : null
      const coreLimit = suggestedQuestion ? Math.max(160, 318 - suggestedQuestion.length) : 300
      const coreAnswer = conciseAIVisible(aiAnswer.answer, coreLimit)
      const answer = suggestedQuestion
        ? `${coreAnswer}\n\n${suggestedQuestion}`
        : coreAnswer
      const whatsappText = `Bonjour Sébastien, je viens du site Solution Phone. Ma demande : ${message}`
      let expertRequestId: string | null = null
      let reference: string | null = null
      let shouldNotifyOwner = false

      if (aiAnswer.needs_human) {
        const expertRequest = await getOrCreateExpertRequest({
          conversationId: conversation.id,
          customerQuestion: message,
          normalizedQuestion: normalizedMessage,
          expertQuestion: `L’assistant a préparé cette réponse : « ${answer} ». Peux-tu confirmer ou préciser pour le client ?`,
        })
        expertRequestId = expertRequest.id
        reference = expertRequest.reference
        shouldNotifyOwner = expertRequest.created
      }

      const [, learningResult] = await Promise.all([
        admin.from('evan_messages').insert({
          conversation_id: conversation.id,
          role: 'evan',
          content: answer,
          confidence: aiAnswer.needs_human ? 0.58 : 0.72,
          metadata: { mode: 'ai', model: SEBASTIEN_AI_MODEL, intent: aiAnswer.intent, needs_human: aiAnswer.needs_human },
        }),
        admin.from('evan_learning_items').upsert({
          source_type: 'ai',
          source_reference: `conversation:${conversation.public_token}`,
          question: learningQuestion,
          proposed_answer: answer,
          confidence: aiAnswer.needs_human ? 0.58 : 0.72,
          status: 'review',
          created_by_label: 'Sébastien IA',
          safety_level: aiAnswer.safety ? 'sensitive' : 'normal',
          metadata: { model: SEBASTIEN_AI_MODEL, intent: aiAnswer.intent, needs_human: aiAnswer.needs_human },
        }, { onConflict: 'question_fingerprint,source_type' }),
        admin.from('evan_conversations').update({
          status: aiAnswer.needs_human ? 'waiting_expert' : 'resolved',
          last_message_at: new Date().toISOString(),
        }).eq('id', conversation.id),
      ])
      if (learningResult.error) throw learningResult.error
      if (aiAnswer.needs_human && expertRequestId && reference && shouldNotifyOwner) {
        await notifyOwner(reference, message, expertRequestId)
      }

      return json(origin, {
        conversation_token: conversation.public_token,
        mode: 'ai',
        matched: true,
        needs_expert: aiAnswer.needs_human,
        answer,
        topic: aiAnswer.intent,
        confidence: aiAnswer.needs_human ? 0.58 : 0.72,
        whatsapp_url: `https://wa.me/33783921884?text=${encodeURIComponent(whatsappText)}`,
        quick_replies: aiAnswer.needs_human ? [
          { label: 'Passer à Sébastien sur WhatsApp', value: 'whatsapp', action: 'whatsapp' },
          { label: 'Recevoir par e-mail', value: 'mail', action: 'mail' },
        ] : [
          { label: 'Obtenir un devis précis', value: 'whatsapp', action: 'whatsapp' },
          { label: 'Poser une autre question', value: 'question', action: 'question' },
        ],
      })
    }

    const expertQuestion = `Un client demande : « ${message} ». Quelle réponse Solution Phone dois-je lui transmettre ?`
    const fallbackAnswer = 'Je demande à l’équipe. Si personne n’est disponible immédiatement, envoyez votre demande sur WhatsApp ou par e-mail.'
    const whatsappText = `Bonjour Sébastien, demande depuis l’assistant : ${message}`

    if (isAutomatedEval) {
      return json(origin, {
        conversation_token: conversation.public_token,
        mode: 'expert',
        matched: false,
        needs_expert: true,
        simulated: true,
        answer: fallbackAnswer,
        whatsapp_url: `https://wa.me/33783921884?text=${encodeURIComponent(whatsappText)}`,
      })
    }

    const expertRequest = await getOrCreateExpertRequest({
      conversationId: conversation.id,
      customerQuestion: message,
      normalizedQuestion: normalizedMessage,
      expertQuestion,
    })
    const reference = expertRequest.reference
    const { error: learningError } = await admin
      .from('evan_learning_items')
      .upsert({
        source_type: 'customer',
        source_reference: reference,
        question: learningQuestion,
        status: 'waiting_answer',
        created_by_label: 'Visiteur du site',
        metadata: { normalized: normalizedMessage },
      }, { onConflict: 'question_fingerprint,source_type' })
    if (learningError) throw learningError

    if (expertRequest.created) await notifyOwner(reference, message, expertRequest.id)

    await Promise.all([
      admin.from('evan_messages').insert({
        conversation_id: conversation.id,
        role: 'evan',
        content: fallbackAnswer,
        confidence: 0.2,
        metadata: { mode: 'expert', reference },
      }),
      admin.from('evan_conversations').update({
        status: 'waiting_expert',
        last_message_at: new Date().toISOString(),
      }).eq('id', conversation.id),
    ])

    return json(origin, {
      conversation_token: conversation.public_token,
      mode: 'expert',
      matched: false,
      needs_expert: true,
      answer: fallbackAnswer,
      whatsapp_url: `https://wa.me/33783921884?text=${encodeURIComponent(whatsappText)}`,
    })
  } catch (error) {
    console.error('evan-brain error', error)
    return json(origin, {
      error: 'L’assistant rencontre un problème temporaire.',
      whatsapp_url: 'https://wa.me/33783921884',
    }, 500)
  }
})
