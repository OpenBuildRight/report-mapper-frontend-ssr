import { Suspense } from 'react'
import HomePage from '@/components/HomePage'
import ObservationsList from '@/components/ObservationsList'
import ObservationsListSkeleton from '@/components/ObservationsListSkeleton'

export default function Home() {
    return (
        <HomePage>
            <Suspense fallback={<ObservationsListSkeleton />}>
                <ObservationsList />
            </Suspense>
        </HomePage>
    )
}
