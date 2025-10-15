"use server";

import type { Filter } from "mongodb";
import type {
  ObservationFields,
  ObservationRevisionDocument,
} from "@/types/models";
import { ObservationController } from "./observations";

/**
 * Server Actions for ObservationController
 * These can be used from both Server Components and Client Components
 */

// Read operations
export async function getLatestRevision(
  itemId: string,
): Promise<ObservationRevisionDocument> {
  const controller = new ObservationController();
  return await controller.getLatestRevision(itemId);
}

export async function getRevision(
  itemId: string,
  revisionId: number,
): Promise<ObservationRevisionDocument> {
  const controller = new ObservationController();
  return await controller.getRevision(itemId, revisionId);
}

export async function searchObjects(
  userId?: string,
  published?: boolean,
  filter?: Filter<ObservationRevisionDocument>,
): Promise<ObservationRevisionDocument[]> {
  const controller = new ObservationController();
  return await controller.searchObjects(userId, published, filter);
}

export async function searchByBoundingBox(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number,
  published?: boolean,
  userId?: string,
): Promise<ObservationRevisionDocument[]> {
  const controller = new ObservationController();
  return await controller.searchByBoundingBox(
    minLat,
    maxLat,
    minLng,
    maxLng,
    published,
    userId,
  );
}

export async function searchNearPoint(
  longitude: number,
  latitude: number,
  maxDistanceMeters: number,
  published?: boolean,
  userId?: string,
): Promise<ObservationRevisionDocument[]> {
  const controller = new ObservationController();
  return await controller.searchNearPoint(
    longitude,
    latitude,
    maxDistanceMeters,
    published,
    userId,
  );
}

export async function searchWithinRadius(
  longitude: number,
  latitude: number,
  radiusMeters: number,
  published?: boolean,
  userId?: string,
): Promise<ObservationRevisionDocument[]> {
  const controller = new ObservationController();
  return await controller.searchWithinRadius(
    longitude,
    latitude,
    radiusMeters,
    published,
    userId,
  );
}

// Write operations
export async function createObject(
  data: ObservationFields,
): Promise<ObservationRevisionDocument> {
  const controller = new ObservationController();
  return await controller.createObject(data);
}

export async function createRevision(
  id: string,
  data: ObservationFields,
): Promise<ObservationRevisionDocument> {
  const controller = new ObservationController();
  return await controller.createRevision(id, data);
}

export async function updateRevision(
  itemId: string,
  revisionId: number,
  data: Partial<ObservationFields>,
): Promise<ObservationRevisionDocument> {
  const controller = new ObservationController();
  return await controller.updateRevision(itemId, revisionId, data);
}

export async function publishRevision(
  itemId: string,
  revisionId: number,
): Promise<ObservationRevisionDocument> {
  const controller = new ObservationController();
  return await controller.publishRevision(itemId, revisionId);
}

// Delete operations
export async function deleteRevision(
  itemId: string,
  revisionId: number,
): Promise<void> {
  const controller = new ObservationController();
  return await controller.deleteRevision(itemId, revisionId);
}

export async function deleteObject(itemId: string): Promise<void> {
  const controller = new ObservationController();
  return await controller.deleteObject(itemId);
}
