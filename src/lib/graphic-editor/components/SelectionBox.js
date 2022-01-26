/**
 * 选框
 */
import konva from 'konva'
import { deepMerges } from '../utils/index'
import themeConfig from '../theme/themeConfig'
import ComponentNames from './base/ComponentNames'

class SelectionBox extends konva.Rect {
  // 组件名称
  _componentName = ComponentNames.SelectionBox
  static isSelectionBox (node) {
    if (!node) return false
    return node instanceof SelectionBox && node.hasName(ComponentNames.SelectionBox)
  }
  constructor (config = {}) {
    config = deepMerges({
      ...themeConfig.selectionBox.style,
      name: ComponentNames.SelectionBox,
      listening: false,
      strokeScaleEnabled: false
    }, config, config.attrs || {})
    delete config.attrs
    super(config)
  }
}

export default SelectionBox
