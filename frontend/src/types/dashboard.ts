import type { SiteGeometry } from './common'
import type { MonitoringStatus, ProjectStatus } from './enums'

export interface DashboardRecentProject {
  id: string
  name: string
  status: ProjectStatus
  site_count: number
  updated_at: string
}

export interface DashboardRecentSiteActivity {
  id: string
  name: string
  project_name: string
  monitoring_status: MonitoringStatus
  updated_at: string
}

export interface DashboardSummary {
  total_projects: number
  total_active_sites: number
  total_area_hectares: number
  total_carbon_tco2e: number
  avg_biodiversity_score: number
  total_species_observed: number
  recent_projects: DashboardRecentProject[]
  recent_site_activity: DashboardRecentSiteActivity[]
}

export interface DashboardMapSite {
  id: string
  name: string
  project_id: string
  project_name: string
  project_status: ProjectStatus
  project_color: string
  boundary: SiteGeometry
  area_hectares: number
  ecosystem_health_score: number
  latest_carbon_tco2e: number
}

export interface DashboardMapSitesResponse {
  items: DashboardMapSite[]
}
