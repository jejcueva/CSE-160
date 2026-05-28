(function initMath(globalScope) {
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function degToRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  function add3(a, b) {
    return [
      a[0] + b[0],
      a[1] + b[1],
      a[2] + b[2],
    ];
  }

  function subtract3(a, b) {
    return [
      a[0] - b[0],
      a[1] - b[1],
      a[2] - b[2],
    ];
  }

  function scale3(vector, scalar) {
    return [
      vector[0] * scalar,
      vector[1] * scalar,
      vector[2] * scalar,
    ];
  }

  function dot3(a, b) {
    return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]);
  }

  function cross3(a, b) {
    return [
      (a[1] * b[2]) - (a[2] * b[1]),
      (a[2] * b[0]) - (a[0] * b[2]),
      (a[0] * b[1]) - (a[1] * b[0]),
    ];
  }

  function length3(vector) {
    return Math.hypot(vector[0], vector[1], vector[2]);
  }

  function normalize3(vector) {
    const magnitude = length3(vector);

    if (magnitude === 0) {
      return [0, 0, 0];
    }

    return scale3(vector, 1 / magnitude);
  }

  function createForwardVector(yawDegrees, pitchDegrees) {
    const yawRadians = degToRad(yawDegrees);
    const pitchRadians = degToRad(pitchDegrees);
    const cosPitch = Math.cos(pitchRadians);

    return normalize3([
      Math.cos(yawRadians) * cosPitch,
      Math.sin(pitchRadians),
      Math.sin(yawRadians) * cosPitch,
    ]);
  }

  function createLookAtElements(eye, center, up) {
    const forward = normalize3(subtract3(center, eye));
    const side = normalize3(cross3(forward, up));
    const upPrime = cross3(side, forward);

    return new Float32Array([
      side[0], upPrime[0], -forward[0], 0,
      side[1], upPrime[1], -forward[1], 0,
      side[2], upPrime[2], -forward[2], 0,
      -dot3(side, eye), -dot3(upPrime, eye), dot3(forward, eye), 1,
    ]);
  }

  function createPerspectiveElements(fovDegrees, aspect, near, far) {
    const f = 1 / Math.tan(degToRad(fovDegrees) / 2);
    const rangeInverse = 1 / (near - far);

    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * rangeInverse, -1,
      0, 0, (2 * far * near) * rangeInverse, 0,
    ]);
  }

  function worldToGridCoordinate(worldValue, worldHalf) {
    return Math.floor(worldValue + worldHalf);
  }

  function gridToWorldCoordinate(gridValue, worldHalf) {
    return gridValue - worldHalf + 0.5;
  }

  const api = Object.freeze({
    add3,
    clamp,
    createForwardVector,
    createLookAtElements,
    createPerspectiveElements,
    cross3,
    degToRad,
    dot3,
    gridToWorldCoordinate,
    length3,
    normalize3,
    scale3,
    subtract3,
    worldToGridCoordinate,
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  Object.assign(globalScope, api);
}(typeof globalThis !== "undefined" ? globalThis : this));
