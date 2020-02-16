`vue.config.js` 是一个可选的配置文件，如果项目的 (和 `package.json` 同级的) 根目录中存在这个文件，那么它会被 `@vue/cli-service` 自动加载。

## devServer.proxy

如果你的前端应用和后端 API 服务器没有运行在同一个主机上，你需要在开发环境下将 API 请求代理到 API 服务器。这个问题可以通过 `vue.config.js` 中的 `devServer.proxy` 选项来配置。

`devServer.proxy` 可以是一个指向开发环境 API 服务器的字符串:

```javascript
module.exports = {
  devServer: {
    proxy: 'http://localhost:4000'
  }
}
```

如果你想要更多的代理控制行为，也可以使用一个 `path: options` 成对的对象。

```javascript
module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: '<url>', // target host
        ws: true, // websoket
        changeOrigin: true //虚拟host网站
      },
      '/foo': {
        target: '<other_url>'
      }
    }
  }
}
```

## publicPath

用法和 webpack 本身的 `output.publicPath` 一致，但是 Vue CLI 在一些其他地方也需要用到这个值，所以**请始终使用 `publicPath` 而不要直接修改 webpack 的 `output.publicPath`**。

## outputDir

当运行 `vue-cli-service build` 时生成的生产环境构建文件的目录。注意目标目录在构建之前会被清除 (构建时传入 `--no-clean` 可关闭该行为)。

## assetsDir

放置生成的静态资源 (js、css、img、fonts) 的 (相对于 `outputDir` 的) 目录。从生成的资源覆写 filename 或 chunkFilename 时，`assetsDir` 会被忽略。

## productionSourceMap

如果你不需要生产环境的 source map，可以将其设置为 `false` 以加速生产环境构建。

## css.loaderOptions

向 CSS 相关的 loader 传递选项。

## 其他选项

> https://cli.vuejs.org/zh/config/