# webpack

`devtool`：此选项控制是否生成，以及如何生成 source map。

> source maps：Webpack打包生成的.map后缀文件，使得我们的开发调试更加方便，它能帮助我们链接到断点对应的源代码的位置进行调试（//# souceURL）

## Entry

单入口，是一个字符串：

```javascript
module.exports = {
    entry: './src/index.js'
}
```

多入口，是一个对象：

```javascript
module.exports = {
    entry: {
        index: './src/index.js',
        manager: './src/manager.js',
        vendor: [] // vendor的意思是依赖的第三方库，不会经常变更的
        // 在entry中定义了app入口，相应的业务逻辑都封装在这个入口文件里，如果我们想要第三方代码独立出来，就要再增加一个入口，我们习惯使用vendor这个命名。
        // 需要 optimization.splitChunks（webpack4 之前是 CommonsChunkPlugin），将 app 和 vendor 这两个 chunk 中的模块提取出来。
    }
}
```

Entry 类型可以是以下三种中的一种或者相互组合：

| 类型     | 例子                                                         | 含义                                                         |
| -------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| string   | `'./app/entry'`                                              | 入口模块的文件路径，可以是相对路径。                         |
| array    | `['babel-polyfill',  './src/index.js'<br/>  ]`等同于在index.js引入babel-polyfill | 入口模块的文件路径，可以是相对路径。将多个资源先合并，经过最后一个元素作为实际的入口路径。 |
| object   | `{ a: './app/entry-a', b: ['./app/entry-b1', './app/entry-b2']}` | 配置多个入口，每个入口生成一个 Chunk                         |
| function | `module.exports = {  entry: Promise.resolve() }`             | 只要返回**字符串、数组和对象**，可以动态配置，支持返回一个 Promise 对象进行一步操作，自由度很大。 |

如果是 `array` 类型，则搭配 `output.library` 配置项使用时，只有数组里的最后一个入口文件的模块会被导出。

### entry.context

资源入口的路径前缀，务必使用绝对路径。其作用是为了让 `entry` 编写更加简洁。

## output

单入口配置：

```javascript
module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'bundle.js’,
        path: __dirname + '/dist'
    }
};
```

多入口配置：

```javascript
module.exports = {
	entry: {
		index: './src/index.js',
		manager: './src/manager.js'
	},
	output: {
		filename: '[name].js',
		path: __dirname + '/dist',
		library: "" // library和libraryTarget配合使用，可以打包项目作为一个库供不同环境的程序调用
	}
}
```

### filename

打包后的 bundle 名字，可配合 path，也可以是一个相对路径 `filename: './src/bundle.js'`，对于多入口场景可以 `filename: [name].js`;

| 变量名称    | 描述                                     | 说明                                                    |
| :---------- | :--------------------------------------- | :------------------------------------------------------ |
| [hash]      | 指代 webpack 此次打包所有资源生成的 hash | 只要 chunk 内容发生变化，就会改变，影响其他资源         |
| [chunkhash] | 指代当前 chunk 内容的 hash               | 只有当前 chunk 内容发生变化，才会改变，使用缓存推荐使用 |
| [name]      | 指代当前 chunk 的 name                   | 无                                                      |
| [id]        | 指代当前 chunk 的 id                     | 无                                                      |
| [query]     | 指代 filename 配置项中的 query           | 与 chunk 内容无关，需开发者手动指定                     |

通常，只有**生产环境才配置 `[chunkhash]`**，原因是为了更新缓存，开发环境无需配置。

### path

指定资源文件**输出位置**，其**值须为绝对路径**，默认为 dist 目录。如果不更改它，可不必配置；

### publicPath

指定资源**请求位置**（加载JS文件，图片，字体等）。若 public 值以协议头或相对协议的形式开始，那就说明是与 CDN 相关，例如 `publicPath： 'https://cdn.com/'`，则 `https://cdn.com/index.js`;。

> webpack-dev-server 中也有个 `publicPath`，比较容易弄混的是 webpack-dev-server 的 `publicPath` 与 output 的 `publicPath`没有关系，却与 output 的 `path` 有关系。
>
> ```javascript
> module.exports = {
>   entry: './src/app.js',
>   output: {
>     filename: 'bundle.js',
>     path: path.join(__dirname, 'dist')
>   },
>   devServer: {
>     publicPath: '/assets/',
>     port: 1989
>   }
> };
> ```
>
> 启动 `webpack-dev-server` 服务后，访问 `localhost:1989/dist/bundle.js` 则会返回 404，因为 devServer.publicPath 此时设置的路径是 `localhost:1989/assets/`，所以访问 `localhost:1989/assets/bundle.js` 才是有效路径。为了不必要引起这类麻烦问题，可将两者输出默认设置一致



## loader

每个 loader 本质都是一个函数，`output = loader(input)`。在 webpack4 之前，input 和 output 都必须为字符串，而 webpack4 之后，也支持**抽象语法树（AST）**的传递，那 loader 就可以是链式的了，即 `output = loaderA(loaderB(input))`。

- **input**，可能是工程源文件字符串，可能是上一个loader 的转化结果（字符串、source map 或 AST 对象）；
- **output**，同 input 一样，如果是最后一个 loader 就将结果给 webpack 后续处理；

```javascript
const path = require('path');
module.exports = {
    module: {
        rules: [
            {
                test: /\.js$/,
                use: 'babel-loader'
            }
        ]
    }
};
```

## enforce

用来指定一个 loader 的种类，其默认值为 normal，可选值为

- pre，在 use 配置的所有 loader 之前执行，比如下面就是保证检测的代码不是其他 loader 更改过来的；
- post，在 use 配置的所有 loader 之后执行；
- inline，官方不推荐使用；

## Plugins

```javascript
const path = require('path');
module.exports = {
    output: {
        filename: 'bundle.js'
    },
    plugins: [
        new HtmlWebpackPlugin({ template: './src/index.html' })
    ]
};
```

## 运行webpack

新建一个`webpack.config.js`作为原始的配置文件，运行webpack的时候，会自动运行config文件，如果没有config文件就会报错。当然也可使用其他命名的文件比如`webpack.dev.config.js`，就必须运行  `webpack --config webpack.dev.config.js`。

4.x以上版本需要使用`npx webpack`。

## 问题

`One CLI for webpack must be installed. These are recommended choices, delivered as separate packages:`

需要全局安装`webpack`和`webpack-cli`。

## resolve

模块如何被解析：

```javascript
const config = {
  resolve: {
    alias: { // 创建别名。 使引用是更方便，避免过多的相对路径
      images: path.resolve(__dirname, 'src/images/')
      css$: path.resolve(__dirname, 'src/assets/css')  // $ 标识精准匹配
    },
    extensions: [".js",".json"], // 当无后缀名时，默认自动带上后缀解析
    mainFiles: [], // 指定导入模块时 导入的哪部分代码 默认为["browser", "module", "main"]
    modules: ["node_modules"], // 默认只去node_modules中寻找第三方模块
    enforceExtension: false, // 允许无扩展名文件的引用
    unsafeCache: /\aa/, // 开启仅缓存aa模块  regex, array, boolean
    plugins: [],  // 额外的解析插件列表
  }
}
```

## devServer

使用webpack-dev-server打包生成的文件在内存中。

```javascript
const config = {
 devServer: {
   host: "", // 默认为localhost， 设置为ip 供外部访问
   port: "", // 监听的端口， 默认8080
   inline: true,  // false 时 责启用iframe模式， true为嵌入bundle中
   allowedHosts: [], // 设置白名单
   compress: true, //  启用gzip压缩
   contentBase: path.join(__dirname, "public"), // 静态文件路径, 默认当前执行的目录
   disableHostCheck: false,  // 关闭host检查，使其他设备也能访问本地服务
   lazy: true, // 开启惰性模式，仅在请求时编译，即不监听文件改动
   filename: "", // 只在请求该文件时编译， 必须开启惰性模式
   headers: {},  // 在所有想用中添加首部内容
   hot: true, // 开启模块热替换，仅刷新改变的模块
   clientLogLevel: "info",  // enum 客户端的日志级别，默认info
   https: true, // 默认使用http服务，开启https 后自动生成一份证书，也可用{}配置自己的证书,读文件
   open: true,  // 第一次构建后 自动打开浏览器
   proxy: {
     "/api":  "http://localhost:3000",
     "/users": {
       target: "https://localhost:3000",
       pathRewrite: {"^/users" : ""},  // 将路径重写 如 /users/login -> /login
       secure: false, // 若代理到https服务，则需要将secure设为false
       bypass: function(req, res, proxyOptions) {
         if (req.headers.accept.indexOf("html") !== -1) {
           console.log("Skipping proxy for browser request.");
           return "/index.html";
         }
       }
     }
   },
   quiet:  true, // 除初始启动信息外都不会打印到控制台
 }
}
```

