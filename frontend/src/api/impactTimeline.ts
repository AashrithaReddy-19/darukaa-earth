import { apiClient } from './client'
import type { ImpactTimelineResponse } from '../types/impactTimeline'

export async function getImpactTimeline(siteId: string): Promise<ImpactTimelineResponse> {
  const { data } = await apiClient.get<ImpactTimelineResponse>(`/sites/${siteId}/impact-timeline`)
  return data
}
