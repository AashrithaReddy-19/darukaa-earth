import axios from 'axios'
import type { ApiErrorBody, ValidationErrorItem } from '../types/common'

function isValidationErrorList(detail: unknown): detail is ValidationErrorItem[] {
  return Array.isArray(detail)
}

/** Turns any error thrown by the axios client into a single human-readable message. */
export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (error.code === 'ERR_NETWORK' || !error.response) {
      return 'Cannot reach the server. Check your connection and try again.'
    }
    const detail = error.response.data?.detail
    if (typeof detail === 'string' && detail.trim().length > 0) {
      return detail
    }
    if (isValidationErrorList(detail) && detail.length > 0) {
      return detail
        .map((item) => {
          const field = item.loc[item.loc.length - 1]
          return field && typeof field === 'string'
            ? `${humanizeField(field)}: ${item.msg}`
            : item.msg
        })
        .join(' ')
    }
    if (error.response.status === 404) return 'Not found.'
    if (error.response.status === 401) return 'Your session has expired. Please log in again.'
    if (error.response.status >= 500)
      return 'The server ran into a problem. Please try again shortly.'
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

/** Maps pydantic 422 field errors to a `{ fieldName: message }` map for form-level display. */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError<ApiErrorBody>(error) || !error.response) return {}
  const detail = error.response.data?.detail
  if (!isValidationErrorList(detail)) return {}
  const fieldErrors: Record<string, string> = {}
  for (const item of detail) {
    const field = item.loc[item.loc.length - 1]
    if (typeof field === 'string') {
      fieldErrors[field] = item.msg
    }
  }
  return fieldErrors
}

function humanizeField(field: string): string {
  return field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
