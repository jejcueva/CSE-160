class Point {
  constructor({ position, color, size }) {
    this.position = Object.freeze([...position]);
    this.color = Object.freeze([...color]);
    this.size = size;
    Object.freeze(this);
  }

  render() {
    drawPoint(this.position, this.color, this.size);
  }
}
