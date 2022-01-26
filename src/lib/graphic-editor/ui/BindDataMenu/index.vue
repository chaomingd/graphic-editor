<style lang="less">
@import '../style/animate.less';
@import '../../theme/color.less';
.bind-data-menu {
  position: absolute;
  min-width: 100px;
  background-color: #fff;
  box-shadow: 0px 2px 6px 0px #E3E6ED;
  border-radius: 2px;
  .bind-data-menu-item {
    padding: 7px 16px;
    line-height: 1;
    color: @bind-data-color;
    letter-spacing: 0.05em;
    white-space: nowrap;
    &::before {
      position: relative;
      top: -2px;
      content: '';
      display: inline-block;
      width: 6px;
      height: 6px;
      margin-right: 8px;
      border-radius: 50%;
      background-color: @bind-data-color;
    }
  }
}
</style>
<template>
  <transition name="wiring-diagram-slide-down">
    <div v-show="show" class="bind-data-menu">
      <div v-for="item in menuDatas" :key="item.id" class="bind-data-menu-item">{{ item.name }}</div>
    </div>
  </transition>
</template>

<script>
export default {
  data () {
    return {
      show: false,
      menuDatas: []
    }
  },
  methods: {
    open (data) {
      this.show = true
      this.menuDatas = data || []
    },
    hide () {
      this.show = false
    }
  }
}
</script>
