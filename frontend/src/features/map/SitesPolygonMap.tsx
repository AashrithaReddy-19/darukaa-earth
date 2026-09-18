import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import { DEFAULT_CENTER, DEFAULT_MAP_STYLE, DEFAULT_ZOOM, getMapboxToken } from './mapboxConfig'
import { computeBounds } from './geo'
import { MapErrorNotice, MapTokenNotice } from './MapTokenNotice'
import { MapLegend } from './MapLegend'
import type { SiteGeometry } from '../../types/common'

export interface MapSiteInput {
  id: string
  boundary: SiteGeometry
  color: string
  popupHtml: string
}

/** A single point marker (e.g. a field observation with recorded coordinates). Additive/optional. */
export interface MapMarkerInput {
  id: string
  lng: number
  lat: number
  color?: string
  popupHtml?: string
}

interface SitesPolygonMapProps {
  sites: MapSiteInput[]
  legendTitle?: string
  legendItems?: { label: string; color: string }[]
  heightClassName?: string
  /** Optional point markers rendered on top of the boundary polygons (e.g. field observations). */
  markers?: MapMarkerInput[]
}

/**
 * Read-only Mapbox map that renders one or more site boundary polygons colour-coded by
 * caller-provided `color`, with click-to-popup and an automatic fitBounds on data changes.
 * Used by the dashboard overview map and the project-detail sites map.
 */
export function SitesPolygonMap({
  sites,
  legendTitle,
  legendItems,
  heightClassName = 'h-[420px]',
  markers,
}: SitesPolygonMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerInstancesRef = useRef<mapboxgl.Marker[]>([])
  const [error, setError] = useState<string | null>(null)
  const token = getMapboxToken()

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

    return () => {
      map?.remove()
      mapRef.current = null
    }
  }, [token])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !token) return

    const featureCollection: FeatureCollection<Polygon | MultiPolygon> = {
      type: 'FeatureCollection',
      features: sites.map((site): Feature<Polygon | MultiPolygon> => ({
        type: 'Feature',
        geometry: site.boundary,
        properties: { id: site.id, color: site.color, popupHtml: site.popupHtml },
      })),
    }

    const applyData = () => {
      const source = map.getSource('sites') as mapboxgl.GeoJSONSource | undefined
      if (source) {
        source.setData(featureCollection)
      } else {
        map.addSource('sites', { type: 'geojson', data: featureCollection })
        map.addLayer({
          id: 'sites-fill',
          type: 'fill',
          source: 'sites',
          paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.35 },
        })
        map.addLayer({
          id: 'sites-line',
          type: 'line',
          source: 'sites',
          paint: { 'line-color': ['get', 'color'], 'line-width': 2 },
        })

        map.on('click', 'sites-fill', (event) => {
          const feature = event.features?.[0]
          const properties = feature?.properties as { popupHtml?: string } | null | undefined
          if (!properties?.popupHtml) return
          new mapboxgl.Popup({ closeButton: true, maxWidth: '240px' })
            .setLngLat(event.lngLat)
            .setHTML(properties.popupHtml)
            .addTo(map)
        })
        map.on('mouseenter', 'sites-fill', () => {
          map.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', 'sites-fill', () => {
          map.getCanvas().style.cursor = ''
        })
      }

      const bounds = computeBounds(sites.map((site) => site.boundary))
      if (bounds) {
        map.fitBounds(bounds, { padding: 56, maxZoom: 14, duration: 0 })
      }
    }

    if (map.isStyleLoaded()) {
      applyData()
    } else {
      map.once('load', applyData)
    }
  }, [sites, token])

  // Optional point markers (e.g. field observations with recorded coordinates), rendered on top
  // of the boundary polygons above. Purely additive: when `markers` is omitted/empty this effect
  // is a no-op and existing polygon-only usages are unaffected.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !token) return
    if (typeof mapboxgl.Marker !== 'function') return

    const renderMarkers = () => {
      markerInstancesRef.current.forEach((marker) => marker.remove())
      markerInstancesRef.current = (markers ?? []).map((marker) => {
        const instance = new mapboxgl.Marker({ color: marker.color ?? '#b3402e' }).setLngLat([
          marker.lng,
          marker.lat,
        ])
        if (marker.popupHtml) {
          instance.setPopup(
            new mapboxgl.Popup({ closeButton: true, maxWidth: '220px' }).setHTML(marker.popupHtml),
          )
        }
        instance.addTo(map)
        return instance
      })
    }

    if (map.isStyleLoaded()) {
      renderMarkers()
    } else {
      map.once('load', renderMarkers)
    }

    return () => {
      markerInstancesRef.current.forEach((marker) => marker.remove())
      markerInstancesRef.current = []
    }
  }, [markers, token])

  if (!token) return <MapTokenNotice className={heightClassName} />
  if (error) return <MapErrorNotice message={error} className={heightClassName} />

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-charcoal-100 ${heightClassName}`}
    >
      <div ref={containerRef} className="h-full w-full" />
      {legendItems && legendTitle && legendItems.length > 0 && (
        <MapLegend title={legendTitle} items={legendItems} />
      )}
    </div>
  )
}
