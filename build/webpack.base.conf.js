'use strict'
const path = require('path')
const utils = require('./utils')
const config = require('../config')
// CSS 提取应该只用于生产环境
// 这样我们在开发过程中仍然可以热重载
const isProd = process.env.NODE_ENV === 'production'
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HappyPack = require('happypack')
const os = require('os')
const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length })
const PurifyCSS = require('purifycss-webpack')
const glob = require('glob-all')
function resolve(dir) {
  return path.join(__dirname, '..', dir)
}
const webpackConfig = {
  context: path.resolve(__dirname, '../'),
  entry: {
    app: './src/entry-client.js' // <-修改入口文件改为
  },
  output: {
    path: config.build.assetsRoot,
    filename: '[name].js',
    publicPath:
      process.env.NODE_ENV === 'production'
        ? config.build.assetsPublicPath
        : config.dev.assetsPublicPath
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      vue$: 'vue/dist/vue.esm.js',
      '@': resolve('src')
    }
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.js$/,
        loader: 'happypack/loader?id=happyBabel',
        //loader: 'babel-loader',
        include: [
          resolve('src'),
          resolve('test'),
          resolve('node_modules/webpack-dev-server/client')
        ]
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('img/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('media/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('fonts/[name].[hash:7].[ext]')
        }
      },
      {
        //下面这段是vue2.0需要的scss配置
        test: /\.scss$/,
        use: 'HappyPack/loader?id=happyScss'
        //loaders: ["vue-style-loader","css-loader", "sass-loader"]
      },
      {
        test: /\.css$/,
        // 重要：使用 vue-style-loader 替代 style-loader
        use: isProd
          ? ExtractTextPlugin.extract({
              use: 'css-loader',
              fallback: 'vue-style-loader'
            })
          :
           {
              // 一个loader对应一个id
              loader: 'happypack/loader?id=happyCss'
            }
        //['vue-style-loader', 'css-loader']
      }
    ]
  },
  plugins: isProd
    ? // 确保添加了此插件！
      [
        new ExtractTextPlugin({
          filename: utils.assetsPath('css/[name].[contenthash].css'),
          allChunks: true
        })
      ]
    : [],
  node: {
    // prevent webpack from injecting useless setImmediate polyfill because Vue
    // source contains it (although only uses it if it's native).
    setImmediate: false,
    // prevent webpack from injecting mocks to Node native modules
    // that does not make sense for the client
    dgram: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty'
  }
}

webpackConfig.plugins = webpackConfig.plugins.concat([
  new HappyPack({
    //用id来标识 happypack处理那里类文件
    id: 'happyBabel',
    //如何处理  用法和loader 的配置一样
    loaders: [
      {
        loader: 'babel-loader?cacheDirectory=true'
      }
    ],
    //共享进程池threadPool: HappyThreadPool 代表共享进程池，即多个 HappyPack 实例都使用同一个共享进程池中的子进程去处理任务，以防止资源占用过多。
    threadPool: happyThreadPool,
    //允许 HappyPack 输出日志
    verbose: true
  }),
  new HappyPack({
    //用id来标识 happypack处理那里类文件
    id: 'happyCss',
    //如何处理  用法和loader 的配置一样
    loaders: [
      {
        loader: 'vue-style-loader?cacheDirectory=true'
      },
      {
        loader: 'css-loader?cacheDirectory=true'
      }
    ],
    //共享进程池threadPool: HappyThreadPool 代表共享进程池，即多个 HappyPack 实例都使用同一个共享进程池中的子进程去处理任务，以防止资源占用过多。
    threadPool: happyThreadPool,
    //允许 HappyPack 输出日志
    verbose: true
  }),
  new HappyPack({
    //用id来标识 happypack处理那里类文件
    id: 'happyScss',
    //如何处理  用法和loader 的配置一样
    loaders: [
      {
        loader: 'vue-style-loader?cacheDirectory=true'
      },
      {
        loader: 'css-loader?cacheDirectory=true'
      },
      {
        loader: 'sass-loader?cacheDirectory=true'
      }
    ],
    //共享进程池threadPool: HappyThreadPool 代表共享进程池，即多个 HappyPack 实例都使用同一个共享进程池中的子进程去处理任务，以防止资源占用过多。
    threadPool: happyThreadPool,
    //允许 HappyPack 输出日志
    verbose: true
  }),
    // 清除无用 css
    new PurifyCSS({
      paths: glob.sync([
        // 要做 CSS Tree Shaking 的路径文件
        path.resolve(__dirname, './src/*.html'), // 请注意，我们同样需要对 html 文件进行 tree shaking
        path.resolve(__dirname, './src/*.js')
      ])
    })
])
module.exports = webpackConfig
