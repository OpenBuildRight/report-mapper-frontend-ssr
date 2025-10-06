'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { hasPermission } from '@/lib/rbac'
import { Permission } from '@/types/rbac'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: session } = useSession()

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  // Check if user can access review page
  const userRoles = (session?.user as any)?.roles || []
  const canReview = hasPermission(userRoles, Permission.READ_ALL_OBSERVATIONS)

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 left-4 z-[1000] p-2 bg-gray-800 text-gray-100 rounded-lg border border-gray-700 hover:bg-gray-700 transition shadow-lg"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[999]"
          onClick={closeMenu}
        />
      )}

      {/* Slide-out Menu */}
      <nav
        className={`fixed top-0 left-0 h-full w-64 bg-gray-800 border-r border-gray-700 z-[999] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full p-6">
          <div className="mb-8 mt-12">
            <h2 className="text-xl font-bold text-gray-100">Report Mapper</h2>
            {session?.user && (
              <p className="text-sm text-gray-400 mt-1">
                {session.user.email || session.user.name}
              </p>
            )}
          </div>

          <ul className="flex-1 space-y-2">
            <li>
              <Link
                href="/"
                onClick={closeMenu}
                className="block px-4 py-2 text-gray-100 hover:bg-gray-700 rounded-lg transition"
              >
                Home
              </Link>
            </li>
            {session?.user && (
              <>
                <li>
                  <Link
                    href="/observations/new"
                    onClick={closeMenu}
                    className="block px-4 py-2 text-gray-100 hover:bg-gray-700 rounded-lg transition"
                  >
                    Submit Observation
                  </Link>
                </li>
                {canReview && (
                  <li>
                    <Link
                      href="/review"
                      onClick={closeMenu}
                      className="block px-4 py-2 text-gray-100 hover:bg-gray-700 rounded-lg transition"
                    >
                      Review Observations
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>

          <div className="border-t border-gray-700 pt-4">
            {session?.user ? (
              <button
                onClick={() => {
                  closeMenu()
                  signOut()
                }}
                className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 rounded-lg transition"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/api/auth/signin"
                onClick={closeMenu}
                className="block px-4 py-2 text-gray-100 hover:bg-gray-700 rounded-lg transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}
