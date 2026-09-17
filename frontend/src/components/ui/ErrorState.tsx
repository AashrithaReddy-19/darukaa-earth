import { AlertCircle } from 'lucide-react'
import { Button } from './Button'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-xl border border-terracotta-200 bg-terracotta-50 px-6 py-10 text-center"
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-terracotta-100 text-terracotta-600">
        <AlertCircle className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-terracotta-800">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-terracotta-700">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4 border-terracotta-300 text-terracotta-700 hover:bg-terracotta-100"
          onClick={onRetry}
        >
          Try again
        </Button>
      )}
    </div>
  )
}
