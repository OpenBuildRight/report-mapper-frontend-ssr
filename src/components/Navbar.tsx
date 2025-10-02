'use client'

import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold">
              Report Mapper
            </Link>
            <div className="flex space-x-4">
              <Link
                href="/"
                className="px-3 py-2 rounded-md hover:bg-gray-700 transition"
              >
                Home
              </Link>
              <Link
                href="/report-observation"
                className="px-3 py-2 rounded-md hover:bg-gray-700 transition"
              >
                Report Observation
              </Link>
            </div>
          </div>
          <div>
            {session ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm">Welcome, {session.user?.name || session.user?.email}</span>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 transition"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('keycloak')}
                className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition"
              >
                Sign In with Keycloak
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
