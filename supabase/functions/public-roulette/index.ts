import { createClient } from 'npm:@supabase/supabase-js@2.95.0'

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
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

type Prize = { label: string; emoji: string; color: string; weight: number }

function responseHeaders(origin: string, cache = false) {
  const result: Record<string, string> = {
    'Access-Control-Allow-Headers': 'apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': cache ? 'public, max-age=60, stale-while-revalidate=300' : 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff',
  }
  if (ALLOWED_ORIGINS.has(origin)) result['Access-Control-Allow-Origin'] = origin
  return result
}

function json(origin: string, body: unknown, status = 200, cache = false) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders(origin, cache) })
}

function safeText(value: unknown, max: number) {
  return String(value ?? '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max)
}

function normalizePhone(value: unknown) {
  let digits = String(value ?? '').replace(/\D/g, '')
  if (digits.startsWith('0033')) digits = `0${digits.slice(4)}`
  if (digits.startsWith('33') && digits.length === 11) digits = `0${digits.slice(2)}`
  return /^0[1-9]\d{8}$/.test(digits) ? digits : ''
}

function normalizePrizes(value: unknown): Prize[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, 12).map((raw) => {
    const prize = raw as Record<string, unknown>
    const weight = Number(prize.weight)
    return {
      label: safeText(prize.label, 100),
      emoji: safeText(prize.emoji, 12),
      color: /^#[0-9a-f]{6}$/i.test(String(prize.color ?? '')) ? String(prize.color) : '#b91c1c',
      weight: Number.isFinite(weight) && weight > 0 ? Math.min(weight, 10_000) : 0,
    }
  }).filter((prize) => prize.label && prize.weight > 0)
}

async function getConfig() {
  const { data, error } = await admin
    .from('roulette_config')
    .select('google_url,prizes')
    .eq('id', 1)
    .maybeSingle()
  if (error) throw error
  return {
    googleUrl: /^https:\/\//i.test(String(data?.google_url ?? '')) ? safeText(data?.google_url, 500) : '',
    prizes: normalizePrizes(data?.prizes),
  }
}

function choosePrize(prizes: Prize[]) {
  const total = prizes.reduce((sum, prize) => sum + prize.weight, 0)
  const random = new Uint32Array(1)
  crypto.getRandomValues(random)
  const draw = (random[0] / 0x100000000) * total
  let cursor = 0
  for (const prize of prizes) {
    cursor += prize.weight
    if (draw < cursor) return prize
  }
  return prizes[prizes.length - 1]
}

async function existingParticipation(phone: string) {
  const { data, error } = await admin
    .from('roulette_participations')
    .select('lot_gagne')
    .eq('telephone', phone)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin') ?? ''
  if (req.method === 'OPTIONS') {
    if (!ALLOWED_ORIGINS.has(origin)) return json(origin, { error: 'Origin not allowed' }, 403)
    return new Response(null, { status: 204, headers: responseHeaders(origin) })
  }
  if (!ALLOWED_ORIGINS.has(origin)) return json(origin, { error: 'Origin not allowed' }, 403)

  try {
    if (req.method === 'GET') return json(origin, await getConfig(), 200, true)
    if (req.method !== 'POST') return json(origin, { error: 'Method not allowed' }, 405)
    if (Number(req.headers.get('content-length') ?? 0) > 2048) return json(origin, { error: 'Request too large' }, 413)

    const body = await req.json().catch(() => ({})) as Record<string, unknown>
    const action = safeText(body.action, 12)
    const phone = normalizePhone(body.telephone)
    if (!phone) return json(origin, { error: 'Numéro de téléphone invalide' }, 400)

    const previous = await existingParticipation(phone)
    if (action === 'check') return json(origin, { alreadyPlayed: Boolean(previous) })
    if (action !== 'spin') return json(origin, { error: 'Action inconnue' }, 400)
    if (previous) return json(origin, { alreadyPlayed: true })

    const config = await getConfig()
    if (!config.prizes.length) throw new Error('No active prizes')
    const prize = choosePrize(config.prizes)
    const { error: insertError } = await admin.from('roulette_participations').insert({
      telephone: phone,
      lot_gagne: prize.label,
      date_participation: new Date().toISOString(),
    })
    if (insertError) {
      if (insertError.code === '23505' || await existingParticipation(phone)) {
        return json(origin, { alreadyPlayed: true })
      }
      throw insertError
    }
    return json(origin, { alreadyPlayed: false, prize })
  } catch (error) {
    console.error('public-roulette failure', error instanceof Error ? error.message : 'unknown error')
    return json(origin, { error: 'La roue est momentanément indisponible' }, 503)
  }
})
