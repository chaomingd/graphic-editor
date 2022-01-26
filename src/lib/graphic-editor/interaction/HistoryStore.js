import EventEmitter from '../utils/EventEmitter'

// 历史操作类型
const HISTORY_ACTIONS = {
  create: 'create',
  remove: 'remove',
  update: 'update',
  destroy: 'destroy',
  drag: 'drag',
  transformChange: 'transformChange',
  layerChange: 'layerChange',
  attrsChange: 'attrsChange'
}

// 支持的历史类型 使用 getter 防止修改 相当于readonly的作用
export const HISTORY_TYPES = {
  get create () {
    return HISTORY_ACTIONS.create
  },
  get remove () {
    return HISTORY_ACTIONS.remove
  },
  get update () {
    return HISTORY_ACTIONS.update
  },
  get destroy () {
    return HISTORY_ACTIONS.destroy
  },
  get drag () {
    return HISTORY_ACTIONS.drag
  },
  get transformChange () {
    return HISTORY_ACTIONS.transformChange
  },
  get layerChange () {
    return HISTORY_ACTIONS.layerChange
  },
  get attrsChange () {
    return HISTORY_ACTIONS.attrsChange
  }
}

// 扩展的处理历史记录的回调函数
export const HISTORY_HANDLES = {}

// 历史记录管理器
export class HistoryStore extends EventEmitter {
  constructor (config = {}) {
    super()
    this.config = config
    // 能够保存的最大历史记录长度
    this.maxHistoryLength = config.maxHistoryLength || 100
    // 历史记录数组
    this._history = []
    // 当前的历史进程
    this._currStep = -1
    // 标识是否可以添加到历史，如撤销和前进时不能更改历史记录，只有对元素操作时才会产生历史
    this._canPushHistory = true
    this._isDestroyed = false
  }
  noHistoryWrapper (callback, context) {
    this._canPushHistory = false
    callback && callback.call(context || window)
    this._canPushHistory = true
  }
  canPushHistory () {
    return this._canPushHistory
  }
  destroy () {
    this._isDestroyed = true
    this._history = null
    this._currStep = undefined
    this.off('historychange')
  }
  actionWarning () {
    if (this._isDestroyed) {
      console.warn('historyStore is destroyed you can\'t use it')
      return true
    }
    return false
  }
  // 添加历史
  push (...historyDatas) {
    if (this.actionWarning()) return
    if (!this.canPushHistory()) return
    this._history.push(...historyDatas)
    // 超出历史记录最大长度则删除最早的历史
    while (this._history.length > this.maxHistoryLength) {
      this._history.shift()
    }
    this._currStep = this._history.length - 1
    this.fire('historyCreated')
  }
  // 操作历史后退前进
  go (n) {
    if (this.actionWarning()) return
    // 不能产生历史
    this._canPushHistory = false
    if (n > 0) {
      // 前进
      if (this._currStep >= this._history.length - 1) {
        this._currStep = this._history.length - 1
        return
      }
      this._currStep += n
      this.fire('historychange', true, this._history[this._currStep], this._currStep)
    } else {
      // 后退
      if (this._currStep <= -1) {
        this._currStep = -1
        return
      }
      this.fire('historychange', false, this._history[this._currStep], this._currStep)
      this._currStep += n
    }
    // 重新设置为true以便下一次操作元素时可以产生历史
    this._canPushHistory = true
  }
  clear () {
    this._history = []
    this._currStep = -1
  }
}

// 创建历史记录数据
export function createHistorData ({
  target,
  historyType,
  args,
  extraData = {}
}) {
  if (!HISTORY_TYPES[historyType]) throw new Error('unkonow history historyType')
  const historyData = Object.create(null)
  Object.assign(historyData, {
    target: target,
    args,
    historyType,
    ...extraData
  })
  return historyData
}

/**
 * 扩展历史类型
 * @param types: { historyType: string, handle: (forwad, historyData, currStep) => void }
*/
export function expandHistoryTypes (types = {}) {
  if (types.historyType && types.handle) {
    HISTORY_TYPES[types.historyType] = types.historyType
    HISTORY_HANDLES[types.historyType] = types.handle
  } else {
    console.error('扩展历史类型必须传入type和handle')
  }
}
