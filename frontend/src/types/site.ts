import type { SiteGeometry } from './common'
import type { DisturbanceRisk, EcosystemType, MonitoringStatus, ProjectStatus } from './enums'

export interface SiteLatestSnapshot {
  recorded_at: string
  carbon_captured_tco2e: number
  biodiversity_score: number
  species_count: number
  ecosystem_health_score: number
  disturbance_risk: DisturbanceRisk
}

export interface SiteProjectSummary {
  id: string
  name: string
  status: ProjectStatus
  color: string
}

export interface Site {
  id: string
  project_id: string
  name: string
  site_code: string
  ecosystem_type: EcosystemType
  monitoring_status: MonitoringStatus
  notes: string | null
  boundary: SiteGeometry
  area_hectares: number
  created_at: string
  updated_at: string
  latest_snapshot: SiteLatestSnapshot | null
  /** Only present on GET /sites/{id} per the contract. */
  project?: SiteProjectSummary
}

export interface SiteListResponse {
  items: Site[]
  total: number
}

export interface SiteUpsertRequest {
  name: string
  site_code: string
  ecosystem_type: EcosystemType
  monitoring_status: MonitoringStatus
  boundary: SiteGeometry
  notes: string | null
}
