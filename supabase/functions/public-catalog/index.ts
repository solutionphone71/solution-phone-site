import { createClient } from 'npm:@supabase/supabase-js@2.95.0'
import {
  androidFromSetting,
  androidFromTable,
  type AndroidRow,
  mapNewPhones,
  mapUsedPhones,
  normalizePriceRows,
  parseStockPublication,
  PRICE_SETTING_KEYS,
  type PriceRow,
  safePrice,
  safeText,
  splitVitrineStock,
  STOCK_PUBLICATION_KEY,
} from '../_shared/vitrine-catalog.ts'

const ALLOWED_ORIGINS = new Set([
  'https://solution-phone.fr',
  'https://www.solution-phone.fr',
  'https://reparation-iphone-macon.fr',
  'https://www.reparation-iphone-macon.fr',
  'https://solution-accessoires.fr',
  'https://www.solution-accessoires.fr',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:4174',
  'http://127.0.0.1:4174',
  'http://localhost:4175',
  'http://127.0.0.1:4175',
  'http://127.0.0.1:4180',
])

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function headers(origin: string) {
  const result: Record<string, string> = {
    'Access-Control-Allow-Headers': 'apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    'Content-Type': 'application/json; charset=utf-8',
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff',
  }
  if (ALLOWED_ORIGINS.has(origin)) result['Access-Control-Allow-Origin'] = origin
  return result
}

function json(origin: string, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: headers(origin) })
}

async function prices() {
  const { data: settings, error: settingsError } = await admin
    .from('settings')
    .select('key,value')
    .in('key', [...PRICE_SETTING_KEYS])
  if (settingsError) throw settingsError

  let screens: PriceRow[] = []
  let batteries: PriceRow[] = []
  let android: AndroidRow[] = []
  for (const setting of settings ?? []) {
    if (setting.key === 'android_prix_json') {
      // Prix Android publiés par la V2 (ou saisis dans la V1) : source principale.
      android = androidFromSetting(setting.value)
      continue
    }
    try {
      const parsed = JSON.parse(setting.value)
      if (setting.key === 'ecrans_prix_json') {
        screens = normalizePriceRows([...(parsed?.t1 ?? []), ...(parsed?.t2 ?? [])])
      } else if (setting.key === 'batteries_prix_json') {
        batteries = normalizePriceRows(parsed)
      }
    } catch {
      // A malformed internal setting must never expose the raw value.
    }
  }

  if (!screens.length) {
    const { data, error } = await admin
      .from('ecrans_prix')
      .select('modele,p0,p1,p2,p3,p4')
      .order('modele')
    if (error) throw error
    screens = (data ?? []).map((row) => ({
      modele: safeText(row.modele, 90),
      prix: [row.p0, row.p1, row.p2, row.p3, row.p4].map(safePrice),
    })).filter((row) => row.modele && row.prix.some((price) => price !== null))
  }

  if (!android.length) {
    // Secours seulement : l'ancienne table n'est plus mise à jour.
    const { data: androidData, error: androidError } = await admin
      .from('prix_reparation_android')
      .select('marque,modele,ecran_compat,ecran_original,batterie_compat,batterie_original,connecteur,vitre_arriere,remarques')
      .order('marque')
      .order('modele')
    if (androidError) throw androidError
    android = androidFromTable(androidData)
  }

  return { screens, batteries, android }
}

async function stock() {
  const { data: marker, error: markerError } = await admin
    .from('settings')
    .select('value')
    .eq('key', STOCK_PUBLICATION_KEY)
    .maybeSingle()
  if (markerError) throw markerError

  if (parseStockPublication(marker?.value)) {
    // La V2 publie le stock : vitrine_phones fait foi, même vide.
    const { data, error } = await admin
      .from('vitrine_phones')
      .select('kind,modele,stockage,grade,batterie,vente,couleur,photo_face,photo_dos')
      .order('vente')
      .limit(500)
    if (error) throw error
    return splitVitrineStock(data)
  }

  // Ancien comportement (V1 encore autorité).
  const [usedResult, newResult] = await Promise.all([
    admin.from('phones')
      .select('modele,stockage,grade,batterie,vente,couleur,photo_face,photo_dos')
      .eq('etat', 'DISPONIBLE')
      .is('date_vente', null)
      .gt('vente', 0)
      .order('vente'),
    admin.from('phones_neufs')
      .select('modele,stockage,vente,couleur,photo_face,photo_dos')
      .eq('etat', 'DISPONIBLE')
      .is('date_vente', null)
      .gt('vente', 0)
      .order('vente'),
  ])
  if (usedResult.error) throw usedResult.error
  if (newResult.error) throw newResult.error

  return { used: mapUsedPhones(usedResult.data), new: mapNewPhones(newResult.data) }
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin') ?? ''
  if (req.method === 'OPTIONS') {
    if (!ALLOWED_ORIGINS.has(origin)) return json(origin, { error: 'Origin not allowed' }, 403)
    return new Response(null, { status: 204, headers: headers(origin) })
  }
  if (req.method !== 'GET') return json(origin, { error: 'Method not allowed' }, 405)
  if (!ALLOWED_ORIGINS.has(origin)) return json(origin, { error: 'Origin not allowed' }, 403)

  const resource = new URL(req.url).searchParams.get('resource') ?? 'all'
  if (!['prices', 'stock', 'all'].includes(resource)) return json(origin, { error: 'Unknown resource' }, 400)

  try {
    if (resource === 'prices') return json(origin, { prices: await prices() })
    if (resource === 'stock') return json(origin, { stock: await stock() })
    const [priceData, stockData] = await Promise.all([prices(), stock()])
    return json(origin, { prices: priceData, stock: stockData })
  } catch (error) {
    console.error('public-catalog failure', error instanceof Error ? error.message : 'unknown error')
    return json(origin, { error: 'Catalogue momentanément indisponible' }, 503)
  }
})
