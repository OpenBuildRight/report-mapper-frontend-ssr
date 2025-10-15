'use client'

import dynamic from 'next/dynamic'
import { Observation } from '@/types/observation'
import { useEffect, useState, type ReactNode } from 'react'

const ObservationMap = dynamic(() => import('@/components/ObservationMap'), { ssr: false })

interface HomePageProps {
  children: ReactNode
}

export default function HomePage({ children }: HomePageProps) {
  const [observations, setObservations] = useState<Observation[]>([])

  useEffect(() => {
    // Collect all observation data from JSON script tags
    const scripts = document.querySelectorAll('script[type="application/json"][data-observation-id]')
    const loadedObservations: Observation[] = []

    scripts.forEach((script) => {
      try {
        const data = JSON.parse(script.textContent || '')
        loadedObservations.push(data)
      } catch (error) {
        console.error('Error parsing observation data:', error)
      }
    })

    setObservations(loadedObservations)

    // Use MutationObserver to detect when new observations are streamed in
    const observer = new MutationObserver(() => {
      const updatedScripts = document.querySelectorAll('script[type="application/json"][data-observation-id]')
      const updatedObservations: Observation[] = []

      updatedScripts.forEach((script) => {
        try {
          const data = JSON.parse(script.textContent || '')
          updatedObservations.push(data)
        } catch (error) {
          console.error('Error parsing observation data:', error)
        }
      })

      setObservations(updatedObservations)
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="w-full" style={{ height: 'calc(100vh - 4rem)' }}>
      {children}
      <ObservationMap observations={observations} />
    </div>
  )
}
