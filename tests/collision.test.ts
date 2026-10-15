import test from 'node:test';
import assert from 'node:assert/strict';
import { CollisionSystem } from '../src/world/collision.ts';

test('Collision system - Identifies point inside polygon footprint', () => {
  const collision = new CollisionSystem();
  // Register a 20m x 20m building centered at (100, 100)
  const perimeter = [
    { x: 90, z: 90 },
    { x: 110, z: 90 },
    { x: 110, z: 110 },
    { x: 90, z: 110 },
    { x: 90, z: 90 },
  ];
  collision.registerBuilding('test-bld-1', perimeter);

  // Center of building
  const centerRes = collision.checkCollision(100, 100, 0.75);
  assert.equal(centerRes.collides, true);
  assert.equal(centerRes.buildingId, 'test-bld-1');

  // Point right against the wall (within 0.75m radius buffer)
  const edgeRes = collision.checkCollision(89.5, 100, 0.75);
  assert.equal(edgeRes.collides, true);

  // Point safely outside (5m away)
  const outsideRes = collision.checkCollision(80, 100, 0.75);
  assert.equal(outsideRes.collides, false);
});

test('Collision system - Multiple buildings and distance checks', () => {
  const collision = new CollisionSystem();
  collision.registerBuilding('bld-a', [
    { x: 0, z: 0 },
    { x: 10, z: 0 },
    { x: 10, z: 10 },
    { x: 0, z: 10 },
    { x: 0, z: 0 },
  ]);
  collision.registerBuilding('bld-b', [
    { x: 50, z: 50 },
    { x: 60, z: 50 },
    { x: 60, z: 60 },
    { x: 50, z: 60 },
    { x: 50, z: 50 },
  ]);

  assert.equal(collision.checkCollision(5, 5).collides, true);
  assert.equal(collision.checkCollision(55, 55).collides, true);
  assert.equal(collision.checkCollision(25, 25).collides, false);
});
