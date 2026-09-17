import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { fetchCurrentUser, loginUser, registerUser } from '../api/auth'
import { clearTokens, hasStoredSession, setTokens, setUnauthorizedHandler } from '../api/tokenStore'
import type { LoginRequest, RegisterRequest, User } from '../types/auth'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginRequest) => Promise<void>
  register: (payload: RegisterRequest) => Promise<void>
  logout: () => void
}

// eslint-disable-next-line react-refresh/only-export-components -- consumed directly by hooks/useAuth.ts
export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (!hasStoredSession()) {
        setIsLoading(false)
        return
      }
      try {
        const me = await fetchCurrentUser()
        if (!cancelled) setUser(me)
      } catch {
        if (!cancelled) {
          clearTokens()
          setUser(null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (payload: LoginRequest) => {
    const tokens = await loginUser(payload)
    setTokens(tokens)
    const me = await fetchCurrentUser()
    setUser(me)
  }, [])

  const register = useCallback(
    async (payload: RegisterRequest) => {
      await registerUser(payload)
      await login({ email: payload.email, password: payload.password })
    },
    [login],
  )

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: Boolean(user), isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
