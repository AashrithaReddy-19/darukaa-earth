import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { getRiskAssessment, recalculateRiskAssessment } from '../../api/riskAssessments'
import type { RiskAssessment } from '../../types/riskAssessment'
import { getErrorMessage } from '../../utils/errors'

interface RiskAssessmentState {
  data: RiskAssessment | null
  isLoading: boolean
  error: string | null
  notFound: boolean
  isRecalculating: boolean
}

const INITIAL_STATE: RiskAssessmentState = {
  data: null,
  isLoading: true,
  error: null,
  notFound: false,
  isRecalculating: false,
}

/**
 * Fetches the latest Nature Health Score assessment for a site. A 404 means "not calculated
 * yet" per docs/FEATURE_CONTRACT_V2.md, so it is surfaced as `notFound` rather than `error`.
 */
export function useRiskAssessment(siteId: string | undefined) {
  const [state, setState] = useState<RiskAssessmentState>(INITIAL_STATE)

  const load = useCallback(() => {
    if (!siteId) return
    setState((current) => ({ ...current, isLoading: true, error: null, notFound: false }))
    getRiskAssessment(siteId)
      .then((data) =>
        setState({ data, isLoading: false, error: null, notFound: false, isRecalculating: false }),
      )
      .catch((error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setState({
            data: null,
            isLoading: false,
            error: null,
            notFound: true,
            isRecalculating: false,
          })
        } else {
          setState({
            data: null,
            isLoading: false,
            error: getErrorMessage(error),
            notFound: false,
            isRecalculating: false,
          })
        }
      })
  }, [siteId])

  useEffect(() => {
    load()
  }, [load])

  const recalculate = useCallback(async (): Promise<RiskAssessment> => {
    if (!siteId) throw new Error('Missing site id')
    setState((current) => ({ ...current, isRecalculating: true }))
    try {
      const data = await recalculateRiskAssessment(siteId)
      setState({ data, isLoading: false, error: null, notFound: false, isRecalculating: false })
      return data
    } catch (error) {
      setState((current) => ({ ...current, isRecalculating: false }))
      throw error
    }
  }, [siteId])

  return { ...state, refetch: load, recalculate }
}
