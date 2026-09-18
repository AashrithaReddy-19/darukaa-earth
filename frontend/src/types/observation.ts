import type { ObservationType } from './enumsV2'

export interface FieldObservation {
  id: string
  site_id: string
  observer_name: string
  observation_type: ObservationType
  notes: string
  latitude: number | null
  longitude: number | null
  observation_date: string
  created_at: string
}

export interface FieldObservationListResponse {
  items: FieldObservation[]
  total: number
}

export interface CreateFieldObservationRequest {
  observer_name: string
  observation_type: ObservationType
  notes: string
  latitude?: number | null
  longitude?: number | null
  observation_date: string
}
