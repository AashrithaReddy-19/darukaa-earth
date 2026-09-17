function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface SitePopupInfo {
  siteName: string
  projectName: string
  areaHectares: number
  healthScore: number | null
}

/** Builds the small HTML card shown inside a Mapbox popup when a site polygon is clicked. */
export function buildSitePopupHtml({
  siteName,
  projectName,
  areaHectares,
  healthScore,
}: SitePopupInfo): string {
  const health = healthScore === null || Number.isNaN(healthScore) ? '—' : healthScore.toFixed(1)
  return `
    <div style="font-family: Inter, system-ui, sans-serif; min-width: 180px;">
      <p style="margin:0 0 2px 0; font-size: 13px; font-weight: 600; color: #122a22;">${escapeHtml(siteName)}</p>
      <p style="margin:0 0 8px 0; font-size: 11px; color: #616a6a;">${escapeHtml(projectName)}</p>
      <div style="display:flex; justify-content:space-between; font-size: 11px; color: #3d4444; gap: 12px;">
        <span>Area</span><span style="font-weight:600;">${areaHectares.toFixed(1)} ha</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size: 11px; color: #3d4444; gap: 12px;">
        <span>Health score</span><span style="font-weight:600;">${escapeHtml(health)}</span>
      </div>
    </div>
  `
}
