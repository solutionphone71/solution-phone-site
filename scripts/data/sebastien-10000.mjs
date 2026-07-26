import roots from './sebastien-top-100.mjs'

const deviceExamples = {
  smartphone: ['iPhone 13', 'Samsung Galaxy S23', 'Xiaomi Redmi Note 13'],
  ordinateur: ['PC portable Asus', 'MacBook Air', 'ordinateur portable HP'],
  tablette: ['iPad', 'Samsung Galaxy Tab', 'tablette Lenovo'],
  console: ['PlayStation 5', 'Nintendo Switch', 'Xbox Series'],
  trottinette: ['trottinette Xiaomi', 'Ninebot Segway', 'trottinette électrique'],
}

const contexts = [
  '',
  'Je suis à Mâcon.',
  'Le problème a commencé hier.',
  'Cela arrive seulement par intermittence.',
  'Je voudrais surtout préserver mes données.',
  "L'appareil n'est plus sous garantie.",
  "J'en ai besoin pour travailler.",
  "Je peux passer au magasin aujourd'hui.",
  'Je souhaite connaître le prix avant de venir.',
  'Je préfère éviter de remplacer une pièce si un nettoyage suffit.',
]

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
    .replace(/[?!.,:]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function frames(root, rootIndex) {
  const question = root.question.replace(/\s+/g, ' ').trim()
  const natural = lowerFirst(question)
  const devices = deviceExamples[root.family]
  const device = devices[rootIndex % devices.length]
  return [
    question,
    `Bonjour, ${natural}`,
    `J'ai un ${device} et ${natural}`,
    `Pouvez-vous me donner un premier diagnostic : ${natural}`,
    `Avant de me déplacer, pouvez-vous m'aider : ${natural}`,
    `Combien coûterait la réparation si ${natural}`,
    `Est-ce urgent et dois-je arrêter de l'utiliser : ${natural}`,
    `Est-ce réparable chez Solution Phone : ${natural}`,
    `Quelles vérifications simples puis-je faire sans risque : ${natural}`,
    customerTypos(question),
  ]
}

const questions = roots.flatMap((root, rootIndex) => {
  const rootFrames = frames(root, rootIndex)
  return rootFrames.flatMap((question, frameIndex) => contexts.map((context, contextIndex) => ({
    ...root,
    id: `${root.id}-F${String(frameIndex + 1).padStart(2, '0')}-C${String(contextIndex + 1).padStart(2, '0')}`,
    root_id: root.id,
    answer_key: root.id,
    frame: frameIndex + 1,
    context: contextIndex + 1,
    question: context ? `${question} ${context}` : question,
  })))
})

export default questions
