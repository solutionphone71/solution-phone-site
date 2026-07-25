import { createClient } from 'npm:@supabase/supabase-js@2.95.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN') ?? ''
const ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN') ?? ''
const APP_SECRET = Deno.env.get('WHATSAPP_APP_SECRET') ?? ''
const PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') ?? '1162686630271783'
const OWNER_NUMBER = (Deno.env.get('EVAN_OWNER_WHATSAPP') ?? '33752624241').replace(/\D/g, '')

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

type MetaMessage = {
  from?: string
  id?: string
  timestamp?: string
  type?: string
  text?: { body?: string }
  button?: { text?: string; payload?: string }
  interactive?: { button_reply?: { id?: string; title?: string }; list_reply?: { id?: string; title?: string } }
  context?: { id?: string; from?: string }
}

function response(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

function normalizePhone(value: string | undefined) {
  return (value || '').replace(/\D/g, '')
}

function messageText(message: MetaMessage) {
  return (
    message.text?.body ||
    message.button?.text ||
    message.interactive?.button_reply?.title ||
    message.interactive?.list_reply?.title ||
    ''
  ).trim().slice(0, 4000)
}

async function verifySignature(req: Request, rawBody: string) {
  if (!APP_SECRET) return false
  const signature = req.headers.get('x-hub-signature-256') || ''
  if (!signature.startsWith('sha256=')) return false
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(APP_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  const expected = `sha256=${Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')}`
  if (expected.length !== signature.length) return false
  let mismatch = 0
  for (let i = 0; i < expected.length; i += 1) mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  return mismatch === 0
}

async function sendText(text: string, replyTo?: string) {
  if (!ACCESS_TOKEN) throw new Error('WHATSAPP_ACCESS_TOKEN manquant')
  const payload: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: OWNER_NUMBER,
    type: 'text',
    text: { preview_url: false, body: text.slice(0, 3900) },
  }
  if (replyTo) payload.context = { message_id: replyTo }

  const apiResponse = await fetch(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const result = await apiResponse.json()
  if (!apiResponse.ok) throw new Error(result?.error?.message || `Erreur WhatsApp ${apiResponse.status}`)
  return result?.messages?.[0]?.id as string | undefined
}

async function findExpertRequest(message: MetaMessage, body: string) {
  if (message.context?.id) {
    const { data: event } = await admin
      .from('evan_whatsapp_events')
      .select('expert_request_id, reference')
      .eq('meta_message_id', message.context.id)
      .maybeSingle()
    if (event?.expert_request_id) {
      const { data } = await admin.from('evan_expert_requests').select('*').eq('id', event.expert_request_id).maybeSingle()
      if (data) return data
    }
  }

  const reference = body.match(/EV-[A-Z0-9-]+/i)?.[0]?.toUpperCase()
  if (reference) {
    const { data } = await admin.from('evan_expert_requests').select('*').eq('reference', reference).maybeSingle()
    if (data) return data
  }

  const { data } = await admin
    .from('evan_expert_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(2)
  return data?.length === 1 ? data[0] : null
}

function stripReference(body: string) {
  return body.replace(/\bEV-[A-Z0-9-]+\b\s*[:—-]?\s*/i, '').trim()
}

async function processOwnerMessage(message: MetaMessage, payload: unknown) {
  const from = normalizePhone(message.from)
  const body = messageText(message)
  const eventBase = {
    meta_message_id: message.id || null,
    direction: 'inbound',
    from_number: from,
    to_number: normalizePhone(PHONE_NUMBER_ID),
    message_type: message.type || 'unknown',
    body: body || null,
    reply_to_message_id: message.context?.id || null,
    payload,
  }

  if (from !== OWNER_NUMBER) {
    await admin.from('evan_whatsapp_events').upsert({ ...eventBase, processed_status: 'ignored' }, { onConflict: 'meta_message_id' })
    return
  }
  if (!body) {
    await admin.from('evan_whatsapp_events').upsert({ ...eventBase, processed_status: 'ignored' }, { onConflict: 'meta_message_id' })
    await sendText('Je comprends pour le moment uniquement les messages écrits.', message.id)
    return
  }

  const command = body
    .toLocaleLowerCase('fr-FR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

  if (/^(bonjour|salut|hello|coucou|oui|ok|aide)( evan)?$/.test(command)) {
    await admin.from('evan_whatsapp_events').upsert({
      ...eventBase,
      processed_status: 'processed',
      processed_at: new Date().toISOString(),
      payload: { raw: payload, action: 'private_connection' },
    }, { onConflict: 'meta_message_id' })
    await sendText(
      'Connexion privée active ✅\n\nJe te contacte ici uniquement lorsqu’un client pose une question que je ne sais pas traiter.\n\nPour m’apprendre une réponse :\nApprends : question => réponse',
      message.id,
    )
    return
  }

  const directTeaching = body.match(/^apprends\s*[:\-]\s*(.+?)\s*(?:=>|=)\s*(.+)$/is)
  if (directTeaching) {
    const question = directTeaching[1].trim().slice(0, 2000)
    const answer = directTeaching[2].trim().slice(0, 6000)
    const { data: knowledgeId, error } = await admin.rpc('evan_record_learning', {
      learning_question: question,
      learning_answer: answer,
      learning_source: 'owner',
      author_label: 'Sébastien via WhatsApp',
      learning_category: 'general',
      learning_keywords: [],
      learning_confidence: 0.95,
      auto_validate: true,
    })
    if (error) throw error
    await admin.from('evan_whatsapp_events').upsert({
      ...eventBase,
      processed_status: 'processed',
      processed_at: new Date().toISOString(),
      payload: { raw: payload, action: 'direct_teaching', knowledge_id: knowledgeId },
    }, { onConflict: 'meta_message_id' })
    await sendText('C’est appris ✅ Je réutiliserai cette réponse pour les prochains clients.', message.id)
    return
  }

  const request = await findExpertRequest(message, body)
  if (!request) {
    await admin.from('evan_whatsapp_events').upsert({ ...eventBase, processed_status: 'ignored' }, { onConflict: 'meta_message_id' })
    await sendText('Je n’ai pas trouvé la question liée. Réponds directement à mon message, ou écris :\nApprends : question => réponse', message.id)
    return
  }

  const answer = stripReference(body).slice(0, 4000)
  if (answer.length < 3) {
    await sendText('Ta réponse est trop courte. Donne-moi la réponse complète à transmettre au client.', message.id)
    return
  }

  const { data: knowledgeId, error: learningError } = await admin.rpc('evan_record_learning', {
    learning_question: request.customer_question,
    learning_answer: answer,
    learning_source: 'owner',
    author_label: 'Sébastien via WhatsApp',
    learning_category: 'diagnostic',
    learning_keywords: [],
    learning_confidence: 0.95,
    auto_validate: true,
  })
  if (learningError) throw learningError

  await Promise.all([
    admin.from('evan_expert_requests').update({
      expert_answer: answer,
      status: 'answered',
      answered_at: new Date().toISOString(),
      learned_knowledge_id: knowledgeId,
    }).eq('id', request.id),
    admin.from('evan_conversations').update({ status: 'resolved', last_message_at: new Date().toISOString() }).eq('id', request.conversation_id),
    admin.from('evan_messages').insert({
      conversation_id: request.conversation_id,
      role: 'expert',
      content: answer,
      knowledge_id: knowledgeId,
      confidence: 0.95,
      metadata: { channel: 'owner_whatsapp', reference: request.reference },
    }),
    admin.from('evan_whatsapp_events').upsert({
      ...eventBase,
      reference: request.reference,
      expert_request_id: request.id,
      processed_status: 'processed',
      processed_at: new Date().toISOString(),
    }, { onConflict: 'meta_message_id' }),
  ])
  await sendText(`Merci ✅ Réponse ${request.reference} enregistrée dans ma mémoire.`, message.id)
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')
    if (mode === 'subscribe' && token === VERIFY_TOKEN && challenge) return response(challenge)
    return response('Vérification refusée', 403)
  }
  if (req.method !== 'POST') return response('Méthode non autorisée', 405)

  const rawBody = await req.text()
  const signedByMeta = APP_SECRET ? await verifySignature(req, rawBody) : false
  const protectedCallback = !APP_SECRET && url.searchParams.get('token') === VERIFY_TOKEN
  if (!signedByMeta && !protectedCallback) return response('Signature invalide', 401)

  try {
    const payload = JSON.parse(rawBody)
    const changes = (payload?.entry || []).flatMap((entry: any) => entry?.changes || [])
    for (const change of changes) {
      const value = change?.value || {}
      if (value?.metadata?.phone_number_id && value.metadata.phone_number_id !== PHONE_NUMBER_ID) continue
      for (const message of value.messages || []) await processOwnerMessage(message, payload)
      for (const status of value.statuses || []) {
        await admin.from('evan_whatsapp_events').upsert({
          meta_message_id: status.id || null,
          direction: 'status',
          to_number: normalizePhone(status.recipient_id),
          message_type: 'status',
          delivery_status: status.status || null,
          processed_status: 'processed',
          processed_at: new Date().toISOString(),
          payload: status,
        }, { onConflict: 'meta_message_id' })
      }
    }
    return response('EVENT_RECEIVED')
  } catch (error) {
    console.error('evan-whatsapp error', error)
    return response('EVENT_RECEIVED')
  }
})
