import type { SiteGeometry } from '../../types/common'

export type LngLatBoundsTuple = [[number, number], [number, number]]

function collectPositions(geometry: SiteGeometry, into: [number, number][]): void {
  if (geometry.type === 'Polygon') {
    for (const ring of geometry.coordinates) {
      for (const position of ring) {
        into.push([position[0], position[1]])
      }
    }
  } else if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates) {
      for (const ring of polygon) {
        for (const position of ring) {
          into.push([position[0], position[1]])
        }
      }
    }
  }
}

/** Computes a [[minLng, minLat], [maxLng, maxLat]] bounding box across one or more geometries. */
export function computeBounds(geometries: SiteGeometry[]): LngLatBoundsTuple | null {
  const positions: [number, number][] = []
  for (const geometry of geometries) {
    collectPositions(geometry, positions)
  }
  if (positions.length === 0) return null

  let minLng = Infinity
  let minLat = Infinity
  let maxLng = -Infinity
  let maxLat = -Infinity

  for (const [lng, lat] of positions) {
    if (lng < minLng) minLng = lng
    if (lat < minLat) minLat = lat
    if (lng > maxLng) maxLng = lng
    if (lat > maxLat) maxLat = lat
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ]
}

/** Rough polygon centroid (average of vertices) — good enough for placing a popup anchor. */
export function computeCentroid(geometry: SiteGeometry): [number, number] | null {
  const positions: [number, number][] = []
  collectPositions(geometry, positions)
  if (positions.length === 0) return null
  const sum = positions.reduce((acc, [lng, lat]) => [acc[0] + lng, acc[1] + lat], [0, 0])
  return [sum[0] / positions.length, sum[1] / positions.length]
}
