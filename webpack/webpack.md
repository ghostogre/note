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
        manager: './src/manager.js'
    }
}
```

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

```
module.exports = {
	entry: {
		index: './src/index.js',
		manager: './src/manager.js'
	},
	output: {
		filename: '[name].js',
		path: __dirname + '/dist'
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