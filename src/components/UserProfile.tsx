'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState } from 'react'
import Button from './Button'
import {LoginIcon} from "@/components/icons/LoginIcon";

export default function UserProfile() {
  const { data: session, status } = useSession()
  const [showDetails, setShowDetails] = useState(false)

  if (status === 'loading') {
    return <Button variant="secondary" disabled>Loading...</Button>
  }

  const handleLogout = async () => {
    // Clear all local storage and session storage
    localStorage.clear()
    sessionStorage.clear()

    // Sign out and redirect to home
    await signOut({ callbackUrl: '/' })
  }

  if (!session) {
    return (
      <Button
        onClick={() => signIn('keycloak', { callbackUrl: window.location.href })}
        variant="primary"
        className="flex items-center gap-2"
      >
          <LoginIcon/> Login
      </Button>
    )
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setShowDetails(!showDetails)}
        variant="secondary"
      >
        {session.user?.name || 'User'}
      </Button>

      {showDetails && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-md shadow-lg z-50 border border-gray-200">
          <div className="p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Profile Information</h3>

            <div className="space-y-2 text-sm">
              {session.user?.name && (
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-600">Name:</span>
                  <span className="text-gray-800">{session.user.name}</span>
                </div>
              )}

              {session.user?.email && (
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-600">Email:</span>
                  <span className="text-gray-800">{session.user.email}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <Button
                onClick={handleLogout}
                variant="danger"
                className="w-full"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}