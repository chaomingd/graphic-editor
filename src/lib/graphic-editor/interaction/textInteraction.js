import wiringDiagramComponents from '../components/index'
import { contains } from '../utils/nodeUtils'
import { REMOVE_EVENT_NAME, ATTRS_CHANGE_EVENT } from './historyInteraction'
const EVENT_SUFIX = '.textInteraction'

// 判断target是否是可编辑文字元素
function isEditableText (target) {
  if (!target) return false
  return target instanceof wiringDiagramComponents.EditableText && target.getAttr('_selection')
}

/**
 * 文件编辑待优化
*/
export function registerTextInteraction ({ Editor, stage, layer, transformer, command, selectionStore }) {
  let activeEditableTextNode = null
  let transformChangeTarget = null
  Editor.off('createText')
  Editor.on('createText', (config) => {
    const textNode = new wiringDiagramComponents.EditableText(config)
    textNode.position(layer.getAbsoluteTransform().copy().invert().point(textNode.position()))
    layer.add(textNode)
  })
  Editor.on('updateText', attrs => {
    // 获取当前选中的元素
    if (activeEditableTextNode) {
      command.updateText(activeEditableTextNode, attrs)
    }
  })
  layer.add(transformer)
  selectionStore.on('selectionChange', selectedElements => {
    const node = selectedElements[0]
    if (isEditableText(node)) {
      activeEditableTextNode = node
      transformer.moveToTop()
      transformer.show()
      if (transformer.nodes()[0] === node) return
      transformer.nodes([node])
    }
  })
  stage.on('mousedown' + EVENT_SUFIX, (e) => {
    const node = e.target
    if (!isEditableText(node)) {
      if (node !== transformer && !contains(transformer, node)) {
        if (transformer.visible()) {
          transformer.nodes([])
          transformer.hide()
        }
      }
      activeEditableTextNode = null
    } else {
      activeEditableTextNode = node
    }
  })
  stage.on('dblclick' + EVENT_SUFIX, e => {
    const target = e.target
    if (isEditableText(target)) {
      transformer.hide()
    }
  })
  stage.on(REMOVE_EVENT_NAME + EVENT_SUFIX, ({ target }) => {
    if (isEditableText(target)) {
      if (transformer.nodes()[0] === target) {
        if (transformer.visible()) {
          transformer.nodes([])
          transformer.hide()
        }
      }
    }
  })
  // 处理变换历史
  transformer.on('transformstart' + EVENT_SUFIX, e => {
    transformChangeTarget = e.target
    transformChangeTarget._attrs = { ...transformChangeTarget.getAttrs() }
  })
  transformer.on('transformend' + EVENT_SUFIX, e => {
    if (e.target === transformChangeTarget) {
      stage.fire(ATTRS_CHANGE_EVENT, {
        targets: [transformChangeTarget],
        oldAttrs: [transformChangeTarget._attrs],
        newAttrs: [{ ...transformChangeTarget.getAttrs() }]
      })
      delete transformChangeTarget._attrs
    }
  })
  return {
    destroy () {
      if (transformer) {
        stage.off('click' + EVENT_SUFIX)
        stage.off('dblclick' + EVENT_SUFIX)
        stage.off('mousedown' + EVENT_SUFIX)
        stage.off(REMOVE_EVENT_NAME + EVENT_SUFIX)
        transformer.off('transformstart' + EVENT_SUFIX)
        transformer.off('transformend' + EVENT_SUFIX)
        transformer.destroy()
      }
      Editor.off('createText')
      Editor.off('updateText')
    }
  }
}
