(function initLighting(globalScope) {
  const DEFAULT_LIGHT_STATE = Object.freeze({
    lightingEnabled: true,
    normalVisualizationEnabled: false,
    pointLightEnabled: true,
    spotLightEnabled: true,
    pointOffset: Object.freeze([0, 0, 0]),
    pointColor: Object.freeze([1, 0.86, 0.62]),
    spotColor: Object.freeze([0.58, 0.76, 1]),
  });

  function copyVector(vector) {
    return [vector[0], vector[1], vector[2]];
  }

  function clampColorValue(value) {
    return Math.min(Math.max(Number(value), 0), 1);
  }

  function createDefaultLightState() {
    return {
      ...DEFAULT_LIGHT_STATE,
      pointOffset: copyVector(DEFAULT_LIGHT_STATE.pointOffset),
      pointColor: copyVector(DEFAULT_LIGHT_STATE.pointColor),
      spotColor: copyVector(DEFAULT_LIGHT_STATE.spotColor),
    };
  }

  function resolveLightState(state, patch) {
    return {
      ...state,
      ...patch,
      pointOffset: patch.pointOffset ? copyVector(patch.pointOffset) : copyVector(state.pointOffset),
      pointColor: patch.pointColor
        ? patch.pointColor.map(clampColorValue)
        : copyVector(state.pointColor),
      spotColor: patch.spotColor
        ? patch.spotColor.map(clampColorValue)
        : copyVector(state.spotColor),
    };
  }

  function createPointLightPosition(seconds, state) {
    const orbitAngle = seconds * 0.8;
    const orbitRadius = 6;

    return [
      (Math.cos(orbitAngle) * orbitRadius) + state.pointOffset[0],
      3.4 + state.pointOffset[1],
      (Math.sin(orbitAngle) * orbitRadius) + state.pointOffset[2],
    ];
  }

  const api = Object.freeze({
    createDefaultLightState,
    createPointLightPosition,
    resolveLightState,
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  Object.assign(globalScope, api);
}(typeof globalThis !== "undefined" ? globalThis : this));
