import { useEffect, useState } from 'react'

/** Tracks whether a CSS media query currently matches, updating on viewport changes. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query)
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches)
    setMatches(mediaQueryList.matches)
    mediaQueryList.addEventListener('change', listener)
    return () => mediaQueryList.removeEventListener('change', listener)
  }, [query])

  return matches
}

export const BREAKPOINTS = {
  mobile: '(max-width: 767px)',
  tablet: '(max-width: 1023px)',
} as const
