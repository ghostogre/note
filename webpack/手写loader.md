`loader`编写原则

- 单一原则: 每个 `Loader` 只做一件事；
- 链式调用: `Webpack` 会按顺序链式调用每个 `Loader`；
- 统一原则: 遵循 `Webpack` 制定的设计规则和结构，输入与输出均为字符串，各个 `Loader` 完全独立，即插即用；

在日常开发环境中，为了方便调试我们往往会加入许多`console`打印。但是我们不希望在生产环境中存在打印的值。那么这里我们自己实现一个`loader`去除代码中的`console`

> 知识点普及之`AST`。`AST`通俗的来说，假设我们有一个文件`a.js`,我们对`a.js`里面的1000行进行一些操作处理,比如为所有的`await` 增加`try catch`,以及其他操作，但是`a.js`里面的代码本质上来说就是一堆字符串。那我们怎么办呢，那就是转换为带标记信息的对象(抽象语法树)我们方便进行增删改查。这个带标记的对象(抽象语法树)就是`AST`。这里推荐一篇不错的AST文章 [AST快速入门](https://segmentfault.com/a/1190000016231512)

```
npm i -D @babel/parser @babel/traverse @babel/generator @babel/types
```

- `@babel/parser` 将源代码解析成 `AST`
- `@babel/traverse` 对`AST`节点进行递归遍历，生成一个便于操作、转换的`path`对象
- `@babel/generator` 将`AST`解码生成`js`代码
- `@babel/types`通过该模块对具体的`AST`节点进行进行增、删、改、查

新建`drop-console.js`:

```javascript

const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generator = require('@babel/generator').default
const t = require('@babel/types')
module.exports=function(source){
   // sourceType表明什么代码应该被转换成AST，包含了ES6的import和export会被当成module，否则就是script
  const ast = parser.parse(source,{ sourceType: 'module'})
  traverse(ast,{
    // 钩子函数
    // CallExpression 调用表达式
    CallExpression(path){ 
      if(t.isMemberExpression(path.node.callee) && t.isIdentifier(path.node.callee.object, {name: "console"})){
          // Path 是表示两个节点之间连接的对象。
          path.remove()
      }
    }
  })
  const output = generator(ast, {}, source);
  return output.code
}
```

如何使用：

```javascript
const path = require('path')
module.exports = {
  mode:'development',
  entry:path.resolve(__dirname,'index.js'),
  output:{
    filename:'[name].[contenthash].js',
    path:path.resolve(__dirname,'dist')
  },
  module:{
    rules:[{
      test:/\.js$/,
      use:path.resolve(__dirname,'drop-console.js')
      }
    ]
  }
}
```

实际上在`webpack4`中已经集成了去除`console`功能，在`minimizer`中可配置 [去除console](https://webpack.js.org/plugins/terser-webpack-plugin/#root)

## Babel

Babel 转换 JS 代码可以分成以下三个大步骤：

- Parser（解析）：此过程接受转换之前的源码，输出 AST（抽象语法树）。在 Babel 中负责此过程的包为 [babel/parser](https://github.com/babel/babel/tree/master/packages/babel-parser)；
- Transform（转换）：此过程接受 Parser 输出的 AST（抽象语法树），输出转换后的 AST（抽象语法树）。在 Babel 中负责此过程的包为 [@babel/traverse](https://github.com/babel/babel/tree/master/packages/babel-traverse)；
- Generator（生成）：此过程接受 Transform 输出的新 AST，输出转换后的源码。在 Babel 中负责此过程的包为 [@babel/generator](https://github.com/babel/babel/tree/master/packages/babel-generator)。

## 什么是抽象语法树（AST）

在继续本教程之前，我们有必要先了解抽象语法树（AST）的用途，所以先来看看它是什么以及我们为什么需要它。

JavaScript 程序通常是由一系列的字符组成的，每一个在我们的大脑中都有一些可视的含义。这对我们来说非常方便，可以让我们使用匹配的字符（`[]`, `{}`, `()`），成对的字符（`''`, `""`）和缩进让程序解析起来更加简单。

所有的抽象语法树（AST）根节点都是 `Program` 节点，这个节点包含了所有的最顶层语句。我们不要试图自己去分析抽象语法树（AST），可以通过 [astexplorer.net](https://astexplorer.net/) 网站帮助我们来完成，它允许我们在左边输入 JavaScript 代码，右侧会出可浏览的抽象语法树（AST）



