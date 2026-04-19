(function initUi(globalScope) {
  const RANGE_CONTROLS = Object.freeze([
    { id: "globalRotationSlider", valueId: "globalRotationValue", key: "globalRotationY" },
    { id: "neckPitchSlider", valueId: "neckPitchValue", key: "neckPitch" },
    { id: "headYawSlider", valueId: "headYawValue", key: "headYaw" },
    { id: "frontLegUpperSlider", valueId: "frontLegUpperValue", key: "frontLegUpper" },
    { id: "frontLegLowerSlider", valueId: "frontLegLowerValue", key: "frontLegLower" },
    { id: "frontLegPawSlider", valueId: "frontLegPawValue", key: "frontLegPaw" },
    { id: "hindLegUpperSlider", valueId: "hindLegUpperValue", key: "hindLegUpper" },
    { id: "hindLegLowerSlider", valueId: "hindLegLowerValue", key: "hindLegLower" },
    { id: "hindLegPawSlider", valueId: "hindLegPawValue", key: "hindLegPaw" },
    { id: "tailBaseCurlSlider", valueId: "tailBaseCurlValue", key: "tailBaseCurl" },
    { id: "tailMidCurlSlider", valueId: "tailMidCurlValue", key: "tailMidCurl" },
    { id: "tailTipCurlSlider", valueId: "tailTipCurlValue", key: "tailTipCurl" },
  ]);

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function bindControls(uiContext) {
    const {
      canvas,
      getState,
      patchState,
      replaceState,
      renderNow,
      getSeconds,
      setStatus,
    } = uiContext;

    function syncControlsFromState(state) {
      RANGE_CONTROLS.forEach(({ id, valueId, key }) => {
        const slider = document.getElementById(id);
        const valueLabel = document.getElementById(valueId);
        const value = Number(state[key]);

        slider.value = String(value);
        valueLabel.textContent = String(value);
      });
    }

    RANGE_CONTROLS.forEach(({ id, valueId, key }) => {
      const slider = document.getElementById(id);
      const valueLabel = document.getElementById(valueId);

      slider.addEventListener("input", () => {
        const value = Number(slider.value);
        valueLabel.textContent = String(value);
        patchState({ [key]: value });
        renderNow();
      });
    });

    document.getElementById("animationOnButton").addEventListener("click", () => {
      patchState({ animationEnabled: true });
      setStatus("Idle animation enabled.");
      renderNow();
    });

    document.getElementById("animationOffButton").addEventListener("click", () => {
      patchState({ animationEnabled: false });
      setStatus("Manual pose control enabled.");
      renderNow();
    });

    document.getElementById("resetPoseButton").addEventListener("click", () => {
      const currentState = getState();
      const defaults = globalScope.createDefaultFoxState();
      const nextState = {
        ...defaults,
        animationEnabled: currentState.animationEnabled,
        globalRotationY: currentState.globalRotationY,
        mouseRotationX: currentState.mouseRotationX,
        mouseRotationY: currentState.mouseRotationY,
      };

      replaceState(nextState);
      syncControlsFromState(nextState);
      setStatus("Pose reset to the fox default.");
      renderNow();
    });

    let dragOrigin = null;

    canvas.addEventListener("mousedown", (event) => {
      if (event.shiftKey) {
        patchState({
          pokeActive: true,
          pokeStartTime: getSeconds(),
        });
        setStatus("Poke animation triggered.");
        renderNow();
        return;
      }

      dragOrigin = Object.freeze({
        x: event.clientX,
        y: event.clientY,
      });
    });

    canvas.addEventListener("mousemove", (event) => {
      if (!dragOrigin || event.buttons !== 1) {
        return;
      }

      const deltaX = event.clientX - dragOrigin.x;
      const deltaY = event.clientY - dragOrigin.y;
      const state = getState();

      patchState({
        mouseRotationY: state.mouseRotationY + (deltaX * 0.45),
        mouseRotationX: clamp(state.mouseRotationX + (deltaY * 0.35), -60, 60),
      });

      dragOrigin = Object.freeze({
        x: event.clientX,
        y: event.clientY,
      });

      renderNow();
    });

    function stopDrag() {
      dragOrigin = null;
    }

    canvas.addEventListener("mouseleave", stopDrag);
    window.addEventListener("mouseup", stopDrag);

    syncControlsFromState(getState());
  }

  const api = Object.freeze({
    bindControls,
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  Object.assign(globalScope, api);
}(typeof globalThis !== "undefined" ? globalThis : this));
