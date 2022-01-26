
<template>
  <my-icon v-bind="$attrs" v-on="$listeners" :type="type"/>
</template>

<script>
import { Icon } from 'ant-design-vue'
const MyIcon = Icon.createFromIconfontCN({
  scriptUrl: require('@/assets/iconfont/iconfont')
})
export default {
  inheritAttrs: false,
  name: 'MyIcon',
  components: {
    'my-icon': MyIcon
  },
  props: {
    type: {
      type: String,
      default: ''
    }
  }
}
</script>

<style scoped>

</style>
