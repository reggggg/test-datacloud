import { useEffect, useState } from 'react'
import { errorMessage } from '../../lib/errors'
import { demo, supabase } from '../../lib/supabase'
import { demoResources } from './demoResources'
import type { Resource } from './resources'

export function useResources() {
  const [resources, setResources] = useState<Resource[]>(demo ? demoResources : [])
  const [loading, setLoading] = useState(!demo)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (demo) return
    const controller = new AbortController()
    setLoading(true)
    setLoadError('')
    getResources(controller.signal).then(data => {
      if (!controller.signal.aborted) setResources(data)
    }).catch(error => {
      if (!controller.signal.aborted) setLoadError(errorMessage(error, 'Cloud resources could not be loaded.'))
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [attempt])

  const reload = () => setAttempt(value => value + 1)
  return { resources, loading, loadError, reload }
}

async function getResources(signal: AbortSignal): Promise<Resource[]> {
  if (!supabase) return []
  const client = supabase
  const resources: Resource[] = []
  const pageSize = 100
  const columns = 'resource_key,resource_type,service_name,region,monthly_cost,status'
  let includeCreatedAt = true
  let total = Infinity
  function readPage(from: number) {
    const query = client.from('cloud_sample_resources').select(
      includeCreatedAt ? `${columns},created_at` : columns,
      from === 0 ? { count: 'exact' } : undefined,
    )
    if (includeCreatedAt) query.order('created_at', { ascending: false, nullsFirst: false })
    return query
      .order('resource_key')
      .range(from, from + pageSize - 1)
      .abortSignal(signal)
      .overrideTypes<Resource[], { merge: false }>()
  }

  while (resources.length < total) {
    const from = resources.length
    let page = await readPage(from)
    if (from === 0 && page.error?.code === '42703' && /\bcreated_at\b/i.test(page.error.message)) {
      includeCreatedAt = false
      page = await readPage(from)
    }
    const { data, error, count } = page
    if (error) throw error
    if (count !== null) total = count
    if (!data.length) break
    resources.push(...data)
  }
  return resources
}
