import { useEffect, useState } from 'react'
import { errorMessage } from '../../lib/errors'
import { demo, supabase } from '../../lib/supabase'
import type { Measurement } from './measurements'

type RawMeasurement = {
  [Key in 'segment_name' | 'snapshot_date' | 'trait_name' | 'category']: string | null
} & {
  index_pct: number | string | null
  overlap_pct: number | string | null
}

export function usePsychographics() {
  const [rows, setRows] = useState<Measurement[]>(demo ? sampleRows : [])
  const [loading, setLoading] = useState(!demo)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (demo) return
    const controller = new AbortController()
    setLoading(true)
    setError('')
    readMeasurements(controller.signal).then(data => {
      if (!controller.signal.aborted) setRows(data)
    }).catch(failure => {
      if (!controller.signal.aborted) setError(errorMessage(failure, 'Psychographic data could not be loaded.'))
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [attempt])

  return { rows, loading, error, retry: () => setAttempt(attempt => attempt + 1) }
}

async function readMeasurements(signal: AbortSignal) {
  if (!supabase) return []
  const client = supabase
  const rows: RawMeasurement[] = []
  const pageSize = 200
  let total = Infinity
  while (rows.length < total) {
    const start = rows.length
    const { data, error, count } = await client.from('psychographic_breakdown')
      .select('segment_name,snapshot_date,trait_name,category,index_pct,overlap_pct', start === 0 ? { count: 'exact' } : undefined)
      .order('snapshot_date', { ascending: false })
      .order('segment_name')
      .order('trait_name')
      .range(start, start + pageSize - 1)
      .abortSignal(signal)
      .overrideTypes<RawMeasurement[], { merge: false }>()
    if (error) throw error
    if (count !== null) total = count
    if (!data.length) break
    rows.push(...data)
  }
  return rows.flatMap(({ segment_name, snapshot_date, trait_name, category, index_pct, overlap_pct }) => {
    if (!segment_name?.trim() || !trait_name?.trim() || !snapshot_date ||
      !Number.isFinite(Date.parse(`${snapshot_date}T00:00:00Z`)) || index_pct == null || overlap_pct == null) return []
    const index = Number(index_pct)
    const overlap = Number(overlap_pct)
    if (!Number.isFinite(index) || !Number.isFinite(overlap) || overlap < 0 || overlap > 100) return []
    return [{ segment_name, snapshot_date, trait_name, category: category?.trim() || 'Uncategorized', index_pct: index, overlap_pct: overlap }]
  })
}

const sampleTraits = [
  ['Secure', 'Mindset', 30, 14.8],
  ['Sentimental', 'Mindset', 26, 8.4],
  ['Family Oriented', 'Values', 24, 70.9],
  ['Honest', 'Values', -4, 5.9],
  ['Wholesome', 'Values', -10, 22.8],
  ['Reliable', 'Personality', -14, 4.2],
  ['Hard-Working', 'Personality', -28, 13.7],
  ['Intelligent', 'Personality', -32, 6.3],
  ['Friendly', 'Personality', -40, 6.7],
  ['Sincere', 'Values', -66, 3.7],
] as const

const sampleRows = ['2026-08-20', '2026-07-20'].flatMap((snapshot_date, date) =>
  ['Mitsubishi Owners', 'EV Shoppers', 'Family SUV Shoppers'].flatMap((segment_name, segment) =>
    sampleTraits.map(([trait_name, category, index, overlap], trait) => ({
      segment_name, snapshot_date, trait_name, category,
      index_pct: date === 0 && segment === 0 ? index : date === 0 && segment === 1 && trait === 0
        ? 0 : ((trait * 17 + segment * 13 + date * 29) % 101) - 50,
      overlap_pct: date === 0 && segment === 0 ? overlap : Math.round(overlap * (0.7 + (trait + segment + date) % 5 * 0.13) * 10) / 10,
    })),
  ),
)
