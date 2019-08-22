const express = require('express')
const app = express()

const fs = require('fs')
const path = require('path')
const { createBundleRenderer } = require('vue-server-renderer')
const isProd = process.env.NODE_ENV === 'production'
const resolve = file => path.resolve(__dirname, file)

// 生成服务端渲染函数
// 服务端渲染相关配置
function createRenderer (bundle, options) {
    // https://github.com/vuejs/vue/blob/dev/packages/vue-server-renderer/README.md#why-use-bundlerenderer
    return createBundleRenderer(bundle, Object.assign(options, {
      // 把路径解析为绝对路径
      basedir: resolve('./dist'),
      // runInNewContext: true(默认)  对于每次渲染，bundle renderer 将创建一个新的 V8 上下文并重新执行整个 bundle
      // 优点：无需担心状态单例问题；缺点：性能开销大
      runInNewContext: false
    }))
  }
// const renderer = createBundleRenderer(require('./dist/vue-ssr-server-bundle.json'), {
//   // 模板html文件
//   template: fs.readFileSync(resolve('./index.html'), 'utf-8'),
//   // client manifest
//   clientManifest: require('./dist/vue-ssr-client-manifest.json')
// })
let renderer
let readyPromise
const templatePath = resolve('./index.html')
if(isProd){
 // 读取html模板
 const template = fs.readFileSync(templatePath, 'utf-8')
 // bundle 为服务端渲染入口
 const bundle = require('./dist/vue-ssr-server-bundle.json')
 // clientManifest 为客户端渲染入口
 const clientManifest = require('./dist/vue-ssr-client-manifest.json')
 renderer = createRenderer(bundle, {
   template,
   clientManifest
 })
}else{
     // 开发环境：使用 setup-dev-server.js  并且有监听和热重载功能
  readyPromise = require('./build/setup-dev-server')(
    app,
    templatePath,
    (bundle, options) => {
      renderer = createRenderer(bundle, options)
    }
  )

}
// function renderToString (context) {
//   return new Promise((resolve, reject) => {
//     renderer.renderToString(context, (err, html) => {
//       err ? reject(err) : resolve(html)
//     })
//   })
// }
// app.use(express.static('./dist'))

// app.use(async(req, res, next) => {
//   try {
//     const context = {
//       title: '服务端渲染测试', // {{title}}
//       url: req.url
//     }
//     // 设置请求头
//     res.set('Content-Type', 'text/html')
//     const render = await renderToString(context)
//     // 将服务器端渲染好的html返回给客户端
//     res.end(render)
//   } catch (e) {
//     console.log(e)
//     // 如果没找到，放过请求，继续运行后面的中间件
//     next()
//   }
// })
function render (req, res) {
    const s = Date.now()
  
    res.setHeader("Content-Type", "text/html")  
    const handleError = err => {
      if (err.url) {
        res.redirect(err.url)
      } else if(err.code === 404) {
        res.status(404).send('404 | Page Not Found')
      } else {
        // Render Error Page or Redirect
        res.status(500).send('500 | Internal Server Error')
        console.error(`error during render : ${req.url}`)
        console.error(err.stack)
      }
    }
    // 模板插值显示数据，显示在 index.template.html 模板中
    const context = {
      title: '服务端渲染测试',
      url: req.url
    };
    renderer.renderToString(context, (err, html) => {
      if (err) {
        return handleError(err)
      }
      res.send(html)
      if (!isProd) {
        console.log(`whole request: ${Date.now() - s}ms`)
      }
    })
  }

app.get('*', isProd ? render : (req, res) => {
    readyPromise.then(() => render(req, res))
  })
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`server started at localhost:${port}`)
})
