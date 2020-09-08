### 路由/布局

路由和菜单路由为了方便管理，使用了中心化的方式，在 `config.ts` 统一配置和管理。

> 与vue-router，react-router不同，antd pro的路由嵌套的时候也不能省略前缀路由。

### Pro Layout 组件

集成了菜单，布局，页头，面包屑，设置抽屉等多种功能。

脚手架默认提供了两种布局模板：`基础布局 - BasicLayout` 以及 `账户相关布局 - UserLayout`

### PageHeaderWrapper组件

PageHeaderWrapper 封装了 ant design 的 PageHeader 组件，增加了 tabList，和 content。

#### 在菜单中使用自定义图标

只需要直接在 icon 属性上配置即可，如果是个 url，Pro 会自动处理为一个 img 标签。

## 测试

jest 是一个 node 端运行的测试框架，使用了 jsdom 来模拟 DOM 环境，适合用于快速测试 React 组件的逻辑表现

```js
import React from 'react';
import { shallow } from 'enzyme';
import Success from './Success'; // 引入对应的 React 组件

it('renders with Result', () => {
  const wrapper = shallow(<Success />); // 进行渲染
  expect(wrapper.find('Result').length).toBe(1); // 有 Result 组件
  expect(wrapper.find('Result').prop('type')).toBe('success'); // Result 组件的类型是成功
});
```

使用了 `enzyme` 作为测试库，它提供了大量实用的 API 来帮助我们测试 React 组件。断言部分沿用了 jest 默认的 `jasmine2 expect 语法`。

### 测试 dva 包装组件

被 dva `connect` 的 React 组件可以使用下面方式进行测试

```jsx
import React from 'react';
import { shallow } from 'enzyme';
import Dashboard from './Dashboard';

it('renders Dashboard', () => {
  // 使用包装后的组件
  const wrapper = shallow(<Dashboard.WrappedComponent user={{ list: [] }} />);
  expect(wrapper.find('Table').props().dataSource).toEqual([]);
});
```

### e2e 测试(puppeteer)

端到端测试也叫冒烟测试，用于测试真实浏览器环境下前端应用的流程和表现，相当于代替人工去操作应用。

### 聚焦和忽略用例

使用 `xit()` 取代 `it()` 可以暂时忽略用例，`fit()` 可以聚焦当前用例并忽略其他所有用例。

