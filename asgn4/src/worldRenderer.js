(function initWorldRenderer(globalScope) {
  const worldData = (typeof module !== "undefined" && module.exports)
    ? require("./worldData.js")
    : globalScope;
  const math = (typeof module !== "undefined" && module.exports)
    ? require("./math.js")
    : globalScope;
  const foxAnimation = (typeof module !== "undefined" && module.exports)
    ? require("./foxAnimation.js")
    : globalScope;
  const foxModel = (typeof module !== "undefined" && module.exports)
    ? require("./foxModel.js")
    : globalScope;

  const {
    FOX_HOME,
    QUEST_MARKERS,
    SHRINE_RETURN_ZONE,
    TEXTURE_IDS,
    WORLD_HALF,
    getWallTextureIndex,
  } = worldData;

  const {
    gridToWorldCoordinate,
  } = math;

  const {
    resolveFoxPose,
  } = foxAnimation;

  const {
    renderFox,
  } = foxModel;

  const FOX_WORLD_SCALE = 1.35;
  const FOX_WORLD_Y = 0.9;

  function renderWorldScene(renderContext) {
    const {
      seconds,
      worldState,
      storyState,
      drawPrimitive,
      matrixUtils,
    } = renderContext;

    const {
      createPlacementMatrix,
      createIdentityMatrix,
      multiplyModelMatrices,
      withRotation,
      withScale,
      withTranslation,
    } = matrixUtils;

    function drawCube(modelMatrix, color, textureIndex) {
      drawPrimitive("cube", modelMatrix, color, textureIndex);
    }

    function drawCone(modelMatrix, color, textureIndex = -1) {
      drawPrimitive("cone", modelMatrix, color, textureIndex);
    }

    const groundMatrix = createIdentityMatrix();
    groundMatrix.translate(0, -0.04, 0);
    drawCube(
      withScale(groundMatrix, 32, 0.08, 32),
      [0.82, 0.92, 0.82, 1],
      TEXTURE_IDS.grass,
    );

    const skyMatrix = createIdentityMatrix();
    skyMatrix.translate(0, 15, 0);
    drawCube(
      withScale(skyMatrix, 90, 90, 90),
      [0.45, 0.72, 0.98, 1],
      TEXTURE_IDS.sky,
    );

    const shrineMatrix = createIdentityMatrix();
    shrineMatrix.translate(SHRINE_RETURN_ZONE.worldX, -0.08, SHRINE_RETURN_ZONE.worldZ);
    drawCube(
      withScale(shrineMatrix, 2.2, 0.18, 2.2),
      [0.94, 0.84, 0.62, 1],
      TEXTURE_IDS.wood,
    );

    const shrinePillarOffsets = [
      [-0.9, 0.4, -0.9],
      [0.9, 0.4, -0.9],
      [-0.9, 0.4, 0.9],
      [0.9, 0.4, 0.9],
    ];

    shrinePillarOffsets.forEach(([offsetX, offsetY, offsetZ]) => {
      const pillarMatrix = createIdentityMatrix();
      pillarMatrix.translate(SHRINE_RETURN_ZONE.worldX + offsetX, offsetY, SHRINE_RETURN_ZONE.worldZ + offsetZ);
      drawCube(
        withScale(pillarMatrix, 0.22, 0.8, 0.22),
        [0.78, 0.58, 0.26, 1],
        TEXTURE_IDS.wood,
      );
    });

    for (let z = 0; z < worldState.size; z += 1) {
      for (let x = 0; x < worldState.size; x += 1) {
        const height = worldState.heights[z][x];

        if (height === 0) {
          continue;
        }

        const worldX = gridToWorldCoordinate(x, WORLD_HALF);
        const worldZ = gridToWorldCoordinate(z, WORLD_HALF);
        const wallTexture = getWallTextureIndex(x, z);

        for (let y = 0; y < height; y += 1) {
          const wallMatrix = createIdentityMatrix();
          wallMatrix.translate(worldX, y + 0.5, worldZ);
          drawCube(
            wallMatrix,
            [0.84, 0.84, 0.84, 1],
            wallTexture,
          );
        }
      }
    }

    QUEST_MARKERS.forEach((marker) => {
      if (storyState.collectedIds.has(marker.id)) {
        return;
      }

      const bob = 0.65 + (Math.sin((seconds * 2.5) + marker.x) * 0.08);
      const glowCube = createIdentityMatrix();
      glowCube.translate(marker.worldX, bob, marker.worldZ);
      glowCube.rotate(seconds * 40, 0, 1, 0);
      drawCube(
        withScale(glowCube, 0.28, 0.28, 0.28),
        marker.color,
        -1,
      );

      const flameMatrix = createIdentityMatrix();
      flameMatrix.translate(marker.worldX, bob + 0.32, marker.worldZ);
      flameMatrix.rotate(-90, 0, 0, 1);
      flameMatrix.rotate(seconds * 120, 1, 0, 0);
      drawCone(
        withScale(flameMatrix, 0.12, 0.28, 0.12),
        marker.color,
      );
    });

    const foxPlacement = createPlacementMatrix(
      FOX_HOME.worldX,
      FOX_WORLD_Y,
      FOX_HOME.worldZ,
      FOX_HOME.yaw,
      FOX_WORLD_SCALE,
    );
    const placeFoxPart = (localMatrix) => multiplyModelMatrices(foxPlacement, localMatrix);

    renderFox({
      pose: resolveFoxPose(seconds, storyState.completed),
      drawCube: (matrix, color) => drawCube(placeFoxPart(matrix), color, -1),
      drawCone: (matrix, color) => drawCone(placeFoxPart(matrix), color, -1),
      matrixUtils,
    });

    if (storyState.completed) {
      const auraMatrix = createIdentityMatrix();
      auraMatrix.translate(SHRINE_RETURN_ZONE.worldX, 0.85, SHRINE_RETURN_ZONE.worldZ);
      auraMatrix.rotate(seconds * 55, 0, 1, 0);
      drawCube(
        withScale(auraMatrix, 0.65, 0.2, 0.65),
        [1, 0.9, 0.45, 0.95],
        -1,
      );
    }
  }

  const api = Object.freeze({
    renderWorldScene,
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  Object.assign(globalScope, api);
}(typeof globalThis !== "undefined" ? globalThis : this));
