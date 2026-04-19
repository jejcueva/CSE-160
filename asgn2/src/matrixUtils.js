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

  const api = Object.freeze({
    createIdentityMatrix,
    cloneMatrix,
    withTranslation,
    withRotation,
    withScale,
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  Object.assign(globalScope, api);
}(typeof globalThis !== "undefined" ? globalThis : this));
