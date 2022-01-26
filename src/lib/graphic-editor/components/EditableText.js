import konva from 'konva'
import ThemeConfig from '../theme/themeConfig'
import { deepMerges } from '../utils/index'
import ComponentNames from './base/ComponentNames'

class EditableText extends konva.Text {
  static isEditableText (node) {
    if (!node) return false
    return node instanceof EditableText
  }
  // 组件名称
  _componentName = 'EditableText'
  // 这三个方法是为了保持和基础元件的接口一致，防止选中或取消选中时调用对应方法出错
  setSelectionStyle () {}
  setDragStyle () {}
  resetStyle () {}
  constructor (config = {}) {
    config = deepMerges({
      fill: ThemeConfig.stroke,
      draggable: true,
      _selection: true,
      sigleLine: false,
      name: ComponentNames.EditableText
    }, config, config.attrs)
    delete config.attrs
    super(config)
    this.onDblclick = this.onDblclick.bind(this)
    this.onTransform = this.onTransform.bind(this)
    this.on('dblclick', this.onDblclick)
    this.on('transform', this.onTransform)
  }
  toObject () {
    return {
      attrs: this.getAttrs(),
      className: this.getComponentName()
    }
  }
  getComponentName () {
    return this._componentName
  }
  // 变换
  onTransform () {
    this.setAttrs({
      width: this.width() * this.scaleX(),
      scaleX: 1
    })
  }
  // 双击
  onDblclick () {
    // 隐藏textNode
    const layer = this.getLayer()
    const stage = this.getStage()
    if (!this.domContainer) {
      this.domContainer = this.getStage().getContainer()
    }
    const domContainer = this.domContainer || document.body
    const textNode = this
    const isSingleLine = this.getAttr('sigleLine')
    textNode.hide()
    layer.draw()
    stage.fire('textFocus', textNode)
    this.fire('textFocus', textNode)
    // create textarea over canvas with absolute position
    // first we need to find position for textarea
    // how to find it?

    // at first lets find position of text node relative to the stage:
    var textPosition = textNode.absolutePosition()

    // then lets find position of stage container on the page:
    var stageBox = stage.container().getBoundingClientRect()

    // so position of textarea will be the sum of positions above:
    var areaPosition = {
      x: stageBox.left + textPosition.x,
      y: stageBox.top + textPosition.y
    }
    // 挂载节点如果不是body，修复位置
    if (domContainer !== document.body) {
      const domContainerBox = domContainer.getBoundingClientRect()
      areaPosition.x -= domContainerBox.left
      areaPosition.y -= domContainerBox.top
    }

    // create textarea and style it
    var textarea = document.createElement(isSingleLine ? 'input' : 'textarea')
    domContainer.appendChild(textarea)

    // apply many styles to match text on canvas as close as possible
    // remember that text rendering on canvas and on the textarea can be different
    // and sometimes it is hard to make it 100% the same. But we will try...
    const height = textNode.height() - textNode.padding() * 2
    textarea.value = textNode.text()
    textarea.style.position = 'absolute'
    textarea.style.top = areaPosition.y + 'px'
    textarea.style.left = areaPosition.x + 'px'
    textarea.style.width = textNode.width() - textNode.padding() * 2 + 'px'
    textarea.style.height = height + 'px'
    textarea.style.fontSize = textNode.fontSize() + 'px'
    textarea.style.border = 'none'
    textarea.style.padding = '0px'
    textarea.style.margin = '0px'
    textarea.style.overflow = 'hidden'
    textarea.style.background = 'none'
    textarea.style.outline = 'none'
    textarea.style.resize = 'none'
    textarea.style.lineHeight = textNode.lineHeight() * textNode.fontSize() + 'px'
    textarea.style.fontFamily = textNode.fontFamily()
    textarea.style.transformOrigin = 'left top'
    textarea.style.textAlign = textNode.align()
    textarea.style.color = textNode.fill()
    textarea.style.zIndex = '9999'
    var rotation = textNode.rotation()
    var scale = textNode.getAbsoluteScale().x
    var transform = ''
    if (scale !== 1) {
      transform += `scale(${scale}, ${scale})`
    }
    if (rotation) {
      transform += 'rotateZ(' + rotation + 'deg)'
    }
    var px = 0
    // also we need to slightly move textarea on firefox
    // because it jumps a bit
    var isFirefox =
      navigator.userAgent.toLowerCase().indexOf('firefox') > -1
    if (isFirefox) {
      px += 2 + Math.round(textNode.fontSize() / 20)
    }
    transform += 'translateY(-' + px + 'px)'

    textarea.style.transform = transform

    // reset height
    // textarea.style.height = 'auto'
    // after browsers resized it we can set actual value
    textarea.style.height = textarea.scrollHeight + 3 + 'px'

    textarea.focus()

    function removeTextarea () {
      textarea.parentNode.removeChild(textarea)
      window.removeEventListener('mousedown', handleOutsideClick)
      textNode.show()
      stage.fire('textBlur', textNode)
      textNode.fire('textBlur', textNode)
      layer.draw()
    }

    textarea.addEventListener('keydown', function (e) {
      // hide on enter
      // but don't hide on shift + enter
      if (e.keyCode === 13 && !e.shiftKey) {
        textNode.text(textarea.value)
        removeTextarea()
      }
      // on esc do not set value back to node
      if (e.keyCode === 27) {
        removeTextarea()
      }
    })

    !isSingleLine && textarea.addEventListener('keydown', function () {
      textarea.style.height = 'auto'
      textarea.style.height =
        textarea.scrollHeight + textNode.fontSize() + 'px'
    })

    function handleOutsideClick (e) {
      if (e.target !== textarea) {
        textNode.text(textarea.value)
        removeTextarea()
      }
    }

    setTimeout(() => {
      window.addEventListener('mousedown', handleOutsideClick)
    })
  }
}

export default EditableText
