import { createClient } from 'npm:@supabase/supabase-js@2.95.0'
import { validateQuotePayload } from './validation.ts'

const ALLOWED_ORIGINS = new Set([
  'https://solution-phone.fr',
  'https://www.solution-phone.fr',
  'https://reparation-iphone-macon.fr',
  'https://www.reparation-iphone-macon.fr',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
])
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN') ?? ''
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') ?? ''
const OWNER_WHATSAPP = (Deno.env.get('EVAN_OWNER_WHATSAPP') ?? '').replace(/\D/g, '')
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })

function headers(origin: string) {
  const value: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'Vary': 'Origin',
  }
  if (ALLOWED_ORIGINS.has(origin)) value['Access-Control-Allow-Origin'] = origin
  return value
}

function json(origin: string, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: headers(origin) })
}

async function digest(value: string) {
  const bytes = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hash)).map((item) => item.toString(16).padStart(2, '0')).join('')
}

function quoteReference() {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  const random = crypto.getRandomValues(new Uint8Array(3))
  return `DV-${date}-${Array.from(random).map((item) => item.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

async function notifyOwner(row: { id: string; reference: string; customer_name: string; customer_email: string; customer_phone: string | null; request_text: string }) {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID || !OWNER_WHATSAPP) {
    await admin.from('web_quote_requests').update({ notification_status: 'skipped', updated_at: new Date().toISOString() }).eq('id', row.id)
    return
  }

  const text = [
    `Nouveau devis site — ${row.reference}`,
    `Client : ${row.customer_name}`,
    `E-mail : ${row.customer_email}`,
    row.customer_phone ? `Téléphone : ${row.customer_phone}` : '',
    `Demande : ${row.request_text}`,
  ].filter(Boolean).join('\n').slice(0, 3900)

  try {
    const response = await fetch(`https://graph.facebook.com/v25.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: OWNER_WHATSAPP,
        type: 'template',
        template: {
          name: 'evan_question_equipe',
          language: { code: 'fr' },
          components: [{ type: 'body', parameters: [
            { type: 'text', text: row.reference },
            { type: 'text', text: `Devis ${row.customer_name} - ${row.request_text}`.replace(/\s+/g, ' ').trim().slice(0, 900) },
          ] }],
        },
      }),
      signal: AbortSignal.timeout(8000),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(payload?.error?.message || `WhatsApp ${response.status}`)
    await admin.from('web_quote_requests').update({ notification_status: 'sent', notification_error: null, updated_at: new Date().toISOString() }).eq('id', row.id)
  } catch (error) {
    await admin.from('web_quote_requests').update({
      notification_status: 'failed',
      notification_error: (error instanceof Error ? error.message : String(error)).slice(0, 500),
      updated_at: new Date().toISOString(),
    }).eq('id', row.id)
    console.error('quote owner notification failed', error)
  }
}

async function notifyByEmail(row: { id: string; reference: string; customer_name: string; customer_email: string; customer_phone: string | null; request_text: string }) {
  try {
    const response = await fetch('https://formsubmit.co/ajax/contact@solution-phone.fr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Origin: 'https://solution-phone.fr',
        Referer: 'https://solution-phone.fr/',
      },
      body: JSON.stringify({
        Nom: row.customer_name,
        Email: row.customer_email,
        Telephone: row.customer_phone || 'Non renseigné',
        Demande: row.request_text,
        Référence: row.reference,
        _replyto: row.customer_email,
        _subject: `Nouveau devis site — ${row.reference}`,
        _template: 'table',
        _url: 'https://solution-phone.fr/',
      }),
      signal: AbortSignal.timeout(8000),
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload || (payload.success !== true && payload.success !== 'true')) {
      throw new Error(`Acheminement e-mail ${response.status}`)
    }
    await admin.from('web_quote_requests').update({ email_notification_status: 'sent', email_notification_error: null, updated_at: new Date().toISOString() }).eq('id', row.id)
  } catch (error) {
    await admin.from('web_quote_requests').update({
      email_notification_status: 'failed',
      email_notification_error: (error instanceof Error ? error.message : String(error)).slice(0, 500),
      updated_at: new Date().toISOString(),
    }).eq('id', row.id)
    console.error('quote email notification failed', error)
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') ?? ''
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: headers(origin) })
  if (req.method !== 'POST') return json(origin, { error: 'Méthode non autorisée.' }, 405)
  if (!ALLOWED_ORIGINS.has(origin)) return json(origin, { error: 'Origine non autorisée.' }, 403)
  if (Number(req.headers.get('content-length') || 0) > 24_000) return json(origin, { error: 'Requête trop volumineuse.' }, 413)

  try {
    const validation = validateQuotePayload(await req.json())
    if (!validation.data) return json(origin, { error: validation.error }, 400)
    const data = validation.data

    const { data: duplicate, error: duplicateError } = await admin
      .from('web_quote_requests').select('reference').eq('client_token', data.client_token).maybeSingle()
    if (duplicateError) throw duplicateError
    if (duplicate) return json(origin, { received: true, reference: duplicate.reference, duplicate: true })

    const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const fingerprint = await digest(`${forwarded}|${new Date().toISOString().slice(0, 10)}|${SERVICE_ROLE_KEY.slice(-24)}`)
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const { count, error: rateError } = await admin.from('web_quote_requests')
      .select('id', { count: 'exact', head: true }).eq('client_fingerprint', fingerprint).gte('created_at', since)
    if (rateError) throw rateError
    if ((count || 0) >= 5) return json(origin, { error: 'Trop de demandes rapprochées. Réessayez dans quelques minutes.' }, 429)

    const reference = quoteReference()
    const { data: created, error: createError } = await admin.from('web_quote_requests').insert({
      reference,
      client_token: data.client_token,
      customer_name: data.name,
      customer_email: data.email,
      customer_phone: data.phone,
      request_text: data.request,
      form_type: data.form_type,
      source_page: data.page,
      client_fingerprint: fingerprint,
    }).select('id,reference,customer_name,customer_email,customer_phone,request_text').single()
    if (createError) throw createError

    await Promise.all([notifyOwner(created), notifyByEmail(created)])
    return json(origin, { received: true, reference: created.reference })
  } catch (error) {
    console.error('quote-request error', error)
    return json(origin, { error: 'La demande n’a pas pu être enregistrée.' }, 500)
  }
})
