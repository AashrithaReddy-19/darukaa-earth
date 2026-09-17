import { apiClient } from './client'
import type { AuthTokens, LoginRequest, RefreshRequest, RegisterRequest, User } from '../types/auth'

export async function registerUser(payload: RegisterRequest): Promise<User> {
  const { data } = await apiClient.post<User>('/auth/register', payload)
  return data
}

export async function loginUser(payload: LoginRequest): Promise<AuthTokens> {
  const { data } = await apiClient.post<AuthTokens>('/auth/login', payload)
  return data
}

export async function refreshSession(payload: RefreshRequest): Promise<AuthTokens> {
  const { data } = await apiClient.post<AuthTokens>('/auth/refresh', payload)
  return data
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me')
  return data
}
