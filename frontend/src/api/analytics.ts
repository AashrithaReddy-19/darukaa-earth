import { apiClient } from './client'
import type {
  AnalyticsRecord,
  CreateAnalyticsRecordRequest,
  SiteAnalyticsResponse,
  SpeciesObservationsResponse,
} from '../types/analytics'
import type { AnalyticsRange } from '../types/enums'

export async function getSiteAnalytics(
  siteId: string,
  range: AnalyticsRange,
): Promise<SiteAnalyticsResponse> {
  const { data } = await apiClient.get<SiteAnalyticsResponse>(`/sites/${siteId}/analytics`, {
    params: { range },
  })
  return data
}

export async function createSiteAnalyticsRecord(
  siteId: string,
  payload: CreateAnalyticsRecordRequest,
): Promise<AnalyticsRecord> {
  const { data } = await apiClient.post<AnalyticsRecord>(`/sites/${siteId}/analytics`, payload)
  return data
}

export async function getSpeciesObservations(siteId: string): Promise<SpeciesObservationsResponse> {
  const { data } = await apiClient.get<SpeciesObservationsResponse>(
    `/sites/${siteId}/species-observations`,
  )
  return data
}
