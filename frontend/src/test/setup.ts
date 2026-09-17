import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// mapbox-gl and mapbox-gl-draw both require a real WebGL context, which jsdom does not provide.
// Every test run gets a lightweight stub so map-containing components can mount without crashing;
// individual test files can still `vi.mock` these modules themselves for finer control.
vi.mock('mapbox-gl', () => {
  class FakeMap {
    on = vi.fn()
    off = vi.fn()
    once = vi.fn()
    addControl = vi.fn()
    removeControl = vi.fn()
    addSource = vi.fn()
    getSource = vi.fn(() => undefined)
    addLayer = vi.fn()
    getLayer = vi.fn(() => undefined)
    fitBounds = vi.fn()
    remove = vi.fn()
    isStyleLoaded = vi.fn(() => true)
    getCanvas = vi.fn(() => ({ style: {} }))
  }
  class FakeNavigationControl {}
  class FakePopup {
    setLngLat = vi.fn().mockReturnThis()
    setHTML = vi.fn().mockReturnThis()
    addTo = vi.fn().mockReturnThis()
  }
  return {
    default: {
      Map: FakeMap,
      NavigationControl: FakeNavigationControl,
      Popup: FakePopup,
      accessToken: '',
    },
  }
})

vi.mock('@mapbox/mapbox-gl-draw', () => {
  class FakeMapboxDraw {
    getAll = vi.fn(() => ({ type: 'FeatureCollection', features: [] }))
    add = vi.fn()
    delete = vi.fn()
    deleteAll = vi.fn()
  }
  return { default: FakeMapboxDraw }
})
