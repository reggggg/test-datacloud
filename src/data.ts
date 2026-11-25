import { createClient } from '@supabase/supabase-js'

export type Resource = {
  resource_key: string
  resource_type: string | null
  service_name: string | null
  region: string | null
  monthly_cost: number | string | null
  status: string | null
  created_at?: string | null
}

// This publishable key is intended for the browser. Supabase RLS controls data access.
const defaultProject = {
  url: 'https://fhcptjfxgepapwkorhhv.supabase.co',
  publishableKey: 'sb_publishable_7ED36Jim8ogbouN_5x7f3A_nVdhdUAe',
}
const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const configuredPublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
const configuredAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
const hasOverride = [configuredUrl, configuredPublishableKey, configuredAnonKey]
  .some(value => value !== undefined)
const projectUrl = (hasOverride ? configuredUrl : defaultProject.url)?.replace(/\/rest\/v1\/?$/, '')
const publicKey = hasOverride ? configuredPublishableKey || configuredAnonKey : defaultProject.publishableKey
export const demo = !projectUrl && !publicKey
let configurationError = ''
function connect() {
  if (demo) return null
  if (!projectUrl || !publicKey) {
    configurationError = 'Set both the Supabase project URL and publishable key.'
    return null
  }
  try {
    return createClient(projectUrl, publicKey, { auth: { flowType: 'pkce' } })
  } catch {
    configurationError = 'Check the Supabase project URL and publishable key.'
    return null
  }
}

export const supabase = connect()
export { configurationError }

export async function getResources(signal: AbortSignal): Promise<Resource[]> {
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

export const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
export const integer = new Intl.NumberFormat('en-US')
export const calendarDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
export const amount = (resource: Resource) => {
  const value = Number(resource.monthly_cost)
  return Number.isFinite(value) ? value : 0
}
export const totalCost = (resources: Resource[]) => resources.reduce((sum, resource) => sum + amount(resource), 0)
export const textValue = (value: string | null) => value?.trim() || 'Unspecified'
export const isActive = (resource: Resource) => /^(active|running|available|online)$/i.test(resource.status?.trim() || '')

export const demoDate = new Date('2026-11-25T12:00:00Z')
const fixtures: [string, string, string, string, number, string, string][] = [
  ['ec2-prod-web-01', 'Compute', 'Amazon EC2', 'us-east-1', 1840, 'Active', '2026-11-22'],
  ['rds-prod-primary', 'Database', 'Amazon RDS', 'us-east-1', 1260, 'Active', '2026-11-19'],
  ['s3-analytics-archive', 'Storage', 'Amazon S3', 'us-west-2', 385, 'Active', '2026-11-17'],
  ['cdn-global-edge', 'Networking', 'CloudFront', 'eu-west-1', 212, 'Active', '2026-11-12'],
  ['ec2-staging-worker', 'Compute', 'Amazon EC2', 'eu-west-1', 148, 'Stopped', '2026-11-07'],
  ['rds-reporting-replica', 'Database', 'Amazon RDS', 'ap-southeast-1', 690, 'Active', '2026-10-27'],
  ['s3-ingestion-store', 'Storage', 'Amazon S3', 'us-east-1', 470, 'Active', '2026-10-21'],
  ['ec2-prod-web-02', 'Compute', 'Amazon EC2', 'us-west-2', 890, 'Active', '2026-10-13'],
  ['lb-prod-public', 'Networking', 'Elastic Load Balancing', 'us-east-1', 300, 'Active', '2026-10-08'],
  ['s3-backup-eu', 'Storage', 'Amazon S3', 'eu-west-1', 160, 'Active', '2026-09-26'],
  ['ec2-edge-workers', 'Compute', 'Amazon EC2', 'ap-southeast-1', 606, 'Active', '2026-09-14'],
  ['rds-events-primary', 'Database', 'Amazon RDS', 'eu-west-1', 530, 'Active', '2026-09-09'],
  ['nat-private-apps', 'Networking', 'Amazon VPC', 'us-east-1', 245, 'Active', '2026-08-24'],
  ['ec2-batch-01', 'Compute', 'Amazon EC2', 'us-west-2', 315, 'Active', '2026-08-21'],
  ['s3-monthly-reports', 'Storage', 'Amazon S3', 'us-east-1', 225, 'Active', '2026-08-08'],
  ['rds-orders-read', 'Database', 'Amazon RDS', 'us-east-1', 615, 'Active', '2026-08-02'],
  ['ec2-catalog-api', 'Compute', 'Amazon EC2', 'us-east-1', 475, 'Active', '2026-07-28'],
  ['s3-static-media', 'Storage', 'Amazon S3', 'us-west-2', 230, 'Active', '2026-07-14'],
  ['cdn-assets', 'Networking', 'CloudFront', 'ap-southeast-1', 155, 'Active', '2026-07-03'],
  ['rds-staging-db', 'Database', 'Amazon RDS', 'eu-west-1', 238, 'Stopped', '2026-06-24'],
  ['ec2-core-services', 'Compute', 'Amazon EC2', 'us-east-1', 1490, 'Active', '2026-06-19'],
  ['s3-production-data', 'Storage', 'Amazon S3', 'us-east-1', 870, 'Active', '2026-06-13'],
  ['s3-archive-apac', 'Storage', 'Amazon S3', 'ap-southeast-1', 410, 'Active', '2026-06-08'],
  ['rds-core-replica', 'Database', 'Amazon RDS', 'us-west-2', 925, 'Active', '2026-05-22'],
]

export const demoResources: Resource[] = fixtures.map(
  ([resource_key, resource_type, service_name, region, monthly_cost, status, created_at]) =>
    ({ resource_key, resource_type, service_name, region, monthly_cost, status, created_at }),
)

export function resourceCreationTime(resource: Resource, now: Date) {
  const created = resource.created_at ? Date.parse(resource.created_at) : NaN
  return created <= now.getTime() ? created : NaN
}

export function costByMonth(resources: Resource[], months: number, now: Date) {
  const label = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })
  const monthEnd = (offset: number) => Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1)
  const dated = resources.flatMap(resource => {
    const created = resourceCreationTime(resource, now)
    return Number.isFinite(created) ? [{ created, cost: amount(resource) }] : []
  }).sort((left, right) => left.created - right.created)
  let index = 0
  let cost = 0
  return Array.from({ length: months }, (_, point) => {
    const offset = point - months + 1
    const end = monthEnd(offset + 1)
    while (index < dated.length && dated[index].created < end) {
      cost += dated[index].cost
      index++
    }
    return { month: label.format(monthEnd(offset)), cost }
  })
}

export function exportCsv(resources: Resource[]) {
  const columns: (keyof Resource)[] = ['resource_key', 'resource_type', 'service_name', 'region', 'monthly_cost', 'status', 'created_at']
  const cell = (value: Resource[keyof Resource]) => {
    let text = String(value ?? '')
    if (typeof value === 'string' && /^[\s]*[=+@-]|^[\t\r\n]/.test(text)) text = "'" + text
    return '"' + text.replaceAll('"', '""') + '"'
  }
  const csv = [columns.join(','), ...resources.map(resource => columns.map(column => cell(column === 'monthly_cost' && resource[column] != null ? amount(resource) : resource[column])).join(','))].join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'cloud-ledger-resources.csv'
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
