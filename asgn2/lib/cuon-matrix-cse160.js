// cuon-matrix-cse160.js

//
// a 4x4 matrix and 3d vector utility library
//

// 3-component vector class
class Vector3 {
  constructor(opt_src) {
    var v = new Float32Array(3);
    if (opt_src && typeof opt_src === 'object') {
      v[0] = opt_src[0];
      v[1] = opt_src[1];
      v[2] = opt_src[2];
    }
    this.elements = v;
  }

  set(src) {
    var v = this.elements;
    var s = src.elements;
    v[0] = s[0]; v[1] = s[1]; v[2] = s[2];
    return this;
  }

  // add another vector to this one
  add(other) {
    var e = this.elements;
    var o = other.elements;
    e[0] += o[0];
    e[1] += o[1];
    e[2] += o[2];
    return this;
  }

  // subtract another vector from this one
  sub(other) {
    var e = this.elements;
    var o = other.elements;
    e[0] -= o[0];
    e[1] -= o[1];
    e[2] -= o[2];
    return this;
  }

  // multiply this vector by a scalar
  mul(scalar) {
    var e = this.elements;
    e[0] *= scalar;
    e[1] *= scalar;
    e[2] *= scalar;
    return this;
  }

  // divide this vector by a scalar
  div(scalar) {
    var e = this.elements;
    if (scalar === 0) {
      console.log("Error: division by zero");
      return this;
    }
    e[0] /= scalar;
    e[1] /= scalar;
    e[2] /= scalar;
    return this;
  }

  // return the magnitude of this vector
  magnitude() {
    var e = this.elements;
    return Math.sqrt(e[0]*e[0] + e[1]*e[1] + e[2]*e[2]);
  }

  // normalize this vector
  normalize() {
    var mag = this.magnitude();
    if (mag === 0) {
      console.log("Error: zero-length vector cannot be normalized");
      return this;
    }
    this.div(mag);
    return this;
  }

  // static dot product
  static dot(v1, v2) {
    var a = v1.elements;
    var b = v2.elements;
    return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  }

  // static cross product
  static cross(v1, v2) {
    var a = v1.elements;
    var b = v2.elements;
    var result = new Vector3([
      a[1]*b[2] - a[2]*b[1],
      a[2]*b[0] - a[0]*b[2],
      a[0]*b[1] - a[1]*b[0]
    ]);
    return result;
  }
}

// 4x4 matrix class
class Matrix4 {
  constructor() {
    this.elements = new Float32Array(16);
    this.setIdentity();
  }

  setIdentity() {
    var e = this.elements;
    e[0]=1; e[4]=0; e[8]=0;  e[12]=0;
    e[1]=0; e[5]=1; e[9]=0;  e[13]=0;
    e[2]=0; e[6]=0; e[10]=1; e[14]=0;
    e[3]=0; e[7]=0; e[11]=0; e[15]=1;
    return this;
  }

  translate(x, y, z) {
    var e = this.elements;
    e[12] += x*e[0] + y*e[4] + z*e[8];
    e[13] += x*e[1] + y*e[5] + z*e[9];
    e[14] += x*e[2] + y*e[6] + z*e[10];
    e[15] += x*e[3] + y*e[7] + z*e[11];
    return this;
  }

  scale(x, y, z) {
    var e = this.elements;
    e[0] *= x;  e[4] *= y;  e[8]  *= z;
    e[1] *= x;  e[5] *= y;  e[9]  *= z;
    e[2] *= x;  e[6] *= y;  e[10] *= z;
    e[3] *= x;  e[7] *= y;  e[11] *= z;
    return this;
  }

  rotate(angle, x, y, z) {
    var rad = Math.PI * angle / 180.0;
    var len = Math.hypot(x, y, z);
    if (len === 0) { return this; }
    x /= len; y /= len; z /= len;
    var s = Math.sin(rad), c = Math.cos(rad), t = 1 - c;

    var r00 = t*x*x + c;
    var r01 = t*x*y + z*s;
    var r02 = t*x*z - y*s;
    var r10 = t*x*y - z*s;
    var r11 = t*y*y + c;
    var r12 = t*y*z + x*s;
    var r20 = t*x*z + y*s;
    var r21 = t*y*z - x*s;
    var r22 = t*z*z + c;

    var e = this.elements;
    var m00 = e[0], m01 = e[4], m02 = e[8],  m03 = e[12];
    var m10 = e[1], m11 = e[5], m12 = e[9],  m13 = e[13];
    var m20 = e[2], m21 = e[6], m22 = e[10], m23 = e[14];
    var m30 = e[3], m31 = e[7], m32 = e[11], m33 = e[15];

    e[0]  = r00*m00 + r01*m10 + r02*m20;
    e[4]  = r00*m01 + r01*m11 + r02*m21;
    e[8]  = r00*m02 + r01*m12 + r02*m22;
    e[12] = r00*m03 + r01*m13 + r02*m23;

    e[1]  = r10*m00 + r11*m10 + r12*m20;
    e[5]  = r10*m01 + r11*m11 + r12*m21;
    e[9]  = r10*m02 + r11*m12 + r12*m22;
    e[13] = r10*m03 + r11*m13 + r12*m23;

    e[2]  = r20*m00 + r21*m10 + r22*m20;
    e[6]  = r20*m01 + r21*m11 + r22*m21;
    e[10] = r20*m02 + r21*m12 + r22*m22;
    e[14] = r20*m03 + r21*m13 + r22*m23;

    e[3]  = m30; e[7]  = m31; e[11] = m32; e[15] = m33;
    return this;
  }

  multiply(other) {
    var a = this.elements, b = other.elements;
    var tmp = new Float32Array(16);
    for (var i = 0; i < 4; ++i) {
      for (var j = 0; j < 4; ++j) {
        tmp[i*4 + j] =
          a[i*4 + 0] * b[0*4 + j] +
          a[i*4 + 1] * b[1*4 + j] +
          a[i*4 + 2] * b[2*4 + j] +
          a[i*4 + 3] * b[3*4 + j];
      }
    }
    this.elements.set(tmp);
    return this;
  }
}

window.Vector3 = Vector3;
window.Matrix4 = Matrix4;
