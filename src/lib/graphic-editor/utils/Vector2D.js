/**
 * 二维向量
*/
class Vector2D {
  constructor (x = 1, y = 0) {
    this.x = x
    this.y = y
    this._x = x
    this._y = y
    this._deg = 0
  }
  reset () {
    this.x = this._x
    this.y = this._y
  }
  set (x, y) {
    this.x = x
    this.y = y
  }
  setFromVec (vec) {
    this.x = vec.x
    this.y = vec.y
  }
  len () {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }
  dir () {
    return Math.atan2(this.y, this.x)
  }
  copy () {
    return new Vector2D(this.x, this.y)
  }
  add (v) {
    this.x += v.x
    this.y += v.y
    return this
  }
  sub (v) {
    this.x -= v.x
    this.y -= v.y
    return this
  }
  scale (a) {
    this.x *= a
    this.y *= a
    return this
  }
  cross (v) {
    return this.x * v.y - v.x * this.y
  }
  dot (v) {
    return this.x * v.x + v.y * this.y
  }
  normalize () {
    return this.scale(1 / this.len)
  }
  rotate (deg) {
    const rad = deg / 180 * Math.PI
    const c = Math.cos(rad)
    const s = Math.sin(rad)
    const { x, y } = this
    this.x = x * c + y * -s
    this.y = x * s + y * c
    this._deg += deg
    return this
  }
  rotation (deg) {
    this.rotate(-this._deg)
    this._deg = 0
    return this.rotate(deg)
  }
}
export default Vector2D
