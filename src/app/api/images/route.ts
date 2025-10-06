import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, handleAuthError } from '@/lib/middleware/auth'
import { createImage } from '@/lib/services/images'
import { v4 as uuidv4 } from 'uuid'

/**
 * POST /api/images
 * Upload an image
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth()
    const formData = await request.formData()

    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const description = formData.get('description') as string | null
    const latitude = formData.get('latitude') as string | null
    const longitude = formData.get('longitude') as string | null
    const metadataCreatedAt = formData.get('metadataCreatedAt') as string | null

    // Generate a unique key for the image
    const ext = file.name.split('.').pop()
    const imageKey = `images/${context.userId}/${uuidv4()}.${ext}`

    // TODO: Upload to MinIO/S3
    // For now, we'll just store the key and simulate upload
    console.log('Would upload file to:', imageKey, 'Size:', file.size)

    // In production, you would:
    // 1. Upload to MinIO using AWS S3 SDK
    // 2. Get the object key/URL
    // 3. Store that in the database

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

    return NextResponse.json({
      id: image.id,
      revisionId: image.revision_id,
      imageKey: image.image_key,
      published: image.published,
      submitted: image.submitted,
      message: 'Image uploaded',
    }, { status: 201 })
  } catch (error) {
    return handleAuthError(error)
  }
}
