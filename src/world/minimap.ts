/**
 * minimap.ts - Real-Time Walking Radar / Mini-Map HUD
 * 
 * Provides an interactive 2D canvas overlay in walking mode displaying player position,
 * viewing direction cone, nearby building footprints, and active route waypoints.
 */

import { wgs84ToCartesian } from './coordinates';
import { DestinationPlace } from '../types';

export interface MiniMapOptions {
  container: HTMLElement;
  places: DestinationPlace[];
}

export class MiniMapHUD {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private wrapper: HTMLElement;
  private places: DestinationPlace[];
  private activeRoute: { x: number; z: number }[] = [];
  private visible = false;

  constructor(options: MiniMapOptions) {
    this.places = options.places;

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'minimap-wrapper';
    this.wrapper.style.cssText = `
      position: absolute;
      bottom: 24px;
      right: 24px;
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: rgba(8, 36, 23, 0.88);
      border: 2px solid #cfa84a;
      box-shadow: 0 4px 16px rgba(0,0,0,0.35);
      z-index: 40;
      overflow: hidden;
      display: none;
      pointer-events: auto;
    `;

    // North arrow badge
    const northBadge = document.createElement('div');
    northBadge.style.cssText = `
      position: absolute;
      top: 4px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 10px;
      font-weight: 800;
      color: #cfa84a;
      text-shadow: 0 1px 2px #000;
      pointer-events: none;
    `;
    northBadge.textContent = '▲ N';
    this.wrapper.appendChild(northBadge);

    this.canvas = document.createElement('canvas');
    this.canvas.width = 140;
    this.canvas.height = 140;
    this.canvas.style.display = 'block';
    this.wrapper.appendChild(this.canvas);

    options.container.appendChild(this.wrapper);
    this.ctx = this.canvas.getContext('2d')!;
  }

  public setVisible(show: boolean): void {
    this.visible = show;
    this.wrapper.style.display = show ? 'block' : 'none';
  }

  public setRoute(waypoints: { x: number; z: number }[]): void {
    this.activeRoute = waypoints;
  }

  public clearRoute(): void {
    this.activeRoute = [];
  }

  /**
   * Updates radar with current player position (x, z) and camera yaw angle.
   */
  public update(playerX: number, playerZ: number, yaw: number): void {
    if (!this.visible) return;

    const ctx = this.ctx;
    const w = 140;
    const h = 140;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 0.35; // Meters to pixels

    ctx.clearRect(0, 0, w, h);

    // Save and rotate radar so forward is up
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(yaw);

    // Draw active navigation route line
    if (this.activeRoute.length >= 2) {
      ctx.beginPath();
      ctx.strokeStyle = '#38ef7d';
      ctx.lineWidth = 3.5;
      ctx.lineJoin = 'round';

      for (let i = 0; i < this.activeRoute.length; i++) {
        const pt = this.activeRoute[i];
        const rx = (pt.x - playerX) * scale;
        const rz = (pt.z - playerZ) * scale;
        if (i === 0) ctx.moveTo(rx, rz);
        else ctx.lineTo(rx, rz);
      }
      ctx.stroke();
    }

    // Draw key destination markers
    for (const place of this.places) {
      const cart = wgs84ToCartesian(place.coordinates[0], place.coordinates[1]);
      const dx = (cart.x - playerX) * scale;
      const dz = (cart.z - playerZ) * scale;

      if (Math.hypot(dx, dz) < 80) {
        ctx.fillStyle = place.category === 'Emergency' ? '#ef4444' : '#cfa84a';
        ctx.beginPath();
        ctx.arc(dx, dz, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    // Center avatar dot (self)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    // Forward viewing direction cone
    ctx.fillStyle = 'rgba(207, 168, 74, 0.4)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - 16, cy - 28);
    ctx.lineTo(cx + 16, cy - 28);
    ctx.closePath();
    ctx.fill();
  }
}
