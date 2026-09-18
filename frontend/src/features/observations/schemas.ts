import { z } from 'zod'
import { OBSERVATION_TYPES } from '../../types/enumsV2'

function isValidOptionalNumber(min: number, max: number) {
  return (value: string | undefined) => {
    if (!value) return true
    const parsed = Number(value)
    return !Number.isNaN(parsed) && parsed >= min && parsed <= max
  }
}

export const observationSchema = z.object({
  observer_name: z
    .string()
    .trim()
    .min(1, 'Observer name is required')
    .max(200, 'Keep it under 200 characters'),
  observation_type: z.enum(OBSERVATION_TYPES as [string, ...string[]], {
    errorMap: () => ({ message: 'Select an observation type' }),
  }),
  notes: z.string().trim().min(1, 'Notes are required'),
  latitude: z
    .string()
    .optional()
    .refine(isValidOptionalNumber(-90, 90), 'Latitude must be between -90 and 90'),
  longitude: z
    .string()
    .optional()
    .refine(isValidOptionalNumber(-180, 180), 'Longitude must be between -180 and 180'),
  observation_date: z.string().min(1, 'Observation date is required'),
})

export type ObservationFormValues = z.infer<typeof observationSchema>
