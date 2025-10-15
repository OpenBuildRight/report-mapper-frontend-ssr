"use server";

import type {
  ImageFields,
  ImageReference,
  ImageRevisionDocument,
  ImageRevisionDocumentWithUrls,
} from "@/types/models";
import { ImageController } from "./images";

/**
 * Server Actions for ImageController
 * These can be used from both Server Components and Client Components
 */

// Read operations
export async function getLatestRevision(
  itemId: string,
): Promise<ImageRevisionDocument> {
  const controller = new ImageController();
  return await controller.getLatestRevision(itemId);
}

export async function getRevision(
  itemId: string,
  revisionId: number,
): Promise<ImageRevisionDocument> {
  const controller = new ImageController();
  return await controller.getRevision(itemId, revisionId);
}

export async function getRevisionWithUrl(
  itemId: string,
  revisionId: number,
): Promise<ImageRevisionDocumentWithUrls> {
  const controller = new ImageController();
  return await controller.getRevisionWithUrl(itemId, revisionId);
}

export async function searchObjects(
  userId?: string,
  published?: boolean,
  filter?: any,
): Promise<ImageRevisionDocument[]> {
  const controller = new ImageController();
  return await controller.searchObjects(userId, published, filter);
}

export async function getImagesByReferences(
  imageRefs: ImageReference[],
): Promise<ImageRevisionDocument[]> {
  const controller = new ImageController();
  return await controller.getImagesByReferences(imageRefs);
}

export async function getImageUrls(
  imageRefs: ImageReference[],
): Promise<string[]> {
  const controller = new ImageController();
  return controller.getImageUrls(imageRefs);
}

// Write operations
export async function createObject(
  data: ImageFields,
): Promise<ImageRevisionDocument> {
  const controller = new ImageController();
  return await controller.createObject(data);
}

export async function createRevision(
  id: string,
  data: ImageFields,
): Promise<ImageRevisionDocument> {
  const controller = new ImageController();
  return await controller.createRevision(id, data);
}

export async function updateRevision(
  itemId: string,
  revisionId: number,
  data: Partial<ImageFields>,
): Promise<ImageRevisionDocument> {
  const controller = new ImageController();
  return await controller.updateRevision(itemId, revisionId, data);
}

export async function publishRevision(
  itemId: string,
  revisionId: number,
): Promise<ImageRevisionDocument> {
  const controller = new ImageController();
  return await controller.publishRevision(itemId, revisionId);
}

// Delete operations
export async function deleteRevision(
  itemId: string,
  revisionId: number,
): Promise<void> {
  const controller = new ImageController();
  return await controller.deleteRevision(itemId, revisionId);
}

export async function deleteObject(itemId: string): Promise<void> {
  const controller = new ImageController();
  return await controller.deleteObject(itemId);
}
