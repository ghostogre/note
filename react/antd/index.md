`antd` 是基于 Ant Design 设计体系的 React UI 组件库，主要用于研发企业级中后台产品。

### 按需加载

`antd` 的 JS 代码默认支持基于 ES modules 的 tree shaking（去除那些引用的但却没有使用的代码）。对于 js 部分，直接引入 `import { Button } from 'antd'` 就会有按需加载的效果。

### TypeScript

`antd` 使用 TypeScript 进行书写并提供了完整的定义文件。（不要引用 `@types/antd`）。

