import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { getImpactTimeline } from '../../api/impactTimeline'
import { getErrorMessage } from '../../utils/errors'
import { ImpactTimelineCard } from './ImpactTimelineCard'
import type { ImpactTimelineResponse } from '../../types/impactTimeline'

/**
 * Self-contained impact timeline card for SiteDetailPage. A 404 (not enough recorded analytics
 * yet to build a timeline) is treated as an empty state rather than a hard error.
 */
export function ImpactTimelineSection({ siteId }: { siteId: string }) {
  const [data, setData] = useState<ImpactTimelineResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setIsLoading(true)
    setError(null)
    getImpactTimeline(siteId)
      .then((response) => {
        setData(response)
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setData(null)
          setIsLoading(false)
        } else {
          setError(getErrorMessage(err))
          setIsLoading(false)
        }
      })
  }, [siteId])

  useEffect(() => {
    load()
  }, [load])

  return <ImpactTimelineCard timeline={data} isLoading={isLoading} error={error} onRetry={load} />
}
