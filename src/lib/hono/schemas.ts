import { z } from '@hono/zod-openapi'
import { Role } from '@/types/rbac'

/**
 * Shared schemas for API validation and OpenAPI generation
 */

export const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

export const ImageReferenceSchema = z.object({
  id: z.string().uuid(),
  revision_id: z.number().int().min(0),
})

export const CreateObservationRequestSchema = z.object({
  description: z.string().min(1).max(10000).optional(),
  location: LocationSchema.optional(),
  imageIds: z.array(ImageReferenceSchema).optional(),
  submitted: z.boolean().optional(),
})

export const UpdateObservationRequestSchema = z.object({
  revisionId: z.number().int().min(0),
  description: z.string().min(1).max(10000).optional(),
  location: LocationSchema.optional(),
  imageIds: z.array(ImageReferenceSchema).optional(),
})

export const PublishObservationRequestSchema = z.object({
  revisionId: z.number().int().min(0),
})

export const ObservationSchema = z.object({
  id: z.string().uuid(),
  revisionId: z.number().int(),
  description: z.string().optional(),
  location: LocationSchema.optional(),
  imageIds: z.array(ImageReferenceSchema),
  imageUrls: z.array(z.string()).optional(),
  createdAt: z.string(),
  revisionCreatedAt: z.string(),
  updatedAt: z.string(),
  published: z.boolean(),
  submitted: z.boolean(),
  owner: z.string(),
  canEdit: z.boolean(),
  canDelete: z.boolean(),
  canPublish: z.boolean(),
})

export const CreateObservationResponseSchema = z.object({
  id: z.string().uuid(),
  revisionId: z.number().int(),
  published: z.boolean(),
  submitted: z.boolean(),
  message: z.string(),
})

export const GetObservationsResponseSchema = z.object({
  observations: z.array(ObservationSchema),
  total: z.number().int(),
  count: z.number().int(),
})

export const GetObservationRevisionsResponseSchema = z.object({
  observationId: z.string().uuid(),
  revisions: z.array(ObservationSchema),
  total: z.number().int(),
})

export const UpdateObservationResponseSchema = z.object({
  id: z.string().uuid(),
  revisionId: z.number().int(),
  message: z.string(),
})

export const DeleteObservationResponseSchema = z.object({
  message: z.string(),
  id: z.string().uuid(),
})

export const PublishObservationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  id: z.string().uuid(),
  revisionId: z.number().int(),
})

export const ErrorSchema = z.object({
  error: z.string(),
})

// Image schemas
export const ImageSchema = z.object({
  id: z.string().uuid(),
  revisionId: z.number().int(),
  imageKey: z.string(),
  description: z.string().optional(),
  location: LocationSchema.optional(),
  metadataCreatedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  revisionCreatedAt: z.string(),
  published: z.boolean(),
  submitted: z.boolean(),
  owner: z.string(),
})

export const UploadImageResponseSchema = z.object({
  id: z.string().uuid(),
  revisionId: z.number().int(),
  imageKey: z.string(),
  published: z.boolean(),
  submitted: z.boolean(),
  message: z.string(),
})

export const GetImageRevisionsResponseSchema = z.object({
  imageId: z.string().uuid(),
  revisions: z.array(ImageSchema),
  total: z.number().int(),
})

// Admin schemas
export const RoleSchema = z.nativeEnum(Role)

export const AssignRoleRequestSchema = z.object({
  role: RoleSchema,
})

export const RemoveRoleRequestSchema = z.object({
  role: RoleSchema,
})

export const GetUserRolesResponseSchema = z.object({
  roles: z.array(RoleSchema),
})

export const RoleOperationResponseSchema = z.object({
  success: z.boolean(),
})
