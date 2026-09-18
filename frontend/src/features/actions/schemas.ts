import { z } from 'zod'
import { ACTION_CATEGORIES, ACTION_PRIORITIES } from '../../types/enumsV2'

export const createActionSchema = z.object({
  site_id: z.string().min(1, 'Select a site'),
  title: z.string().trim().min(1, 'Title is required').max(200, 'Keep it under 200 characters'),
  description: z.string().trim().min(1, 'Description is required'),
  action_category: z.enum(ACTION_CATEGORIES as [string, ...string[]], {
    errorMap: () => ({ message: 'Select a category' }),
  }),
  priority: z.enum(ACTION_PRIORITIES as [string, ...string[]], {
    errorMap: () => ({ message: 'Select a priority' }),
  }),
  due_date: z.string().optional(),
})

export type CreateActionFormValues = z.infer<typeof createActionSchema>
