const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const matrixLibraryPath = path.join(__dirname, "..", "lib", "cuon-matrix-cse160.js");
const matrixLibrarySource = fs.readFileSync(matrixLibraryPath, "utf8");

globalThis.window = globalThis;
vm.runInThisContext(`${matrixLibrarySource}\n;globalThis.Matrix4 = Matrix4;`);

const {
  createPlacementMatrix,
  createIdentityMatrix,
  createNormalMatrixElements,
  multiplyModelMatrices,
} = require("../src/matrixUtils.js");

function approxEqual(actual, expected, tolerance = 0.00001) {
  assert.equal(Math.abs(actual - expected) <= tolerance, true, `${actual} should be close to ${expected}`);
}

function transformPoint(matrix, point) {
  const e = matrix.elements;

  return [
    (e[0] * point[0]) + (e[4] * point[1]) + (e[8] * point[2]) + e[12],
    (e[1] * point[0]) + (e[5] * point[1]) + (e[9] * point[2]) + e[13],
    (e[2] * point[0]) + (e[6] * point[1]) + (e[10] * point[2]) + e[14],
  ];
}

test("normal matrix uses inverse transpose for non-uniform scale", () => {
  const modelMatrix = createIdentityMatrix();
  modelMatrix.scale(2, 4, 0.5);

  const normalMatrix = createNormalMatrixElements(modelMatrix);

  approxEqual(normalMatrix[0], 0.5);
  approxEqual(normalMatrix[5], 0.25);
  approxEqual(normalMatrix[10], 2);
  assert.equal(normalMatrix[15], 1);
});

test("normal matrix throws for singular transforms", () => {
  const modelMatrix = createIdentityMatrix();
  modelMatrix.scale(1, 0, 1);

  assert.throws(() => createNormalMatrixElements(modelMatrix), /normal matrix/i);
});

test("placement matrix keeps world translation separate from yaw and scale", () => {
  const placement = createPlacementMatrix(6, 0.28, -4, 90, 2);

  const origin = transformPoint(placement, [0, 0, 0]);
  const forward = transformPoint(placement, [1, 0, 0]);

  approxEqual(origin[0], 6);
  approxEqual(origin[1], 0.28);
  approxEqual(origin[2], -4);
  approxEqual(forward[0], 6);
  approxEqual(forward[1], 0.28);
  approxEqual(forward[2], -6);
});

test("matrix multiply composes parent placement with local model in column-major order", () => {
  const placement = createPlacementMatrix(6, 0.28, -4, 90, 2);
  const localModel = createIdentityMatrix();
  localModel.translate(0.5, 0.25, 0);
  localModel.scale(0.4, 0.2, 0.4);

  const composed = multiplyModelMatrices(placement, localModel);
  const composedCenter = transformPoint(composed, [0, 0, 0]);
  const expectedCenter = transformPoint(placement, [0.5, 0.25, 0]);

  approxEqual(composedCenter[0], expectedCenter[0]);
  approxEqual(composedCenter[1], expectedCenter[1]);
  approxEqual(composedCenter[2], expectedCenter[2]);
});
