import { lazy, Suspense, useState } from 'react'
import { Activity, ArrowDownToLine, CalendarDays, Globe2, Layers3, LogOut, Target, Wallet, type LucideIcon } from 'lucide-react'
import { Brand, Picker } from '../../components/ui'
import { demo } from '../../lib/supabase'
import { demoDate } from './demoResources'
import { ResourceTable } from './ResourceTable'
import { exportCsv, integer, isActive, money, resourceCreationTime, totalCost, type Resource } from './resources'
import { useResources } from './useResources'

const overviewPage = { label: 'Overview', title: 'Cloud overview', description: 'Monitor your cloud resources, costs, and regional footprint.' }
const resourcesPage = { label: 'Resources', title: 'Cloud resources', description: 'Search, filter, and export your cloud inventory.' }
const costPage = { label: 'Cost analysis', title: 'Cost analysis', description: 'Explore your monthly run rate and where your cloud spend goes.' }
const pages = [overviewPage, resourcesPage, costPage]
type Page = (typeof pages)[number]
const periods = [3, 6, 12].map(value => ({ value: String(value), label: `Last ${value} months` }))
const Charts = lazy(() => import('./Charts'))

export default function Dashboard({ email, onExit, onOpenAudience, signOutPending, authError }: {
  email?: string
  onExit: () => void
  onOpenAudience: () => void
  signOutPending: boolean
  authError: string
}) {
  const [page, setPage] = useState<Page>(overviewPage)
  const [months, setMonths] = useState('6')
  const { resources, loading, loadError, reload } = useResources()
  const [now] = useState(() => demo ? demoDate : new Date())

  function navigate(next: Page) {
    setPage(next)
    window.scrollTo({ top: 0 })
  }

  const overview = page === overviewPage
  const showCharts = page !== resourcesPage
  const hasResources = resources.length > 0
  const hasTrend = showCharts && resources.some(resource => Number.isFinite(resourceCreationTime(resource, now)))

  return <>
    <header className="topbar">
      <div className="shell header-inner">
        <Brand onClick={() => navigate(overviewPage)} />
        <nav aria-label="Main navigation">
          {pages.map(item => <button
            key={item.label}
            onClick={() => navigate(item)}
            aria-current={page === item ? 'page' : undefined}
          >
            {item.label}
          </button>)}
        </nav>
        <div className="workspace">
          <button className="button button-quiet session-button" onClick={onOpenAudience}><Target size={15} /> Psychographics</button>
          {demo ? <span className="workspace-label"><i />Demo workspace</span>
            : email && <span className="account-email" title={email}>{email}</span>}
          <button className="button session-button" onClick={onExit} disabled={signOutPending}>
            <LogOut size={15} /> {demo ? 'Exit demo' : signOutPending ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
    </header>
    <main className="shell main-content">
      <div className="page-heading">
        <div>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </div>
        <div className="page-actions">
          {hasTrend && <Picker
            label="Cost trend range"
            value={months}
            onChange={setMonths}
            options={periods}
            icon={<CalendarDays size={16} />}
          />}
          <button
            className="button button-primary"
            onClick={() => exportCsv(resources)}
            disabled={loading || Boolean(loadError) || !hasResources}
          >
            <ArrowDownToLine size={16} /> Export CSV
          </button>
        </div>
      </div>
      {authError && <p role="alert" className="feedback error">{authError}</p>}
      {loading ? <div className="panel feedback" role="status">Loading cloud resources…</div>
        : loadError ? <ResourceNotice title="Couldn’t load cloud resources" detail={loadError} onRetry={reload} error />
        : <>
          {overview && <ResourceSummary resources={resources} />}
          {!demo && !hasResources && <ResourceNotice
            title="No resources returned by Supabase"
            detail="If the table contains rows, check that its SELECT policy allows your signed-in account to read them."
            onRetry={reload}
          />}
          {showCharts && hasResources && <Suspense fallback={<div className="panel feedback" role="status">Loading charts…</div>}>
            <Charts resources={resources} months={Number(months)} now={now} hasTrend={hasTrend} />
          </Suspense>}
          {(overview || page === resourcesPage) && <ResourceTable
            key={page.label}
            resources={resources}
            compact={overview}
            onViewAll={() => navigate(resourcesPage)}
          />}
        </>}
      <footer className="footer">
        <span>CloudLedger</span>
        <span>{demo ? 'Showing sample infrastructure data' : 'Connected to Supabase'}</span>
      </footer>
    </main>
  </>
}

function ResourceNotice({ title, detail, onRetry, error = false }: {
  title: string
  detail: string
  onRetry: () => void
  error?: boolean
}) {
  return <section className={error ? 'panel feedback error' : 'panel feedback'} role={error ? 'alert' : 'status'}>
    <strong>{title}</strong>
    <p>{detail}</p>
    <button className="button" onClick={onRetry}>Try again</button>
  </section>
}

function ResourceSummary({ resources }: { resources: Resource[] }) {
  const count = resources.length
  const activeCount = resources.filter(isActive).length
  const activePercent = count ? Math.round(activeCount / count * 100) : 0
  const regionCount = new Set(resources.map(resource => resource.region?.trim()).filter(Boolean)).size

  return <div className="metrics" aria-label="Resource summary">
    <Metric label="Monthly spend" value={money.format(totalCost(resources))} detail="Across all resources · USD" icon={Wallet} tone="peach" />
    <Metric label="Total resources" value={integer.format(count)} detail="In your cloud inventory" icon={Layers3} tone="violet" />
    <Metric label="Active resources" value={integer.format(activeCount)} detail={`${activePercent}% of total resources`} icon={Activity} tone="green" />
    <Metric label="Regions" value={integer.format(regionCount)} detail="With resources deployed" icon={Globe2} tone="blue" />
  </div>
}

function Metric({ label, value, detail, icon: Icon, tone }: {
  label: string
  value: string
  detail: string
  icon: LucideIcon
  tone: string
}) {
  return <section className="panel metric">
    <div className="metric-heading">
      <h2>{label}</h2>
      <span className={`metric-icon ${tone}`}><Icon size={19} strokeWidth={1.85} /></span>
    </div>
    <strong className="metric-value" title={value}>{value}</strong>
    <p>{detail}</p>
  </section>
}
