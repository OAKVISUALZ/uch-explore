/**
 * performance.ts - Mobile Optimization, Render Throttling & Profiler
 * 
 * Manages device pixel ratio limits, idle pausing, visibility changes,
 * quality preset switching, and real-time GPU metrics.
 */

import * as THREE from 'three';

export interface PerformanceMetrics {
  fps: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  isLowQuality: boolean;
}

export class PerformanceManager {
  private renderer: THREE.WebGLRenderer;
  private isLowQuality = false;
  private fps = 60;
  private frameCount = 0;
  private lastTime = performance.now();
  private idleTime = 0;
  private isIdle = false;
  private isDocumentHidden = false;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.applyPixelRatio();

    // Listen to document visibility
    document.addEventListener('visibilitychange', () => {
      this.isDocumentHidden = document.hidden;
    });

    // Reset idle timer on user activity
    const resetIdle = () => {
      this.idleTime = 0;
      this.isIdle = false;
    };

    window.addEventListener('pointermove', resetIdle, { passive: true });
    window.addEventListener('pointerdown', resetIdle, { passive: true });
    window.addEventListener('keydown', resetIdle, { passive: true });
    window.addEventListener('wheel', resetIdle, { passive: true });
    window.addEventListener('touchstart', resetIdle, { passive: true });
  }

  public setLowQuality(low: boolean): void {
    this.isLowQuality = low;
    this.applyPixelRatio();
    this.renderer.shadowMap.enabled = !low;
  }

  public toggleQuality(): boolean {
    this.setLowQuality(!this.isLowQuality);
    return this.isLowQuality;
  }

  public getIsLowQuality(): boolean {
    return this.isLowQuality;
  }

  private applyPixelRatio(): void {
    const maxRatio = this.isLowQuality ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.75);
    this.renderer.setPixelRatio(maxRatio);
  }

  /**
   * Tracks frames and decides whether continuous rendering is required.
   */
  public update(delta: number, isInteracting: boolean): boolean {
    if (this.isDocumentHidden) return false;

    // Calculate FPS
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.frameCount = 0;
      this.lastTime = now;
    }

    if (isInteracting) {
      this.idleTime = 0;
      this.isIdle = false;
      return true;
    }

    this.idleTime += delta;
    // Enter power-saving idle state after 4 seconds of stillness
    if (this.idleTime > 4.0) {
      this.isIdle = true;
    }

    // When idle, render only occasionally to save battery
    return !this.isIdle || (this.frameCount % 10 === 0);
  }

  public getMetrics(): PerformanceMetrics {
    const info = this.renderer.info;
    return {
      fps: this.fps,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      isLowQuality: this.isLowQuality,
    };
  }
}
