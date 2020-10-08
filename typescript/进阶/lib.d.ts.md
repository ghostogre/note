# lib.d.ts

当你安装 `TypeScript` 时，会顺带安装一个 `lib.d.ts` 声明文件。这个文件包含 JavaScript 运行时以及 DOM 中存在各种常见的环境声明。

- 它自动包含在 TypeScript 项目的编译上下文中；
- 它能让你快速开始书写经过类型检查的 JavaScript 代码。

你可以通过指定 `--noLib` 的编译器命令行标志（或者在 `tsconfig.json` 中指定选项 `noLib: true`）从上下文中排除此文件。这个功能用途：

- 运行的 JavaScript 环境与基于标准浏览器运行时环境有很大不同；
- 你希望在代码里严格的控制全局变量，例如：`lib.d.ts` 将 `item` 定义为全局变量，你不希望它泄漏到你的代码里。

一旦你排除了默认的 `lib.d.ts` 文件，你就可以在编译上下文中包含一个命名相似的文件，TypeScript 将提取该文件进行类型检查。

## `lib.d.ts` 的内容

`lib.d.ts` 的内容主要是一些变量声明（如：`window`、`document`、`math`）和一些类似的接口声明（如：`Window`、`Document`、`Math`）。

寻找代码类型（如：`Math.floor`）的最简单方式是使用 IDE 的 `F12`（跳转到定义）。

## 修改原始类型

在 TypeScript 中，接口是开放式的，这意味着当你想使用不存在的成员时，只需要将它们添加至 `lib.d.ts` 中的接口声明中即可，TypeScript 将会自动接收它。注意，你需要在[全局模块](https://jkchao.github.io/typescript-book-chinese/project/modules.html)中做这些修改，以使这些接口与 `lib.d.ts` 相关联。我们推荐你创建一个称为 `global.d.ts` 的特殊文件。

基于可维护性，我们推荐创建一个 `global.d.ts` 文件。

## `--lib` 选项

有时，你想要解耦编译目标（即生成的 JavaScript 版本）和环境库支持之间的关系。例如对于 Promise，你的编译目标是 `--target es5`，但是你仍然想使用它，这时，你可以使用 `lib` 对它进行控制。

你可以通过命令行或者在 `tsconfig.json` 中提供此选项（推荐）：

### [#](https://jkchao.github.io/typescript-book-chinese/typings/lib.html#命令行)命令行

```bash
tsc --target es5 --lib dom,es6
```

### [#](https://jkchao.github.io/typescript-book-chinese/typings/lib.html#config-json)config.json

```json
"compilerOptions": {
    "lib": ["dom", "es6"]
}
```

> NOTE
>
> `--lib` 选项提供非常精细的控制，因此你最有可能从运行环境与 JavaScript 功能类别中分别选择一项，如果你没有指定 `--lib`，则会导入默认库：
>
> - `--target` 选项为 es5 时，会导入 es5, dom, scripthost。
> - `--target` 选项为 es6 时，会导入 es6, dom, dom.iterable, scripthost。

## 在旧的 JavaScript 引擎时使用 Polyfill

要使用一些新功能如 `Map`、`Set`、`Promise`（随着时间推移会变化），你可以使用现代的 `lib` 选项，并且需要安装 `core-js`：

```bash
npm install core-js --save-dev
```

接着，在你的项目里导入它：

```ts
import 'core-js';
```

