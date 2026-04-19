const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotation;

  void main() {
    gl_Position = u_GlobalRotation * u_ModelMatrix * a_Position;
  }
`;

const FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;

  void main() {
    gl_FragColor = u_FragColor;
  }
`;

let canvas;
let gl;
let g_state = createDefaultFoxState();
let g_programInfo = null;
let g_buffers = Object.freeze({});
let g_startTime = 0;
let g_seconds = 0;
let g_currentPose = null;

document.addEventListener("DOMContentLoaded", main);

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  initializePrimitiveBuffers();
  bindControls({
    canvas,
    getState,
    patchState,
    replaceState,
    renderNow: () => {
      updateAnimationState();
      renderScene();
    },
    getSeconds: () => g_seconds,
    setStatus,
  });
  setStatus("Fox rig ready. Drag to rotate, shift-click to poke.");
  requestAnimationFrame(tick);
}

function setupWebGL() {
  canvas = document.getElementById("webgl");
  gl = canvas.getContext("webgl");

  if (!gl) {
    throw new Error("WebGL is not supported in this browser.");
  }

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.12, 0.07, 0.08, 1);
}

function connectVariablesToGLSL() {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, VSHADER_SOURCE);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FSHADER_SOURCE);
  const program = createProgram(gl, vertexShader, fragmentShader);
  gl.useProgram(program);

  const a_Position = gl.getAttribLocation(program, "a_Position");
  const u_ModelMatrix = gl.getUniformLocation(program, "u_ModelMatrix");
  const u_GlobalRotation = gl.getUniformLocation(program, "u_GlobalRotation");
  const u_FragColor = gl.getUniformLocation(program, "u_FragColor");

  if (a_Position < 0 || !u_ModelMatrix || !u_GlobalRotation || !u_FragColor) {
    throw new Error("Failed to connect JavaScript variables to GLSL.");
  }

  g_programInfo = Object.freeze({
    program,
    a_Position,
    u_ModelMatrix,
    u_GlobalRotation,
    u_FragColor,
  });
}

function initializePrimitiveBuffers() {
  g_buffers = Object.freeze({
    cube: createStaticBuffer(createCubeVertices()),
    cone: createStaticBuffer(createConeVertices(18)),
  });
}

function createStaticBuffer(vertices) {
  const buffer = gl.createBuffer();

  if (!buffer) {
    throw new Error("Failed to create a WebGL buffer.");
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  return Object.freeze({
    buffer,
    vertexCount: vertices.length / 3,
  });
}

function getState() {
  return g_state;
}

function patchState(patch) {
  g_state = {
    ...g_state,
    ...patch,
  };
}

function replaceState(nextState) {
  g_state = {
    ...nextState,
  };
}

function tick(nowMilliseconds) {
  if (g_startTime === 0) {
    g_startTime = nowMilliseconds / 1000;
  }

  g_seconds = (nowMilliseconds / 1000) - g_startTime;
  updateAnimationState();
  renderScene();
  requestAnimationFrame(tick);
}

function updateAnimationState() {
  const poseResult = resolvePose(g_state, g_seconds);
  g_currentPose = poseResult.pose;

  if (poseResult.pokeFinished && g_state.pokeActive) {
    patchState({ pokeActive: false });
    setStatus("Poke complete. Fox returned to the normal cycle.");
  }
}

function buildGlobalRotationMatrix() {
  const globalRotationMatrix = createIdentityMatrix();
  globalRotationMatrix.rotate(g_state.globalRotationY + g_state.mouseRotationY, 0, 1, 0);
  globalRotationMatrix.rotate(g_state.mouseRotationX, 1, 0, 0);
  return globalRotationMatrix;
}

function renderScene(pose = g_currentPose || createManualPose(g_state), seconds = g_seconds) {
  if (!gl || !g_programInfo) {
    return;
  }

  const frameStart = performance.now();
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(g_programInfo.program);

  const globalRotationMatrix = buildGlobalRotationMatrix();
  gl.uniformMatrix4fv(g_programInfo.u_GlobalRotation, false, globalRotationMatrix.elements);

  renderFox({
    pose,
    drawCube: (modelMatrix, color) => drawPrimitive("cube", modelMatrix, color),
    drawCone: (modelMatrix, color) => drawPrimitive("cone", modelMatrix, color),
    matrixUtils: {
      createIdentityMatrix,
      cloneMatrix,
      withTranslation,
      withRotation,
      withScale,
    },
    seconds,
  });

  const frameTimeMs = performance.now() - frameStart;
  const fps = frameTimeMs > 0 ? (1000 / frameTimeMs) : 0;

  patchState({
    frameTimeMs,
    fps,
  });

  updateHud(frameTimeMs, fps);
}

function drawPrimitive(primitiveName, modelMatrix, color) {
  const primitive = g_buffers[primitiveName];

  if (!primitive) {
    throw new Error(`Unknown primitive: ${primitiveName}`);
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, primitive.buffer);
  gl.vertexAttribPointer(g_programInfo.a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(g_programInfo.a_Position);
  gl.uniformMatrix4fv(g_programInfo.u_ModelMatrix, false, modelMatrix.elements);
  gl.uniform4fv(g_programInfo.u_FragColor, new Float32Array(color));
  gl.drawArrays(gl.TRIANGLES, 0, primitive.vertexCount);
}

function updateHud(frameTimeMs, fps) {
  document.getElementById("frameTime").textContent = `${frameTimeMs.toFixed(2)} ms`;
  document.getElementById("fpsValue").textContent = fps.toFixed(1);
  document.getElementById("poseMode").textContent = g_state.pokeActive
    ? "poke"
    : (g_state.animationEnabled ? "animated" : "manual");
}

function setStatus(message) {
  document.getElementById("statusLine").textContent = message;
}

function createShader(context, type, source) {
  const shader = context.createShader(type);
  context.shaderSource(shader, source);
  context.compileShader(shader);

  if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
    const error = context.getShaderInfoLog(shader);
    context.deleteShader(shader);
    throw new Error(error || "Shader compilation failed.");
  }

  return shader;
}

function createProgram(context, vertexShader, fragmentShader) {
  const program = context.createProgram();
  context.attachShader(program, vertexShader);
  context.attachShader(program, fragmentShader);
  context.linkProgram(program);

  if (!context.getProgramParameter(program, context.LINK_STATUS)) {
    const error = context.getProgramInfoLog(program);
    context.deleteProgram(program);
    throw new Error(error || "Program linking failed.");
  }

  return program;
}
