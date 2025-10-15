import { Suspense } from 'react'
import { ObservationController } from '@/lib/actions/observations'
import { getAuthContext } from '@/lib/middleware/auth'
import ObservationCard from './ObservationCard'
import ObservationCardSkeleton from './ObservationCardSkeleton'
import {ObservationRevisionDocument} from "@/types/models";

export default async function ObservationsList() {
    const authContext = await getAuthContext()
    const observationController = new ObservationController()

    const observations = await observationController.searchObjects(
        undefined, // userId filter (undefined = all users)
        true,      // published only for non-privileged users (controller handles this)
        undefined  // no additional filter
    )

    if (observations.length === 0) {
        return null
    }

    return (
        <>
            {observations.map((obs : ObservationRevisionDocument ) => (
                <Suspense key={obs.itemId} fallback={<ObservationCardSkeleton />}>
                    <ObservationCard
                        observationId={obs.itemId}
                        description={obs.description || ''}
                        location={obs.location ? {
                            latitude: obs.location.coordinates[1],
                            longitude: obs.location.coordinates[0]
                        } : undefined}
                        imageIds={obs.imageIds || []}
                        createdAt={obs.createdAt?.toISOString() || new Date().toISOString()}
                        owner={obs.owner}
                    />
                </Suspense>
            ))}
        </>
    )
}
