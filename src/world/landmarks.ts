/**
 * landmarks.ts - Authentic UCH Architectural Landmarks
 * 
 * Accurately models UCH's iconic architectural features:
 * - Covered pedestrian breezeways connecting the ward blocks
 * - The landmark UCH elevated water tower / utility stack
 * - The central hospital arrival loop and ambulance drop-off circle
 */

import * as THREE from 'three';
import { WorldMaterials } from './materials';
import { wgs84ToCartesian } from './coordinates';

export function buildArchitecturalLandmarks(materials: WorldMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = 'uch-architectural-landmarks';

  // 1. Covered Pedestrian Breezeways connecting Ward Fingers
  // Central Ward to East Ward bridge
  const eastBridge = createCoveredWalkway(
    new THREE.Vector3(-61, 0, 93), // Central block spine
    new THREE.Vector3(-16, 0, 60), // East ward finger
    materials
  );
  group.add(eastBridge);

  // Central Ward to West Ward bridge
  const westBridge = createCoveredWalkway(
    new THREE.Vector3(-61, 0, 93),
    new THREE.Vector3(-223, 0, 66),
    materials
  );
  group.add(westBridge);

  // Central block to South Clinic & Emergency walkway
  const southWalkway = createCoveredWalkway(
    new THREE.Vector3(-61, 0, 93),
    new THREE.Vector3(-73, 0, -36),
    materials
  );
  group.add(southWalkway);

  // 2. The Iconic UCH Elevated Water Tower (Northern Utility Zone)
  // Coordinates approx: lon 3.9018, lat 7.4048 -> Cartesian approx (-132, 254)
  const towerPos = wgs84ToCartesian(3.90180, 7.40480);
  const waterTower = createWaterTower(towerPos.x, towerPos.z, materials);
  group.add(waterTower);

  // 3. Central Ambulance Arrival Roundabout Island
  const arrivalLoop = createArrivalLoop(materials);
  group.add(arrivalLoop);

  return group;
}

/**
 * Creates an authentic tropical covered breezeway with slender support pillars and corrugated canopy roof.
 */
function createCoveredWalkway(
  start: THREE.Vector3,
  end: THREE.Vector3,
  materials: WorldMaterials
): THREE.Group {
  const walkway = new THREE.Group();
  const dir = new THREE.Vector3().subVectors(end, start);
  const length = dir.length();
  const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const angle = Math.atan2(dir.x, dir.z);

  // Canopy Roof (Corrugated lightweight metal)
  const roofGeom = new THREE.BoxGeometry(3.6, 0.2, length);
  const roofMesh = new THREE.Mesh(roofGeom, materials.roofGeneral);
  roofMesh.position.set(midPoint.x, 3.2, midPoint.z);
  roofMesh.rotation.y = angle;
  roofMesh.castShadow = true;
  walkway.add(roofMesh);

  // Paved Floor
  const floorGeom = new THREE.BoxGeometry(3.2, 0.15, length);
  const floorMesh = new THREE.Mesh(floorGeom, materials.path);
  floorMesh.position.set(midPoint.x, 0.08, midPoint.z);
  floorMesh.rotation.y = angle;
  floorMesh.receiveShadow = true;
  walkway.add(floorMesh);

  // Structural Support Pillars spaced every 6 meters
  const pillarSpacing = 6.0;
  const numPillars = Math.floor(length / pillarSpacing);
  const pillarGeom = new THREE.CylinderGeometry(0.08, 0.08, 3.1, 6);

  for (let i = 0; i <= numPillars; i++) {
    const t = i / numPillars;
    const pos = new THREE.Vector3().lerpVectors(start, end, t);

    // Left pillar
    const perp = new THREE.Vector3(-dir.z, 0, dir.x).normalize().multiplyScalar(1.5);
    const pLeft = new THREE.Mesh(pillarGeom, materials.metalFence);
    pLeft.position.set(pos.x + perp.x, 1.55, pos.z + perp.z);
    walkway.add(pLeft);

    // Right pillar
    const pRight = new THREE.Mesh(pillarGeom, materials.metalFence);
    pRight.position.set(pos.x - perp.x, 1.55, pos.z - perp.z);
    walkway.add(pRight);
  }

  return walkway;
}

/**
 * Models UCH's iconic elevated water tank tower.
 */
function createWaterTower(x: number, z: number, materials: WorldMaterials): THREE.Group {
  const tower = new THREE.Group();
  tower.position.set(x, 0, z);

  const towerHeight = 28.0;

  // 4 structural legs
  const legGeom = new THREE.CylinderGeometry(0.4, 0.5, towerHeight, 8);
  const offsets = [
    { dx: -3.5, dz: -3.5 },
    { dx: 3.5, dz: -3.5 },
    { dx: 3.5, dz: 3.5 },
    { dx: -3.5, dz: 3.5 },
  ];

  for (const off of offsets) {
    const leg = new THREE.Mesh(legGeom, materials.buildingGeneral);
    leg.position.set(off.dx, towerHeight / 2, off.dz);
    leg.castShadow = true;
    tower.add(leg);
  }

  // Cross-bracing rings
  for (let h = 7; h < towerHeight; h += 7) {
    const ringGeom = new THREE.TorusGeometry(4.8, 0.15, 6, 12);
    ringGeom.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeom, materials.metalFence);
    ring.position.set(0, h, 0);
    tower.add(ring);
  }

  // Elevated Reservoir Tank (cylinder)
  const tankGeom = new THREE.CylinderGeometry(5.2, 5.2, 6.5, 16);
  const tankMesh = new THREE.Mesh(tankGeom, materials.buildingMainWard);
  tankMesh.position.set(0, towerHeight + 3.25, 0);
  tankMesh.castShadow = true;
  tower.add(tankMesh);

  // Conical roof cap
  const roofCapGeom = new THREE.ConeGeometry(5.4, 2.0, 16);
  const roofCap = new THREE.Mesh(roofCapGeom, materials.gateStructure);
  roofCap.position.set(0, towerHeight + 7.5, 0);
  tower.add(roofCap);

  // Aircraft warning red/gold beacon light
  const beaconGeom = new THREE.SphereGeometry(0.35, 8, 8);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
  const beacon = new THREE.Mesh(beaconGeom, beaconMat);
  beacon.position.set(0, towerHeight + 8.8, 0);
  tower.add(beacon);

  return tower;
}

/**
 * Creates the landscaped central roundabout arrival loop in front of clinical services.
 */
function createArrivalLoop(materials: WorldMaterials): THREE.Group {
  const group = new THREE.Group();
  // Near A&E and central ward arrival
  group.position.set(-68, 0, 15);

  const islandGeom = new THREE.CylinderGeometry(14, 14, 0.25, 24);
  const island = new THREE.Mesh(islandGeom, materials.ground);
  island.position.y = 0.125;
  island.receiveShadow = true;
  group.add(island);

  const curbGeom = new THREE.TorusGeometry(14, 0.35, 6, 24);
  curbGeom.rotateX(Math.PI / 2);
  const curb = new THREE.Mesh(curbGeom, materials.path);
  curb.position.y = 0.25;
  group.add(curb);

  // Center royal palm in the roundabout island
  const palmTrunkGeom = new THREE.CylinderGeometry(0.3, 0.45, 10.0, 8);
  const palmTrunk = new THREE.Mesh(palmTrunkGeom, materials.treeTrunk);
  palmTrunk.position.y = 5.0;
  palmTrunk.castShadow = true;
  group.add(palmTrunk);

  const crownGeom = new THREE.ConeGeometry(4.2, 3.0, 8);
  crownGeom.rotateX(Math.PI);
  const crown = new THREE.Mesh(crownGeom, materials.palmFronds);
  crown.position.y = 10.5;
  crown.castShadow = true;
  group.add(crown);

  return group;
}
