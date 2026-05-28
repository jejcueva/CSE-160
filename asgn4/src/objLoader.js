(function initObjLoader(globalScope) {
  const STRIDE = 8;

  function parseIndex(value, listLength) {
    if (!value) {
      return null;
    }

    const parsed = Number.parseInt(value, 10);

    if (!Number.isInteger(parsed) || parsed === 0) {
      return null;
    }

    return parsed > 0 ? parsed - 1 : listLength + parsed;
  }

  function subtract3(a, b) {
    return [
      a[0] - b[0],
      a[1] - b[1],
      a[2] - b[2],
    ];
  }

  function cross3(a, b) {
    return [
      (a[1] * b[2]) - (a[2] * b[1]),
      (a[2] * b[0]) - (a[0] * b[2]),
      (a[0] * b[1]) - (a[1] * b[0]),
    ];
  }

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

  function parseFaceToken(token, positions, uvs, normals) {
    const [positionIndexText, uvIndexText, normalIndexText] = token.split("/");
    const positionIndex = parseIndex(positionIndexText, positions.length);

    if (positionIndex === null || !positions[positionIndex]) {
      throw new Error(`OBJ face references a missing position: ${token}`);
    }

    const uvIndex = parseIndex(uvIndexText, uvs.length);
    const normalIndex = parseIndex(normalIndexText, normals.length);

    return Object.freeze({
      position: positions[positionIndex],
      uv: uvIndex === null || !uvs[uvIndex] ? [0, 0] : uvs[uvIndex],
      normal: normalIndex === null || !normals[normalIndex] ? null : normals[normalIndex],
    });
  }

  function createFaceNormal(a, b, c) {
    return normalize3(cross3(
      subtract3(b.position, a.position),
      subtract3(c.position, a.position),
    ));
  }

  function pushVertex(vertices, vertex, fallbackNormal) {
    const normal = vertex.normal || fallbackNormal;

    vertices.push(
      vertex.position[0], vertex.position[1], vertex.position[2],
      vertex.uv[0], vertex.uv[1],
      normal[0], normal[1], normal[2],
    );
  }

  function parseObjGeometry(source) {
    const positions = [];
    const uvs = [];
    const normals = [];
    const vertices = [];
    const lines = source.split(/\r?\n/);

    lines.forEach((line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        return;
      }

      const [keyword, ...parts] = trimmed.split(/\s+/);

      if (keyword === "v") {
        positions.push(parts.slice(0, 3).map(Number));
        return;
      }

      if (keyword === "vt") {
        uvs.push(parts.slice(0, 2).map(Number));
        return;
      }

      if (keyword === "vn") {
        normals.push(normalize3(parts.slice(0, 3).map(Number)));
        return;
      }

      if (keyword !== "f") {
        return;
      }

      if (parts.length < 3) {
        throw new Error("OBJ face needs at least three vertices.");
      }

      const faceVertices = parts.map((part) => parseFaceToken(part, positions, uvs, normals));

      for (let index = 1; index < faceVertices.length - 1; index += 1) {
        const triangle = [
          faceVertices[0],
          faceVertices[index],
          faceVertices[index + 1],
        ];
        const fallbackNormal = createFaceNormal(triangle[0], triangle[1], triangle[2]);

        triangle.forEach((vertex) => pushVertex(vertices, vertex, fallbackNormal));
      }
    });

    if (vertices.length === 0) {
      throw new Error("OBJ file did not contain drawable faces.");
    }

    return Object.freeze({
      stride: STRIDE,
      vertexCount: vertices.length / STRIDE,
      vertices,
    });
  }

  async function loadObjGeometry(src) {
    const response = await fetch(src);

    if (!response.ok) {
      throw new Error(`Failed to load OBJ model: ${src}`);
    }

    return parseObjGeometry(await response.text());
  }

  const api = Object.freeze({
    loadObjGeometry,
    parseObjGeometry,
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  Object.assign(globalScope, api);
}(typeof globalThis !== "undefined" ? globalThis : this));
