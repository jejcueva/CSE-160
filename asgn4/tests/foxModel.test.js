const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const matrixLibraryPath = path.join(__dirname, "..", "lib", "cuon-matrix-cse160.js");
const matrixLibrarySource = fs.readFileSync(matrixLibraryPath, "utf8");

globalThis.window = globalThis;
vm.runInThisContext(`${matrixLibrarySource}\n;globalThis.Matrix4 = Matrix4;`);

const matrixUtils = require("../src/matrixUtils.js");
const {
  FOX_HOME,
} = require("../src/worldData.js");

const {
  BODY_DIMENSIONS,
  createDefaultFoxState,
  LEG_LAYOUT,
  renderFox,
  TAIL_LAYOUT,
  TAIL_COUNT,
} = require("../src/foxModel.js");

const UNIT_CUBE_CORNERS = Object.freeze([
  [-0.5, -0.5, -0.5],
  [-0.5, -0.5, 0.5],
  [-0.5, 0.5, -0.5],
  [-0.5, 0.5, 0.5],
  [0.5, -0.5, -0.5],
  [0.5, -0.5, 0.5],
  [0.5, 0.5, -0.5],
  [0.5, 0.5, 0.5],
]);

function transformPoint(matrix, point) {
  const e = matrix.elements;

  return [
    (e[0] * point[0]) + (e[4] * point[1]) + (e[8] * point[2]) + e[12],
    (e[1] * point[0]) + (e[5] * point[1]) + (e[9] * point[2]) + e[13],
    (e[2] * point[0]) + (e[6] * point[1]) + (e[10] * point[2]) + e[14],
  ];
}

function collectFoxDraws(placeModelMatrix = (matrix) => matrix) {
  const draws = [];

  renderFox({
    pose: createDefaultFoxState(),
    drawCube(modelMatrix, color) {
      draws.push({
        primitiveName: "cube",
        modelMatrix: placeModelMatrix(modelMatrix),
        color,
      });
    },
    drawCone(modelMatrix, color) {
      draws.push({
        primitiveName: "cone",
        modelMatrix: placeModelMatrix(modelMatrix),
        color,
      });
    },
    matrixUtils,
  });

  return draws;
}

function getDrawBounds(draws) {
  const bounds = {
    minX: Infinity,
    minY: Infinity,
    minZ: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
    maxZ: -Infinity,
  };

  draws.forEach((draw) => {
    UNIT_CUBE_CORNERS.forEach((corner) => {
      const point = transformPoint(draw.modelMatrix, corner);
      bounds.minX = Math.min(bounds.minX, point[0]);
      bounds.minY = Math.min(bounds.minY, point[1]);
      bounds.minZ = Math.min(bounds.minZ, point[2]);
      bounds.maxX = Math.max(bounds.maxX, point[0]);
      bounds.maxY = Math.max(bounds.maxY, point[1]);
      bounds.maxZ = Math.max(bounds.maxZ, point[2]);
    });
  });

  return {
    minY: bounds.minY,
    maxY: bounds.maxY,
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
    depth: bounds.maxZ - bounds.minZ,
    centerX: (bounds.minX + bounds.maxX) / 2,
    centerY: (bounds.minY + bounds.maxY) / 2,
    centerZ: (bounds.minZ + bounds.maxZ) / 2,
  };
}

test("fox model keeps the nine-tailed updated silhouette from assignment 2", () => {
  assert.equal(TAIL_COUNT, 9);
});

test("tail layout uses the assignment 2 socketed attachment point", () => {
  const rearBodyEdgeX = BODY_DIMENSIONS.length / 2;
  const centerTailSocketX = TAIL_LAYOUT.socketOffset[0] + TAIL_LAYOUT.rootOffsetX;

  assert.equal(centerTailSocketX < rearBodyEdgeX, true);
  assert.equal(TAIL_LAYOUT.socketScale[0] > 0, true);
});

test("leg layout preserves the articulated paw and separate toe proportions", () => {
  assert.equal(LEG_LAYOUT.upperLength > LEG_LAYOUT.lowerLength, true);
  assert.equal(LEG_LAYOUT.lowerLength > LEG_LAYOUT.pawLength, true);
  assert.equal(LEG_LAYOUT.toeLength > LEG_LAYOUT.pawWidth, true);
});

test("local fox draw bounds stay compact around the origin", () => {
  const bounds = getDrawBounds(collectFoxDraws());

  assert.equal(bounds.width < 1.8, true, `fox width was ${bounds.width}`);
  assert.equal(bounds.height < 1.35, true, `fox height was ${bounds.height}`);
  assert.equal(bounds.depth < 1.3, true, `fox depth was ${bounds.depth}`);
  assert.equal(Math.abs(bounds.centerX) < 0.35, true, `fox center x was ${bounds.centerX}`);
  assert.equal(Math.abs(bounds.centerZ) < 0.35, true, `fox center z was ${bounds.centerZ}`);
});

test("placed fox remains compact and centered near its world home", () => {
  const placement = matrixUtils.createPlacementMatrix(
    FOX_HOME.worldX,
    0.9,
    FOX_HOME.worldZ,
    FOX_HOME.yaw,
    1.35,
  );
  const draws = collectFoxDraws((localMatrix) => matrixUtils.multiplyModelMatrices(placement, localMatrix));
  const bounds = getDrawBounds(draws);

  assert.equal(bounds.width < 3.0, true, `placed fox width was ${bounds.width}`);
  assert.equal(bounds.minY > -0.05, true, `placed fox min y was ${bounds.minY}`);
  assert.equal(bounds.maxY < 2.0, true, `placed fox max y was ${bounds.maxY}`);
  assert.equal(bounds.depth < 3.0, true, `placed fox depth was ${bounds.depth}`);
  assert.equal(Math.abs(bounds.centerX - FOX_HOME.worldX) < 0.9, true, `placed fox center x was ${bounds.centerX}`);
  assert.equal(Math.abs(bounds.centerZ - FOX_HOME.worldZ) < 0.9, true, `placed fox center z was ${bounds.centerZ}`);
});
