import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../public/data');

test('Data loading - buildings.geojson has valid structure and stable identifiers', () => {
  const filePath = path.join(dataDir, 'buildings.geojson');
  assert.ok(fs.existsSync(filePath), 'buildings.geojson must exist');

  const raw = fs.readFileSync(filePath, 'utf-8');
  const geojson = JSON.parse(raw);

  assert.equal(geojson.type, 'FeatureCollection');
  assert.ok(Array.isArray(geojson.features));
  assert.ok(geojson.features.length >= 400, 'Expected at least 400 building footprints');

  const bldIds = new Set<string>();

  for (const feature of geojson.features) {
    assert.equal(feature.type, 'Feature');
    assert.equal(feature.geometry.type, 'Polygon');
    assert.ok(feature.geometry.coordinates[0].length >= 4, 'Polygon must be closed with at least 4 points');

    const props = feature.properties;
    assert.ok(props.id, 'Building must have stable id');
    assert.match(props.id, /^uch-bld-\d+$/, 'ID must match uch-bld-<osm_id> format');
    assert.ok(!bldIds.has(props.id), `Duplicate building ID: ${props.id}`);
    bldIds.add(props.id);

    assert.ok(props.height_m > 0, 'Height must be positive');
    assert.ok(props.levels >= 1, 'Levels must be >= 1');
    assert.ok(props.footprint_area_m2 > 0, 'Area must be positive');
    assert.ok(['verified', 'high_confidence', 'approximate', 'unverified_gap'].includes(props.confidence));
  }
});

test('Data loading - places.json destinations and relationships to building IDs', () => {
  const placesPath = path.join(dataDir, 'places.json');
  const buildingsPath = path.join(dataDir, 'buildings.geojson');

  const places = JSON.parse(fs.readFileSync(placesPath, 'utf-8'));
  const buildings = JSON.parse(fs.readFileSync(buildingsPath, 'utf-8'));

  const buildingIdSet = new Set(buildings.features.map((f: any) => f.properties.id));

  assert.ok(Array.isArray(places));
  assert.ok(places.length >= 12, 'Expected at least 12 curated hospital destinations');

  for (const place of places) {
    assert.ok(place.id, 'Place must have id');
    assert.ok(place.name, 'Place must have name');
    assert.ok(place.category, 'Place must have category');
    assert.ok(place.coordinates && place.coordinates.length === 2, 'Must have [lon, lat]');
    assert.ok(place.sources && place.sources.length > 0, 'Must have at least one source citation');

    // If assigned to a building, building ID MUST exist in buildings.geojson
    if (place.targetBuildingId) {
      assert.ok(
        buildingIdSet.has(place.targetBuildingId),
        `Place ${place.name} references non-existent building ID: ${place.targetBuildingId}`
      );
    }
  }
});

test('Data loading - scene-sources.json has complete provenance, ODbL attribution and boundaries', () => {
  const sourcesPath = path.join(dataDir, 'scene-sources.json');
  const sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf-8'));

  assert.equal(sources.institution, 'University College Hospital, Ibadan, Nigeria');
  assert.ok(sources.disclaimer.includes('Independent project'), 'Disclaimer must be present');
  assert.equal(sources.boundary_osm_way, 82467201);
  assert.ok(sources.projection && sources.projection.meters_per_degree_lat > 110000);

  const osmSource = sources.sources.find((s: any) => s.name === 'OpenStreetMap');
  assert.ok(osmSource, 'OpenStreetMap source entry must exist');
  assert.ok(osmSource.license.includes('ODbL'), 'Must include ODbL license reference');
});
