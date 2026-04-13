class Circle {
  constructor({ position, color, size, segments }) {
    this.position = Object.freeze([...position]);
    this.color = Object.freeze([...color]);
    this.size = size;
    this.segments = segments;
    Object.freeze(this);
  }

  render() {
    const vertices = buildCircleVertices(this.position, this.size, this.segments);
    drawVertices(vertices, this.color, gl.TRIANGLE_FAN);
  }
}
