import konva from 'konva'
import ThemeConfig from '../theme/themeConfig'
import SvgComponent from './base/SvgComponent'

const openPathData = 'M26.47 14.44 L23.07 19.93 23.07 27.38 25.83 29.84 19.2 29.84 21.89 27.36 21.89 19.72 15.69 10.95 19.62 10.95 21.48 9.19 18.18 4.17 14.73 3.14 15.15 -0.03 9.92 4.17 2.83 17.38 7.78 28.12 5.51 30.53 5.51 31.97 9.26 31.97 10.18 31.48 10.93 31.97 29.94 31.97 29.94 30.25 25.68 25.99 25.68 20.55 27.96 16.84 28.78 16.84 29.2 20.08 30.4 20.08 30.71 14.44 26.47 14.44 Z'
class LogoCat extends SvgComponent {
  static scientificName = '猫'
  // 组件名称
  _componentName = 'LogoCat'
  constructor (config = {}) {
    if (config.attrs) {
      delete config.attrs.width
      delete config.attrs.height
    }
    super(config, {
      openPathData
    })
  }
  createShapes () {
    return new konva.Path({
      width: this.width(),
      height: this.height(),
      fill: ThemeConfig.fill,
      strokeWidth: 1,
      perfectDrawEnabled: false,
      data: this.getPathData()
    })
  }
  createControlPoints () {
    const w = this.width()
    // const h = this.height()
    return [
      {
        x: w / 2,
        y: 0
      }
    ]
  }
}
export default LogoCat
