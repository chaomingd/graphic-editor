<style lang="less">
@import '../theme.less';
@import '../mixin.less';
.graphic-editor-sider {
  flex: 0 0 auto;
  width: 270px;
  height: 100%;
  overflow: auto;
  .scroll-bar();
  .ant-tabs,
  .ant-tabs-content {
    height: 100%;
  }
  .ant-tabs-tabpane {
    max-height: calc(100% - 44px);
    overflow: auto;
    .scroll-bar();
  }
  background-color: #fff;
  .graphic-editor-tabs {
    .ant-tabs-bar {
      margin: 0;
      border-bottom-color: @editorHeader-boder-color;
    }
  }
}
</style>
<template>
  <div class="graphic-editor-sider">
    <BasicComponentMenu />
  </div>
</template>

<script>
import BasicComponentMenu from './BasicComponentMenu.vue'
export default {
  components: {
    BasicComponentMenu
  }
}
</script>

