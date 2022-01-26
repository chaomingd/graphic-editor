import BaseComponent from './BaseComponent'

class SvgComponent extends BaseComponent {
  constructor (config, { openPathData, closePathData } = {}) {
    super(config, {
      openPathData,
      closePathData,
      pathShape: true
    })
  }
  statusChange (open) {
    if (this._extraData.closePathData) {
      this.shapes[0].setAttr('data', this.getPathData(open))
    }
  }
  getPathData (open) {
    if (open !== undefined) {
      return open ? this._extraData.openPathData : (this._extraData.closePathData || this._extraData.openPathData)
    }
    const store = this.getAttr('store')
    if (store) {
      return store.open ? this._extraData.openPathData : (this._extraData.closePathData || this._extraData.openPathData)
    }
  }
}

export default SvgComponent
