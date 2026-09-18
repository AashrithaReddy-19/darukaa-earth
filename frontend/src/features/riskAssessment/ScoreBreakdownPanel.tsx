import type { RiskAssessmentComponents, RiskAssessmentWeights } from '../../types/riskAssessment'

interface ComponentDef {
  key: keyof RiskAssessmentComponents
  label: string
}

// Order matches docs/FEATURE_CONTRACT_V2.md "Component scores" 1-7.
const COMPONENT_DEFS: ComponentDef[] = [
  { key: 'ecosystem_health', label: 'Ecosystem health' },
  { key: 'biodiversity_trend', label: 'Biodiversity trend' },
  { key: 'vegetation_trend', label: 'Vegetation trend' },
  { key: 'carbon_trend', label: 'Carbon trend' },
  { key: 'soil_moisture', label: 'Soil moisture' },
  { key: 'disturbance_risk', label: 'Human disturbance risk' },
  { key: 'species_trend', label: 'Species-observation trend' },
]

interface ScoreBreakdownPanelProps {
  components: RiskAssessmentComponents
  weights: RiskAssessmentWeights
}

/** The "why this score?" panel: renders the 7 weighted components behind `nature_health_score`. */
export function ScoreBreakdownPanel({ components, weights }: ScoreBreakdownPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-relaxed text-charcoal-500">
        The Nature Health Score is a deterministic weighted formula computed from this site&apos;s
        stored analytics — not a trained AI/ML model. Each component below is normalized to 0-100
        (higher is better), then combined using the listed weight.
      </p>
      <ul className="flex flex-col gap-2.5">
        {COMPONENT_DEFS.map(({ key, label }) => {
          const value = components[key]
          const weight = weights[key]
          const contribution = value * weight
          return (
            <li key={key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-charcoal-800">{label}</span>
                <span className="text-charcoal-500">
                  {value.toFixed(0)}/100 · weight {(weight * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-charcoal-100">
                <div
                  className="h-full rounded-full bg-forest-600"
                  style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                />
              </div>
              <p className="text-[11px] text-charcoal-400">
                Contribution to score: {contribution.toFixed(1)} points
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
