import { ArrowUpRight, Cloud, Layers3, LogOut, Target } from 'lucide-react'
import { Link } from 'react-router'
import { demo } from '../../lib/supabase'
import { routes } from '../../routes'
import './workspace-home.css'

const applications = [
  {
    title: 'CloudLedger',
    category: 'Cloud operations',
    description: 'Monitor cloud costs and explore your resource inventory across services and regions.',
    route: routes.cloud,
    icon: Cloud,
    tone: 'cloud',
  },
  {
    title: 'Psychographics',
    category: 'Audience analytics',
    description: 'Compare audience segments and see which traits stand out against the network baseline.',
    route: routes.psychographics,
    icon: Target,
    tone: 'audience',
  },
] as const

export function WorkspaceHome({ email, onExit, signOutPending, authError, notFound = false }: {
  email?: string
  onExit: () => void
  signOutPending: boolean
  authError: string
  notFound?: boolean
}) {
  return <div className="hub">
    <header className="hub-header">
      <div className="hub-shell hub-header-inner">
        <Link className="hub-brand" to={routes.home}><span><Layers3 size={20} /></span>Data Cloud</Link>
        <div className="hub-account">
          {demo ? <span className="hub-demo"><i />Demo workspace</span>
            : email && <span className="hub-email" title={email}>{email}</span>}
          <button className="hub-signout" onClick={onExit} disabled={signOutPending}>
            <LogOut size={15} />{demo ? 'Exit demo' : signOutPending ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
    </header>
    <main className="hub-shell hub-content">
      <div className="hub-intro">
        <h1>{notFound ? 'Page not found' : 'Choose a workspace'}</h1>
        <p>{notFound ? 'Open an available workspace below, or return to the home page.' : 'Open a workspace to explore your cloud infrastructure or audience insights.'}</p>
        {notFound && <Link className="hub-back" to={routes.home}>Back to workspace home</Link>}
      </div>
      {authError && <p className="feedback error" role="alert">{authError}</p>}
      <div className="hub-grid">
        {applications.map(({ title, category, description, route, icon: Icon, tone }) => <Link
          className={`hub-app hub-${tone}`}
          to={route}
          key={route}
        >
          <div className="hub-app-art" aria-hidden="true">
            <span className="hub-app-icon"><Icon size={29} strokeWidth={1.75} /></span>
            <span className="hub-art-plot"><i /><i /><i /><i /><i /></span>
          </div>
          <div className="hub-app-content">
            <div className="hub-app-category">{category}</div>
            <h2>{title}</h2>
            <p>{description}</p>
            <span className="hub-app-link">Open {title}<ArrowUpRight size={17} /></span>
          </div>
        </Link>)}
      </div>
    </main>
  </div>
}
