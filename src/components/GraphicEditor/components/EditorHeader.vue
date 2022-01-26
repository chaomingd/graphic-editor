<style lang="less">
@import '../theme.less';
.graphic-component-editor-header {
  position: relative;
  display: flex;
  height: 56px;
  background: @editorHeaderBg;
  border-radius: 2px 2px 0px 0px;
  border-bottom: 1px solid @editorHeader-boder-color;
  padding-left: 36px;
  padding-right: 70px;
  align-items: center;
  .icon-button {
    width: 26px;
    height: 26px;
    border: none;
    background-color: transparent;
    box-shadow: none;
    text-align: center;
    padding: 0;
    color: @editorHeader-icon-color;
    font-size: 21px;
  }
  .icon-redo {
    margin-left: 20px;
  }
  .ant-divider {
    background: @editorHeader-boder-color;
    margin: 0 29px;
  }
  .text-input {
    width: 48px;
    border-radius: 2px;
    border: 0;
  }
  .icon-gutter {
    margin-left: 25px;
  }
  .space-gutter {
    margin-left: 17px;
  }
  .graphic-color-picker {
    display: inline-block;
    width: 48px;
    height: 24px;
    background: #FFFFFF;
    border-radius: 2px;
    line-height: 24px;
    text-align: center;
    cursor: pointer;
    &.disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }
  .font-colors {
    font-size: 16px;
    margin-right: 8px;
    color: @editorHeader-icon-color;
  }
  .caret-down {
    font-size: 12px;
    color: @editorHeader-icon-bg;
  }
  .icon-iconhuabushezhi {
    background-color: @editorHeader-icon-bg;
  }
  .icon-iconguanbi {
    position: absolute;
    top: 50%;
    right: 36px;
    transform: translateY(-50%);
    background-color: @editorHeader-icon-bg;
  }
}
</style>
<template>
  <div class="graphic-component-editor-header">
    <a-tooltip title="保存" placement="bottom">
      <a-button size="small" class="icon-button icon-iconbaocun" @click="$emit('save')">
        <my-icon type="icon-save" />
      </a-button>
    </a-tooltip>
    <a-button size="small" class="icon-button icon-gutter" @click="$emit('undo')">
      <my-icon type="icon-return" />
    </a-button>
    <a-button size="small" class="icon-button icon-redo" @click="$emit('redo')">
      <my-icon type="icon-return-right" />
    </a-button>
    <a-divider type="vertical" />
    <a-button size="small" class="icon-button icon-text" @click="handleCreateText">
      <my-icon type="icon-text" />
    </a-button>
  </div>
</template>

<script>
const defaultFontSize = 15
const defaultFontColor = '#333333'
export default {
  inject: ['editorComponent'],
  data () {
    return {
      fontColor: defaultFontColor,
      fontSize: defaultFontSize,
      textDisabled: true
    }
  },
  beforeDestroy () {
    this.editorComponent.$off('onEditorInit', this.onEditorInit)
    if (this.editor) {
      this.editor.selectionStore.off('selectionChange', this.selectionChange)
    }
  },
  created () {
    this.editorComponent.$on('onEditorInit', this.onEditorInit)
  },
  methods: {
    // 编辑器的初始化回调
    onEditorInit (editor) {
      this.editor = editor
      editor.selectionStore.on('selectionChange', this.selectionChange)
    },
    // 选中文字 更新input
    selectionChange (selectedElements) {
      if (selectedElements && selectedElements.length === 1 && this.editor.isEditableText(selectedElements[0])) {
        const textNode = selectedElements[0]
        this.fontSize = textNode.getAttr('fontSize')
        this.fontColor = textNode.getAttr('fill')
        this.textDisabled = false
      }
    },
    // 创建文字
    handleCreateText () {
      this.$emit('createText', this.fontSize)
    },
    // 更新文字字体大小
    handleChange () {
      this.$emit('updateText', {
        fontSize: this.fontSize
      })
    },
    // 更新文字颜色
    handleColorChange (color) {
      this.$emit('updateText', {
        fill: color
      })
    }
  }
}
</script>
