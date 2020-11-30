dva 首先是一个基于 [redux](https://github.com/reduxjs/redux) 和 [redux-saga](https://github.com/redux-saga/redux-saga) 的数据流方案，然后为了简化开发体验，dva 还额外内置了 [react-router](https://github.com/ReactTraining/react-router) 和 [fetch](https://github.com/github/fetch)，所以也可以理解为一个轻量级的应用框架。

```
npm install dva-cli -g
```

可以通过 `dva new` 创建新应用。

```
dva new dva-quickstart
```

使用antd

通过 npm 安装 `antd` 和 `babel-plugin-import` 。`babel-plugin-import` 是用来按需加载 antd 的脚本和样式的

```
npm install antd babel-plugin-import --save
```

编辑 `.webpackrc`，使 `babel-plugin-import` 插件生效。

```
{
  "extraBabelPlugins": [
    ["import", { "libraryName": "antd", "libraryDirectory": "es", "style": "css" }]
  ]
}
```

```jsx
// { "libraryName": "antd", style: true }
// style设置为css就是定位到style/css目录下
import { Button } from 'antd';
ReactDOM.render(<Button>xxxx</Button>);

      ↓ ↓ ↓ ↓ ↓ ↓

var _button = require('antd/lib/button');
require('antd/lib/button/style');
ReactDOM.render(<_button>xxxx</_button>);
```



## 定义 Model

dva 通过 model 的概念把一个领域的模型管理起来，包含同步更新 state 的 reducers，处理异步逻辑的 effects，订阅数据源的 subscriptions 。

新建 model `models/products.js` ：

```js
export default {
  namespace: 'products',
  state: [],
  reducers: {
    'delete'(state, { payload: id }) {
      return state.filter(item => item.id !== id);
    },
  },
};
```

这个 model 里：

- `namespace` 表示在全局 state 上的 key
- `state` 是初始值，在这里是空数组
- `reducers` 等同于 redux 里的 reducer，接收 action，同步更新 state

然后别忘记在 `index.js` 里载入他：

```diff
// 3. Model
+ app.model(require('./models/products').default);
```

## connect 起来

到这里，我们已经单独完成了 model 和 component，那么他们如何串联起来呢?

dva 提供了 connect 方法。如果你熟悉 redux，这个 connect 就是 react-redux 的 connect 。

编辑 `routes/Products.js`，替换为以下内容：

```jsx
import React from 'react';
import { connect } from 'dva';
import ProductList from '../components/ProductList';

const Products = ({ dispatch, products }) => {
  function handleDelete(id) {
    dispatch({
      type: 'products/delete',
      payload: id,
    });
  }
  return (
    <div>
      <h2>List of Products</h2>
      <ProductList onDelete={handleDelete} products={products} />
    </div>
  );
};

// export default Products;
export default connect(({ products }) => ({
  products,
}))(Products);
```

最后，我们还需要一些初始数据让这个应用 run 起来。编辑 `index.js`：

```diff
- const app = dva();
+ const app = dva({
+   initialState: {
+     products: [
+       { name: 'dva', id: 1 },
+       { name: 'antd', id: 2 },
+     ],
+   },
+ });
```

# Dva 概念

## 数据流向

数据的改变发生通常是通过用户交互行为或者浏览器行为（如路由跳转等）触发的，当此类行为会改变数据的时候可以通过 `dispatch` 发起一个 action，如果是同步行为会直接通过 `Reducers` 改变 `State` ，如果是异步行为（副作用）会先触发 `Effects` 然后流向 `Reducers` 最终改变 `State`

### State

```
type State = any
```

State 表示 Model 的状态数据，通常表现为一个 javascript 对象（当然它可以是任何值）；操作的时候每次都要当作**不可变数据**（immutable data）来对待，保证每次都是全新对象，没有引用关系，这样才能保证 State 的独立性，便于测试和追踪变化。

在 dva 中你可以通过 dva 的实例属性 `_store` 看到顶部的 state 数据，但是通常你很少会用到:

```javascript
const app = dva();
console.log(app._store); // 顶部的 state 数据
```

### Action

```
type AsyncAction = any
```

Action 是一个普通 javascript 对象，它是改变 State 的唯一途径。无论是从 UI 事件、网络回调，还是 WebSocket 等数据源所获得的数据，最终都会通过 dispatch 函数调用一个 action，从而改变对应的数据。action 必须带有 `type` 属性指明具体的行为，其它字段可以自定义，如果要发起一个 action 需要使用 `dispatch` 函数；**需要注意的是 `dispatch` 是在组件 connect Models以后，通过 props 传入的。**

```js
dispatch({
  type: 'add',
});
```

### dispatch 函数

```
type dispatch = (a: Action) => Action
```

dispatching function 是一个用于触发 action 的函数，action 是改变 State 的唯一途径，但是它只描述了一个行为，而 dipatch 可以看作是触发这个行为的方式，而 Reducer 则是描述如何改变数据的。

在 dva 中，connect Model 的组件通过 props 可以访问到 dispatch，可以调用 Model 中的 Reducer 或者 Effects，常见的形式如：

```javascript
dispatch({
  type: 'user/add', // 如果在 model 外调用，需要添加 namespace
  payload: {}, // 需要传递的信息
});
```

### Reducer

```
type Reducer = (state: S, action: A) => S
```

Reducer 函数接受两个参数：之前已经累积运算的结果和当前要被累积的值，返回的是一个新的累积结果。该函数把一个集合归并成一个单值。

在 dva 中，reducers 聚合积累的结果是当前 model 的 state 对象。通过 actions 中传入的值，与当前 reducers 中的值进行运算获得新的值（也就是新的 state）。需要注意的是 Reducer 必须是[纯函数](https://github.com/MostlyAdequate/mostly-adequate-guide/blob/master/ch3.md)，所以同样的输入必然得到同样的输出，它们不应该产生任何副作用。并且，每一次的计算都应该使用[immutable data](https://github.com/MostlyAdequate/mostly-adequate-guide/blob/master/ch3.md#reasonable)，这种特性简单理解就是每次操作都是返回一个全新的数据（独立，纯净），所以热重载和时间旅行这些功能才能够使用。

### Effect

Effect 被称为副作用，在我们的应用中，最常见的就是异步操作。它来自于函数编程的概念，之所以叫副作用是因为它使得我们的函数变得不纯，同样的输入不一定获得同样的输出。

dva 为了控制副作用的操作，底层引入了[redux-sagas](http://superraytin.github.io/redux-saga-in-chinese)做异步流程控制，由于采用了[generator的相关概念](http://www.ruanyifeng.com/blog/2015/04/generator.html)，所以将异步转成同步写法，从而将effects转为纯函数。

### Subscription

Subscriptions 是一种从 **源** 获取数据的方法，它来自于 elm。

Subscription 语义是订阅，用于订阅一个数据源，然后根据条件 dispatch 需要的 action。数据源可以是当前的时间、服务器的 websocket 连接、keyboard 输入、geolocation 变化、history 路由变化等等。

```js
import key from 'keymaster';
...
app.model({
  namespace: 'count',
  subscriptions: {
    keyEvent({dispatch}) {
      key('⌘+up, ctrl+up', () => { dispatch({type:'add'}) });
    },
  }
});
```

## Router

这里的路由通常指的是前端路由，由于我们的应用现在通常是单页应用，所以需要前端代码来控制路由逻辑，通过浏览器提供的 [History API](http://mdn.beonex.com/en/DOM/window.history.html) 可以监听浏览器url的变化，从而控制路由相关操作。

dva 实例提供了 router 方法来控制路由，使用的是[react-router](https://github.com/reactjs/react-router)

```jsx
import { Router, Route } from 'dva/router';
app.router(({history}) =>
  <Router history={history}>
    <Route path="/" component={HomePage} />
  </Router>
);
```

在 dva 中，通常需要 connect Model的组件都是 Route Components，组织在`/routes/`目录下，而`/components/`目录下则是纯组件。

## React 没有解决的问题

React 本身只是一个 DOM 的抽象层，使用组件构建虚拟 DOM。

如果开发大应用，还需要解决一个问题。

- 通信：组件之间如何通信？
- 数据流：数据如何和视图串联起来？路由和数据如何绑定？如何编写异步逻辑？等等

## 通信问题

组件会发生三种通信。

- 向子组件发消息
- 向父组件发消息
- 向其他组件发消息

React 只提供了一种通信手段：传参。对于大应用，很不方便。

## 数据流问题

目前流行的数据流方案有：

- Flux，单向数据流方案，以 [Redux](https://github.com/reactjs/redux) 为代表
- Reactive，响应式数据流方案，以 [Mobx](https://github.com/mobxjs/mobx) 为代表
- 其他，比如 rxjs 等

##  dva 是什么

dva = React-Router + Redux + Redux-saga

## dva 应用的最简结构

```jsx
import dva from 'dva';
const App = () => <div>Hello dva</div>;

// 创建应用
const app = dva();
// 注册视图
app.router(() => <App />);
// 启动应用
app.start('#root');
```

- State：一个对象，保存整个应用状态
- View：React 组件构成的视图层
- Action：一个对象，描述事件
- connect 方法：一个函数，绑定 State 到 View
- dispatch 方法：一个函数，发送 Action 到 State

## dva 应用的最简结构（带 model)

```js
// 创建应用
const app = dva();

// 注册 Model
app.model({
  namespace: 'count',
  state: 0,
  reducers: {
    add(state) { return state + 1 },
  },
  effects: {
    *addAfter1Second(action, { call, put }) {
      yield call(delay, 1000);
      yield put({ type: 'add' });
    },
  },
});

// 注册视图
app.router(() => <ConnectedApp />);

// 启动应用
app.start('#root');
```

## app.model

dva 提供 app.model 这个对象，所有的应用逻辑都定义在它上面。

```js
const app = dva();

// 新增这一行
app.model({ /**/ });

app.router(() => <App />);
app.start('#root');
```

## Model 对象的属性

- namespace: 当前 Model 的名称。整个应用的 State，由多个小的 Model 的 State 以 namespace 为 key 合成
- state: 该 Model 当前的状态。数据保存在这里，直接决定了视图层的输出
- reducers: Action 处理器，处理同步动作，用来算出最新的 State
- effects：Action 处理器，处理异步动作

## Effect

Action 处理器，处理异步动作，基于 Redux-saga 实现。Effect 指的是副作用。根据函数式编程，计算以外的操作都属于 Effect，典型的就是 I/O 操作、数据库读写。

## Generator 函数

Effect 是一个 Generator 函数，内部使用 yield 关键字，标识每一步的操作（不管是异步或同步）。

## call 和 put

dva 提供多个 effect 函数内部的处理函数，比较常用的是 `call` 和 `put`。

- call：执行异步函数
- put：发出一个 Action，类似于 dispatch