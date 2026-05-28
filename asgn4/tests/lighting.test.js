const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createDefaultLightState,
  createPointLightPosition,
  resolveLightState,
} = require("../src/lighting.js");

function approxEqual(actual, expected, tolerance = 0.00001) {
  assert.equal(Math.abs(actual - expected) <= tolerance, true, `${actual} should be close to ${expected}`);
}

test("default light state covers assignment toggles and color", () => {
  const state = createDefaultLightState();

  assert.equal(state.lightingEnabled, true);
  assert.equal(state.normalVisualizationEnabled, false);
  assert.equal(state.pointLightEnabled, true);
  assert.equal(state.spotLightEnabled, true);
  assert.deepEqual(state.pointColor, [1, 0.86, 0.62]);
});

test("point light moves over time and respects slider offsets", () => {
  const state = resolveLightState(createDefaultLightState(), {
    pointOffset: [1, 0.5, -2],
  });

  const firstPosition = createPointLightPosition(0, state);
  const secondPosition = createPointLightPosition(Math.PI, state);

  assert.notDeepEqual(firstPosition, secondPosition);
  approxEqual(firstPosition[0], 7);
  approxEqual(firstPosition[1], 3.9);
  approxEqual(firstPosition[2], -2);
});

test("light state updates return a new object without mutating the previous one", () => {
  const state = createDefaultLightState();
  const nextState = resolveLightState(state, {
    lightingEnabled: false,
    pointColor: [0.2, 0.3, 0.4],
  });

  assert.notEqual(nextState, state);
  assert.equal(state.lightingEnabled, true);
  assert.equal(nextState.lightingEnabled, false);
  assert.deepEqual(state.pointColor, [1, 0.86, 0.62]);
  assert.deepEqual(nextState.pointColor, [0.2, 0.3, 0.4]);
});
