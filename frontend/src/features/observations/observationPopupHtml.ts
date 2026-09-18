import type { FieldObservation } from '../../types/observation'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Builds the small HTML card shown inside a Mapbox marker popup for a field observation. */
export function buildObservationPopupHtml(observation: FieldObservation): string {
  return `
    <div style="font-family: Inter, system-ui, sans-serif; min-width: 180px;">
      <p style="margin:0 0 2px 0; font-size: 13px; font-weight: 600; color: #122a22;">${escapeHtml(observation.observation_type)}</p>
      <p style="margin:0 0 6px 0; font-size: 11px; color: #616a6a;">${escapeHtml(observation.observer_name)} · ${escapeHtml(observation.observation_date)}</p>
      <p style="margin:0; font-size: 11px; color: #3d4444;">${escapeHtml(observation.notes)}</p>
    </div>
  `
}
