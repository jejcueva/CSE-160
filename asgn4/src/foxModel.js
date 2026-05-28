(function initFoxModel(globalScope) {
  const FOX_JOINT_KEYS = Object.freeze([
    "neckPitch",
    "headYaw",
    "frontLegUpper",
    "frontLegLower",
    "frontLegPaw",
    "hindLegUpper",
    "hindLegLower",
    "hindLegPaw",
    "tailBaseCurl",
    "tailMidCurl",
    "tailTipCurl",
  ]);

  const TAIL_COUNT = 9;

  const BODY_DIMENSIONS = Object.freeze({
    length: 0.56,
    height: 0.22,
    depth: 0.28,
  });

  const LEG_LAYOUT = Object.freeze({
    upperLength: 0.28,
    upperWidth: 0.09,
    lowerLength: 0.24,
    lowerWidth: 0.08,
    pawLength: 0.10,
    pawWidth: 0.09,
    toeLength: 0.12,
    toeHeight: 0.045,
    toeDepth: 0.12,
    jointOverlap: 0.04,
  });

  const TAIL_LAYOUT = Object.freeze({
    socketOffset: Object.freeze([0.16, 0.07, 0]),
    socketScale: Object.freeze([0.14, 0.11, 0.18]),
    rootOffsetX: 0.02,
    rootRaiseBase: 0.035,
    rootRaiseSpread: 0.008,
    rootDepthStep: 0.03,
    spreadAngleStep: 8,
    baseLength: 0.22,
    midLength: 0.18,
    tipLength: 0.13,
    baseHeight: 0.10,
    midHeight: 0.08,
    tipHeight: 0.06,
    segmentDepth: 0.09,
    socketOverlap: 0.05,
    segmentOverlap: 0.04,
    whiteTipLength: 0.06,
    whiteTipHeight: 0.05,
    whiteTipDepth: 0.05,
  });

  const FOX_COLORS = Object.freeze({
    body: Object.freeze([0.92, 0.42, 0.14, 1]),
    bodyShadow: Object.freeze([0.76, 0.26, 0.09, 1]),
    cream: Object.freeze([0.98, 0.89, 0.74, 1]),
    dark: Object.freeze([0.16, 0.09, 0.08, 1]),
    ember: Object.freeze([1.0, 0.72, 0.36, 1]),
    tailTip: Object.freeze([1.0, 0.84, 0.62, 1]),
  });

  function createDefaultFoxState() {
    return {
      globalRotationY: 18,
      mouseRotationX: -12,
      mouseRotationY: 0,
      animationEnabled: false,
      pokeActive: false,
      pokeStartTime: 0,
      frameTimeMs: 0,
      fps: 0,
      neckPitch: 4,
      headYaw: 0,
      frontLegUpper: 10,
      frontLegLower: -14,
      frontLegPaw: 6,
      hindLegUpper: -8,
      hindLegLower: 16,
      hindLegPaw: -4,
      tailBaseCurl: 0,
      tailMidCurl: 0,
      tailTipCurl: 0,
    };
  }

  function renderFox(renderContext) {
    const {
      pose,
      drawCube,
      drawCone,
      matrixUtils,
    } = renderContext;

    const {
      createIdentityMatrix,
      withTranslation,
      withRotation,
      withScale,
    } = matrixUtils;

    function drawLeg(hipMatrix, upperAngle, lowerAngle, pawAngle) {
      const upperJoint = withRotation(hipMatrix, upperAngle, 0, 0, 1);
      drawCube(
        withScale(
          withTranslation(upperJoint, 0, -(LEG_LAYOUT.upperLength / 2), 0),
          LEG_LAYOUT.upperWidth,
          LEG_LAYOUT.upperLength,
          LEG_LAYOUT.upperWidth,
        ),
        FOX_COLORS.bodyShadow,
      );

      const lowerAnchor = withTranslation(
        upperJoint,
        0,
        -(LEG_LAYOUT.upperLength - LEG_LAYOUT.jointOverlap),
        0,
      );
      const lowerJoint = withRotation(lowerAnchor, lowerAngle, 0, 0, 1);
      drawCube(
        withScale(
          withTranslation(lowerJoint, 0, -(LEG_LAYOUT.lowerLength / 2), 0),
          LEG_LAYOUT.lowerWidth,
          LEG_LAYOUT.lowerLength,
          LEG_LAYOUT.lowerWidth,
        ),
        FOX_COLORS.bodyShadow,
      );

      const pawAnchor = withTranslation(
        lowerJoint,
        0,
        -(LEG_LAYOUT.lowerLength - LEG_LAYOUT.jointOverlap),
        0,
      );
      const pawJoint = withRotation(pawAnchor, pawAngle, 0, 0, 1);
      drawCube(
        withScale(
          withTranslation(pawJoint, 0, -(LEG_LAYOUT.pawLength / 2), 0),
          LEG_LAYOUT.pawWidth,
          LEG_LAYOUT.pawLength,
          LEG_LAYOUT.pawWidth,
        ),
        FOX_COLORS.dark,
      );

      const toeRoot = withTranslation(
        pawJoint,
        LEG_LAYOUT.toeLength / 2,
        -LEG_LAYOUT.pawLength + (LEG_LAYOUT.toeHeight / 2),
        0,
      );
      drawCube(
        withScale(
          toeRoot,
          LEG_LAYOUT.toeLength,
          LEG_LAYOUT.toeHeight,
          LEG_LAYOUT.toeDepth,
        ),
        FOX_COLORS.dark,
      );
    }

    function drawTail(index, tailRootMatrix) {
      const centerIndex = (TAIL_COUNT - 1) / 2;
      const spreadOffset = index - centerIndex;
      const spreadAngle = spreadOffset * TAIL_LAYOUT.spreadAngleStep;
      const depthOffset = spreadOffset * TAIL_LAYOUT.rootDepthStep;
      const riseOffset = Math.abs(spreadOffset) * TAIL_LAYOUT.rootRaiseSpread;

      const tailRoot = withTranslation(
        tailRootMatrix,
        TAIL_LAYOUT.rootOffsetX,
        TAIL_LAYOUT.rootRaiseBase + riseOffset,
        depthOffset,
      );
      const fanMatrix = withRotation(tailRoot, spreadAngle, 0, 1, 0);

      const baseJoint = withRotation(
        fanMatrix,
        pose.tailBaseCurl,
        0,
        0,
        1,
      );
      drawCube(
        withScale(
          withTranslation(
            baseJoint,
            (TAIL_LAYOUT.baseLength / 2) - TAIL_LAYOUT.socketOverlap,
            0,
            0,
          ),
          TAIL_LAYOUT.baseLength,
          TAIL_LAYOUT.baseHeight,
          TAIL_LAYOUT.segmentDepth,
        ),
        FOX_COLORS.body,
      );

      const midAnchor = withTranslation(
        baseJoint,
        TAIL_LAYOUT.baseLength - TAIL_LAYOUT.segmentOverlap,
        0,
        0,
      );
      const midJoint = withRotation(midAnchor, pose.tailMidCurl, 0, 0, 1);
      drawCube(
        withScale(
          withTranslation(
            midJoint,
            (TAIL_LAYOUT.midLength / 2) - TAIL_LAYOUT.segmentOverlap,
            0,
            0,
          ),
          TAIL_LAYOUT.midLength,
          TAIL_LAYOUT.midHeight,
          TAIL_LAYOUT.segmentDepth - 0.01,
        ),
        FOX_COLORS.bodyShadow,
      );

      const tipAnchor = withTranslation(
        midJoint,
        TAIL_LAYOUT.midLength - TAIL_LAYOUT.segmentOverlap,
        0,
        0,
      );
      const tipJoint = withRotation(tipAnchor, pose.tailTipCurl, 0, 0, 1);
      drawCube(
        withScale(
          withTranslation(
            tipJoint,
            ((TAIL_LAYOUT.tipLength - TAIL_LAYOUT.whiteTipLength) / 2) - TAIL_LAYOUT.segmentOverlap,
            0,
            0,
          ),
          TAIL_LAYOUT.tipLength - TAIL_LAYOUT.whiteTipLength,
          TAIL_LAYOUT.tipHeight,
          TAIL_LAYOUT.segmentDepth - 0.02,
        ),
        FOX_COLORS.bodyShadow,
      );

      const whiteTipRoot = withTranslation(
        tipJoint,
        TAIL_LAYOUT.tipLength - TAIL_LAYOUT.whiteTipLength - (TAIL_LAYOUT.segmentOverlap * 0.5),
        0,
        0,
      );
      drawCube(
        withScale(
          withTranslation(
            whiteTipRoot,
            TAIL_LAYOUT.whiteTipLength / 2,
            0,
            0,
          ),
          TAIL_LAYOUT.whiteTipLength,
          TAIL_LAYOUT.whiteTipHeight,
          TAIL_LAYOUT.whiteTipDepth,
        ),
        FOX_COLORS.tailTip,
      );

      const coneBase = withRotation(
        withTranslation(
          whiteTipRoot,
          TAIL_LAYOUT.whiteTipLength + 0.01,
          0.003,
          0,
        ),
        -90,
        0,
        0,
        1,
      );
      drawCone(
        withScale(coneBase, 0.055, 0.12, 0.055),
        FOX_COLORS.ember,
      );
    }

    const root = createIdentityMatrix();
    root.translate(-0.02, -0.05, 0);

    drawCube(
      withScale(root, BODY_DIMENSIONS.length, BODY_DIMENSIONS.height, BODY_DIMENSIONS.depth),
      FOX_COLORS.body,
    );

    const chestRoot = withTranslation(root, -0.23, 0.055, 0);
    drawCube(
      withScale(chestRoot, 0.22, 0.19, 0.22),
      FOX_COLORS.bodyShadow,
    );

    const chestMark = withTranslation(root, -0.16, -0.02, 0);
    drawCube(
      withScale(chestMark, 0.22, 0.15, 0.16),
      FOX_COLORS.cream,
    );

    const neckJoint = withRotation(withTranslation(chestRoot, -0.14, 0.08, 0), pose.neckPitch, 0, 0, 1);
    drawCube(
      withScale(withTranslation(neckJoint, -0.05, 0.02, 0), 0.12, 0.12, 0.14),
      FOX_COLORS.bodyShadow,
    );

    const headJoint = withRotation(withTranslation(neckJoint, -0.14, 0.02, 0), pose.headYaw, 0, 1, 0);
    drawCube(
      withScale(withTranslation(headJoint, -0.02, 0.02, 0), 0.22, 0.18, 0.18),
      FOX_COLORS.body,
    );

    const muzzleRoot = withTranslation(headJoint, -0.15, -0.015, 0);
    drawCube(
      withScale(muzzleRoot, 0.15, 0.10, 0.12),
      FOX_COLORS.cream,
    );

    const noseRoot = withTranslation(headJoint, -0.23, -0.005, 0);
    drawCube(
      withScale(noseRoot, 0.05, 0.04, 0.05),
      FOX_COLORS.dark,
    );

    const leftEarRoot = withRotation(withTranslation(headJoint, -0.05, 0.12, 0.08), -6, 0, 0, 1);
    drawCone(
      withScale(leftEarRoot, 0.07, 0.18, 0.07),
      FOX_COLORS.dark,
    );

    const rightEarRoot = withRotation(withTranslation(headJoint, -0.05, 0.12, -0.08), -6, 0, 0, 1);
    drawCone(
      withScale(rightEarRoot, 0.07, 0.18, 0.07),
      FOX_COLORS.dark,
    );

    drawLeg(withTranslation(root, -0.16, -0.03, 0.11), pose.frontLegUpper, pose.frontLegLower, pose.frontLegPaw);
    drawLeg(withTranslation(root, -0.16, -0.03, -0.11), pose.frontLegUpper, pose.frontLegLower, pose.frontLegPaw);
    drawLeg(withTranslation(root, 0.17, -0.03, 0.11), pose.hindLegUpper, pose.hindLegLower, pose.hindLegPaw);
    drawLeg(withTranslation(root, 0.17, -0.03, -0.11), pose.hindLegUpper, pose.hindLegLower, pose.hindLegPaw);

    const tailSocket = withTranslation(
      root,
      TAIL_LAYOUT.socketOffset[0],
      TAIL_LAYOUT.socketOffset[1],
      TAIL_LAYOUT.socketOffset[2],
    );
    drawCube(
      withScale(
        tailSocket,
        TAIL_LAYOUT.socketScale[0],
        TAIL_LAYOUT.socketScale[1],
        TAIL_LAYOUT.socketScale[2],
      ),
      FOX_COLORS.bodyShadow,
    );

    for (let index = 0; index < TAIL_COUNT; index += 1) {
      drawTail(index, tailSocket);
    }
  }

  const api = Object.freeze({
    BODY_DIMENSIONS,
    FOX_COLORS,
    FOX_JOINT_KEYS,
    LEG_LAYOUT,
    TAIL_LAYOUT,
    TAIL_COUNT,
    createDefaultFoxState,
    renderFox,
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  Object.assign(globalScope, api);
}(typeof globalThis !== "undefined" ? globalThis : this));
