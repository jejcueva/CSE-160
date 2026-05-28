(function initWorldState(globalScope) {
  const math = (typeof module !== "undefined" && module.exports)
    ? require("./math.js")
    : globalScope;
  const worldData = (typeof module !== "undefined" && module.exports)
    ? require("./worldData.js")
    : globalScope;

  const {
    normalize3,
    worldToGridCoordinate,
  } = math;

  const {
    MAX_WALL_HEIGHT,
    WORLD_HALF,
    WORLD_HEIGHTS,
    WORLD_SIZE,
    isProtectedCell,
  } = worldData;

  function cloneHeightMap(sourceHeights = WORLD_HEIGHTS) {
    return sourceHeights.map((row) => [...row]);
  }

  function createWorldState() {
    return {
      size: WORLD_SIZE,
      heights: cloneHeightMap(),
    };
  }

  function isWithinBounds(worldState, x, z) {
    return x >= 0 && x < worldState.size && z >= 0 && z < worldState.size;
  }

  function addBlock(worldState, x, z) {
    if (!isWithinBounds(worldState, x, z) || isProtectedCell(x, z)) {
      return false;
    }

    if (worldState.heights[z][x] >= MAX_WALL_HEIGHT) {
      return false;
    }

    worldState.heights[z][x] += 1;
    return true;
  }

  function removeBlock(worldState, x, z) {
    if (!isWithinBounds(worldState, x, z) || isProtectedCell(x, z)) {
      return false;
    }

    if (worldState.heights[z][x] <= 0) {
      return false;
    }

    worldState.heights[z][x] -= 1;
    return true;
  }

  function getTargetCellFromView(worldState, eye, forward, reach = 1.2) {
    const horizontalForward = normalize3([forward[0], 0, forward[2]]);

    if (horizontalForward[0] === 0 && horizontalForward[2] === 0) {
      return null;
    }

    const targetX = eye[0] + (horizontalForward[0] * reach);
    const targetZ = eye[2] + (horizontalForward[2] * reach);
    const x = worldToGridCoordinate(targetX, WORLD_HALF);
    const z = worldToGridCoordinate(targetZ, WORLD_HALF);

    if (!isWithinBounds(worldState, x, z)) {
      return null;
    }

    return { x, z };
  }

  function canOccupyWorldPosition(worldState, position) {
    const x = worldToGridCoordinate(position[0], WORLD_HALF);
    const z = worldToGridCoordinate(position[2], WORLD_HALF);

    if (!isWithinBounds(worldState, x, z)) {
      return false;
    }

    return worldState.heights[z][x] === 0;
  }

  const api = Object.freeze({
    addBlock,
    canOccupyWorldPosition,
    cloneHeightMap,
    createWorldState,
    getTargetCellFromView,
    isWithinBounds,
    removeBlock,
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  Object.assign(globalScope, api);
}(typeof globalThis !== "undefined" ? globalThis : this));
