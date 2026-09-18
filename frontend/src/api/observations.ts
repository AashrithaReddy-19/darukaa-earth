import { apiClient } from './client'
import type {
  CreateFieldObservationRequest,
  FieldObservation,
  FieldObservationListResponse,
} from '../types/observation'
import type { ObservationType } from '../types/enumsV2'

export async function listFieldObservations(
  siteId: string,
  params: { observation_type?: ObservationType } = {},
): Promise<FieldObservationListResponse> {
  const { data } = await apiClient.get<FieldObservationListResponse>(
    `/sites/${siteId}/field-observations`,
    { params },
  )
  return data
}

export async function createFieldObservation(
  siteId: string,
  payload: CreateFieldObservationRequest,
): Promise<FieldObservation> {
  const { data } = await apiClient.post<FieldObservation>(
    `/sites/${siteId}/field-observations`,
    payload,
  )
  return data
}
