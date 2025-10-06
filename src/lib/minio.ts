import { Client } from 'minio'

let minioClient: Client | null = null

/**
 * Get MinIO client instance (singleton)
 */
export function getMinioClient(): Client {
  if (!minioClient) {
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost:9000'
    const accessKey = process.env.MINIO_ACCESS_KEY || 'minio_root_user'
    const secretKey = process.env.MINIO_SECRET_KEY || 'minio_root_password'
    const useSSL = process.env.MINIO_USE_SSL === 'true'

    // Parse endpoint into host and port
    const [endPoint, portStr] = endpoint.split(':')
    const port = portStr ? parseInt(portStr, 10) : (useSSL ? 443 : 9000)

    minioClient = new Client({
      endPoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    })
  }

  return minioClient
}

/**
 * Get the bucket name from environment
 */
export function getBucketName(): string {
  return process.env.MINIO_BUCKET || 'report-mapper-images'
}

/**
 * Ensure the bucket exists, create if it doesn't
 */
export async function ensureBucket(): Promise<void> {
  const client = getMinioClient()
  const bucketName = getBucketName()

  const exists = await client.bucketExists(bucketName)

  if (!exists) {
    await client.makeBucket(bucketName, 'us-east-1')
    console.log(`Created MinIO bucket: ${bucketName}`)

    // Set bucket policy to allow public read access (for development)
    // In production, you might want more restrictive policies
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
      ],
    }

    await client.setBucketPolicy(bucketName, JSON.stringify(policy))
    console.log(`Set public read policy for bucket: ${bucketName}`)
  }
}

/**
 * Upload a file to MinIO
 * @param imageKey - The object key/path in the bucket
 * @param buffer - The file data as a Buffer
 * @param metadata - Optional metadata (content-type, etc.)
 * @returns The object key
 */
export async function uploadImage(
  imageKey: string,
  buffer: Buffer,
  metadata?: {
    'Content-Type'?: string
    [key: string]: string | undefined
  }
): Promise<string> {
  const client = getMinioClient()
  const bucketName = getBucketName()

  await ensureBucket()

  await client.putObject(bucketName, imageKey, buffer, buffer.length, metadata)

  return imageKey
}

/**
 * Get a presigned URL for an image (for private access)
 * @param imageKey - The object key/path in the bucket
 * @param expirySeconds - How long the URL should be valid (default 7 days)
 * @returns Presigned URL
 */
export async function getImageUrl(
  imageKey: string,
  expirySeconds: number = 7 * 24 * 60 * 60
): Promise<string> {
  const client = getMinioClient()
  const bucketName = getBucketName()

  return await client.presignedGetObject(bucketName, imageKey, expirySeconds)
}

/**
 * Get the public URL for an image (if bucket has public read policy)
 * @param imageKey - The object key/path in the bucket
 * @returns Public URL
 */
export function getPublicImageUrl(imageKey: string): string {
  const endpoint = process.env.MINIO_ENDPOINT || 'localhost:9000'
  const bucketName = getBucketName()
  const useSSL = process.env.MINIO_USE_SSL === 'true'
  const protocol = useSSL ? 'https' : 'http'

  return `${protocol}://${endpoint}/${bucketName}/${imageKey}`
}

/**
 * Delete an image from MinIO
 * @param imageKey - The object key/path in the bucket
 */
export async function deleteImage(imageKey: string): Promise<void> {
  const client = getMinioClient()
  const bucketName = getBucketName()

  await client.removeObject(bucketName, imageKey)
}

/**
 * Delete multiple images from MinIO
 * @param imageKeys - Array of object keys to delete
 */
export async function deleteImages(imageKeys: string[]): Promise<void> {
  const client = getMinioClient()
  const bucketName = getBucketName()

  await client.removeObjects(bucketName, imageKeys)
}
