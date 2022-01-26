<style lang="less">
@import '../../theme/color.less';
.wiring-context-menu {
  position: absolute;
  top: 0;
  left: 0;
  width: 102px;
  background: @wiring-context-menu-bg;
  box-shadow: 0px 2px 6px 0px rgba(116, 121, 131, 0.3);
  border-radius: 2px;
  color: @color;
  .ant-menu-vertical > .ant-menu-item, .ant-menu-vertical-left > .ant-menu-item, .ant-menu-vertical-right > .ant-menu-item, .ant-menu-inline > .ant-menu-item, .ant-menu-vertical > .ant-menu-submenu > .ant-menu-submenu-title, .ant-menu-vertical-left > .ant-menu-submenu > .ant-menu-submenu-title, .ant-menu-vertical-right > .ant-menu-submenu > .ant-menu-submenu-title, .ant-menu-inline > .ant-menu-submenu > .ant-menu-submenu-title {
    height: 21px;
    line-height: 21px;
    font-size: 12px;
    color: @color;
  }
  .ant-menu-item-active,
  .ant-menu-submenu-selected > .ant-menu-submenu-title {
    background-color: fade(@primary-color, 20%);
  }
}
.wiring-sub-menu {
  .ant-menu-item,
  .ant-menu-submenu-title {
    height: 21px;
    line-height: 21px;
    font-size: 12px;
    color: @color;
  }
  .ant-menu-item-active,
  .ant-menu-submenu-selected > .ant-menu-submenu-title {
    background-color: fade(@primary-color, 20%);
  }
  .ant-menu-vertical.ant-menu-sub, .ant-menu-vertical-left.ant-menu-sub, .ant-menu-vertical-right.ant-menu-sub {
    min-width: 102px;
  }
}
.wiring-context-menu-item {
  position: relative;
  padding: 4px 0;
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 16px;
    right: 16px;
    border-bottom: 1px solid #E3E8F1;
  }
}
.wiring-context-menu-item-wrapper {
  padding-left: 16px;
  padding-right: 10px;
  background-color: #fff;
  transition: background-color 0.3s;
  height: 21px;
  line-height: 21px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  &:hover {
    background-color: fade(#13C2C2, 20%);
  }
}
</style>
<template>
  <div v-show="show" class="wiring-context-menu">
    <a-menu :selectedKeys="selectedKeys" style="width: 102px" mode="vertical" @click="handleClick">
      <template v-for="item in menuDatas">
        <a-sub-menu popupClassName="wiring-sub-menu" :title="item.actionName" v-if="item.children" :key="item.action">
          <a-menu-item v-for="child in item.children" :key="child.action" :disabled="item.disabled">
            {{ child.actionName }}
          </a-menu-item>
        </a-sub-menu>
        <a-menu-item v-else :key="item.action" :disabled="item.disabled">
          {{ item.actionName }}
        </a-menu-item>
      </template>
    </a-menu>
  </div>
</template>

<script>
export default {
  data () {
    return {
      show: false,
      menuDatas: [],
      // 始终为数组， 无需选中状态
      selectedKeys: []
    }
  },
  methods: {
    updatePosition (top, left) {
      this.$el.style.cssText += `top: ${top}px; left: ${left}px`
    },
    updateMenu (menuDatas) {
      this.updateMenuMap(menuDatas)
      this.menuDatas = menuDatas
    },
    updateMenuMap (menuDatas) {
      this.menuMap = {}
      const _this = this
      function walk (menuDatas) {
        menuDatas.forEach(item => {
          _this.menuMap[item.action] = item
          if (item.children) {
            walk(item.children)
          }
        })
      }
      walk(menuDatas)
    },
    handleClick (item) {
      this.$emit('menuClick', this.menuMap[item.key])
    }
  }
}
</script>
