# tsconfig.json

## 概述

如果一个目录下存在一个`tsconfig.json`文件，那么它意味着这个目录是TypeScript项目的根目录。 `tsconfig.json`文件中指定了用来编译这个项目的根文件和编译选项。 一个项目可以通过以下方式之一来编译：

## 使用tsconfig.json

如果你想在使用 `tsconfig.json` 时从命令行手动运行 TypeScript 编译器，你可以通过以下方式：

- 运行 tsc，它会在当前目录或者是父级目录寻找 `tsconfig.json` 文件。
- 运行 `tsc -p ./path-to-project-directory` 。当然，这个路径可以是绝对路径，也可以是相对于当前目录的相对路径。

你甚至可以使用 `tsc -w` 来启用 TypeScript 编译器的观测模式，在检测到文件改动之后，它将重新编译。

当命令行上指定了输入文件时，`tsconfig.json`文件会被忽略。

- `files`: 数组类型，用于表示由 ts 管理的文件的具体文件路径

- `exclude`: 数组类型，用于表示 ts 排除的文件（2.0 以上支持 Glob）

- `include`: 数组类型，用于表示 ts 管理的文件（2.0 以上）

- `compileOnSave`: 布尔类型，用于 IDE 保存时是否生成编译后的文件

- `extends`: 字符串类型，用于继承 ts 配置，2.1 版本后支持

- `compilerOptions`: 对象类型，设置编译的选项，不设置则使用默认配置，配置项比较多，后面再列

- `typeAcquisition`: 

  对象类型，设置自动引入库类型定义文件(`.d.ts`)相关，该对象下面有 3 个子属性分别是：

  - `enable`: 布尔类型，是否开启自动引入库类型定义文件(`.d.ts`)，默认为 `false`
  - `include`: 数组类型，允许自动引入的库名，如：["jquery", "lodash"]
  - `exculde`: 数组类型，排除的库名

如不设定 `files` 和 `include`，ts 默认是 `exclude` 以外的所有的以 `.ts` 和 `.tsx` 结尾的文件。如果，同时设置 `files` 的优先级最高，`exclude` 次之，`include` 最低。

可以通过 `compilerOptions` 来定制你的编译选项：

| 属性名                       | 值类型    | 默认值     | 描述                                                         |
| ---------------------------- | --------- | ---------- | ------------------------------------------------------------ |
| allowJs                      | boolean   | false      | 设置为 `true` 时，js 文件会被 tsc 编译，否则不会。一般在项目中 js, ts 混合开发时需要设置。 |
| checkJs                      | boolean   | false      | 验证 js 文件，与 `allowJs` 一同使用                          |
| lib                          | string[]  |            | 引入库定义文件，可以是["es5", "es6", "es2015", "es7", "es2016", "es2017", "esnext", "dom", "dom.iterable", "webworker", "scripthost", "es2015.core", "es2015.collection", "es2015.generator", "es2015.iterable", "es2015.promise", "es2015.proxy", "es2015.reflect", "es2015.symbol", "es2015.symbol.wellknown", "es2016.array.include", "es2017.object", "es2017.sharedmemory", "esnext.asynciterable"]（2.0 以上） |
| skipLibCheck                 | boolean   | false      | 对库定义文件跳过类型检查（2.0 以上）                         |
| jsx                          | string    | "preserve" | jsx 的编译方式                                               |
| strict                       | boolean   | false      | 同时开启 `alwaysStrict`, `noImplicitAny`, `noImplicitThis` 和 `strictNullChecks` (2.3 以上) |
| noEmit                       | boolean   | false      | 不显示输出                                                   |
| allowSyntheticDefaultImports | `boolean` | `false`    | 允许对不包含默认导出的模块使用默认导入。这个选项不会影响生成的代码，只会影响类型检查。 |

```json
{
  "compilerOptions": {
    "target": "es5",//编译后的目标
    "lib": [
      "dom", //dom运行环境
      "dom.iterable",//迭代器运行环境
      "esnext"//es6转化成es5的环境
    ],
    "downlevelIteration": true,
    "allowJs": true, //是否允许在ts文件中引入js
    "skipLibCheck": true,//是否跳过声明文件的检查
    "esModuleInterop": true, //可以使用es6的方式导入node.js的方法
    "allowSyntheticDefaultImports": true,
    "strict": true,//所有的语法都会进行严格的检查
    "forceConsistentCasingInFileNames": true,//文件名是否区分大小写
    "module": "esnext",//模块化标准，esnext 是一个 JavaScript 库，可以将 ES6 草案规范语法转成今天的 JavaScript 语法
    "moduleResolution": "node",//按照node的规则去找文件
    "resolveJsonModule": true,//是否允许把json文件当做模块进行解析
    "isolatedModules": true,//每个文件需要是一个模块
    "noEmit": true, //不需要生成文件
    "jsx": "react"
  },
  "include": [
    "src" //处理src目录下的文件
  ]
}
```

## allowSyntheticDefaultImports

`export = foo` 是 ts 为了兼容 commonjs 创造的语法，它对应于 commonjs 中的 `module.exports = foo`。

在 ts 中，如果要引入一个通过 `export = foo` 导出的模块，标准的语法是 `import foo = require('foo')`，或者 `import * as foo from 'foo'`。

但由于历史原因，我们已经习惯了使用 `import foo from 'foo'`。

这个选项就是为了解决这个问题。当它设置为 `true` 时，允许使用 `import foo from 'foo'` 来导入一个通过 `export = foo` 导出的模块。当它设置为 `false` 时，则不允许，会报错。

当然，我们一般不会在 ts 文件中使用 `export = foo` 来导出模块，而是在写（符合 commonjs 规范的）第三方库的声明文件时，才会用到 `export = foo` 来导出类型。

> **重要的提示**
>
> 使用 `"module": "esnext"` 选项：TypeScript 保留 `import()` 语句，该语句用于 Webpack Code Splitting。

