'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState } from 'react'

export default function UserProfile() {
  const { data: session } = useSession()
  const [showDetails, setShowDetails] = useState(false)

  const handleLogout = async () => {
    // Clear all local storage and session storage
    localStorage.clear()
    sessionStorage.clear()

    // Sign out and redirect to home
    await signOut({ callbackUrl: '/' })
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn('keycloak', { callbackUrl: window.location.href })}
        className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition text-white"
      >
        Login
      </button>
    )
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600 transition text-white"
        >
          {session.user?.email || session.user?.name || 'User'}
        </button>

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

                {session.user?.image && (
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-600">Avatar:</span>
                    <img src={session.user.image} alt="Profile" className="w-16 h-16 rounded-full mt-1" />
                  </div>
                )}

                {session.accessToken && (
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-600">Access Token:</span>
                    <span className="text-gray-800 text-xs break-all font-mono bg-gray-100 p-2 rounded">
                      {session.accessToken.substring(0, 50)}...
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 transition text-white"
      >
        Logout
      </button>
    </div>
  )
}