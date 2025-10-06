'use client'

import { useState } from 'react'
import Link from 'next/link'
import UserProfile from './UserProfile'
import MenuIcon from './icons/MenuIcon'
import SlideOutMenu from './SlideOutMenu'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <nav className="bg-gray-800 text-white shadow-lg relative z-9999">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              {/* Hamburger Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md hover:bg-gray-700 transition"
                aria-label="Toggle menu"
              >
                <MenuIcon className="w-6 h-6" />
              </button>

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

      <SlideOutMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  )
}
