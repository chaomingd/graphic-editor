import BaseComponent from '../components/base/BaseComponent'
import ComponentGroup from '../components/base/ComponentGroup'
import ComponentNames from '../components/base/ComponentNames'
import konva from 'konva'

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
  return node instanceof BaseComponent || node instanceof ComponentGroup
}
// 找到需要进行碰撞检测的控制点
function findControlPoints (result, nodes, filterNode) {
  nodes && nodes.forEach(node => {
    if (node !== filterNode) {
      if (node.getName() === ComponentNames.BaseComponent) {
        node.controlPoints && node.controlPoints.forEach(pointShape => {
          if (!pointShape.isSilent()) {
            result.push({ target: pointShape, position: pointShape.getAbsolutePosition() })
          }
        })
      } else {
        findControlPoints(result, node.children, filterNode)
      }
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
// 隐藏控制点
function hideControlPoints (layer) {
  function walk (node) {
    if (node.getName() === ComponentNames.ControlPoint) {
      node.visible(false)
    }
    if (node.children && node.children.length) {
      node.children.forEach(node => {
        walk(node)
      })
    }
  }
  walk(layer)
}
// 显示控制点
function showControlPoints (layer) {
  function walk (node) {
    if (node.getName() === ComponentNames.ControlPoint) {
      if (!node.isSilent()) {
        node.visible(true)
        node.unCollision()
      }
    }
    if (node.children && node.children.length) {
      node.children.forEach(node => {
        walk(node)
      })
    }
  }
  walk(layer)
}

export function setJoinComponentInteraction (stage, layer) {
  // 临时的图形 提升性能
  const tempLayer = new konva.Layer()
  stage.add(tempLayer)
  // 拖拽开始时找到目标控制点和需要检测的控制点
  stage.on('dragstart.' + EVENT_NAME, e => {
    // 显示控制点
    showControlPoints(stage)
    if (isComponentOrComponentGroup(e.target)) {
      dragTarget = e.target
      dragTarget.moveTo(tempLayer)
      points = dragTarget.find(node => {
        return node.getName() === ComponentNames.ControlPoint && !node.isSilent()
      })
      const detectShapes = stage.children
      detectPoints = []
      detectDistance = stage.scaleX() * 10
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
    if (dragTarget) {
      dragTarget.moveTo(layer)
    }
    collisionDetection()
    const scale = stage.scaleX()
    // 元件分组
    let componentGroup
    let dx
    let dy
    let targetPointPosition
    let collidePointPosition
    if (targetPoint) {
      // 碰撞控制点设置为静默状态
      collidePoint.target.silent()
      // 碰撞的组件
      const collideComponent = collidePoint.target.getParent()
      // 当前拖拽的组件
      const dragComponent = targetPoint.getParent()
      // 连接元件，合并成一个分组
      if (collideComponent.getParent().getName() !== ComponentNames.ComponentGroup) {
        if (dragComponent.getParent().getName() !== ComponentNames.ComponentGroup) {
          /**
           * 当碰撞组件没有分组并且当前组件也没有分组时
           * 1. 新建分组
           * 2. 将碰撞组件和当前组件都移动到新的分组
           * 3. 调整碰撞组件和当前组件的位置
           * */
          // 1. 新建分组
          componentGroup = new ComponentGroup({
            draggable: true,
            name: ComponentNames.ComponentGroup
          })
          componentGroup.position(collideComponent.position())
          // 将碰撞组件移动到新的分组
          collideComponent.moveTo(componentGroup)
          // 调整碰撞组件的位置
          collideComponent.position({
            x: 0,
            y: 0
          })
          collideComponent.draggable(false)
          // 当前组件移动到新的分组
          dragComponent.moveTo(componentGroup)
          dragComponent.position({
            x: 0,
            y: 0
          })
          // 调整当前组件的位置
          const targetPointPosition = targetPoint.getAbsolutePosition()
          const collidePointPosition = collidePoint.target.getAbsolutePosition()
          dragComponent.position({
            x: collidePointPosition.x - targetPointPosition.x,
            y: collidePointPosition.y - targetPointPosition.y
          })
          dragComponent.draggable(false)
          layer.add(componentGroup)
        } else {
          /**
           * 当碰撞组件没有分组 当前组件有分组
           * 1. 调整当前组件所在分组的位置
           * 2. 将碰撞组件移到到当前组件所在的分组中
           * 3. 重新调整碰撞组件的位置
           * */
          componentGroup = dragComponent.getParent()
          const componentGroupPosition = componentGroup.position()
          targetPointPosition = targetPoint.getAbsolutePosition()
          dx = collidePoint.position.x - targetPointPosition.x
          dy = collidePoint.position.y - targetPointPosition.y
          // 调整当前组件所在分组的位置
          componentGroup.position({
            x: componentGroupPosition.x + dx / scale,
            y: componentGroupPosition.y + dy / scale
          })
          // 将碰撞组件移到到当前组件所在的分组中
          collideComponent.moveTo(componentGroup)
          collideComponent.moveToBottom()
          // 将碰撞组件移到到当前组件所在的分组中
          collideComponent.position({
            x: 0,
            y: 0
          })
          targetPointPosition = targetPoint.getAbsolutePosition()
          collidePointPosition = collidePoint.target.getAbsolutePosition()
          collideComponent.position({
            x: (targetPointPosition.x - collidePointPosition.x) / scale,
            y: (targetPointPosition.y - collidePointPosition.y) / scale
          })
          collideComponent.draggable(false)
        }
      } else {
        if (dragComponent.getParent().getName() !== ComponentNames.ComponentGroup) {
          /**
           * 碰撞组件有分组 当前组件没有分组
           * 1. 将当前组件移动到碰撞组件所在的分组
           * 2. 重新调整当前组件的位置
           * */
          componentGroup = collideComponent.getParent()
          dragComponent.moveTo(componentGroup)
          dragComponent.position({
            x: 0,
            y: 0
          })
          targetPointPosition = targetPoint.getAbsolutePosition()
          collidePointPosition = collidePoint.target.getAbsolutePosition()
          dragComponent.position({
            x: (collidePointPosition.x - targetPointPosition.x) / scale,
            y: (collidePointPosition.y - targetPointPosition.y) / scale
          })
          dragComponent.draggable(false)
        } else {
          let mainComponentGroup
          let unUseComponentGroup
          if (dragComponent.getParent().children.length > collideComponent.getParent().children.length) {
            /**
             * 碰撞组件有分组 当前组件也有分组 并且当前组件所在分组(mainComponentGroup)的元素比碰撞组件(unUseComponentGroup)所在分组的元素多
             * 1. 调整当前组件所在分组的位置  mainComponentGroup.position
             * 2. 将碰撞组件所在分组移动到当前组件所在分组 unUseComponentGroup.moveTo(mainComponentGroup)
             * 3. 计算调整到正确位置的位移 遍历unUseComponentGroup中子元素，依次调整位置
             * 4. 销毁unUseComponentGroup
             * */
            mainComponentGroup = dragComponent.getParent()
            unUseComponentGroup = collideComponent.getParent()
            targetPointPosition = targetPoint.getAbsolutePosition()
            collidePointPosition = collidePoint.target.getAbsolutePosition()
            dx = collidePointPosition.x - targetPointPosition.x
            dy = collidePointPosition.y - targetPointPosition.y
            const oldGroupPosition = mainComponentGroup.position()
            // 调整当前组件所在分组的位置
            mainComponentGroup.position({
              x: oldGroupPosition.x + dx / scale,
              y: oldGroupPosition.y + dy / scale
            })
            // 将碰撞组件所在分组移动到当前组件所在分组
            unUseComponentGroup.moveTo(mainComponentGroup)
            unUseComponentGroup.position({
              x: 0,
              y: 0
            })
            // 计算调整到正确位置的位移 遍历unUseComponentGroup中子元素，依次调整位置
            targetPointPosition = targetPoint.getAbsolutePosition()
            collidePointPosition = collidePoint.target.getAbsolutePosition()
            dx = collidePointPosition.x - targetPointPosition.x
            dy = collidePointPosition.y - targetPointPosition.y
            for (let i = unUseComponentGroup.children.length - 1; i >= 0; i--) {
              const component = unUseComponentGroup.children[i]
              component.moveTo(mainComponentGroup)
              component.moveToBottom()
              const componentOldPosition = component.position()
              component.position({
                x: componentOldPosition.x - dx / scale,
                y: componentOldPosition.y - dy / scale
              })
              component.draggable(false)
            }
            // 销毁碰撞组件所在分组
            unUseComponentGroup.destroy()
          } else {
            /**
             * 碰撞组件有分组 当前组件也有分组 并且当前组件所在分组(unUseComponentGroup)的元素比碰撞组件(mainComponentGroup)所在分组的元素少
             * 1. 重新调整当前组件所在分组的位置 unUseComponentGroup.position
             * 2. 计算位移遍历当前组件所在分组中的元素依次调整位置
             * */
            mainComponentGroup = collideComponent.getParent()
            unUseComponentGroup = dragComponent.getParent()
            // 重新调整当前组件所在分组的位置
            unUseComponentGroup.moveTo(mainComponentGroup)
            unUseComponentGroup.position({
              x: 0,
              y: 0
            })
            // 计算位移遍历当前组件所在分组中的元素依次调整位置
            targetPointPosition = targetPoint.getAbsolutePosition()
            collidePointPosition = collidePoint.target.getAbsolutePosition()
            dx = collidePointPosition.x - targetPointPosition.x
            dy = collidePointPosition.y - targetPointPosition.y
            while (unUseComponentGroup.children.length) {
              const component = unUseComponentGroup.children[0]
              component.moveTo(mainComponentGroup)
              const componentOldPosition = component.position()
              component.position({
                x: componentOldPosition.x + dx / scale,
                y: componentOldPosition.y + dy / scale
              })
              component.draggable(false)
            }
            unUseComponentGroup.destroy()
          }
        }
      }
      lastTargetPoint = null
      lastCollidePoint = null
    }
    points = null
    hideControlPoints(layer)
  })
  return {
    destroy () {
      stage.off('dragstart.' + EVENT_NAME)
      stage.off('dragmove.' + EVENT_NAME)
      stage.off('dragend.' + EVENT_NAME)
    }
  }
}
