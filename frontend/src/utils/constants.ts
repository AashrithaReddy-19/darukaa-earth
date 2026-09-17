import type {
  DisturbanceRisk,
  EcosystemType,
  MonitoringStatus,
  ObservationCategory,
  ProjectStatus,
  ProjectType,
} from '../types'

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  mangrove_restoration: 'Mangrove Restoration',
  forest_conservation: 'Forest Conservation',
  agroforestry: 'Agroforestry',
  wetland_restoration: 'Wetland Restoration',
  grassland_restoration: 'Grassland Restoration',
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: 'Planning',
  active: 'Active',
  monitoring: 'Monitoring',
  completed: 'Completed',
}

/** Tailwind-ish color tokens (bg / text / dot) for project status badges and the map legend. */
export const PROJECT_STATUS_COLORS: Record<
  ProjectStatus,
  { bg: string; text: string; dot: string }
> = {
  planning: { bg: 'bg-sand-100', text: 'text-sand-500', dot: '#b99c5c' },
  active: { bg: 'bg-forest-100', text: 'text-forest-700', dot: '#276044' },
  monitoring: { bg: 'bg-teal-100', text: 'text-teal-700', dot: '#19776c' },
  completed: { bg: 'bg-charcoal-100', text: 'text-charcoal-600', dot: '#616a6a' },
}

export const ECOSYSTEM_TYPE_LABELS: Record<EcosystemType, string> = {
  mangrove: 'Mangrove',
  forest: 'Forest',
  wetland: 'Wetland',
  grassland: 'Grassland',
  agroforestry: 'Agroforestry',
}

export const MONITORING_STATUS_LABELS: Record<MonitoringStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  needs_review: 'Needs Review',
  completed: 'Completed',
}

export const MONITORING_STATUS_COLORS: Record<
  MonitoringStatus,
  { bg: string; text: string; dot: string }
> = {
  active: { bg: 'bg-forest-100', text: 'text-forest-700', dot: '#276044' },
  paused: { bg: 'bg-sand-100', text: 'text-sand-500', dot: '#b99c5c' },
  needs_review: { bg: 'bg-amber-100', text: 'text-amber-700', dot: '#b45309' },
  completed: { bg: 'bg-charcoal-100', text: 'text-charcoal-600', dot: '#616a6a' },
}

export const DISTURBANCE_RISK_LABELS: Record<DisturbanceRisk, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
}

export const DISTURBANCE_RISK_COLORS: Record<
  DisturbanceRisk,
  { bg: string; text: string; dot: string }
> = {
  low: { bg: 'bg-forest-100', text: 'text-forest-700', dot: '#276044' },
  moderate: { bg: 'bg-amber-100', text: 'text-amber-700', dot: '#b45309' },
  high: { bg: 'bg-terracotta-100', text: 'text-terracotta-700', dot: '#b3402e' },
}

export const OBSERVATION_CATEGORY_LABELS: Record<ObservationCategory, string> = {
  Bird: 'Birds',
  Mammal: 'Mammals',
  Reptile: 'Reptiles',
  Amphibian: 'Amphibians',
  Plant: 'Plants',
  Insect: 'Insects',
}

export const OBSERVATION_CATEGORY_COLORS: Record<ObservationCategory, string> = {
  Bird: '#276044',
  Mammal: '#19776c',
  Reptile: '#b99c5c',
  Amphibian: '#37b3a1',
  Plant: '#1b3a2f',
  Insect: '#b3402e',
}

export const ANALYTICS_RANGE_LABELS: Record<string, string> = {
  '3m': '3 months',
  '6m': '6 months',
  '12m': '12 months',
  all: 'All time',
}
