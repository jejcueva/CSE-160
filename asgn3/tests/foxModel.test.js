const test = require("node:test");
const assert = require("node:assert/strict");

const {
  BODY_DIMENSIONS,
  LEG_LAYOUT,
  TAIL_LAYOUT,
  TAIL_COUNT,
} = require("../src/foxModel.js");

test("fox model keeps the nine-tailed updated silhouette from assignment 2", () => {
  assert.equal(TAIL_COUNT, 9);
});

test("tail layout uses the assignment 2 socketed attachment point", () => {
  const rearBodyEdgeX = BODY_DIMENSIONS.length / 2;
  const centerTailSocketX = TAIL_LAYOUT.socketOffset[0] + TAIL_LAYOUT.rootOffsetX;

  assert.equal(centerTailSocketX < rearBodyEdgeX, true);
  assert.equal(TAIL_LAYOUT.socketScale[0] > 0, true);
});

test("leg layout preserves the articulated paw and separate toe proportions", () => {
  assert.equal(LEG_LAYOUT.upperLength > LEG_LAYOUT.lowerLength, true);
  assert.equal(LEG_LAYOUT.lowerLength > LEG_LAYOUT.pawLength, true);
  assert.equal(LEG_LAYOUT.toeLength > LEG_LAYOUT.pawWidth, true);
});
