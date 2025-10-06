import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, handleAuthError } from '@/lib/middleware/auth'
import { createImage } from '@/lib/services/images'
import { uploadImage } from '@/lib/minio'
import { v4 as uuidv4 } from 'uuid'

/**
 * POST /api/images
 * Upload an image
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
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

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to MinIO
    await uploadImage(imageKey, buffer, {
      'Content-Type': file.type || 'application/octet-stream',
    })

    console.log('Uploaded file to MinIO:', imageKey, 'Size:', file.size)

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
