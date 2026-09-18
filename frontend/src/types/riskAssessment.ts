import type { DisturbanceRisk } from './enums'
import type { ScoreBand } from './enumsV2'

/**
 * The seven weighted inputs behind `nature_health_score`, each already normalized to 0-100
 * (higher = better) by the backend — see docs/FEATURE_CONTRACT_V2.md "Component scores".
 * This is a deterministic weighted formula, not a trained AI/ML model.
 */
export interface RiskAssessmentComponents {
  ecosystem_health: number
  biodiversity_trend: number
  vegetation_trend: number
  carbon_trend: number
  soil_moisture: number
  disturbance_risk: number
  species_trend: number
}

/** Weights applied to each component (sums to 1.0). */
export type RiskAssessmentWeights = RiskAssessmentComponents

export interface RiskAssessment {
  id: string
  site_id: string
  nature_health_score: number
  score_band: ScoreBand
  carbon_trend: number
  biodiversity_trend: number
  vegetation_trend: number
  soil_moisture_trend: number
  disturbance_risk: DisturbanceRisk
  calculated_at: string
  components: RiskAssessmentComponents
  weights: RiskAssessmentWeights
}
