/**
 * 线的基类
 * */
import BaseComponent from './BaseComponent'
import Vector2D from '../../utils/Vector2D.js'
import { createControlPoint } from '../ControlPoint'
import { LineComponentHeight } from './config'
import konva from 'konva'
import ThemeConfig from '../../theme/themeConfig'
import { deepMerges, degToRad } from '../../utils/index'

const defaultConfig = {
  width: 32,
  lineWidth: 2,
  height: LineComponentHeight,
  store: {
    gap: 32,
    // 是否可自由拉伸
    freeDraw: false
  }
}

// 控制点的hitStrokeWidth
const controlPointHitStrokeWidth = 5

class LineBaseComponent extends BaseComponent {
  _lineComponent = true
  static isLineBaseComponent (target) {
    if (!target) return
    return target instanceof LineBaseComponent && target._lineComponent
  }
  constructor (config = {}) {
    config = deepMerges({}, defaultConfig, config, config.attrs || {})
    delete config.attrs
    super(config)
    // 方向向量
    this.dir = new Vector2D()
    if (this.rotation()) {
      this.dir.rotation(this.rotation())
    }
    // 拉伸向量
    this.stretchVec = new Vector2D()
    // 点间隔
    this.gap = config.store.gap
    this.freeDraw = config.store.freeDraw
    // 初始的宽度
    this.initWidth = config.store.initWidth || this.gap
    this.controlPoints.forEach((item, index) => {
      item._controlPointIndex = index
    })
  }
  // 重写旋转方法
  rotation (deg) {
    if (deg !== undefined) {
      super.rotation(deg)
      // 修改方向向量
      this.dir.rotation(deg)
    }
    return super.rotation()
  }
  clone () {
    const cloned = super.clone()
    cloned.dir = this.dir.copy()
    return cloned
  }
  // 设置原点在中心
  centerOrigin () {
    const oldOffsetX = this.offsetX()
    const oldOffsetY = this.offsetY()
    const newOffsetX = this.width() / 2
    const newOffsetY = this.height() / 2
    this.offsetX(newOffsetX)
    this.offsetY(newOffsetY)
    const moveVec = new Vector2D(newOffsetX - oldOffsetX, newOffsetY - oldOffsetY)
    const moveX = moveVec.dot(this.dir)
    const moveY = moveVec.cross(this.dir)
    this.move({
      x: moveX,
      y: moveY
    })
  }
  // 根据宽度和位置更新样式
  updateByWidthAndPosition (width, position, offsetX, offsetY) {
    if (position) {
      this.position(position)
      this.offsetX(offsetX)
      this.offsetY(offsetY)
    }
    this.width(width)
    this.shapes[0].width(width)
    // 更新边沿矩形
    this.updateEdgeBoxRect(width)
    if (this.freeDraw) {
      this.controlPoints[1].x(width)
    } else {
      this.updateControlPoints(Math.round(width / this.gap) + 1)
    }
  }
  createShapes () {
    return new konva.Shape({
      width: this.width(),
      height: this.height(),
      stroke: ThemeConfig.stroke,
      strokeWidth: this.getAttr('lineWidth'),
      sceneFunc: (context, shape) => {
        const x = this.width()
        const y = this.height() / 2
        context.beginPath()
        context.moveTo(0, y)
        context.lineTo(x, y)
        context.strokeShape(shape)
      }
    })
  }
  createControlPoints () {
    const attrs = this.getAttrs()
    const y = attrs.height / 2
    // 如果是自由拉伸模式只生成两个控制点
    if (attrs.store.freeDraw) {
      return [
        {
          x: 0,
          y: y,
          listening: true,
          hitStrokeWidth: controlPointHitStrokeWidth
        },
        {
          x: attrs.width,
          y: y,
          listening: true,
          hitStrokeWidth: controlPointHitStrokeWidth
        }
      ]
    }
    const gap = attrs.store.gap
    const count = Math.round(attrs.width / gap) + 1
    const controlPoints = []
    for (let i = 0; i < count; i++) {
      controlPoints.push({
        x: i * gap,
        y: y,
        listening: true,
        hitStrokeWidth: controlPointHitStrokeWidth
      })
    }
    return controlPoints
  }
  // 拉伸
  stretch (controlPoint, startPosition, endPosition) {
    this.stretchVec.set(endPosition.x - startPosition.x, endPosition.y - startPosition.y)
    // 横向投影
    const horizentalProject = this.stretchVec.dot(this.dir) / this.getStage().scaleX()
    if (this.freeDraw) {
      this._stretchFree(controlPoint, horizentalProject)
    } else {
      this._stretchByGap(controlPoint, horizentalProject)
    }
  }
  // 自由拉伸
  _stretchFree (controlPoint, horizentalProject) {
    const controlPointIndex = controlPoint._controlPointIndex
    let width
    if (controlPointIndex > 0) {
      width = this._mousedownWidth + horizentalProject
      if (width < 0) {
        const moveX = width * Math.cos(degToRad(this.rotation()))
        const moveY = width * Math.sin(degToRad(this.rotation()))
        // 修复位移
        this.position({
          x: this._oldPosition.x + moveX,
          y: this._oldPosition.y + moveY
        })
        width = -width
      } else {
        this.position(this._oldPosition)
      }
    } else {
      width = this._mousedownWidth - horizentalProject
      let moveDelta
      if (width > 0) {
        moveDelta = horizentalProject
      } else {
        moveDelta = this._mousedownWidth
        width = -width
        this.position(this._oldPosition)
      }
      const moveX = moveDelta * Math.cos(degToRad(this.rotation()))
      const moveY = moveDelta * Math.sin(degToRad(this.rotation()))
      // 修复位移
      this.position({
        x: this._oldPosition.x + moveX,
        y: this._oldPosition.y + moveY
      })
    }
    this.updateByWidthAndPosition(width)
  }
  // 根据间隔进行拉伸
  _stretchByGap (controlPoint, horizentalProject) {
    const controlPointIndex = controlPoint._controlPointIndex
    let width, realWidth
    const gap = this.getAttrs().store.gap
    if (controlPointIndex > 0) {
      width = this._mousedownWidth + horizentalProject
      const count = Math.round(Math.abs(width) / gap)
      realWidth = count * gap
      // if (realWidth < this.initWidth || realWidth === this.width()) return
      if (realWidth === this.width()) return
      if (width < 0) {
        const moveX = -realWidth * Math.cos(degToRad(this.rotation()))
        const moveY = -realWidth * Math.sin(degToRad(this.rotation()))
        // 修复位移
        this.position({
          x: this._oldPosition.x + moveX,
          y: this._oldPosition.y + moveY
        })
      } else {
        this.position(this._oldPosition)
      }
    } else {
      width = this._mousedownWidth - horizentalProject
      const count = Math.round(Math.abs(width) / gap)
      realWidth = count * gap
      // if (realWidth < this.initWidth || realWidth === this.width()) return
      if (realWidth === this.width()) return
      let moveDelta
      if (width > 0) {
        moveDelta = this._mousedownWidth - realWidth
      } else {
        moveDelta = this._mousedownWidth
        this.position(this._oldPosition)
      }
      const moveX = moveDelta * Math.cos(degToRad(this.rotation()))
      const moveY = moveDelta * Math.sin(degToRad(this.rotation()))
      // 修复位移
      this.position({
        x: this._oldPosition.x + moveX,
        y: this._oldPosition.y + moveY
      })
    }
    this.updateByWidthAndPosition(realWidth)
  }
  // 更新控制点
  updateControlPoints (count) {
    if (this.controlPoints.length > count) {
      while (this.controlPoints.length > count) {
        const popControlPoint = this.controlPoints.pop()
        popControlPoint.destroy()
      }
    } else {
      const y = this.height() / 2
      while (this.controlPoints.length < count) {
        const controlPoint = createControlPoint({
          x: this.controlPoints.length * this.gap,
          y: y,
          listening: true,
          hitStrokeWidth: controlPointHitStrokeWidth,
          visible: true
        })
        controlPoint._controlPointIndex = this.controlPoints.length
        this.add(controlPoint)
        this.controlPoints.push(controlPoint)
      }
    }
  }
}
export default LineBaseComponent
