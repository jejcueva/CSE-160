const test = require("node:test");
const assert = require("node:assert/strict");

const {
  parseObjGeometry,
} = require("../src/objLoader.js");

function approxEqual(actual, expected, tolerance = 0.00001) {
  assert.equal(Math.abs(actual - expected) <= tolerance, true, `${actual} should be close to ${expected}`);
}

test("OBJ parser triangulates faces and preserves normals", () => {
  const source = `
v 0 0 0
v 1 0 0
v 1 1 0
v 0 1 0
vt 0 0
vt 1 0
vt 1 1
vt 0 1
vn 0 0 1
f 1/1/1 2/2/1 3/3/1 4/4/1
`;

  const geometry = parseObjGeometry(source);

  assert.equal(geometry.stride, 8);
  assert.equal(geometry.vertexCount, 6);
  assert.equal(geometry.vertices.length, 48);

  for (let index = 0; index < geometry.vertexCount; index += 1) {
    const normalOffset = (index * geometry.stride) + 5;
    assert.deepEqual(geometry.vertices.slice(normalOffset, normalOffset + 3), [0, 0, 1]);
  }
});

test("OBJ parser computes face normals when they are missing", () => {
  const source = `
v 0 0 0
v 1 0 0
v 0 1 0
f 1 2 3
`;

  const geometry = parseObjGeometry(source);
  const normal = geometry.vertices.slice(5, 8);

  approxEqual(normal[0], 0);
  approxEqual(normal[1], 0);
  approxEqual(normal[2], 1);
});

test("OBJ parser rejects files without drawable faces", () => {
  assert.throws(() => parseObjGeometry("v 0 0 0"), /faces/i);
});
