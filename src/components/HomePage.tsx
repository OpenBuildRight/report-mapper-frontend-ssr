'use client'

import dynamic from 'next/dynamic'
import { Observation } from '@/types/observation'

const ObservationMap = dynamic(() => import('@/components/ObservationMap'), { ssr: false })

interface HomePageProps {
  observations: Observation[]
}

export default function HomePage({ observations }: HomePageProps) {
  return (
    <div className="w-full" style={{ height: 'calc(100vh - 4rem)' }}>
      <ObservationMap observations={observations} />
    </div>
  )
}
