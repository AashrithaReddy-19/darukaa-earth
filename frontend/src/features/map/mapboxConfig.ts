/** Reads the Mapbox public token from env. Never hardcode a token — see .env.example. */
export function getMapboxToken(): string | undefined {
  const token = import.meta.env.VITE_MAPBOX_TOKEN
  return token && token.trim().length > 0 ? token : undefined
}

export const DEFAULT_MAP_STYLE = 'mapbox://styles/mapbox/light-v11'
export const DEFAULT_CENTER: [number, number] = [78.9629, 20.5937] // India, sensible default fallback
export const DEFAULT_ZOOM = 4
