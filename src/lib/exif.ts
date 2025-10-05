import ExifReader from 'exifreader'

export interface GPSCoordinates {
  latitude: number
  longitude: number
}

export async function extractGPSFromImage(file: File): Promise<GPSCoordinates | null> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const tags = await ExifReader.load(arrayBuffer)

    const latitude = tags.GPSLatitude?.description
    const longitude = tags.GPSLongitude?.description

    if (latitude && longitude) {
      return {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      }
    }

    return null
  } catch (error) {
    console.error('Error extracting GPS data:', error)
    return null
  }
}

export async function getUserLocation(): Promise<GPSCoordinates | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      },
      (error) => {
        console.error('Error getting user location:', error)
        resolve(null)
      }
    )
  })
}
