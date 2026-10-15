/**
 * vegetation.ts - Instanced Trees & Landscape Elements
 * 
 * Uses THREE.InstancedMesh for high performance on mobile devices.
 * Hundreds of tropical trees and street lamps render with minimal draw calls.
 */

import * as THREE from 'three';
import { WorldMaterials } from './materials';

export function buildVegetation(materials: WorldMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = 'uch-vegetation-and-fixtures';

  // Seeded coordinates for trees along avenues and courtyards
  const palmCount = 80;
  const shadeTreeCount = 120;
  const lampCount = 60;

  // 1. Instanced Royal Palms (along Queen Elizabeth Road & entrance approach)
  const palmTrunkGeom = new THREE.CylinderGeometry(0.25, 0.4, 9.0, 6);
  const palmCrownGeom = new THREE.ConeGeometry(3.5, 2.5, 6);
  palmCrownGeom.rotateX(Math.PI); // Invert cone for palm frond canopy

  const palmTrunkInstanced = new THREE.InstancedMesh(palmTrunkGeom, materials.treeTrunk, palmCount);
  const palmCrownInstanced = new THREE.InstancedMesh(palmCrownGeom, materials.palmFronds, palmCount);
  palmTrunkInstanced.castShadow = true;
  palmCrownInstanced.castShadow = true;

  const dummy = new THREE.Object3D();

  // Distribute palms along Queen Elizabeth Road corridor (z: -180 to 200, x: 20 to 140)
  for (let i = 0; i < palmCount; i++) {
    const t = (i / palmCount) * Math.PI * 2;
    const x = Math.sin(t * 3) * 220 + (i % 2 === 0 ? 60 : -60);
    const z = (i - palmCount / 2) * 8.5 - 20;
    const scale = 0.8 + Math.sin(i * 13) * 0.25;

    // Trunk
    dummy.position.set(x, 4.5 * scale, z);
    dummy.rotation.set((Math.sin(i) * 0.05), (i * 0.7), (Math.cos(i) * 0.05));
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    palmTrunkInstanced.setMatrixAt(i, dummy.matrix);

    // Crown
    dummy.position.set(x, 9.0 * scale, z);
    dummy.rotation.set(0, i * 1.2, 0);
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    palmCrownInstanced.setMatrixAt(i, dummy.matrix);
  }

  group.add(palmTrunkInstanced);
  group.add(palmCrownInstanced);

  // 2. Instanced Tropical Shade Trees (Broad canopy Neem / Flamboyant)
  const shadeTrunkGeom = new THREE.CylinderGeometry(0.35, 0.6, 5.0, 6);
  const shadeCanopyGeom = new THREE.DodecahedronGeometry(3.2, 1);

  const shadeTrunkInstanced = new THREE.InstancedMesh(shadeTrunkGeom, materials.treeTrunk, shadeTreeCount);
  const shadeCanopyInstanced = new THREE.InstancedMesh(shadeCanopyGeom, materials.treeFoliage, shadeTreeCount);
  shadeTrunkInstanced.castShadow = true;
  shadeCanopyInstanced.castShadow = true;

  // Distribute shade trees across perimeter green belts and parking nodes
  for (let i = 0; i < shadeTreeCount; i++) {
    const angle = (i / shadeTreeCount) * Math.PI * 2;
    const radius = 180 + Math.abs(Math.sin(i * 7)) * 260;
    const x = Math.cos(angle) * radius - 40;
    const z = Math.sin(angle) * (radius * 0.75) + 30;
    const scale = 0.85 + Math.sin(i * 17) * 0.3;

    // Trunk
    dummy.position.set(x, 2.5 * scale, z);
    dummy.rotation.set(0, i * 0.5, 0);
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    shadeTrunkInstanced.setMatrixAt(i, dummy.matrix);

    // Canopy
    dummy.position.set(x, 5.5 * scale, z);
    dummy.rotation.set(Math.sin(i) * 0.2, i * 0.8, Math.cos(i) * 0.2);
    dummy.scale.set(scale, scale * 0.85, scale);
    dummy.updateMatrix();
    shadeCanopyInstanced.setMatrixAt(i, dummy.matrix);
  }

  group.add(shadeTrunkInstanced);
  group.add(shadeCanopyInstanced);

  // 3. Instanced Street Lamps (along main road avenues)
  const poleGeom = new THREE.CylinderGeometry(0.06, 0.08, 4.2, 5);
  const lampHeadGeom = new THREE.SphereGeometry(0.22, 6, 6);

  const lampPoleInstanced = new THREE.InstancedMesh(poleGeom, materials.metalFence, lampCount);
  const lampHeadInstanced = new THREE.InstancedMesh(lampHeadGeom, materials.lampGlow, lampCount);

  for (let i = 0; i < lampCount; i++) {
    const z = (i - lampCount / 2) * 14.0;
    const side = (i % 2 === 0 ? 1 : -1);
    const x = (i % 2 === 0 ? 25 : -25) + (Math.sin(i * 0.4) * 40);

    dummy.position.set(x, 2.1, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    lampPoleInstanced.setMatrixAt(i, dummy.matrix);

    dummy.position.set(x + (side * 0.3), 4.2, z);
    dummy.updateMatrix();
    lampHeadInstanced.setMatrixAt(i, dummy.matrix);
  }

  group.add(lampPoleInstanced);
  group.add(lampHeadInstanced);

  return group;
}
