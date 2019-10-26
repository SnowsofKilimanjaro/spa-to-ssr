import { createApp } from './main.js'
import Vue from 'vue'
const { app, store, router } = createApp()
// 服务器在收到第一次请求后就已经把所有代码给了客户端，客户端的路由切换，
// 服务端并不会收到请求，所以对应组件的 asyncData 方法并不会被执行。
// 这里的解决方法就是注册全局mixin.
// 全局mixin，beforeRouteUpdate，切换路由时，
// 调用asyncData方法拉取数据进行客户端渲染
Vue.mixin({
  beforeRouteUpdate (to, from, next) { // 路由改变时执行组件的asyncData ，asyncData 接受两个参数store和当前路由信息，asyncData 函数会在组件实例化之前调用
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
// 将服务端渲染的vuex数据，替换到客户端的vuex ，
// 服务端把要给客户端的 state 放在了 window.INITIAL_STATE 这个全局变量上面。
// 前后端的 HTML 结构应该是一致的。然后要把 store 的状态树写入一个全局变量（INITIAL_STATE），
// 这样客户端初始化 render 的时候能够校验服务器生成的 HTML 结构，并且同步到初始化状态，然后整个页面被客户端接管。

if (window.__INITIAL_STATE__) {
  store.replaceState(window.__INITIAL_STATE__)
}
// 等到 router 将可能的异步组件和钩子函数解析完
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
