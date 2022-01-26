import ComponentNames from '../components/base/ComponentNames'
import {
  listen
} from '../utils/dom'
import { isWiringDiagramNode, haveIntersection } from '../utils/nodeUtils'
import konva from 'konva'

// 事件名称后缀
const EVENT_SUFIX = '.selectionInteraction'

// 隐藏控制点
export function hideControlPoints (container, filterNode) {
  function walk (node) {
    if (node.getName() === ComponentNames.ControlPoint) {
      node.visible(false)
    }
    if (node.children && node.children.length) {
      node.children.forEach(node => {
        if (node !== filterNode) {
          walk(node)
        }
      })
    }
  }
  walk(container)
}

// 显示控制点
export function showControlPoints (container, filterNode) {
  function walk (node) {
    if (node.getName() === ComponentNames.ControlPoint) {
      if (!node.isSilent()) {
        node.visible(true)
        node.unCollision()
      }
    }
    if (node.children && node.children.length) {
      node.children.forEach(node => {
        if (node !== filterNode) {
          walk(node)
        }
      })
    }
  }
  walk(container)
}

// 获取选中的baseComponent或者ComponentGroup 一直尝试向上查找直到找到第一个
function getSelectedElement (target, isCanSelectComponent) {
  const layer = target.getLayer()
  let selectedElement = null
  while (target && target !== layer) {
    if (target.getAttrs()._selection !== false && isCanSelectComponent(target)) {
      selectedElement = target
      break
    }
    target = target.getParent && target.getParent()
  }
  return selectedElement
}

// 更新鼠标位置更新选框位置
function updateSelectionBoxPositionByPointerPosition (pointerPosition, selectionBox, layer) {
  selectionBox.visible(true)
  const position = layer.getAbsoluteTransform().copy().invert().point(pointerPosition)
  selectionBox.position(position)
  selectionBox.width(0)
  selectionBox.height(0)
  selectionBox._mouseDownPosition = position
}

// 根据鼠标位置更新选框尺寸
function updateSelectionBoxRectByPointerPosition (pointerPosition, selectionBox, layer) {
  const bottomRightPosition = layer.getAbsoluteTransform().copy().invert().point(pointerPosition)
  const topLeftPosition = selectionBox._mouseDownPosition
  const width = bottomRightPosition.x - topLeftPosition.x
  const height = bottomRightPosition.y - topLeftPosition.y
  if (width > 0) {
    selectionBox.x(topLeftPosition.x)
    selectionBox.width(width)
  } else {
    selectionBox.x(bottomRightPosition.x)
    selectionBox.width(-width)
  }
  if (height > 0) {
    selectionBox.y(topLeftPosition.y)
    selectionBox.height(height)
  } else {
    selectionBox.y(bottomRightPosition.y)
    selectionBox.height(-height)
  }
}

// 隐藏选框，计算框中的元素
function hideSelectionBoxAndInersectionElements (selectionBox, layer, command) {
  const selectionBoxRect = selectionBox.getClientRect()
  const selectElements = []
  layer.children.forEach(node => {
    if (haveIntersection(selectionBoxRect, node.getClientRect())) {
      if (isWiringDiagramNode(node)) {
        selectElements.push(node)
      }
    }
  })
  if (selectElements.length) {
    command.selectElement(selectElements)
  }
  delete selectionBox._mouseDownPosition
  selectionBox.visible(false)
  selectionBox.width(0)
  selectionBox.height(0)
}

// 注册选框鼠标事件
function registerSelectionBoxMouseEvent (stage, selectionBox, layer, command, cursorManager) {
  stage.on('mousemove' + EVENT_SUFIX, () => {
    if (stage.draggable()) return
    if (selectionBox.visible()) {
      // 更新选框尺寸
      updateSelectionBoxRectByPointerPosition(stage.getPointerPosition(), selectionBox, layer)
    }
  })
  stage.on('mouseup' + EVENT_SUFIX, () => {
    if (stage.draggable()) return
    if (selectionBox.visible()) {
      // 隐藏选框，计算框中的元素
      hideSelectionBoxAndInersectionElements(selectionBox, layer, command)
    }
    stage.off('mousemove' + EVENT_SUFIX)
    stage.off('mouseup' + EVENT_SUFIX)
    cursorManager.unLock()
  })
}

// 注册选择交互
export function registerSelectionInteraction ({ stage, layer, selectionStore, command, selectionBox, cursorManager }) {
  // 设置tabindex属性以便监听键盘事件
  const container = stage.getContainer()
  container.setAttribute('tabindex', '-1')
  // 控制多选 (按住ctrl或者cmd mac系统)
  let multiSelection = false
  const unKeydownListener = listen(container, 'keydown', e => {
    if (e.ctrlKey || e.metaKey) {
      multiSelection = true
    }
  })
  const unKeyUpListener = listen(container, 'keyup', () => {
    multiSelection = false
  })
  // 可以改变选中元素的事件名称
  let selectElement
  stage.on('mousedown' + EVENT_SUFIX, e => {
    if (stage.draggable()) return
    if (e.evt.button === 2) {
      // 鼠标右键按下时， 如果已经选中多个元素则返回不再执行下面的逻辑进行重置选择
      if (selectionStore.getActiveElement().length > 1) return
    }
    const target = e.target
    if (!target) return
    selectElement = getSelectedElement(target, selectionStore.isCanSelectComponent)
    if (selectElement) {
      if (multiSelection && e.evt.button === 0) {
        // 按住ctr并点击鼠标左键 多选
        command.multiSelectElement(selectElement)
      } else {
        command.selectElement(selectElement)
      }
    } else {
      command.selectElement(null)
      if (selectionBox && !(target.getParent() instanceof konva.Transformer)) {
        cursorManager.lock()
        // 设置选框位置
        updateSelectionBoxPositionByPointerPosition(stage.getPointerPosition(), selectionBox, layer)
        // 注册选框鼠标事件
        registerSelectionBoxMouseEvent(stage, selectionBox, layer, command, cursorManager)
      }
    }
  })
  stage.on('dragstart' + EVENT_SUFIX, (e) => {
    if (stage.draggable()) return
    const target = e.target
    if (!target) return
    selectElement = getSelectedElement(target, selectionStore.isCanSelectComponent)
    command.selectElement(selectElement)
    if (selectElement) {
      selectElement.setDragStyle()
      // 拖拽开始显示控制点
      showControlPoints(layer, selectElement)
    }
  })
  stage.on('dragend' + EVENT_SUFIX, () => {
    if (stage.draggable()) return
    if (selectElement) {
      selectElement.setSelectionStyle()
      // 隐藏控制点
      hideControlPoints(layer, selectElement)
    }
  })
  return {
    destroy () {
      ['mousedown', 'dragstart', 'dragend'].forEach(eventName => {
        stage.off(eventName + EVENT_SUFIX)
      })
      unKeydownListener()
      unKeyUpListener()
    }
  }
}
