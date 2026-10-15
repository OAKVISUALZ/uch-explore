export type ConfidenceLevel = 'verified' | 'high_confidence' | 'approximate' | 'unverified_gap';

export type DestinationCategory =
  | 'Emergency'
  | 'Clinical'
  | 'Diagnostic'
  | 'Pharmacy'
  | 'Academic'
  | 'Student'
  | 'Services'
  | 'Entrance'
  | 'General';

export interface SourceCitation {
  name: string;
  url?: string;
  date?: string;
  purpose?: string;
}

export interface DestinationPlace {
  id: string;
  name: string;
  shortName: string;
  category: DestinationCategory;
  type: string;
  targetBuildingId: string | null;
  coordinates: [number, number]; // [lon, lat]
  confidence: ConfidenceLevel;
  entranceVerified: boolean;
  accessNotes: string;
  description: string;
  sources: SourceCitation[];
}

export interface BuildingProperties {
  id: string;
  osm_id: number;
  name: string;
  category: string;
  confidence: ConfidenceLevel;
  is_identified: boolean;
  levels: number;
  height_m: number;
  footprint_area_m2: number;
  center: [number, number]; // [lon, lat]
  architecture: string;
  source: string;
  tags?: Record<string, string>;
}

export interface GeoJSONFeature<TProps, TGeom> {
  type: 'Feature';
  id?: string;
  geometry: TGeom;
  properties: TProps;
}

export interface GeoJSONPolygonGeometry {
  type: 'Polygon';
  coordinates: [number, number][][];
}

export interface GeoJSONLineStringGeometry {
  type: 'LineString';
  coordinates: [number, number][];
}

export interface GeoJSONFeatureCollection<TProps, TGeom> {
  type: 'FeatureCollection';
  name?: string;
  features: GeoJSONFeature<TProps, TGeom>[];
}

export interface RoadProperties {
  id: string;
  osm_id: number;
  name: string;
  highway: string;
  width_m: number;
  surface: string;
}

export interface PathProperties {
  id: string;
  osm_id: number;
  name: string;
  highway: string;
  width_m: number;
  surface: string;
}

export interface SceneSourcesMetadata {
  project: string;
  institution: string;
  disclaimer: string;
  boundary_osm_way: number;
  boundary_bounds: {
    min_lon: number;
    min_lat: number;
    max_lon: number;
    max_lat: number;
  };
  origin: {
    lon: number;
    lat: number;
    description: string;
  };
  projection: {
    type: string;
    meters_per_degree_lat: number;
    meters_per_degree_lon: number;
    formula_x: string;
    formula_z: string;
    formula_y: string;
  };
  sources: SourceCitation[];
}

export interface ReviewProposal {
  footprintId: string;
  osmId: number;
  proposedName: string;
  department: string;
  evidenceUrl: string;
  captureDate: string;
  confidence: ConfidenceLevel;
  notes: string;
  proposedEntrance?: [number, number]; // [lon, lat]
  proposedPathCorrection?: [number, number][];
  updatedAt: string;
}

export interface ReviewDatasetBackup {
  version: string;
  exportedAt: string;
  institution: string;
  proposals: Record<string, ReviewProposal>;
}
