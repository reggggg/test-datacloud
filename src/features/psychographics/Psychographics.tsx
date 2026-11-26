import { useMemo, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { ArrowDownToLine, BarChart3, CalendarDays, ChevronDown, Cloud, Info, Layers3, ListFilter, LogOut, ScanLine, Search, SlidersHorizontal, Table2, Target, TrendingUp, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { LoadingStatus } from '../../components/LoadingStatus'
import { Picker } from '../../components/ui'
import { demo } from '../../lib/supabase'
import { routes } from '../../routes'
import { TraitChart, TraitTable } from './TraitChart'
import { exportMeasurements, formatSnapshot, groupTraits, indexLabel, segmentColors, sortOptions, type SortOrder } from './measurements'
import { usePsychographics } from './usePsychographics'
import './psychographics.css'

type Props = {
  email?: string
  onExit: () => void
  signOutPending: boolean
  authError: string
}

const directions = [
  { value: 'all', label: 'Any index' },
  { value: 'positive', label: 'Above baseline' },
  { value: 'negative', label: 'Below baseline' },
  { value: 'zero', label: 'At baseline' },
]

export default function Psychographics({ email, onExit, signOutPending, authError }: Props) {
  const { rows, loading, error, retry } = usePsychographics()
  const [dateChoice, setDateChoice] = useState('')
  const [segmentChoices, setSegmentChoices] = useState<string[]>([])
  const [category, setCategory] = useState('all')
  const [direction, setDirection] = useState('all')
  const [sort, setSort] = useState<SortOrder>('index-desc')
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const [showOverlap, setShowOverlap] = useState(true)
  const [showInfo, setShowInfo] = useState(false)

  const dates = useMemo(() => [...new Set(rows.map(row => row.snapshot_date))].sort().reverse(), [rows])
  const allSegments = useMemo(() => [...new Set(rows.map(row => row.segment_name))].sort((a, b) => {
    return Number(b === 'Mitsubishi Owners') - Number(a === 'Mitsubishi Owners') || a.localeCompare(b)
  }), [rows])
  const colors = useMemo(() => new Map(allSegments.map((segment, index) => [
    segment, segmentColors[index % segmentColors.length],
  ])), [allSegments])
  const date = dates.includes(dateChoice) ? dateChoice : dates[0]
  const snapshot = rows.filter(row => row.snapshot_date === date)
  const available = allSegments.filter(segment => snapshot.some(row => row.segment_name === segment))
  const validChoices = segmentChoices.filter(segment => available.includes(segment))
  const defaultSegment = available.includes('Mitsubishi Owners') ? 'Mitsubishi Owners' : available[0]
  const segments = validChoices.length ? validChoices : defaultSegment ? [defaultSegment] : []
  const selected = snapshot.filter(row => segments.includes(row.segment_name))
  const categories = [...new Set(selected.map(row => row.category))].sort()
  const currentCategory = categories.some(value => `category:${value}` === category) ? category : 'all'

  const search = query.trim().toLowerCase()
  const visible = selected.filter(row => {
    if (currentCategory !== 'all' && `category:${row.category}` !== currentCategory) return false
    if (search && !row.trait_name.toLowerCase().includes(search)) return false
    if (direction === 'positive') return row.index_pct > 0
    if (direction === 'negative') return row.index_pct < 0
    if (direction === 'zero') return row.index_pct === 0
    return true
  })
  const groups = groupTraits(visible, segments, sort)
  const strongest = visible.reduce<(typeof visible)[number] | undefined>((max, row) =>
    !max || Math.abs(row.index_pct) > Math.abs(max.index_pct) ? row : max, undefined)
  const filtered = currentCategory !== 'all' || direction !== 'all' || Boolean(query)
  const ChartView = view === 'chart' ? TraitChart : TraitTable

  function resetFilters() {
    setCategory('all')
    setDirection('all')
    setQuery('')
    setSort('index-desc')
  }

  return <div className="psy-workspace">
    <aside className="psy-sidebar">
      <Link className="psy-brand workspace-link" to={routes.home} aria-label="Workspace home"><span><ScanLine size={21} /></span>CustomerPulse</Link>
      <nav aria-label="Audience workspace">
        <span className="psy-nav-label">Workspace</span>
        <a className="psy-nav-active" href="#psychographics" aria-current="page"><Target size={17} />Psychographics</a>
      </nav>
      {demo && <span className="psy-demo-label"><i />Demo workspace</span>}
    </aside>
    <main className="psy-main" id="psychographics">
      <header className="psy-topbar">
        <div className="psy-breadcrumb">
          <Link className="workspace-link" to={routes.home}>Workspaces</Link><span>/</span><strong>Psychographics</strong>
        </div>
        <div className="psy-account">
          <Link className="psy-text-button workspace-link" to={routes.cloud}><Cloud size={16} /> CloudLedger</Link>
          {!demo && email && <span className="psy-email" title={email}>{email}</span>}
          <button className="psy-text-button" onClick={onExit} disabled={signOutPending}>
            <LogOut size={16} /> {demo ? 'Exit demo' : signOutPending ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </header>

      <div className="psy-content">
        <div className="psy-title">
          <div>
            <h1>Psychographics</h1>
            <p>See which attitudes and values set your audience apart from the network baseline.</p>
          </div>
          <button className="psy-button psy-primary" disabled={loading || Boolean(error) || !visible.length}
            onClick={() => exportMeasurements(groups.flatMap(group => group.measurements))}>
            <ArrowDownToLine size={16} /> Export CSV
          </button>
        </div>

        {authError && <p className="psy-notice" role="alert">{authError}</p>}
        {loading ? <LoadingStatus className="psy-card psy-notice" label="Loading psychographic data…" />
          : error || !rows.length ? <section className="psy-card psy-notice" role={error ? 'alert' : 'status'}>
            <strong>{error ? 'Couldn’t load psychographic data' : 'No psychographic rows returned by Supabase'}</strong>
            <p>{error || 'If the table contains rows, check the SELECT policy on public.psychographic_breakdown for your signed-in account.'}</p>
            <button className="psy-button" onClick={retry}>Try again</button>
          </section>
          : <>
            <section className="psy-card psy-controls" aria-label="Audience filters">
              <div className="psy-control-group">
                <span id="psy-segments-label">Segments</span>
                <SegmentPicker available={available} selected={segments} colors={colors} onChange={setSegmentChoices} />
              </div>
              <div className="psy-control-group">
                <span>Snapshot</span>
                <Picker label="Snapshot" value={date} onChange={value => {
                  setSegmentChoices(segments)
                  setDateChoice(value)
                }} options={dates.map(value => ({ value, label: formatSnapshot(value) }))} icon={<CalendarDays size={15} />} />
              </div>
              <div className="psy-control-group">
                <span>Trait category</span>
                <Picker label="Trait category" value={currentCategory} onChange={setCategory}
                  options={[{ value: 'all', label: 'All categories' }, ...categories.map(value => ({ value: `category:${value}`, label: value }))]} />
              </div>
              <div className="psy-control-group">
                <span>Baseline filter</span>
                <Picker label="Baseline filter" value={direction} onChange={setDirection} options={directions} icon={<ListFilter size={15} />} />
              </div>
              {(filtered || sort !== 'index-desc') && <button className="psy-text-button psy-clear" onClick={resetFilters}>Clear filters</button>}
            </section>

            <section className="psy-summary" aria-label="Audience summary">
              <Summary label="Segments selected" value={String(segments.length)} detail={segments.join(', ')} icon={Layers3} />
              <Summary label="Traits shown" value={String(groups.length)} detail={`of ${new Set(selected.map(row => row.trait_name)).size} in this selection`} icon={Target} />
              <Summary label="Largest difference" value={strongest ? indexLabel(strongest.index_pct) : '—'}
                detail={strongest ? `${strongest.trait_name}${segments.length > 1 ? ` · ${strongest.segment_name}` : ''}` : 'No matching traits'} icon={TrendingUp} />
            </section>

            <section className="psy-card psy-chart-card" aria-labelledby="psy-chart-title">
              <div className="psy-chart-toolbar">
                <div className="psy-chart-title">
                  <div><h2 id="psy-chart-title">Psychographic breakdown</h2>
                    <button className="psy-icon-button" aria-label="About index and overlap" aria-expanded={showInfo}
                      aria-controls="psy-chart-info" onClick={() => setShowInfo(value => !value)}><Info size={16} /></button>
                  </div>
                  <p>{segments.length > 1 && sort !== 'name' ? `Ranked by ${segments[0]} · ${formatSnapshot(date)}` : `Audience traits compared with the network · ${formatSnapshot(date)}`}</p>
                </div>
                <div className="psy-chart-actions">
                  <label className="psy-search"><Search size={15} /><input aria-label="Search traits" placeholder="Search traits" value={query} onChange={event => setQuery(event.target.value)} /></label>
                  <Picker label="Sort traits" value={sort} onChange={value => setSort(value as SortOrder)} options={[...sortOptions]} icon={<SlidersHorizontal size={14} />} />
                  <div className="psy-view-toggle" role="group" aria-label="Chart or table view">
                    <button aria-label="Chart view" aria-pressed={view === 'chart'} onClick={() => setView('chart')}><BarChart3 size={17} /></button>
                    <button aria-label="Table view" aria-pressed={view === 'table'} onClick={() => setView('table')}><Table2 size={17} /></button>
                  </div>
                </div>
              </div>
              {showInfo && <div className="psy-info" id="psy-chart-info">
                <strong>How to read this chart</strong>
                <p>Index shows how far a segment is above or below the network baseline. A value of 0% means it matches the baseline. Overlap is the percentage of the segment that matches the trait.</p>
              </div>}
              <div className="psy-chart-meta">
                <ul className="psy-legend" aria-label="Selected segments">{segments.map(segment => <li key={segment}>
                  <span className="psy-dot" style={{ backgroundColor: colors.get(segment) }} />{segment}
                </li>)}</ul>
                <label className="psy-overlap-toggle"><input type="checkbox" checked={showOverlap} onChange={event => setShowOverlap(event.target.checked)} /> Show overlap</label>
              </div>
              {groups.length ? <ChartView groups={groups} colors={colors} showOverlap={showOverlap} />
                : <div className="psy-empty"><Search size={22} /><strong>No traits match these filters</strong>
                  <button className="psy-button" onClick={resetFilters}>Clear filters</button>
                </div>}
            </section>
          </>}
      </div>
    </main>
  </div>
}

function SegmentPicker({ available, selected, colors, onChange }: {
  available: string[]
  selected: string[]
  colors: Map<string, string>
  onChange: (segments: string[]) => void
}) {
  return <Popover.Root>
    <Popover.Trigger className="psy-button psy-segment-trigger" aria-labelledby="psy-segments-label psy-selected-segment">
      <Layers3 size={15} />
      <span id="psy-selected-segment">{selected.length === 1 ? selected[0] : `${selected.length} segments`}</span>
      <ChevronDown size={14} />
    </Popover.Trigger>
    <Popover.Portal>
      <Popover.Content className="psy-segment-options" aria-label="Choose audience segments" align="start" sideOffset={6} collisionPadding={12}>
        <p>Select segments to compare, or choose one on its own.</p>
        {available.map(segment => {
          const checked = selected.includes(segment)
          const onlySelected = checked && selected.length === 1
          return <div className="psy-segment-option" key={segment}>
            <label>
              <input type="checkbox" checked={checked} disabled={onlySelected}
                onChange={() => onChange(checked ? selected.filter(value => value !== segment) : [...selected, segment])} />
              <span className="psy-dot" style={{ backgroundColor: colors.get(segment) }} />{segment}
            </label>
            {!onlySelected && <Popover.Close asChild>
              <button className="psy-segment-only" type="button" aria-label={`Show only ${segment}`} onClick={() => onChange([segment])}>
                Only
              </button>
            </Popover.Close>}
          </div>
        })}
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>
}

function Summary({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: LucideIcon }) {
  return <div className="psy-card psy-stat">
    <span className="psy-stat-icon"><Icon size={19} /></span>
    <div><span>{label}</span><strong>{value}</strong><small title={detail}>{detail}</small></div>
  </div>
}
