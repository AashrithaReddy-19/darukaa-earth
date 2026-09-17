import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { AuthTokens } from '../types/auth'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  notifyUnauthorized,
  setTokens,
} from './tokenStore'

const API_ROOT = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
export const API_BASE_URL = `${API_ROOT.replace(/\/+$/, '')}/api/v1`

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh']

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false
  return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint))
}

// Coalesce concurrent 401s onto a single in-flight refresh call.
let refreshPromise: Promise<AuthTokens> | null = null

async function performRefresh(): Promise<AuthTokens> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }
  const response = await axios.post<AuthTokens>(`${API_BASE_URL}/auth/refresh`, {
    refresh_token: refreshToken,
  })
  setTokens(response.data)
  return response.data
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true
      try {
        if (!refreshPromise) {
          refreshPromise = performRefresh().finally(() => {
            refreshPromise = null
          })
        }
        const tokens = await refreshPromise
        originalRequest.headers.set('Authorization', `Bearer ${tokens.access_token}`)
        return apiClient(originalRequest)
      } catch (refreshError) {
        clearTokens()
        notifyUnauthorized()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)
