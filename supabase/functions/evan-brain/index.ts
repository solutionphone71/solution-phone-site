import { createClient } from 'npm:@supabase/supabase-js@2.95.0'

const ALLOWED_ORIGINS = new Set([
  'https://solution-phone.fr',
  'https://www.solution-phone.fr',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
])

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN') ?? ''
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') ?? '1162686630271783'
const EVAN_OWNER_WHATSAPP = (Deno.env.get('EVAN_OWNER_WHATSAPP') ?? '33752624241').replace(/\D/g, '')
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

type EvanRequest = {
  message?: string
  conversation_token?: string
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

function rankForDeviceDomain(message: string, matches: KnowledgeMatch[]) {
  const domain = /\b(ps[2345]|playstation|xbox|switch|nintendo|console)\b/.test(message)
    ? 'console'
    : /\b(trottinette|mobilite|scooter electrique)\b/.test(message)
      ? 'mobilite'
      : /\b(pc|ordinateur|macbook|imac|windows|laptop)\b/.test(message)
        ? 'informatique'
        : null

  if (!domain) return matches

  return [...matches].sort((a, b) => {
    const affinity = (match: KnowledgeMatch) => {
      const searchable = normalize(`${match.slug} ${match.category} ${match.title}`)
      if (domain === 'console') return /console|playstation|xbox|nintendo|switch/.test(searchable) ? 0.5 : -0.35
      if (domain === 'mobilite') return /mobilite|trottinette|scooter/.test(searchable) ? 0.5 : -0.35
      return /informatique|ordinateur|pc|macbook|imac|windows/.test(searchable) ? 0.4 : -0.25
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
  const { data } = await admin
    .from('evan_rate_limits')
    .select('request_count')
    .eq('key_hash', keyHash)
    .eq('window_started_at', windowStartedAt)
    .maybeSingle()

  const count = Number(data?.request_count || 0)
  if (count >= 24) return false

  await admin.from('evan_rate_limits').upsert({
    key_hash: keyHash,
    window_started_at: windowStartedAt,
    request_count: count + 1,
  }, { onConflict: 'key_hash,window_started_at' })
  return true
}

async function getConversation(token: string | undefined, context: EvanRequest['context']) {
  if (isUuid(token)) {
    const { data } = await admin
      .from('evan_conversations')
      .select('id, public_token, metadata, device_brand, device_model')
      .eq('public_token', token)
      .maybeSingle()
    if (data) return data
  }

  const { data, error } = await admin
    .from('evan_conversations')
    .insert({
      channel: 'web',
      device_brand: context?.brand?.slice(0, 80) || null,
      device_model: context?.model?.slice(0, 120) || null,
      consent_to_store: context?.consent_to_store === true,
      metadata: { page: context?.page?.slice(0, 200) || null },
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
    `Evan a besoin de toi — ${reference}`,
    `Client : ${customerQuestion}`,
    '',
    'Réponds directement à ce message. J’enregistrerai ta réponse dans ma mémoire.',
  ].join('\n').slice(0, 3900)
  try {
    const apiResponse = await fetch(`https://graph.facebook.com/v25.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: EVAN_OWNER_WHATSAPP,
        type: 'text',
        text: { preview_url: false, body: text },
      }),
    })
    const result = await apiResponse.json()
    if (!apiResponse.ok) throw new Error(result?.error?.message || `Erreur WhatsApp ${apiResponse.status}`)
    await admin.from('evan_whatsapp_events').insert({
      meta_message_id: result?.messages?.[0]?.id || null,
      direction: 'outbound',
      from_number: '33602849953',
      to_number: EVAN_OWNER_WHATSAPP,
      message_type: 'text',
      body: text,
      reference,
      expert_request_id: expertRequestId,
      processed_status: 'processed',
      processed_at: new Date().toISOString(),
      payload: result,
    })
  } catch (error) {
    console.error('owner notification failed', error)
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

  if (origin && !ALLOWED_ORIGINS.has(origin)) return json(origin, { error: 'Origine non autorisée.' }, 403)
  if (req.method !== 'POST') return json(origin, { error: 'Méthode non autorisée.' }, 405)
  if (!(await withinRateLimit(req))) return json(origin, { error: 'Trop de demandes. Réessayez dans une minute.' }, 429)

  try {
    await admin.rpc('evan_prune_expired_conversations')
    const body = await req.json() as EvanRequest
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 1200) : ''
    if (message.length < 3) return json(origin, { error: 'Décrivez le problème en quelques mots.' }, 400)

    const conversation = await getConversation(body.conversation_token, body.context)
    const normalizedMessage = normalize(message)
    const learningQuestion = sanitizeForLearning(message)

    await admin.from('evan_messages').insert({
      conversation_id: conversation.id,
      role: 'client',
      content: message,
      metadata: { normalized: normalizedMessage },
    })

    const conversationMetadata = (conversation.metadata && typeof conversation.metadata === 'object')
      ? conversation.metadata as Record<string, unknown>
      : {}
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
        const reachedLimit = (activeDiagnostic.questions_asked || 1) >= flow.max_questions

        if (nextStep && !reachedLimit) {
          const nextState: DiagnosticState = {
            ...activeDiagnostic,
            step_index: nextIndex,
            answers,
            questions_asked: (activeDiagnostic.questions_asked || 1) + 1,
          }
          const answer = `Noté. ${nextStep.question}`
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
          return json(origin, {
            conversation_token: conversation.public_token,
            mode: 'diagnostic',
            matched: true,
            diagnostic_active: true,
            answer,
            topic: flow.title,
            question: nextStep.question,
            quick_replies: quickReplies(nextStep),
            diagnostic_progress: { current: nextState.questions_asked, total: flow.max_questions },
          })
        }

        const summary = diagnosticSummary(flow, answers)
        const whatsappText = `Bonjour Evan, mon diagnostic est terminé : ${summary}. Pouvez-vous me confirmer la suite et le devis ?`
        const answer = conciseAnswer(flow.completion_message, 240)
        const completedMetadata = {
          ...conversationMetadata,
          diagnostic: null,
          last_diagnostic: { flow: flow.slug, answers, completed_at: new Date().toISOString() },
        }
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
      await admin.from('evan_conversations').update({
        metadata: { ...conversationMetadata, diagnostic: null },
      }).eq('id', conversation.id)
    }

    const { data: matches, error: searchError } = await admin.rpc('evan_search_knowledge', {
      query_text: normalizedMessage,
      result_limit: 3,
    })
    if (searchError) throw searchError

    const rankedMatches = rankForDeviceDomain(normalizedMessage, (matches || []) as KnowledgeMatch[])
    const best = (rankedMatches[0] || null) as KnowledgeMatch | null
    const accepted = best && Number(best.score) >= 0.29

    if (accepted && best) {
      const confidence = Math.min(Number(best.confidence || 0.8), Number(best.score || 0.3) + 0.2)
      const flow = await getDiagnosticFlow('knowledge_slug', best.slug)
      let diagnosticPayload: Record<string, unknown> = {}
      let answer = conciseAnswer(best.answer)

      if (flow) {
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
            diagnostic_progress: { current: 1, total: flow.max_questions },
          }
          conversationMetadata.diagnostic = state
        }
      }

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

      return json(origin, {
        conversation_token: conversation.public_token,
        mode: flow ? 'diagnostic' : 'knowledge',
        matched: true,
        answer,
        topic: best.title,
        confidence,
        follow_up_questions: best.follow_up_questions || [],
        warnings: best.warnings || [],
        suggestions: best.sales_suggestions || [],
        ...diagnosticPayload,
      })
    }

    const reference = expertReference()
    const expertQuestion = `Un client demande : « ${message} ». Quelle réponse Solution Phone dois-je lui transmettre ?`
    const fallbackAnswer = `Je n’ai pas encore de réponse sûre pour ce cas. Envoyez la demande sur WhatsApp ou par e-mail — référence ${reference}.`
    const whatsappText = `Bonjour Evan, demande ${reference} : ${message}`

    const [{ data: expertRequest, error: expertError }, { error: learningError }] = await Promise.all([
      admin.from('evan_expert_requests').insert({
        reference,
        conversation_id: conversation.id,
        customer_question: message,
        evan_summary: normalizedMessage,
        expert_question: expertQuestion,
      }).select('id').single(),
      admin.from('evan_learning_items').upsert({
        source_type: 'customer',
        source_reference: reference,
        question: learningQuestion,
        status: 'waiting_answer',
        created_by_label: 'Visiteur du site',
        metadata: { normalized: normalizedMessage },
      }, { onConflict: 'question_fingerprint,source_type' }),
    ])
    if (expertError) throw expertError
    if (learningError) throw learningError

    if (expertRequest?.id) await notifyOwner(reference, message, expertRequest.id)

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
      reference,
      answer: fallbackAnswer,
      whatsapp_url: `https://wa.me/33783921884?text=${encodeURIComponent(whatsappText)}`,
    })
  } catch (error) {
    console.error('evan-brain error', error)
    return json(origin, {
      error: 'Evan rencontre un problème temporaire.',
      whatsapp_url: 'https://wa.me/33783921884',
    }, 500)
  }
})
