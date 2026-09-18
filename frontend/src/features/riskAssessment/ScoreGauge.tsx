import type { ScoreBand } from '../../types/enumsV2'
import { SCORE_BAND_COLORS } from '../../utils/intelligenceConstants'

interface ScoreGaugeProps {
  score: number
  band: ScoreBand
}

const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** Circular progress gauge, band-colored per docs/FEATURE_CONTRACT_V2.md score thresholds. */
export function ScoreGauge({ score, band }: ScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score))
  const offset = CIRCUMFERENCE * (1 - clamped / 100)
  const color = SCORE_BAND_COLORS[band].dot

  return (
    <div
      className="relative flex h-32 w-32 shrink-0 items-center justify-center"
      role="img"
      aria-label={`Nature Health Score ${Math.round(clamped)} out of 100`}
    >
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="#e4e6e6" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.2s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-charcoal-900">{Math.round(clamped)}</span>
        <span className="text-[11px] text-charcoal-500">/ 100</span>
      </div>
    </div>
  )
}
