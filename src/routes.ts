export const routes = {
  home: '/',
  cloud: '/cloudledger',
  psychographics: '/psychographics',
} as const

const returnKey = 'cloudledger-sign-in-destination'

export function rememberSignInDestination(pathname: string) {
  const destination = pathname.toLowerCase().replace(/\/+$/, '')
  try {
    if (destination === routes.cloud || destination === routes.psychographics) {
      sessionStorage.setItem(returnKey, destination)
    } else {
      sessionStorage.removeItem(returnKey)
    }
  } catch {
    // Sign-in can still return to the home page when browser storage is unavailable.
  }
}

export function takeSignInDestination() {
  try {
    const destination = sessionStorage.getItem(returnKey)
    sessionStorage.removeItem(returnKey)
    if (destination === routes.cloud || destination === routes.psychographics) return destination
  } catch {
    // The home page remains the fallback.
  }
}
