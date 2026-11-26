import { createClient } from '@supabase/supabase-js'

// This publishable key is intended for the browser. Supabase RLS controls data access.
const defaultProject = {
  url: 'https://fhcptjfxgepapwkorhhv.supabase.co',
  publishableKey: 'sb_publishable_7ED36Jim8ogbouN_5x7f3A_nVdhdUAe',
}
const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const configuredPublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
const configuredAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
const hasOverride = [configuredUrl, configuredPublishableKey, configuredAnonKey]
  .some(value => value !== undefined)
const projectUrl = (hasOverride ? configuredUrl : defaultProject.url)?.replace(/\/rest\/v1\/?$/, '')
const publicKey = hasOverride ? configuredPublishableKey || configuredAnonKey : defaultProject.publishableKey
export const demo = !projectUrl && !publicKey
let configurationError = ''
function connect() {
  if (demo) return null
  if (!projectUrl || !publicKey) {
    configurationError = 'Set both the Supabase project URL and publishable key.'
    return null
  }
  try {
    return createClient(projectUrl, publicKey, { auth: { flowType: 'pkce' } })
  } catch {
    configurationError = 'Check the Supabase project URL and publishable key.'
    return null
  }
}

export const supabase = connect()
export { configurationError }
