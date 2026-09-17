import { useCallback, useEffect, useRef, useState } from 'react'
import { getErrorMessage } from '../utils/errors'

interface UseAsyncState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
}

interface UseAsyncResult<T> extends UseAsyncState<T> {
  refetch: () => void
}

/**
 * Runs an async fetcher on mount and whenever `deps` change, exposing loading/error/data state
 * plus a manual `refetch` — the shared pattern behind every "loading / error+retry / data" section
 * in this app (dashboard cards, project lists, analytics charts, etc).
 */
export function useAsync<T>(fetcher: () => Promise<T>, deps: unknown[] = []): UseAsyncResult<T> {
  const [state, setState] = useState<UseAsyncState<T>>({ data: null, isLoading: true, error: null })
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const [reloadToken, setReloadToken] = useState(0)

  const refetch = useCallback(() => setReloadToken((token) => token + 1), [])

  useEffect(() => {
    let cancelled = false
    setState((current) => ({ ...current, isLoading: true, error: null }))

    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ data, isLoading: false, error: null })
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ data: null, isLoading: false, error: getErrorMessage(error) })
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadToken])

  return { ...state, refetch }
}
