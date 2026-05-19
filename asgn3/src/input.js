(function initInput(globalScope) {
  function createInputController(config) {
    const {
      canvas,
      onLook,
    } = config;

    const pressedKeys = new Set();
    let addBlockRequested = false;
    let removeBlockRequested = false;
    let dragOrigin = null;

    function normalizeKey(event) {
      return event.key.toLowerCase();
    }

    function handleKeyDown(event) {
      const key = normalizeKey(event);

      if (["w", "a", "s", "d", "q", "e", "f", "g"].includes(key)) {
        event.preventDefault();
      }

      pressedKeys.add(key);

      if (key === "f") {
        removeBlockRequested = true;
      }

      if (key === "g") {
        addBlockRequested = true;
      }
    }

    function handleKeyUp(event) {
      pressedKeys.delete(normalizeKey(event));
    }

    function handleMouseDown(event) {
      dragOrigin = Object.freeze({
        x: event.clientX,
        y: event.clientY,
      });
    }

    function handleMouseMove(event) {
      if (!dragOrigin || event.buttons !== 1) {
        return;
      }

      const deltaX = event.clientX - dragOrigin.x;
      const deltaY = event.clientY - dragOrigin.y;

      dragOrigin = Object.freeze({
        x: event.clientX,
        y: event.clientY,
      });

      onLook(deltaX, deltaY);
    }

    function stopDragging() {
      dragOrigin = null;
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", stopDragging);
    window.addEventListener("mouseup", stopDragging);

    return Object.freeze({
      consumeAddBlockRequest() {
        const requested = addBlockRequested;
        addBlockRequested = false;
        return requested;
      },

      consumeRemoveBlockRequest() {
        const requested = removeBlockRequested;
        removeBlockRequested = false;
        return requested;
      },

      isPressed(key) {
        return pressedKeys.has(key.toLowerCase());
      },

      dispose() {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        canvas.removeEventListener("mousedown", handleMouseDown);
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseleave", stopDragging);
        window.removeEventListener("mouseup", stopDragging);
      },
    });
  }

  const api = Object.freeze({
    createInputController,
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  Object.assign(globalScope, api);
}(typeof globalThis !== "undefined" ? globalThis : this));
