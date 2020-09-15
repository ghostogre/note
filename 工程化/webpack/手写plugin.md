### 手写webpack plugin

> 在 `Webpack` 运行的生命周期中会广播出许多事件，`Plugin` 可以监听这些事件，在合适的时机通过`Webpack`提供的`API`改变输出结果。

插件如下：

```javascript
class firstPlugin {
  constructor (options) {
    console.log('firstPlugin options', options)
  }
  apply (compiler) {
    compiler.plugin('done', compilation => {
      console.log('firstPlugin')
    ))
  }
}

module.exports = firstPlugin
```

## compiler 、compilation是什么？

- `compiler` 对象包含了`Webpack` 环境所有的的配置信息。这个对象在启动 `webpack` 时被一次性建立，并配置好所有可操作的设置，包括 `options`，`loader` 和 `plugin`。当在 `webpack` 环境中应用一个插件时，插件将收到此 `compiler` 对象的引用。可以使用它来访问 `webpack` 的主环境。
- `compilation`对象包含了当前的模块资源、编译生成资源、变化的文件等。当运行`webpack` 开发环境中间件时，每当检测到一个文件变化，就会创建一个新的 `compilation`，从而生成一组新的编译资源。`compilation` 对象也提供了很多关键时机的回调，以供插件做自定义处理时选择使用。

**compiler和 compilation的区别在于** 

- compiler代表了整个webpack从启动到关闭的生命周期，而compilation 只是代表了一次新的编译过程
- compiler和compilation暴露出许多钩子，我们可以根据实际需求的场景进行自定义处理

[compiler钩子文档](https://www.webpackjs.com/api/compiler-hooks/)

[compilation钩子文档](https://www.webpackjs.com/api/compilation-hooks/)

新建一个`webpack-firstPlugin.js`

```javascript
class firstPlugin{
  constructor(options){
    this.options = options
  }
  apply(compiler){
    compiler.plugin('emit',(compilation,callback)=>{
      let str = ''
      for (let filename in compilation.assets){
        str += `文件:${filename}  大小${compilation.assets[filename]['size']()}\n`
      }
      // 通过compilation.assets可以获取打包后静态资源信息，同样也可以写入资源
      compilation.assets['fileSize.md'] = {
        source:function(){
          return str
        },
        size:function(){
          return str.length
        }
      }
      callback()
    })
  }
}
module.exports = firstPlugin
```

如何使用

```javascript
const path = require('path')
const firstPlugin = require('webpack-firstPlugin.js')
module.exports = {
    // 省略其他代码
    plugins:[
        new firstPlugin()
    ]
}
```

执行 `npm run build`即可看到在`dist`文件夹中生成了一个包含打包文件信息的`fileSize.md`