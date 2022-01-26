<style lang="less">
@import './theme.less';
.graphic-editor {
  background-color: @editor-bg;
  height: 100%;
  .ant-spin-container {
    height: 100%;
  }
  .graphic-editor-content {
    display: flex;
    height: calc(100% - 56px);
  }
  .graphic-editor-main {
    flex: 1;
    height: 100%;
    padding: 25px 36px;
  }
  .graphic-editor-el {
    position: relative;
    width: 100%;
    height: 100%;
    box-shadow: 0px 0px 18px 0px #E3E8F1;
  }
  .konva-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
}
</style>
<template>
  <a-spin :spinning="loading" class="graphic-editor">
    <EditorHeader
      v-on="$listeners"
      @undo="handleUndo"
      @redo="handleRedo"
      @createText="handleCreateText"
      @updateText="handleUpdateText"
    />
    <div class="graphic-editor-content">
      <EditorSider :facility="facility" />
      <div class="graphic-editor-main">
        <div
          :style="{
            backgroundColor: bgColor
          }"
          ref="konvaRectEl"
          class="graphic-editor-el"
        >
          <div ref="konvaContainer" class="konva-container"></div>
        </div>
      </div>
    </div>
  </a-spin>
</template>

<script>
import EditorHeader from './components/EditorHeader.vue'
import EditorSider from './components/EditorSider.vue'
import { Editor } from '@/lib/graphic-editor/editor/Editor'

export default {
  components: {
    EditorHeader,
    EditorSider
  },
  props: {
    facility: {
      type: String
    },
    wiringGraphData: {
      type: Object,
      default () {
        return {}
      }
    }
  },
  provide () {
    return {
      editorComponent: this
    }
  },
  data () {
    return {
      showComponentEditor: false,
      componentJSON: '',
      bgColor: '#fff',
      loading: false
    }
  },
  watch: {
    wiringGraphData (v) {
      this.updateWiringGraph(v)
    }
  },
  beforeDestroy () {
    if (this.initTimer) {
      clearTimeout(this.initTimer)
    }
    this.wriringDiagramEditor && this.wriringDiagramEditor.destroy()
  },
  mounted () {
    this.initEditor()
    this.__mounted__ = true
    // 是否已保存
    this.isSaved = true
    // 是否编辑过
    this.isEdit = false
  },
  methods: {
    resize (shouldLayout) {
      if (this.wriringDiagramEditor) {
        const rect = this.$refs.konvaRectEl.getBoundingClientRect()
        this.wriringDiagramEditor.resize({
          width: rect.width,
          height: rect.height
        }, shouldLayout)
      }
    },
    // 初始化编辑器
    initEditor () {
      this.initTimer = setTimeout(() => {
        const rect = this.$refs.konvaRectEl.getBoundingClientRect()
        this.wriringDiagramEditor = new Editor({
          initJSON: this.wiringGraphData.content,
          stage: {
            container: this.$refs.konvaContainer,
            width: rect.width,
            height: rect.height
          }
        })
        this.initTimer = undefined
      }, 300)
    },
    // 生成了新的历史
    onHistoryCreated () {
      this.isSaved = false
      this.isEdit = true
    },
    // 更新舞台
    updateWiringGraph (wiringGraphData) {
      if (this.wriringDiagramEditor && this.__mounted__) {
        this.wriringDiagramEditor.updateStageWithJSON(wiringGraphData.content)
      }
    },
    reset () {
      this.wriringDiagramEditor.reset()
    },
    // 绑定数据到选择的接线图节点中
    handleBindData (shapes, datas) {
      this.wriringDiagramEditor.command.bindData(shapes, datas)
    },
    // 绑定数据操作
    bindData (_, targets) {
      let data
      if (targets.length > 1) {
        // 多选时表示未绑定数据
        data = {}
      } else {
        data = targets[0].getAttrs().store.data || {}
      }
      this.$refs.bindDataModal.edit({
        ...data,
        shapes: targets
      }, '绑定数据')
    },
    // 解绑数据操作
    unBindData (_, targets) {
      this.wriringDiagramEditor.command.unBindData(targets)
    },
    // 打开组件编辑弹框
    handleComponentEdit (_, targets) {
      this.componentJSON = this.getComponentJSON(targets[0].toObject())
      this.showComponentEditor = true
    },
    // 关闭组件编辑弹框
    handleCloseComponentEditModal () {
      this.showComponentEditor = false
    },
    // 保存组件编辑
    handleSaveComponentEdit () {
      this.showComponentEditor = false
      // 更新组件
      this.wriringDiagramEditor.command.exec('updateComponentGroup', this.$refs.componentEditor.toObject().children[1])
    },
    // 获取组件json
    getComponentJSON (jsonObject) {
      if (jsonObject) {
        return (jsonObject.children && jsonObject.children[1]) || {}
      }
      return jsonObject
    },
    // 导出jpeg的base64
    toDataURL (config = {}) {
      return this.wriringDiagramEditor.toDataURL(config)
    },
    // 导出object
    toObject () {
      return this.wriringDiagramEditor.toObject()
    },
    // 获取编辑器实例
    getEditor () {
      return this.wriringDiagramEditor
    },
    // 撤销
    handleUndo () {
      this.wriringDiagramEditor.go(-1)
    },
    // 重置
    handleRedo () {
      this.wriringDiagramEditor.go(1)
    },
    // 编辑文本
    handleCreateText (fontSize) {
      this.wriringDiagramEditor.createText({ fontSize, text: 'some text', width: 200, x: 30, y: 10 })
    },
    // 更新文本 尺寸
    handleUpdateText (config) {
      this.wriringDiagramEditor.updateText(config)
    }
  }
}
</script>
