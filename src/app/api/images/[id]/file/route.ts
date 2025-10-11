import { NextRequest, NextResponse } from 'next/server'
import { imageController } from '@/lib/actions/images'
import { getMinioClient, getBucketName } from '@/lib/minio'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const revisionIdStr = searchParams.get('revisionId')
    const revisionId = revisionIdStr ? parseInt(revisionIdStr) : undefined

    // Get image from database
    let image
    if (revisionId !== undefined) {
      image = await imageController.getRevision(id, revisionId)
    } else {
      image = await imageController.getLatestRevision(id)
    }

    if (!image) {
      return new NextResponse('Image not found', { status: 404 })
    }

    // Get file from MinIO
    const client = getMinioClient()
    const bucketName = getBucketName()

    const stream = await client.getObject(bucketName, image.imageKey)

    // Convert stream to buffer
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    // Get object stat for content type
    const stat = await client.statObject(bucketName, image.imageKey)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': stat.metaData['content-type'] || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': buffer.length.toString()
      }
    })
  } catch (error: any) {
    console.error('Error fetching image:', error)

    if (error.name === 'NotFoundError' || error.code === 'NotFound') {
      return new NextResponse('Image not found', { status: 404 })
    }

    if (error.name === 'NotAuthorizedError') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    return new NextResponse('Internal server error', { status: 500 })
  }
}
