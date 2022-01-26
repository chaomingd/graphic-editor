import konva from 'konva'
import ThemeConfig from '../theme/themeConfig'
import SvgComponent from './base/SvgComponent'

const openPathData = 'M16,32A16,16,0,0,1,2.17,8h0a16.16,16.16,0,0,1,1.33-2h0A16,16,0,1,1,16,32ZM30,16a13.85,13.85,0,0,0-.16-1.85A13.5,13.5,0,0,0,28,14a13.86,13.86,0,0,0-6.23,1.52,24,24,0,0,1,4.64,9.75A13.89,13.89,0,0,0,30,16ZM24.7,26.91A22.32,22.32,0,0,0,20.06,16.5,14,14,0,0,0,14,28a13.6,13.6,0,0,0,.15,1.84A13.8,13.8,0,0,0,16,30,13.87,13.87,0,0,0,24.7,26.91ZM12.11,29.4c0-.46-0.09-0.93-0.09-1.4a16,16,0,0,1,6.72-13A22.78,22.78,0,0,0,17,13.33,16,16,0,0,1,4,20c-0.47,0-.92,0-1.38-0.09A14,14,0,0,0,12.11,29.4ZM4.47,8.09A13.92,13.92,0,0,0,2,16a13.77,13.77,0,0,0,.19,1.86A13.52,13.52,0,0,0,4,18a14,14,0,0,0,11.39-5.91A22.31,22.31,0,0,0,4.47,8.09Zm13.4-5.91A13.84,13.84,0,0,0,16,2,13.94,13.94,0,0,0,6,6.28a24.37,24.37,0,0,1,10.45,4.09A13.85,13.85,0,0,0,18,4,13.64,13.64,0,0,0,17.88,2.19Zm2.06,0.44C20,3.08,20,3.53,20,4a15.93,15.93,0,0,1-2,7.68,25.06,25.06,0,0,1,2.36,2.24A15.92,15.92,0,0,1,28,12c0.47,0,.94,0,1.4.09A14,14,0,0,0,19.93,2.62Z'
class NoActivity extends SvgComponent {
  static scientificName = '终端'
  // 组件名称
  _componentName = 'NoActivity'
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
        y: 0
      },
      {
        x: w, 
        y: h / 2
      },
      {
        x: w / 2, 
        y: h
      },
      {
        x: 0,
        y: h / 2
      },
    ]
  }
}
export default NoActivity
