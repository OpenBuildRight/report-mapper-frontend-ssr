import type { RevisionService } from './revision-controller'
import type { ImageRevisionDocument } from '@/types/models'
import {
  getImageRevision,
  getImageRevisions,
  updateImageRevision,
  deleteImageRevision,
  publishImageRevision,
  submitImageForReview,
} from '@/lib/services/images'

/**
 * Adapter that wraps image service functions to match the generic RevisionService interface
 */
export const imageRevisionService: RevisionService<ImageRevisionDocument> = {
  async getRevision(id: string, revisionId: number) {
    return await getImageRevision(id, revisionId)
  },

  async getRevisions(id: string) {
    return await getImageRevisions(id)
  },

  async updateRevision(id: string, revisionId: number, input: any) {
    await updateImageRevision(id, revisionId, input)
  },

  async deleteRevision(id: string, revisionId: number) {
    await deleteImageRevision(id, revisionId)
  },

  async publishRevision(id: string, revisionId: number) {
    await publishImageRevision(id, revisionId)
  },

  async submitRevision(id: string, revisionId: number) {
    await submitImageForReview(id, revisionId)
  },
}
