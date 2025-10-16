"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { Permission } from "@/types/rbac";

import {hasPermission} from "@/lib/rbac/permissions";

interface SlideOutMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SlideOutMenu({ isOpen, onClose }: SlideOutMenuProps) {
  const { data: session } = useSession();

  const userRoles = (session?.user as any)?.roles || [];
  const canReview = hasPermission(userRoles, Permission.READ_ALL_OBSERVATIONS);

  useEffect(() => {
    // Prevent body scroll when menu is open
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={onClose} />

      {/* Slide-out Menu */}
      <div
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-gray-800 border-r border-gray-700 shadow-xl z-[9999] overflow-y-auto transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ul className="py-4">
          <li>
            <Link
              href="/"
              onClick={onClose}
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
                  onClick={onClose}
                  className="block px-6 py-3 hover:bg-gray-700 transition"
                >
                  Submit Observation
                </Link>
              </li>
              {canReview && (
                <li>
                  <Link
                    href="/review"
                    onClick={onClose}
                    className="block px-6 py-3 hover:bg-gray-700 transition"
                  >
                    Review Observations
                  </Link>
                </li>
              )}
            </>
          )}
          <li className="border-t border-gray-700 mt-2 pt-2">
            <Link
              href="/api/hono-ui"
              onClick={onClose}
              className="block px-6 py-3 hover:bg-gray-700 transition"
            >
              API Documentation
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}
