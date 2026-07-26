import roots from './data/sebastien-top-100.mjs'
import expanded from './data/sebastien-top-1000.mjs'
import fullLibrary from './data/sebastien-10000.mjs'

const endpoint = 'https://kdvxcnjfrmvlnrymfyug.supabase.co/functions/v1/evan-brain'
const key = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_3Mub3jSj8wUC8mfFtAuhdA_P4Ljnnhb'
const questions = process.env.AUDIT_SET === '10000'
  ? fullLibrary
  : process.env.AUDIT_SET === '1000'
    ? expanded
    : roots
const totalLabel = questions.length
const delayMs = Number(process.env.AUDIT_DELAY_MS || 2700)
const offset = Math.max(0, Number(process.env.AUDIT_OFFSET || 0))
const limit = Math.min(questions.length - offset, Math.max(1, Number(process.env.AUDIT_LIMIT || questions.length)))
const requestedIds = new Set((process.env.AUDIT_IDS || '').split(',').map((id) => id.trim()).filter(Boolean))
const requestedFrame = Number(process.env.AUDIT_FRAME || 0)
const requestedContext = Number(process.env.AUDIT_CONTEXT || 0)
const variantSelection = requestedFrame || requestedContext
  ? questions.filter((item) => (!requestedFrame || item.frame === requestedFrame) && (!requestedContext || item.context === requestedContext))
  : null
const selected = requestedIds.size
  ? questions.filter((item) => requestedIds.has(item.id))
  : variantSelection || questions.slice(offset, offset + limit)
const printAnswers = process.env.AUDIT_PRINT_ANSWERS === '1'

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  Origin: 'http://localhost:4175',
  'Content-Type': 'application/json',
}

const results = []
const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration))

for (const [index, item] of selected.entries()) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: item.question,
      context: { page: 'automated-eval', consent_to_store: false },
    }),
  })
  const data = await response.json().catch(() => ({}))
  results.push({
    ...item,
    status: response.status,
    mode: data.mode || 'error',
    matched: data.matched === true,
    answer: data.answer || data.error || '',
  })
  console.log(`${String(offset + index + 1).padStart(4, '0')}/${totalLabel} ${item.id} ${response.ok ? '✓' : '✗'} ${data.mode || response.status}`)
  if (printAnswers) console.log(`  ${data.answer || data.error || ''}`)
  if (index < selected.length - 1) await wait(delayMs)
}

const byFamily = Object.fromEntries(
  [...new Set(results.map((item) => item.family))].map((family) => {
    const familyResults = results.filter((item) => item.family === family)
    const deterministic = familyResults.filter((item) => item.mode !== 'expert' && item.mode !== 'error').length
    return [family, { tested: familyResults.length, deterministic, coverage: Math.round((deterministic / familyResults.length) * 100) }]
  }),
)
const modes = results.reduce((counts, item) => ({ ...counts, [item.mode]: (counts[item.mode] || 0) + 1 }), {})
const deterministic = results.filter((item) => item.mode !== 'expert' && item.mode !== 'error').length

console.log('\n---SEBASTIEN_TOP100_RESULT---')
console.log(JSON.stringify({
  tested: results.length,
  deterministic,
  coverage: Math.round((deterministic / results.length) * 100),
  modes,
  byFamily,
  gaps: results.filter((item) => item.mode === 'expert' || item.mode === 'error'),
}, null, 2))
