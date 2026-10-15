/**
 * walker.ts - First-Person Outdoor Walking Controller
 * 
 * Provides smooth, collision-bounded ground navigation around UCH.
 * Supports keyboard (WASD/arrows), mouse drag/look, virtual joystick touch controls,
 * and seamlessly hands off camera position back to orbit mode.
 */

import * as THREE from 'three';
import { CollisionSystem } from './collision';
import { wgs84ToCartesian } from './coordinates';

export interface WalkerOptions {
  camera: THREE.PerspectiveCamera;
  domElement: HTMLElement;
  collision: CollisionSystem;
  onPositionUpdate?: (pos: { x: number; z: number }) => void;
}

export class WalkerController {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private collision: CollisionSystem;
  private enabled = false;

  // Position and Orientation
  public position = new THREE.Vector3(88.3, 1.7, 149.3); // Default at Main Gate Plaza
  private yaw = -0.35; // Looking into campus
  private pitch = 0.0;

  // Motion dynamics
  private moveSpeed = 4.8; // m/s
  private sprintMultiplier = 1.6;
  private keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
  };

  // Touch controls
  private touchMove = { x: 0, y: 0 };

  // Mouse drag look
  private isPointerDown = false;
  private prevPointerX = 0;
  private prevPointerY = 0;

  // Accessibility
  private respectsReducedMotion = false;

  constructor(options: WalkerOptions) {
    this.camera = options.camera;
    this.domElement = options.domElement;
    this.collision = options.collision;

    // Check prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.respectsReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    this.bindEvents();
  }

  /**
   * Resets walker to a verified outdoor public position (Main Gate plaza by default).
   */
  public spawnAt(lon = 3.90380, lat = 7.40115): void {
    const cart = wgs84ToCartesian(lon, lat);
    this.position.set(cart.x, 1.7, cart.z);
    this.yaw = -0.35;
    this.pitch = 0.0;
  }

  public setPosition(pos: THREE.Vector3, yaw = 0, pitch = 0): void {
    this.position.copy(pos);
    this.position.y = 1.7; // Ensure eye-level
    this.yaw = yaw;
    this.pitch = pitch;
  }

  public enable(): void {
    this.enabled = true;
    this.camera.position.copy(this.position);
    this.updateCameraRotation();
  }

  public disable(): void {
    this.enabled = false;
    this.keys.forward = false;
    this.keys.backward = false;
    this.keys.left = false;
    this.keys.right = false;
    this.keys.sprint = false;
    this.touchMove.x = 0;
    this.touchMove.y = 0;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Updates walking movement with wall collision and sliding.
   */
  public update(delta: number): void {
    if (!this.enabled) return;

    // Calculate move direction in local camera horizontal space
    let forwardInput = 0;
    let sideInput = 0;

    if (this.keys.forward) forwardInput += 1;
    if (this.keys.backward) forwardInput -= 1;
    if (this.keys.right) sideInput += 1;
    if (this.keys.left) sideInput -= 1;

    // Touch joystick input overlay
    forwardInput += -this.touchMove.y;
    sideInput += this.touchMove.x;

    if (forwardInput === 0 && sideInput === 0) {
      this.camera.position.copy(this.position);
      return;
    }

    // Normalize input
    const inputLen = Math.hypot(forwardInput, sideInput);
    if (inputLen > 1) {
      forwardInput /= inputLen;
      sideInput /= inputLen;
    }

    const currentSpeed = (this.keys.sprint ? this.moveSpeed * this.sprintMultiplier : this.moveSpeed) *
      (this.respectsReducedMotion ? 0.75 : 1.0);

    const distance = currentSpeed * delta;

    // Local forward & right vectors based on yaw
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    const fwdX = -sinYaw;
    const fwdZ = -cosYaw;
    const rightX = cosYaw;
    const rightZ = -sinYaw;

    const moveX = (fwdX * forwardInput + rightX * sideInput) * distance;
    const moveZ = (fwdZ * forwardInput + rightZ * sideInput) * distance;

    const targetX = this.position.x + moveX;
    const targetZ = this.position.z + moveZ;

    // Collision Resolution with Wall Sliding
    const fullTest = this.collision.checkCollision(targetX, targetZ, 0.75);
    if (!fullTest.collides) {
      this.position.x = targetX;
      this.position.z = targetZ;
    } else {
      // Test sliding along X only
      const xTest = this.collision.checkCollision(targetX, this.position.z, 0.75);
      if (!xTest.collides) {
        this.position.x = targetX;
      }
      // Test sliding along Z only
      const zTest = this.collision.checkCollision(this.position.x, targetZ, 0.75);
      if (!zTest.collides) {
        this.position.z = targetZ;
      }
    }

    this.camera.position.copy(this.position);
  }

  private updateCameraRotation(): void {
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.x = this.pitch;
    euler.y = this.yaw;
    this.camera.quaternion.setFromEuler(euler);
  }

  public setTouchMove(x: number, y: number): void {
    this.touchMove.x = x;
    this.touchMove.y = y;
  }

  private bindEvents(): void {
    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.sprint = true;
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.sprint = false;
          break;
      }
    });

    // Pointer look (Mouse drag / touch look)
    this.domElement.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      this.isPointerDown = true;
      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.enabled || !this.isPointerDown) return;
      const dx = e.clientX - this.prevPointerX;
      const dy = e.clientY - this.prevPointerY;
      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;

      const sensitivity = 0.0035;
      this.yaw -= dx * sensitivity;
      this.pitch -= dy * sensitivity;
      // Clamp vertical look
      this.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.pitch));

      this.updateCameraRotation();
    });

    window.addEventListener('pointerup', () => {
      this.isPointerDown = false;
    });
  }
}
