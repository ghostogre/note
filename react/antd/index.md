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

# 踩坑

1. 使用Table需要指定rowKey（文档上没有明确的写），不然的话控制台会报错，显示必须为每一个列表子项设置一个key。
2. Row的gutter不算在栅格里面的，所以直接使用gutter加栅格就能很好的进行页面布局。
3. `Form`支持name的嵌套，name为一个字符串数组就能表示嵌套的结构，这样就能解决`Form.Item`的嵌套问题。
4. 可编辑的Table，需要传入自定义的Row和Cell。然后编辑和保存字段通过`Form`实现，使用`context`在行和cell之间传递一个form的实例（`const [form] = Form.useForm()`）。
5. 假如需要使用`Cascader`的延迟加载（`loadData`），那么options里需要保证有`isLeaf: false`