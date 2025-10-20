"use client";

import { authClient } from "@/components/SessionProvider";
import { useEffect, useRef, useState } from "react";
import { LoginIcon } from "@/components/icons/LoginIcon";
import Button from "./Button";

export default function UserProfile() {
  const { data: session, isPending } = authClient.useSession();
  const [showDetails, setShowDetails] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDetails(false);
      }
    }

    if (showDetails) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDetails]);

  if (isPending) {
    return (
      <Button variant="secondary" disabled>
        Loading...
      </Button>
    );
  }

  const handleLogout = async () => {
    // Clear all local storage and session storage
    localStorage.clear();
    sessionStorage.clear();

    // Sign out from better-auth
    await authClient.signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/"; } } });
  };

  if (!session) {
    return (
      <Button
        onClick={() => window.location.href = "/api/auth/sign-in"}
        variant="primary"
        className="flex items-center gap-2"
      >
        <LoginIcon /> Login
      </Button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button onClick={() => setShowDetails(!showDetails)} variant="secondary">
        {session.user?.name || "User"}
      </Button>

      {showDetails && (
        <div className="absolute right-0 mt-2 w-96 bg-gray-800 rounded-md shadow-xl z-[10000] border border-gray-700">
          <div className="p-4">
            <h3 className="text-lg font-bold text-gray-100 mb-3">
              Profile Information
            </h3>

            <div className="space-y-2 text-sm">
              {session.user?.name && (
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-400">Name:</span>
                  <span className="text-gray-200">{session.user.name}</span>
                </div>
              )}

              {session.user?.email && (
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-400">Email:</span>
                  <span className="text-gray-200">{session.user.email}</span>
                </div>
              )}

              {(session.user as any)?.roles && (session.user as any).roles.length > 0 && (
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-400">Roles:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(session.user as any).roles.map((role: string) => (
                      <span
                        key={role}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900 text-blue-200"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
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
  );
}
