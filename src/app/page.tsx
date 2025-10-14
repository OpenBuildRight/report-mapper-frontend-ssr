import HomePage from '@/components/HomePage'
import {Observation} from '@/types/observation'
import {ObservationController} from '@/lib/actions/observations'
import {getAuthContext} from '@/lib/middleware/auth'
import {canEditEntity} from '@/lib/rbac-generic'
import {ImageController} from "@/lib/actions/images";
import {Image} from "@auth/core/providers/42-school";
import {ImageRevisionDocumentWithUrls} from "@/types/models";

async function getObservations(): Promise<Observation[]> {
    try {
        // Get auth context for permission-aware filtering
        const authContext = await getAuthContext()
        const observationController = new ObservationController()
        const imageController = new ImageController()

        // Fetch observations directly from controller (no HTTP call!)
        const observations = await observationController.searchObjects(
            undefined, // userId filter (undefined = all users)
            true,      // published only for non-privileged users (controller handles this)
            undefined  // no additional filter
        )

        // Transform to UI format
        return observations.map((obs) => ({
            id: obs.itemId,
            description: obs.description || '',
            location: obs.location ? {
                latitude: obs.location.coordinates[1],
                longitude: obs.location.coordinates[0]
            } : undefined,
            photos: obs.imageIds?.map((img, index) => {
                const image: ImageRevisionDocumentWithUrls = await imageController.getRevisionWithUrl(img.id, img.revisionId);

                return {
                    id: img.id,
                    url: image.presignedUrl,
                    description: image.description,
                    location: {
                        latitude: image.location?.coordinates[1],
                        longitude: image.location?.coordinates[0]
                    },
                }
            }) || [],
            createdAt: obs.createdAt?.toISOString() || new Date().toISOString(),
            createdBy: {
                id: obs.owner,
            },
            canEdit: canEditEntity(authContext.roles, obs, authContext.userId),
        }))
    } catch (error) {
        console.error('Error fetching observations:', error)
        return []
    }
}

export default async function Home() {
    const observations = await getObservations()

    return <HomePage observations={observations}/>
}
