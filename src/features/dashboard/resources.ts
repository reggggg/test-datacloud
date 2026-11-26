export type Resource = {
  resource_key: string
  resource_type: string | null
  service_name: string | null
  region: string | null
  monthly_cost: number | string | null
  status: string | null
  created_at?: string | null
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
  const rows = resources.map(resource => columns.map(column => {
    const value = resource[column]
    return cell(column === 'monthly_cost' && value != null ? amount(resource) : value)
  }).join(','))
  const csv = [columns.join(','), ...rows].join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'cloud-ledger-resources.csv'
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
