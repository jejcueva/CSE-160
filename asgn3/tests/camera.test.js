const test = require("node:test");
const assert = require("node:assert/strict");

const {
  Camera,
} = require("../src/camera.js");

function approximatelyEqual(actual, expected, epsilon = 1e-4) {
  assert.equal(Math.abs(actual - expected) <= epsilon, true, `${actual} !== ${expected}`);
}

test("camera starts with a perspective matrix and facing -Z", () => {
  const camera = new Camera({
    eye: [0, 1.6, 6],
    aspect: 1,
  });

  approximatelyEqual(camera.eye[2], 6);
  approximatelyEqual(camera.at[2], 5);
  assert.equal(camera.viewMatrixElements.length, 16);
  assert.equal(camera.projectionMatrixElements.length, 16);
});

test("camera movement updates eye and target together", () => {
  const camera = new Camera({
    eye: [0, 1.6, 6],
    aspect: 1,
  });

  camera.moveForward(2);
  approximatelyEqual(camera.eye[2], 4);
  approximatelyEqual(camera.at[2], 3);

  camera.moveLeft(1);
  approximatelyEqual(camera.eye[0], -1);
  approximatelyEqual(camera.at[0], -1);
});

test("camera panning rotates the facing direction", () => {
  const camera = new Camera({
    eye: [0, 1.6, 6],
    aspect: 1,
  });

  camera.panLeft(90);
  const forward = camera.getForwardVector();

  approximatelyEqual(forward[0] < -0.99, true, 0);
  approximatelyEqual(Math.abs(forward[2]) < 0.01, true, 0);
});

test("camera tilt clamps the pitch", () => {
  const camera = new Camera({
    eye: [0, 1.6, 6],
    aspect: 1,
  });

  camera.tilt(100);
  approximatelyEqual(camera.pitch, 60);

  camera.tilt(-200);
  approximatelyEqual(camera.pitch, -60);
});
