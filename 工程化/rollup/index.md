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
  input: 'src/main.js',
  output: {
    file: 'bundle.js',
    format: 'cjs'
  }
};
```

命令行指定配置会覆盖配置文件里的配置。

也可以指定与默认 `rollup.config.js` 文件不同的配置文件：

```bash
rollup --config rollup.config.dev.js
rollup --config rollup.config.prod.js
```

### 插件

可以用 *插件(plugins)* 在打包的关键过程中更改 Rollup 的行为。[the Rollup wiki](https://github.com/rollup/rollup/wiki/Plugins) 维护了可用的插件列表。

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

### Tree-shaking

除了使用 ES6 模块之外，Rollup 还静态分析代码中的 import，并将排除任何未实际使用的代码。

ES模块允许进行静态分析，从而实现像 tree-shaking 的优化，并提供诸如循环引用和动态绑定等高级功能。

Rollup 力图实现 ES 模块的规范。



> [官方中文网](rollupjs.com)

