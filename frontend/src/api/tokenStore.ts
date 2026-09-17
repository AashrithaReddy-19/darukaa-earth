import type { AuthTokens } from '../types/auth'

// Small non-React module that owns token persistence so both the axios client
// (outside the React tree) and AuthContext (inside it) can share one source of truth.

const ACCESS_KEY = 'darukaa.access_token'
const REFRESH_KEY = 'darukaa.refresh_token'

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_KEY, tokens.access_token)
  localStorage.setItem(REFRESH_KEY, tokens.refresh_token)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function hasStoredSession(): boolean {
  return Boolean(getAccessToken() || getRefreshToken())
}

type UnauthorizedHandler = () => void
let unauthorizedHandler: UnauthorizedHandler | null = null

/** Registered once by AuthContext so the axios interceptor can force a logout on refresh failure. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler
}

export function notifyUnauthorized(): void {
  unauthorizedHandler?.()
}
