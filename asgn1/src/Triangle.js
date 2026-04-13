class Triangle {
  constructor({ position = null, color, size = 12, angle = 0, vertices = null }) {
    this.position = position ? Object.freeze([...position]) : null;
    this.color = Object.freeze([...color]);
    this.size = size;
    this.angle = angle;
    this.vertices = vertices ? Object.freeze([...vertices]) : null;
    Object.freeze(this);
  }

  render() {
    const vertices = this.vertices || buildTriangleVertices(this.position, this.size, this.angle);
    drawVertices(vertices, this.color, gl.TRIANGLES);
  }
}
