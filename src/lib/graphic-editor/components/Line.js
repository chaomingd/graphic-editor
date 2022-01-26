/**
 * 导线
 * */
import LineBaseComponent from './base/LineBaseComponent'
import { deepMerges } from '../utils/index'

class Wireway extends LineBaseComponent {
  static scientificName = '导线1'
  // 组件名称
  _componentName = 'Wireway'
  constructor (config = {}) {
    config = deepMerges({
      width: 46,
      rotation: 0,
      store: {
        gap: 46
      }
    }, config, config.attrs)
    delete config.attrs
    super(config)
  }
}

export default Wireway
