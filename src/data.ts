/**
 * data.ts - Client Data Loader & Query Engine for UCH Explore
 * 
 * Fetches prepared GeoJSON geometry and destination metadata.
 * Provides indexed lookups and search filtering for places and buildings.
 */

import {
  GeoJSONFeatureCollection,
  BuildingProperties,
  RoadProperties,
  PathProperties,
  GeoJSONPolygonGeometry,
  GeoJSONLineStringGeometry,
  DestinationPlace,
  SceneSourcesMetadata,
} from './types';

export interface LoadedExploreData {
  buildings: GeoJSONFeatureCollection<BuildingProperties, GeoJSONPolygonGeometry>;
  roads: GeoJSONFeatureCollection<RoadProperties, GeoJSONLineStringGeometry>;
  paths: GeoJSONFeatureCollection<PathProperties, GeoJSONLineStringGeometry>;
  places: DestinationPlace[];
  sources: SceneSourcesMetadata;
}

export class UCHDataManager {
  private data: LoadedExploreData | null = null;
  private placesById = new Map<string, DestinationPlace>();
  private placesByBuildingId = new Map<string, DestinationPlace>();

  public async loadAll(): Promise<LoadedExploreData> {
    try {
      const [buildingsRes, roadsRes, pathsRes, placesRes, sourcesRes] = await Promise.all([
        fetch('./data/buildings.geojson'),
        fetch('./data/roads.geojson'),
        fetch('./data/paths.geojson'),
        fetch('./data/places.json'),
        fetch('./data/scene-sources.json'),
      ]);

      if (!buildingsRes.ok) throw new Error(`Failed to load buildings (${buildingsRes.status})`);
      if (!roadsRes.ok) throw new Error(`Failed to load roads (${roadsRes.status})`);
      if (!pathsRes.ok) throw new Error(`Failed to load paths (${pathsRes.status})`);
      if (!placesRes.ok) throw new Error(`Failed to load places (${placesRes.status})`);
      if (!sourcesRes.ok) throw new Error(`Failed to load sources (${sourcesRes.status})`);

      const [buildings, roads, paths, places, sources] = await Promise.all([
        buildingsRes.json(),
        roadsRes.json(),
        pathsRes.json(),
        placesRes.json(),
        sourcesRes.json(),
      ]);

      this.data = { buildings, roads, paths, places, sources };

      // Index places
      for (const place of places) {
        this.placesById.set(place.id, place);
        if (place.targetBuildingId) {
          this.placesByBuildingId.set(place.targetBuildingId, place);
        }
      }

      return this.data;
    } catch (err) {
      console.error('UCH Data loading failure:', err);
      throw err;
    }
  }

  public getData(): LoadedExploreData | null {
    return this.data;
  }

  public getPlaceById(id: string): DestinationPlace | undefined {
    return this.placesById.get(id);
  }

  public getPlaceByBuildingId(bldId: string): DestinationPlace | undefined {
    return this.placesByBuildingId.get(bldId);
  }

  public getPlaces(): DestinationPlace[] {
    return this.data ? this.data.places : [];
  }

  public searchPlaces(query: string, categoryFilter = 'All'): DestinationPlace[] {
    if (!this.data) return [];
    const q = query.trim().toLowerCase();

    return this.data.places.filter((p) => {
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
      if (!matchesCategory) return false;
      if (!q) return true;

      return (
        p.name.toLowerCase().includes(q) ||
        p.shortName.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.targetBuildingId && p.targetBuildingId.toLowerCase().includes(q))
      );
    });
  }
}
