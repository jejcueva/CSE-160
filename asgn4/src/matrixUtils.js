(function initMatrixUtils(globalScope) {
  function createIdentityMatrix() {
    const MatrixCtor = globalScope.Matrix4;

    if (!MatrixCtor) {
      throw new Error("Matrix4 is not available.");
    }

    return new MatrixCtor();
  }

  function cloneMatrix(source) {
    const matrix = createIdentityMatrix();
    matrix.elements.set(source.elements);
    return matrix;
  }

  function withTranslation(source, x, y, z) {
    const matrix = cloneMatrix(source);
    matrix.translate(x, y, z);
    return matrix;
  }

  function withRotation(source, angle, x, y, z) {
    const matrix = cloneMatrix(source);
    matrix.rotate(angle, x, y, z);
    return matrix;
  }

  function withScale(source, x, y, z) {
    const matrix = cloneMatrix(source);
    matrix.scale(x, y, z);
    return matrix;
  }

  function createPlacementMatrix(x, y, z, yawDegrees, scale = 1) {
    const values = [x, y, z, yawDegrees, scale];

    if (!values.every(Number.isFinite)) {
      throw new Error("Placement matrix values must be finite numbers.");
    }

    const matrix = createIdentityMatrix();
    const e = matrix.elements;
    const radians = (yawDegrees * Math.PI) / 180;
    const cosYaw = Math.cos(radians);
    const sinYaw = Math.sin(radians);

    e[0] = cosYaw * scale;
    e[1] = 0;
    e[2] = -sinYaw * scale;
    e[3] = 0;
    e[4] = 0;
    e[5] = scale;
    e[6] = 0;
    e[7] = 0;
    e[8] = sinYaw * scale;
    e[9] = 0;
    e[10] = cosYaw * scale;
    e[11] = 0;
    e[12] = x;
    e[13] = y;
    e[14] = z;
    e[15] = 1;

    return matrix;
  }

  function multiplyModelMatrices(parentMatrix, localMatrix) {
    const parent = parentMatrix.elements;
    const local = localMatrix.elements;
    const matrix = createIdentityMatrix();
    const result = new Float32Array(16);

    for (let column = 0; column < 4; column += 1) {
      for (let row = 0; row < 4; row += 1) {
        result[(column * 4) + row] =
          (parent[row] * local[column * 4])
          + (parent[4 + row] * local[(column * 4) + 1])
          + (parent[8 + row] * local[(column * 4) + 2])
          + (parent[12 + row] * local[(column * 4) + 3]);
      }
    }

    matrix.elements.set(result);
    return matrix;
  }

  function createNormalMatrixElements(source) {
    const e = source.elements;
    const a00 = e[0];
    const a01 = e[4];
    const a02 = e[8];
    const a10 = e[1];
    const a11 = e[5];
    const a12 = e[9];
    const a20 = e[2];
    const a21 = e[6];
    const a22 = e[10];
    const determinant = (a00 * ((a11 * a22) - (a12 * a21)))
      - (a01 * ((a10 * a22) - (a12 * a20)))
      + (a02 * ((a10 * a21) - (a11 * a20)));

    if (Math.abs(determinant) < 0.000001) {
      throw new Error("Cannot create a normal matrix for a singular model matrix.");
    }

    const inverse00 = ((a11 * a22) - (a12 * a21)) / determinant;
    const inverse01 = ((a02 * a21) - (a01 * a22)) / determinant;
    const inverse02 = ((a01 * a12) - (a02 * a11)) / determinant;
    const inverse10 = ((a12 * a20) - (a10 * a22)) / determinant;
    const inverse11 = ((a00 * a22) - (a02 * a20)) / determinant;
    const inverse12 = ((a02 * a10) - (a00 * a12)) / determinant;
    const inverse20 = ((a10 * a21) - (a11 * a20)) / determinant;
    const inverse21 = ((a01 * a20) - (a00 * a21)) / determinant;
    const inverse22 = ((a00 * a11) - (a01 * a10)) / determinant;

    return new Float32Array([
      inverse00, inverse01, inverse02, 0,
      inverse10, inverse11, inverse12, 0,
      inverse20, inverse21, inverse22, 0,
      0, 0, 0, 1,
    ]);
  }

  const api = Object.freeze({
    cloneMatrix,
    createIdentityMatrix,
    createNormalMatrixElements,
    createPlacementMatrix,
    multiplyModelMatrices,
    withRotation,
    withScale,
    withTranslation,
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  Object.assign(globalScope, api);
}(typeof globalThis !== "undefined" ? globalThis : this));
