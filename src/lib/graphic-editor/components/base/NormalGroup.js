import ComponentGroup from './ComponentGroup'
import ComponentNames from './ComponentNames'
import konva from 'konva'
import BaseComponent from './BaseComponent'

class NormalGroup extends ComponentGroup {
  static isNormalGroup (node) {
    if (!node) return false
    return node instanceof NormalGroup && node.hasName(ComponentNames.NormalGroup)
  }
  // 组件名称
  _componentName = 'NormalGroup'
  constructor (config = {}) {
    config.name = ComponentNames.NormalGroup
    super(config)
    this.createHitRect()
  }
  // 创建一个热区
  createHitRect () {
    this.hitRect = new konva.Rect({
      x: 0,
      y: 0,
      width: this.width(),
      height: this.height(),
      fill: 'transparent',
      stroke: 'transparent'
    })
    this.add(this.hitRect)
  }
  // 选中样式
  setSelectionStyle () {
    super.setSelectionStyle()
    // 设置子节点的选中样式
    function setChildrenSelectionStyle (children) {
      children && children.forEach(child => {
        if (BaseComponent.isBaseComponent(child) || ComponentGroup.isComponentGroup(child) || NormalGroup.isNormalGroup(child)) {
          child.setSelectionStyle()
        }
      })
    }
    setChildrenSelectionStyle(this.children)
  }
  // 拖拽样式
  setDragStyle () {
    super.setDragStyle()
    // 设置子节点的选中样式
    function setChildrenDragStyle (children) {
      children && children.forEach(child => {
        if (BaseComponent.isBaseComponent(child) || ComponentGroup.isComponentGroup(child) || NormalGroup.isNormalGroup(child)) {
          child.setDragStyle()
        }
      })
    }
    setChildrenDragStyle(this.children)
  }
  // 重置样式
  resetStyle () {
    super.resetStyle()
    // 设置子节点的选中样式
    function resetChildrenStyle (children) {
      children && children.forEach(child => {
        if (BaseComponent.isBaseComponent(child) || ComponentGroup.isComponentGroup(child) || NormalGroup.isNormalGroup(child)) {
          child.resetStyle()
        }
      })
    }
    resetChildrenStyle(this.children)
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
  reflectionY () {
    this.scaleY(-this.scaleY())
  }
}

export default NormalGroup
