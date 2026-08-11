import { assertEquals } from 'jsr:@std/assert@1'
import { validateQuotePayload } from './validation.ts'

const valid = {
  name: 'Client test',
  email: 'client@example.com',
  phone: '06 00 00 00 00',
  request: 'Écran cassé sur un smartphone de test.',
  form_type: 'main_quote',
  page: '/',
  client_token: '123e4567-e89b-42d3-a456-426614174000',
}

Deno.test('accepte et nettoie une demande valide', () => {
  const result = validateQuotePayload({ ...valid, name: '  Client   test  ' })
  assertEquals(result.error, undefined)
  assertEquals(result.data?.name, 'Client test')
})

Deno.test('refuse un robot, un e-mail invalide et une demande trop courte', () => {
  assertEquals(validateQuotePayload({ ...valid, website: 'robot.example' }).error, 'Requête refusée.')
  assertEquals(validateQuotePayload({ ...valid, email: 'invalide' }).error, 'Indiquez une adresse e-mail valide.')
  assertEquals(validateQuotePayload({ ...valid, request: 'cassé' }).error, 'Décrivez votre demande plus précisément.')
})

