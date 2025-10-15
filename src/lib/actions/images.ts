import { RevisionController } from './revision-controller'
import {
    ImageFields,
    ImageRevisionDocument,
    COLLECTIONS,
    ImageReference,
    ImageRevisionDocumentWithUrls
} from '@/types/models'
import {deleteImage, getImageUrl, getMinioClient} from "@/lib/minio";

/**
 * ImageController - extends RevisionController for image management
 */
export class ImageController extends RevisionController<ImageFields, ImageRevisionDocument> {
  constructor() {
    super(COLLECTIONS.IMAGE_REVISIONS)
  }

  async getRevisionWithUrl(
      itemId: string,
      revisionId: number,
  ) : Promise<ImageRevisionDocumentWithUrls> {
      let revision = await this.getRevision(itemId, revisionId)
      return {
          ...revision,
          presignedUrl: await getImageUrl(revision.imageKey)
      }
  }

  /**
   * Delete an image and its file from storage
   * Overrides parent to also delete from MinIO
   */
  async deleteObject(itemId: string): Promise<void> {
    // Get the image to find the imageKey for MinIO deletion
    const image = await this.getLatestRevision(itemId)

    // Delete from MinIO
    if (image.imageKey) {
      try {
        await deleteImage(image.imageKey)
        console.log('Deleted image from MinIO:', image.imageKey)
      } catch (error) {
        console.error('Failed to delete image from MinIO:', error)
        // Continue with database deletion even if MinIO fails
      }
    }

    // Call parent to delete all revisions from database
    await super.deleteObject(itemId)
  }

  /**
   * Get multiple images by their references
   */
  async getImagesByReferences(imageRefs: ImageReference[]): Promise<ImageRevisionDocument[]> {
    const images: ImageRevisionDocument[] = []

    for (const ref of imageRefs) {
      try {
        const image = await this.getRevision(ref.id, ref.revisionId)
        images.push(image)
      } catch (error) {
        console.error(`Failed to fetch image ${ref.id} revision ${ref.revisionId}:`, error)
        // Continue with other images even if one fails
      }
    }

    return images
  }

  /**
   * Get image URLs for references
   */
  getImageUrls(imageRefs: ImageReference[]): string[] {
    return imageRefs.map(ref =>
      `/api/images/${ref.id}/file?revisionId=${ref.revisionId}`
    )
  }
}
