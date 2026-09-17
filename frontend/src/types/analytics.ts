import type { AnalyticsRange, DisturbanceRisk, ObservationCategory } from './enums'

export interface AnalyticsRecord {
  recorded_at: string
  carbon_captured_tco2e: number
  biodiversity_score: number
  species_count: number
  vegetation_cover_percent: number
  soil_moisture_percent: number
  ecosystem_health_score: number
  disturbance_risk: DisturbanceRisk
}

export interface SiteAnalyticsResponse {
  site_id: string
  range: AnalyticsRange
  records: AnalyticsRecord[]
  latest: AnalyticsRecord | null
}

export type CreateAnalyticsRecordRequest = AnalyticsRecord

export interface SpeciesObservation {
  id: string
  species_name: string
  scientific_name: string | null
  category: ObservationCategory
  observation_count: number
  observed_at: string
  confidence_score: number
}

export type SpeciesByCategory = Partial<Record<ObservationCategory, number>>

export interface SpeciesObservationsResponse {
  items: SpeciesObservation[]
  by_category: SpeciesByCategory
}
