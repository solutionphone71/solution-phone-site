// Formats publics du catalogue (prix et stock), sans accès base de données.
// Utilisé par public-catalog et evan-brain ; testé par vitrine-catalog_test.ts.
//
// Après la bascule V2, la V2 publie via /api/vitrine (dépôt V1) :
//   - settings.ecrans_prix_json / batteries_prix_json / android_prix_json ;
//   - la table vitrine_phones + le repère settings.vitrine_stock_publication.
// Les anciennes sources (table prix_reparation_android, tables phones et
// phones_neufs) ne servent plus que de secours.

export type PriceRow = { modele: string; prix: Array<number | null> }

export type AndroidRow = {
  marque: string
  modele: string
  ecran_compatible: string
  ecran_service_pack: string
  batterie_compatible: string
  batterie_originale: string
  connecteur: string
  vitre_arriere: string
  remarque: string
}

export type UsedPhone = {
  modele: string
  stockage: number | string
  grade: string
  batterie: number | null
  vente: number | null
  couleur: string
  photo_face: string
  photo_dos: string
}

export type NewPhone = {
  modele: string
  stockage: string
  vente: number | null
  couleur: string
  photo_face: string
  photo_dos: string
}

export type StockPublication = { source: 'v2'; sha256: string; count: number }

export const PRICE_SETTING_KEYS = ['ecrans_prix_json', 'batteries_prix_json', 'android_prix_json'] as const
export const STOCK_PUBLICATION_KEY = 'vitrine_stock_publication'

export function safePrice(value: unknown): number | null {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}

export function safeText(value: unknown, max = 140): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

export function safePhoto(value: unknown): string {
  const url = safeText(value, 900)
  return /^(https:\/\/|\/)/i.test(url) ? url : ''
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function normalizePriceRows(value: unknown): PriceRow[] {
  if (!Array.isArray(value)) return []
  return value
    .map((row) => {
      const item = (isRecord(row) ? row : {}) as Record<string, unknown>
      return {
        modele: safeText(item.modele, 90),
        prix: Array.isArray(item.prix) ? item.prix.slice(0, 5).map(safePrice) : [],
      }
    })
    .filter((row) => row.modele && row.prix.some((price) => price !== null))
}

function androidRow(marque: unknown, modele: unknown, cells: Record<string, unknown>): AndroidRow {
  return {
    marque: safeText(marque, 60),
    modele: safeText(modele, 90),
    ecran_compatible: safeText(cells.ecran_compat, 60),
    ecran_service_pack: safeText(cells.ecran_original, 60),
    batterie_compatible: safeText(cells.batterie_compat, 60),
    batterie_originale: safeText(cells.batterie_original, 60),
    connecteur: safeText(cells.connecteur, 60),
    vitre_arriere: safeText(cells.vitre_arriere, 60),
    remarque: safeText(cells.remarques, 240),
  }
}

const hasAndroidPrice = (row: AndroidRow) =>
  Boolean(row.marque && row.modele && (
    row.ecran_compatible || row.ecran_service_pack || row.batterie_compatible ||
    row.batterie_originale || row.connecteur || row.vitre_arriere
  ))

const byBrandThenModel = (a: AndroidRow, b: AndroidRow) =>
  a.marque.localeCompare(b.marque, 'fr') || a.modele.localeCompare(b.modele, 'fr')

// settings.android_prix_json : { "Samsung": { "Galaxy S21": { ecran_compat, … } } }
// (format écrit par la V1 et sérialisé à l'identique par la V2).
export function androidFromSetting(raw: unknown): AndroidRow[] {
  let parsed: unknown
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return []
  }
  if (!isRecord(parsed)) return []
  const rows: AndroidRow[] = []
  for (const [marque, models] of Object.entries(parsed)) {
    if (!isRecord(models)) continue
    for (const [modele, cells] of Object.entries(models)) {
      if (!isRecord(cells)) continue
      rows.push(androidRow(marque, modele, cells))
    }
  }
  return rows.filter(hasAndroidPrice).sort(byBrandThenModel)
}

// Secours : ancienne table prix_reparation_android (plus mise à jour).
export function androidFromTable(data: Array<Record<string, unknown>> | null): AndroidRow[] {
  return (data ?? [])
    .map((row) => androidRow(row.marque, row.modele, row))
    .filter((row) => row.marque && row.modele)
}

// Repère posé par la fonction SQL vitrine_replace_stock. Présent = la V2
// publie le stock : vitrine_phones fait foi, même vide (tout est vendu).
export function parseStockPublication(raw: unknown): StockPublication | null {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!isRecord(parsed) || parsed.source !== 'v2') return null
    if (typeof parsed.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(parsed.sha256)) return null
    const count = Number(parsed.count)
    if (!Number.isInteger(count) || count < 0) return null
    return { source: 'v2', sha256: parsed.sha256, count }
  } catch {
    return null
  }
}

function usedStockage(value: unknown): number | string {
  return value !== null && value !== '' && Number.isFinite(Number(value)) ? Number(value) : safeText(value, 30)
}

export function mapUsedPhones(data: Array<Record<string, unknown>> | null): UsedPhone[] {
  return (data ?? []).map((row) => ({
    modele: safeText(row.modele, 90),
    stockage: usedStockage(row.stockage),
    grade: safeText(row.grade, 20),
    batterie: row.batterie !== null && row.batterie !== undefined && Number.isFinite(Number(row.batterie)) ? Number(row.batterie) : null,
    vente: safePrice(row.vente),
    couleur: safeText(row.couleur, 50),
    photo_face: safePhoto(row.photo_face),
    photo_dos: safePhoto(row.photo_dos),
  })).filter((row) => row.modele && row.vente)
}

export function mapNewPhones(data: Array<Record<string, unknown>> | null): NewPhone[] {
  return (data ?? []).map((row) => ({
    modele: safeText(row.modele, 90),
    stockage: safeText(row.stockage, 30),
    vente: safePrice(row.vente),
    couleur: safeText(row.couleur, 50),
    photo_face: safePhoto(row.photo_face),
    photo_dos: safePhoto(row.photo_dos),
  })).filter((row) => row.modele && row.vente)
}

// vitrine_phones (kind = occasion | neuf) → même forme publique qu'avant.
export function splitVitrineStock(data: Array<Record<string, unknown>> | null) {
  const rows = [...(data ?? [])].sort((a, b) => Number(a.vente) - Number(b.vente))
  return {
    used: mapUsedPhones(rows.filter((row) => row.kind === 'occasion')),
    new: mapNewPhones(rows.filter((row) => row.kind === 'neuf')),
  }
}
