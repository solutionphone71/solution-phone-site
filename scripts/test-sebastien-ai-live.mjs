const endpoint = 'https://kdvxcnjfrmvlnrymfyug.supabase.co/functions/v1/evan-brain'
const key = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_3Mub3jSj8wUC8mfFtAuhdA_P4Ljnnhb'

if (process.env.RUN_LIVE_AI_TEST !== '1') {
  console.error('Test non lancé : ajoutez RUN_LIVE_AI_TEST=1 pour autoriser un appel OpenAI facturé.')
  process.exit(2)
}

const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Origin: 'http://localhost:4175',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Mon Google Pixel 8 Pro redémarre uniquement quand j’ouvre l’appareil photo. Que dois-je vérifier ?',
    context: {
      page: 'manual-ai-audit',
      brand: 'Google',
      model: 'Pixel 8 Pro',
      consent_to_store: false,
    },
  }),
})

const data = await response.json()
const answer = String(data.answer || '')
const passed = response.ok &&
  data.mode === 'ai' &&
  data.needs_expert === false &&
  /redémarr/i.test(answer) &&
  /(coque|accessoire|application|mise à jour)/i.test(answer) &&
  !/\b\d+(?:[.,]\d+)?\s*(?:€|euros?)\b/i.test(answer) &&
  !/(chatgpt|openai|base de données|référence\s+ev-)/i.test(answer)

console.log(`${passed ? '✓' : '✗'} appel OpenAI réel — ${data.mode || response.status}`)
console.log(answer)

if (!passed) {
  console.error(data)
  process.exitCode = 1
}
