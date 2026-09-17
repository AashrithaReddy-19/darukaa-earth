// String literal union types mirroring the enums section of docs/API_CONTRACT.md exactly.
// Do not change these values without updating the backend contract first.

export type ProjectType =
  | 'mangrove_restoration'
  | 'forest_conservation'
  | 'agroforestry'
  | 'wetland_restoration'
  | 'grassland_restoration'

export type ProjectStatus = 'planning' | 'active' | 'monitoring' | 'completed'

export type EcosystemType = 'mangrove' | 'forest' | 'wetland' | 'grassland' | 'agroforestry'

export type MonitoringStatus = 'active' | 'paused' | 'needs_review' | 'completed'

export type ObservationCategory = 'Bird' | 'Mammal' | 'Reptile' | 'Amphibian' | 'Plant' | 'Insect'

export type AnalyticsRange = '3m' | '6m' | '12m' | 'all'

export type DisturbanceRisk = 'low' | 'moderate' | 'high'

export const PROJECT_TYPES: ProjectType[] = [
  'mangrove_restoration',
  'forest_conservation',
  'agroforestry',
  'wetland_restoration',
  'grassland_restoration',
]

export const PROJECT_STATUSES: ProjectStatus[] = ['planning', 'active', 'monitoring', 'completed']

export const ECOSYSTEM_TYPES: EcosystemType[] = [
  'mangrove',
  'forest',
  'wetland',
  'grassland',
  'agroforestry',
]

export const MONITORING_STATUSES: MonitoringStatus[] = [
  'active',
  'paused',
  'needs_review',
  'completed',
]

export const OBSERVATION_CATEGORIES: ObservationCategory[] = [
  'Bird',
  'Mammal',
  'Reptile',
  'Amphibian',
  'Plant',
  'Insect',
]

export const ANALYTICS_RANGES: AnalyticsRange[] = ['3m', '6m', '12m', 'all']

export const DISTURBANCE_RISKS: DisturbanceRisk[] = ['low', 'moderate', 'high']
