import konva from 'konva'
export function isPlainObject (obj) {
  if (typeof obj !== 'object' || obj === null) return false
  let proto = Object.getPrototypeOf(obj)
  if (proto === null) return true
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto)
  }
  return Object.getPrototypeOf(obj) === proto
}

export function isArray (arr) {
  return Array.isArray(arr)
}

export function isFunc (func) {
  return typeof func === 'function'
}

// 是否是konva原生的group实例
export function isKonvaNativeGroup (group) {
  if (!group) return false
  Object.getPrototypeOf(group) === konva.Group.prototype
}
