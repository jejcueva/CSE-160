const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createStoryState,
  updateStoryProgress,
  getStoryHudText,
} = require("../src/story.js");

const {
  QUEST_MARKERS,
  SHRINE_RETURN_ZONE,
} = require("../src/worldData.js");

test("story starts with all flames uncollected", () => {
  const storyState = createStoryState();

  assert.equal(storyState.collectedCount, 0);
  assert.equal(storyState.completed, false);
  assert.equal(storyState.collectedIds.size, 0);
});

test("player collects nearby markers only once", () => {
  const storyState = createStoryState();
  const firstMarker = QUEST_MARKERS[0];

  const firstUpdate = updateStoryProgress(storyState, [firstMarker.worldX, 1.6, firstMarker.worldZ]);
  assert.equal(firstUpdate.newlyCollectedIds.length, 1);
  assert.equal(firstUpdate.storyState.collectedCount, 1);

  const secondUpdate = updateStoryProgress(firstUpdate.storyState, [firstMarker.worldX, 1.6, firstMarker.worldZ]);
  assert.equal(secondUpdate.newlyCollectedIds.length, 0);
  assert.equal(secondUpdate.storyState.collectedCount, 1);
});

test("story completes only after all flames are collected and the player returns to the shrine", () => {
  let storyState = createStoryState();

  QUEST_MARKERS.forEach((marker) => {
    storyState = updateStoryProgress(storyState, [marker.worldX, 1.6, marker.worldZ]).storyState;
  });

  assert.equal(storyState.completed, false);

  storyState = updateStoryProgress(
    storyState,
    [SHRINE_RETURN_ZONE.worldX, 1.6, SHRINE_RETURN_ZONE.worldZ],
  ).storyState;

  assert.equal(storyState.completed, true);
  assert.match(getStoryHudText(storyState), /returned the spirit flames/i);
});
