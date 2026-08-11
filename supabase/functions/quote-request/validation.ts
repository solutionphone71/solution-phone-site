export type QuotePayload = {
  name: string
  email: string
  phone: string | null
  request: string
  form_type: 'main_quote' | 'quick_other_part'
  page: string
  client_token: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function clean(value: unknown, max: number) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
    : ''
}

export function validateQuotePayload(value: unknown): { data?: QuotePayload; error?: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { error: 'Requête invalide.' }
  const input = value as Record<string, unknown>
  if (clean(input.website, 20)) return { error: 'Requête refusée.' }

  const name = clean(input.name, 120)
  const email = clean(input.email, 254).toLowerCase()
  const phone = clean(input.phone, 40) || null
  const request = clean(input.request, 2000)
  const page = clean(input.page, 240) || '/'
  const clientToken = clean(input.client_token, 36)
  const formType = input.form_type === 'quick_other_part' ? 'quick_other_part' : input.form_type === 'main_quote' ? 'main_quote' : null

  if (name.length < 2) return { error: 'Indiquez votre nom.' }
  if (!EMAIL.test(email)) return { error: 'Indiquez une adresse e-mail valide.' }
  if (request.length < 10) return { error: 'Décrivez votre demande plus précisément.' }
  if (!formType) return { error: 'Type de formulaire invalide.' }
  if (!UUID.test(clientToken)) return { error: 'Identifiant de demande invalide.' }

  return { data: { name, email, phone, request, form_type: formType, page, client_token: clientToken } }
}

