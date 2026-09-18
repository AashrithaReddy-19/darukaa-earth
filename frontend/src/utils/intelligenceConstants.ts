// Label/color maps for the v2 feature-extension enums (docs/FEATURE_CONTRACT_V2.md), mirroring
// the pattern in `./constants.ts` for the existing v1 enums. Kept in a separate sibling file so
// the original, already-shipped `constants.ts` is never touched.
import type {
  ActionCategory,
  ActionPriority,
  ActionStatus,
  AlertSeverity,
  AlertStatus,
  ObservationType,
  ScoreBand,
} from '../types/enumsV2'

type ColorTokens = { bg: string; text: string; dot: string }

export const SCORE_BAND_LABELS: Record<ScoreBand, string> = {
  healthy: 'Healthy',
  watch: 'Watch',
  at_risk: 'At Risk',
  critical: 'Critical',
}

/** healthy=forest green, watch=amber/beige, at_risk=orange, critical=terracotta/red. */
export const SCORE_BAND_COLORS: Record<ScoreBand, ColorTokens> = {
  healthy: { bg: 'bg-forest-100', text: 'text-forest-700', dot: '#276044' },
  watch: { bg: 'bg-sand-100', text: 'text-sand-500', dot: '#b99c5c' },
  at_risk: { bg: 'bg-orange-100', text: 'text-orange-700', dot: '#c2410c' },
  critical: { bg: 'bg-terracotta-100', text: 'text-terracotta-700', dot: '#b3402e' },
}

export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const ALERT_SEVERITY_COLORS: Record<AlertSeverity, ColorTokens> = {
  low: { bg: 'bg-forest-100', text: 'text-forest-700', dot: '#276044' },
  medium: { bg: 'bg-sand-100', text: 'text-sand-500', dot: '#b99c5c' },
  high: { bg: 'bg-orange-100', text: 'text-orange-700', dot: '#c2410c' },
  critical: { bg: 'bg-terracotta-100', text: 'text-terracotta-700', dot: '#b3402e' },
}

export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  open: 'Open',
  acknowledged: 'Acknowledged',
  resolved: 'Resolved',
}

export const ALERT_STATUS_COLORS: Record<AlertStatus, ColorTokens> = {
  open: { bg: 'bg-terracotta-100', text: 'text-terracotta-700', dot: '#b3402e' },
  acknowledged: { bg: 'bg-sand-100', text: 'text-sand-500', dot: '#b99c5c' },
  resolved: { bg: 'bg-forest-100', text: 'text-forest-700', dot: '#276044' },
}

export const OBSERVATION_TYPE_LABELS: Record<ObservationType, string> = {
  Species: 'Species',
  Habitat: 'Habitat',
  Threat: 'Threat',
  'Restoration Activity': 'Restoration Activity',
  Other: 'Other',
}

export const OBSERVATION_TYPE_COLORS: Record<ObservationType, ColorTokens> = {
  Species: { bg: 'bg-forest-100', text: 'text-forest-700', dot: '#276044' },
  Habitat: { bg: 'bg-teal-100', text: 'text-teal-700', dot: '#19776c' },
  Threat: { bg: 'bg-terracotta-100', text: 'text-terracotta-700', dot: '#b3402e' },
  'Restoration Activity': { bg: 'bg-sand-100', text: 'text-sand-500', dot: '#b99c5c' },
  Other: { bg: 'bg-charcoal-100', text: 'text-charcoal-600', dot: '#616a6a' },
}

export const ACTION_CATEGORY_LABELS: Record<ActionCategory, string> = {
  'Field Survey': 'Field Survey',
  'Habitat Restoration': 'Habitat Restoration',
  'Community Engagement': 'Community Engagement',
  Monitoring: 'Monitoring',
  'Risk Investigation': 'Risk Investigation',
}

export const ACTION_PRIORITY_LABELS: Record<ActionPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const ACTION_PRIORITY_COLORS: Record<ActionPriority, ColorTokens> = ALERT_SEVERITY_COLORS

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const ACTION_STATUS_COLORS: Record<ActionStatus, ColorTokens> = {
  planned: { bg: 'bg-sand-100', text: 'text-sand-500', dot: '#b99c5c' },
  in_progress: { bg: 'bg-teal-100', text: 'text-teal-700', dot: '#19776c' },
  completed: { bg: 'bg-forest-100', text: 'text-forest-700', dot: '#276044' },
  cancelled: { bg: 'bg-charcoal-100', text: 'text-charcoal-600', dot: '#616a6a' },
}
