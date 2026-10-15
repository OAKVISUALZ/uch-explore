import test from 'node:test';
import assert from 'node:assert/strict';
import { NavigationGraph } from '../src/world/routing.ts';
import type { GeoJSONFeature, RoadProperties, GeoJSONLineStringGeometry } from '../src/types.ts';

test('Routing engine - Builds connected topological graph and computes shortest path', () => {
  // Mock road features intersecting at node (3.9030, 7.4025)
  const mockRoads: GeoJSONFeature<RoadProperties, GeoJSONLineStringGeometry>[] = [
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [3.90380, 7.40115], // Main Gate
          [3.90300, 7.40250], // Central Spine
        ],
      },
      properties: { id: 'road-1', osm_id: 1, name: 'Main Road', highway: 'trunk', width_m: 7, surface: 'asphalt' },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [3.90300, 7.40250], // Central Spine
          [3.90234, 7.40283], // A&E Casualty
        ],
      },
      properties: { id: 'road-2', osm_id: 2, name: 'Spine Avenue', highway: 'service', width_m: 6, surface: 'asphalt' },
    },
  ];

  const graph = new NavigationGraph(mockRoads, []);

  // Compute route from Main Gate to A&E
  const route = graph.findRoute(88.3, 149.3, -72.9, -36.5, 'Main Gate', 'A&E Emergency');

  assert.ok(route, 'Route must not be null');
  assert.ok(route.path.length >= 3, 'Path should have at least start, intermediate, and destination waypoints');
  assert.ok(route.distanceMeters > 50, `Distance should be realistic, got ${route.distanceMeters}m`);
  assert.ok(route.walkingMinutes >= 1, `Walking time should be >= 1 min, got ${route.walkingMinutes}`);
  assert.ok(route.instructions.length >= 2, 'Instructions must be provided');
});

test('Routing engine - Handles adjacent points cleanly', () => {
  const graph = new NavigationGraph([], []);
  const route = graph.findRoute(10, 10, 12, 10, 'Point A', 'Point B');
  assert.ok(route);
  assert.ok(route.distanceMeters <= 5);
});
