import { useToast } from '../../components/system/ToastContext'
import { NatureHealthScoreCard } from './NatureHealthScoreCard'
import { useRiskAssessment } from './useRiskAssessment'
import { getErrorMessage } from '../../utils/errors'

/** Self-contained Nature Health Score card for SiteDetailPage: fetches, recalculates, toasts. */
export function NatureHealthScoreSection({ siteId }: { siteId: string }) {
  const { data, isLoading, error, notFound, isRecalculating, recalculate } =
    useRiskAssessment(siteId)
  const { showToast } = useToast()

  const handleRecalculate = () => {
    recalculate()
      .then((assessment) => {
        showToast({
          variant: 'success',
          title: 'Nature Health Score recalculated',
          description: `New score: ${Math.round(assessment.nature_health_score)}/100.`,
        })
      })
      .catch((err: unknown) => {
        showToast({
          variant: 'error',
          title: 'Could not recalculate score',
          description: getErrorMessage(err),
        })
      })
  }

  return (
    <NatureHealthScoreCard
      assessment={data}
      isLoading={isLoading}
      error={error}
      notFound={notFound}
      isRecalculating={isRecalculating}
      onRecalculate={handleRecalculate}
    />
  )
}
