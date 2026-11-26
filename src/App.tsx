import { useState } from 'react'
import { Cloud } from 'lucide-react'
import { Login } from './features/auth/Login'
import { useAuth } from './features/auth/useAuth'
import { Dashboard } from './features/dashboard/Dashboard'
import { demo } from './lib/supabase'

export default function App() {
  const { session, initializing, authError, canSignIn, signInPending, signOutPending, signIn, signOut } = useAuth()
  const [inDemo, setInDemo] = useState(false)

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
  return <Dashboard
    key={session?.user.id ?? 'demo'}
    email={session?.user.email}
    onExit={inDemo ? () => setInDemo(false) : signOut}
    signOutPending={signOutPending}
    authError={authError}
  />
}
