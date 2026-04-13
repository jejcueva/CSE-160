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
      createModelTriangle([28, 48, 38, 56, 34, 36], CARDINAL_COLORS.red),
      createModelTriangle([34, 36, 38, 56, 56, 56], CARDINAL_COLORS.red),
      createModelTriangle([34, 36, 56, 56, 68, 44], CARDINAL_COLORS.red),
      createModelTriangle([22, 35, 28, 48, 34, 36], CARDINAL_COLORS.red),
      createModelTriangle([22, 35, 18, 28, 30, 28], CARDINAL_COLORS.red),
      createModelTriangle([22, 35, 30, 28, 34, 36], CARDINAL_COLORS.red),
      createModelTriangle([22, 35, 30, 28, 38, 16], CARDINAL_COLORS.red),
      createModelTriangle([30, 28, 38, 16, 58, 16], CARDINAL_COLORS.red),
      createModelTriangle([30, 28, 58, 16, 68, 24], CARDINAL_COLORS.red),
    ]),
    wing: Object.freeze([
      createModelTriangle([40, 44, 54, 28, 34, 28], CARDINAL_COLORS.black),
    ]),
    tail: Object.freeze([
      createModelTriangle([66, 26, 74, 35, 82, 35], CARDINAL_COLORS.red),
      createModelTriangle([66, 26, 82, 35, 88, 12], CARDINAL_COLORS.black),
      createModelTriangle([66, 26, 88, 12, 74, 16], CARDINAL_COLORS.black),
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
