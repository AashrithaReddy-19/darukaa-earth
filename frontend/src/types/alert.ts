import type { AlertSeverity, AlertStatus } from './enumsV2'

export interface Alert {
  id: string
  site_id: string
  site_name: string
  project_id: string
  project_name: string
  assessment_id: string | null
  severity: AlertSeverity
  title: string
  description: string
  reasons: string[]
  recommendation: string
  status: AlertStatus
  reviewer_note: string | null
  created_at: string
  updated_at: string
}

export interface AlertListResponse {
  items: Alert[]
  total: number
}

export interface AlertListParams {
  severity?: AlertSeverity
  status?: AlertStatus
  site_id?: string
}

/** Both fields are optional/partial per the contract's PATCH /alerts/{alert_id}. */
export interface AlertPatchRequest {
  status?: AlertStatus
  reviewer_note?: string | null
}

export interface AlertsSummary {
  open_count: number
  acknowledged_count: number
  resolved_count: number
  by_severity: Record<AlertSeverity, number>
  recent: Alert[]
}
