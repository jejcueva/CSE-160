const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createWorldState,
  addBlock,
  removeBlock,
  getTargetCellFromView,
} = require("../src/worldState.js");

const {
  WORLD_HEIGHTS,
  PROTECTED_CELLS,
  WORLD_SIZE,
} = require("../src/worldData.js");

test("world state clones the seed height map", () => {
  const worldState = createWorldState();

  assert.notEqual(worldState.heights, WORLD_HEIGHTS);
  assert.notEqual(worldState.heights[0], WORLD_HEIGHTS[0]);
  assert.equal(worldState.heights[0][0], WORLD_HEIGHTS[0][0]);
  assert.equal(worldState.size, WORLD_SIZE);
});

test("addBlock and removeBlock respect world bounds and height limits", () => {
  const worldState = createWorldState();

  worldState.heights[10][10] = 3;
  assert.equal(addBlock(worldState, 10, 10), true);
  assert.equal(worldState.heights[10][10], 4);
  assert.equal(addBlock(worldState, 10, 10), false);
  assert.equal(worldState.heights[10][10], 4);

  worldState.heights[11][11] = 1;
  assert.equal(removeBlock(worldState, 11, 11), true);
  assert.equal(worldState.heights[11][11], 0);
  assert.equal(removeBlock(worldState, 11, 11), false);
  assert.equal(worldState.heights[11][11], 0);
});

test("protected cells cannot be edited", () => {
  const worldState = createWorldState();
  const [cell] = PROTECTED_CELLS;

  const originalHeight = worldState.heights[cell.z][cell.x];

  assert.equal(addBlock(worldState, cell.x, cell.z), false);
  assert.equal(removeBlock(worldState, cell.x, cell.z), false);
  assert.equal(worldState.heights[cell.z][cell.x], originalHeight);
});

test("target cell selection uses the forward vector projected onto the world grid", () => {
  const worldState = createWorldState();

  const target = getTargetCellFromView(worldState, [0, 1.6, 0], [1, 0, 0], 1.2);

  assert.deepEqual(target, { x: 17, z: 16 });
});
