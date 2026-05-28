(function initFoxAnimation(globalScope) {
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

  const BASE_POSE = Object.freeze({
    neckPitch: 4,
    headYaw: 0,
    frontLegUpper: 10,
    frontLegLower: -14,
    frontLegPaw: 6,
    hindLegUpper: -8,
    hindLegLower: 16,
    hindLegPaw: -4,
    tailBaseCurl: 14,
    tailMidCurl: 24,
    tailTipCurl: 34,
  });

  function createPose(values) {
    return Object.freeze(
      POSE_KEYS.reduce((pose, key) => ({
        ...pose,
        [key]: Number(values[key] || 0),
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

  function createCelebrationPose(basePose, seconds) {
    const pulse = Math.sin(seconds * 4.2);

    return Object.freeze({
      neckPitch: basePose.neckPitch - 6 + (pulse * 4),
      headYaw: Math.sin(seconds * 2.4) * 18,
      frontLegUpper: basePose.frontLegUpper - 8 + (pulse * 10),
      frontLegLower: basePose.frontLegLower + 12 + (Math.abs(pulse) * 10),
      frontLegPaw: basePose.frontLegPaw + (pulse * 7),
      hindLegUpper: basePose.hindLegUpper - 4 - (pulse * 8),
      hindLegLower: basePose.hindLegLower + 8 + (Math.abs(pulse) * 10),
      hindLegPaw: basePose.hindLegPaw - (pulse * 4),
      tailBaseCurl: basePose.tailBaseCurl + 18 + (Math.sin(seconds * 2.7) * 12),
      tailMidCurl: basePose.tailMidCurl + 24 + (Math.sin((seconds * 2.7) + 0.5) * 16),
      tailTipCurl: basePose.tailTipCurl + 32 + (Math.sin((seconds * 2.7) + 1.0) * 20),
    });
  }

  function resolveFoxPose(seconds, celebrate = false) {
    const basePose = createPose(BASE_POSE);
    return celebrate
      ? createCelebrationPose(basePose, seconds)
      : createIdlePose(basePose, seconds);
  }

  const api = Object.freeze({
    BASE_POSE,
    POSE_KEYS,
    createCelebrationPose,
    createIdlePose,
    resolveFoxPose,
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  Object.assign(globalScope, api);
}(typeof globalThis !== "undefined" ? globalThis : this));
