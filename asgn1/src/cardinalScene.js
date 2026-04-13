(function initCardinalSceneModule(globalScope) {
  function createColor(red, green, blue) {
    return Object.freeze([red, green, blue, 1]);
  }

  function createModelTriangle(vertices, color) {
    return Object.freeze({
      vertices: Object.freeze([...vertices]),
      color,
    });
  }

  const CARDINAL_COLORS = Object.freeze({
    red: createColor(0.86, 0.07, 0.2),
    black: createColor(0.11, 0.11, 0.11),
    white: createColor(0.96, 0.96, 0.95),
    yellow: createColor(0.98, 0.84, 0.12),
  });

  const CARDINAL_MODEL_PARTS = Object.freeze({
    headAndNeck: Object.freeze([
      createModelTriangle([21, 96, 32, 84, 23, 85], CARDINAL_COLORS.red),
      createModelTriangle([3, 74, 14, 79, 13, 74], CARDINAL_COLORS.yellow),
      createModelTriangle([13, 74, 20, 79, 21, 74], CARDINAL_COLORS.white),
      createModelTriangle([20, 79, 32, 84, 35, 74], CARDINAL_COLORS.white),
      createModelTriangle([20, 79, 35, 74, 22, 74], CARDINAL_COLORS.white),
      createModelTriangle([32, 84, 35, 74, 35, 52], CARDINAL_COLORS.black),
      createModelTriangle([22, 74, 35, 74, 35, 52], CARDINAL_COLORS.black),
      createModelTriangle([22, 74, 35, 52, 22, 52], CARDINAL_COLORS.black),
      createModelTriangle([22, 52, 28, 41, 22, 35], CARDINAL_COLORS.black),
      createModelTriangle([17, 76, 20, 78, 20, 73], CARDINAL_COLORS.black),
    ]),
    body: Object.freeze([
      createModelTriangle([22, 35, 30, 48, 40, 42], CARDINAL_COLORS.red),
      createModelTriangle([30, 48, 38, 56, 52, 56], CARDINAL_COLORS.red),
      createModelTriangle([30, 48, 52, 56, 62, 46], CARDINAL_COLORS.red),
      createModelTriangle([30, 48, 62, 46, 40, 42], CARDINAL_COLORS.red),
      createModelTriangle([22, 35, 16, 28, 24, 20], CARDINAL_COLORS.red),
      createModelTriangle([22, 35, 24, 20, 34, 16], CARDINAL_COLORS.red),
      createModelTriangle([22, 35, 34, 16, 40, 22], CARDINAL_COLORS.red),
      createModelTriangle([24, 20, 34, 16, 58, 16], CARDINAL_COLORS.red),
      createModelTriangle([24, 20, 58, 16, 64, 22], CARDINAL_COLORS.red),
      createModelTriangle([24, 20, 64, 22, 40, 22], CARDINAL_COLORS.red),
    ]),
    wing: Object.freeze([
      createModelTriangle([41, 42, 56, 27, 34, 27], CARDINAL_COLORS.black),
    ]),
    tail: Object.freeze([
      createModelTriangle([70, 26, 78, 34, 86, 34], CARDINAL_COLORS.red),
      createModelTriangle([70, 26, 86, 34, 89, 14], CARDINAL_COLORS.black),
      createModelTriangle([70, 26, 89, 14, 75, 18], CARDINAL_COLORS.black),
    ]),
    feet: Object.freeze([
      createModelTriangle([34, 16, 38, 3, 31, 0], CARDINAL_COLORS.red),
      createModelTriangle([27, 0, 31, 0, 34, 10], CARDINAL_COLORS.black),
      createModelTriangle([29, 1, 31, 4, 32, 0], CARDINAL_COLORS.white),
      createModelTriangle([49, 16, 55, 7, 50, 0], CARDINAL_COLORS.red),
      createModelTriangle([44, 0, 50, 0, 55, 7], CARDINAL_COLORS.white),
      createModelTriangle([48, 1, 50, 5, 52, 1], CARDINAL_COLORS.black),
    ]),
  });

  function getCardinalModelParts() {
    return CARDINAL_MODEL_PARTS;
  }

  function getCardinalModelTriangles() {
    return Object.freeze(Object.values(CARDINAL_MODEL_PARTS).flat());
  }

  function buildCardinalSceneFromModel(modelTriangle) {
    return Object.freeze(
      getCardinalModelTriangles().map(({ vertices, color }) => modelTriangle(vertices, color))
    );
  }

  const api = Object.freeze({
    CARDINAL_COLORS,
    getCardinalModelParts,
    getCardinalModelTriangles,
    buildCardinalSceneFromModel,
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  Object.assign(globalScope, api);
}(typeof globalThis !== "undefined" ? globalThis : this));
