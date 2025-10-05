import ExifReader from 'exifreader'

export interface GPSCoordinates {
  latitude: number
  longitude: number
}

export async function extractGPSFromImage(file: File): Promise<GPSCoordinates | null> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const tags = await ExifReader.load(arrayBuffer)

    // Get the decimal values (ExifReader's description already converts DMS to decimal)
    const latitudeValue = tags.GPSLatitude?.description
    const longitudeValue = tags.GPSLongitude?.description
    const latitudeRefValue = tags.GPSLatitudeRef?.value
    const longitudeRefValue = tags.GPSLongitudeRef?.value
    const latitudeRef = Array.isArray(latitudeRefValue) ? latitudeRefValue[0] : latitudeRefValue
    const longitudeRef = Array.isArray(longitudeRefValue) ? longitudeRefValue[0] : longitudeRefValue

    if (latitudeValue && longitudeValue) {
      let latitude = parseFloat(latitudeValue)
      let longitude = parseFloat(longitudeValue)

      // Apply directional signs
      // South latitudes should be negative
      if (latitudeRef === 'S' && latitude > 0) {
        latitude = -latitude
      }
      // West longitudes should be negative
      if (longitudeRef === 'W' && longitude > 0) {
        longitude = -longitude
      }

      console.log('Extracted GPS:', { latitude, longitude, latitudeRef, longitudeRef })

      return {
        latitude,
        longitude
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
