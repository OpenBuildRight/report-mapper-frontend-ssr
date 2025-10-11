import { NextRequest, NextResponse } from 'next/server'
import { imageController } from '@/lib/actions/images'
import { uploadImage } from '@/lib/minio'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const description = formData.get('description') as string | null
    const latitude = formData.get('latitude') as string | null
    const longitude = formData.get('longitude') as string | null
    const metadataCreatedAt = formData.get('metadataCreatedAt') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Generate unique image key
    const imageKey = `${uuidv4()}-${file.name}`

    // Upload to MinIO
    await uploadImage(imageKey, buffer, {
      'Content-Type': file.type || 'image/jpeg'
    })

    // Create image record in database
    const location = latitude && longitude ? {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    } : undefined

    const image = await imageController.createObject({
      imageKey,
      description: description || undefined,
      location: location ? {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
      } : undefined,
      metadataCreatedAt: metadataCreatedAt ? new Date(metadataCreatedAt) : undefined
    })

    return NextResponse.json({
      id: image.itemId,
      revisionId: image.revisionId,
      imageKey: image.imageKey,
      url: `/api/images/${image.itemId}/file?revisionId=${image.revisionId}`
    })
  } catch (error: any) {
    console.error('Image upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    )
  }
}
