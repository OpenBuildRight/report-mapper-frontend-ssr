import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()

    const description = formData.get('description') as string
    const latitude = formData.get('latitude') as string
    const longitude = formData.get('longitude') as string

    // Extract photos and their metadata
    const photos: Array<{
      file: File
      description: string
      latitude?: number
      longitude?: number
    }> = []

    let photoIndex = 0
    while (formData.has(`photos[${photoIndex}]`)) {
      const file = formData.get(`photos[${photoIndex}]`) as File
      const photoDescription = formData.get(`photoDescriptions[${photoIndex}]`) as string
      const photoLatitude = formData.get(`photoLatitudes[${photoIndex}]`) as string | null
      const photoLongitude = formData.get(`photoLongitudes[${photoIndex}]`) as string | null

      photos.push({
        file,
        description: photoDescription || '',
        latitude: photoLatitude ? parseFloat(photoLatitude) : undefined,
        longitude: photoLongitude ? parseFloat(photoLongitude) : undefined
      })

      photoIndex++
    }

    // Create observation object
    const observation = {
      id: `obs-${Date.now()}`,
      userId: session.user?.email || session.user?.name,
      description,
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      },
      photos: photos.map((photo, index) => ({
        filename: photo.file.name,
        size: photo.file.size,
        description: photo.description,
        location: photo.latitude && photo.longitude
          ? { latitude: photo.latitude, longitude: photo.longitude }
          : undefined
      })),
      createdAt: new Date().toISOString()
    }

    // TODO: Store the observation in a database
    // TODO: Upload photos to cloud storage
    // For now, just log and return success

    console.log('Observation submitted:', {
      ...observation,
      photoCount: photos.length,
      totalSize: photos.reduce((sum, p) => sum + p.file.size, 0)
    })

    return NextResponse.json({
      success: true,
      id: observation.id,
      message: 'Observation submitted successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error submitting observation:', error)
    return NextResponse.json(
      { error: 'Failed to submit observation' },
      { status: 500 }
    )
  }
}
