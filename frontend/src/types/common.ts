// Shared response/error shapes used across resources.

export interface Paginated<T> {
  items: T[]
  total: number
}

/** FastAPI pydantic validation error item, returned inside a 422 `detail` array. */
export interface ValidationErrorItem {
  loc: (string | number)[]
  msg: string
  type: string
}

/** FastAPI default error body shape. `detail` is either a plain string or a list of field errors. */
export interface ApiErrorBody {
  detail: string | ValidationErrorItem[]
}

/** A GeoJSON geometry restricted to what sites use — Polygon or MultiPolygon in WGS84. */
export type SiteGeometry = GeoJSON.Polygon | GeoJSON.MultiPolygon
