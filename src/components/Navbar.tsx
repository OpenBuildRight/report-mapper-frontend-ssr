'use client'

import Link from 'next/link'
import UserProfile from './UserProfile'

export default function Navbar() {
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
                href="/observations/new"
                className="px-3 py-2 rounded-md hover:bg-gray-700 transition"
              >
                Submit Observation
              </Link>
              <Link
                href="/review"
                className="px-3 py-2 rounded-md hover:bg-gray-700 transition"
              >
                Review
              </Link>
            </div>
          </div>
          <div>
            <UserProfile />
          </div>
        </div>
      </div>
    </nav>
  )
}
