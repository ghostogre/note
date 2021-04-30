# Babel原理

Babel 是一个 JavaScript 编译器。他把最新版的javascript编译成当下可以执行的版本。

## 运行原理

### 解析

解析步骤接收代码并输出 AST。 这个步骤分为两个阶段：词法分析（Lexical Analysis） 和 语法分析（Syntactic Analysis）。

#### 词法分析

词法分析阶段把字符串形式的代码转换为 令牌（tokens） 流。

你可以把令牌看作是一个扁平的语法片段数组：

```js
n * n;
/** 上述代码等价于如下的token */
[
  { type: { ... }, value: "n", start: 0, end: 1, loc: { ... } },
  { type: { ... }, value: "*", start: 2, end: 3, loc: { ... } },
  { type: { ... }, value: "n", start: 4, end: 5, loc: { ... } },
  ...
]
```

每一个 type 有一组属性来描述该令牌：

```js
{
  type: {
    label: 'name',
    keyword: undefined,
    beforeExpr: false,
    startsExpr: true,
    rightAssociative: false,
    isLoop: false,
    isAssign: false,
    prefix: false,
    postfix: false,
    binop: null,
    updateContext: null
  },
  ...
}
```

#### 语法分析

语法分析阶段会把一个令牌流转换成 AST 的形式。 这个阶段会使用令牌中的信息把它们转换成一个 AST 的表述结构，这样更易于后续的操作。

简单来说，解析阶段就是

```
code(字符串形式代码) -> tokens(令牌流) -> AST（抽象语法树）
```

Babel 使用 @babel/parser 解析代码，输入的 js 代码字符串根据 ESTree 规范生成 AST（抽象语法树）。Babel 使用的解析器是 **babylon**。

### 转换

转换步骤接收 AST 并对其进行遍历，在此过程中对节点进行添加、更新及移除等操作。 这是 Babel 或是其他编译器中最复杂的过程。

Babel提供了 **@babel/traverse** (遍历) 方法维护这AST树的整体状态，并且可完成对其的替换，删除或者增加节点，这个方法的参数为原始AST和自定义的转换规则，返回结果为转换后的AST。

### 生成

代码生成步骤把最终（经过一系列转换之后）的 AST 转换成字符串形式的代码，同时还会创建源码映射（source maps）。

代码生成其实很简单：深度优先遍历整个 AST，然后构建可以表示转换后代码的字符串。

Babel使用 **@babel/generator** 将修改后的 AST 转换成代码，生成过程可以对是否压缩以及是否删除注释等进行配置，并且支持 sourceMap。

## babel的一些包

#### babel-core

babel-core是Babel的核心包,里面存放着诸多核心API，这里说下transform。

transform : 用于字符串转码得到AST 。

#### babel-types

Babel Types模块是一个用于 AST 节点的 Lodash 式工具库。它包含了构造、验证以及变换 AST 节点的方法。 该工具库包含考虑周到的工具方法，对编写处理AST逻辑非常有用。 

#### Visitors (访问者)

```ts
function square(n) {
    return n * n;
}

/** ast */
{
    type: "FunctionDeclaration",
    id: {
        type: "Identifier",
        name: "square"
    },
    params: [{
        type: "Identifier",
        name: "n"
    }],
    body: {
        type: "BlockStatement",
        body: [{
            type: "ReturnStatement",
            argument: {
                type: "BinaryExpression",
                operator: "*",
                left: {
                    type: "Identifier",
                    name: "n"
                },
                right: {
                    type: "Identifier",
                    name: "n"
                }
            }
        }]
    }
}
```

为了遍历 AST，我们定义了访问者 Visitor，针对每一个 Identifier 类型的节点，设置了进入和退出时执行的操作。 

```js
const MyVisitor = {
    Identifier: {
        enter() {},
        exit() {}
    }
};
path.traverse(MyVisitor);
```

> 值得一提的是，Visitor 中的键可以使用 | 以表示定义多种节点：
>
> ```js
> "ExportNamedDeclaration|Flow"(path) {}
> ```

`Babel` 会维护一个称作 `Visitor` 的对象，这个对象定义了用于 `AST` 中获取具体节点的方法。一个 `Visitor` 一般来说是这样的：

```js
import * as t from "@babel/types";
var visitor = {
  	// 箭头函数对应的访问者方法(节点)
    ArrowFunction(path) {
      	// 该路径对应的节点信息  
        let { id, params, body, generator, async } = path.node;
      	// 箭头函数我们会简写{return a+b} 为 a+b    
        if (!t.isBlockStatement(body)) {    
          const node = t.returnStatement(body);
          body = t.blockStatement([node]);
        }
        // 进行节点替换 (arrowFunctionExpression -> functionExpression)
      	path.replaceWith(t.FunctionDeclaration(id, params, body));
    },
    IfStatement() {
        console.log('我是一个if语句');
    },
    CallExpression() {},
  	/** 两个时机：进入节点enter 和离开节点 exit */
  	Identifier: {
        enter() {
            console.log('Identifier enter');
        },
        exit() {
            console.log('Identifier exit');
        }
    }
};
```

当我们遍历 `AST` 的时候，如果匹配上一个 `type`，就会调用 `visitor` 里的方法。生成出来的 AST 结构都拥有一个 accept 方法用来接收 visitor 访问者对象的访问，而访问者其中也定义了 visit 方法(即开发者定义的函数方法)使其能够对树状结构不同节点做出不同的处理。

Babel的插件模块需要我们暴露一个方法，方法内返回visitor对象。

#### Paths（路径）

AST 通常会有许多节点，那么**节点直接如何相互关联呢**？ 我们可以使用一个可操作和访问的巨大可变对象表示节点之间的关联关系，或者也可以用Paths（路径）来简化这件事情。

**Path 是表示两个节点之间连接的对象。**

在某种意义上，路径是一个节点在树中的位置以及**关于该节点各种信息的响应式 Reactive 表示**。 当你调用一个修改树的方法后，路径信息也会被更新。 Babel 帮你管理这一切，从而使得节点操作简单，尽可能做到无状态。

**Paths in Visitors（存在于访问者中的路径）**

当你有一个 Identifier() 成员方法的访问者时，你实际上是在访问路径而非节点。 通过这种方式，你操作的就是节点的响应式表示（译注：即路径）而非节点本身。

```js
const MyVisitor = {
  Identifier(path) {
    console.log("Visiting: " + path.node.name);
  }
};
```

