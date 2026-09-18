import { apiClient } from './client'
import type { RiskAssessment } from '../types/riskAssessment'

export async function getRiskAssessment(siteId: string): Promise<RiskAssessment> {
  const { data } = await apiClient.get<RiskAssessment>(`/sites/${siteId}/risk-assessment`)
  return data
}

export async function recalculateRiskAssessment(siteId: string): Promise<RiskAssessment> {
  const { data } = await apiClient.post<RiskAssessment>(
    `/sites/${siteId}/risk-assessment/recalculate`,
  )
  return data
}
