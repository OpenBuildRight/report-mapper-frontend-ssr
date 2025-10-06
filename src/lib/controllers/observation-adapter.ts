import type { RevisionService } from './revision-controller'
import type { ObservationRevisionDocument } from '@/types/models'
import {
  getObservationRevision,
  getObservationRevisions,
  updateObservationRevision,
  deleteObservationRevision,
  publishObservationRevision,
  submitObservationForReview,
} from '@/lib/services/observations'

/**
 * Adapter that wraps observation service functions to match the generic RevisionService interface
 */
export const observationRevisionService: RevisionService<ObservationRevisionDocument> = {
  async getRevision(id: string, revisionId: number) {
    return await getObservationRevision(id, revisionId)
  },

  async getRevisions(id: string) {
    return await getObservationRevisions(id)
  },

  async updateRevision(id: string, revisionId: number, input: any) {
    await updateObservationRevision(id, revisionId, input)
  },

  async deleteRevision(id: string, revisionId: number) {
    await deleteObservationRevision(id, revisionId)
  },

  async publishRevision(id: string, revisionId: number) {
    await publishObservationRevision(id, revisionId)
  },

  async submitRevision(id: string, revisionId: number) {
    await submitObservationForReview(id, revisionId)
  },
}
