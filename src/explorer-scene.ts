/**
 * explorer-scene.ts - Interactive 3D Scene Controller for UCH Explore
 * 
 * Orchestrates rendering, smooth orbit camera transitions, raycast picking,
 * day/night lighting, and seamless transitions into first-person outdoor walking.
 */

import * as THREE from 'three';
import { LoadedExploreData } from './data';
import { createWorldMaterials, setMaterialsNightMode, WorldMaterials } from './world/materials';
import { setupLighting, WorldLighting } from './world/lighting';
import { buildBuildings, BuildingsBuildResult } from './world/buildings';
import { buildRoads } from './world/roads';
import { buildVegetation } from './world/vegetation';
import { buildEntranceGate } from './world/entrance';
import { CollisionSystem } from './world/collision';
import { WalkerController } from './world/walker';
import { PerformanceManager } from './world/performance';
import { wgs84ToCartesian } from './world/coordinates';
import { BuildingProperties, DestinationPlace } from './types';

export interface SceneCallbacks {
  onSelectBuilding?: (building: BuildingProperties, place?: DestinationPlace) => void;
  onDeselect?: () => void;
  onModeChange?: (mode: 'orbit' | 'walk') => void;
}

export class ExplorerScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private materials: WorldMaterials;
  private lighting: WorldLighting;
  private collision: CollisionSystem;
  private walker: WalkerController;
  private perf: PerformanceManager;

  private buildingsResult!: BuildingsBuildResult;
  private exploreData!: LoadedExploreData;
  private callbacks: SceneCallbacks;

  // Orbit navigation state
  private mode: 'orbit' | 'walk' = 'orbit';
  private orbitTarget = new THREE.Vector3(0, 5, 0);
  private orbitDistance = 450;
  private orbitTheta = 0.8; // Azimuth
  private orbitPhi = Math.PI / 4.2; // Elevation
  private isPointerDown = false;
  private prevPointer = { x: 0, y: 0 };
  private isPanning = false;

  // Smooth camera animation tweening
  private animActive = false;
  private animStartTarget = new THREE.Vector3();
  private animEndTarget = new THREE.Vector3();
  private animStartDist = 450;
  private animEndDist = 450;
  private animStartTheta = 0;
  private animEndTheta = 0;
  private animStartPhi = 0;
  private animEndPhi = 0;
  private animProgress = 1.0;
  private animDuration = 1.2;

  // Selection & Raycasting
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private selectedMesh: THREE.Mesh | null = null;
  private originalMat: THREE.Material | null = null;
  private isNight = false;

  private isRunning = false;
  private lastTime = performance.now();

  constructor(container: HTMLElement, data: LoadedExploreData, callbacks: SceneCallbacks = {}) {
    this.container = container;
    this.exploreData = data;
    this.callbacks = callbacks;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.5,
      2500
    );

    // 2. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      stencil: false,
      depth: true,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    // 3. Subsystems
    this.materials = createWorldMaterials();
    this.lighting = setupLighting(this.scene);
    this.collision = new CollisionSystem();
    this.perf = new PerformanceManager(this.renderer);

    this.walker = new WalkerController({
      camera: this.camera,
      domElement: this.renderer.domElement,
      collision: this.collision,
    });

    // 4. Build Environment
    this.initWorld();
    this.bindEvents();
    this.updateOrbitCamera();
  }

  private initWorld(): void {
    // Roads & Pathways
    const roadsGroup = buildRoads(
      this.exploreData.roads.features,
      this.exploreData.paths.features,
      this.materials
    );
    this.scene.add(roadsGroup);

    // Buildings
    this.buildingsResult = buildBuildings(
      this.exploreData.buildings.features,
      this.materials
    );
    this.scene.add(this.buildingsResult.group);

    // Register building collision perimeters
    this.buildingsResult.buildingMap.forEach((mesh) => {
      const perimeter = mesh.userData.cartesianPerimeter;
      if (perimeter && perimeter.length >= 3) {
        this.collision.registerBuilding(mesh.userData.buildingId, perimeter);
      }
    });

    // Recognizable Main Entrance Gate Architecture
    const gateGroup = buildEntranceGate(this.materials);
    this.scene.add(gateGroup);

    // Instanced Tropical Trees & Street Lamps
    const vegetationGroup = buildVegetation(this.materials);
    this.scene.add(vegetationGroup);

    // Center camera on hospital grounds overview
    this.setFullView(false);
  }

  public start(): void {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate();
  }

  public stop(): void {
    this.isRunning = false;
  }

  private animate = (): void => {
    if (!this.isRunning) return;
    requestAnimationFrame(this.animate);

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // Check interaction & performance
    const isInteracting = this.isPointerDown || this.animActive || this.mode === 'walk';
    const shouldRender = this.perf.update(delta, isInteracting);

    if (this.mode === 'walk') {
      this.walker.update(delta);
    } else {
      if (this.animActive) {
        this.updateCameraAnimation(delta);
      }
      this.updateOrbitCamera();
    }

    if (shouldRender) {
      this.renderer.render(this.scene, this.camera);
    }
  };

  /**
   * Sets Orbit camera to show the full UCH grounds overview.
   */
  public setFullView(smooth = true): void {
    this.transitionCameraTo(
      new THREE.Vector3(0, 10, 0),
      620,
      0.85,
      Math.PI / 3.4,
      smooth ? 1.4 : 0.0
    );
  }

  /**
   * Focuses camera smoothly onto a specific destination or coordinates.
   */
  public focusOnDestination(place: DestinationPlace, smooth = true): void {
    const cart = wgs84ToCartesian(place.coordinates[0], place.coordinates[1]);
    const target = new THREE.Vector3(cart.x, 8, cart.z);

    // Select associated building mesh if present
    if (place.targetBuildingId) {
      const mesh = this.buildingsResult.buildingMap.get(place.targetBuildingId);
      if (mesh) {
        this.selectMesh(mesh, false);
      }
    } else {
      this.deselect();
    }

    this.transitionCameraTo(target, 120, this.orbitTheta, Math.PI / 4.0, smooth ? 1.2 : 0.0);
  }

  /**
   * Focuses camera on the verified UCH Main Entrance.
   */
  public focusOnMainEntrance(): void {
    const gateCart = wgs84ToCartesian(3.90380, 7.40115);
    const target = new THREE.Vector3(gateCart.x, 5, gateCart.z);
    this.transitionCameraTo(target, 85, -0.4, Math.PI / 4.8, 1.2);
  }

  /**
   * Toggles between Orbit exploration and First-Person Walking mode.
   */
  public toggleWalkingMode(): 'orbit' | 'walk' {
    if (this.mode === 'orbit') {
      this.enterWalkMode();
    } else {
      this.exitWalkMode();
    }
    return this.mode;
  }

  public enterWalkMode(): void {
    this.mode = 'walk';
    // If target is far from current position, spawn at nearest public outdoor spot or Main Gate
    if (this.walker.position.lengthSq() < 10) {
      this.walker.spawnAt(3.90380, 7.40115);
    }
    this.walker.enable();
    if (this.callbacks.onModeChange) this.callbacks.onModeChange('walk');
  }

  public exitWalkMode(): void {
    this.mode = 'orbit';
    const currentWalkerPos = this.walker.position.clone();
    this.walker.disable();

    // Smoothly orbit around where the walker was standing
    this.orbitTarget.copy(currentWalkerPos);
    this.orbitDistance = 90;
    this.orbitPhi = Math.PI / 4.2;
    this.updateOrbitCamera();

    if (this.callbacks.onModeChange) this.callbacks.onModeChange('orbit');
  }

  public getWalkerController(): WalkerController {
    return this.walker;
  }

  public getMode(): 'orbit' | 'walk' {
    return this.mode;
  }

  public toggleNightMode(): boolean {
    this.isNight = !this.isNight;
    this.lighting.setNightMode(this.isNight);
    setMaterialsNightMode(this.materials, this.isNight);
    return this.isNight;
  }

  public toggleQuality(): boolean {
    return this.perf.toggleQuality();
  }

  public getPerformanceMetrics() {
    return this.perf.getMetrics();
  }

  private transitionCameraTo(
    target: THREE.Vector3,
    dist: number,
    theta: number,
    phi: number,
    duration = 1.2
  ): void {
    if (duration <= 0) {
      this.orbitTarget.copy(target);
      this.orbitDistance = dist;
      this.orbitTheta = theta;
      this.orbitPhi = phi;
      this.updateOrbitCamera();
      return;
    }

    this.animStartTarget.copy(this.orbitTarget);
    this.animEndTarget.copy(target);
    this.animStartDist = this.orbitDistance;
    this.animEndDist = dist;
    this.animStartTheta = this.orbitTheta;
    this.animEndTheta = theta;
    this.animStartPhi = this.orbitPhi;
    this.animEndPhi = phi;

    this.animDuration = duration;
    this.animProgress = 0.0;
    this.animActive = true;
  }

  private updateCameraAnimation(delta: number): void {
    this.animProgress += delta / this.animDuration;
    if (this.animProgress >= 1.0) {
      this.animProgress = 1.0;
      this.animActive = false;
    }

    // Cubic ease-out
    const t = 1 - Math.pow(1 - this.animProgress, 3);

    this.orbitTarget.lerpVectors(this.animStartTarget, this.animEndTarget, t);
    this.orbitDistance = THREE.MathUtils.lerp(this.animStartDist, this.animEndDist, t);
    this.orbitTheta = THREE.MathUtils.lerp(this.animStartTheta, this.animEndTheta, t);
    this.orbitPhi = THREE.MathUtils.lerp(this.animStartPhi, this.animEndPhi, t);
  }

  private updateOrbitCamera(): void {
    if (this.mode !== 'orbit') return;

    // Calculate spherical camera offset
    const sinPhi = Math.sin(this.orbitPhi);
    const cosPhi = Math.cos(this.orbitPhi);
    const sinTheta = Math.sin(this.orbitTheta);
    const cosTheta = Math.cos(this.orbitTheta);

    const x = this.orbitTarget.x + this.orbitDistance * sinPhi * sinTheta;
    const y = this.orbitTarget.y + this.orbitDistance * cosPhi;
    const z = this.orbitTarget.z + this.orbitDistance * sinPhi * cosTheta;

    this.camera.position.set(x, Math.max(y, 3.0), z);
    this.camera.lookAt(this.orbitTarget);
  }

  private selectMesh(mesh: THREE.Mesh, triggerCallback = true): void {
    if (this.selectedMesh === mesh) return;

    this.deselect();

    this.selectedMesh = mesh;
    this.originalMat = mesh.material as THREE.Material;
    mesh.material = this.materials.buildingSelected;

    if (triggerCallback && this.callbacks.onSelectBuilding) {
      const bldProps: BuildingProperties = mesh.userData.properties;
      const place = this.exploreData.places.find((p) => p.targetBuildingId === bldProps.id);
      this.callbacks.onSelectBuilding(bldProps, place);
    }
  }

  public deselect(): void {
    if (this.selectedMesh && this.originalMat) {
      this.selectedMesh.material = this.originalMat;
    }
    this.selectedMesh = null;
    this.originalMat = null;
    if (this.callbacks.onDeselect) this.callbacks.onDeselect();
  }

  private bindEvents(): void {
    const dom = this.renderer.domElement;

    // Resize handling
    window.addEventListener('resize', () => {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });

    // Pointer events for Orbit, Pan & Selection
    dom.addEventListener('pointerdown', (e) => {
      if (this.mode === 'walk') return;
      this.isPointerDown = true;
      this.isPanning = e.button === 2 || e.shiftKey; // Right-click or Shift-drag = Pan
      this.prevPointer.x = e.clientX;
      this.prevPointer.y = e.clientY;
      this.pointer.x = (e.clientX / dom.clientWidth) * 2 - 1;
      this.pointer.y = -(e.clientY / dom.clientHeight) * 2 + 1;
    });

    dom.addEventListener('pointermove', (e) => {
      if (this.mode === 'walk' || !this.isPointerDown) return;
      const dx = e.clientX - this.prevPointer.x;
      const dy = e.clientY - this.prevPointer.y;
      this.prevPointer.x = e.clientX;
      this.prevPointer.y = e.clientY;

      this.animActive = false; // User intervention breaks animation

      if (this.isPanning) {
        // Pan parallel to camera view plane
        const panSpeed = this.orbitDistance * 0.0014;
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        const right = new THREE.Vector3().crossVectors(forward, this.camera.up).normalize();
        const up = new THREE.Vector3().crossVectors(right, forward).normalize();

        this.orbitTarget.addScaledVector(right, -dx * panSpeed);
        this.orbitTarget.addScaledVector(up, dy * panSpeed);
      } else {
        // Rotate
        this.orbitTheta -= dx * 0.005;
        this.orbitPhi -= dy * 0.005;
        // Clamp elevation to avoid flipping or ground clipping
        this.orbitPhi = Math.max(0.1, Math.min(Math.PI / 2.15, this.orbitPhi));
      }
    });

    dom.addEventListener('pointerup', (e) => {
      if (this.mode === 'walk') return;
      const dx = Math.abs(e.clientX - this.prevPointer.x);
      const dy = Math.abs(e.clientY - this.prevPointer.y);
      this.isPointerDown = false;

      // Click detection if barely moved
      if (dx < 4 && dy < 4) {
        this.pointer.x = (e.clientX / dom.clientWidth) * 2 - 1;
        this.pointer.y = -(e.clientY / dom.clientHeight) * 2 + 1;
        this.raycastPick();
      }
    });

    // Zoom
    dom.addEventListener('wheel', (e) => {
      if (this.mode === 'walk') return;
      e.preventDefault();
      this.animActive = false;
      const zoomFactor = e.deltaY > 0 ? 1.12 : 0.89;
      this.orbitDistance = Math.max(25, Math.min(1100, this.orbitDistance * zoomFactor));
    }, { passive: false });

    // Prevent context menu on right-click pan
    dom.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private raycastPick(): void {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const meshes = Array.from(this.buildingsResult.buildingMap.values());
    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object as THREE.Mesh;
      this.selectMesh(hitMesh, true);
    } else {
      this.deselect();
    }
  }
}
