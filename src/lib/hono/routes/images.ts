import {createRoute, z, OpenAPIHono} from '@hono/zod-openapi'
import {HTTPException} from 'hono/http-exception'
import {getAuthContext, requireAuth} from '@/lib/middleware/auth'
import {uploadImage, getMinioClient} from '@/lib/minio'
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
