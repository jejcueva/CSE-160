const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;

  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }
`;

const FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;

  void main() {
    gl_FragColor = u_FragColor;
  }
`;

const TOOL_POINT = "point";
const TOOL_TRIANGLE = "triangle";
const TOOL_CIRCLE = "circle";

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let vertexBuffer;

let g_selectedTool = TOOL_POINT;
let g_selectedSize = 18;
let g_selectedSegments = 18;
let g_selectedColor = Object.freeze([220 / 255, 32 / 255, 46 / 255, 1]);
let g_shapesList = Object.freeze([]);
let g_sceneTriangles = Object.freeze([]);
let g_lastPointer = null;
let g_lastStrokeAngle = -Math.PI / 2;

document.addEventListener("DOMContentLoaded", main);

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();
  renderAllShapes();
}

function setupWebGL() {
  canvas = document.getElementById("webgl");
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

  if (!gl) {
    throw new Error("WebGL is not supported in this browser.");
  }
}

function connectVariablesToGLSL() {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, VSHADER_SOURCE);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FSHADER_SOURCE);
  const program = createProgram(gl, vertexShader, fragmentShader);
  gl.useProgram(program);
  gl.program = program;

  a_Position = gl.getAttribLocation(program, "a_Position");
  u_FragColor = gl.getUniformLocation(program, "u_FragColor");
  u_Size = gl.getUniformLocation(program, "u_Size");

  if (a_Position < 0 || !u_FragColor || !u_Size) {
    throw new Error("Failed to locate shader variables.");
  }

  vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    throw new Error("Failed to create the vertex buffer.");
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
}

function addActionsForHtmlUI() {
  const toolButtons = Array.from(document.querySelectorAll(".tool-button"));
  toolButtons.forEach((button) => {
    button.addEventListener("click", () => {
      g_selectedTool = button.dataset.tool;
      toolButtons.forEach((entry) => entry.classList.toggle("is-active", entry === button));
      setStatus(`Brush set to ${capitalize(g_selectedTool)}.`);
    });
  });

  bindSlider("sizeSlider", "sizeValue", (value) => {
    g_selectedSize = value;
  });

  bindSlider("segmentsSlider", "segmentsValue", (value) => {
    g_selectedSegments = value;
  });

  bindSlider("redSlider", "redValue", updateBrushColor);
  bindSlider("greenSlider", "greenValue", updateBrushColor);
  bindSlider("blueSlider", "blueValue", updateBrushColor);

  document.getElementById("clearButton").addEventListener("click", () => {
    g_shapesList = Object.freeze([]);
    g_sceneTriangles = Object.freeze([]);
    renderAllShapes();
    setStatus("Canvas cleared.");
  });

  document.getElementById("drawReferenceButton").addEventListener("click", () => {
    g_shapesList = Object.freeze([]);
    g_sceneTriangles = Object.freeze(buildCardinalScene());
    renderAllShapes();
    setStatus("Reference picture loaded.");
  });

  canvas.addEventListener("mousedown", handleClicks);
  canvas.addEventListener("mousemove", handleDrag);
  canvas.addEventListener("mouseleave", resetDragState);
  window.addEventListener("mouseup", resetDragState);

  updateBrushColor();
}

function bindSlider(sliderId, valueId, onChange) {
  const slider = document.getElementById(sliderId);
  const valueLabel = document.getElementById(valueId);

  const handleChange = () => {
    const numericValue = Number(slider.value);
    valueLabel.textContent = String(numericValue);
    onChange(numericValue);
  };

  slider.addEventListener("input", handleChange);
  handleChange();
}

function updateBrushColor() {
  const red = Number(document.getElementById("redSlider").value);
  const green = Number(document.getElementById("greenSlider").value);
  const blue = Number(document.getElementById("blueSlider").value);

  g_selectedColor = Object.freeze([red / 255, green / 255, blue / 255, 1]);
  document.getElementById("redValue").textContent = String(red);
  document.getElementById("greenValue").textContent = String(green);
  document.getElementById("blueValue").textContent = String(blue);
  document.getElementById("colorSwatch").style.backgroundColor = `rgb(${red}, ${green}, ${blue})`;
}

function handleClicks(ev) {
  const pointer = getPointerData(ev);
  const newShapes = createShapesForPointer(pointer);

  g_shapesList = Object.freeze([...g_shapesList, ...newShapes]);
  g_lastPointer = pointer;
  renderAllShapes();
}

function handleDrag(ev) {
  if (ev.buttons !== 1) {
    return;
  }

  const pointer = getPointerData(ev);
  const newShapes = createShapesForPointer(pointer);

  if (newShapes.length === 0) {
    return;
  }

  g_shapesList = Object.freeze([...g_shapesList, ...newShapes]);
  g_lastPointer = pointer;
  renderAllShapes();
}

function createShapesForPointer(pointer) {
  if (!g_lastPointer) {
    g_lastStrokeAngle = -Math.PI / 2;
    return [createShape(pointer.position, g_lastStrokeAngle)];
  }

  const deltaX = pointer.pixel[0] - g_lastPointer.pixel[0];
  const deltaY = pointer.pixel[1] - g_lastPointer.pixel[1];
  const distance = Math.hypot(deltaX, deltaY);

  if (distance < 0.75) {
    return [];
  }

  g_lastStrokeAngle = Math.atan2(pointer.position[1] - g_lastPointer.position[1], pointer.position[0] - g_lastPointer.position[0]);

  const step = Math.max(4, g_selectedSize * 0.35);
  const segments = Math.max(1, Math.ceil(distance / step));
  const newShapes = [];

  for (let index = 1; index <= segments; index += 1) {
    const t = index / segments;
    const x = g_lastPointer.position[0] + (pointer.position[0] - g_lastPointer.position[0]) * t;
    const y = g_lastPointer.position[1] + (pointer.position[1] - g_lastPointer.position[1]) * t;
    newShapes.push(createShape([x, y], g_lastStrokeAngle));
  }

  return newShapes;
}

function createShape(position, angle) {
  const color = [...g_selectedColor];

  if (g_selectedTool === TOOL_TRIANGLE) {
    return new Triangle({ position, color, size: g_selectedSize, angle });
  }

  if (g_selectedTool === TOOL_CIRCLE) {
    return new Circle({ position, color, size: g_selectedSize, segments: g_selectedSegments });
  }

  return new Point({ position, color, size: g_selectedSize });
}

function resetDragState() {
  g_lastPointer = null;
}

function renderAllShapes() {
  const start = performance.now();
  gl.clearColor(0.985, 0.965, 0.94, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  g_sceneTriangles.forEach((shape) => {
    shape.render();
  });

  g_shapesList.forEach((shape) => {
    shape.render();
  });

  const elapsed = performance.now() - start;
  document.getElementById("shapeCount").textContent = `${g_shapesList.length + g_sceneTriangles.length} shapes`;
  document.getElementById("renderTime").textContent = `${elapsed.toFixed(2)} ms`;
}

function drawPoint(position, color, size) {
  gl.disableVertexAttribArray(a_Position);
  gl.uniform4fv(u_FragColor, new Float32Array(color));
  gl.uniform1f(u_Size, size);
  gl.vertexAttrib2f(a_Position, position[0], position[1]);
  gl.drawArrays(gl.POINTS, 0, 1);
}

function drawVertices(vertices, color, mode) {
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.uniform4fv(u_FragColor, new Float32Array(color));
  gl.uniform1f(u_Size, g_selectedSize);
  gl.drawArrays(mode, 0, vertices.length / 2);
}

function buildTriangleVertices(position, size, angle) {
  const radius = sizeToClipRadius(size);
  const rotation = angle - (Math.PI / 2);
  const localPoints = [
    [0, radius],
    [-radius * 0.6, -radius],
    [radius * 0.6, -radius],
  ];
  const points = [];

  localPoints.forEach(([x, y]) => {
    const rotatedX = (x * Math.cos(rotation)) - (y * Math.sin(rotation));
    const rotatedY = (x * Math.sin(rotation)) + (y * Math.cos(rotation));

    points.push(position[0] + rotatedX);
    points.push(position[1] + rotatedY);
  });

  return points;
}

function buildCircleVertices(position, size, segments) {
  const radius = sizeToClipRadius(size);
  const points = [position[0], position[1]];
  const segmentCount = Math.max(3, segments);

  for (let index = 0; index <= segmentCount; index += 1) {
    const theta = (index / segmentCount) * Math.PI * 2;
    points.push(position[0] + Math.cos(theta) * radius);
    points.push(position[1] + Math.sin(theta) * radius);
  }

  return points;
}

function sizeToClipRadius(size) {
  return (size / Math.max(canvas.width, canvas.height)) * 2.1;
}

function getPointerData(ev) {
  const rect = ev.target.getBoundingClientRect();
  const pixelX = ev.clientX - rect.left;
  const pixelY = ev.clientY - rect.top;
  const x = ((pixelX / rect.width) * 2) - 1;
  const y = 1 - ((pixelY / rect.height) * 2);

  return Object.freeze({
    position: Object.freeze([x, y]),
    pixel: Object.freeze([pixelX, pixelY]),
  });
}

function buildCardinalScene() {
  return buildCardinalSceneFromModel(modelTriangle);
}

function triangle(vertices, color) {
  return new Triangle({ vertices, color });
}

function modelTriangle(modelVertices, color) {
  return triangle(modelToClipVertices(modelVertices), color);
}

function modelToClipVertices(modelVertices) {
  const scale = 0.0125;
  const offsetX = -0.57;
  const offsetY = -0.62;
  const clipVertices = [];

  for (let index = 0; index < modelVertices.length; index += 2) {
    clipVertices.push(offsetX + (modelVertices[index] * scale));
    clipVertices.push(offsetY + (modelVertices[index + 1] * scale));
  }

  return clipVertices;
}

function createShader(context, type, source) {
  const shader = context.createShader(type);
  context.shaderSource(shader, source);
  context.compileShader(shader);

  if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
    const message = context.getShaderInfoLog(shader);
    context.deleteShader(shader);
    throw new Error(message || "Shader compilation failed.");
  }

  return shader;
}

function createProgram(context, vertexShader, fragmentShader) {
  const program = context.createProgram();
  context.attachShader(program, vertexShader);
  context.attachShader(program, fragmentShader);
  context.linkProgram(program);

  if (!context.getProgramParameter(program, context.LINK_STATUS)) {
    const message = context.getProgramInfoLog(program);
    context.deleteProgram(program);
    throw new Error(message || "Program linking failed.");
  }

  return program;
}

function setStatus(message) {
  document.getElementById("statusLine").textContent = message;
}

function capitalize(value) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
