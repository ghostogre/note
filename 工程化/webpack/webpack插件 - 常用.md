## 拆分css的插件

`mini-css-extract-plugin` 为每个包含css的js文件都创建一个css文件

如果你想拆分为一一对应的多个css文件（比如css为index.css，sass为index.scss）,我们需要使用到`extract-text-webpack-plugin`，而目前mini-css-extract-plugin还不支持此功能。我们需要安装@next版本的`extract-text-webpack-plugin`。在`extract-text-webpack-plugin`的new实例中传字符串，就能命名打包输出的css文件，在plugins里传入多个插件实例就能拆分多个css文件。

* 但是普通的extract-text-webpack-plugin只支持3.0版本的webpack

* webpack 4.0官方使用mini-css-extract-plugin

## 打包 图片、字体、媒体、等文件

`file-loader`就是将文件在进行一些处理后（主要是处理文件名和路径、解析文件url），并将文件移动到输出的目录中
 `url-loader` 一般与`file-loader`搭配使用，功能与 file-loader 类似，如果文件小于限制的大小。则会返回 base64 编码，否则使用 file-loader 将文件移动到输出的目录中

```javascript
module.export = {
    // ...
    module: {
        rules: [
            {
                test: /\.(mp4|webm|ogg|mp3|wav|flac|acc)(\?.*)?$/, // 媒体文件
                use: {
                    loader: 'url-loader',
                    options: {
                        limit: 10240,
                        fallback: {
						loader: 'file-loader',
						options: {
                            name: 'media/[name].[hash8].[ext]'
                          }
                        }
                    }
                }
            }
        ]
    }
}
```

## 用babel转义js文件

为了使我们的js代码兼容更多的环境我们需要安装依赖

```
npm i -D babel-loader @babel/preset-env @babel/core
```

- 注意 `babel-loader`与`babel-core`的版本对应关系

1. `babel-loader` 8.x 对应`babel-core` 7.x
2. `babel-loader` 7.x 对应`babel-core` 6.x

```javascript
module.exports = {
	// ......
    module: {
        rules: [
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/preset-env'
                        ]
                    },
                    exclude: /node_modules/
                }
            }
        ]
    }
}
```



`babel-loader`只会将 ES6/7/8语法转换为ES5语法，但是对新api并不会转换 例如(promise、Generator、Set、Maps、Proxy等) 。此时我们需要借助`babel-polyfill`来帮助我们转换:

```
yarn add @babel/polyfill
```

```javascript
// webpack.config.js
const path = require("path");
module.exports = {
    entry: [
        "babel-polyfill",
        path.resolve(__dirname, '../src/index.js')
    ] // 入口文件
}
```

## vue开发环境

```
npm i -D vue-loader vue-template-compiler vue-style-loader
npm i -S vue
```

`vue-loader` 用于解析`.vue`文件
`vue-template-compiler` 用于编译模板 配置如下

```javascript
const VueLoaderPlugin = require("vue-loader/lib/plugin");
module.exports = {
    module: {
        rules: [
            {
                test: /\.vue$/,
                use: [ "vue-loader" ]
            }
        ]
    },
    resolve: {
        alias: {
            "vue$": "vue/dist/vue.runtime.esm.js",
            " @": path.resolve(__dirname, "../src")
        },
        extensions: ["*", ".js", ".json", ".vue"]
    },
    plugins: [
        new VueLoaderPlugin()
    ]
}
```

### 配置webpack-dev-server进行热更新

```
yarn add webpack-dev-server -D
```

```javascript
const Webpack = require("webpack");
module.exports = {
    devServer: {
        port: 3000,
        hot: true,
        contentBase: '../dist'
    },
    // ...
    plugins: [
        // ...
        new Webpack.hotModuleReplacementPlugin()
    ]
}
```

配置打包命令

```json
"scripts": {
    "dev": "webpack-dev-server --config build/webpack.config.js --open"
}
```

