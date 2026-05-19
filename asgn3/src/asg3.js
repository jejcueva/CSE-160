const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  varying vec2 v_UV;

  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }
`;

const FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform int u_TextureIndex;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;

  void main() {
    if (u_TextureIndex == -1) {
      gl_FragColor = u_FragColor;
    } else if (u_TextureIndex == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_TextureIndex == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if (u_TextureIndex == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    } else {
      gl_FragColor = texture2D(u_Sampler3, v_UV);
    }
  }
`;

let canvas;
let gl;
let g_programInfo;
let g_buffers;
let g_camera;
let g_input;
let g_textures;
let g_worldState;
let g_storyState;
let g_previousSeconds = 0;
let g_lastStatus = "Loading the grove.";

const TEXTURE_DEFINITIONS = Object.freeze([
  { name: "grass", src: "assets/textures/grass.svg" },
  { name: "stone", src: "assets/textures/stone.svg" },
  { name: "wood", src: "assets/textures/wood.svg" },
  { name: "sky", src: "assets/textures/sky.svg" },
]);

document.addEventListener("DOMContentLoaded", () => {
  main().catch((error) => {
    console.error(error);
    setStatus(`Initialization failed: ${error.message}`);
  });
});

async function main() {
  canvas = document.getElementById("webgl");
  gl = canvas.getContext("webgl");

  if (!gl) {
    throw new Error("WebGL is not supported in this browser.");
  }

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.02, 0.04, 0.08, 1);

  connectVariablesToGLSL();
  initializePrimitiveBuffers();

  g_worldState = createWorldState();
  g_storyState = createStoryState();
  g_camera = new Camera({
    eye: SPAWN_POINT.eye,
    yaw: SPAWN_POINT.yaw,
    pitch: SPAWN_POINT.pitch,
    aspect: canvas.width / canvas.height,
  });

  bindSamplerUniforms();
  setStatus("Loading grove textures from the local assignment assets.");
  g_textures = await loadTextureSet(gl, TEXTURE_DEFINITIONS);

  g_input = createInputController({
    canvas,
    onLook(deltaX, deltaY) {
      g_camera.panRight(deltaX * 0.18);
      g_camera.tilt(-deltaY * 0.12);
    },
  });

  setStatus("Fox Spirit Grove ready. Explore with W/A/S/D, rotate with mouse or Q/E, use F to remove and G to add blocks.");
  requestAnimationFrame(tick);
}

function connectVariablesToGLSL() {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, VSHADER_SOURCE);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FSHADER_SOURCE);
  const program = createProgram(gl, vertexShader, fragmentShader);

  gl.useProgram(program);

  g_programInfo = Object.freeze({
    program,
    a_Position: gl.getAttribLocation(program, "a_Position"),
    a_UV: gl.getAttribLocation(program, "a_UV"),
    u_ModelMatrix: gl.getUniformLocation(program, "u_ModelMatrix"),
    u_ViewMatrix: gl.getUniformLocation(program, "u_ViewMatrix"),
    u_ProjectionMatrix: gl.getUniformLocation(program, "u_ProjectionMatrix"),
    u_FragColor: gl.getUniformLocation(program, "u_FragColor"),
    u_TextureIndex: gl.getUniformLocation(program, "u_TextureIndex"),
    u_Sampler0: gl.getUniformLocation(program, "u_Sampler0"),
    u_Sampler1: gl.getUniformLocation(program, "u_Sampler1"),
    u_Sampler2: gl.getUniformLocation(program, "u_Sampler2"),
    u_Sampler3: gl.getUniformLocation(program, "u_Sampler3"),
  });

  if (
    g_programInfo.a_Position < 0
    || g_programInfo.a_UV < 0
    || !g_programInfo.u_ModelMatrix
    || !g_programInfo.u_ViewMatrix
    || !g_programInfo.u_ProjectionMatrix
    || !g_programInfo.u_FragColor
    || !g_programInfo.u_TextureIndex
  ) {
    throw new Error("Failed to bind shader variables.");
  }
}

function initializePrimitiveBuffers() {
  const cubeGeometry = createTexturedCubeData();
  const coneGeometry = createConeData(18);

  g_buffers = Object.freeze({
    cube: createStaticBuffer(cubeGeometry),
    cone: createStaticBuffer(coneGeometry),
  });
}

function createStaticBuffer(geometry) {
  const buffer = gl.createBuffer();

  if (!buffer) {
    throw new Error("Failed to create a WebGL buffer.");
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.vertices), gl.STATIC_DRAW);

  return Object.freeze({
    buffer,
    stride: geometry.stride,
    vertexCount: geometry.vertexCount,
  });
}

function bindSamplerUniforms() {
  gl.uniform1i(g_programInfo.u_Sampler0, 0);
  gl.uniform1i(g_programInfo.u_Sampler1, 1);
  gl.uniform1i(g_programInfo.u_Sampler2, 2);
  gl.uniform1i(g_programInfo.u_Sampler3, 3);
}

function tick(nowMilliseconds) {
  const nowSeconds = nowMilliseconds / 1000;
  const deltaSeconds = g_previousSeconds === 0
    ? 0
    : Math.min(0.05, nowSeconds - g_previousSeconds);

  g_previousSeconds = nowSeconds;

  updateMovement(deltaSeconds);
  processWorldEdits();
  updateStory(nowSeconds);
  renderScene(nowSeconds);

  requestAnimationFrame(tick);
}

function updateMovement(deltaSeconds) {
  const moveSpeed = 3.2 * deltaSeconds;
  const rotateSpeed = 72 * deltaSeconds;
  const forward = g_camera.getForwardVector();
  const flatForward = normalize3([forward[0], 0, forward[2]]);
  const right = g_camera.getRightVector();
  const flatRight = normalize3([right[0], 0, right[2]]);
  let moveX = 0;
  let moveZ = 0;

  if (g_input.isPressed("w")) {
    moveX += flatForward[0] * moveSpeed;
    moveZ += flatForward[2] * moveSpeed;
  }

  if (g_input.isPressed("s")) {
    moveX -= flatForward[0] * moveSpeed;
    moveZ -= flatForward[2] * moveSpeed;
  }

  if (g_input.isPressed("a")) {
    moveX -= flatRight[0] * moveSpeed;
    moveZ -= flatRight[2] * moveSpeed;
  }

  if (g_input.isPressed("d")) {
    moveX += flatRight[0] * moveSpeed;
    moveZ += flatRight[2] * moveSpeed;
  }

  if (g_input.isPressed("q")) {
    g_camera.panLeft(rotateSpeed);
  }

  if (g_input.isPressed("e")) {
    g_camera.panRight(rotateSpeed);
  }

  if (moveX !== 0 || moveZ !== 0) {
    const currentEye = g_camera.eye;
    const nextX = [currentEye[0] + moveX, currentEye[1], currentEye[2]];

    if (canOccupyWorldPosition(g_worldState, nextX)) {
      g_camera.setEye(nextX);
    }

    const currentAfterX = g_camera.eye;
    const nextZ = [currentAfterX[0], currentAfterX[1], currentAfterX[2] + moveZ];

    if (canOccupyWorldPosition(g_worldState, nextZ)) {
      g_camera.setEye(nextZ);
    }
  }
}

function processWorldEdits() {
  const targetCell = getTargetCellFromView(g_worldState, g_camera.eye, g_camera.getForwardVector(), 1.35);

  if (!targetCell) {
    g_input.consumeAddBlockRequest();
    g_input.consumeRemoveBlockRequest();
    return;
  }

  if (g_input.consumeAddBlockRequest()) {
    const added = addBlock(g_worldState, targetCell.x, targetCell.z);
    setStatus(
      added
        ? `Raised block stack at (${targetCell.x}, ${targetCell.z}).`
        : "Could not add a block there.",
    );
  }

  if (g_input.consumeRemoveBlockRequest()) {
    const removed = removeBlock(g_worldState, targetCell.x, targetCell.z);
    setStatus(
      removed
        ? `Lowered block stack at (${targetCell.x}, ${targetCell.z}).`
        : "Could not remove a block there.",
    );
  }
}

function updateStory(nowSeconds) {
  const updateResult = updateStoryProgress(g_storyState, g_camera.eye, nowSeconds);

  if (updateResult.newlyCollectedIds.length > 0) {
    setStatus(`Recovered ${updateResult.newlyCollectedIds.join(", ")}. ${getStoryHudText(updateResult.storyState)}`);
  } else if (!g_storyState.completed && updateResult.storyState.completed) {
    setStatus("The fox spirit accepted the returned flames. The grove is restored.");
  }

  g_storyState = updateResult.storyState;
}

function renderScene(seconds) {
  const frameStart = performance.now();

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(g_programInfo.program);
  gl.uniformMatrix4fv(g_programInfo.u_ViewMatrix, false, g_camera.viewMatrixElements);
  gl.uniformMatrix4fv(g_programInfo.u_ProjectionMatrix, false, g_camera.projectionMatrixElements);

  renderWorldScene({
    seconds,
    storyState: g_storyState,
    worldState: g_worldState,
    drawPrimitive,
    matrixUtils: {
      cloneMatrix,
      createIdentityMatrix,
      withRotation,
      withScale,
      withTranslation,
    },
  });

  const frameTimeMs = performance.now() - frameStart;
  const fps = frameTimeMs > 0 ? (1000 / frameTimeMs) : 0;

  updateHud(frameTimeMs, fps);
}

function drawPrimitive(primitiveName, modelMatrix, color, textureIndex) {
  const primitive = g_buffers[primitiveName];

  gl.bindBuffer(gl.ARRAY_BUFFER, primitive.buffer);
  gl.vertexAttribPointer(g_programInfo.a_Position, 3, gl.FLOAT, false, primitive.stride * 4, 0);
  gl.enableVertexAttribArray(g_programInfo.a_Position);
  gl.vertexAttribPointer(g_programInfo.a_UV, 2, gl.FLOAT, false, primitive.stride * 4, 3 * 4);
  gl.enableVertexAttribArray(g_programInfo.a_UV);

  gl.uniformMatrix4fv(g_programInfo.u_ModelMatrix, false, modelMatrix.elements);
  gl.uniform4fv(g_programInfo.u_FragColor, new Float32Array(color));
  gl.uniform1i(g_programInfo.u_TextureIndex, textureIndex);
  gl.drawArrays(gl.TRIANGLES, 0, primitive.vertexCount);
}

function updateHud(frameTimeMs, fps) {
  document.getElementById("frameTime").textContent = `${frameTimeMs.toFixed(2)} ms`;
  document.getElementById("fpsValue").textContent = fps.toFixed(1);
  document.getElementById("storyStatus").textContent = getStoryHudText(g_storyState);
  document.getElementById("positionValue").textContent = `${g_camera.eye[0].toFixed(1)}, ${g_camera.eye[2].toFixed(1)}`;
}

function setStatus(message) {
  g_lastStatus = message;
  document.getElementById("statusLine").textContent = g_lastStatus;
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
