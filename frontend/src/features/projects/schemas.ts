import { z } from 'zod'
import { PROJECT_STATUSES, PROJECT_TYPES } from '../../types/enums'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD')

export const projectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Project name is required')
      .max(200, 'Keep it under 200 characters'),
    description: z.string().trim().min(1, 'Description is required'),
    country: z.string().trim().min(1, 'Country is required'),
    region: z.string().trim().min(1, 'Region is required'),
    project_type: z.enum(PROJECT_TYPES as [string, ...string[]], {
      errorMap: () => ({ message: 'Select a project type' }),
    }),
    status: z.enum(PROJECT_STATUSES as [string, ...string[]], {
      errorMap: () => ({ message: 'Select a status' }),
    }),
    start_date: isoDate,
    end_date: z.union([isoDate, z.literal('')]).optional(),
    color: z
      .string()
      .regex(/^#([0-9a-fA-F]{6})$/, 'Pick a color or enter a valid hex code (#RRGGBB)'),
  })
  .refine(
    (data) => {
      if (!data.end_date) return true
      return data.end_date >= data.start_date
    },
    { message: 'End date must be on or after the start date', path: ['end_date'] },
  )

export type ProjectFormValues = z.infer<typeof projectSchema>
