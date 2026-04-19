(function initAnimation(globalScope) {
  const POSE_KEYS = Object.freeze([
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

  function createManualPose(state) {
    return Object.freeze(
      POSE_KEYS.reduce((pose, key) => ({
        ...pose,
        [key]: Number(state[key] || 0),
      }), {}),
    );
  }

  function createIdlePose(basePose, seconds) {
    const stride = Math.sin(seconds * 3.1);
    const strideLag = Math.sin((seconds * 3.1) + 0.8);
    const tailWave = Math.sin(seconds * 2.25);

    return Object.freeze({
      neckPitch: basePose.neckPitch + (Math.sin(seconds * 1.4) * 4),
      headYaw: basePose.headYaw + (Math.sin(seconds * 1.2) * 8),
      frontLegUpper: basePose.frontLegUpper + (stride * 18),
      frontLegLower: basePose.frontLegLower + (Math.max(0, -stride) * 18) - 4,
      frontLegPaw: basePose.frontLegPaw + (strideLag * 6),
      hindLegUpper: basePose.hindLegUpper - (stride * 18),
      hindLegLower: basePose.hindLegLower + (Math.max(0, stride) * 18) - 4,
      hindLegPaw: basePose.hindLegPaw - (strideLag * 5),
      tailBaseCurl: basePose.tailBaseCurl + (tailWave * 8),
      tailMidCurl: basePose.tailMidCurl + (Math.sin((seconds * 2.25) + 0.5) * 10),
      tailTipCurl: basePose.tailTipCurl + (Math.sin((seconds * 2.25) + 1.0) * 13),
    });
  }

  function createPokePose(basePose, elapsedSeconds) {
    const durationSeconds = 1.1;

    if (elapsedSeconds >= durationSeconds) {
      return Object.freeze({
        pose: basePose,
        pokeFinished: true,
      });
    }

    const pulse = Math.sin((elapsedSeconds / durationSeconds) * Math.PI);

    return Object.freeze({
      pokeFinished: false,
      pose: Object.freeze({
        neckPitch: basePose.neckPitch - (18 * pulse),
        headYaw: basePose.headYaw + (24 * pulse),
        frontLegUpper: basePose.frontLegUpper - (20 * pulse),
        frontLegLower: basePose.frontLegLower + (10 * pulse),
        frontLegPaw: basePose.frontLegPaw + (12 * pulse),
        hindLegUpper: basePose.hindLegUpper - (8 * pulse),
        hindLegLower: basePose.hindLegLower + (10 * pulse),
        hindLegPaw: basePose.hindLegPaw + (4 * pulse),
        tailBaseCurl: basePose.tailBaseCurl + (20 * pulse),
        tailMidCurl: basePose.tailMidCurl + (25 * pulse),
        tailTipCurl: basePose.tailTipCurl + (30 * pulse),
      }),
    });
  }

  function updateAnimationAngles(state, seconds) {
    const basePose = createManualPose(state);

    if (!state.animationEnabled) {
      return basePose;
    }

    return createIdlePose(basePose, seconds);
  }

  function resolvePose(state, seconds) {
    const basePose = createManualPose(state);

    if (state.pokeActive) {
      const pokeResult = createPokePose(basePose, seconds - state.pokeStartTime);

      if (!pokeResult.pokeFinished) {
        return pokeResult;
      }

      if (state.animationEnabled) {
        return Object.freeze({
          pokeFinished: true,
          pose: updateAnimationAngles(state, seconds),
        });
      }

      return pokeResult;
    }

    if (state.animationEnabled) {
      return Object.freeze({
        pokeFinished: false,
        pose: updateAnimationAngles(state, seconds),
      });
    }

    return Object.freeze({
      pokeFinished: false,
      pose: basePose,
    });
  }

  const api = Object.freeze({
    POSE_KEYS,
    createManualPose,
    updateAnimationAngles,
    resolvePose,
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  Object.assign(globalScope, api);
}(typeof globalThis !== "undefined" ? globalThis : this));
