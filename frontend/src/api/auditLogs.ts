import { apiClient } from './client'
import type { AuditLogListParams, AuditLogListResponse } from '../types/audit'

export async function listAuditLogs(
  params: AuditLogListParams = {},
): Promise<AuditLogListResponse> {
  const { data } = await apiClient.get<AuditLogListResponse>('/audit-logs', { params })
  return data
}
