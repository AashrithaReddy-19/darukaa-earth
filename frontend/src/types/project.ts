import type { ProjectStatus, ProjectType } from './enums'

export interface Project {
  id: string
  owner_id: string
  name: string
  description: string
  country: string
  region: string
  project_type: ProjectType
  status: ProjectStatus
  start_date: string
  end_date: string | null
  color: string
  created_at: string
  updated_at: string
  // Computed, server-derived fields present on every representation.
  site_count: number
  total_area_hectares: number
  total_carbon_tco2e: number
  avg_biodiversity_score: number | null
}

export interface ProjectListResponse {
  items: Project[]
  total: number
}

export interface ProjectUpsertRequest {
  name: string
  description: string
  country: string
  region: string
  project_type: ProjectType
  status: ProjectStatus
  start_date: string
  end_date: string | null
  color: string
}

export interface ProjectListParams {
  search?: string
  status?: ProjectStatus
}
