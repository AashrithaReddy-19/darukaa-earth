import { apiClient } from './client'
import type {
  ActionListParams,
  ActionListResponse,
  ActionPatchRequest,
  ActionsSummary,
  ConservationAction,
  CreateActionRequest,
} from '../types/action'

export async function listActions(params: ActionListParams = {}): Promise<ActionListResponse> {
  const { data } = await apiClient.get<ActionListResponse>('/actions', { params })
  return data
}

export async function createAction(payload: CreateActionRequest): Promise<ConservationAction> {
  const { data } = await apiClient.post<ConservationAction>('/actions', payload)
  return data
}

export async function patchAction(
  actionId: string,
  payload: ActionPatchRequest,
): Promise<ConservationAction> {
  const { data } = await apiClient.patch<ConservationAction>(`/actions/${actionId}`, payload)
  return data
}

export async function getActionsSummary(): Promise<ActionsSummary> {
  const { data } = await apiClient.get<ActionsSummary>('/dashboard/actions-summary')
  return data
}
