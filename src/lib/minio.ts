import { Client } from "minio";
import { config } from "@/config/runtime-config";

let minioClient: Client | null = null;
let bucketEnsured = false;

/**
 * Get MinIO client instance (singleton)
 */
export function getMinioClient(): Client {
  if (!minioClient) {
    const endpoint = config.minio.endpoint;
    const accessKey = config.minio.accessKey;
    const secretKey = config.minio.secretKey;
    const useSSL = config.minio.useSSL;

    // Parse endpoint into host and port
    const [endPoint, portStr] = endpoint.split(":");
    const port = portStr ? parseInt(portStr, 10) : useSSL ? 443 : 9000;

    minioClient = new Client({
      endPoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });
  }

  return minioClient;
}

/**
 * Ensure the bucket exists, create if it doesn't
 * Cached to avoid redundant checks on every operation
 */
export async function ensureBucket(): Promise<void> {
  if (bucketEnsured) {
    return;
  }

  const client = getMinioClient();
  const bucketName = config.minio.bucketName;

  const exists = await client.bucketExists(bucketName);

  if (!exists) {
    await client.makeBucket(bucketName, "us-east-1");
  }

  bucketEnsured = true;
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
    "Content-Type"?: string;
    [key: string]: string | undefined;
  },
): Promise<string> {
  const client = getMinioClient();
  const bucketName = config.minio.bucketName;

  await ensureBucket();

  await client.putObject(bucketName, imageKey, buffer, buffer.length, metadata);

  return imageKey;
}

/**
 * Get a presigned URL for an image (for private access)
 * @param imageKey - The object key/path in the bucket
 * @returns Presigned URL
 */
export async function getImageUrl(imageKey: string): Promise<string> {
  const expirySeconds = config.minio.imageExpirySeconds;
  const client = getMinioClient();
  const bucketName = config.minio.bucketName;
  return await client.presignedGetObject(bucketName, imageKey, expirySeconds);
}

/**
 * Delete an image from MinIO
 * @param imageKey - The object key/path in the bucket
 */
export async function deleteImage(imageKey: string): Promise<void> {
  const client = getMinioClient();
  const bucketName = config.minio.bucketName;

  await client.removeObject(bucketName, imageKey);
}

/**
 * Delete multiple images from MinIO
 * @param imageKeys - Array of object keys to delete
 */
export async function deleteImages(imageKeys: string[]): Promise<void> {
  const client = getMinioClient();
  const bucketName = config.minio.bucketName;

  await client.removeObjects(bucketName, imageKeys);
}
