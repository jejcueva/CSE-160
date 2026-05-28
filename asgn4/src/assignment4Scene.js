(function initAssignment4Scene(globalScope) {
  function renderAssignment4Showcase(renderContext) {
    const {
      seconds,
      lightPosition,
      spotLightPosition,
      objModelReady,
      drawPrimitive,
      matrixUtils,
    } = renderContext;
    const {
      createIdentityMatrix,
      withRotation,
      withScale,
      withTranslation,
    } = matrixUtils;

    function drawCube(modelMatrix, color, textureIndex = -1) {
      drawPrimitive("cube", modelMatrix, color, textureIndex);
    }

    function drawSphere(modelMatrix, color) {
      drawPrimitive("sphere", modelMatrix, color, -1);
    }

    const mainSphere = createIdentityMatrix();
    mainSphere.translate(-3.2, 1.05, -2.5);
    drawSphere(withScale(mainSphere, 1.4, 1.4, 1.4), [0.78, 0.36, 0.92, 1]);

    const secondSphere = createIdentityMatrix();
    secondSphere.translate(-1.25, 0.72, -4.4);
    drawSphere(withScale(secondSphere, 0.9, 0.9, 0.9), [0.28, 0.72, 0.88, 1]);

    const lightMarker = createIdentityMatrix();
    lightMarker.translate(lightPosition[0], lightPosition[1], lightPosition[2]);
    lightMarker.rotate(seconds * 90, 0, 1, 0);
    drawCube(withScale(lightMarker, 0.28, 0.28, 0.28), [1, 0.95, 0.45, 1]);

    const spotMarker = createIdentityMatrix();
    spotMarker.translate(spotLightPosition[0], spotLightPosition[1], spotLightPosition[2]);
    spotMarker.rotate(45, 0, 1, 0);
    drawCube(withScale(spotMarker, 0.24, 0.24, 0.24), [0.5, 0.72, 1, 1]);

    if (objModelReady) {
      const objMatrix = createIdentityMatrix();
      objMatrix.translate(2.4, 0.15, -3.2);
      objMatrix.rotate(seconds * 14, 0, 1, 0);
      drawPrimitive(
        "objModel",
        withScale(withRotation(objMatrix, -90, 1, 0, 0), 0.9, 0.9, 0.9),
        [0.95, 0.62, 0.24, 1],
        -1,
      );
    } else {
      const fallback = createIdentityMatrix();
      fallback.translate(2.4, 0.55, -3.2);
      drawSphere(withScale(fallback, 0.7, 0.7, 0.7), [0.95, 0.62, 0.24, 1]);
    }
  }

  const api = Object.freeze({
    renderAssignment4Showcase,
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  Object.assign(globalScope, api);
}(typeof globalThis !== "undefined" ? globalThis : this));
