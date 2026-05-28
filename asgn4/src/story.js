(function initStory(globalScope) {
  const worldData = (typeof module !== "undefined" && module.exports)
    ? require("./worldData.js")
    : globalScope;

  const {
    QUEST_MARKERS,
    SHRINE_RETURN_ZONE,
  } = worldData;

  function createStoryState() {
    return {
      collectedIds: new Set(),
      collectedCount: 0,
      completed: false,
      completionTimeSeconds: null,
    };
  }

  function cloneStoryState(storyState) {
    return {
      ...storyState,
      collectedIds: new Set(storyState.collectedIds),
    };
  }

  function isNearPoint(playerEye, point, radius) {
    const deltaX = playerEye[0] - point.worldX;
    const deltaZ = playerEye[2] - point.worldZ;
    return Math.hypot(deltaX, deltaZ) <= radius;
  }

  function updateStoryProgress(storyState, playerEye, seconds = null) {
    const nextState = cloneStoryState(storyState);
    const newlyCollectedIds = [];

    QUEST_MARKERS.forEach((marker) => {
      if (!nextState.collectedIds.has(marker.id) && isNearPoint(playerEye, marker, 0.9)) {
        nextState.collectedIds.add(marker.id);
        newlyCollectedIds.push(marker.id);
      }
    });

    nextState.collectedCount = nextState.collectedIds.size;

    if (
      !nextState.completed
      && nextState.collectedCount === QUEST_MARKERS.length
      && isNearPoint(playerEye, SHRINE_RETURN_ZONE, SHRINE_RETURN_ZONE.radius)
    ) {
      nextState.completed = true;
      nextState.completionTimeSeconds = seconds;
    }

    return {
      newlyCollectedIds,
      storyState: nextState,
    };
  }

  function getStoryHudText(storyState) {
    if (storyState.completed) {
      return "Quest complete: you returned the spirit flames to the shrine.";
    }

    if (storyState.collectedCount === 0) {
      return "Objective: recover the 3 spirit flames hidden across the grove.";
    }

    return `Objective: ${storyState.collectedCount}/3 spirit flames recovered. Return to the shrine when all are found.`;
  }

  const api = Object.freeze({
    createStoryState,
    getStoryHudText,
    updateStoryProgress,
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  Object.assign(globalScope, api);
}(typeof globalThis !== "undefined" ? globalThis : this));
