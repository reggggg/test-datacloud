import { ArrowRight, Cloud } from 'lucide-react'
import { Brand } from '../../components/ui'

export function Login({ error, onSignIn, pending, canSignIn, onDemo }: {
  error: string
  onSignIn: () => void
  pending: boolean
  canSignIn: boolean
  onDemo?: () => void
}) {
  return <main className="login-screen">
    <div className="login-brand"><Brand /></div>
    <section className="panel login-panel">
      <span className="login-symbol"><Cloud size={28} /></span>
      <h1>Welcome to CloudLedger</h1>
      <p>Sign in to view your cloud resources and monthly costs.</p>
      {error && <p className="feedback error" role="alert">{error}</p>}
      <button className="button google-button" onClick={onSignIn} disabled={!canSignIn || pending}>
        <strong aria-hidden="true">G</strong>
        {pending ? 'Connecting to Google…' : 'Continue with Google'}
        <ArrowRight size={16} />
      </button>
      {!canSignIn && <p className="login-hint">
        Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> in <code>.env.local</code>,
        then restart Vite to enable Google sign-in.
      </p>}
      {onDemo && <button className="button button-quiet" onClick={onDemo}>Explore demo <ArrowRight size={15} /></button>}
    </section>
  </main>
}
