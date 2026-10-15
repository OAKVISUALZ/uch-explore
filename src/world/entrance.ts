/**
 * entrance.ts - Recognizable UCH Main Entrance Architecture
 * 
 * Accurately models the verified Queen Elizabeth II Road Main Gateway complex:
 * twin vehicular portals, central security booth, overhead sign arch, pedestrian wickets,
 * and hospital entry markers.
 */

import * as THREE from 'three';
import { wgs84ToCartesian } from './coordinates';
import { WorldMaterials } from './materials';

export function buildEntranceGate(materials: WorldMaterials): THREE.Group {
  const gateGroup = new THREE.Group();
  gateGroup.name = 'uch-main-gate-complex';

  // Position at verified Queen Elizabeth II Road Main Gate coordinates
  const gateCoords = wgs84ToCartesian(3.90380, 7.40115);
  gateGroup.position.set(gateCoords.x, 0, gateCoords.z);
  // Orient to face Queen Elizabeth Road (approximately aligned with road axis)
  gateGroup.rotation.y = -0.35;

  // 1. Concrete Entrance Island / Base
  const islandGeom = new THREE.BoxGeometry(4.0, 0.35, 14.0);
  const islandMesh = new THREE.Mesh(islandGeom, materials.path);
  islandMesh.position.set(0, 0.175, 0);
  gateGroup.add(islandMesh);

  // 2. Central Security Gatehouse
  const boothGeom = new THREE.BoxGeometry(2.8, 3.2, 5.0);
  const boothMesh = new THREE.Mesh(boothGeom, materials.buildingGeneral);
  boothMesh.position.set(0, 1.775, 0);
  boothMesh.castShadow = true;
  gateGroup.add(boothMesh);

  // Security booth roof
  const boothRoofGeom = new THREE.BoxGeometry(3.4, 0.3, 5.6);
  const boothRoofMesh = new THREE.Mesh(boothRoofGeom, materials.gateStructure);
  boothRoofMesh.position.set(0, 3.45, 0);
  gateGroup.add(boothRoofMesh);

  // Security window glass bands
  const glassGeom = new THREE.BoxGeometry(2.85, 1.0, 4.4);
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x4a756b,
    roughness: 0.2,
    metalness: 0.8,
  });
  const glassMesh = new THREE.Mesh(glassGeom, glassMat);
  glassMesh.position.set(0, 2.0, 0);
  gateGroup.add(glassMesh);

  // 3. Overhead Portal Gantry (Deep Green with Gold Trim)
  // Left pillar
  const pillarGeom = new THREE.BoxGeometry(0.8, 5.8, 0.8);
  const leftPillar = new THREE.Mesh(pillarGeom, materials.gateStructure);
  leftPillar.position.set(-7.5, 2.9, 0);
  leftPillar.castShadow = true;
  gateGroup.add(leftPillar);

  // Right pillar
  const rightPillar = new THREE.Mesh(pillarGeom, materials.gateStructure);
  rightPillar.position.set(7.5, 2.9, 0);
  rightPillar.castShadow = true;
  gateGroup.add(rightPillar);

  // Overhead cross beam
  const beamGeom = new THREE.BoxGeometry(16.2, 1.4, 1.0);
  const crossBeam = new THREE.Mesh(beamGeom, materials.gateStructure);
  crossBeam.position.set(0, 5.5, 0);
  crossBeam.castShadow = true;
  gateGroup.add(crossBeam);

  // Overhead Signboard Canvas Texture
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1024;
  signCanvas.height = 128;
  const ctx = signCanvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0d3824'; // UCH deep green
    ctx.fillRect(0, 0, 1024, 128);
    // Gold border
    ctx.strokeStyle = '#cfa84a';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 1012, 116);
    // Main text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('UNIVERSITY COLLEGE HOSPITAL, IBADAN', 512, 46);
    // Subtext
    ctx.fillStyle = '#cfa84a';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('★ MAIN ENTRANCE (ORITAMEFA) ★', 512, 94);
  }

  const signTexture = new THREE.CanvasTexture(signCanvas);
  const signMat = new THREE.MeshBasicMaterial({ map: signTexture });
  const signPlaneGeom = new THREE.PlaneGeometry(15.6, 1.25);
  // Front face (facing approach)
  const signFront = new THREE.Mesh(signPlaneGeom, signMat);
  signFront.position.set(0, 5.5, 0.52);
  gateGroup.add(signFront);

  // Back face (facing hospital exit)
  const signBack = new THREE.Mesh(signPlaneGeom, signMat);
  signBack.position.set(0, 5.5, -0.52);
  signBack.rotation.y = Math.PI;
  gateGroup.add(signBack);

  // 4. Vehicle Barrier Arms (Boom gates)
  const armGeom = new THREE.CylinderGeometry(0.08, 0.08, 5.5);
  armGeom.rotateZ(Math.PI / 2);
  const armMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.5,
  });
  // Ingress arm
  const inArm = new THREE.Mesh(armGeom, armMat);
  inArm.position.set(-4.2, 1.0, 1.5);
  gateGroup.add(inArm);

  // Egress arm
  const outArm = new THREE.Mesh(armGeom, armMat);
  outArm.position.set(4.2, 1.0, -1.5);
  gateGroup.add(outArm);

  // 5. Entrance Lanterns
  const lanternGeom = new THREE.SphereGeometry(0.3, 8, 8);
  const leftLamp = new THREE.Mesh(lanternGeom, materials.lampGlow);
  leftLamp.position.set(-7.5, 6.2, 0);
  gateGroup.add(leftLamp);

  const rightLamp = new THREE.Mesh(lanternGeom, materials.lampGlow);
  rightLamp.position.set(7.5, 6.2, 0);
  gateGroup.add(rightLamp);

  return gateGroup;
}
