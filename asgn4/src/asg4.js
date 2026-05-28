const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_NormalMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;

  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec3 v_WorldPosition;

  void main() {
    vec4 worldPosition = u_ModelMatrix * a_Position;

    gl_Position = u_ProjectionMatrix * u_ViewMatrix * worldPosition;
    v_UV = a_UV;
    v_Normal = normalize((u_NormalMatrix * vec4(a_Normal, 0.0)).xyz);
    v_WorldPosition = worldPosition.xyz;
  }
`;

const FSHADER_SOURCE = `
  precision mediump float;

  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec3 v_WorldPosition;

  uniform vec4 u_FragColor;
  uniform int u_TextureIndex;
  uniform int u_LightingEnabled;
  uniform int u_NormalVisualizationEnabled;
  uniform int u_PointLightEnabled;
  uniform int u_SpotLightEnabled;
  uniform vec3 u_CameraPosition;
  uniform vec3 u_PointLightPosition;
  uniform vec3 u_PointLightColor;
  uniform vec3 u_SpotLightPosition;
  uniform vec3 u_SpotLightDirection;
  uniform vec3 u_SpotLightColor;
  uniform float u_SpotInnerCutoff;
  uniform float u_SpotOuterCutoff;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;

  vec4 getBaseColor() {
    if (u_TextureIndex == -1) {
      return u_FragColor;
    }

    if (u_TextureIndex == 0) {
      return texture2D(u_Sampler0, v_UV);
    }

    if (u_TextureIndex == 1) {
      return texture2D(u_Sampler1, v_UV);
    }

    if (u_TextureIndex == 2) {
      return texture2D(u_Sampler2, v_UV);
    }

    return texture2D(u_Sampler3, v_UV);
  }

  vec3 applyPhongLight(
    vec3 normal,
    vec3 viewDirection,
    vec3 lightDirection,
    vec3 lightColor,
    vec3 baseColor,
    float attenuation
  ) {
    float diffuseAmount = max(dot(normal, lightDirection), 0.0);
    vec3 reflectDirection = reflect(-lightDirection, normal);
    float specularAmount = pow(max(dot(viewDirection, reflectDirection), 0.0), 32.0);
    vec3 diffuse = diffuseAmount * baseColor * lightColor;
    vec3 specular = specularAmount * 0.72 * lightColor;

    return (diffuse + specular) * attenuation;
  }

  void main() {
    vec4 baseColor = getBaseColor();
    vec3 normal = normalize(v_Normal);

    if (u_NormalVisualizationEnabled == 1) {
      gl_FragColor = vec4((normal * 0.5) + 0.5, 1.0);
      return;
    }

    if (u_LightingEnabled == 0) {
      gl_FragColor = baseColor;
      return;
    }

    vec3 viewDirection = normalize(u_CameraPosition - v_WorldPosition);
    vec3 litColor = baseColor.rgb * 0.22;

    if (u_PointLightEnabled == 1) {
      vec3 pointOffset = u_PointLightPosition - v_WorldPosition;
      float pointDistance = length(pointOffset);
      float pointAttenuation = 1.0 / (1.0 + (0.035 * pointDistance) + (0.004 * pointDistance * pointDistance));
      litColor += applyPhongLight(
        normal,
        viewDirection,
        normalize(pointOffset),
        u_PointLightColor,
        baseColor.rgb,
        pointAttenuation
      );
    }

    if (u_SpotLightEnabled == 1) {
      vec3 spotToFragment = normalize(v_WorldPosition - u_SpotLightPosition);
      float theta = dot(spotToFragment, normalize(u_SpotLightDirection));
      float spotIntensity = clamp(
        (theta - u_SpotOuterCutoff) / (u_SpotInnerCutoff - u_SpotOuterCutoff),
        0.0,
        1.0
      );
      vec3 spotOffset = u_SpotLightPosition - v_WorldPosition;
      float spotDistance = length(spotOffset);
      float spotAttenuation = spotIntensity / (1.0 + (0.025 * spotDistance) + (0.003 * spotDistance * spotDistance));
      litColor += applyPhongLight(
        normal,
        viewDirection,
        normalize(spotOffset),
        u_SpotLightColor,
        baseColor.rgb,
        spotAttenuation
      );
    }

    gl_FragColor = vec4(min(litColor, vec3(1.0)), baseColor.a);
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
let g_lightState;
let g_previousSeconds = 0;
let g_lastStatus = "Loading the grove.";
let g_lightControls;

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
  g_lightState = createDefaultLightState();
  g_camera = new Camera({
    eye: SPAWN_POINT.eye,
    yaw: SPAWN_POINT.yaw,
    pitch: SPAWN_POINT.pitch,
    aspect: canvas.width / canvas.height,
  });

  bindSamplerUniforms();
  bindLightControls();
  setStatus("Loading grove textures and the local OBJ model.");
  g_textures = await loadTextureSet(gl, TEXTURE_DEFINITIONS);
  await loadAssignment4Model();

  g_input = createInputController({
    canvas,
    onLook(deltaX, deltaY) {
      g_camera.panRight(deltaX * 0.18);
      g_camera.tilt(-deltaY * 0.12);
    },
  });

  setStatus("Assignment 4 ready. Explore the lit grove and use the controls to inspect the lights.");
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
    a_Normal: gl.getAttribLocation(program, "a_Normal"),
    u_ModelMatrix: gl.getUniformLocation(program, "u_ModelMatrix"),
    u_NormalMatrix: gl.getUniformLocation(program, "u_NormalMatrix"),
    u_ViewMatrix: gl.getUniformLocation(program, "u_ViewMatrix"),
    u_ProjectionMatrix: gl.getUniformLocation(program, "u_ProjectionMatrix"),
    u_FragColor: gl.getUniformLocation(program, "u_FragColor"),
    u_TextureIndex: gl.getUniformLocation(program, "u_TextureIndex"),
    u_LightingEnabled: gl.getUniformLocation(program, "u_LightingEnabled"),
    u_NormalVisualizationEnabled: gl.getUniformLocation(program, "u_NormalVisualizationEnabled"),
    u_PointLightEnabled: gl.getUniformLocation(program, "u_PointLightEnabled"),
    u_SpotLightEnabled: gl.getUniformLocation(program, "u_SpotLightEnabled"),
    u_CameraPosition: gl.getUniformLocation(program, "u_CameraPosition"),
    u_PointLightPosition: gl.getUniformLocation(program, "u_PointLightPosition"),
    u_PointLightColor: gl.getUniformLocation(program, "u_PointLightColor"),
    u_SpotLightPosition: gl.getUniformLocation(program, "u_SpotLightPosition"),
    u_SpotLightDirection: gl.getUniformLocation(program, "u_SpotLightDirection"),
    u_SpotLightColor: gl.getUniformLocation(program, "u_SpotLightColor"),
    u_SpotInnerCutoff: gl.getUniformLocation(program, "u_SpotInnerCutoff"),
    u_SpotOuterCutoff: gl.getUniformLocation(program, "u_SpotOuterCutoff"),
    u_Sampler0: gl.getUniformLocation(program, "u_Sampler0"),
    u_Sampler1: gl.getUniformLocation(program, "u_Sampler1"),
    u_Sampler2: gl.getUniformLocation(program, "u_Sampler2"),
    u_Sampler3: gl.getUniformLocation(program, "u_Sampler3"),
  });

  if (
    g_programInfo.a_Position < 0
    || g_programInfo.a_UV < 0
    || g_programInfo.a_Normal < 0
    || g_programInfo.u_ModelMatrix === null
    || g_programInfo.u_NormalMatrix === null
    || g_programInfo.u_ViewMatrix === null
    || g_programInfo.u_ProjectionMatrix === null
    || g_programInfo.u_FragColor === null
    || g_programInfo.u_TextureIndex === null
    || g_programInfo.u_LightingEnabled === null
    || g_programInfo.u_NormalVisualizationEnabled === null
    || g_programInfo.u_PointLightEnabled === null
    || g_programInfo.u_SpotLightEnabled === null
    || g_programInfo.u_CameraPosition === null
    || g_programInfo.u_PointLightPosition === null
    || g_programInfo.u_PointLightColor === null
    || g_programInfo.u_SpotLightPosition === null
    || g_programInfo.u_SpotLightDirection === null
    || g_programInfo.u_SpotLightColor === null
    || g_programInfo.u_SpotInnerCutoff === null
    || g_programInfo.u_SpotOuterCutoff === null
  ) {
    throw new Error("Failed to bind shader variables.");
  }
}

function initializePrimitiveBuffers() {
  const cubeGeometry = createTexturedCubeData();
  const coneGeometry = createConeData(24);
  const sphereGeometry = createSphereData(28, 18);

  g_buffers = Object.freeze({
    cube: createStaticBuffer(cubeGeometry),
    cone: createStaticBuffer(coneGeometry),
    sphere: createStaticBuffer(sphereGeometry),
  });
}

async function loadAssignment4Model() {
  try {
    const modelGeometry = await loadObjGeometry("assets/models/spirit-lantern.obj");
    g_buffers = Object.freeze({
      ...g_buffers,
      objModel: createStaticBuffer(modelGeometry),
    });
    setStatus("Loaded textures and OBJ model.");
  } catch (error) {
    console.error(error);
    setStatus("Textures loaded, but the OBJ model could not be loaded.");
  }
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

function bindLightControls() {
  g_lightControls = Object.freeze({
    lightingToggle: document.getElementById("lightingToggle"),
    normalToggle: document.getElementById("normalToggle"),
    pointToggle: document.getElementById("pointToggle"),
    spotToggle: document.getElementById("spotToggle"),
    lightX: document.getElementById("lightX"),
    lightY: document.getElementById("lightY"),
    lightZ: document.getElementById("lightZ"),
    lightRed: document.getElementById("lightRed"),
    lightGreen: document.getElementById("lightGreen"),
    lightBlue: document.getElementById("lightBlue"),
    lightOffsetValue: document.getElementById("lightOffsetValue"),
    lightColorValue: document.getElementById("lightColorValue"),
    lightColorSwatch: document.getElementById("lightColorSwatch"),
  });

  Object.values(g_lightControls).forEach((control) => {
    if (!control) {
      throw new Error("Missing one or more light controls in the page.");
    }
  });

  g_lightControls.lightingToggle.addEventListener("click", () => {
    g_lightState = resolveLightState(g_lightState, {
      lightingEnabled: !g_lightState.lightingEnabled,
    });
    updateLightControlLabels();
  });

  g_lightControls.normalToggle.addEventListener("click", () => {
    g_lightState = resolveLightState(g_lightState, {
      normalVisualizationEnabled: !g_lightState.normalVisualizationEnabled,
    });
    updateLightControlLabels();
  });

  g_lightControls.pointToggle.addEventListener("click", () => {
    g_lightState = resolveLightState(g_lightState, {
      pointLightEnabled: !g_lightState.pointLightEnabled,
    });
    updateLightControlLabels();
  });

  g_lightControls.spotToggle.addEventListener("click", () => {
    g_lightState = resolveLightState(g_lightState, {
      spotLightEnabled: !g_lightState.spotLightEnabled,
    });
    updateLightControlLabels();
  });

  [
    g_lightControls.lightX,
    g_lightControls.lightY,
    g_lightControls.lightZ,
  ].forEach((slider) => {
    slider.addEventListener("input", () => {
      g_lightState = resolveLightState(g_lightState, {
        pointOffset: [
          Number(g_lightControls.lightX.value),
          Number(g_lightControls.lightY.value),
          Number(g_lightControls.lightZ.value),
        ],
      });
      updateLightControlLabels();
    });
  });

  [
    g_lightControls.lightRed,
    g_lightControls.lightGreen,
    g_lightControls.lightBlue,
  ].forEach((slider) => {
    slider.addEventListener("input", () => {
      g_lightState = resolveLightState(g_lightState, {
        pointColor: [
          Number(g_lightControls.lightRed.value),
          Number(g_lightControls.lightGreen.value),
          Number(g_lightControls.lightBlue.value),
        ],
      });
      updateLightControlLabels();
    });
  });

  updateLightControlLabels();
}

function updateLightControlLabels() {
  g_lightControls.lightingToggle.textContent = `Lighting: ${g_lightState.lightingEnabled ? "On" : "Off"}`;
  g_lightControls.normalToggle.textContent = `Normals: ${g_lightState.normalVisualizationEnabled ? "On" : "Off"}`;
  g_lightControls.pointToggle.textContent = `Point: ${g_lightState.pointLightEnabled ? "On" : "Off"}`;
  g_lightControls.spotToggle.textContent = `Spot: ${g_lightState.spotLightEnabled ? "On" : "Off"}`;
  g_lightControls.lightOffsetValue.textContent = g_lightState.pointOffset
    .map((value) => value.toFixed(1))
    .join(", ");
  g_lightControls.lightColorValue.textContent = g_lightState.pointColor
    .map((value) => value.toFixed(2))
    .join(", ");

  const [red, green, blue] = g_lightState.pointColor.map((value) => Math.round(value * 255));
  g_lightControls.lightColorSwatch.style.backgroundColor = `rgb(${red}, ${green}, ${blue})`;
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
  const lighting = bindLightingUniforms(seconds);

  gl.uniformMatrix4fv(g_programInfo.u_ViewMatrix, false, g_camera.viewMatrixElements);
  gl.uniformMatrix4fv(g_programInfo.u_ProjectionMatrix, false, g_camera.projectionMatrixElements);

  renderWorldScene({
    seconds,
    storyState: g_storyState,
    worldState: g_worldState,
    drawPrimitive,
    matrixUtils: {
      cloneMatrix,
      createPlacementMatrix,
      createIdentityMatrix,
      multiplyModelMatrices,
      withRotation,
      withScale,
      withTranslation,
    },
  });

  renderAssignment4Showcase({
    seconds,
    lightPosition: lighting.pointLightPosition,
    spotLightPosition: lighting.spotLightPosition,
    objModelReady: Boolean(g_buffers.objModel),
    drawPrimitive,
    matrixUtils: {
      createIdentityMatrix,
      withRotation,
      withScale,
      withTranslation,
    },
  });

  const frameTimeMs = performance.now() - frameStart;
  const fps = frameTimeMs > 0 ? (1000 / frameTimeMs) : 0;

  updateHud(frameTimeMs, fps, lighting.pointLightPosition);
}

function bindLightingUniforms(seconds) {
  const pointLightPosition = createPointLightPosition(seconds, g_lightState);
  const spotLightPosition = [SHRINE_RETURN_ZONE.worldX + 1.6, 5.6, SHRINE_RETURN_ZONE.worldZ + 4.2];
  const spotTarget = [SHRINE_RETURN_ZONE.worldX, 0.45, SHRINE_RETURN_ZONE.worldZ];
  const spotLightDirection = normalize3(subtract3(spotTarget, spotLightPosition));

  gl.uniform1i(g_programInfo.u_LightingEnabled, g_lightState.lightingEnabled ? 1 : 0);
  gl.uniform1i(g_programInfo.u_NormalVisualizationEnabled, g_lightState.normalVisualizationEnabled ? 1 : 0);
  gl.uniform1i(g_programInfo.u_PointLightEnabled, g_lightState.pointLightEnabled ? 1 : 0);
  gl.uniform1i(g_programInfo.u_SpotLightEnabled, g_lightState.spotLightEnabled ? 1 : 0);
  gl.uniform3fv(g_programInfo.u_CameraPosition, new Float32Array(g_camera.eye));
  gl.uniform3fv(g_programInfo.u_PointLightPosition, new Float32Array(pointLightPosition));
  gl.uniform3fv(g_programInfo.u_PointLightColor, new Float32Array(g_lightState.pointColor));
  gl.uniform3fv(g_programInfo.u_SpotLightPosition, new Float32Array(spotLightPosition));
  gl.uniform3fv(g_programInfo.u_SpotLightDirection, new Float32Array(spotLightDirection));
  gl.uniform3fv(g_programInfo.u_SpotLightColor, new Float32Array(g_lightState.spotColor));
  gl.uniform1f(g_programInfo.u_SpotInnerCutoff, Math.cos(12 * (Math.PI / 180)));
  gl.uniform1f(g_programInfo.u_SpotOuterCutoff, Math.cos(22 * (Math.PI / 180)));

  return Object.freeze({
    pointLightPosition,
    spotLightPosition,
  });
}

function drawPrimitive(primitiveName, modelMatrix, color, textureIndex = -1) {
  const primitive = g_buffers[primitiveName];

  if (!primitive) {
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, primitive.buffer);
  gl.vertexAttribPointer(g_programInfo.a_Position, 3, gl.FLOAT, false, primitive.stride * 4, 0);
  gl.enableVertexAttribArray(g_programInfo.a_Position);
  gl.vertexAttribPointer(g_programInfo.a_UV, 2, gl.FLOAT, false, primitive.stride * 4, 3 * 4);
  gl.enableVertexAttribArray(g_programInfo.a_UV);
  gl.vertexAttribPointer(g_programInfo.a_Normal, 3, gl.FLOAT, false, primitive.stride * 4, 5 * 4);
  gl.enableVertexAttribArray(g_programInfo.a_Normal);

  gl.uniformMatrix4fv(g_programInfo.u_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(g_programInfo.u_NormalMatrix, false, createNormalMatrixElements(modelMatrix));
  gl.uniform4fv(g_programInfo.u_FragColor, new Float32Array(color));
  gl.uniform1i(g_programInfo.u_TextureIndex, textureIndex);
  gl.drawArrays(gl.TRIANGLES, 0, primitive.vertexCount);
}

function updateHud(frameTimeMs, fps, pointLightPosition) {
  document.getElementById("frameTime").textContent = `${frameTimeMs.toFixed(2)} ms`;
  document.getElementById("fpsValue").textContent = fps.toFixed(1);
  document.getElementById("storyStatus").textContent = getStoryHudText(g_storyState);
  document.getElementById("positionValue").textContent = `${g_camera.eye[0].toFixed(1)}, ${g_camera.eye[2].toFixed(1)}`;
  document.getElementById("lightPositionValue").textContent = pointLightPosition
    .map((value) => value.toFixed(1))
    .join(", ");
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
