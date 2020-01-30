# webpack

`devtool`：此选项控制是否生成，以及如何生成 source map。

> source maps：Webpack打包生成的.map后缀文件，使得我们的开发调试更加方便，它能帮助我们链接到断点对应的源代码的位置进行调试（//# souceURL）

### Entry

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
    }
}
```

Entry 类型可以是以下三种中的一种或者相互组合：

| 类型   | 例子                                                         | 含义                                 |
| ------ | ------------------------------------------------------------ | ------------------------------------ |
| string | `'./app/entry'`                                              | 入口模块的文件路径，可以是相对路径。 |
| array  | `['./app/entry1', './app/entry2']`                           | 入口模块的文件路径，可以是相对路径。 |
| object | `{ a: './app/entry-a', b: ['./app/entry-b1', './app/entry-b2']}` | 配置多个入口，每个入口生成一个 Chunk |

如果是 `array` 类型，则搭配 `output.library` 配置项使用时，只有数组里的最后一个入口文件的模块会被导出。

### output

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

多入口配种：

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

## loader

本身是一个函数，接受源文件作为参数，返回转换的结果。

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

