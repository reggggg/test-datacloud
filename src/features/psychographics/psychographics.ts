import { downloadCsv } from '../../lib/csv'

export type Measurement = {
  segment_name: string
  snapshot_date: string
  trait_name: string
  category: string
  index_pct: number
  overlap_pct: number
}

export const sortOptions = [
  { value: 'index-desc', label: 'Index high to low' },
  { value: 'index-asc', label: 'Index low to high' },
  { value: 'overlap', label: 'Overlap high to low' },
  { value: 'name', label: 'Trait A–Z' },
] as const
export type SortOrder = (typeof sortOptions)[number]['value']

export const segmentColors = ['#365de8', '#8051ce', '#087e74', '#bf532e', '#1e7eb2', '#a94277']
export const percent = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })
export const overlapPercent = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

export function formatSnapshot(value: string) {
  return dateFormat.format(new Date(`${value}T00:00:00Z`))
}

export function indexLabel(value: number) {
  return `${value > 0 ? '+' : ''}${percent.format(value)}%`
}

export function groupTraits(rows: Measurement[], segments: string[], sort: SortOrder) {
  const groups = new Map<string, Measurement[]>()
  for (const row of rows) {
    const group = groups.get(row.trait_name)
    if (group) group.push(row)
    else groups.set(row.trait_name, [row])
  }
  const order = new Map(segments.map((segment, index) => [segment, index]))
  return Array.from(groups, ([trait, measurements]) => ({
    trait,
    measurements: measurements.sort((a, b) => (order.get(a.segment_name) ?? 0) - (order.get(b.segment_name) ?? 0)),
  })).sort((a, b) => {
    const alphabetical = a.trait.localeCompare(b.trait)
    if (sort === 'name') return alphabetical
    const primary = segments[0]
    const left = a.measurements.find(row => row.segment_name === primary)
    const right = b.measurements.find(row => row.segment_name === primary)
    if (!left || !right) return Number(Boolean(right)) - Number(Boolean(left)) || alphabetical
    const difference = sort === 'overlap' ? right.overlap_pct - left.overlap_pct
      : sort === 'index-asc' ? left.index_pct - right.index_pct
      : right.index_pct - left.index_pct
    return difference || alphabetical
  })
}

export type TraitGroup = ReturnType<typeof groupTraits>[number]

export function exportMeasurements(rows: Measurement[]) {
  const columns = ['segment_name', 'snapshot_date', 'trait_name', 'category', 'index_pct', 'overlap_pct'] as const
  downloadCsv('psychographic-breakdown.csv', columns, rows.map(row => columns.map(column => row[column])))
}
