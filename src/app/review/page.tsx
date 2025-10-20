import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Button from "@/components/Button";
import { auth } from "@/lib/auth";
import { Permission } from "@/types/rbac";
import {hasPermission} from "@/lib/rbac/permissions";

async function getPendingObservations() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(
      `${baseUrl}/api/observations?submitted=true&published=false&sortBy=revisionCreated&sortOrder=desc`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error("Failed to fetch pending observations:", response.status);
      return [];
    }

    const data = await response.json();
    return data.observations;
  } catch (error) {
    console.error("Error fetching pending observations:", error);
    return [];
  }
}

export default async function ReviewPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/api/auth/sign-in");
  }

  // Check if user has permission to review observations
  // Roles are already populated in the session from user_roles collection
  const canReview = hasPermission(
    (session.user as any).roles || [],
    Permission.READ_ALL_OBSERVATIONS,
  );

  if (!canReview) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto p-8 bg-gray-800 rounded-lg border border-gray-700">
          <h1 className="text-2xl font-bold text-red-400 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-300 mb-6">
            You don't have permission to review observations. Only moderators
            can access this page.
          </p>
          <Link href="/">
            <Button variant="primary">Return to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const pendingObservations = await getPendingObservations();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-100">
                Review Observations
              </h1>
              <p className="text-gray-400 mt-2">
                Review and publish submitted observations
              </p>
            </div>
            <Link href="/">
              <Button variant="secondary">Back to Map</Button>
            </Link>
          </div>

          {pendingObservations.length === 0 ? (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-200 mb-2">
                All Caught Up!
              </h2>
              <p className="text-gray-400">
                There are no pending observations to review at this time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingObservations.map((obs: any) => (
                <div
                  key={`${obs.id}-${obs.revisionId}`}
                  className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900 text-yellow-200">
                          Pending Review
                        </span>
                        <span className="text-xs text-gray-500">
                          Revision #{obs.revisionId}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-100 mb-2">
                        {obs.description || "No description"}
                      </h3>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {obs.location && (
                          <div>
                            <span className="text-gray-500">Location: </span>
                            <span className="text-gray-300">
                              {obs.location.latitude.toFixed(4)},{" "}
                              {obs.location.longitude.toFixed(4)}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Photos: </span>
                          <span className="text-gray-300">
                            {obs.imageIds?.length || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Submitted: </span>
                          <span className="text-gray-300">
                            {new Date(
                              obs.revisionCreatedAt,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Owner: </span>
                          <span className="text-gray-300">{obs.owner}</span>
                        </div>
                      </div>
                    </div>

                    <div className="ml-6">
                      <Link
                        href={`/review/${obs.id}?revision=${obs.revisionId}`}
                      >
                        <Button variant="primary">Review</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
