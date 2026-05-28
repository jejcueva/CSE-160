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
  renderAssignment4Showcase,
} = require("../src/assignment4Scene.js");

test("assignment 4 showcase draws spheres, light markers, and OBJ model", () => {
  const draws = [];

  renderAssignment4Showcase({
    seconds: 2,
    lightPosition: [2, 3, 4],
    spotLightPosition: [-2, 5, 1],
    objModelReady: true,
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

  assert.equal(draws.some((draw) => draw.primitiveName === "sphere"), true);
  assert.equal(draws.some((draw) => draw.primitiveName === "cube"), true);
  assert.equal(draws.some((draw) => draw.primitiveName === "objModel"), true);
  assert.equal(draws.every((draw) => draw.modelMatrix.elements.length === 16), true);
});
