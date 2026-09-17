import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { DEFAULT_CENTER, DEFAULT_MAP_STYLE, DEFAULT_ZOOM, getMapboxToken } from './mapboxConfig'
import { computeBounds } from './geo'
import { MapErrorNotice, MapTokenNotice } from './MapTokenNotice'
import type { SiteGeometry } from '../../types/common'

interface PolygonDrawMapProps {
  initialGeometry?: SiteGeometry | null
  onChange: (geometry: SiteGeometry | null) => void
  heightClassName?: string
}

/**
 * Draw-enabled Mapbox map used on the Add/Edit Site form. Restricts the drawing surface to a
 * single polygon/multipolygon at a time: drawing a new shape while one exists replaces it, and
 * vertices can be dragged to edit or the whole shape deleted via the trash control to redraw.
 */
export function PolygonDrawMap({
  initialGeometry,
  onChange,
  heightClassName = 'h-[420px]',
}: PolygonDrawMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const drawRef = useRef<MapboxDraw | null>(null)
  const [error, setError] = useState<string | null>(null)
  const token = getMapboxToken()
  const initialGeometryRef = useRef(initialGeometry ?? null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!token || !containerRef.current) return

    mapboxgl.accessToken = token
    let map: mapboxgl.Map | null = null
    try {
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: DEFAULT_MAP_STYLE,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
      })
    } catch {
      setError('Could not initialize the map. Check your Mapbox token.')
      return
    }

    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.on('error', () =>
      setError('The map failed to load. Check your Mapbox token and network connection.'),
    )

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
      defaultMode: 'simple_select',
    })
    drawRef.current = draw
    map.addControl(draw, 'top-left')

    const emitChange = () => {
      const data = draw.getAll()
      const feature = data.features[0]
      if (
        feature &&
        (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')
      ) {
        onChangeRef.current(feature.geometry as SiteGeometry)
      } else {
        onChangeRef.current(null)
      }
    }

    const enforceSinglePolygon = (event: { features: Array<{ id?: string | number }> }) => {
      const keepIds = new Set(event.features.map((feature) => feature.id))
      const staleIds = draw
        .getAll()
        .features.map((feature) => feature.id)
        .filter((id): id is string => typeof id === 'string' && !keepIds.has(id))
      if (staleIds.length > 0) {
        draw.delete(staleIds)
      }
      emitChange()
    }

    map.on('draw.create', enforceSinglePolygon)
    map.on('draw.update', emitChange)
    map.on('draw.delete', emitChange)

    map.on('load', () => {
      const initial = initialGeometryRef.current
      if (initial) {
        draw.add({ type: 'Feature', properties: {}, geometry: initial })
        const bounds = computeBounds([initial])
        if (bounds) map.fitBounds(bounds, { padding: 64, maxZoom: 15, duration: 0 })
      }
    })

    return () => {
      map?.remove()
      mapRef.current = null
      drawRef.current = null
    }
    // Map + draw control are only ever initialized once per token; live updates flow through refs.
  }, [token])

  if (!token) return <MapTokenNotice className={heightClassName} />
  if (error) return <MapErrorNotice message={error} className={heightClassName} />

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-charcoal-100 ${heightClassName}`}
    >
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[220px] rounded-lg border border-charcoal-200 bg-white/95 px-3 py-2 text-xs text-charcoal-600 shadow-card">
        Use the polygon tool to draw the site boundary. Drag vertices to edit, or use the trash icon
        to delete and redraw.
      </div>
    </div>
  )
}
