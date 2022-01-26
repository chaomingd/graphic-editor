import konva from 'konva'
import ThemeConfig from '../theme/themeConfig'
import SvgComponent from './base/SvgComponent'

const openPathData = 'M13.33,30.67h5.33V28H24V22.67H18.67v-5.8a8,8,0,1,0-5.33,0v13.8ZM16,12a2.67,2.67,0,1,1,2.67-2.67A2.67,2.67,0,0,1,16,12Z'
class Password extends SvgComponent {
  static scientificName = '终端'
  // 组件名称
  _componentName = 'Password'
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
    const h = this.height()
    return [
      {
        x: w / 2,
        y: h
      }
    ]
  }
}
export default Password
