import type { ActionCategory, ActionPriority, ActionStatus } from './enumsV2'

export interface ConservationAction {
  id: string
  site_id: string
  site_name: string
  project_id: string
  project_name: string
  alert_id: string | null
  title: string
  description: string
  action_category: ActionCategory
  priority: ActionPriority
  status: ActionStatus
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface ActionListResponse {
  items: ConservationAction[]
  total: number
}

export interface ActionListParams {
  status?: ActionStatus
  site_id?: string
}

export interface CreateActionRequest {
  site_id: string
  alert_id?: string | null
  title: string
  description: string
  action_category: ActionCategory
  priority: ActionPriority
  due_date?: string | null
}

export interface ActionPatchRequest {
  status?: ActionStatus
  priority?: ActionPriority
  due_date?: string | null
}

export interface ActionsSummary {
  by_status: Record<ActionStatus, number>
}
