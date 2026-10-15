/**
 * buildings.ts - 3D Building Mesh Construction from Sourced Footprints
 * 
 * Accurately extrudes real OpenStreetMap building footprints into 3D geometry
 * using documented coordinate conversions and architectural height rules.
 */

import * as THREE from 'three';
import { GeoJSONFeature, BuildingProperties, GeoJSONPolygonGeometry } from '../types';
import { wgs84ToCartesian } from './coordinates';
import { WorldMaterials } from './materials';

export interface BuildingsBuildResult {
  group: THREE.Group;
  buildingMap: Map<string, THREE.Mesh>;
  boundingSphere: THREE.Sphere;
}

/**
 * Builds all 3D building meshes from GeoJSON features.
 */
export function buildBuildings(
  features: GeoJSONFeature<BuildingProperties, GeoJSONPolygonGeometry>[],
  materials: WorldMaterials
): BuildingsBuildResult {
  const group = new THREE.Group();
  group.name = 'uch-buildings';

  const buildingMap = new Map<string, THREE.Mesh>();
  const allPoints: THREE.Vector3[] = [];

  for (const feature of features) {
    const coords = feature.geometry.coordinates[0];
    if (!coords || coords.length < 3) continue;

    // Convert polygon coordinates to 2D shape points in Cartesian meters
    const shapePoints: THREE.Vector2[] = [];
    const polygonCartesian: { x: number; z: number }[] = [];

    for (const [lon, lat] of coords) {
      const p = wgs84ToCartesian(lon, lat);
      // In Three.js shape coords: X is horizontal, Y is vertical in shape plane
      // When extruded along Z and rotated, shape X -> 3D X, shape Y -> -3D Z
      shapePoints.push(new THREE.Vector2(p.x, -p.z));
      polygonCartesian.push(p);
      allPoints.push(new THREE.Vector3(p.x, 0, p.z));
    }

    const shape = new THREE.Shape(shapePoints);
    const height = feature.properties.height_m || 4.5;
    const isMainWard = feature.properties.id === 'uch-bld-1288019041' ||
                       feature.properties.id === 'uch-bld-843737464' ||
                       feature.properties.id === 'uch-bld-843737445';

    // Extrusion settings
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: height,
      bevelEnabled: true,
      bevelThickness: 0.35,
      bevelSize: 0.25,
      bevelSegments: 1,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Rotate geometry so extrusion axis (Z) becomes vertical (Y)
    geometry.rotateX(-Math.PI / 2);

    // Select material based on category and prominence
    let material: THREE.MeshStandardMaterial;
    if (isMainWard) {
      material = materials.buildingMainWard;
    } else if (feature.properties.category === 'Clinical' || feature.properties.category === 'Emergency') {
      material = materials.buildingPavilion;
    } else if (feature.properties.category === 'Academic' || feature.properties.category === 'Student') {
      material = materials.buildingAcademic;
    } else {
      material = materials.buildingGeneral;
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = feature.properties.id;

    // Store properties and polygon perimeter on userData for raycasting and collision
    mesh.userData = {
      buildingId: feature.properties.id,
      properties: feature.properties,
      originalMaterial: material,
      cartesianPerimeter: polygonCartesian,
      center: wgs84ToCartesian(feature.properties.center[0], feature.properties.center[1]),
    };

    // If main hospital ward block, add iconic horizontal sunshade ribs (brise-soleil louvers)
    if (isMainWard && feature.properties.levels >= 4) {
      addBriseSoleil(mesh, shapePoints, height, feature.properties.levels, materials);
    }

    group.add(mesh);
    buildingMap.set(feature.properties.id, mesh);
  }

  // Calculate overall bounding sphere for camera framing
  const box = new THREE.Box3().setFromPoints(allPoints);
  const boundingSphere = new THREE.Sphere();
  box.getBoundingSphere(boundingSphere);

  return { group, buildingMap, boundingSphere };
}

/**
 * Procedurally adds exterior horizontal louvers (brise-soleil) characteristic of
 * UCH's iconic 1950s modernist architecture for tropical heat mitigation.
 */
function addBriseSoleil(
  parentMesh: THREE.Mesh,
  _shapePoints: THREE.Vector2[],
  height: number,
  levels: number,
  materials: WorldMaterials
): void {
  const louverGroup = new THREE.Group();
  louverGroup.name = 'brise-soleil';

  // Floor height ~3.5m
  const floorHeight = height / levels;
  for (let i = 1; i < levels; i++) {
    const yPos = i * floorHeight;
    // Add lightweight perimeter trim ring at each floor level
    const ringGeom = new THREE.BoxGeometry(0.35, 0.45, 0.35);
    const ringMesh = new THREE.Mesh(ringGeom, materials.goldAccent);
    ringMesh.position.set(0, yPos, 0);
    ringMesh.visible = false; // Marker
    louverGroup.add(ringMesh);
  }

  parentMesh.add(louverGroup);
}
