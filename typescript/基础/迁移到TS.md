一般来说，将 JavaScript 代码迁移至 TypeScript 包括以下步骤：

- 添加一个 `tsconfig.json` 文件；
- 把文件扩展名从 `.js` 改成 `.ts`，开始使用 `any` 来减少错误；
- 开始在 TypeScript 中写代码，尽可能的减少 `any` 的使用；
- 回到旧代码，开始添加类型注解，并修复已识别的错误；
- 为第三方 JavaScript 代码定义环境声明。

## 第三方代码

可以将 JavaScript 代码改成 TypeScript 代码，但是不能让整个世界都使用 TypeScript。这正是 TypeScript 环境声明支持的地方。创建一个 `vendor.d.ts` 文件作为开始（`.d.ts` 文件扩展名指定这个文件是一个声明文件），然后向文件里添加东西。

几乎排名前 90% 的 JavaScript 库的声明文件存在于 [DefinitelyTyped](https://github.com/borisyankov/DefinitelyTyped) 仓库里，在创建自己定义的声明文件之前，先去仓库中寻找是否有对应的声明文件。

## 额外的非 JavaScript 资源

在 TypeScript 中，甚至可以允许你导入任何文件，例如 `.css` 文件（如果你使用的是 webpack 样式加载器或 css 模块），你只要添加如下代码（放在 `global.d.ts`）：

```typescript
declare module '*.css';
```

现在你可以使用 `import * as foo from './some/file.css'`。

与此相似，如果你想使用 html 模版（例如：angular），你可以：

```typescript
declare module '*.html';
```

##  使用 `@types`

你可以通过 `npm` 来安装使用 `@types`，例如为 `jquery` 添加声明文件：

```bash
npm install @types/jquery --save-dev
```

`@types` 支持全局和模块类型定义。

### 全局 `@types`

默认情况下，TypeScript 会自动包含支持全局使用的任何声明定义。

### 模块 `@types`

安装完之后，不需要特别的配置，你就可以像使用模块一样使用它：

```ts
import * as $ from 'jquery';
```

## 控制全局

可以看出，对于某些团队而言，拥有允许全局使用的定义是一个问题。因此，你可以通过配置 `tsconfig.json` 的 `compilerOptions.types` 选项，引入有意义的类型：

```ts
{
  "compilerOptions": {
    "types" : [
      "jquery"
    ]
  }
}
```

如上例所示，通过配置 `compilerOptions.types: [ "jquery" ]` 后，只允许使用 `jquery` 的 `@types` 包。

