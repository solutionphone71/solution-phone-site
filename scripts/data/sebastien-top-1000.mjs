import roots from './sebastien-top-100.mjs'

const deviceExamples = {
  smartphone: ['iPhone 13', 'Samsung Galaxy S23', 'Xiaomi Redmi Note 13'],
  ordinateur: ['PC portable Asus', 'MacBook Air', 'ordinateur portable HP'],
  tablette: ['iPad', 'tablette Samsung Galaxy Tab', 'tablette Lenovo'],
  console: ['PlayStation 5', 'Nintendo Switch', 'Xbox Series'],
  trottinette: ['trottinette Xiaomi', 'Ninebot Segway', 'trottinette électrique'],
}

function lowerFirst(text) {
  return text.charAt(0).toLocaleLowerCase('fr-FR') + text.slice(1)
}

function customerTypos(text) {
  return text
    .toLocaleLowerCase('fr-FR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/téléphone/g, 'tel')
    .replace(/ordinateur/g, 'ordi')
    .replace(/trottinette/g, 'trotinette')
    .replace(/batterie/g, 'bateri')
    .replace(/charge/g, 'charg')
    .replace(/[’']/g, ' ')
    .replace(/[?!.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function variants(root, index) {
  const question = root.question.replace(/\s+/g, ' ').trim()
  const natural = lowerFirst(question)
  const devices = deviceExamples[root.family]
  const device = devices[index % devices.length]
  return [
    { style: 'reference', question },
    { style: 'polite', question: `Bonjour, ${natural}` },
    { style: 'direct', question: `Question rapide : ${natural}` },
    { style: 'device_context', question: `Sur mon ${device}, ${natural}` },
    { style: 'intermittent', question: `Le problème n'arrive pas tout le temps : ${natural}` },
    { style: 'diagnostic_request', question: `Pouvez-vous me donner un premier diagnostic : ${natural}` },
    { style: 'quote_request', question: `Avant de me déplacer, combien coûterait l'intervention si ${natural}` },
    { style: 'urgency_request', question: `Est-ce urgent et dois-je arrêter de l'utiliser : ${natural}` },
    { style: 'shop_request', question: `Est-ce réparable chez Solution Phone : ${natural}` },
    { style: 'typos', question: customerTypos(question) },
  ]
}

const questions = roots.flatMap((root, index) => variants(root, index).map((variant, variantIndex) => ({
  ...root,
  id: `${root.id}-V${String(variantIndex + 1).padStart(2, '0')}`,
  root_id: root.id,
  variant: variant.style,
  question: variant.question,
})))

export default questions
