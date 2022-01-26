<style lang="less">
@import "../theme.less";
@import "../mixin.less";
@import "./menu.less";
.graphic-editor-menu {
  .graphic-icon-box {
    margin: -5px 0;
    padding: 10px 0;
  }
  .graphic-icon-item {
    display: inline-block;
    vertical-align: top;
    flex: 0 0 auto;
    width: 25%;
    cursor: move;
    padding: 5px 0;
  }
  .graphic-icon {
    width: 46px;
    height: 46px;
    display: flex;
    font-size: 40px;
    justify-content: center;
    align-items: center;
    color: @storke-color;
    margin: 0 auto;
    background: @editor-basic-icon-bg;
    border-radius: 4px;
  }
  .graphic-shape {
    color: @editor-basic-shape-text-color;
    font-size: 12px;
    letter-spacing: 0.45px;
    text-align: center;
  }
}
</style>
<template>
  <div class="graphic-editor-menu">
    <div class="graphic-icon-box">
      <div
        v-for="graphicItem in graphics"
        draggable
        :key="graphicItem.type"
        @dragstart="handleDragstart($event, graphicItem.type)"
        class="graphic-icon-item"
      >
        <div class="graphic-icon">
          <my-icon :type="graphicItem.icon" />
        </div>
        <div class="graphic-shape">
          {{ graphicItem.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getGraphics } from "@/lib/graphic-editor/editor/graphics";
export default {
  inject: ["editorComponent"],
  data() {
    return {
      graphics: getGraphics(true),
    };
  },
  methods: {
    handleDragstart(e, componentName) {
      const ComponentNames = this.editorComponent
        .getEditor()
        .getComponentNames();
      e.dataTransfer.setData(
        "text",
        JSON.stringify({
          name: componentName,
          type: ComponentNames.BaseComponent,
        })
      );
    },
  },
};
</script>
