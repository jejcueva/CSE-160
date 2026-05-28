(function initCamera(globalScope) {
  const math = (typeof module !== "undefined" && module.exports)
    ? require("./math.js")
    : globalScope;

  const {
    add3,
    clamp,
    createForwardVector,
    createLookAtElements,
    createPerspectiveElements,
    cross3,
    normalize3,
    scale3,
  } = math;

  class Camera {
    constructor(options = {}) {
      const eye = options.eye || [0, 1.6, 6];
      const forward = normalize3(options.forward || [0, 0, -1]);

      this.fov = options.fov || 60;
      this.eye = [...eye];
      this.up = [...(options.up || [0, 1, 0])];
      this.aspect = options.aspect || 1;
      this.near = options.near || 0.1;
      this.far = options.far || 1000;
      this.yaw = options.yaw ?? (Math.atan2(forward[2], forward[0]) * (180 / Math.PI));
      this.pitch = options.pitch ?? (Math.asin(forward[1]) * (180 / Math.PI));
      this.viewMatrixElements = new Float32Array(16);
      this.projectionMatrixElements = new Float32Array(16);

      this.updateDirection();
      this.updateProjectionMatrix(this.aspect);
    }

    updateDirection() {
      this.forward = createForwardVector(this.yaw, this.pitch);
      this.at = add3(this.eye, this.forward);
      this.viewMatrixElements = createLookAtElements(this.eye, this.at, this.up);
      return this;
    }

    updateProjectionMatrix(aspect = this.aspect) {
      this.aspect = aspect;
      this.projectionMatrixElements = createPerspectiveElements(this.fov, this.aspect, this.near, this.far);
      return this;
    }

    getForwardVector() {
      return [...this.forward];
    }

    getRightVector() {
      return normalize3(cross3(this.forward, this.up));
    }

    moveBy(offset) {
      this.eye = add3(this.eye, offset);
      return this.updateDirection();
    }

    setEye(nextEye) {
      this.eye = [...nextEye];
      return this.updateDirection();
    }

    moveForward(speed) {
      return this.moveBy(scale3(this.forward, speed));
    }

    moveBackward(speed) {
      return this.moveForward(-speed);
    }

    moveLeft(speed) {
      const left = normalize3(cross3(this.up, this.forward));
      return this.moveBy(scale3(left, speed));
    }

    moveRight(speed) {
      return this.moveBy(scale3(this.getRightVector(), speed));
    }

    panLeft(angle) {
      this.yaw -= angle;
      return this.updateDirection();
    }

    panRight(angle) {
      this.yaw += angle;
      return this.updateDirection();
    }

    tilt(deltaPitch) {
      this.pitch = clamp(this.pitch + deltaPitch, -60, 60);
      return this.updateDirection();
    }
  }

  const api = Object.freeze({
    Camera,
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  Object.assign(globalScope, api);
}(typeof globalThis !== "undefined" ? globalThis : this));
