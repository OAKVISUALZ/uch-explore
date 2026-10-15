/**
 * collision.ts - Spatial Collision Detection for Walking Mode
 * 
 * Prevents avatars from penetrating building footprint polygons.
 * Uses 2D spatial indexing (bounding circles) + polygon distance tests.
 */

export interface CollisionCollider {
  buildingId: string;
  center: { x: number; z: number };
  radius: number;
  perimeter: { x: number; z: number }[];
}

export class CollisionSystem {
  private colliders: CollisionCollider[] = [];

  public registerBuilding(
    buildingId: string,
    perimeter: { x: number; z: number }[]
  ): void {
    if (perimeter.length < 3) return;

    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    for (const p of perimeter) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    }

    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const r = Math.hypot((maxX - minX) / 2, (maxZ - minZ) / 2) + 0.5;

    this.colliders.push({
      buildingId,
      center: { x: cx, z: cz },
      radius: r,
      perimeter,
    });
  }

  /**
   * Checks if a point (x, z) with avatar collision radius collides with any registered building.
   */
  public checkCollision(
    x: number,
    z: number,
    avatarRadius = 0.75
  ): { collides: boolean; buildingId?: string } {
    for (const col of this.colliders) {
      // 1. Broadphase bounding circle check
      const dist = Math.hypot(x - col.center.x, z - col.center.z);
      if (dist > col.radius + avatarRadius) continue;

      // 2. Point in polygon check
      if (this.isPointInside(x, z, col.perimeter)) {
        return { collides: true, buildingId: col.buildingId };
      }

      // 3. Distance to polygon edges
      if (this.isNearPerimeter(x, z, col.perimeter, avatarRadius)) {
        return { collides: true, buildingId: col.buildingId };
      }
    }

    return { collides: false };
  }

  private isPointInside(x: number, z: number, poly: { x: number; z: number }[]): boolean {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, zi = poly[i].z;
      const xj = poly[j].x, zj = poly[j].z;

      const intersect =
        zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  private isNearPerimeter(
    x: number,
    z: number,
    poly: { x: number; z: number }[],
    radius: number
  ): boolean {
    const rSq = radius * radius;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const p1 = poly[j];
      const p2 = poly[i];
      if (this.distSqToSegment(x, z, p1.x, p1.z, p2.x, p2.z) < rSq) {
        return true;
      }
    }
    return false;
  }

  private distSqToSegment(
    px: number,
    pz: number,
    x1: number,
    z1: number,
    x2: number,
    z2: number
  ): number {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const l2 = dx * dx + dz * dz;
    if (l2 === 0) return (px - x1) * (px - x1) + (pz - z1) * (pz - z1);

    let t = ((px - x1) * dx + (pz - z1) * dz) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * dx;
    const projZ = z1 + t * dz;
    return (px - projX) * (px - projX) + (pz - projZ) * (pz - projZ);
  }
}
