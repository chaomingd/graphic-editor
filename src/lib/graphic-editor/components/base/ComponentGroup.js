import konva from 'konva'
import ComponentNames from './ComponentNames'
import { deepMerges } from '../../utils/index'
import ThemeConfig from '../../theme/themeConfig'
import BaseComponent from './BaseComponent'
import { createControlPointRect } from '../ControlPoint'
import { isWiringDiagramNode } from '../../utils/nodeUtils'

class ComponentGroup extends konva.Group {
  static isComponentGroup (node) {
    if (!node) return false
    return node instanceof ComponentGroup && node.hasName(ComponentNames.ComponentGroup)
  }
  // 组件名称
  _componentName = 'ComponentGroup'
  constructor (config = {}) {
    config.name = config.name || ComponentNames.ComponentGroup
    config = deepMerges({
      ...ThemeConfig.componentGroup,
      centerX: true,
      centerY: true,
      store: {
        isBindData: false,
        // 展示数据预览
        showPreview: false,
        // 数据存储
        data: {
          objectIds: [],
          objectId: '',
          selectMetrics: []
        }
      }
    }, config, config.attrs || {},)
    const children = config.children || []
    if (config.attrs) {
      delete config.attrs
    }
    delete config.children
    super(config)
    this.initComponentChildren(children)
    // 边沿矩形
    if (!config.noEdgeBox) {
      this.initEdgeBox()
    }
    // 生成控制点
    BaseComponent.prototype._createControlPoints.call(this)
    // 设置原点位置
    BaseComponent.prototype.setCenter.call(this, config)
  }
  // 判断当前元素是否被选中  (selectionStore中自动设置)
  isSelected () {
    return this.getAttr('_selected') || false
  }
  
  // 是否包含传入的基础元件
  contains (target, children) {
    if (!children) {
      children = this.children
    }
    const len = this.children.length
    for (let i = 0; i < len; i++) {
      if (children[i] === target) return true
      if (children[i] instanceof ComponentGroup) {
        if (children[i].children && children[i].children.length && this.contains(target, children[i].children)) return true
      }
    }
    return false
  }
  // 如果调用konva.Group的getClientRect会因为增加了控制点，计算出的width 和 height 会多出几个像素
  // 所以覆盖konva.Group原型方法 调用边沿矩形的getClientRect
  getClientRect (config) {
    if (this.edageBox) {
      return this.edageBox.getClientRect(config)
    }
    return super.getClientRect()
  }
  // 将控制点设为静默状态，不参与碰撞检测
  slientControlPoints () {
    BaseComponent.prototype.slientControlPoints.call(this)
  }
  // 将控制点恢复，参与碰撞检测
  unSilentControlPoints () {
    BaseComponent.prototype.unSilentControlPoints.call(this)
  }
  // 选中样式
  setSelectionStyle () {
    this.edageBox.show()
    this.controlPoints.forEach(item => {
      item.show()
    })
    this.borderRect.hide()
  }
  // 拖拽样式
  setDragStyle () {
    this.edageBox.show()
    this.controlPoints.forEach(item => {
      item.show()
    })
    this.borderRect.hide()
  }
  // 重置样式
  resetStyle () {
    this.edageBox.hide()
    this.controlPoints.forEach(item => {
      item.hide()
    })
    this.borderRect.show()
  }
  // 更新边沿矩形的高度
  updateEdgeBoxHeight (h) {
    if (this.edageBox) {
      this.edageBox.height(h)
      this.borderRect.height(h)
    }
  }
  // 边沿矩形
  initEdgeBox () {
    const w = this.width()
    const h = this.height()
    this.edageBox = new konva.Shape({
      x: 0,
      y: 0,
      name: 'edgeBox',
      strokeWidth: 1,
      strokeScaleEnabled: false,
      width: this.width(),
      height: this.height(),
      visible: false,
      listening: false,
      ...ThemeConfig.componentWireframe.selectStyle,
      sceneFunc: (context, shape) => {
        context.beginPath()
        context.rect(0.5, 0.5, w, h)
        context.strokeShape(shape)
      },
      hitFunc: (hitContext, shape) => {
        hitContext.beginPath()
        hitContext.rect(0, 0, this.width(), this.height())
        hitContext.closePath()
        hitContext.fillStrokeShape(shape)
      }
    })
    this.borderRect = new konva.Rect({
      strokeScaleEnabled: false,
      x: 0.5,
      y: 0.5,
      width: w,
      height: h,
      visible: false,
      listening: false,
      ...ThemeConfig.componentWireframe.border
    })
    this.add(this.edageBox)
  }
  createControlPoint (config) {
    return createControlPointRect(config)
  }
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
      },
      // 母线位置的控制点
      {
        x: 0,
        y: 131,
        invisible: true
      },
      // 母线位置的控制点
      {
        x: w,
        y: 131,
        invisible: true
      }
    ]
    return controlPointsConfig
  }
  // 克隆
  clone () {
    const Constructor = this.constructor
    return new Constructor(this.toObject())
  }
  // 初始化子节点
  initComponentChildren (children) {
    const WiringDiagramComponents = this.constructor.getComponents()
    children.forEach(item => {
      const Node = WiringDiagramComponents[item.className]
      let childComponent
      if (Node) {
        childComponent = new Node(item)
      } else {
        childComponent = konva.Node.create(item)
      }
      this.add(childComponent)
    })
  }
  // 类名
  getComponentName () {
    return this._componentName
  }
  // 导出json
  toObject () {
    const children = this.children
    const jsonObject = {
      className: this.getComponentName(),
      attrs: this.getAttrs(),
      children: []
    }
    if (children && children.length) {
      children.forEach(child => {
        if (isWiringDiagramNode(child)) {
          jsonObject.children.push(child.toObject())
        }
      })
    }
    return jsonObject
  }
}
export default ComponentGroup
