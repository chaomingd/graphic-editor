import ComponentGroup from './ComponentGroup'
import ComponentNames from './ComponentNames'
import { deepMerges } from '../../utils/index'
import ThemeConfig from '../../theme/themeConfig'

class Component extends ComponentGroup {
  static isComponent (node) {
    if (!node) return false
    return node instanceof Component && node.hasName(ComponentNames.Component)
  }
  // 组件名称
  _componentName = 'Component'
  constructor (config = {}) {
    config = deepMerges({
      ...ThemeConfig.component,
      // 剪切
      clipX: 0,
      clipY: 0,
      clipWidth: ThemeConfig.component.width,
      clipHeight: ThemeConfig.component.height
    }, config, config.attrs || {})
    config.name = ComponentNames.Component
    config.width = ThemeConfig.component.width
    config.height = ThemeConfig.component.height
    delete config.attrs
    super(config)
  }
  // 生成控制点
  createControlPoints () {
    const w = this.width()
    const h = this.height()
    const controlPointsConfig = [
      // 四个角的控制点
      {
        x: 0.5,
        y: 0.5
      },
      {
        x: w + 0.5,
        y: 0.5
      },
      {
        x: 0.5,
        y: h + 0.5
      },
      {
        x: w + 0.5,
        y: h + 0.5
      }
    ]
    return controlPointsConfig
  }
  // 镜像
  reflectionY () {
    this.scaleY(-this.scaleY())
  }
}
export default Component
