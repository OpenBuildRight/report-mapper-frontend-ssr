import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, handleAuthError } from '@/lib/middleware/auth'
import { getImageRevision, getPublishedImageRevision } from '@/lib/services/images'
import { canReadObservation } from '@/lib/rbac'
import { getMinioClient, getBucketName } from '@/lib/minio'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/images/{id}/file
 * Get the actual image file (proxied from MinIO)
 * Query params:
 *  - revisionId: Optional revision ID (defaults to published revision)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const context = await getAuthContext(request)
    const { searchParams } = new URL(request.url)
    const revisionIdStr = searchParams.get('revisionId')

    let image

    if (revisionIdStr) {
      const revisionId = parseInt(revisionIdStr)
      image = await getImageRevision(id, revisionId)
    } else {
      image = await getPublishedImageRevision(id)
    }

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // Check read permission
    if (!canReadObservation(context.roles, image, context.userId)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
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
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error fetching image file:', error)
    return handleAuthError(error)
  }
}
