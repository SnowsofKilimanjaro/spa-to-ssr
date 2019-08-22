const path = require('path')
const webpack = require('webpack')

const src = path.resolve(process.cwd(), 'src'); // 源码目录
const evn = process.env.NODE_ENV == "production" ? "production" : "development";

module.exports = {
    entry: {
       // 项目中用到该依赖库文件
    vendor: ['vue/dist/vue.esm.js', 'vue', 'vuex', 'vue-router','axios','element-ui']
    },

    output: {
        path: path.resolve(__dirname, '../build', 'dll'),
        filename: '[name].dll.js',
        library: '[name]_[hash]',
        libraryTarget: 'this'
    },

    plugins: [
        new webpack.DllPlugin({
            // 定义程序中打包公共文件的入口文件vendor.js
            context: process.cwd(),
            // manifest.json文件的输出位置
            path: path.resolve(__dirname, '../build', 'dll/[name]-manifest.json'),

            // 定义打包的公共vendor文件对外暴露的函数名
            name: '[name]_[hash]'
        })
    ]
}