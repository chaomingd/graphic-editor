import Vue from 'vue'
import App from './App.vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'
import MyIcon from '@/components/Icon/myIcon'

Vue.use(Antd)
Vue.component(MyIcon.name, MyIcon)
Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
