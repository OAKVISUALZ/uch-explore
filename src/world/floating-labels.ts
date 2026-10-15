/**
 * floating-labels.ts - 3D World-Space Floating Landmark Badges
 * 
 * Projects world coordinates of key hospital facilities into screen space
 * and renders interactive, clickable billboard badges above landmarks.
 */

import * as THREE from 'three';
import { DestinationPlace } from '../types';
import { wgs84ToCartesian } from './coordinates';

export interface FloatingLabelItem {
  place: DestinationPlace;
  worldPos: THREE.Vector3;
  element: HTMLElement;
}

export class FloatingLabelsManager {
  private container: HTMLElement;
  private camera: THREE.Camera;
  private items: FloatingLabelItem[] = [];
  private visible = true;
  private onSelectPlace: (place: DestinationPlace) => void;

  constructor(
    container: HTMLElement,
    camera: THREE.Camera,
    places: DestinationPlace[],
    onSelectPlace: (place: DestinationPlace) => void
  ) {
    this.container = container;
    this.camera = camera;
    this.onSelectPlace = onSelectPlace;

    this.createLabels(places);
  }

  private createLabels(places: DestinationPlace[]): void {
    // Select curated prominent landmarks to avoid cluttering screen
    const priorityIds = [
      'uch-gate-main',
      'uch-bld-ae',
      'uch-bld-central-ward',
      'uch-bld-geriatric',
      'uch-bld-paul-hendrickse',
      'uch-bld-abh',
      'uch-bld-mosque',
      'uch-bld-rad-onc',
    ];

    const targetPlaces = places.filter((p) => priorityIds.includes(p.id));

    for (const place of targetPlaces) {
      const cart = wgs84ToCartesian(place.coordinates[0], place.coordinates[1]);
      const elevation = place.id === 'uch-bld-central-ward' ? 24.0 : 12.0;
      const worldPos = new THREE.Vector3(cart.x, elevation, cart.z);

      const el = document.createElement('div');
      el.className = 'floating-badge';
      el.style.cssText = `
        position: absolute;
        transform: translate(-50%, -100%);
        background: rgba(13, 56, 36, 0.92);
        color: #ffffff;
        border: 1px solid #cfa84a;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
        pointer-events: auto;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 4px;
        transition: opacity 0.2s ease, transform 0.15s ease;
        z-index: 12;
      `;

      const icon = place.category === 'Emergency' ? '🚨' : place.category === 'Entrance' ? '⛩️' : '🏥';
      el.innerHTML = `<span>${icon}</span> <span>${place.shortName}</span>`;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onSelectPlace(place);
      });

      this.container.appendChild(el);
      this.items.push({ place, worldPos, element: el });
    }
  }

  public setVisible(show: boolean): void {
    this.visible = show;
    for (const item of this.items) {
      item.element.style.display = show ? 'flex' : 'none';
    }
  }

  public toggle(): boolean {
    this.setVisible(!this.visible);
    return this.visible;
  }

  public update(): void {
    if (!this.visible) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const tempVec = new THREE.Vector3();

    for (const item of this.items) {
      tempVec.copy(item.worldPos);
      tempVec.project(this.camera);

      // Frustum & Distance checks
      const isBehind = tempVec.z > 1.0;
      const camDist = this.camera.position.distanceTo(item.worldPos);

      if (isBehind || camDist > 1200 || camDist < 15) {
        item.element.style.display = 'none';
        continue;
      }

      item.element.style.display = 'flex';

      const x = (tempVec.x * 0.5 + 0.5) * width;
      const y = (-(tempVec.y * 0.5) + 0.5) * height;

      item.element.style.left = `${x}px`;
      item.element.style.top = `${y}px`;

      // Scale badge slightly with distance
      const scale = THREE.MathUtils.clamp(1.0 - (camDist - 80) / 900, 0.75, 1.1);
      item.element.style.transform = `translate(-50%, -100%) scale(${scale})`;
      item.element.style.opacity = `${THREE.MathUtils.clamp(1.2 - camDist / 1000, 0.3, 1.0)}`;
    }
  }
}
