import { lazy, Suspense, useEffect, useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router'
import { LoadingStatus } from './components/LoadingStatus'
import { Login } from './features/auth/Login'
import { useAuth } from './features/auth/useAuth'
import Psychographics from './features/psychographics/Psychographics'
import { WorkspaceHome } from './features/workspace/WorkspaceHome'
import { demo } from './lib/supabase'
import { rememberSignInDestination, routes, takeSignInDestination } from './routes'

const Dashboard = lazy(() => import('./features/dashboard/Dashboard'))

export default function App() {
  const { session, initializing, authError, canSignIn, signInPending, signOutPending, signIn, signOut } = useAuth()
  const [inDemo, setInDemo] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const signedIn = Boolean(session)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  useEffect(() => {
    if (!signedIn || initializing) return
    const destination = takeSignInDestination()
    if (pathname === routes.home && destination) void navigate(destination, { replace: true })
  }, [signedIn, initializing, pathname, navigate])

  if (initializing) return <LoadingStatus label="Restoring your session…" />

  if (!session && !inDemo) {
    return <Login
      error={authError}
      onSignIn={() => {
        rememberSignInDestination(pathname)
        void signIn()
      }}
      pending={signInPending}
      canSignIn={canSignIn}
      onDemo={demo ? () => setInDemo(true) : undefined}
    />
  }

  const workspaceProps = {
    email: session?.user.email,
    onExit: inDemo ? () => setInDemo(false) : signOut,
    signOutPending,
    authError,
  }

  return <Routes key={session?.user.id ?? 'demo'}>
    <Route path={routes.home} element={<WorkspaceHome {...workspaceProps} />} />
    <Route path={routes.cloud} element={
      <Suspense fallback={<LoadingStatus label="Loading CloudLedger…" />}>
        <Dashboard {...workspaceProps} />
      </Suspense>
    } />
    <Route path={routes.psychographics} element={<Psychographics {...workspaceProps} />} />
    <Route path="*" element={<WorkspaceHome {...workspaceProps} notFound />} />
  </Routes>
}
