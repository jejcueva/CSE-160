const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createTexturedCubeData,
  createConeData,
} = require("../src/primitives.js");

test("textured cube data provides 36 vertices with position and UV data", () => {
  const geometry = createTexturedCubeData();

  assert.equal(geometry.stride, 5);
  assert.equal(geometry.vertexCount, 36);
  assert.equal(geometry.vertices.length, geometry.vertexCount * geometry.stride);

  const uvValues = geometry.vertices.filter((_, index) => (index % geometry.stride) >= 3);
  assert.equal(uvValues.every((value) => value >= 0 && value <= 1), true);
});

test("cone data is triangle aligned and uses the same interleaved stride", () => {
  const geometry = createConeData(12);

  assert.equal(geometry.stride, 5);
  assert.equal(geometry.vertexCount > 0, true);
  assert.equal(geometry.vertices.length, geometry.vertexCount * geometry.stride);
});

test("cone data validates a minimum segment count", () => {
  assert.throws(() => createConeData(2), /segments/i);
});
