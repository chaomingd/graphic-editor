import NormalGroup from '../components/base/NormalGroup'
import EventEmitter from '../utils/EventEmitter'
import { calcClientRectByMultiClientRects, createNodesByJSON } from '../utils/nodeUtils'
import { expandHistoryTypes } from './HistoryStore'
import { CREATE_HISTORY_EVENT_NAME, ATTRS_CHANGE_EVENT } from './historyInteraction'
import Component from '../components/base/Component'
// import ComponentGroup from '../components/base/ComponentGroup'

// 扩展历史记录类型及处理函数
// 组合历史
const combinationHistoryTypeHandle = {
  historyType: 'combination',
  handle: (forward, historyData) => {
    const { target: group, args: nodes, editor } = historyData
    if (forward) {
      editor._combination(group, nodes)
    } else {
      editor._cancelCombination([group])
    }
  }
}

// 取消组合历史
const cancelCombinationHistoryTypeHandle = {
  historyType: 'cancelbination',
  handle: (forward, historyData) => {
    const { target: groups, editor, unCombinationChildrens } = historyData
    if (forward) {
      editor._cancelCombination(groups)
    } else {
      groups.forEach((group, index) => {
        editor._combination(group, unCombinationChildrens[index])
      })
    }
  }
}

// 多选时的变换历史
const multiTransformHistoryHandle = {
  historyType: 'multiTransform',
  handle: (forward, historyData) => {
    const { target: targets, transformType, transformValues, lastTransformValues } = historyData
    targets.forEach((target, index) => {
      target[transformType](forward ? transformValues[index] : lastTransformValues[index])
    })
  }
}

// 图形镜像产生的历史
const reflectionYHistoryHandle = {
  historyType: 'reflectionY',
  handle: (_, historyData) => {
    const { target: targets, editor } = historyData
    editor._reflectionY(targets)
  }
}

// 复制产生的历史
const copyHistoryHandle = {
  historyType: 'copy',
  handle: (forward, historyData) => {
    const { target, args: nodes } = historyData
    if (forward) {
      target.add(...nodes)
    } else {
      nodes.forEach(node => {
        node.remove()
      })
    }
  }
}

// 删除多个产生的历史
const multiRemoveHistoryHandle = {
  historyType: 'multiRemove',
  handle: (forward, historyData) => {
    const { target: targets, parents } = historyData
    if (forward) {
      targets.forEach(target => {
        target.remove()
      })
    } else {
      targets.forEach((target, index) => {
        parents[index].add(target)
      })
    }
  }
}

// 更新组件产生的历史
const updateComponentGroupHistoryHandle = {
  historyType: 'updateComponentGroup',
  handle: (forward, historyData) => {
    const { target: componentGroup, oldComponentObject, componentObject, editor } = historyData
    const oldComponnet = componentGroup.children.find(item => Component.isComponent(item))
    editor._updateComponentGroup(componentGroup, oldComponnet, forward ? componentObject : oldComponentObject)
  }
}

// 绑定数据产生的历史
const bindDataHistoryHandle = {
  historyType: 'bindData',
  handle: (forward, historyData) => {
    const { target: targets, datas } = historyData
    if (forward) {
      targets.forEach((target, index) => {
        target.bindData && target.bindData(datas[index])
      })
    } else {
      targets.forEach(target => {
        target.unBindData && target.unBindData()
      })
    }
  }
}

// 接绑数据产生的历史
const unBindDataHistoryHandle = {
  historyType: 'unBindData',
  handle: (forward, historyData) => {
    const { target: targets, datas } = historyData
    if (forward) {
      targets.forEach(target => {
        target.unBindData && target.unBindData()
      })
    } else {
      targets.forEach((target, index) => {
        target.bindData && target.bindData(datas[index])
      })
    }
  }
}

// 扩展自定义历史类型处理函数
expandHistoryTypes(combinationHistoryTypeHandle)
expandHistoryTypes(cancelCombinationHistoryTypeHandle)
expandHistoryTypes(multiTransformHistoryHandle)
expandHistoryTypes(reflectionYHistoryHandle)
expandHistoryTypes(copyHistoryHandle)
expandHistoryTypes(multiRemoveHistoryHandle)
expandHistoryTypes(updateComponentGroupHistoryHandle)
expandHistoryTypes(bindDataHistoryHandle)
expandHistoryTypes(unBindDataHistoryHandle)

class Command extends EventEmitter {
  constructor ({ editor }) {
    super()
    this.editor = editor
    this.selectionStore = editor.selectionStore
    this.layer = editor.layer
    this.stage = editor.stage
    // 自定义的命令
    this._customCommand = {}
  }
  canExec () {
    return !!this.selectionStore.getActiveElement().length
  }
  targets () {
    return this.selectionStore.getActiveElement()
  }
  // 注册自定义的命令
  registerCommand ({ action, handle }) {
    if (!action) throw new Error('action is required')
    if (!handle) throw new Error('handle is required')
    if (!this._customCommand[action]) {
      this._customCommand[action] = []
    }
    this._customCommand[action].push(handle)
  }
  // 取消注册自定义命令
  unRegisterCommand ({ action, handle }) {
    if (!action) throw new Error('action is required')
    if (!handle) throw new Error('handle is required')
    const handles = this._customCommand[action]
    if (handles) {
      for (let i = handles.length - 1; i >= 0; i--) {
        if (handles[i] === handle) {
          handles.splice(i, 1)
        }
      }
    }
    return false
  }
  // 执行命令
  exec (action, ...args) {
    if (!this.canExec()) return
    const targets = this.targets()
    if (!targets.length) {
      console.warn('no element selected')
      return
    }
    const handleAction = this[action]
    const customActions = this._customCommand[action]
    // 先执行自定义的命令后执行内置的命令， 如果同名则执行自定以的命令
    if (customActions) {
      // 自定义命令
      customActions.forEach(handleAction => {
        handleAction(this, targets, ...args)
      })
    } else if (handleAction) {
      handleAction.call(this, targets, ...args)
      this.fire('exec-' + action, targets, args, this)
    } else {
      console.warn('no such action')
    }
  }
  // 重置选中元素的样式
  resetLastActiveElementStyle () {
    const targets = this.targets()
    if (targets) {
      targets.forEach(target => {
        target.resetStyle && target.resetStyle()
      })
    }
  }
  // 选中元素
  selectElement (activeElement, reset = true) {
    if (reset) {
      this.resetLastActiveElementStyle()
      this.selectionStore.setActiveElement(activeElement)
    } else {
      const targets = this.targets() || []
      targets.push(activeElement)
      this.selectionStore.setActiveElement(targets)
    }
    if (!activeElement) return
    if ('length' in activeElement) {
      for (let i = 0; i < activeElement.length; i++) {
        if (activeElement[i] && activeElement[i].setSelectionStyle) {
          activeElement[i].setSelectionStyle()
        }
      }
    } else {
      if (activeElement.setSelectionStyle) {
        activeElement.setSelectionStyle()
      }
    }
  }
  // 多选 可以传入数组或单个元素
  multiSelectElement (activeElement) {
    if (!activeElement) return
    const lastSelectedElements = this.targets()
    // 检查待选中的元素是否已经被选中或者包含在某个选中的分组中
    let contains = false
    for (let i = 0; i < lastSelectedElements.length; i++) {
      const lastSelectedElement = lastSelectedElements[i]
      if (lastSelectedElement === activeElement) {
        contains = true
        break
      }
    }
    if (contains) return
    if (activeElement.length) {
      activeElement.forEach(item => {
        this.selectElement(item, false)
      })
    } else {
      this.selectElement(activeElement, false)
    }
  }
  // 复制
  copy (targets) {
    // 关闭历史记录的产生 自定义历史记录
    this.editor.historyStore._canPushHistory = false
    const copyNodes = this._copy(targets)
    this.editor.historyStore._canPushHistory = true
    const historyData = {
      target: this.layer,
      args: copyNodes,
      historyType: copyHistoryHandle.historyType
    }
    this.stage.fire(CREATE_HISTORY_EVENT_NAME, historyData)
  }
  // 复制操作
  _copy (targets) {
    return targets.map(target => {
      const copyNode = target.clone()
      copyNode.move({
        x: 10,
        y: 10
      })
      this.selectElement(copyNode, targets.length === 1)
      this.layer.add(copyNode)
      return copyNode
    })
  }
  // 多选操作时合并历史记录
  multiTransformHistoryWrapper (targets, transformType, execFunc) {
    if (!execFunc) throw new Error('no execFunc provided')
    if (targets.length === 1) {
      // 如果只有一个则执行即可， 在historyInteraction中会自动处理单个的历史记录
      execFunc()
      return
    }
    // 关闭历史记录的产生 自定义历史记录
    this.editor.historyStore._canPushHistory = false
    const historyData = {
      target: targets,
      historyType: multiTransformHistoryHandle.historyType,
      extraData: {
        transformType,
        lastTransformValues: targets.map(target => target[transformType]())
      }
    }
    execFunc()
    // 重新打开历史记录标识
    this.editor.historyStore._canPushHistory = true
    historyData.extraData.transformValues = targets.map(target => target[transformType]())
    this.stage.fire(CREATE_HISTORY_EVENT_NAME, historyData)
  }
  // 旋转
  rotate (targets, deg = 0) {
    this.multiTransformHistoryWrapper(targets, 'rotation', () => {
      targets.forEach(target => {
        target.rotate(deg)
      })
    })
  }
  rotateLeft (targets) {
    this.rotate(targets, -90)
  }
  rotateRight (targets) {
    this.rotate(targets, 90)
  }
  // 置于顶层
  moveToTop (targets) {
    targets.forEach(target => {
      target.moveToTop()
    })
  }
  // 置于底层
  moveToBottom (targets) {
    targets.forEach(target => {
      target.moveToBottom()
    })
  }
  // 上移一层
  moveUp (targets) {
    targets.forEach(target => {
      target.moveUp()
    })
  }
  // 下移一层
  moveDown (targets) {
    targets.forEach(target => {
      target.moveDown()
    })
  }
  // 上下镜像
  reflectionY (targets) {
    // 关闭历史记录的产生 自定义历史记录
    this.editor.historyStore._canPushHistory = false
    this._reflectionY(targets)
    this.editor.historyStore._canPushHistory = true
    const historyData = {
      historyType: reflectionYHistoryHandle.historyType,
      target: targets,
      extraData: {
        editor: this
      }
    }
    this.stage.fire(CREATE_HISTORY_EVENT_NAME, historyData)
  }
  // 上下镜像操作
  _reflectionY (targets) {
    targets.forEach(target => {
      if (target.reflectionY) {
        target.reflectionY()
      } else {
        target.scaleY(-target.scaleY())
      }
    })
  }
  // 左右镜像
  reflectionX (targets) {
    targets.forEach(target => {
      if (target.reflectionX) {
        target.reflectionX()
      } else {
        target.scaleX(-target.scaleX())
      }
    })
  }
  // 删除
  remove (targets) {
    this.editor.historyStore._canPushHistory = false
    const parents = targets.map(target => target.getParent())
    targets.forEach(target => {
      target.remove()
    })
    this.editor.historyStore._canPushHistory = true
    const historyData = {
      historyType: multiRemoveHistoryHandle.historyType,
      target: targets,
      extraData: {
        parents: parents
      }
    }
    // 自定义生成历史记录
    this.stage.fire(CREATE_HISTORY_EVENT_NAME, historyData)
  }
  // 组合
  combination (targets) {
    // 关闭历史记录的产生 自定义历史记录
    this.editor.historyStore._canPushHistory = false
    const groupRect = calcClientRectByMultiClientRects(targets.map(target => target.getClientRect({ relativeTo: this.layer, skipStroke: true })))
    // 创建group
    const group = new NormalGroup({
      ...groupRect,
      draggable: true,
      x: groupRect.x + groupRect.width / 2,
      y: groupRect.y + groupRect.height / 2
    })
    this._combination(group, targets)
    this.selectElement(group)
    // 历史数据
    const historyData = {
      target: group,
      args: targets,
      historyType: combinationHistoryTypeHandle.historyType,
      extraData: {
        editor: this
      }
    }
    // 重新打开历史记录标识
    this.editor.historyStore._canPushHistory = true
    // 自定义生成历史记录
    this.stage.fire(CREATE_HISTORY_EVENT_NAME, historyData)
  }
  // 组合操作
  _combination (group, targets) {
    this.layer.add(group)
    const groupTransform = group.getAbsoluteTransform()
    // 将选中的元素添加到group并调整位置
    targets.forEach(target => {
      const targetPosition = target.absolutePosition()
      target.moveTo(group)
      target.draggable(false)
      target.setAttr('_selection', false)
      target.position(groupTransform.copy().invert().point(targetPosition))
    })
  }
  // 取消组合
  cancelCombination (groups, realGroups) {
    // 当传入第二个参数时可以覆盖当前选中的分组
    if (realGroups && realGroups.length) {
      groups = realGroups
    }
    // 关闭历史记录的产生 自定义历史记录
    this.editor.historyStore._canPushHistory = false
    const unCombinationChildrens = this._cancelCombination(groups)
    // 重新打开历史记录标识
    this.editor.historyStore._canPushHistory = true
    const historyData = {
      target: groups,
      historyType: cancelCombinationHistoryTypeHandle.historyType,
      extraData: {
        editor: this,
        unCombinationChildrens
      }
    }
    // 自定义生成历史记录
    this.stage.fire(CREATE_HISTORY_EVENT_NAME, historyData)
  }
  // 取消组合操作
  _cancelCombination (groups = []) {
    return groups.map(group => {
      if (!NormalGroup.isNormalGroup(group)) {
        console.warn('no group selected can\'t exec cancelCombination action')
        return
      }
      const parent = group.getParent()
      group.resetStyle()
      const parentTransform = parent.getAbsoluteTransform()
      const unCombinationChildren = []
      group.children.forEach(child => {
        if (this.editor.selectionStore.isCanSelectComponent(child)) {
          unCombinationChildren.push(child)
        }
      })
      unCombinationChildren.forEach(child => {
        const absolutePosition = child.absolutePosition()
        child.draggable(true)
        child.setAttr('_selection', true)
        child.moveTo(parent)
        child.position(parentTransform.copy().invert().point(absolutePosition))
      })
      group.remove()
      return unCombinationChildren
    })
  }
  // 更新组件
  updateComponentGroup (targets, componentObject) {
    this.editor.historyStore._canPushHistory = false
    const componentGroup = targets[0]
    const oldComponnet = componentGroup.children.find(item => Component.isComponent(item))
    const oldComponentObject = oldComponnet.toObject()
    const component = this._updateComponentGroup(componentGroup, oldComponnet, componentObject)
    this.editor.historyStore._canPushHistory = true
    if (component) {
      // 产生自定义历史记录
      const historyData = {
        historyType: updateComponentGroupHistoryHandle.historyType,
        target: componentGroup,
        extraData: {
          oldComponentObject: oldComponentObject,
          componentObject,
          editor: this
        }
      }
      // 自定义生成历史记录
      this.stage.fire(CREATE_HISTORY_EVENT_NAME, historyData)
    }
  }
  _updateComponentGroup (componentGroup, oldComponnet, componentObject) {
    const component = createNodesByJSON(componentObject)[0]
    if (component) {
      // 销毁原来的component
      oldComponnet.destroy()
      // 添加新的component
      componentGroup.add(component)
    }
    return component
  }
  // 更新文字
  updateText (textNode, config) {
    this.editor.historyStore._canPushHistory = false
    // 减少触发频次
    if (!textNode._oldAttrs) {
      textNode._oldAttrs = { ...textNode.getAttrs() }
    }
    textNode.setAttrs(config)
    clearTimeout(this.updateTextTimer)
    this.updateTextTimer = setTimeout(() => {
      this.updateTextTimer = undefined
      this.editor.historyStore._canPushHistory = true
      // 生成属性变化历史记录
      this.stage.fire(ATTRS_CHANGE_EVENT, {
        targets: [textNode],
        oldAttrs: [textNode._oldAttrs],
        newAttrs: [{ ...textNode.getAttrs() }]
      })
      delete textNode._oldAttrs
    }, 600)
  }
  // 生成绑定解除数据的历史
  bindDataHistoryWrapper (targets, execFunc, afterExecFun) {
    this.editor.historyStore._canPushHistory = false
    targets.forEach((target, index) => {
      execFunc(target, index)
    })
    this.editor.historyStore._canPushHistory = true
    afterExecFun()
  }
  // 绑定数据
  bindData (targets, datas) {
    this.bindDataHistoryWrapper(targets, (target, index) => {
      target.bindData && target.bindData(datas[index])
    }, () => {
      // 生成历史
      const historyData = {
        historyType: bindDataHistoryHandle.historyType,
        target: targets,
        extraData: {
          datas
        }
      }
      this.stage.fire(CREATE_HISTORY_EVENT_NAME, historyData)
    })
  }
  // 解绑数据
  unBindData (targets) {
    // 已绑定的数据
    const datas = targets.map(target => {
      const store = target.getAttr('store')
      if (store) {
        return store.data || {}
      }
      return {}
    })
    this.bindDataHistoryWrapper(targets, target => {
      target.unBindData && target.unBindData()
    }, () => {
      // 生成历史
      const historyData = {
        historyType: unBindDataHistoryHandle.historyType,
        target: targets,
        extraData: {
          datas
        }
      }
      this.stage.fire(CREATE_HISTORY_EVENT_NAME, historyData)
    })
  }
}

export default Command
