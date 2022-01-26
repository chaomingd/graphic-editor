import EventEmitter from '../utils/EventEmitter'
import BaseComponent from '../components/base/BaseComponent'
import ComponentGroup from '../components/base/ComponentGroup'
import NormalGroup from '../components/base/NormalGroup'
import EditableText from '../components/EditableText'

// 判断target是否是可编辑文字元素
function isEditableText (target) {
  if (!target) return false
  return target instanceof EditableText
}
class SelectionStore extends EventEmitter {
  constructor () {
    super()
    this._activeElement = []
    this._selectionChangeEventName = 'selectionChange'
  }
  getActiveElement () {
    return this._activeElement || []
  }
  // 选区变化
  selectionChange () {
    this.fire(this._selectionChangeEventName, this._activeElement)
  }
  // 选中元素
  setActiveElement (el) {
    this._activeElement.forEach(el => {
      el.setAttr('_selected', false)
    })
    if (!el) {
      this._activeElement = []
      this.selectionChange()
      return
    }
    if ('length' in el) {
      this._activeElement = el
    } else {
      this._activeElement = [el]
    }
    this.selectionChange()
    this._activeElement.forEach(el => {
      el.setAttr('_selected', true)
    })
  }
  // 是否是可选的元素 BaseComponent Component ComponentGroup
  isCanSelectComponent (node) {
    return BaseComponent.isBaseComponent(node) || ComponentGroup.isComponentGroup(node) || NormalGroup.isNormalGroup(node) || isEditableText(node)
  }
}

export {
  SelectionStore
}
