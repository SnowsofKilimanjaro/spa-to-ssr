import { createApp } from './main.js'
import Vue from 'vue'
const { app, store, router } = createApp()
Vue.mixin({
  beforeRouteUpdate (to, from, next) {
    const { asyncData } = this.$options
    if (asyncData) {
      asyncData({
        store: this.$store,
        route: to
      }).then(next).catch(next)
    } else {
      next()
    }
  }
})
// 将服务端渲染的vuex数据，替换到客户端的vuex ，服务端把要给客户端的 state 放在了 window.INITIAL_STATE 这个全局变量上面。前后端的 HTML 结构应该是一致的。然后要把 store 的状态树写入一个全局变量（INITIAL_STATE），这样客户端初始化 render 的时候能够校验服务器生成的 HTML 结构，并且同步到初始化状态，然后整个页面被客户端接管。

if (window.__INITIAL_STATE__) {
  store.replaceState(window.__INITIAL_STATE__)
}
router.onReady(() => {
  // 注册钩子，客户端每次路由切换都会执行一次 显示loading 啥的
  // 注册钩子，客户端每次路由切换都会执行一次
  router.beforeResolve((to, from, next) => {
    const matched = router.getMatchedComponents(to)
    const prevMatched = router.getMatchedComponents(from)

    // 我们只关心非预渲染的组件
    // 所以我们对比它们，找出两个匹配列表的差异组件
    let diffed = false
    const activated = matched.filter((c, i) => {
      return diffed || (diffed = (prevMatched[i] !== c))
    })
    const asyncDataHooks = activated.map(c => c.asyncData).filter(_ => _)
    if (!asyncDataHooks.length) {
      return next()
    }

    Promise.all(asyncDataHooks.map(hook => hook({ store, route: to })))
      .then(() => {
        next()
      })
      .catch(next)
  })
  app.$mount('#app')
})
