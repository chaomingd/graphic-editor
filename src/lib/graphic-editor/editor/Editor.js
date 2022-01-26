import konva from 'konva'
import EventEmitter from '../utils/EventEmitter'
import { registerDropInteraction } from '../interaction/dropInteraction.js'
import { registerAdsorbentInteraction } from '../interaction/adsorbentInteraction.js'
import { registerHistoryInteraction } from '../interaction/historyInteraction.js'
import { registerTextInteraction } from '../interaction/textInteraction.js'
import { registerSelectionInteraction } from '../interaction/selectionInteraction.js'
import { registerContextMenuInteraction } from '../interaction/contextMenuInteraction.js'
import { registerLineStretchingInteraction } from '../interaction/lineStretchingInteraction.js'
import { registerZoomInteraction, zoomToPoint } from '../interaction/zoomInteraction.js'
import { regiterSnappingInteraction } from '../interaction/snappingInteraction'
import { registerCursorInteraction } from '../interaction/cursorInteraction'
import { registerShortCutKeyInteractin } from '../interaction/shortcutKeyInteraction'
import Command from '../interaction/Command'
import { isWiringDiagramNode, createNodesByJSON } from '../utils/nodeUtils'
import {
  HistoryStore
} from '../interaction/HistoryStore'
import {
  SelectionStore
} from '../interaction/selectionStore'
import ComponentNames from '../components/base/ComponentNames'
import EditableText from '../components/EditableText'
import CursorManager from '../interaction/CursorManager'
import SelectionBox from '../components/SelectionBox'
import componentStore from '../store/index'
import themeConfig from '../theme/themeConfig'

class Editor extends EventEmitter {
  constructor (config = {}) {
    super()
    if (!config.stage) throw new Error('stage config must be provided')
    this.layout = {
      padding: [30, 30],
      width: config.stage.width || 0,
      height: config.stage.height || 0
    }
    this.config = config
    this.stage = new konva.Stage(config.stage)
    // 文字变换器
    this.textTransformer = new konva.Transformer({
      enabledAnchors: ['middle-left', 'middle-right'],
      rotationSnaps: [0, 90, 180, 270],
      visible: false,
      borderStroke: themeConfig.primaryColor,
      anchorStroke: themeConfig.primaryColor,
      boundBoxFunc: function (_, newBox) {
        newBox.width = Math.max(30, newBox.width)
        return newBox
      }
    })
    this.layer = new konva.Layer()
    this.layer.add(this.textTransformer)
    this.stage.add(this.layer)
    // 顶层layer 处理临时图形提升性能
    this.upperLayer = new konva.Layer()
    this.stage.add(this.upperLayer)
    // 历史记录
    this.historyStore = new HistoryStore()
    // 选中
    this.selectionStore = new SelectionStore()
    // 命令
    this.command = new Command({
      editor: this
    })
    // 鼠标手型管理
    this.cursorManager = new CursorManager({ el: this.stage.getContainer() })
    // 选框
    this.selectionBox = new SelectionBox({
      visible: false
    })
    this.upperLayer.add(this.selectionBox)
    this.interactions = []
    this.initEditor(config.initJSON)
  }
  isEditableText (node) {
    if (!node) return false
    return node instanceof EditableText
  }
  // 注册自定义的命令, 扩展
  registerCommand (config) {
    this.command.registerCommand(config)
  }
  // 取消注册自定义的命令
  unRegisterCommand (config) {
    this.command.unRegisterCommand(config)
  }
  getComponentNames () {
    return { ...ComponentNames }
  }
  // 调整尺寸
  resize ({ width, height }, shouldLayout) {
    console.log(width, height)
    this.stage.width(width)
    this.stage.height(height)
    if (shouldLayout) {
      this.initLayout()
    }
  }
  // 清空画布
  reset () {
    this.historyStore._canPushHistory = false
    const shouldDestoryNodes = []
    this.layer.children.forEach(node => {
      if (isWiringDiagramNode(node)) {
        shouldDestoryNodes.push(node)
      }
    })
    shouldDestoryNodes.forEach(node => {
      node.destroy()
    })
    this.historyStore._canPushHistory = true
    this.historyStore.clear()
  }
  // 历史操作
  go (n) {
    this.historyStore.go(n)
  }
  // 销毁，释放资源
  destroy () {
    this.historyStore.destroy()
    this.historyStore = null
    this.interactions.forEach(unInteraction => {
      if (unInteraction) {
        unInteraction.destroy()
      }
    })
    this.stage.destroy()
  }
  // 重置历史
  resetHistory () {
    this.historyStore.clear()
  }
  // 根据json更新舞台
  updateStageWithJSON (jsonObject) {
    this.historyStore.noHistoryWrapper(() => {
      const shouldDestoryNodes = []
      this.layer.children.forEach(node => {
        if (isWiringDiagramNode(node)) {
          shouldDestoryNodes.push(node)
        }
      })
      shouldDestoryNodes.forEach(node => {
        node.destroy()
      })
      this.textTransformer.hide()
      try {
        const nodes = createNodesByJSON(jsonObject)
        if (nodes.length) {
          this.layer.add(...nodes)
        }
        this.initLayout()
      } catch (e) {
        console.log(e)
      }
    })
  }
  // 初始化编辑器
  initEditor () {
    this.initInteraction()
  }
  // 初始化布局， 计算出画布所有元素的最小包围矩形，并将其放置到左上角 this.layout.padding的 位置
  initLayout () {
    this.stage.scale({
      x: 1,
      y: 1
    })
    this.stage.position({
      x: 0,
      y: 0
    })
    const layerClientRect = this.layer.getClientRect()
    const stagePosition = {
      x: (layerClientRect.x - this.layout.padding[0]) * -1,
      y: (layerClientRect.y - this.layout.padding[1]) * -1
    }
    const stageWidth = this.stage.width()
    const stageHeight = this.stage.height()
    const stageRatio = stageHeight / stageWidth
    const layerRatio = layerClientRect.height / layerClientRect.width
    let scale
    if (layerRatio > stageRatio) {
      scale = (stageHeight - this.layout.padding[1] * 2) / layerClientRect.height
    } else {
      scale = (stageWidth - this.layout.padding[0] * 2) / layerClientRect.width
    }
    this.stage.position(stagePosition)
    if (scale < 1) {
      zoomToPoint(this.stage, { x: this.layout.padding[0], y: this.layout.padding[1] }, 1, scale)
    }
  }
  // 导出图片
  toDataURL (config = {}) {
    this.command.selectElement(null)
    return this.layer.toDataURL({
      pixelRatio: 2,
      mimeType: 'image/jpeg',
      ...config
    })
  }
  canExportJSON (node) {
    return isWiringDiagramNode(node)
  }
  // 导出系列化数据
  toObject () {
    const jsonObjects = []
    this.layer.children.forEach(child => {
      if (this.canExportJSON(child)) {
        jsonObjects.push(child.toObject())
      }
    })
    return jsonObjects
  }
  getTextColor () {
    return componentStore.textColor
  }
  // 初始化交互
  initInteraction () {
    // 缩放
    this.interactions.push(registerZoomInteraction({
      stage: this.stage,
      zoomBy: 1.05
    }))
    // 拖放创建元件
    this.interactions.push(registerDropInteraction({
      stage: this.stage,
      layer: this.layer,
      selectionStore: this.selectionStore,
      command: this.command
    }))
    // 吸附元件
    this.interactions.push(registerAdsorbentInteraction({
      stage: this.stage,
      layer: this.layer,
      historyStore: this.historyStore,
      selectionStore: this.selectionStore,
      upperLayer: this.upperLayer
    }))
    // 组件边沿吸附
    this.interactions.push(regiterSnappingInteraction({
      stage: this.stage,
      layer: this.layer,
      upperLayer: this.upperLayer,
      historyStore: this.historyStore
    }))
    // 历史记录
    this.interactions.push(registerHistoryInteraction({ stage: this.stage, layer: this.layer, historyStore: this.historyStore }))
    // 文字编辑
    this.interactions.push(registerTextInteraction({
      Editor: this,
      stage: this.stage,
      layer: this.layer,
      selectionStore: this.selectionStore,
      transformer: this.textTransformer,
      command: this.command
    }))
    // 选择
    this.interactions.push(registerSelectionInteraction({
      stage: this.stage,
      layer: this.layer,
      selectionStore: this.selectionStore,
      command: this.command,
      historyStore: this.historyStore,
      selectionBox: this.selectionBox,
      cursorManager: this.cursorManager
    }))
    // 右键菜单
    this.interactions.push(registerContextMenuInteraction({
      container: this.stage.getContainer(),
      stage: this.stage,
      layer: this.layer,
      selectionStore: this.selectionStore,
      command: this.command
    }))
    // 线组件拉伸
    this.interactions.push(registerLineStretchingInteraction({
      stage: this.stage,
      layer: this.layer,
      historyStore: this.historyStore,
      cursorManager: this.cursorManager
    }))
    // 鼠标手型
    this.interactions.push(registerCursorInteraction({
      stage: this.stage,
      layer: this.layer,
      cursorManager: this.cursorManager,
      selectionStore: this.selectionStore,
      selectionBox: this.selectionBox
    }))
    // 快捷键
    this.interactions.push(registerShortCutKeyInteractin({
      stage: this.stage,
      historyStore: this.historyStore,
      command: this.command
    }))
  }
  // 创建文字
  createText (textConfig) {
    this.fire('createText', textConfig)
  }
  // 更新文字
  updateText (textConfig) {
    this.fire('updateText', textConfig)
  }
}

export {
  Editor
}
