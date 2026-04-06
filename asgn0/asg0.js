// asg0.js

var canvas;
var ctx;

function main() {
  // get canvas and context
  canvas = document.getElementById('example');
  ctx = canvas.getContext('2d');

  // fill the canvas black
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // draw default v1
  var v1 = new Vector3([2.25, 2.25, 0]);
  drawVector(v1, "red");
}

function drawVector(v, color) {
  ctx.strokeStyle = color;
  ctx.beginPath();
  // origin is center of canvas
  var cx = canvas.width / 2;
  var cy = canvas.height / 2;
  ctx.moveTo(cx, cy);
  // scale by 20, and flip y since canvas y goes down
  ctx.lineTo(cx + v.elements[0] * 20, cy - v.elements[1] * 20);
  ctx.stroke();
}

function handleDrawEvent() {
  // clear canvas
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // read v1
  var x1 = parseFloat(document.getElementById('v1x').value);
  var y1 = parseFloat(document.getElementById('v1y').value);
  var v1 = new Vector3([x1, y1, 0]);
  drawVector(v1, "red");

  // read v2
  var x2 = parseFloat(document.getElementById('v2x').value);
  var y2 = parseFloat(document.getElementById('v2y').value);
  var v2 = new Vector3([x2, y2, 0]);
  drawVector(v2, "blue");
}

function angleBetween(v1, v2) {
  var d = Vector3.dot(v1, v2);
  var mag1 = v1.magnitude();
  var mag2 = v2.magnitude();
  if (mag1 === 0 || mag2 === 0) {
    console.log("Error: zero-length vector");
    return 0;
  }
  // clamp to handle floating point issues
  var cosAngle = d / (mag1 * mag2);
  cosAngle = Math.max(-1, Math.min(1, cosAngle));
  var angle = Math.acos(cosAngle);
  // convert to degrees
  return angle * (180.0 / Math.PI);
}

function areaTriangle(v1, v2) {
  var cross = Vector3.cross(v1, v2);
  // area of triangle is half the magnitude of the cross product
  return cross.magnitude() / 2.0;
}

function handleDrawOperationEvent() {
  // clear canvas
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // read v1 and v2
  var x1 = parseFloat(document.getElementById('v1x').value);
  var y1 = parseFloat(document.getElementById('v1y').value);
  var v1 = new Vector3([x1, y1, 0]);

  var x2 = parseFloat(document.getElementById('v2x').value);
  var y2 = parseFloat(document.getElementById('v2y').value);
  var v2 = new Vector3([x2, y2, 0]);

  // draw v1 red, v2 blue
  drawVector(v1, "red");
  drawVector(v2, "blue");

  var op = document.getElementById('op-select').value;
  var scalar = parseFloat(document.getElementById('scalar').value);

  if (op === "add") {
    var v3 = new Vector3([x1, y1, 0]);
    v3.add(v2);
    drawVector(v3, "green");

  } else if (op === "sub") {
    var v3 = new Vector3([x1, y1, 0]);
    v3.sub(v2);
    drawVector(v3, "green");

  } else if (op === "mul") {
    var v3 = new Vector3([x1, y1, 0]);
    v3.mul(scalar);
    var v4 = new Vector3([x2, y2, 0]);
    v4.mul(scalar);
    drawVector(v3, "green");
    drawVector(v4, "green");

  } else if (op === "div") {
    var v3 = new Vector3([x1, y1, 0]);
    v3.div(scalar);
    var v4 = new Vector3([x2, y2, 0]);
    v4.div(scalar);
    drawVector(v3, "green");
    drawVector(v4, "green");

  } else if (op === "magnitude") {
    console.log("Magnitude v1: " + v1.magnitude());
    console.log("Magnitude v2: " + v2.magnitude());

  } else if (op === "normalize") {
    var v3 = new Vector3([x1, y1, 0]);
    v3.normalize();
    var v4 = new Vector3([x2, y2, 0]);
    v4.normalize();
    drawVector(v3, "green");
    drawVector(v4, "green");

  } else if (op === "angle") {
    var angle = angleBetween(v1, v2);
    console.log("Angle: " + angle);

  } else if (op === "area") {
    var area = areaTriangle(v1, v2);
    console.log("Area of the triangle: " + area);
  }
}
