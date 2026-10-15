/**
 * materials.ts - Shared Materials & Textures for UCH Explore
 * 
 * Optimized shared Three.js materials adhering to UCH's visual identity:
 * deep hospital green, warm neutral sandstone surfaces, restrained gold accents,
 * and high performance through shared instances.
 */

import * as THREE from 'three';

export interface WorldMaterials {
  ground: THREE.MeshStandardMaterial;
  road: THREE.MeshStandardMaterial;
  path: THREE.MeshStandardMaterial;
  roadMarking: THREE.MeshBasicMaterial;
  buildingGeneral: THREE.MeshStandardMaterial;
  buildingMainWard: THREE.MeshStandardMaterial;
  buildingPavilion: THREE.MeshStandardMaterial;
  buildingAcademic: THREE.MeshStandardMaterial;
  buildingSelected: THREE.MeshStandardMaterial;
  buildingHover: THREE.MeshStandardMaterial;
  roofGeneral: THREE.MeshStandardMaterial;
  roofTile: THREE.MeshStandardMaterial;
  treeFoliage: THREE.MeshStandardMaterial;
  treeTrunk: THREE.MeshStandardMaterial;
  palmFronds: THREE.MeshStandardMaterial;
  gateStructure: THREE.MeshStandardMaterial;
  goldAccent: THREE.MeshStandardMaterial;
  metalFence: THREE.MeshStandardMaterial;
  lampGlow: THREE.MeshBasicMaterial;
}

/**
 * Creates the shared materials palette with day/night adaptability.
 */
export function createWorldMaterials(): WorldMaterials {
  // Ground: equatorial tropical lawn
  const ground = new THREE.MeshStandardMaterial({
    color: 0x315c3d,
    roughness: 0.9,
    metalness: 0.05,
    flatShading: false,
  });

  // Roads: weathered hospital asphalt
  const road = new THREE.MeshStandardMaterial({
    color: 0x2e3338,
    roughness: 0.85,
    metalness: 0.1,
  });

  // Walkways: sand-washed concrete pedestrian paths
  const path = new THREE.MeshStandardMaterial({
    color: 0xd6cebe,
    roughness: 0.9,
    metalness: 0.05,
  });

  const roadMarking = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });

  // Building Walls
  // General neutral buildings
  const buildingGeneral = new THREE.MeshStandardMaterial({
    color: 0xede6db,
    roughness: 0.75,
    metalness: 0.05,
  });

  // Iconic 1950s Central Ward block: warm cream with tropical modernist character
  const buildingMainWard = new THREE.MeshStandardMaterial({
    color: 0xf5eee4,
    roughness: 0.7,
    metalness: 0.08,
  });

  // Clinical pavilions & diagnostic centers (Geriatric Centre, A&E, etc.)
  const buildingPavilion = new THREE.MeshStandardMaterial({
    color: 0xe6dec8,
    roughness: 0.8,
    metalness: 0.05,
  });

  // Academic lecture theatres & student halls (Paul Hendrickse, ABH)
  const buildingAcademic = new THREE.MeshStandardMaterial({
    color: 0xdfd4c0,
    roughness: 0.85,
    metalness: 0.05,
  });

  // Highlight and selection
  const buildingSelected = new THREE.MeshStandardMaterial({
    color: 0xd9b343,
    emissive: 0x6e4e10,
    emissiveIntensity: 0.55,
    roughness: 0.4,
    metalness: 0.2,
  });

  const buildingHover = new THREE.MeshStandardMaterial({
    color: 0xb5d4be,
    roughness: 0.6,
    metalness: 0.1,
  });

  // Roofs
  const roofGeneral = new THREE.MeshStandardMaterial({
    color: 0x666b73,
    roughness: 0.65,
    metalness: 0.2,
  });

  const roofTile = new THREE.MeshStandardMaterial({
    color: 0x8a543e,
    roughness: 0.7,
    metalness: 0.1,
  });

  // Vegetation
  const treeFoliage = new THREE.MeshStandardMaterial({
    color: 0x24542d,
    roughness: 0.85,
    metalness: 0.05,
    flatShading: true,
  });

  const treeTrunk = new THREE.MeshStandardMaterial({
    color: 0x4d3829,
    roughness: 0.95,
    metalness: 0.02,
  });

  const palmFronds = new THREE.MeshStandardMaterial({
    color: 0x2e6b35,
    roughness: 0.75,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  // Architecture Details & Signage
  const gateStructure = new THREE.MeshStandardMaterial({
    color: 0x0f3b25, // UCH Deep Green
    roughness: 0.5,
    metalness: 0.3,
  });

  const goldAccent = new THREE.MeshStandardMaterial({
    color: 0xcfa84a,
    roughness: 0.3,
    metalness: 0.7,
  });

  const metalFence = new THREE.MeshStandardMaterial({
    color: 0x1c2b21,
    roughness: 0.6,
    metalness: 0.5,
  });

  const lampGlow = new THREE.MeshBasicMaterial({
    color: 0xffe899,
  });

  return {
    ground,
    road,
    path,
    roadMarking,
    buildingGeneral,
    buildingMainWard,
    buildingPavilion,
    buildingAcademic,
    buildingSelected,
    buildingHover,
    roofGeneral,
    roofTile,
    treeFoliage,
    treeTrunk,
    palmFronds,
    gateStructure,
    goldAccent,
    metalFence,
    lampGlow,
  };
}

/**
 * Updates material colors for Night / Day mode transition.
 */
export function setMaterialsNightMode(materials: WorldMaterials, isNight: boolean): void {
  if (isNight) {
    materials.ground.color.setHex(0x13261a);
    materials.road.color.setHex(0x15181c);
    materials.path.color.setHex(0x4a4740);
    materials.buildingGeneral.color.setHex(0x3d3d40);
    materials.buildingMainWard.color.setHex(0x4a4a50);
    materials.buildingMainWard.emissive.setHex(0x2d2b1f);
    materials.buildingMainWard.emissiveIntensity = 0.45;
    materials.buildingPavilion.color.setHex(0x38383a);
    materials.buildingAcademic.color.setHex(0x333338);
    materials.treeFoliage.color.setHex(0x122616);
    materials.palmFronds.color.setHex(0x172b1b);
    materials.lampGlow.color.setHex(0xffea9f);
  } else {
    materials.ground.color.setHex(0x315c3d);
    materials.road.color.setHex(0x2e3338);
    materials.path.color.setHex(0xd6cebe);
    materials.buildingGeneral.color.setHex(0xede6db);
    materials.buildingMainWard.color.setHex(0xf5eee4);
    materials.buildingMainWard.emissive.setHex(0x000000);
    materials.buildingMainWard.emissiveIntensity = 0.0;
    materials.buildingPavilion.color.setHex(0xe6dec8);
    materials.buildingAcademic.color.setHex(0xdfd4c0);
    materials.treeFoliage.color.setHex(0x24542d);
    materials.palmFronds.color.setHex(0x2e6b35);
    materials.lampGlow.color.setHex(0xffe899);
  }
}
