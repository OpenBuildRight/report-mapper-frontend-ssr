import { z } from '@hono/zod-openapi'
import { Role } from '@/types/rbac'


export const ErrorSchema = z.object({
  error: z.string(),
})

export const UploadImageResponseSchema = z.object({
  id: z.string().uuid(),
  revisionId: z.number().int(),
  imageKey: z.string(),
  published: z.boolean(),
  submitted: z.boolean(),
  message: z.string(),
})
