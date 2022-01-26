import konva from 'konva'
import ComponentNames from './base/ComponentNames'
import ThemeConfig from '../theme/themeConfig'
import { deepMerges } from '../utils/index'
import BaseComponent from './base/BaseComponent'

// 圆形控制点
export class ControlPoint extends konva.Circle {
  static isControlPoint (node) {
    if (!node) return false
    return node instanceof ControlPoint && node.hasName(ComponentNames.ControlPoint)
  }
  // 组件名称
  _componentName = 'ControlPoint'
  constructor (config = {}) {
    config.name = ComponentNames.ControlPoint
    if (config.attrs) {
      delete config.attrs.width
      delete config.attrs.height
    }
    config = deepMerges({
      visible: false,
      // 是否隐身
      invisible: false
    }, config, config.attrs, ThemeConfig.controlPoint.style, ThemeConfig.controlPoint.defaultStyle)
    delete config.attrs
    super(config)
    this._isCollision = config._isCollision || false
    this._isSilent = config._isSilent || false
    // 鼠标移入的手型
    this.enterCursor = 'pointer'
    if (config.invisible) {
      this.visible(true)
    }
  }
  visible (v) {
    if (v !== undefined) {
      if (!this.getAttr('invisible')) {
        super.visible(v)
      } else {
        // 隐身
        super.visible(false)
      }
    }
    return super.visible()
  }
  isCollision () {
    return this._isCollision
  }
  collision () {
    if (this._isCollision) return
    this._isCollision = true
    this.setAttrs(ThemeConfig.controlPoint.collisionStyle)
  }
  unCollision () {
    if (this._isCollision === false) return
    this._isCollision = false
    this.setAttrs(ThemeConfig.controlPoint.defaultStyle)
  }
  // 静默  不会被添加到碰撞检测中以提升性能
  silent () {
    this._isSilent = true
    this.setAttr('_isSilent', true)
  }
  unSilent () {
    this._isSilent = false
    this.setAttr('_isSilent', false)
  }
  isSilent () {
    return this._isSilent
  }
}

// 矩形控制点
export class ControlPointRect extends konva.Rect {
  static isControlPointRect (node) {
    if (!node) return false
    return node instanceof ControlPointRect && node.hasName(ComponentNames.ControlPointRect)
  }
  constructor (config = {}) {
    config.name = ComponentNames.ControlPointRect
    config = deepMerges({
      visible: false,
      centerX: true,
      centerY: true,
      // 是否隐身
      invisible: false
    }, config, ThemeConfig.controlPointRect.style)
    super(config)
    if (config.invisible) {
      this.visible(true)
    }
    this._isCollision = config._isCollision || false
    this._isSilent = config._isSilent || false
    BaseComponent.prototype.setCenter.call(this, config)
  }
  visible (v) {
    if (v !== undefined) {
      if (!this.getAttr('invisible')) {
        super.visible(v)
      } else {
        // 隐身
        super.visible(false)
      }
    }
    return super.visible()
  }
  isCollision () {
    return this._isCollision
  }
  collision () {
    if (this._isCollision) return
    this._isCollision = true
  }
  unCollision () {
    if (this._isCollision === false) return
    this._isCollision = false
  }
  // 静默  不会被添加到碰撞检测中以提升性能
  silent () {
    this._isSilent = true
  }
  unSilent () {
    this._isSilent = false
  }
  isSilent () {
    return this._isSilent
  }
}

// 创建圆形控制点默认隐藏
export function createControlPoint (config = {}) {
  return new ControlPoint(deepMerges({ listening: false }, config))
}

// 创建矩形控制点默认隐藏
export function createControlPointRect (config = {}) {
  return new ControlPointRect(deepMerges({ listening: false }, config))
}
