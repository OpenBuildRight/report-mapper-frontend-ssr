import {createRoute, z, OpenAPIHono} from '@hono/zod-openapi'
import {HTTPException} from 'hono/http-exception'
import {getAuthContext, requireAuth} from '@/lib/middleware/auth'
import {uploadImage, getMinioClient, getBucketName} from '@/lib/minio'
import {v4 as uuidv4} from 'uuid'
import {canReadObservation} from '@/lib/rbac'
import * as schemas from '@/lib/hono/schemas'
import {ImageController} from '@/lib/actions/images'
import {ImageFields} from "@/types/models";

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
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: z.object({
                        file: z.instanceof(File).refine(
                            (file) => file.size > 0,
                            { message: 'File is required' }
                        ),
                        description: z.string().optional(),
                        latitude: z.string().regex(/^-?\d+\.?\d*$/).transform(Number).optional(),
                        longitude: z.string().regex(/^-?\d+\.?\d*$/).transform(Number).optional(),
                        metadataCreatedAt: z.string().datetime().transform((val) => new Date(val)).optional(),
                    }),
                },
            },
        },
    },
    responses: {
        201: {
            description: 'Image uploaded',
            content: {
                'application/json': {
                    schema: schemas.UploadImageResponseSchema,
                },
            },
        },
        400: {
            description: 'Bad request',
            content: {
                'application/json': {
                    schema: schemas.ErrorSchema,
                },
            },
        },
    },
})

imagesApp.openapi(uploadImageRoute, async (c) => {
    const context = await requireAuth(c.req.raw as Request)
    const { file, description, latitude, longitude, metadataCreatedAt } = c.req.valid('form')

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

    // Build image fields
    const imageFields: ImageFields = {
        imageKey,
        description,
        metadataCreatedAt,
        location: longitude !== undefined && latitude !== undefined
            ? { type: 'Point', coordinates: [longitude, latitude] }
            : undefined
    }

    const imageController = new ImageController()
    const image = await imageController.createObject(imageFields)

    return c.json({
        id: image.itemId,
        revisionId: image.revisionId,
        imageKey: image.imageKey,
        published: image.published,
        submitted: image.submitted,
        message: 'Image uploaded',
    }, 201)
})

/**
 * GET /images/:id/file
 * Get the actual image file (proxied from MinIO)
 */
const getImageFileRoute = createRoute({
    method: 'get',
    path: '/images/{id}/file',
    tags: ['Images'],
    summary: 'Get image file',
    description: 'Get the actual image file from storage',
    request: {
        params: z.object({
            id: z.string().uuid(),
        }),
        query: z.object({
            revisionId: z.string().regex(/^\d+$/).transform(Number).optional(),
        }),
    },
    responses: {
        200: {
            description: 'Image file',
            content: {
                'image/jpeg': {
                    schema: z.any(),
                },
                'image/png': {
                    schema: z.any(),
                },
                'image/gif': {
                    schema: z.any(),
                },
                'image/webp': {
                    schema: z.any(),
                },
                'image/svg+xml': {
                    schema: z.any(),
                },
                'application/octet-stream': {
                    schema: z.any(),
                },
            },
        },
        404: {
            description: 'Image not found',
            content: {
                'application/json': {
                    schema: schemas.ErrorSchema,
                },
            },
        },
        403: {
            description: 'Forbidden',
            content: {
                'application/json': {
                    schema: schemas.ErrorSchema,
                },
            },
        },
    },
})

imagesApp.openapi(getImageFileRoute, async (c) => {
    const {id} = c.req.valid('param')
    const {revisionId} = c.req.valid('query')
    const context = await getAuthContext(c.req.raw as Request)

    const imageController = new ImageController()
    let image

    if (revisionId !== undefined) {
        image = await imageController.getRevision(id, revisionId)
    } else {
        image = await imageController.getLatestRevision(id)
    }

    if (!image) {
        throw new HTTPException(404, {message: 'Image not found'})
    }

    // Check read permission
    if (!canReadObservation(context.roles, image, context.userId)) {
        throw new HTTPException(403, {message: 'Forbidden'})
    }

    // Get the file from MinIO
    const client = getMinioClient()
    const bucketName = getBucketName()

    // Stream the file from MinIO
    const dataStream = await client.getObject(bucketName, image.imageKey)

    // Convert stream to buffer
    const chunks: Buffer[] = []
    for await (const chunk of dataStream) {
        chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    // Determine content type from image_key extension
    const ext = image.imageKey.split('.').pop()?.toLowerCase()
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
