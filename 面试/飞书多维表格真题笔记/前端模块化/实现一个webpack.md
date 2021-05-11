> [简易代码实现](https://github.com/youngwind/fake-webpack/tree/1bfcd0edf10f1a2ff3bfd7c418e7490a735b9823/lib)

仔细观察`output.js`，我们能够发现：

1. 不管有多少个模块，头部那一块都是一样的，所以可以写成一个模板，也就是templateSingle.js。

2. 需要分析出各个模块间的依赖关系。也就是说，需要知道example依赖于a、b和c。

3. c模块位于`node_modules`文件夹当中，但是我们调用的时候却可以直接`require('c')`，这里肯定是存在某种自动查找的功能。

4. 在生成的output.js中，每个模块的唯一标识是模块的ID，所以在拼接output.js的时候，需要将每个模块的名字替换成模块的ID。也就是说：

   ```js
   // 转换前
   let a = require('a');
   let b = require('b');
   let c = require('c');
   
   // 转换后
   let a = require(/* a */1);
   let b = require(/* b */2);
   let c = require(/* c */3);
   ```

## 分析模块依赖关系

CommonJS不同于AMD，是不会在一开始声明所有依赖的。CommonJS最显著的特征就是**用到的时候再`require`**，所以我们得**在整个文件的范围内查找到底有多少个`require`**。

最先蹦入脑海的思路是**正则**。然而，用正则来匹配`require`，有以下两个缺点：

1. 如果`require`是写在注释中，也会匹配到。
2. 如果后期要支持`require`的参数是表达式的情况，如`require('a'+'b')`，正则很难处理。

因此，正则行不通。

正确的思路是：使用JS代码解析工具（如 esprima 或者 acorn ），将JS代码转换成抽象语法树（AST），再对AST进行遍历。这部分的核心代码是 parse.js 。

**匹配到`require`之后需要干什么呢？**：

```js
// example.js
let a = require('a');
let b = require('b');
let c = require('c');
```

有三个`require`，按照CommonJS的规范，在检测到第一个`require`的时候，根据`require即执行`的原则，程序应该立马去读取解析模块`a`。如果模块`a`中又`require`了其他模块，那么继续解析。也就是说，总体上遵循**深度优先遍历算法**。

## 找到模块

```js
// example.js
let a = require('a');
let b = require('b');
let c = require('c');
```

在模块`example.js`中，调用模块`a、b、c`的方式都是一样的。
但是，实际上他们所在的绝对路径层级并不一致：**`a和b`跟`example`同级，而`c`位于与`example`同级的`node_modules`中**。所以，程序需要有一个查找模块的算法。

目前实现的查找逻辑是：

1. 如果给出的是绝对路径/相对路径，只查找一次。找到返回绝对路径。找不到返回false。
2. 如果给出的是模块的名字，先在入口js（example.js）文件所在目录下寻找同名JS文件（可省略扩展名）。找到？返回绝对路径。找不到走第3步。
3. 在入口js（example.js）同级的node_modules文件夹（如果存在的话）查找。找到返回绝对路径。找不到返回false。

## 拼接output.js

在解决了`模块依赖`和`模块查找`的问题之后，我们将会得到一个依赖关系对象`depTree`，此对象完整地描述了以下信息：都有哪些模块，各个模块的内容是什么，他们之间的依赖关系又是如何等等。具体的结构如下：

```json
{
    "modules": {
        "/Users/youngwind/www/fake-webpack/examples/simple/example.js": {
            "id": 0,
            "filename": "/Users/youngwind/www/fake-webpack/examples/simple/example.js",
            "name": "/Users/youngwind/www/fake-webpack/examples/simple/example.js",
            "requires": [
                {
                    "name": "a",
                    "nameRange": [
                        16,
                        19
                    ],
                    "id": 1
                },
                {
                    "name": "b",
                    "nameRange": [
                        38,
                        41
                    ],
                    "id": 2
                },
                {
                    "name": "c",
                    "nameRange": [
                        60,
                        63
                    ],
                    "id": 3
                }
            ],
            "source": "let a = require('a');\nlet b = require('b');\nlet c = require('c');\na();\nb();\nc();\n"
        },
        "/Users/youngwind/www/fake-webpack/examples/simple/a.js": {
            "id": 1,
            "filename": "/Users/youngwind/www/fake-webpack/examples/simple/a.js",
            "name": "a",
            "requires": [],
            "source": "// module a\n\nmodule.exports = function () {\n    console.log('a')\n};"
        },
        "/Users/youngwind/www/fake-webpack/examples/simple/b.js": {
            "id": 2,
            "filename": "/Users/youngwind/www/fake-webpack/examples/simple/b.js",
            "name": "b",
            "requires": [],
            "source": "// module b\n\nmodule.exports = function () {\n    console.log('b')\n};"
        },
        "/Users/youngwind/www/fake-webpack/examples/simple/node_modules/c.js": {
            "id": 3,
            "filename": "/Users/youngwind/www/fake-webpack/examples/simple/node_modules/c.js",
            "name": "c",
            "requires": [],
            "source": "module.exports = function () {\n    console.log('c')\n}"
        }
    },
    "mapModuleNameToId": {
        "/Users/youngwind/www/fake-webpack/examples/simple/example.js": 0,
        "a": 1,
        "b": 2,
        "c": 3
    }
}
```

