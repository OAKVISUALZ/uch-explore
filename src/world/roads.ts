/**
 * roads.ts - Road Network and Pedestrian Pathway Geometries
 * 
 * Generates ribbon meshes for hospital roads and walkways from real GeoJSON data.
 */

import * as THREE from 'three';
import { GeoJSONFeature, RoadProperties, PathProperties, GeoJSONLineStringGeometry } from '../types';
import { wgs84ToCartesian } from './coordinates';
import { WorldMaterials } from './materials';

export function buildRoads(
  roadFeatures: GeoJSONFeature<RoadProperties, GeoJSONLineStringGeometry>[],
  pathFeatures: GeoJSONFeature<PathProperties, GeoJSONLineStringGeometry>[],
  materials: WorldMaterials
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'uch-roads-and-paths';

  // Ground plane: 2000m x 1500m centered at origin
  const groundGeom = new THREE.PlaneGeometry(2200, 1800, 1, 1);
  groundGeom.rotateX(-Math.PI / 2);
  const groundMesh = new THREE.Mesh(groundGeom, materials.ground);
  groundMesh.receiveShadow = true;
  groundMesh.position.y = -0.05;
  group.add(groundMesh);

  // Build Road Ribbons
  for (const feature of roadFeatures) {
    const coords = feature.geometry.coordinates;
    if (!coords || coords.length < 2) continue;

    const width = feature.properties.width_m || 6.0;
    const mesh = createRibbonMesh(coords, width, 0.08, materials.road);
    if (mesh) {
      mesh.name = feature.properties.id;
      mesh.userData = { properties: feature.properties };
      group.add(mesh);
    }
  }

  // Build Path Ribbons
  for (const feature of pathFeatures) {
    const coords = feature.geometry.coordinates;
    if (!coords || coords.length < 2) continue;

    const width = feature.properties.width_m || 2.4;
    const mesh = createRibbonMesh(coords, width, 0.12, materials.path);
    if (mesh) {
      mesh.name = feature.properties.id;
      mesh.userData = { properties: feature.properties };
      group.add(mesh);
    }
  }

  return group;
}

/**
 * Creates a planar quad strip (ribbon) following 2D line coordinates.
 */
function createRibbonMesh(
  coords: [number, number][],
  width: number,
  yOffset: number,
  material: THREE.Material
): THREE.Mesh | null {
  const points = coords.map(([lon, lat]) => {
    const c = wgs84ToCartesian(lon, lat);
    return new THREE.Vector2(c.x, c.z);
  });

  const vertices: number[] = [];
  const indices: number[] = [];
  const halfWidth = width / 2;

  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    let normal = new THREE.Vector2();

    if (i === 0) {
      const next = points[i + 1];
      const dir = new THREE.Vector2().subVectors(next, current).normalize();
      normal.set(-dir.y, dir.x);
    } else if (i === points.length - 1) {
      const prev = points[i - 1];
      const dir = new THREE.Vector2().subVectors(current, prev).normalize();
      normal.set(-dir.y, dir.x);
    } else {
      const prev = points[i - 1];
      const next = points[i + 1];
      const d1 = new THREE.Vector2().subVectors(current, prev).normalize();
      const d2 = new THREE.Vector2().subVectors(next, current).normalize();
      const avgDir = new THREE.Vector2().addVectors(d1, d2).normalize();
      normal.set(-avgDir.y, avgDir.x);
    }

    const left = new THREE.Vector2().addVectors(current, normal.clone().multiplyScalar(halfWidth));
    const right = new THREE.Vector2().addVectors(current, normal.clone().multiplyScalar(-halfWidth));

    // Left vertex
    vertices.push(left.x, yOffset, left.y);
    // Right vertex
    vertices.push(right.x, yOffset, right.y);

    if (i < points.length - 1) {
      const base = i * 2;
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}
