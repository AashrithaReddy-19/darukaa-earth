import { apiClient } from './client'
import type { Alert, AlertListParams, AlertListResponse, AlertPatchRequest } from '../types/alert'
import type { AlertsSummary } from '../types/alert'

export async function listAlerts(params: AlertListParams = {}): Promise<AlertListResponse> {
  const { data } = await apiClient.get<AlertListResponse>('/alerts', { params })
  return data
}

export async function patchAlert(alertId: string, payload: AlertPatchRequest): Promise<Alert> {
  const { data } = await apiClient.patch<Alert>(`/alerts/${alertId}`, payload)
  return data
}

export async function getAlertsSummary(): Promise<AlertsSummary> {
  const { data } = await apiClient.get<AlertsSummary>('/dashboard/alerts-summary')
  return data
}
