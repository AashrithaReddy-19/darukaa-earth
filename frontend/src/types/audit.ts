export interface AuditLogEntry {
  id: string
  user_id: string | null
  user_name: string | null
  project_id: string | null
  site_id: string | null
  action_type: string
  entity_type: string
  entity_id: string
  summary: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface AuditLogListResponse {
  items: AuditLogEntry[]
  total: number
}

export interface AuditLogListParams {
  project_id?: string
  site_id?: string
  limit?: number
}
