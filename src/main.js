// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import { sync } from 'vuex-router-sync'
import { createStore } from './store'
import { createRouter } from './router'
import {Button} from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
// 导出一个工厂函数，用于创建新的根实例：利用一个可重复执行的工厂函数，为每个请求创建新的应用程序实例，避免导致状态污染
// 同样的规则使用于router、store
Vue.use(Button)
export function createApp () {
  // 创建 store 和 router 实例
  const store = createStore()
  const router = createRouter()

  // 同步路由状态(route state)到 store
  sync(store, router)

  // 创建应用程序实例，将 router 和 store 注入
  const app = new Vue({
    router,
    store,
    render: h => h(App)
  })

  return { app, router, store }
}
