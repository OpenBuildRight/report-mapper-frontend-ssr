import { getRevisionWithUrl } from "@/lib/actions/image-actions";
import { getAuthContext } from "@/lib/middleware/auth";
import type { Observation } from "@/types/observation";
import {canEditEntity} from "@/lib/rbac/permissions";

interface ObservationCardProps {
  observationId: string;
  description: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  imageIds: Array<{ id: string; revisionId: number }>;
  createdAt: string;
  owner: string;
}

export default async function ObservationCard({
  observationId,
  description,
  location,
  imageIds,
  createdAt,
  owner,
}: ObservationCardProps) {
  const authContext = await getAuthContext();

  // Fetch all images in parallel
  const photos = await Promise.all(
    imageIds.map(async (img) => {
      const image = await getRevisionWithUrl(img.id, img.revisionId);
      return {
        id: img.id,
        url: image.presignedUrl,
        description: image.description,
        location: image.location
          ? {
              latitude: image.location.coordinates[1],
              longitude: image.location.coordinates[0],
            }
          : undefined,
      };
    }),
  );

  const observation: Observation = {
    id: observationId,
    description,
    location: location || { latitude: 0, longitude: 0 },
    photos,
    createdAt,
    createdBy: {
      id: owner,
      name: "", // We don't have name in this context yet
    },
    canEdit: canEditEntity(
      authContext.roles,
      { owner: owner },
      authContext.userId,
    ),
  };

  // Return a data attribute that ObservationMap can consume
  // This allows the client component to collect all observations progressively
  return (
    <script
      type="application/json"
      data-observation-id={observationId}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(observation) }}
    />
  );
}
