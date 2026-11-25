import { lazy, Suspense, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Activity, ArrowDownToLine, ArrowRight, CalendarDays, Cloud, Globe2, Layers3, LogOut, Wallet, type LucideIcon } from 'lucide-react'
import { ResourceTable } from './ResourceTable'
import { Brand, Picker } from './ui'
import { configurationError, demo, demoDate, demoResources, exportCsv, getResources, integer, isActive, money, resourceCreationTime, supabase, totalCost, type Resource } from './data'

const pages = ['Overview', 'Resources', 'Cost analysis'] as const
type Page = (typeof pages)[number]
const periods = [3, 6, 12].map(value => ({ value: String(value), label: `Last ${value} months` }))
const Charts = lazy(() => import('./Charts'))

function message(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message
  return fallback
}

function readAuthCallback() {
  const url = new URL(window.location.href)
  const hash = new URLSearchParams(url.hash.slice(1))
  const read = (key: string) => url.searchParams.get(key) ?? hash.get(key)
  return { code: read('code'), error: read('error'), errorCode: read('error_code') }
}

function clearAuthCallback() {
  const url = new URL(window.location.href)
  const hash = new URLSearchParams(url.hash.slice(1))
  let changed = false
  for (const key of ['code', 'error', 'error_code', 'error_description']) {
    if (url.searchParams.has(key) || hash.has(key)) changed = true
    url.searchParams.delete(key)
    hash.delete(key)
  }
  if (!changed) return
  if (hash.size === 0 || url.hash.includes('=')) url.hash = hash.toString()
  window.history.replaceState(window.history.state, '', url)
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [initializing, setInitializing] = useState(Boolean(supabase))
  const [authError, setAuthError] = useState(configurationError)
  const [signInPending, setSignInPending] = useState(false)
  const [signOutPending, setSignOutPending] = useState(false)
  const [inDemo, setInDemo] = useState(false)

  useEffect(() => {
    if (!supabase) return
    const { auth } = supabase
    const callback = readAuthCallback()
    let active = true
    const { data: { subscription } } = auth.onAuthStateChange((_event, next) => {
      if (active) setSession(next)
    })
    async function restoreSession() {
      const { error: initializationError } = await auth.initialize()
      const { data, error } = await auth.getSession()
      if (!active) return
      if (callback.error === 'access_denied' || callback.errorCode === 'access_denied') {
        setAuthError('Google sign-in was cancelled or denied. Please try again.')
      } else if (initializationError || error) {
        setAuthError(`Couldn't complete sign-in. ${(initializationError ?? error)?.message}`)
      } else if (callback.code && !data.session) {
        setAuthError('This sign-in link expired or was opened in a different browser. Start sign-in again from this tab.')
      } else if (callback.error || callback.errorCode) {
        setAuthError('Google sign-in could not finish. Check the Google provider and redirect URL in Supabase.')
      }
    }
    restoreSession().catch(error => {
      if (active) setAuthError(message(error, 'The sign-in session could not be loaded.'))
    }).finally(() => {
      if (!active) return
      if (callback.code || callback.error || callback.errorCode) clearAuthCallback()
      setInitializing(false)
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    const reset = () => setSignInPending(false)
    window.addEventListener('pageshow', reset)
    return () => window.removeEventListener('pageshow', reset)
  }, [])

  async function signIn() {
    if (!supabase || signInPending) return
    setSignInPending(true)
    setAuthError('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: new URL(import.meta.env.BASE_URL, window.location.origin).href },
      })
      if (error) throw error
    } catch (error) {
      setSignInPending(false)
      setAuthError(message(error, 'Google sign-in could not start.'))
    }
  }

  async function signOut() {
    if (!supabase || signOutPending) return
    setSignOutPending(true)
    setAuthError('')
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      if (error) throw error
    } catch (error) {
      setAuthError(message(error, 'Sign-out failed. Please try again.'))
    } finally {
      setSignOutPending(false)
    }
  }

  if (initializing) return <div className="initializing" role="status"><Cloud size={28} /> Restoring your session…</div>
  if (!session && !inDemo) {
    return <Login error={authError} onSignIn={signIn} pending={signInPending} onDemo={demo ? () => setInDemo(true) : undefined} />
  }
  return <Dashboard key={session?.user.id ?? 'demo'} email={session?.user.email}
    onExit={inDemo ? () => setInDemo(false) : signOut} signOutPending={signOutPending} authError={authError} />
}

function Login({ error, onSignIn, pending, onDemo }: { error: string; onSignIn: () => void; pending: boolean; onDemo?: () => void }) {
  return <main className="login-screen">
    <div className="login-brand"><span className="brand"><span className="brand-mark"><Cloud size={21} /></span>CloudLedger<span className="brand-period">.</span></span></div>
    <section className="panel login-panel">
      <span className="login-symbol"><Cloud size={28} /></span>
      <h1>Welcome to CloudLedger</h1>
      <p>Sign in to view your cloud resources and monthly costs.</p>
      {error && <p className="feedback error" role="alert">{error}</p>}
      <button className="button google-button" onClick={onSignIn} disabled={!supabase || pending}>
        <strong aria-hidden="true">G</strong>{pending ? 'Connecting to Google…' : 'Continue with Google'}<ArrowRight size={16} />
      </button>
      {!supabase && <p className="login-hint">Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> in <code>.env.local</code>, then restart Vite to enable Google sign-in.</p>}
      {onDemo && <button className="button button-quiet" onClick={onDemo}>Explore demo <ArrowRight size={15} /></button>}
    </section>
  </main>
}

function Dashboard({ email, onExit, signOutPending, authError }: {
  email?: string
  onExit: () => void
  signOutPending: boolean
  authError: string
}) {
  const [page, setPage] = useState<Page>('Overview')
  const [months, setMonths] = useState('6')
  const [resources, setResources] = useState<Resource[]>(demo ? demoResources : [])
  const [loading, setLoading] = useState(!demo)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [now] = useState(() => demo ? demoDate : new Date())

  useEffect(() => {
    if (demo) return
    const controller = new AbortController()
    setLoading(true)
    setLoadError('')
    getResources(controller.signal).then(data => {
      if (!controller.signal.aborted) setResources(data)
    }).catch(error => {
      if (!controller.signal.aborted) setLoadError(message(error, 'Cloud resources could not be loaded.'))
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [attempt])

  function navigate(next: Page) {
    setPage(next)
    window.scrollTo({ top: 0 })
  }

  const regionCount = new Set(resources.map(resource => resource.region?.trim()).filter(Boolean)).size
  const activeCount = resources.filter(isActive).length
  const overview = page === 'Overview'
  const showCharts = page !== 'Resources'
  const hasTrend = showCharts && resources.some(resource => Number.isFinite(resourceCreationTime(resource, now)))
  const titles: Record<Page, string> = { Overview: 'Cloud overview', Resources: 'Cloud resources', 'Cost analysis': 'Cost analysis' }
  const descriptions: Record<Page, string> = {
    Overview: 'Monitor your cloud resources, costs, and regional footprint.',
    Resources: 'Search, filter, and export your cloud inventory.',
    'Cost analysis': 'Explore your monthly run rate and where your cloud spend goes.',
  }

  return <>
    <header className="topbar">
      <div className="shell header-inner">
        <Brand onClick={() => navigate('Overview')} />
        <nav aria-label="Main navigation">{pages.map(item => <button key={item} onClick={() => navigate(item)} aria-current={page === item ? 'page' : undefined}>{item}</button>)}</nav>
        <div className="workspace">
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
        <div><h1>{titles[page]}</h1><p>{descriptions[page]}</p></div>
        <div className="page-actions">
          {hasTrend && <Picker label="Cost trend range" value={months} onChange={setMonths} options={periods} icon={<CalendarDays size={16} />} />}
          <button className="button button-primary" onClick={() => exportCsv(resources)} disabled={loading || Boolean(loadError) || !resources.length}><ArrowDownToLine size={16} /> Export CSV</button>
        </div>
      </div>
      {authError && <p role="alert" className="feedback error">{authError}</p>}
      {loading ? <div className="panel feedback" role="status">Loading cloud resources…</div>
        : loadError ? <section className="panel feedback error" role="alert"><strong>Couldn’t load cloud resources</strong><p>{loadError}</p><button className="button" onClick={() => setAttempt(value => value + 1)}>Try again</button></section>
        : <>
          {overview && <div className="metrics" aria-label="Resource summary">
            <Metric label="Monthly spend" value={money.format(totalCost(resources))} detail="Across all resources · USD" icon={Wallet} tone="peach" />
            <Metric label="Total resources" value={integer.format(resources.length)} detail="In your cloud inventory" icon={Layers3} tone="violet" />
            <Metric label="Active resources" value={integer.format(activeCount)} detail={`${resources.length ? Math.round(activeCount / resources.length * 100) : 0}% of total resources`} icon={Activity} tone="green" />
            <Metric label="Regions" value={integer.format(regionCount)} detail="With resources deployed" icon={Globe2} tone="blue" />
          </div>}
          {!demo && !resources.length && <section className="panel feedback" role="status">
            <strong>No resources returned by Supabase</strong>
            <p>If the table contains rows, check that its SELECT policy allows your signed-in account to read them.</p>
            <button className="button" onClick={() => setAttempt(value => value + 1)}>Try again</button>
          </section>}
          {showCharts && resources.length > 0 && <Suspense fallback={<div className="panel feedback" role="status">Loading charts…</div>}>
            <Charts resources={resources} months={Number(months)} now={now} hasTrend={hasTrend} />
          </Suspense>}
          {page !== 'Cost analysis' && <ResourceTable key={page} resources={resources} compact={overview} onViewAll={() => navigate('Resources')} />}
        </>}
      <footer className="footer"><span>CloudLedger</span><span>{demo ? 'Showing sample infrastructure data' : 'Connected to Supabase'}</span></footer>
    </main>
  </>
}

function Metric({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: LucideIcon; tone: string }) {
  return <section className="panel metric">
    <div className="metric-heading"><h2>{label}</h2><span className={`metric-icon ${tone}`}><Icon size={19} strokeWidth={1.85} /></span></div>
    <strong className="metric-value" title={value}>{value}</strong><p>{detail}</p>
  </section>
}
