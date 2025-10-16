import { Db, type Filter } from "mongodb";
import {
  COLLECTIONS,
  type ObservationFields,
  type ObservationRevisionDocument,
} from "@/types/models";
import { RevisionController } from "../actions/revision-controller";

/**
 * ObservationController - extends RevisionController with geo search
 */
export class ObservationController extends RevisionController<
  ObservationFields,
  ObservationRevisionDocument
> {
  constructor() {
    super(COLLECTIONS.OBSERVATION_REVISIONS);
  }

  /**
   * Search observations by bounding box
   */
  async searchByBoundingBox(
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number,
    published?: boolean,
    userId?: string,
  ): Promise<ObservationRevisionDocument[]> {
    const geoFilter: Filter<ObservationRevisionDocument> = {
      location: {
        $geoWithin: {
          $box: [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
        },
      },
    } as any;

    return await super.searchObjects(userId, published, geoFilter);
  }

  /**
   * Search observations near a point
   */
  async searchNearPoint(
    longitude: number,
    latitude: number,
    maxDistanceMeters: number,
    published?: boolean,
    userId?: string,
  ): Promise<ObservationRevisionDocument[]> {
    const geoFilter: Filter<ObservationRevisionDocument> = {
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistanceMeters,
        },
      },
    } as any;

    return await super.searchObjects(userId, published, geoFilter);
  }

  /**
   * Search observations within a radius
   */
  async searchWithinRadius(
    longitude: number,
    latitude: number,
    radiusMeters: number,
    published?: boolean,
    userId?: string,
  ): Promise<ObservationRevisionDocument[]> {
    const geoFilter: Filter<ObservationRevisionDocument> = {
      location: {
        $geoWithin: {
          $centerSphere: [
            [longitude, latitude],
            radiusMeters / 6378100, // Convert meters to radians (Earth radius ~6378.1 km)
          ],
        },
      },
    } as any;

    return await super.searchObjects(userId, published, geoFilter);
  }
}
