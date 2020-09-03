`antd` 是基于 Ant Design 设计体系的 React UI 组件库，主要用于研发企业级中后台产品。

### 按需加载

`antd` 的 JS 代码默认支持基于 ES modules 的 tree shaking（去除那些引用的但却没有使用的代码）。对于 js 部分，直接引入 `import { Button } from 'antd'` 就会有按需加载的效果。

### TypeScript

`antd` 使用 TypeScript 进行书写并提供了完整的定义文件。（不要引用 `@types/antd`）。

`antd` 使用 TypeScript 书写并提供了完整的定义，你可以享受组件属性输入建议和定义检查的功能。

> 注意不要安装 `@types/antd`。

### Umi

`@umijs/plugin-model` 是一种基于 hooks 范式的简单数据流方案，可以在一定情况下替代 dva 来进行中台的全局数据流。

### 替换moment

可以用自定义日期库（[day.js](https://day.js.org/)、[date-fns](https://date-fns.org/)）替换 Moment 以优化打包大小。

