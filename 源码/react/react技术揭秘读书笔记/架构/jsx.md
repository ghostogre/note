所以无法通过引用类型区分`ClassComponent`和`FunctionComponent`。`React`通过`ClassComponent`实例原型上的`isReactComponent`变量判断是否是`ClassComponent`。

```js
ClassComponent.prototype.isReactComponent = {};
```

在深入源码之前，有些疑问我们需要先解决：

- `JSX`和`Fiber节点`是同一个东西么？
- `React Component`、`React Element`是同一个东西么，他们和`JSX`有什么关系？

##  JSX简介

`JSX`在编译时会被`Babel`编译为`React.createElement`方法。

这也是为什么在每个使用`JSX`的JS文件中，你必须显式的声明

```js
import React from 'react';
```

否则在运行时该模块内就会报`未定义变量 React`的错误。

`JSX`并不是只能被编译为`React.createElement`方法，你可以通过`@babel/plugin-transform-react-jsx`插件显式告诉`Babel`编译时需要将`JSX`编译为什么函数的调用（默认为`React.createElement`）。

比如在`preact`这个**类`React`库**中，`JSX`会被编译为一个名为`h`的函数调用。

```jsx
// 编译前
<p>KaSong</p>
// 编译后
h("p", null, "KaSong");
```

## React.createElement

```ts
export function createElement(type, config, children) {
  let propName;

  const props = {};

  let key = null;
  let ref = null;
  let self = null;
  let source = null;

  if (config != null) {
    // 将 config 处理后赋值给 props
    // ...省略
  }

  const childrenLength = arguments.length - 2;
  // 处理 children，会被赋值给props.children
  // ...省略

  // 处理 defaultProps
  // ...省略

  return ReactElement(
    type,
    key,
    ref,
    self,
    source,
    ReactCurrentOwner.current,
    props,
  );
}

const ReactElement = function(type, key, ref, self, source, owner, props) {
  const element = {
    // 标记这是个 React Element
    $$typeof: REACT_ELEMENT_TYPE,

    type: type,
    key: key,
    ref: ref,
    props: props,
    _owner: owner,
  };

  return element;
};
```

我们可以看到，`React.createElement`最终会调用`ReactElement`方法返回一个包含组件数据的对象，该对象有个参数`$$typeof: REACT_ELEMENT_TYPE`标记了该对象是个`React Element`。(需要特殊的标记，标记这是个`React Element`)

`React`提供了验证合法`React Element`的全局API

```ts
export function isValidElement(object) {
  return (
    typeof object === 'object' &&
    object !== null &&
    object.$$typeof === REACT_ELEMENT_TYPE
  );
}
```

`$$typeof === REACT_ELEMENT_TYPE`的非`null`对象就是一个合法的`React Element`。换言之，在`React`中，所有`JSX`在运行时的返回结果（即`React.createElement()`的返回值）都是`React Element`。

那么`JSX`和`React Component`的关系呢?

## React Component

在`React`中，我们常使用`ClassComponent`与`FunctionComponent`构建组件。

```tsx
class AppClass extends React.Component {
  render() {
    return <p>KaSong</p>
  }
}
console.log('这是ClassComponent：', AppClass);
console.log('这是Element：', <AppClass/>);


function AppFunc() {
  return <p>KaSong</p>;
}
console.log('这是FunctionComponent：', AppFunc);
console.log('这是Element：', <AppFunc/>);
```

`ClassComponent`对应的`Element`的`type`字段为`AppClass`自身。

`FunctionComponent`对应的`Element`的`type`字段为`AppFunc`自身：

```js
{
  $$typeof: Symbol(react.element),
  key: null,
  props: {},
  ref: null,
  type: ƒ AppFunc(),
  _owner: null,
  _store: {validated: false},
  _self: null,
  _source: null 
}
```

值得注意的一点，由于

```js
AppClass instanceof Function === true;
AppFunc instanceof Function === true;
```

所以无法通过引用类型区分`ClassComponent`和`FunctionComponent`。`React`通过`ClassComponent`实例原型上的`isReactComponent`变量判断是否是`ClassComponent`。

```js
ClassComponent.prototype.isReactComponent = {};
```

## JSX与Fiber节点

`JSX`是一种描述当前组件内容的数据结构，他不包含组件**schedule**、**reconcile**、**render**所需的相关信息。

比如如下信息就不包括在`JSX`中：

- 组件在更新中的`优先级`
- 组件的`state`
- 组件被打上的用于**Renderer**的`标记`

这些内容都包含在`Fiber节点`中。

所以，在组件`mount`时，`Reconciler`根据`JSX`描述的组件内容生成组件对应的`Fiber节点`。

在`update`时，`Reconciler`将`JSX`与`Fiber节点`保存的数据对比，生成组件对应的`Fiber节点`，并根据对比结果为`Fiber节点`打上`标记`