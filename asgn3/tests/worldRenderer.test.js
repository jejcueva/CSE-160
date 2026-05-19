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
  createStoryState,
} = require("../src/story.js");
const {
  createWorldState,
} = require("../src/worldState.js");

test("world renderer draws the updated fox rig inside assignment 3 without throwing", () => {
  const draws = [];

  renderWorldScene({
    seconds: 1.25,
    worldState: createWorldState(),
    storyState: createStoryState(),
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

  const cubeDraws = draws.filter((draw) => draw.primitiveName === "cube");
  const coneDraws = draws.filter((draw) => draw.primitiveName === "cone");

  assert.equal(cubeDraws.length > 0, true);
  assert.equal(coneDraws.length > 0, true);
  assert.equal(draws.every((draw) => draw.modelMatrix.elements.length === 16), true);
});
