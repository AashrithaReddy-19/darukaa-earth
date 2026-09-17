import { z } from 'zod'
import { ECOSYSTEM_TYPES, MONITORING_STATUSES } from '../../types/enums'
import type { SiteGeometry } from '../../types/common'

function isValidRing(ring: unknown): ring is number[][] {
  return (
    Array.isArray(ring) &&
    ring.length >= 4 &&
    ring.every(
      (position) =>
        Array.isArray(position) &&
        position.length >= 2 &&
        position.every((n) => typeof n === 'number'),
    )
  )
}

/**
 * Structural check (not a full zod object schema) so the inferred TS type stays exactly
 * `SiteGeometry` — matching the GeoJSON shape mapbox-gl-draw emits — instead of a stricter
 * zod-derived shape that would fight with `@types/geojson`'s looser `Position = number[]`.
 */
export const siteGeometrySchema = z.custom<SiteGeometry>((value) => {
  if (!value || typeof value !== 'object') return false
  const geometry = value as { type?: unknown; coordinates?: unknown }
  if (geometry.type === 'Polygon') {
    return (
      Array.isArray(geometry.coordinates) &&
      geometry.coordinates.length >= 1 &&
      geometry.coordinates.every(isValidRing)
    )
  }
  if (geometry.type === 'MultiPolygon') {
    return (
      Array.isArray(geometry.coordinates) &&
      geometry.coordinates.length >= 1 &&
      geometry.coordinates.every(
        (polygon) => Array.isArray(polygon) && polygon.length >= 1 && polygon.every(isValidRing),
      )
    )
  }
  return false
}, 'Boundary must be a valid Polygon or MultiPolygon')

export const BOUNDARY_REQUIRED_MESSAGE = 'Please draw a site boundary on the map before saving.'

export const siteSchema = z.object({
  name: z.string().trim().min(1, 'Site name is required').max(200, 'Keep it under 200 characters'),
  site_code: z.string().trim().min(1, 'Site code is required'),
  ecosystem_type: z.enum(ECOSYSTEM_TYPES as [string, ...string[]], {
    errorMap: () => ({ message: 'Select an ecosystem type' }),
  }),
  monitoring_status: z.enum(MONITORING_STATUSES as [string, ...string[]], {
    errorMap: () => ({ message: 'Select a monitoring status' }),
  }),
  notes: z.string().optional(),
  boundary: siteGeometrySchema.nullable().refine((value) => value !== null, {
    message: BOUNDARY_REQUIRED_MESSAGE,
  }),
})

export type SiteFormValues = z.infer<typeof siteSchema>
