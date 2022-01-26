/**
 * 鼠标手型
*/
import { listen } from '../utils/dom'
import { isWiringDiagramNode } from '../utils/nodeUtils'
import { ControlPoint } from '../components/ControlPoint'

// 获取鼠标移入baseComponent或者ComponentGroup 一直尝试向上查找直到找到最后一个
function getMouseEnterTarget (target, isCanSelectComponent) {
  const layer = target.getLayer()
  let mouseEnterTarget = null
  while (target && target !== layer) {
    if (ControlPoint.isControlPoint(target)) {
      mouseEnterTarget = target
      break
    }
    if (isCanSelectComponent(target)) {
      mouseEnterTarget = target
    }
    target = target.getParent && target.getParent()
  }
  return mouseEnterTarget
}
// 事件名后缀
const EVENT_SUFIX = '.cursorInteraction'

export function registerCursorInteraction ({ stage, layer, cursorManager, selectionStore, selectionBox }) {
  // 设置tabindex属性以便监听键盘事件
  const container = stage.getContainer()
  if (container.getAttribute('tabindex') !== '-1') {
    container.setAttribute('tabindex', '-1')
  }
  let enterTarget
  function handleMouseOver (e) {
    enterTarget = getMouseEnterTarget(e.target, (node) => {
      return selectionStore.isCanSelectComponent(node)
    })
    if (enterTarget) {
      cursorManager.setCursor(enterTarget.enterCursor || 'move')
    } else {
      cursorManager.reset()
    }
  }
  // 鼠标移入组件
  stage.on('mouseover' + EVENT_SUFIX, handleMouseOver)
  // 拖拽结束后konva还会触发一次mouseover导致，鼠标移入的节点不准确
  stage.on('dragend' + EVENT_SUFIX, (e) => {
    window.requestAnimationFrame(() => {
      handleMouseOver(e)
    })
  })
  // 拖拽stage
  const unKeydownListener = listen(container, 'keydown', e => {
    if (e.keyCode === 32) {
      if (selectionBox.visible()) {
        selectionBox.visible(false)
      }
      stage.off('mouseover' + EVENT_SUFIX)
      cursorManager.unLock()
      cursorManager.grab()
      cursorManager.unLock()
      stage.draggable(true)
      layer.children.forEach(node => {
        if (isWiringDiagramNode(node)) {
          node.draggable(false)
          node.listening(false)
        }
      })
    }
  })
  const unKeyUpListener = listen(container, 'keyup', e => {
    if (e.keyCode === 32) {
      cursorManager.unLock()
      if (enterTarget) {
        cursorManager.setCursor(enterTarget.enterCursor || 'move')
      } else {
        cursorManager.reset()
      }
      stage.on('mouseover' + EVENT_SUFIX, handleMouseOver)
      stage.draggable(false)
      layer.children.forEach(node => {
        if (isWiringDiagramNode(node)) {
          node.draggable(true)
          node.listening(true)
        }
      })
    }
  })
  return {
    destroy () {
      unKeydownListener()
      unKeyUpListener()
      stage.off('mouseover' + EVENT_SUFIX)
    }
  }
}
