import themeConfig from '../theme/themeConfig'

class Store {
  textColor = themeConfig.stroke
  updateTextColor (color) {
    this.textColor = color
  }
}

export default new Store()
