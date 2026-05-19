(function initPrimitives(globalScope) {
  function createTexturedCubeData() {
    const vertices = [];

    function pushFace(corners) {
      vertices.push(
        ...corners[0], 0, 0,
        ...corners[1], 1, 0,
        ...corners[2], 1, 1,

        ...corners[0], 0, 0,
        ...corners[2], 1, 1,
        ...corners[3], 0, 1,
      );
    }

    pushFace([
      [-0.5, -0.5, 0.5],
      [0.5, -0.5, 0.5],
      [0.5, 0.5, 0.5],
      [-0.5, 0.5, 0.5],
    ]);

    pushFace([
      [0.5, -0.5, -0.5],
      [-0.5, -0.5, -0.5],
      [-0.5, 0.5, -0.5],
      [0.5, 0.5, -0.5],
    ]);

    pushFace([
      [-0.5, 0.5, 0.5],
      [0.5, 0.5, 0.5],
      [0.5, 0.5, -0.5],
      [-0.5, 0.5, -0.5],
    ]);

    pushFace([
      [-0.5, -0.5, -0.5],
      [0.5, -0.5, -0.5],
      [0.5, -0.5, 0.5],
      [-0.5, -0.5, 0.5],
    ]);

    pushFace([
      [0.5, -0.5, 0.5],
      [0.5, -0.5, -0.5],
      [0.5, 0.5, -0.5],
      [0.5, 0.5, 0.5],
    ]);

    pushFace([
      [-0.5, -0.5, -0.5],
      [-0.5, -0.5, 0.5],
      [-0.5, 0.5, 0.5],
      [-0.5, 0.5, -0.5],
    ]);

    return Object.freeze({
      stride: 5,
      vertexCount: vertices.length / 5,
      vertices,
    });
  }

  function createConeData(segments = 18) {
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
      const startU = index / segments;
      const endU = (index + 1) / segments;

      vertices.push(
        0, apexY, 0, (startU + endU) / 2, 1,
        startX, baseY, startZ, startU, 0,
        endX, baseY, endZ, endU, 0,

        0, baseY, 0, 0.5, 0.5,
        endX, baseY, endZ, (Math.cos(endAngle) * 0.5) + 0.5, (Math.sin(endAngle) * 0.5) + 0.5,
        startX, baseY, startZ, (Math.cos(startAngle) * 0.5) + 0.5, (Math.sin(startAngle) * 0.5) + 0.5,
      );
    }

    return Object.freeze({
      stride: 5,
      vertexCount: vertices.length / 5,
      vertices,
    });
  }

  const api = Object.freeze({
    createConeData,
    createTexturedCubeData,
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  Object.assign(globalScope, api);
}(typeof globalThis !== "undefined" ? globalThis : this));
