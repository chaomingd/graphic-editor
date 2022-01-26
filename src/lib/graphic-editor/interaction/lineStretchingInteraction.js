/**
 * 线组件拉伸交互
*/
import { ControlPoint } from '../components/ControlPoint'
import { expandHistoryTypes } from './HistoryStore'
import { CREATE_HISTORY_EVENT_NAME } from './historyInteraction'
import LineBaseComponent from '../components/base/LineBaseComponent'
const EVENT_SUFIX = '.lineStretchingInteraction'
function resolveEventName (name) {
  return name + EVENT_SUFIX
}
// 历史类型及对应的处理函数
const lineStretchHistoryType = {
  historyType: 'lineStretch',
  handle: (forward, historyData) => {
    const { target: lineComponent } = historyData
    let data
    if (forward) {
      data = historyData.new
    } else {
      data = historyData.old
    }
    lineComponent.updateByWidthAndPosition(data.width, data.position, data.offsetX, data.offsetY)
  }
}
// 扩展历史类型及处理函数
expandHistoryTypes(lineStretchHistoryType)
// 注册线组件拉伸交互
export function registerLineStretchingInteraction ({ stage, historyStore, cursorManager }) {
  let isMouseDown = false
  let mouseDownPosition
  let target
  let lineComponent
  stage.on(resolveEventName('mousedown'), e => {
    target = e.target
    if (ControlPoint.isControlPoint(target)) {
      lineComponent = target.getParent()
      if (!LineBaseComponent.isLineBaseComponent(lineComponent)) return
      // 保存旧值
      lineComponent._mousedownWidth = lineComponent.width()
      lineComponent._oldPosition = lineComponent.position()
      lineComponent._oldOffsetX = lineComponent.offsetX()
      lineComponent._oldOffsetY = lineComponent.offsetY()
      lineComponent.draggable(false)
      isMouseDown = true
      mouseDownPosition = stage.getPointerPosition()
      cursorManager.lock()
    }
  })
  stage.on(resolveEventName('mousemove'), () => {
    if (isMouseDown) {
      historyStore._canPushHistory = false
      // 拉伸
      lineComponent.stretch(target, mouseDownPosition, stage.getPointerPosition())
    }
  })
  stage.on(resolveEventName('mouseup'), (e) => {
    if (isMouseDown) {
      cursorManager.unLock()
      stage.fire('mouseover', e)
      lineComponent.draggable(true)
      isMouseDown = false
      const newPosition = lineComponent.position()
      const oldPosition = lineComponent._oldPosition
      const newWidth = lineComponent.width()
      const oldWidth = lineComponent._mousedownWidth
      if (newPosition.x !== oldPosition.x || newPosition.y !== oldPosition.y || newWidth !== oldWidth) {
        // 调整原点回到中心位置
        lineComponent.centerOrigin()
        // 增加自定义历史记录
        const historyData = {
          historyType: lineStretchHistoryType.historyType,
          target: lineComponent,
          extraData: {
            old: {
              position: oldPosition,
              width: oldWidth,
              offsetX: lineComponent._oldOffsetX,
              offsetY: lineComponent._oldOffsetY
            },
            new: {
              position: lineComponent.position(),
              width: newWidth,
              offsetX: lineComponent.offsetX(),
              offsetY: lineComponent.offsetY()
            }
          }
        }
        historyStore._canPushHistory = true
        // 触发自定义生成历史的事件， 自动在historyInteraction中处理
        stage.fire(CREATE_HISTORY_EVENT_NAME, historyData)
      }
      delete lineComponent._mousedownWidth
      delete lineComponent._oldPosition
      delete lineComponent._oldOffsetX
      delete lineComponent._oldOffsetY
    }
  })
  return {
    destroy () {
      stage.off(resolveEventName('mousedown'))
      stage.off(resolveEventName('mousemove'))
      stage.off(resolveEventName('mouseup'))
    }
  }
}
