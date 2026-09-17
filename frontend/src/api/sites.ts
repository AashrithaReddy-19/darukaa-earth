import { apiClient } from './client'
import type { Site, SiteListResponse, SiteUpsertRequest } from '../types/site'

export async function listSites(projectId: string): Promise<SiteListResponse> {
  const { data } = await apiClient.get<SiteListResponse>(`/projects/${projectId}/sites`)
  return data
}

export async function createSite(projectId: string, payload: SiteUpsertRequest): Promise<Site> {
  const { data } = await apiClient.post<Site>(`/projects/${projectId}/sites`, payload)
  return data
}

export async function getSite(siteId: string): Promise<Site> {
  const { data } = await apiClient.get<Site>(`/sites/${siteId}`)
  return data
}

export async function updateSite(
  siteId: string,
  payload: Partial<SiteUpsertRequest>,
): Promise<Site> {
  const { data } = await apiClient.patch<Site>(`/sites/${siteId}`, payload)
  return data
}

export async function deleteSite(siteId: string): Promise<void> {
  await apiClient.delete(`/sites/${siteId}`)
}
