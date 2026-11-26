import { lazy, Suspense, useState } from 'react'
import { Cloud } from 'lucide-react'
import { Login } from './features/auth/Login'
import { useAuth } from './features/auth/useAuth'
import Psychographics from './features/psychographics/Psychographics'
import { demo } from './lib/supabase'

const Dashboard = lazy(() => import('./features/dashboard/Dashboard'))

export default function App() {
  const { session, initializing, authError, canSignIn, signInPending, signOutPending, signIn, signOut } = useAuth()
  const [inDemo, setInDemo] = useState(false)
  const [workspace, setWorkspace] = useState<'audience' | 'cloud'>('audience')

  if (initializing) {
    return <div className="initializing" role="status"><Cloud size={28} /> Restoring your session…</div>
  }
  if (!session && !inDemo) {
    return <Login
      error={authError}
      onSignIn={signIn}
      pending={signInPending}
      canSignIn={canSignIn}
      onDemo={demo ? () => setInDemo(true) : undefined}
    />
  }
  function openWorkspace(next: 'audience' | 'cloud') {
    setWorkspace(next)
    window.scrollTo({ top: 0 })
  }

  const key = session?.user.id ?? 'demo'
  const workspaceProps = {
    email: session?.user.email,
    onExit: inDemo ? () => setInDemo(false) : signOut,
    signOutPending,
    authError,
  }
  if (workspace === 'audience') {
    return <Psychographics key={key} {...workspaceProps} onOpenCloud={() => openWorkspace('cloud')} />
  }
  return <Suspense fallback={<div className="initializing" role="status">Loading workspace…</div>}>
    <Dashboard key={key} {...workspaceProps} onOpenAudience={() => openWorkspace('audience')} />
  </Suspense>
}
