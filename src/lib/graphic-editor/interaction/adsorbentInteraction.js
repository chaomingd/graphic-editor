/**
 * 元件吸附交互
*/
import BaseComponent from '../components/base/BaseComponent'
import ComponentGroup from '../components/base/ComponentGroup'
// import ComponentNames from '../components/base/ComponentNames'
import { ControlPoint, ControlPointRect } from '../components/ControlPoint'
// import konva from 'konva'
import ThemeColor from '../theme/themeConfig'

// 碰撞检测直径
const DIAMETER = ThemeColor.controlPoint.style.radius * 2

// 事件命名 移除事件时有用
const EVENT_NAME = 'joinComponentInteraction'

// 拖拽的目标
let dragTarget
// 拖拽目标的控制点
let points
// 需要进行碰撞检测的点
let detectPoints
// 碰撞检测的距离  (圆的直径乘以缩放系数)
let detectDistance
// 上一次目标控制点
let lastTargetPoint
// 上移碰撞的控制点
let lastCollidePoint
// 当前的目标控制点
let targetPoint
// 当前碰撞的控制点
let collidePoint

// 是否是组件或者组件分组
function isComponentOrComponentGroup (node) {
  return BaseComponent.isBaseComponent(node) || node instanceof ComponentGroup
}
// 找到需要进行碰撞检测的控制点
function findControlPoints (result, nodes, filterNode) {
  nodes && nodes.forEach(node => {
    if (node !== filterNode) {
      if (node.controlPoints) {
        node.controlPoints.forEach(pointShape => {
          if (!pointShape.isSilent()) {
            result.push({ target: pointShape, position: pointShape.getAbsolutePosition() })
          }
        })
      }
      findControlPoints(result, node.children, filterNode)
    }
  })
}
// 碰撞检测
function collisionDetection () {
  targetPoint = null
  collidePoint = null
  if (!points || !points.length) return
  for (let i = 0; i < points.length; i++) {
    const resPoint = collides(points[i], detectPoints, detectDistance)
    if (resPoint) {
      targetPoint = points[i]
      collidePoint = resPoint
    }
  }
  if (targetPoint) {
    // 检测到了碰撞设置控制点的样式
    if (lastTargetPoint !== targetPoint) {
      targetPoint.collision()
      collidePoint.target.collision()
      lastTargetPoint = targetPoint
      lastCollidePoint = collidePoint
    }
  } else {
    // 未检测到碰撞恢复上一次检测到碰撞的控制点的样式
    if (lastCollidePoint) {
      lastTargetPoint.unCollision()
      lastCollidePoint.target.unCollision()
      lastTargetPoint = null
      lastCollidePoint = null
    }
  }
}
// 圆于圆的碰撞检测
function collides (point, detectPoints, distance) {
  const position = point.getAbsolutePosition()
  for (let i = 0; i < detectPoints.length; i++) {
    const detectPoint = detectPoints[i]
    if (point !== detectPoint) {
      const dx = detectPoint.position.x - position.x
      const dy = detectPoint.position.y - position.y
      const len = Math.sqrt(dx * dx + dy * dy)
      if (len < distance) {
        return detectPoint
      }
    }
  }
  return null
}

export function registerAdsorbentInteraction ({ stage }) {
  // 拖拽开始时找到目标控制点和需要检测的控制点
  stage.on('dragstart.' + EVENT_NAME, e => {
    if (isComponentOrComponentGroup(e.target)) {
      dragTarget = e.target
      // 获取当前拖拽元素的控制点
      points = dragTarget.find(node => {
        return (ControlPoint.isControlPoint(node) || ControlPointRect.isControlPointRect(node)) && !node.isSilent()
      })
      // 获取需要碰撞检测的控制点
      const detectShapes = stage.children
      detectPoints = []
      detectDistance = stage.scaleX() * DIAMETER
      findControlPoints(detectPoints, detectShapes, dragTarget)
    } else {
      points = null
      dragTarget = null
    }
  })
  // 拖拽时进行碰撞检测
  let canDrag = true
  stage.on('dragmove.' + EVENT_NAME, () => {
    if (canDrag) {
      window.requestAnimationFrame(() => {
        collisionDetection()
        canDrag = true
      })
      canDrag = false
    }
  })
  // 拖拽结束 连接组件, 最终要将所有组件合并到一个分组中 隐藏控制点
  stage.on('dragend.' + EVENT_NAME, () => {
    collisionDetection()
    const scale = stage.scaleX()
    // 元件分组
    let dx
    let dy
    let targetPointPosition
    if (targetPoint) {
      /**
       * 连接元件
       */
      targetPointPosition = targetPoint.getAbsolutePosition()
      // 计算位移
      dx = collidePoint.position.x - targetPointPosition.x
      dy = collidePoint.position.y - targetPointPosition.y
      const oldPosition = dragTarget.position()
      dragTarget.position({
        x: oldPosition.x + dx / scale,
        y: oldPosition.y + dy / scale
      })
      requestAnimationFrame(() => {
        dragTarget.resetStyle()
      })
      lastTargetPoint = null
      lastCollidePoint = null
      targetPoint = null
    }
    points = null
  })
  return {
    destroy () {
      stage.off('dragstart.' + EVENT_NAME)
      stage.off('dragmove.' + EVENT_NAME)
      stage.off('dragend.' + EVENT_NAME)
      dragTarget = null
      points = null
      detectPoints = null
      detectDistance = null
      lastTargetPoint = null
      lastCollidePoint = null
      targetPoint = null
      collidePoint = null
    }
  }
}
