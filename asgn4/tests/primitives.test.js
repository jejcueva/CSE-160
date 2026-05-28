const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createTexturedCubeData,
  createConeData,
  createSphereData,
} = require("../src/primitives.js");

function readVertex(geometry, vertexIndex) {
  const start = vertexIndex * geometry.stride;
  return geometry.vertices.slice(start, start + geometry.stride);
}

function approxEqual(actual, expected, tolerance = 0.00001) {
  assert.equal(Math.abs(actual - expected) <= tolerance, true, `${actual} should be close to ${expected}`);
}

test("textured cube data provides 36 vertices with position, UV, and normal data", () => {
  const geometry = createTexturedCubeData();

  assert.equal(geometry.stride, 8);
  assert.equal(geometry.vertexCount, 36);
  assert.equal(geometry.vertices.length, geometry.vertexCount * geometry.stride);

  const uvValues = geometry.vertices.filter((_, index) => {
    const fieldIndex = index % geometry.stride;
    return fieldIndex === 3 || fieldIndex === 4;
  });
  const normalValues = geometry.vertices.filter((_, index) => (index % geometry.stride) >= 5);

  assert.equal(uvValues.every((value) => value >= 0 && value <= 1), true);
  assert.equal(normalValues.every((value) => value >= -1 && value <= 1), true);

  const firstVertex = readVertex(geometry, 0);
  assert.deepEqual(firstVertex.slice(5, 8), [0, 0, 1]);
});

test("cone data is triangle aligned and includes normals", () => {
  const geometry = createConeData(12);

  assert.equal(geometry.stride, 8);
  assert.equal(geometry.vertexCount > 0, true);
  assert.equal(geometry.vertices.length, geometry.vertexCount * geometry.stride);

  for (let vertexIndex = 0; vertexIndex < geometry.vertexCount; vertexIndex += 1) {
    const vertex = readVertex(geometry, vertexIndex);
    const normalLength = Math.hypot(vertex[5], vertex[6], vertex[7]);
    approxEqual(normalLength, 1);
  }
});

test("cone data validates a minimum segment count", () => {
  assert.throws(() => createConeData(2), /segments/i);
});

test("sphere data creates unit-length normals and triangle-aligned vertices", () => {
  const geometry = createSphereData(8, 6);

  assert.equal(geometry.stride, 8);
  assert.equal(geometry.vertexCount, 8 * 6 * 6);
  assert.equal(geometry.vertices.length, geometry.vertexCount * geometry.stride);

  for (let vertexIndex = 0; vertexIndex < geometry.vertexCount; vertexIndex += 1) {
    const vertex = readVertex(geometry, vertexIndex);
    const positionLength = Math.hypot(vertex[0], vertex[1], vertex[2]);
    const normalLength = Math.hypot(vertex[5], vertex[6], vertex[7]);

    approxEqual(positionLength, 0.5);
    approxEqual(normalLength, 1);
    approxEqual(vertex[5], vertex[0] * 2);
    approxEqual(vertex[6], vertex[1] * 2);
    approxEqual(vertex[7], vertex[2] * 2);
  }
});

test("sphere data validates segment counts", () => {
  assert.throws(() => createSphereData(2, 6), /longitude/i);
  assert.throws(() => createSphereData(8, 2), /latitude/i);
});
