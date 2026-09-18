/** One point-in-time snapshot of the four headline metrics used by the impact timeline. */
export interface ImpactTimelineSnapshot {
  recorded_at: string
  carbon_captured_tco2e: number
  biodiversity_score: number
  vegetation_cover_percent: number
  species_count: number
}

export interface ImpactTimelineChanges {
  carbon_pct: number
  biodiversity_points: number
  vegetation_pct: number
  species_count_delta: number
  nature_health_score_delta: number | null
}

export interface ImpactTimelineResponse {
  first: ImpactTimelineSnapshot
  latest: ImpactTimelineSnapshot
  changes: ImpactTimelineChanges
  /**
   * Template-filled from `changes` by the backend — explicitly NOT written by an LLM, see
   * docs/FEATURE_CONTRACT_V2.md "Restoration impact timeline".
   */
  summary: string
}
