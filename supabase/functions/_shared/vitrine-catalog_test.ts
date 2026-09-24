import { deepStrictEqual as assertEquals } from 'node:assert/strict'
import {
  androidFromSetting,
  androidFromTable,
  normalizePriceRows,
  parseStockPublication,
  splitVitrineStock,
} from './vitrine-catalog.ts'

// Format android_prix_json écrit par la V1 et sérialisé à l'identique par la V2.
const androidSetting = JSON.stringify({
  Xiaomi: {
    'Redmi Note 12': { ecran_compat: '89', ecran_original: '', batterie_compat: '49', batterie_original: '', connecteur: '39', vitre_arriere: '', remarques: '' },
  },
  Samsung: {
    'Galaxy S21': { ecran_compat: '129', ecran_original: '189', batterie_compat: '59', batterie_original: '79', connecteur: '49', vitre_arriere: '69', remarques: '  Sur   commande ' },
    'Galaxy A12': { ecran_compat: '', ecran_original: '', batterie_compat: '', batterie_original: '', connecteur: '', vitre_arriere: '', remarques: '' },
  },
})

Deno.test('lit les prix Android depuis settings.android_prix_json', () => {
  const rows = androidFromSetting(androidSetting)
  assertEquals(rows.map((row) => `${row.marque}/${row.modele}`), ['Samsung/Galaxy S21', 'Xiaomi/Redmi Note 12'])
  assertEquals(rows[0], {
    marque: 'Samsung',
    modele: 'Galaxy S21',
    ecran_compatible: '129',
    ecran_service_pack: '189',
    batterie_compatible: '59',
    batterie_originale: '79',
    connecteur: '49',
    vitre_arriere: '69',
    remarque: 'Sur commande',
  })
})

Deno.test('Android : réglage absent ou illisible → liste vide (secours table)', () => {
  assertEquals(androidFromSetting(undefined), [])
  assertEquals(androidFromSetting('{pas du json'), [])
  assertEquals(androidFromSetting('[]'), [])
  assertEquals(androidFromSetting('{"Samsung":"x"}'), [])
})

Deno.test('Android : la table de secours garde la même forme publique', () => {
  const rows = androidFromTable([{ marque: 'Samsung', modele: 'Galaxy S21', ecran_compat: '129', ecran_original: null, remarques: 'x' }])
  assertEquals(rows[0].ecran_compatible, '129')
  assertEquals(rows[0].ecran_service_pack, '')
  assertEquals(rows[0].remarque, 'x')
})

Deno.test('prix écrans et batteries inchangés', () => {
  assertEquals(normalizePriceRows([{ modele: 'iPhone 13', prix: [89, 0, null, '149', -2] }, { modele: 'vide', prix: [0] }]), [
    { modele: 'iPhone 13', prix: [89, null, null, 149, null] },
  ])
})

Deno.test('repère de publication du stock V2', () => {
  const sha = 'a'.repeat(64)
  assertEquals(parseStockPublication(JSON.stringify({ source: 'v2', sha256: sha, count: 0, published_at: '2026-09-24T21:00:00Z' })), { source: 'v2', sha256: sha, count: 0 })
  assertEquals(parseStockPublication(null), null)
  assertEquals(parseStockPublication('{'), null)
  assertEquals(parseStockPublication(JSON.stringify({ source: 'v1', sha256: sha, count: 1 })), null)
  assertEquals(parseStockPublication(JSON.stringify({ source: 'v2', sha256: 'court', count: 1 })), null)
  assertEquals(parseStockPublication(JSON.stringify({ source: 'v2', sha256: sha, count: -1 })), null)
})

Deno.test('stock vitrine : occasion et neufs dans la forme publique historique', () => {
  const stock = splitVitrineStock([
    { kind: 'neuf', modele: 'iPhone 16', stockage: '128', grade: '', batterie: null, vente: '969.00', couleur: 'Noir', photo_face: '', photo_dos: '' },
    { kind: 'occasion', modele: 'iPhone 13', stockage: '128', grade: 'A', batterie: 88, vente: '419.90', couleur: 'Bleu', photo_face: 'https://cdn.example.test/13.jpg', photo_dos: 'javascript:alert(1)' },
    { kind: 'occasion', modele: 'iPhone 11', stockage: '64', grade: 'B', batterie: null, vente: '229.00', couleur: '', photo_face: '', photo_dos: '' },
  ])
  assertEquals(stock.used.map((row) => row.modele), ['iPhone 11', 'iPhone 13'])
  assertEquals(stock.used[1], {
    modele: 'iPhone 13', stockage: 128, grade: 'A', batterie: 88, vente: 419.9, couleur: 'Bleu',
    photo_face: 'https://cdn.example.test/13.jpg', photo_dos: '',
  })
  assertEquals(stock.used[0].batterie, null)
  assertEquals(stock.new, [{ modele: 'iPhone 16', stockage: '128', vente: 969, couleur: 'Noir', photo_face: '', photo_dos: '' }])
  assertEquals(splitVitrineStock([]), { used: [], new: [] })
})
