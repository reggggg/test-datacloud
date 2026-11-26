import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { errorMessage } from '../../lib/errors'
import { configurationError, supabase } from '../../lib/supabase'

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

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [initializing, setInitializing] = useState(Boolean(supabase))
  const [authError, setAuthError] = useState(configurationError)
  const [signInPending, setSignInPending] = useState(false)
  const [signOutPending, setSignOutPending] = useState(false)

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
      if (active) setAuthError(errorMessage(error, 'The sign-in session could not be loaded.'))
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
      setAuthError(errorMessage(error, 'Google sign-in could not start.'))
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
      setAuthError(errorMessage(error, 'Sign-out failed. Please try again.'))
    } finally {
      setSignOutPending(false)
    }
  }

  return { session, initializing, authError, canSignIn: Boolean(supabase), signInPending, signOutPending, signIn, signOut }
}
