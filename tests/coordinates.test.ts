import test from 'node:test';
import assert from 'node:assert/strict';
import {
  wgs84ToCartesian,
  cartesianToWgs84,
  cartesianDistance,
  UCH_ORIGIN,
  METERS_PER_DEGREE_LAT,
  METERS_PER_DEGREE_LON,
} from '../src/world/coordinates.ts';

test('Coordinate conversion - Origin maps exactly to (0, 0)', () => {
  const cart = wgs84ToCartesian(UCH_ORIGIN.lon, UCH_ORIGIN.lat);
  assert.ok(Math.abs(cart.x) < 1e-6, `Expected cart.x ~ 0, got ${cart.x}`);
  assert.ok(Math.abs(cart.z) < 1e-6, `Expected cart.z ~ 0, got ${cart.z}`);
});

test('Coordinate conversion - Inverse conversion is round-trip identity', () => {
  const testCoords = [
    { lon: 3.90380, lat: 7.40115 }, // Main Gate
    { lon: 3.90234, lat: 7.40283 }, // A&E
    { lon: 3.90456, lat: 7.40420 }, // ABH
    { lon: 3.90082, lat: 7.40234 }, // Paul Hendrickse
  ];

  for (const c of testCoords) {
    const cart = wgs84ToCartesian(c.lon, c.lat);
    const wgs = cartesianToWgs84(cart.x, cart.z);
    assert.ok(Math.abs(wgs.lon - c.lon) < 1e-8, `Longitude mismatch: ${wgs.lon} vs ${c.lon}`);
    assert.ok(Math.abs(wgs.lat - c.lat) < 1e-8, `Latitude mismatch: ${wgs.lat} vs ${c.lat}`);
  }
});

test('Coordinate conversion - Metric distances reflect real hospital dimensions', () => {
  // Distance from Main Gate to Central Ward Complex (~250-350m)
  const gateCart = wgs84ToCartesian(3.90380, 7.40115);
  const wardCart = wgs84ToCartesian(3.90244, 7.40334);
  const dist = cartesianDistance(gateCart, wardCart);

  assert.ok(dist > 200 && dist < 400, `Expected distance between 200m and 400m, got ${dist.toFixed(1)}m`);
});

test('Coordinate conversion - Scaling constants are physically accurate for UCH latitude', () => {
  assert.ok(METERS_PER_DEGREE_LAT > 110500 && METERS_PER_DEGREE_LAT < 110700);
  assert.ok(METERS_PER_DEGREE_LON > 110000 && METERS_PER_DEGREE_LON < 110600);
});
