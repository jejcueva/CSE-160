(function initPrimitives(globalScope) {
  const STRIDE = 8;

  function normalize3(vector) {
    const length = Math.hypot(vector[0], vector[1], vector[2]);

    if (length === 0) {
      return [0, 1, 0];
    }

    return [
      vector[0] / length,
      vector[1] / length,
      vector[2] / length,
    ];
  }

  function pushVertex(vertices, position, uv, normal) {
    vertices.push(
      position[0], position[1], position[2],
      uv[0], uv[1],
      normal[0], normal[1], normal[2],
    );
  }

  function createTexturedCubeData() {
    const vertices = [];

    function pushFace(corners, normal) {
      pushVertex(vertices, corners[0], [0, 0], normal);
      pushVertex(vertices, corners[1], [1, 0], normal);
      pushVertex(vertices, corners[2], [1, 1], normal);

      pushVertex(vertices, corners[0], [0, 0], normal);
      pushVertex(vertices, corners[2], [1, 1], normal);
      pushVertex(vertices, corners[3], [0, 1], normal);
    }

    pushFace([
      [-0.5, -0.5, 0.5],
      [0.5, -0.5, 0.5],
      [0.5, 0.5, 0.5],
      [-0.5, 0.5, 0.5],
    ], [0, 0, 1]);

    pushFace([
      [0.5, -0.5, -0.5],
      [-0.5, -0.5, -0.5],
      [-0.5, 0.5, -0.5],
      [0.5, 0.5, -0.5],
    ], [0, 0, -1]);

    pushFace([
      [-0.5, 0.5, 0.5],
      [0.5, 0.5, 0.5],
      [0.5, 0.5, -0.5],
      [-0.5, 0.5, -0.5],
    ], [0, 1, 0]);

    pushFace([
      [-0.5, -0.5, -0.5],
      [0.5, -0.5, -0.5],
      [0.5, -0.5, 0.5],
      [-0.5, -0.5, 0.5],
    ], [0, -1, 0]);

    pushFace([
      [0.5, -0.5, 0.5],
      [0.5, -0.5, -0.5],
      [0.5, 0.5, -0.5],
      [0.5, 0.5, 0.5],
    ], [1, 0, 0]);

    pushFace([
      [-0.5, -0.5, -0.5],
      [-0.5, -0.5, 0.5],
      [-0.5, 0.5, 0.5],
      [-0.5, 0.5, -0.5],
    ], [-1, 0, 0]);

    return Object.freeze({
      stride: STRIDE,
      vertexCount: vertices.length / STRIDE,
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
      const startSideNormal = normalize3([Math.cos(startAngle), radius, Math.sin(startAngle)]);
      const endSideNormal = normalize3([Math.cos(endAngle), radius, Math.sin(endAngle)]);
      const middleSideNormal = normalize3([
        Math.cos((startAngle + endAngle) / 2),
        radius,
        Math.sin((startAngle + endAngle) / 2),
      ]);

      pushVertex(vertices, [0, apexY, 0], [(startU + endU) / 2, 1], middleSideNormal);
      pushVertex(vertices, [startX, baseY, startZ], [startU, 0], startSideNormal);
      pushVertex(vertices, [endX, baseY, endZ], [endU, 0], endSideNormal);

      pushVertex(vertices, [0, baseY, 0], [0.5, 0.5], [0, -1, 0]);
      pushVertex(
        vertices,
        [endX, baseY, endZ],
        [(Math.cos(endAngle) * 0.5) + 0.5, (Math.sin(endAngle) * 0.5) + 0.5],
        [0, -1, 0],
      );
      pushVertex(
        vertices,
        [startX, baseY, startZ],
        [(Math.cos(startAngle) * 0.5) + 0.5, (Math.sin(startAngle) * 0.5) + 0.5],
        [0, -1, 0],
      );
    }

    return Object.freeze({
      stride: STRIDE,
      vertexCount: vertices.length / STRIDE,
      vertices,
    });
  }

  function createSphereData(longitudeSegments = 24, latitudeSegments = 16) {
    if (!Number.isInteger(longitudeSegments) || longitudeSegments < 3) {
      throw new Error("Sphere longitude segments must be an integer greater than or equal to 3.");
    }

    if (!Number.isInteger(latitudeSegments) || latitudeSegments < 3) {
      throw new Error("Sphere latitude segments must be an integer greater than or equal to 3.");
    }

    const vertices = [];
    const radius = 0.5;

    function createSphereVertex(longitudeIndex, latitudeIndex) {
      const theta = (longitudeIndex / longitudeSegments) * Math.PI * 2;
      const phi = (latitudeIndex / latitudeSegments) * Math.PI;
      const sinPhi = Math.sin(phi);
      const normal = [
        Math.cos(theta) * sinPhi,
        Math.cos(phi),
        Math.sin(theta) * sinPhi,
      ];

      return Object.freeze({
        position: [
          normal[0] * radius,
          normal[1] * radius,
          normal[2] * radius,
        ],
        uv: [
          longitudeIndex / longitudeSegments,
          1 - (latitudeIndex / latitudeSegments),
        ],
        normal,
      });
    }

    for (let lat = 0; lat < latitudeSegments; lat += 1) {
      for (let lon = 0; lon < longitudeSegments; lon += 1) {
        const topLeft = createSphereVertex(lon, lat);
        const topRight = createSphereVertex(lon + 1, lat);
        const bottomRight = createSphereVertex(lon + 1, lat + 1);
        const bottomLeft = createSphereVertex(lon, lat + 1);

        pushVertex(vertices, topLeft.position, topLeft.uv, topLeft.normal);
        pushVertex(vertices, bottomLeft.position, bottomLeft.uv, bottomLeft.normal);
        pushVertex(vertices, bottomRight.position, bottomRight.uv, bottomRight.normal);

        pushVertex(vertices, topLeft.position, topLeft.uv, topLeft.normal);
        pushVertex(vertices, bottomRight.position, bottomRight.uv, bottomRight.normal);
        pushVertex(vertices, topRight.position, topRight.uv, topRight.normal);
      }
    }

    return Object.freeze({
      stride: STRIDE,
      vertexCount: vertices.length / STRIDE,
      vertices,
    });
  }

  const api = Object.freeze({
    createConeData,
    createSphereData,
    createTexturedCubeData,
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  Object.assign(globalScope, api);
}(typeof globalThis !== "undefined" ? globalThis : this));
