import WiringDiagramComponents from '../components'
import konva from 'konva'
import { isArray, isObject } from './index'

/**
 * 通过json创建节点
 * @param json: string | object
 * @return nodes: Node[]
*/
export function createNodesByJSON (json) {
  if (!json) throw new Error('json is required')
  if (typeof json === 'string') {
    try {
      json = JSON.parse(json)
    } catch (e) {
      json = {}
    }
  }
  let jsonArray
  if (isObject(json)) {
    jsonArray = [json]
  } else if (isArray(json)) {
    jsonArray = json
  } else {
    throw new Error('json must be object or array')
  }
  return jsonArray.map(item => createNode(item))
}

/**
 * 创建节点
*/
function createNode (item) {
  const className = item.className
  if (WiringDiagramComponents[className]) {
    const Node = WiringDiagramComponents[className]
    return new Node(item)
  }
  if (konva[className]) {
    return konva.Node.create(item)
  }
  console.error('未知的节点: ' + className)
}

/**
 * 根据多个矩形区域，计算出最小包围矩形
 * @params clientRects: Array<{ x: number; y: number; width: number; height: number }>
 * @return rect: { x: number; y: number; width: number; height: number }
*/
export function calcClientRectByMultiClientRects (clientRects) {
  let minLeft = Infinity
  let maxLeft = -Infinity
  let minTop = Infinity
  let maxTop = -Infinity
  clientRects.forEach(rect => {
    minLeft = Math.min(minLeft, rect.x)
    maxLeft = Math.max(maxLeft, rect.x + rect.width)
    minTop = Math.min(minTop, rect.y)
    maxTop = Math.max(maxTop, rect.y + rect.height)
  })
  return {
    x: minLeft,
    y: minTop,
    width: maxLeft - minLeft,
    height: maxTop - minTop
  }
}

// 判断包含关系
export function contains (parent, child) {
  const children = parent.children
  if (children && children.length) {
    for (let i = 0; i < children.length; i++) {
      if (children[i] === child || (children[i].children && contains(children[i], child))) return true
    }
  }
  return false
}

// 是否是自定义的接线图节点
export function isWiringDiagramNode (node) {
  return WiringDiagramComponents.BaseComponent.isBaseComponent(node) ||
  WiringDiagramComponents.ComponentGroup.isComponentGroup(node) ||
  WiringDiagramComponents.NormalGroup.isNormalGroup(node) ||
  WiringDiagramComponents.Component.isComponent(node) ||
  WiringDiagramComponents.EditableText.isEditableText(node)
}

// 矩形相交
export function haveIntersection (r1, r2) {
  return !(
    r2.x > r1.x + r1.width ||
    r2.x + r2.width < r1.x ||
    r2.y > r1.y + r1.height ||
    r2.y + r2.height < r1.y
  )
}
