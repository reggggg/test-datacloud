import { useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { amount, calendarDate, exportCsv, integer, isActive, money, textValue, type Resource } from './data'
import { Picker, ResourceIcon } from './ui'

const PAGE_SIZE = 10
type Sort = 'recent' | 'cost-asc' | 'cost-desc'

export function ResourceTable({ resources, compact, onViewAll }: {
  resources: Resource[]
  compact: boolean
  onViewAll: () => void
}) {
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('all')
  const [sort, setSort] = useState<Sort>('recent')
  const [page, setPage] = useState(0)
  const regions = [...new Set(resources.map(resource => textValue(resource.region)))].sort()
  const normalized = query.trim().toLowerCase()
  const filtered = resources.filter(resource =>
    (region === 'all' || `region:${textValue(resource.region)}` === region) &&
    (!normalized || [resource.resource_key, resource.service_name, resource.resource_type, resource.region, resource.status]
      .some(value => value?.toLowerCase().includes(normalized))),
  )
  if (sort !== 'recent') {
    filtered.sort((a, b) => sort === 'cost-asc' ? amount(a) - amount(b) : amount(b) - amount(a))
  }
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount - 1)
  const offset = compact ? 0 : current * PAGE_SIZE
  const visible = filtered.slice(offset, offset + (compact ? 5 : PAGE_SIZE))
  const toggleSort = () => {
    setSort(sort === 'cost-desc' ? 'cost-asc' : 'cost-desc')
    setPage(0)
  }

  return <section className="panel table-panel" aria-labelledby="inventory-title">
    <div className="panel-heading table-heading">
      <div><h2 id="inventory-title">{compact ? 'Recent resources' : 'Resource inventory'}</h2><p>{compact ? 'Latest additions to your cloud inventory.' : 'Browse resources across your cloud workspace.'}</p></div>
      {compact
        ? <button className="button" onClick={onViewAll}>View all resources <ArrowRight size={15} /></button>
        : <button className="button" disabled={!filtered.length} onClick={() => exportCsv(filtered)}>Export filtered CSV <ArrowDown size={15} /></button>}
    </div>
    {!compact && <div className="table-filters">
      <label className="search"><Search size={16} /><input placeholder="Search resources…" aria-label="Search resources" value={query} onChange={event => { setQuery(event.target.value); setPage(0) }} /></label>
      <Picker label="Filter by region" value={region} onChange={value => { setRegion(value); setPage(0) }}
        options={[{ value: 'all', label: 'All regions' }, ...regions.map(value => ({ value: `region:${value}`, label: value }))]} />
      {(query || region !== 'all' || sort !== 'recent') && <button className="button button-quiet" onClick={() => { setQuery(''); setRegion('all'); setSort('recent'); setPage(0) }}>Reset filters</button>}
    </div>}
    <div className="table-scroll" tabIndex={0} role="region" aria-label="Resource table">
      <table>
        <thead><tr>
          <th scope="col">Resource</th><th scope="col">Service</th><th scope="col">Region</th><th scope="col">Status</th>
          <th scope="col" aria-sort={sort === 'recent' ? 'none' : sort === 'cost-asc' ? 'ascending' : 'descending'} className="cost-cell">
            {compact ? 'Monthly cost' : <button className="sort-button" onClick={toggleSort}>Monthly cost {sort === 'cost-asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />}</button>}
          </th>
          <th scope="col" className="date-cell">Created</th>
        </tr></thead>
        <tbody>{visible.map((resource, index) => {
          const type = textValue(resource.resource_type)
          const status = textValue(resource.status)
          const date = resource.created_at ? Date.parse(resource.created_at) : NaN
          return <tr key={`${resource.resource_key}-${offset + index}`}>
            <th scope="row"><span className="resource-cell"><ResourceIcon type={type} /><span><strong>{resource.resource_key}</strong><small>{type}</small></span></span></th>
            <td>{textValue(resource.service_name)}</td>
            <td><span className="region-text">{textValue(resource.region)}</span></td>
            <td><span className={`status ${isActive(resource) ? 'status-active' : /^(failed|error)$/i.test(status) ? 'status-error' : ''}`}><i />{status}</span></td>
            <td className="cost-cell">{resource.monthly_cost == null ? '—' : money.format(amount(resource))}</td>
            <td className="date-cell">{Number.isFinite(date) ? calendarDate.format(date) : '—'}</td>
          </tr>
        })}</tbody>
      </table>
      {!visible.length && <p className="table-empty">{resources.length ? 'No resources match your filters.' : 'No cloud resources are available.'}</p>}
    </div>
    {!compact && <div className="table-footer">
      <span>{filtered.length ? `${integer.format(offset + 1)}–${integer.format(offset + visible.length)} of ${integer.format(filtered.length)} resources` : '0 resources'}</span>
      <div className="pagination">
        <button className="button icon-button" onClick={() => setPage(current - 1)} disabled={current === 0} aria-label="Previous page"><ChevronLeft size={16} /></button>
        <button className="button icon-button" onClick={() => setPage(current + 1)} disabled={current + 1 >= pageCount} aria-label="Next page"><ChevronRight size={16} /></button>
      </div>
    </div>}
  </section>
}

export function BackButton({ onClick }: { onClick: () => void }) {
  return <button className="button button-quiet" onClick={onClick}><ArrowLeft size={15} /> Back to dashboard</button>
}
