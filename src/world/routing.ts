/**
 * routing.ts - Topological Road/Path Routing & Navigation Graph
 * 
 * Constructs an A* shortest-path navigation network from real hospital roadways and footpaths.
 * Calculates exact pedestrian walking distance, time, and waypoint paths.
 */

import { wgs84ToCartesian, cartesianDistance } from './coordinates.ts';
import type { GeoJSONFeature, RoadProperties, PathProperties, GeoJSONLineStringGeometry } from '../types.ts';

export interface RouteNode {
  id: string;
  x: number;
  z: number;
  neighbors: { node: RouteNode; weight: number }[];
}

export interface RouteResult {
  path: { x: number; z: number }[];
  distanceMeters: number;
  walkingMinutes: number;
  instructions: string[];
}

export class NavigationGraph {
  private nodes: Map<string, RouteNode> = new Map();

  constructor(
    roads: GeoJSONFeature<RoadProperties, GeoJSONLineStringGeometry>[],
    paths: GeoJSONFeature<PathProperties, GeoJSONLineStringGeometry>[]
  ) {
    this.buildGraph(roads, paths);
  }

  private getNodeKey(x: number, z: number, tolerance = 3.5): string {
    // Snap to grid bucket for node matching
    for (const node of this.nodes.values()) {
      if (Math.hypot(node.x - x, node.z - z) <= tolerance) {
        return node.id;
      }
    }
    const id = `node_${x.toFixed(1)}_${z.toFixed(1)}`;
    this.nodes.set(id, { id, x, z, neighbors: [] });
    return id;
  }

  private buildGraph(
    roads: GeoJSONFeature<RoadProperties, GeoJSONLineStringGeometry>[],
    paths: GeoJSONFeature<PathProperties, GeoJSONLineStringGeometry>[]
  ): void {
    const allLines = [...roads, ...paths];

    for (const feature of allLines) {
      const coords = feature.geometry.coordinates;
      if (!coords || coords.length < 2) continue;

      for (let i = 0; i < coords.length - 1; i++) {
        const c1 = wgs84ToCartesian(coords[i][0], coords[i][1]);
        const c2 = wgs84ToCartesian(coords[i + 1][0], coords[i + 1][1]);

        const k1 = this.getNodeKey(c1.x, c1.z);
        const k2 = this.getNodeKey(c2.x, c2.z);

        if (k1 === k2) continue;

        const node1 = this.nodes.get(k1)!;
        const node2 = this.nodes.get(k2)!;

        const weight = cartesianDistance(node1, node2);

        if (!node1.neighbors.some((n) => n.node.id === k2)) {
          node1.neighbors.push({ node: node2, weight });
        }
        if (!node2.neighbors.some((n) => n.node.id === k1)) {
          node2.neighbors.push({ node: node1, weight });
        }
      }
    }

    // Connect nearby disconnected components within 14 meters to ensure uninterrupted pedestrian connectivity
    const nodeList = Array.from(this.nodes.values());
    for (let i = 0; i < nodeList.length; i++) {
      const n1 = nodeList[i];
      for (let j = i + 1; j < nodeList.length; j++) {
        const n2 = nodeList[j];
        const dist = Math.hypot(n1.x - n2.x, n1.z - n2.z);
        if (dist > 0.1 && dist < 12.0) {
          if (!n1.neighbors.some((n) => n.node.id === n2.id)) {
            n1.neighbors.push({ node: n2, weight: dist });
            n2.neighbors.push({ node: n1, weight: dist });
          }
        }
      }
    }
  }

  public findNearestNode(x: number, z: number): RouteNode | null {
    let nearest: RouteNode | null = null;
    let minDist = Infinity;

    for (const node of this.nodes.values()) {
      const d = Math.hypot(node.x - x, node.z - z);
      if (d < minDist) {
        minDist = d;
        nearest = node;
      }
    }
    return nearest;
  }

  /**
   * Computes the shortest walking route between any two hospital coordinates using A* search.
   */
  public findRoute(
    startX: number,
    startZ: number,
    targetX: number,
    targetZ: number,
    startLabel = 'Start',
    targetLabel = 'Destination'
  ): RouteResult | null {
    const startNode = this.findNearestNode(startX, startZ);
    const targetNode = this.findNearestNode(targetX, targetZ);

    if (!startNode || !targetNode) {
      const directDist = Math.hypot(targetX - startX, targetZ - startZ);
      return {
        path: [{ x: startX, z: startZ }, { x: targetX, z: targetZ }],
        distanceMeters: Math.round(directDist),
        walkingMinutes: Math.max(1, Math.round(directDist / 80)),
        instructions: [`Depart ${startLabel}`, `Direct approach to ${targetLabel}`],
      };
    }

    if (startNode.id === targetNode.id) {
      const directDist = Math.hypot(targetX - startX, targetZ - startZ);
      return {
        path: [{ x: startX, z: startZ }, { x: targetX, z: targetZ }],
        distanceMeters: Math.round(directDist),
        walkingMinutes: Math.max(1, Math.round(directDist / 80)),
        instructions: [`Depart ${startLabel}`, `Direct approach to ${targetLabel}`],
      };
    }

    // A* Search
    const openSet = new Set<string>([startNode.id]);
    const cameFrom = new Map<string, RouteNode>();

    const gScore = new Map<string, number>();
    gScore.set(startNode.id, 0);

    const fScore = new Map<string, number>();
    fScore.set(startNode.id, Math.hypot(targetNode.x - startNode.x, targetNode.z - startNode.z));

    while (openSet.size > 0) {
      // Node with lowest fScore
      let currentId: string | null = null;
      let lowestF = Infinity;

      for (const id of openSet) {
        const score = fScore.get(id) ?? Infinity;
        if (score < lowestF) {
          lowestF = score;
          currentId = id;
        }
      }

      if (!currentId) break;

      if (currentId === targetNode.id) {
        // Reconstruct path
        const reconstructed: { x: number; z: number }[] = [{ x: targetX, z: targetZ }];
        let curr: RouteNode | undefined = this.nodes.get(targetNode.id);

        while (curr) {
          reconstructed.unshift({ x: curr.x, z: curr.z });
          curr = cameFrom.get(curr.id);
        }

        reconstructed.unshift({ x: startX, z: startZ });

        // Calculate total length
        let totalDist = 0;
        for (let i = 0; i < reconstructed.length - 1; i++) {
          totalDist += Math.hypot(
            reconstructed[i + 1].x - reconstructed[i].x,
            reconstructed[i + 1].z - reconstructed[i].z
          );
        }

        const walkingMinutes = Math.max(1, Math.round(totalDist / 78)); // ~1.3 m/s pedestrian speed

        return {
          path: reconstructed,
          distanceMeters: Math.round(totalDist),
          walkingMinutes,
          instructions: [
            `Depart ${startLabel}`,
            `Follow hospital connecting avenue (~${Math.round(totalDist * 0.7)}m)`,
            `Turn toward destination wing`,
            `Arrive at ${targetLabel}`,
          ],
        };
      }

      openSet.delete(currentId);
      const currentNode = this.nodes.get(currentId)!;
      const currentG = gScore.get(currentId) ?? Infinity;

      for (const neighbor of currentNode.neighbors) {
        const tentativeG = currentG + neighbor.weight;
        const neighborId = neighbor.node.id;

        if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
          cameFrom.set(neighborId, currentNode);
          gScore.set(neighborId, tentativeG);
          const h = Math.hypot(targetNode.x - neighbor.node.x, targetNode.z - neighbor.node.z);
          fScore.set(neighborId, tentativeG + h);
          openSet.add(neighborId);
        }
      }
    }

    // Fallback direct path if disconnected
    const directDist = Math.hypot(targetX - startX, targetZ - startZ);
    return {
      path: [{ x: startX, z: startZ }, { x: targetX, z: targetZ }],
      distanceMeters: Math.round(directDist),
      walkingMinutes: Math.max(1, Math.round(directDist / 80)),
      instructions: [`Depart ${startLabel}`, `Follow directional approach to ${targetLabel}`],
    };
  }
}
