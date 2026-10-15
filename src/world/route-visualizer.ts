/**
 * route-visualizer.ts - Animated 3D Navigation Route Line & Beacons
 * 
 * Renders an elevated glowing pathway ribbon on roads with animated navigation pulses
 * and destination arrival beacons.
 */

import * as THREE from 'three';

export class RouteVisualizer {
  private group: THREE.Group;
  private routeLine: THREE.Mesh | null = null;
  private startBeacon: THREE.Mesh | null = null;
  private endBeacon: THREE.Mesh | null = null;
  private beaconGlowMat: THREE.MeshBasicMaterial;
  private animOffset = 0;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.group.name = 'uch-navigation-route';
    scene.add(this.group);

    this.beaconGlowMat = new THREE.MeshBasicMaterial({
      color: 0xcfa84a,
      transparent: true,
      opacity: 0.85,
    });
  }

  public showRoute(waypoints: { x: number; z: number }[]): void {
    this.clear();

    if (waypoints.length < 2) return;

    // Build 3D curved tube / strip
    const points3D = waypoints.map((p) => new THREE.Vector3(p.x, 0.45, p.z));
    const curve = new THREE.CatmullRomCurve3(points3D, false, 'centripetal', 0.2);

    const tubeGeom = new THREE.TubeGeometry(curve, Math.max(20, waypoints.length * 8), 0.55, 6, false);

    // Glowing navigation path material
    const pathMat = new THREE.MeshBasicMaterial({
      color: 0x38ef7d,
      wireframe: false,
    });

    this.routeLine = new THREE.Mesh(tubeGeom, pathMat);
    this.group.add(this.routeLine);

    // Start Beacon (Green pin)
    const startPos = points3D[0];
    const startGeom = new THREE.CylinderGeometry(0.2, 0.8, 8.0, 8);
    const startMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    this.startBeacon = new THREE.Mesh(startGeom, startMat);
    this.startBeacon.position.set(startPos.x, 4.0, startPos.z);
    this.group.add(this.startBeacon);

    // End Beacon (Gold pillar with top sphere)
    const endPos = points3D[points3D.length - 1];
    const endGeom = new THREE.CylinderGeometry(0.25, 1.0, 14.0, 8);
    this.endBeacon = new THREE.Mesh(endGeom, this.beaconGlowMat);
    this.endBeacon.position.set(endPos.x, 7.0, endPos.z);

    const sphereGeom = new THREE.SphereGeometry(1.6, 12, 12);
    const sphereMesh = new THREE.Mesh(sphereGeom, this.beaconGlowMat);
    sphereMesh.position.set(endPos.x, 14.0, endPos.z);
    this.group.add(this.endBeacon);
    this.group.add(sphereMesh);
  }

  public update(delta: number): void {
    if (this.endBeacon) {
      this.animOffset += delta * 2.5;
      const pulse = 0.7 + Math.sin(this.animOffset) * 0.25;
      this.beaconGlowMat.opacity = pulse;
    }
  }

  public clear(): void {
    while (this.group.children.length > 0) {
      const obj = this.group.children[0] as THREE.Mesh;
      if (obj.geometry) obj.geometry.dispose();
      this.group.remove(obj);
    }
    this.routeLine = null;
    this.startBeacon = null;
    this.endBeacon = null;
  }
}
