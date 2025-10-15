import { z } from "zod";

/**
 * Location schema - used across observations and images
 */
export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

/**
 * Image reference schema
 */
export const imageReferenceSchema = z.object({
  id: z.string().uuid(),
  revision_id: z.number().int().min(0),
});

/**
 * Create observation request
 */
export const createObservationSchema = z.object({
  description: z.string().min(1).max(10000).optional(),
  location: locationSchema.optional(),
  imageIds: z.array(imageReferenceSchema).optional(),
  submitted: z.boolean().optional(),
});

/**
 * Create observation revision request
 */
export const createObservationRevisionSchema = z.object({
  description: z.string().min(1).max(10000).optional(),
  location: locationSchema.optional(),
  imageIds: z.array(imageReferenceSchema).optional(),
});

/**
 * Update observation revision request
 */
export const updateObservationRevisionSchema = z.object({
  description: z.string().min(1).max(10000).optional(),
  location: locationSchema.optional(),
  imageIds: z.array(imageReferenceSchema).optional(),
});

/**
 * Publish/submit action request
 */
export const revisionActionSchema = z.object({
  action: z.enum(["publish", "submit"]),
});

/**
 * Create image revision request
 */
export const createImageRevisionSchema = z.object({
  description: z.string().min(1).max(1000).optional(),
  location: locationSchema.optional(),
});

/**
 * Update image revision request
 */
export const updateImageRevisionSchema = z.object({
  description: z.string().min(1).max(1000).optional(),
  location: locationSchema.optional(),
});

/**
 * Query parameter validation schemas
 */

export const observationFiltersSchema = z.object({
  owner: z.string().optional(),
  published: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  submitted: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  revisionId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
  latestOnly: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  lat: z
    .string()
    .transform((val) => parseFloat(val))
    .optional(),
  lng: z
    .string()
    .transform((val) => parseFloat(val))
    .optional(),
  maxDistance: z
    .string()
    .transform((val) => parseFloat(val))
    .optional(),
  minLat: z
    .string()
    .transform((val) => parseFloat(val))
    .optional(),
  maxLat: z
    .string()
    .transform((val) => parseFloat(val))
    .optional(),
  minLng: z
    .string()
    .transform((val) => parseFloat(val))
    .optional(),
  maxLng: z
    .string()
    .transform((val) => parseFloat(val))
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
  skip: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
  sortBy: z.enum(["created", "updated", "revisionCreated"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Export types for use in route handlers
export type CreateObservationInput = z.infer<typeof createObservationSchema>;
export type CreateObservationRevisionInput = z.infer<
  typeof createObservationRevisionSchema
>;
export type UpdateObservationRevisionInput = z.infer<
  typeof updateObservationRevisionSchema
>;
export type RevisionActionInput = z.infer<typeof revisionActionSchema>;
export type CreateImageRevisionInput = z.infer<
  typeof createImageRevisionSchema
>;
export type UpdateImageRevisionInput = z.infer<
  typeof updateImageRevisionSchema
>;
export type ObservationFilters = z.infer<typeof observationFiltersSchema>;
