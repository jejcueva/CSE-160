const test = require("node:test");
const assert = require("node:assert/strict");

const {
  BASE_POSE,
  resolveFoxPose,
} = require("../src/foxAnimation.js");

test("fox animation base pose keeps the updated rig in a compact guardian stance", () => {
  assert.deepEqual(
    {
      neckPitch: BASE_POSE.neckPitch,
      headYaw: BASE_POSE.headYaw,
      frontLegUpper: BASE_POSE.frontLegUpper,
      frontLegLower: BASE_POSE.frontLegLower,
      frontLegPaw: BASE_POSE.frontLegPaw,
      hindLegUpper: BASE_POSE.hindLegUpper,
      hindLegLower: BASE_POSE.hindLegLower,
      hindLegPaw: BASE_POSE.hindLegPaw,
    },
    {
      neckPitch: 4,
      headYaw: 0,
      frontLegUpper: 10,
      frontLegLower: -14,
      frontLegPaw: 6,
      hindLegUpper: -8,
      hindLegLower: 16,
      hindLegPaw: -4,
    },
  );

  assert.equal(BASE_POSE.tailBaseCurl > 0, true);
  assert.equal(BASE_POSE.tailMidCurl > BASE_POSE.tailBaseCurl, true);
  assert.equal(BASE_POSE.tailTipCurl > BASE_POSE.tailMidCurl, true);
});

test("fox idle pose animates from the updated assignment 2 base pose", () => {
  const pose = resolveFoxPose(0.75, false);

  assert.notEqual(pose.frontLegUpper, BASE_POSE.frontLegUpper);
  assert.notEqual(pose.tailBaseCurl, BASE_POSE.tailBaseCurl);
});

test("fox celebration pose still differs from the normal idle pose", () => {
  const idlePose = resolveFoxPose(0.75, false);
  const celebrationPose = resolveFoxPose(0.75, true);

  assert.notDeepEqual(celebrationPose, idlePose);
  assert.equal(celebrationPose.tailTipCurl > idlePose.tailTipCurl, true);
});
