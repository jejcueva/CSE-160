const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const matrixLibraryPath = path.join(__dirname, "..", "..", "asgn2", "lib", "cuon-matrix-cse160.js");
const matrixLibrarySource = fs.readFileSync(matrixLibraryPath, "utf8");

globalThis.window = globalThis;
vm.runInThisContext(`${matrixLibrarySource}\n;globalThis.Matrix4 = Matrix4;`);

const matrixUtils = require("../src/matrixUtils.js");
const {
  renderWorldScene,
} = require("../src/worldRenderer.js");
const {
  FOX_HOME,
} = require("../src/worldData.js");
const {
  FOX_COLORS,
} = require("../src/foxModel.js");
const {
  createStoryState,
} = require("../src/story.js");
const {
  createWorldState,
} = require("../src/worldState.js");

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

function collectWorldDraws(storyState = createStoryState()) {
  const draws = [];

  renderWorldScene({
    seconds: 1.25,
    worldState: createWorldState(),
    storyState,
    drawPrimitive(primitiveName, modelMatrix, color, textureIndex) {
      draws.push({
        primitiveName,
        modelMatrix,
        color,
        textureIndex,
      });
    },
    matrixUtils,
  });

  return draws;
}

test("world renderer draws the updated fox rig inside assignment 4 without throwing", () => {
  const draws = collectWorldDraws();

  const cubeDraws = draws.filter((draw) => draw.primitiveName === "cube");
  const coneDraws = draws.filter((draw) => draw.primitiveName === "cone");

  assert.equal(cubeDraws.length > 0, true);
  assert.equal(coneDraws.length > 0, true);
  assert.equal(draws.every((draw) => draw.modelMatrix.elements.length === 16), true);
});

test("world renderer places fox parts as one compact model near FOX_HOME", () => {
  const foxColorValues = new Set(Object.values(FOX_COLORS));
  const foxDraws = collectWorldDraws().filter((draw) => foxColorValues.has(draw.color));
  const bounds = getDrawBounds(foxDraws);

  assert.equal(foxDraws.some((draw) => draw.primitiveName === "cube"), true);
  assert.equal(foxDraws.some((draw) => draw.primitiveName === "cone"), true);
  assert.equal(bounds.width < 3.0, true, `fox width was ${bounds.width}`);
  assert.equal(bounds.minY > -0.05, true, `fox min y was ${bounds.minY}`);
  assert.equal(bounds.maxY < 2.0, true, `fox max y was ${bounds.maxY}`);
  assert.equal(bounds.depth < 3.0, true, `fox depth was ${bounds.depth}`);
  assert.equal(Math.abs(bounds.centerX - FOX_HOME.worldX) < 0.9, true, `fox center x was ${bounds.centerX}`);
  assert.equal(Math.abs(bounds.centerZ - FOX_HOME.worldZ) < 0.9, true, `fox center z was ${bounds.centerZ}`);
});
