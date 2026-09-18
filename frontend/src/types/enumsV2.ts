// String literal union types mirroring the "New enums" section of
// ../../docs/FEATURE_CONTRACT_V2.md exactly. Do not change these values without updating the
// backend contract first. Kept separate from `./enums.ts` (the v1 enum file) so the existing,
// already-shipped file is never touched.

export type ScoreBand = 'healthy' | 'watch' | 'at_risk' | 'critical'

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'

export type AlertStatus = 'open' | 'acknowledged' | 'resolved'

export type ObservationType = 'Species' | 'Habitat' | 'Threat' | 'Restoration Activity' | 'Other'

export type ActionCategory =
  | 'Field Survey'
  | 'Habitat Restoration'
  | 'Community Engagement'
  | 'Monitoring'
  | 'Risk Investigation'

export type ActionPriority = 'low' | 'medium' | 'high' | 'critical'

export type ActionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'

export const SCORE_BANDS: ScoreBand[] = ['healthy', 'watch', 'at_risk', 'critical']

export const ALERT_SEVERITIES: AlertSeverity[] = ['low', 'medium', 'high', 'critical']

export const ALERT_STATUSES: AlertStatus[] = ['open', 'acknowledged', 'resolved']

export const OBSERVATION_TYPES: ObservationType[] = [
  'Species',
  'Habitat',
  'Threat',
  'Restoration Activity',
  'Other',
]

export const ACTION_CATEGORIES: ActionCategory[] = [
  'Field Survey',
  'Habitat Restoration',
  'Community Engagement',
  'Monitoring',
  'Risk Investigation',
]

export const ACTION_PRIORITIES: ActionPriority[] = ['low', 'medium', 'high', 'critical']

export const ACTION_STATUSES: ActionStatus[] = ['planned', 'in_progress', 'completed', 'cancelled']
