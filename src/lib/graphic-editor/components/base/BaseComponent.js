import konva from 'konva'
import { isPlainObject, isArray } from './utils.js'
import ComponentNames from './ComponentNames'
import { createControlPoint } from '../ControlPoint'
import ThemeConfig from '../../theme/themeConfig'
import { deepMerges } from '../../utils/index'

class BaseComponent extends konva.Group {
  static isBaseComponent (node) {
    if (!node) return false
    return node instanceof BaseComponent && node.hasName(ComponentNames.BaseComponent)
  }
  // 组件名称
  _componentName = 'BaseComponent'
  // 是否用svg path绘制
  _pathShape = false
  // 附件数据
  _extraData = {}
  constructor (config, extraData = {}) {
    if (!isPlainObject(config)) {
      throw new Error('config must be object')
    }
    if (config.attrs) {
      delete config.attrs.width
      delete config.attrs.height
    }
    config = deepMerges({
      width: 32,
      height: 32,
      name: ComponentNames.BaseComponent,
      // 是否将控制点设置为静默状态
      _isSilentControlPoint: false,
      store: {
        // 是否绑定数据
        isBindData: false,
        // 是否显示通断电状态
        showOnOffStatus: false,
        // 数据存储
        data: {
          objectIds: [],
          objectId: '',
          selectMetrics: []
        }
      },
      centerX: true,
      centerY: true
    }, config, config.attrs || {})
    if (config.attrs) {
      delete config.attrs
    }
    super(config)
    this._extraData = extraData
    this._pathShape = extraData.pathShape
    this.initComponent()
    this.setCenter(config)
    if (config._isSilentControlPoint) {
      this.slientControlPoints()
    }
  }
  // 判断当前元素是否被选中  (selectionStore中自动设置)
  isSelected () {
    return this.getAttr('_selected') || false
  }
  // 将控制点设置为静默状态 不参与碰撞检测
  slientControlPoints () {
    this.controlPoints.forEach(controlPoint => {
      controlPoint.silent()
    })
  }
  // 取消控制点静默状态
  unSilentControlPoints () {
    this.controlPoints.forEach(controlPoint => {
      controlPoint.unSilent()
    })
  }
  // 如果调用konva.Group的getClientRect会因为增加了控制点，计算出的width 和 height 会多出几个像素
  // 所以覆盖konva.Group原型方法 调用边沿矩形的getClientRect
  getClientRect (config) {
    if (this.edageBox) {
      const clientRect = this.edageBox.getClientRect(config)
      return clientRect
    }
    return super.getClientRect()
  }
  // 是否已绑定数据
  isBindData () {
    return this.getAttr('store').isBindData
  }
  // 通电状态
  setOnStyle (store) {
    if ('open' in store) {
      if (store.open === true) {
        this.statusChange && this.statusChange(false)
        store.open = false
        this.setAttr('store', store)
      }
    }
    this.setShapeStyle(ThemeConfig.baseComponent.onStyle)
  }
  // 断电状态
  setOffStyle (store) {
    if ('open' in store) {
      if (store.open === false) {
        this.statusChange && this.statusChange(false)
      }
      store.open = true
      this.setAttr('store', store)
    }
    this.setShapeStyle(ThemeConfig.baseComponent.offStyle)
  }
  // 绑定数据的状态
  setBindDataStyle () {
    this.setShapeStyle(ThemeConfig.baseComponent.bindDataStyle)
    if (this.isSelected()) {
      this.edageBox.setAttrs(ThemeConfig.edageBox.bindDataStyle.selectStyle)
    }
  }
  // 解除绑定数据的样式
  setUnbindDataStyle () {
    this.shapes.forEach(shape => {
      shape.setAttrs(ThemeConfig.baseComponent.defaultStyle)
    })
  }
  // 选中样式
  setSelectionStyle () {
    const isBindData = this.isBindData()
    if (!isBindData) {
      // 设置图形选中样式
      this.setShapeStyle(ThemeConfig.baseComponent.activeStyle)
    }
    this.controlPoints.forEach(point => {
      if (!point.isSilent()) {
        point.unSilent()
        point.unCollision()
        point.show()
      }
    })
    // 设置边沿矩形选中样式
    this.edageBox.show()
    this.edageBox.setAttrs(isBindData ? ThemeConfig.edageBox.bindDataStyle.selectStyle : ThemeConfig.edageBox.selectStyle)
  }
  // 拖拽样式
  setDragStyle () {
    const isBindData = this.isBindData()
    if (!isBindData) {
      // 设置图形拖拽样式
      this.setShapeStyle(ThemeConfig.baseComponent.dragStyle)
    }
    this.controlPoints.forEach(point => {
      if (!point.isSilent()) {
        point.unSilent()
        point.show()
      }
    })
    // 设置边沿矩形拖拽样式
    this.edageBox.show()
    this.edageBox.setAttrs(isBindData ? ThemeConfig.edageBox.bindDataStyle.dragStyle : ThemeConfig.edageBox.dragStyle)
  }
  // 重置默认样式
  resetStyle () {
    if (!this.isBindData()) {
      this.setShapeStyle(ThemeConfig.baseComponent.defaultStyle)
    }
    this.controlPoints.forEach(point => {
      point.hide()
    })
    this.edageBox.hide()
  }
  setShapeStyle (style) {
    const newStyle = { ...style }
    // 如果是svg路径则不能设置描边
    if (this._pathShape) {
      delete newStyle.stroke
    }
    this.shapes.forEach(shape => {
      shape.setAttrs(newStyle)
    })
  }
  // 更新边沿矩形的宽高
  updateEdgeBoxRect (width, height) {
    width !== undefined && this.edageBox.width(width)
    height !== undefined && this.edageBox.height(height)
  }
  // 边沿矩形
  initEdgeBox () {
    this.edageBox = new konva.Rect({
      x: 0,
      y: 0,
      strokeWidth: 1,
      width: this.width(),
      height: this.height(),
      dash: [5, 5],
      dashEnable: false,
      listening: false,
      cornerRadius: 4
    })
    this.add(this.edageBox)
  }
  // 获取className
  getComponentName () {
    return this._componentName
  }
  // 创建控制点
  createControlPoint (config) {
    return createControlPoint(config)
  }
  // 设置原
  setCenter (config) {
    this.offsetX(config.centerX ? this.width() / 2 : 0)
    this.offsetY(config.centerY ? this.height() / 2 : 0)
  }
  // 初始化组件，创建图形和控制点并包装成数组
  initComponent () {
    this._createShapes(this)
    if (!this.getAttr('noEdgeBox')) {
      this.initEdgeBox()
    }
    this._createControlPoints(this)
  }
  // 创建图形， 接口方法由子类具体实现
  createShapes () {
    return []
  }
  // 处理shapes
  _createShapes () {
    const shapes = this.createShapes(this)
    if (shapes) {
      if (isArray(shapes)) {
        this.shapes = shapes
      } else {
        this.shapes = [shapes]
      }
    }
    this.shapes.forEach(shape => {
      const attrs = shape.getAttrs()
      shape.draggable(false)
      if (!attrs._noHit) {
        shape.hitFunc((hitContext, shape) => {
          hitContext.beginPath()
          hitContext.rect(0, 0, this.width(), this.height())
          hitContext.closePath()
          hitContext.fillStrokeShape(shape)
        })
      }
      this.add(shape)
    })
  }
  // 创建控制点
  createControlPoints () {
    return []
  }
  // 处理控制点 接口方法由子类具体实现
  _createControlPoints () {
    const controlPointsConfig = this.createControlPoints(this)
    if (!isArray(controlPointsConfig)) throw new Error('controlPointsConfig must be array')
    const controlPoints = []
    controlPointsConfig.forEach(config => {
      const controlPoint = this.createControlPoint(config)
      controlPoints.push(controlPoint)
    })
    this.controlPoints = controlPoints
    this.controlPoints.forEach(point => this.add(point))
  }
  // 重写add方法  加入逻辑判断 基础组件不能嵌套基础组件
  add (...nodes) {
    let isOk = true
    for (let i = 0; i < nodes.length; i++) {
      if (this.constructor.isBaseComponent(nodes[i])) {
        isOk = false
        break
      }
    }
    if (!isOk) throw new Error('基础组件不能嵌套基础组件，如有需要请使用Component的实例')
    super.add(...nodes)
  }
  // 克隆
  clone () {
    const Component = this.constructor
    const cloned = new Component(this.getAttrs())
    return cloned
  }
  // 导出数据
  toObject () {
    return {
      className: this.getComponentName(),
      attrs: this.getAttrs()
    }
  }
}
export default BaseComponent
