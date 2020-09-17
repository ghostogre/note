Rollup 是一个 JavaScript 模块打包器，可以将**小块代码编译成大块复杂**的代码。rollup相比webpack更适合开发js库。

```bash
npm install --global rollup 
```

```bash
rollup src/main.js -f cjs
```

`-f` 选项（`--output.format` 的缩写）指定了所创建 bundle 的类型——这里是 CommonJS（在 Node.js 中运行）。

也可以像下面一样将 bundle 保存为文件：

```bash
rollup src/main.js -o bundle.js -f cjs
```

### 配置

 `rollup.config.js` 的文件：

```js
// rollup.config.js
export default {
  input: 'src/main.js', // 必须
  output: {
    file: 'bundle.js', // 必须
    format: 'cjs' // 必须
  }
};
```

必须使用配置文件才能执行以下操作：

- 把一个项目打包，然后输出多个文件
- 使用Rollup插件

命令行指定配置会覆盖配置文件里的配置。

**命令行参数：**

```
-i, --input <filename>      要打包的文件（必须）
-o, --file <output>         输出的文件 (如果没有这个参数，则直接输出到控制台)
-f, --format <format>       输出的文件类型 (amd, cjs, esm, iife, umd)
-e, --external <ids>        将模块ID的逗号分隔列表排除
-g, --globals <pairs>       以`module ID:Global` 键值对的形式，用逗号分隔开 
                              任何定义在这里模块ID定义添加到外部依赖
-n, --name <name>           生成UMD模块的名字
-h, --help                  输出 help 信息
-m, --sourcemap             生成 sourcemap (`-m inline` for inline map)
```

也可以指定与默认 `rollup.config.js` 文件不同的配置文件（--config / -c）：

```bash
rollup --config rollup.config.dev.js
rollup --config rollup.config.prod.js
```

## 插件

可以用 ***插件(plugins)*** 在打包的关键过程中更改 Rollup 的行为。[the Rollup wiki](https://github.com/rollup/rollup/wiki/Plugins) 维护了可用的插件列表。

将 rollup-plugin-json 安装为开发依赖：

复制

```bash
npm install --save-dev rollup-plugin-json
```

```js
// src/main.js
import { version } from '../package.json';

export default function () {
  console.log('version ' + version);
}
```

编辑 `rollup.config.js` 文件，加入 JSON 插件：

```js
// rollup.config.js
import json from 'rollup-plugin-json';

export default {
  input: 'src/main.js',
  output: {
    file: 'bundle.js',
    format: 'cjs'
  },
  plugins: [ json() ]
};
```

`npm run build` 执行 Rollup。结果如下：

```js
'use strict';

var version = "1.0.0";

var main = function () {
  console.log('version ' + version);
};

module.exports = main;
```

### 其他有用的插件

 [rollup-plugin-node-resolve](https://github.com/rollup/rollup-plugin-node-resolve) 插件可以告诉 Rollup 如何查找外部模块。

 [rollup-plugin-commonjs](https://github.com/rollup/rollup-plugin-commonjs) 插件就是用来将 CommonJS 转换成 ES2015 模块的。

### 不参与打包

使用`external`只可以指定不打包到最终文件里的库，可以接受一个模块名称的数组或一个接受模块名称的函数

```js
external: id => /lodash/.test(id)
```

### Babel

使用 Babel 和 Rollup 的最简单方法是使用 [rollup-plugin-babel](https://github.com/rollup/rollup-plugin-babel) 。 安装它：

```bash
npm i -D rollup-plugin-babel
```

```js
// rollup.config.js
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

export default {
  input: 'src/main.js',
  output: {
    file: 'bundle.js',
    format: 'cjs'
  },
  plugins: [
    resolve(),
    babel({
      exclude: 'node_modules/**' // 只编译我们的源代码
    })
  ]
};
```

在 Babel 实际编译代码之前，需要进行配置。 创建一个新文件`src/.babelrc`：

```json
{
  "presets": [
    ["latest", {
      "es2015": {
        // 必须设置这个modules：false，否则 Babel 会在 Rollup 有机会做处理之前，将我们的模块转成 CommonJS ，导致 Rollup 的一些处理失败。
        "modules": false
      }
    }]
  ],
  "plugins": ["external-helpers"]
}
```

在我们运行 rollup 之前，我们需要安装 `latest` preset 和 `external-helpers` 插件

```bash
npm i -D babel-preset-latest babel-plugin-external-helpers
```



### Tree-shaking

除了使用 ES6 模块之外，Rollup 还静态分析代码中的 import，并将排除任何未实际使用的代码。

ES模块允许进行静态分析，从而实现像 tree-shaking 的优化，并提供诸如循环引用和动态绑定等高级功能。

Rollup 力图实现 ES 模块的规范。

## JavaScript API

- `rollup.rollup` 函数返回一个 Promise，它解析了一个 `bundle` 对象，此对象带有不同的属性及方法。
- 提供了 `rollup.watch` 函数，当它检测到磁盘上单个模块已经改变，它会重新构建你的文件束。 当你通过命令行运行 Rollup，并带上 `--watch` 标记时，此函数会被内部使用。

## 对比webpack

1. rollup打包出来没有多余的代码，webpack会多一堆注释。
2. 具有强大的tree shaking 功能。

> [官方中文网](rollupjs.com)

