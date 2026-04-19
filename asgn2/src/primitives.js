(function initPrimitives(globalScope) {
  function createCubeVertices() {
    return [
      -0.5, -0.5, 0.5,
      0.5, -0.5, 0.5,
      0.5, 0.5, 0.5,

      -0.5, -0.5, 0.5,
      0.5, 0.5, 0.5,
      -0.5, 0.5, 0.5,

      -0.5, -0.5, -0.5,
      -0.5, 0.5, -0.5,
      0.5, 0.5, -0.5,

      -0.5, -0.5, -0.5,
      0.5, 0.5, -0.5,
      0.5, -0.5, -0.5,

      -0.5, 0.5, -0.5,
      -0.5, 0.5, 0.5,
      0.5, 0.5, 0.5,

      -0.5, 0.5, -0.5,
      0.5, 0.5, 0.5,
      0.5, 0.5, -0.5,

      -0.5, -0.5, -0.5,
      0.5, -0.5, -0.5,
      0.5, -0.5, 0.5,

      -0.5, -0.5, -0.5,
      0.5, -0.5, 0.5,
      -0.5, -0.5, 0.5,

      0.5, -0.5, -0.5,
      0.5, 0.5, -0.5,
      0.5, 0.5, 0.5,

      0.5, -0.5, -0.5,
      0.5, 0.5, 0.5,
      0.5, -0.5, 0.5,

      -0.5, -0.5, -0.5,
      -0.5, -0.5, 0.5,
      -0.5, 0.5, 0.5,

      -0.5, -0.5, -0.5,
      -0.5, 0.5, 0.5,
      -0.5, 0.5, -0.5,
    ];
  }

  function createConeVertices(segments = 18) {
    if (!Number.isInteger(segments) || segments < 3) {
      throw new Error("Cone segments must be an integer greater than or equal to 3.");
    }

    const vertices = [];
    const radius = 0.5;
    const apexY = 0.5;
    const baseY = -0.5;

    for (let index = 0; index < segments; index += 1) {
      const startAngle = (index / segments) * Math.PI * 2;
      const endAngle = ((index + 1) / segments) * Math.PI * 2;

      const startX = Math.cos(startAngle) * radius;
      const startZ = Math.sin(startAngle) * radius;
      const endX = Math.cos(endAngle) * radius;
      const endZ = Math.sin(endAngle) * radius;

      vertices.push(
        0, apexY, 0,
        startX, baseY, startZ,
        endX, baseY, endZ,
      );

      vertices.push(
        0, baseY, 0,
        endX, baseY, endZ,
        startX, baseY, startZ,
      );
    }

    return vertices;
  }

  const api = Object.freeze({
    createCubeVertices,
    createConeVertices,
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  Object.assign(globalScope, api);
}(typeof globalThis !== "undefined" ? globalThis : this));
