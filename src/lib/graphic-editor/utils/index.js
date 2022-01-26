/**
 * @arr 坐标点的数据
 * @return [{x, y}]
 * */
export function toControlPoints (arr) {
  const res = []
  for (let i = 0; i < arr.length; i += 2) {
    res.push({
      x: arr[i],
      y: arr[i + 1]
    })
  }
  return res
}

/**
 * 判断数组
*/
export function isArray (obj) {
  return Array.isArray(obj)
}

/**
 * 判断对象
*/
export function isObject (obj) {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

// 根据鼠标位置转换为场景的位置
export function transformPointByPointer (stage, pointerPosition) {
  return stage.getAbsoluteTransform().copy().invert().point(pointerPosition)
}

/**
 * 深度合并 a, b
 * 支持数组和对象
*/
const NO_MEREGE_SYMBOL = '__NO__MERGE'
export function deepMerge (a, b) {
  if (isObject(a) && isObject(b)) {
    for (const key in b) {
      const res = deepMerge(a[key], b[key])
      if (res !== NO_MEREGE_SYMBOL) {
        a[key] = typeof res === 'object' ? JSON.parse(JSON.stringify(res)) : res
      }
    }
    return NO_MEREGE_SYMBOL
  }
  if (isArray(a) && isArray(b)) {
    for (let i = 0; i < b.length; i++) {
      if (i < a.length) {
        const res = deepMerge(a[i], b[i])
        if (res !== NO_MEREGE_SYMBOL) {
          a[i] = typeof res === 'object' ? JSON.parse(JSON.stringify(res)) : res
        }
      } else {
        a.push(b[i])
      }
    }
    return NO_MEREGE_SYMBOL
  }
  return b
}

/**
 * 深度合并 可传入多个对象
*/
export function deepMerges (a, ...mergeItems) {
  mergeItems.forEach(b => {
    if (b !== undefined) {
      deepMerge(a, b)
    }
  })
  return a
}

/**
 * 角度转弧度
*/
const PI = Math.PI
export function degToRad (deg) {
  return deg / 180 * PI
}
