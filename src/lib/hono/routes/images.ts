import { createRoute, z, OpenAPIHono } from '@hono/zod-openapi'
import { HTTPException } from 'hono/http-exception'
import { getAuthContext, requireAuth } from '@/lib/middleware/auth'
import {
  createImage,
  getImageRevisions,
  getImageRevision,
  getPublishedImageRevision,
} from '@/lib/services/images'
import { uploadImage, getMinioClient, getBucketName } from '@/lib/minio'
import { v4 as uuidv4 } from 'uuid'
import { canReadObservation } from '@/lib/rbac'
import * as schemas from '@/lib/hono/schemas'

export const imagesApp = new OpenAPIHono()

/**
 * POST /images
 * Upload an image
 */
const uploadImageRoute = createRoute({
  method: 'post',
  path: '/images',
  tags: ['Images'],
  summary: 'Upload an image',
  description: 'Upload an image file with optional metadata',
  responses: {
    201: {
      description: 'Image uploaded',
      content: {
        'application/json': {
          schema: schemas.UploadImageResponseSchema,
        },
      },
    },
  },
})

imagesApp.openapi(uploadImageRoute, async (c) => {
  const context = await requireAuth(c.req.raw as Request)
  const formData = await c.req.formData()

  const file = formData.get('file') as File
  if (!file) {
    throw new HTTPException(400, { message: 'No file provided' })
  }

  const description = formData.get('description') as string | null
  const latitude = formData.get('latitude') as string | null
  const longitude = formData.get('longitude') as string | null
  const metadataCreatedAt = formData.get('metadataCreatedAt') as string | null

  // Generate a unique key for the image
  const ext = file.name.split('.').pop()
  const imageKey = `images/${context.userId}/${uuidv4()}.${ext}`

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Upload to MinIO
  await uploadImage(imageKey, buffer, {
    'Content-Type': file.type || 'application/octet-stream',
  })

  const location = latitude && longitude ? {
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
  } : undefined

  const metadata = metadataCreatedAt ? {
    createdAt: new Date(metadataCreatedAt),
  } : undefined

  const image = await createImage({
    imageKey,
    description: description || undefined,
    location,
    metadata,
    owner: context.userId!,
    autoPublish: false,
  })

  return c.json({
    id: image.id,
    revisionId: image.revision_id,
    imageKey: image.image_key,
    published: image.published,
    submitted: image.submitted,
    message: 'Image uploaded',
  }, 201)
})

/**
 * GET /images/:id
 * Get all revisions for an image
 */
const getImageRevisionsRoute = createRoute({
  method: 'get',
  path: '/images/{id}',
  tags: ['Images'],
  summary: 'Get image revisions',
  description: 'Get all revisions for a specific image',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Image revisions',
      content: {
        'application/json': {
          schema: schemas.GetImageRevisionsResponseSchema,
        },
      },
    },
  },
})

imagesApp.openapi(getImageRevisionsRoute, async (c) => {
  const { id } = c.req.valid('param')
  const context = await getAuthContext(c.req.raw as Request)

  const revisions = await getImageRevisions(id)

  if (revisions.length === 0) {
    throw new HTTPException(404, { message: 'Image not found' })
  }

  // Filter revisions based on permissions
  const visibleRevisions = revisions.filter(rev =>
    canReadObservation(context.roles, rev, context.userId)
  )

  const formattedRevisions = visibleRevisions.map(rev => ({
    id: rev.id,
    revisionId: rev.revision_id,
    imageKey: rev.image_key,
    description: rev.description,
    location: rev.image_metadata_location ? {
      latitude: rev.image_metadata_location.coordinates[1],
      longitude: rev.image_metadata_location.coordinates[0],
    } : undefined,
    metadataCreatedAt: rev.image_metadata_created_at?.toISOString(),
    createdAt: rev.created_at.toISOString(),
    updatedAt: rev.updated_at.toISOString(),
    revisionCreatedAt: rev.revision_created_at.toISOString(),
    published: rev.published,
    submitted: rev.submitted,
    owner: rev.owner,
  }))

  return c.json({
    imageId: id,
    revisions: formattedRevisions,
    total: formattedRevisions.length,
  })
})

/**
 * GET /images/:id/file
 * Get the actual image file (proxied from MinIO)
 */
imagesApp.get('/images/:id/file', async (c) => {
  const id = c.req.param('id')
  const context = await getAuthContext(c.req.raw as Request)
  const { searchParams } = new URL(c.req.url)
  const revisionIdStr = searchParams.get('revisionId')

  let image

  if (revisionIdStr) {
    const revisionId = parseInt(revisionIdStr)
    image = await getImageRevision(id, revisionId)
  } else {
    image = await getPublishedImageRevision(id)
  }

  if (!image) {
    throw new HTTPException(404, { message: 'Image not found' })
  }

  // Check read permission
  if (!canReadObservation(context.roles, image, context.userId)) {
    throw new HTTPException(403, { message: 'Forbidden' })
  }

  // Get the file from MinIO
  const client = getMinioClient()
  const bucketName = getBucketName()

  // Stream the file from MinIO
  const dataStream = await client.getObject(bucketName, image.image_key)

  // Convert stream to buffer
  const chunks: Buffer[] = []
  for await (const chunk of dataStream) {
    chunks.push(chunk)
  }
  const buffer = Buffer.concat(chunks)

  // Determine content type from image_key extension
  const ext = image.image_key.split('.').pop()?.toLowerCase()
  const contentTypeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  }
  const contentType = contentTypeMap[ext || ''] || 'application/octet-stream'

  // Return the image file
  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
})
