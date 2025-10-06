'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { hasPermission } from '@/lib/rbac'
import { Permission } from '@/types/rbac'
import UserProfile from './UserProfile'
import MenuIcon from './icons/MenuIcon'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { data: session } = useSession()

  const userRoles = (session?.user as any)?.roles || []
  const canReview = hasPermission(userRoles, Permission.READ_ALL_OBSERVATIONS)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  return (
    <nav className="bg-gray-800 text-white shadow-lg relative z-9999">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            {/* Hamburger Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md hover:bg-gray-700 transition"
                aria-label="Toggle menu"
              >
                <MenuIcon className="w-6 h-6" />
              </button>

              {isMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 bg-black/50 z-[9998]"
                    onClick={() => setIsMenuOpen(false)}
                  />

                  {/* Slide-out Menu */}
                  <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-gray-800 border-r border-gray-700 shadow-xl z-[9999] overflow-y-auto">
                    <ul className="py-4">
                      <li>
                        <Link
                          href="/"
                          onClick={() => setIsMenuOpen(false)}
                          className="block px-6 py-3 hover:bg-gray-700 transition"
                        >
                          Home
                        </Link>
                      </li>
                      {session?.user && (
                        <>
                          <li>
                            <Link
                              href="/observations/new"
                              onClick={() => setIsMenuOpen(false)}
                              className="block px-6 py-3 hover:bg-gray-700 transition"
                            >
                              Submit Observation
                            </Link>
                          </li>
                          {canReview && (
                            <li>
                              <Link
                                href="/review"
                                onClick={() => setIsMenuOpen(false)}
                                className="block px-6 py-3 hover:bg-gray-700 transition"
                              >
                                Review Observations
                              </Link>
                            </li>
                          )}
                        </>
                      )}
                    </ul>
                  </div>
                </>
              )}
            </div>

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
          <div className="relative z-9999">
            <UserProfile />
          </div>
        </div>
      </div>
    </nav>
  )
}
