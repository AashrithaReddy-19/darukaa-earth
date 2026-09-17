import { apiClient } from './client'
import type { DashboardMapSitesResponse, DashboardSummary } from '../types/dashboard'

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await apiClient.get<DashboardSummary>('/dashboard/summary')
  return data
}

export async function getDashboardMapSites(): Promise<DashboardMapSitesResponse> {
  const { data } = await apiClient.get<DashboardMapSitesResponse>('/dashboard/map-sites')
  return data
}
