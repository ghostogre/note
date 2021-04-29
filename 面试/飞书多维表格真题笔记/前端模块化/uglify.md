# JS代码如何压缩

## AST（抽象语法树）

**抽象语法树**：AST（Abstract Syntax Tree)，是源代码的抽象语法结构的树状表现形式，这里特指编程语言的源代码。树上的每个节点都表示源代码中的一种结构。之所以说语法是「抽象」的，是因为这里的语法并不会表示出真实语法中出现的每个细节。AST是源代码根据其语法结构，省略一些细节（比如：括号没有生成节点），抽象成树形表达。

## 代码压缩原理

1. 将code转换成AST
2. 将AST进行优化，生成一个更小的AST
3. 将新生成的AST再转化成code

babel，eslint，v8的逻辑均与此类似。

```js
// uglify-js的版本需要为2.x, 3.0之后uglifyjs不再暴露Compressor api
// 2.x的uglify不能自动解析es6，所以这里先切换成es5
// npm install uglify-js@2.x
var UglifyJS = require('uglify-js');
// 原始代码
var code = `var a;
var x = { b: 123 };
a = 123,
delete x`;
// 通过 UglifyJS 把代码解析为 AST
var ast = UglifyJS.parse(code);
ast.figure_out_scope();
// 转化为一颗更小的 AST 树
compressor = UglifyJS.Compressor();
ast = ast.transform(compressor);
// 再把 AST 转化为代码
code = ast.print_to_string();
// var a,x={b:123};a=123,delete x;
console.log("code", code);
```

为什么某些语句间的分号会被转换为逗号，某些不会转换？

## 代码压缩规则

