/**
 * 历史记录
*/
import {
  createHistorData,
  HISTORY_TYPES,
  HISTORY_HANDLES
} from './HistoryStore'
import { isWiringDiagramNode } from '../utils/nodeUtils'

// 可以改变历史的方法
const canChangeHistoryFuncs = [
  {
    method: 'add',
    eventName: 'add'
  },
  {
    method: 'remove',
    eventName: 'remove'
  },
  {
    method: 'destroy',
    eventName: 'destroy'
  },
  {
    method: 'destroyChildren',
    eventName: 'destroyChildren'
  },
  {
    method: 'rotation',
    eventName: 'transformChange'
  },
  {
    method: 'position',
    eventName: 'transformChange'
  },
  {
    method: 'scale',
    eventName: 'transformChange'
  },
  {
    method: 'skew',
    eventName: 'transformChange'
  },
  {
    method: 'moveToTop',
    eventName: 'layerChange'
  },
  {
    method: 'moveToBottom',
    eventName: 'layerChange'
  },
  {
    method: 'moveUp',
    eventName: 'layerChange'
  },
  {
    method: 'moveDown',
    eventName: 'layerChange'
  }
]

export const ADD_EVENT_NAME = 'addInteraction'
export const REMOVE_EVENT_NAME = 'removeInteraction'
export const DESTROY_EVENT_NAME = 'destroyInteraction'
export const DESTROY_CHILDREN_EVENT_NAME = 'destroyChildrenInteraction'
export const TRANSFORM_EVENT_NAME = 'transformChangeInteraction'
export const LAYER_CHANGE_EVENT_NAME = 'layerChangeInteraction'
export const DRAG_END_EVENT_NAME = 'dragend'
export const DRAG_START_EVENT_NAME = 'dragstart'
// 外部触发的能够产生历史的事件
export const CREATE_HISTORY_EVENT_NAME = 'createHistory'
// 属性变化
export const ATTRS_CHANGE_EVENT = 'attrsChange'

// context 上下文 用来存储值供外部使用
const context = createContext()

// 创建上下文
function createContext () {
  return {
    stage: null,
    layer: null
  }
}

// 设置context值
function setContext (key, value) {
  context[key] = value
}

// 重置context
function resetContext () {
  Object.assign(context, createContext())
}

// 特殊的事件后缀名称
const EVENT_UNIQ_SUFIX = '.history'

// 为事件名添加后缀
function resolveEventName (name) {
  return name + EVENT_UNIQ_SUFIX
}

// 修改kovna对象的方法增加触发相应的事件, 所有的事件全部在stage中触发
function modifyHandle (konvaObject, funcNames, stage, layer) {
  if (konvaObject._modifyHandle || (konvaObject !== layer && !isWiringDiagramNode(konvaObject))) return
  konvaObject._modifyHandle = true
  funcNames.forEach(({ method, eventName }) => {
    if (!konvaObject[method]) return
    const nativeFunc = konvaObject[method]
    konvaObject[method] = function (...args) {
      let eventData
      switch (eventName) {
        case 'add':
          // 添加
          eventData = {
            target: this,
            nodes: args
          }
          break
        case 'remove':
          // 移除
          eventData = {
            target: this,
            parent: this.getParent()
          }
          break
        case 'destory':
          // 销毁
          eventData = {
            target: this.clone(),
            parent: this.getParent()
          }
          break
        case 'destroyChildren':
          // 销毁子元素
          eventData = {
            target: this,
            childrenConfigs: this.children.map(child => child.toObject())
          }
          break
        case 'transformChange':
          // 变换相关的函数都是 get/set 不传参数 是获取操作 则 不产生历史 所以当没有参数时直接调用原函数即可
          if (args.length === 0) {
            return nativeFunc.call(this)
          }
          eventData = {
            target: this,
            args,
            extraData: {
              // 变换之前的值
              lastTransformValue: this[method](),
              transformType: method
            }
          }
          break
        case 'layerChange': {
          // 层级变化
          const target = this
          let layerIndex
          const children = target.getParent().children
          const lastLayerIndex = children.findIndex(item => item === this)
          switch (method) {
            case 'moveToTop':
              layerIndex = children.length - 1
              break
            case 'moveToBottom':
              layerIndex = 0
              break
            case 'moveUp':
              layerIndex = Math.min(lastLayerIndex + 1, children.length)
              break
            case 'moveDown':
              layerIndex = Math.max(0, lastLayerIndex - 1)
              break
          }
          eventData = {
            target: this,
            extraData: {
              layerChangeType: method,
              lastLayerIndex,
              layerIndex
            }
          }
          break
        }
      }
      const returnValue = nativeFunc.call(this, ...args)
      stage.fire(eventName + 'Interaction', eventData)
      return returnValue
    }
  })
}

// 移除所有事件监听
function removeAllEventListener (stage) {
  [ADD_EVENT_NAME, REMOVE_EVENT_NAME, DESTROY_EVENT_NAME, DESTROY_CHILDREN_EVENT_NAME, DRAG_END_EVENT_NAME, DRAG_START_EVENT_NAME, TRANSFORM_EVENT_NAME, LAYER_CHANGE_EVENT_NAME, CREATE_HISTORY_EVENT_NAME].forEach(name => {
    stage.off(resolveEventName(name))
  })
}

// 处理create的历史记录
function handleCreateHistory (forward, historyData) {
  const { target, args } = historyData
  if (forward) {
    // 前进
    args.forEach(node => {
      target.add(node)
    })
  } else {
    // 后退
    args.forEach(node => {
      node.remove()
    })
  }
}
// 处理remove或者destroy的历史记录
function handleRemoveOrDestroyHistory (forward, historyData) {
  const { target, parent, historyType } = historyData
  if (forward) {
    if (historyType === HISTORY_TYPES.destroy) {
      target.destroy()
    } else {
      target.remove()
    }
  } else {
    parent.add(target)
  }
}

// 处理移动（拖拽）的历史记录
function handleDragHistory (forward, historyData) {
  const { target, _prevPosition, position } = historyData
  target.position(forward ? position : _prevPosition)
}

// 处理变换的历史记录 如旋转、平移、缩放、裁切
function handleTransformHistory (forward, historyData) {
  const { target, transformType, transformValue, lastTransformValue } = historyData
  target[transformType](forward ? transformValue : lastTransformValue)
}

// 处理层级变化的历史记录
function handleLayerChangeHistory (forward, historyData) {
  const { target, lastLayerIndex, layerIndex } = historyData
  const children = target.getParent().children
  if (forward) {
    const temp = children[layerIndex]
    children[layerIndex] = target
    children[lastLayerIndex] = temp
  } else {
    const temp = children[lastLayerIndex]
    children[lastLayerIndex] = target
    children[layerIndex] = temp
  }
  // 修正zIndex
  target.getParent()._setChildrenIndices()
}

// 处理属性变化的历史记录, 支持多个
function handleAttrsChangeHistory (forward, historyData) {
  const { target: targets, oldAttrs, newAttrs } = historyData
  targets.forEach((target, index) => {
    target.setAttrs(forward ? newAttrs[index] || {} : oldAttrs[index] || {})
  })
}

// 注册历史记录交互
export function registerHistoryInteraction ({ stage, layer, historyStore }) {
  stage.getHistoryStore = () => {
    return historyStore
  }
  setContext('stage', stage)
  setContext('layer', layer)
  modifyHandle(layer, canChangeHistoryFuncs, stage, layer)
  // 先移除事件
  removeAllEventListener(stage)
  // 添加
  stage.on(resolveEventName(ADD_EVENT_NAME), ({ target, nodes }) => {
    nodes.forEach(object => modifyHandle(object, canChangeHistoryFuncs, stage, layer))
    if (!historyStore.canPushHistory()) return
    // 为所有新添加的node添加相应的事件跟踪
    if (!isWiringDiagramNode(nodes[0])) return
    historyStore.push(createHistorData({ target, historyType: HISTORY_TYPES.create, args: nodes }))
  })
  // 删除
  stage.on(resolveEventName(REMOVE_EVENT_NAME), ({ target, parent }) => {
    if (!historyStore.canPushHistory()) return
    historyStore.push(createHistorData({
      target,
      historyType: HISTORY_TYPES.remove,
      extraData: { parent }
    }))
  })
  // 销毁
  stage.on(resolveEventName(DESTROY_EVENT_NAME), ({ target, parent }) => {
    if (!historyStore.canPushHistory()) return
    historyStore.push(createHistorData({
      target,
      historyType: HISTORY_TYPES.destroy,
      extraData: { parent }
    }))
  })
  // 销毁子元素
  stage.on(resolveEventName(DESTROY_CHILDREN_EVENT_NAME), () => {
    if (!historyStore.canPushHistory()) return
  })
  // 拖拽开始
  stage.on(resolveEventName(DRAG_START_EVENT_NAME), (e) => {
    if (e.target) {
      e.target._prevPosition = e.target.position()
    }
  })
  // 拖拽结束
  stage.on(resolveEventName(DRAG_END_EVENT_NAME), (e) => {
    if (!historyStore.canPushHistory()) return
    if (!e.target || (e.target !== stage && !isWiringDiagramNode(e.target))) return
    const _prevPosition = e.target._prevPosition
    const position = e.target.position()
    historyStore.push(createHistorData({
      target: e.target,
      historyType: HISTORY_TYPES.drag,
      extraData: {
        _prevPosition,
        position
      }
    }))
  })
  // transformChange 变化
  stage.on(resolveEventName(TRANSFORM_EVENT_NAME), eventData => {
    if (!historyStore.canPushHistory()) return
    const { target, extraData } = eventData
    const { transformType } = extraData
    eventData.extraData.transformValue = target[transformType]()
    historyStore.push(createHistorData({
      historyType: HISTORY_TYPES.transformChange,
      target,
      args: eventData.args,
      extraData: eventData.extraData
    }))
  })
  // 层级 变化
  stage.on(resolveEventName(LAYER_CHANGE_EVENT_NAME), eventData => {
    if (!historyStore.canPushHistory()) return
    const { target, extraData } = eventData
    historyStore.push(createHistorData({
      historyType: HISTORY_TYPES.layerChange,
      target,
      extraData: extraData
    }))
  })
  // 属性变化 需要外界主动触发
  stage.on(resolveEventName(ATTRS_CHANGE_EVENT), ({ targets, oldAttrs, newAttrs }) => {
    if (!historyStore.canPushHistory()) return
    const historyData = {
      historyType: HISTORY_TYPES.attrsChange,
      target: targets,
      extraData: {
        oldAttrs,
        newAttrs: newAttrs
      }
    }
    historyStore.push(createHistorData(historyData))
  })
  // 外部触发的能够产生历史的事件
  stage.on(resolveEventName(CREATE_HISTORY_EVENT_NAME), ({ historyType, target, args, extraData }) => {
    if (!historyStore.canPushHistory()) return
    historyStore.push(createHistorData({
      historyType: historyType,
      target,
      args: args,
      extraData: extraData
    }))
  })
  historyStore.off('historychange')
  historyStore.on('historychange', (forward, historyData) => {
    switch (historyData.historyType) {
      case HISTORY_TYPES.create:
        handleCreateHistory(forward, historyData)
        break
      case HISTORY_TYPES.remove:
      case HISTORY_TYPES.destroy:
        handleRemoveOrDestroyHistory(forward, historyData)
        break
      case HISTORY_TYPES.drag:
        handleDragHistory(forward, historyData)
        break
      case HISTORY_TYPES.transformChange:
        handleTransformHistory(forward, historyData)
        break
      case HISTORY_TYPES.layerChange:
        handleLayerChangeHistory(forward, historyData)
        break
      case HISTORY_TYPES.attrsChange:
        handleAttrsChangeHistory(forward, historyData)
        break
      default: {
        // 使用扩展的历史类型及对应的处理函数
        const handle = HISTORY_HANDLES[historyData.historyType]
        if (handle) {
          handle(forward, historyData)
        }
      }
    }
  })
  return {
    destroy () {
      resetContext()
      removeAllEventListener(stage)
    }
  }
}
