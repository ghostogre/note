## 安装配置 TypeScript

当你安装了 TypeScript，你就可以使用 `tsc` 命令行工具，这个工具可以编译 TypeScript，编译时会创建一个开始文件 `tsconfig.json`，你可以编辑这个文件。你可以运行 `tsc --init` 获得这个文件 。

`tsc --init` 这个命令会生成一个 `tsconfig.json` 文件，所有 `TypeScript` 编译器的配置都存在于这个文件中。

```js
{
  "compilerOptions": {
    "module": "es6", // 使用 ES2015 模块
    "target": "es6", // 编译成 ES2015 (Babel 将做剩下的事情)
    "allowSyntheticDefaultImports": true, // 看下面
    "baseUrl": "src", // 可以相对这个目录 import 文件
    "sourceMap": true, // 使 TypeScript 生成 sourcemaps
    "outDir": "ts-build", // 构建输出目录 (因为我们大部分时间都在使用 Webpack，所以不太相关)
    "jsx": "preserve", // 开启 JSX 模式, 但是 "preserve" 告诉 TypeScript 不要转换它(我们将使用 Babel)
    "strict": true,
  },
  "exclude": [
    "node_modules" // 这个目录下的代码不会被 typescript 处理
  ]
}
```

### allowSyntheticDefaultImports

将这个属性的值设置为 true，它允许你使用 ES2015 默认的 imports 风格, 即使你导入的代码没有使用 ES2015 默认的 export。

### strict:true

当将这个值设置为 true 时，TypeScript 编译器会尽可能的严格。

### noImplicitAny

将 TypeScript 引入一个现有的项目，当你不声明变量的类型时，TypeScript 不会抛出错误。TypeScript 默认做的一件事是将变量设置为 `any` 类型。`any` 是 TypeScript 中避免类型检查的有效手段，它可以是任何值。当你转换 JavaScript 时，使用 `any` 是很有用的，但是最好还是尽可能地严格。当将 noImplicitAny 设置为 true，你**必须为变量设置类型**。

### strictNullChecks

TypeScript 会更容易识别出你引用的一个可能是 undefined 值的地方，并将展示这个错误。例如：

```javascript
person.age.increment()
```

当将 strictNullChecks 设置为 true，TypeScript 会认为 person 或者 person.age 可能是 undefined，它会报个错以确保你处理它。

## webpack

安装 Webpack，Babel 和相关的 presets 及 ts-loader，ts-loader 是 TypeScript 在 Webpack 中的插件。

```bash
yarn add webpack babel-core babel-loader babel-preset-es2015 babel-preset-react ts-loader webpack-dev-server
```

```js
const webpack = require('webpack')
const path = require('path')

module.exports = {
  // 设置 sourcemaps 为 eval 模式，将模块封装到 eval 包裹起来
  devtool: 'eval',

  // 我们应用的入口, 在 `src` 目录 (我们添加到下面的 resolve.modules):
  entry: [
    'index.tsx'
  ],

  // 配置 devServer 的输出目录和 publicPath
  output: {
    filename: 'app.js',
    publicPath: 'dist',
    path: path.resolve('dist')
  },

  // 配置 devServer 
  devServer: {
    port: 3000,
    historyApiFallback: true,
    inline: true,
  },

  // 告诉 Webpack 加载 TypeScript 文件
  resolve: {
    // 首先寻找模块中的 .ts(x) 文件, 然后是 .js 文件
    extensions: ['.ts', '.tsx', '.js'],

    // 在模块中添加 src, 当你导入文件时，可以将 src 作为相关路径
    modules: ['src', 'node_modules'],
  },

  module: {
    loaders: [
      // .ts(x) 文件应该首先经过 Typescript loader 的处理, 然后是 babel 的处理
      { test: /\.tsx?$/, loaders: ['babel-loader', 'ts-loader'], include: path.resolve('src') }
    ]
  },
}
```

```
yarn add @types/react
yarn add @types/react-dom
```

无论何时，你安装一个依赖时，都应该试着安装 `@types` 包，或者你想查看是否有被支持的类型，你可以在 [TypeSearch](https://microsoft.github.io/TypeSearch/) 网站上查看。

## 使用 TSLint 规范代码

可以通过 `tslint.json` 文件配置 TSLint

```javascript
{
    "defaultSeverity": "error",
    "extends": ["tslint:latest", "tslint-react"],
    "jsRules": {},
    "rules": {
      // 用单引号, 但是在 JSX 中，强制使用双引号
      "quotemark": [true, "single", "jsx-double"],
      // 我更喜欢没有分号 :)
      "semicolon": [true, "never"],
      // 这个规则使每个接口以 I 开头，这点我不喜欢
      "interface-name": [true, "never-prefix"],
      // 这个规则强制对象中的 key 按照字母顺序排列 
      "object-literal-sort-keys": false
    },
    "rulesDirectory": []
}
```

可以运行 `tslint --project tsconfig.json` 规范我的项目

## create-react-app

```bash
> npx create-react-app react-typescript-demo --typescript 
```

### react-app-env.d.ts声明文件

```ts
/// <reference types="react-scripts" />
```

三斜线引用告诉编译器在编译过程中要引入的额外的文件。

