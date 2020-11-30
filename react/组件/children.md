实现组件复用可以使用`children`传一个函数（类似taro的virtualList组件，自定义列表元素的写法）。

`children` 常用的类型是字符串、对象甚至数组。但其实我们也可以传入一个函数，只要最终能返回出DOM 树即可；

例如下面的例子，使用 Render props 将 Render 部分抽离出来作为函数传入子组件；它主要的作用是将 state 部分抽成组件，实现 state 的复用。

```jsx
// 子组件 SayHello.js
import React, { useState } from 'react';
function sayHello({ children }) {
  const [visible, changeVisible] = useState(false);
   const jsx = visible && (
    <h1 onClick={() => changeVisible(false)}> Hello Hook! </h1>
  );
  return children({ changeVisible, jsx });
}
export default sayHello;

// 父组件 ShowHook.js
import React, { Component, Fragment } from 'react';
import SayHello from '../components/SayHello';
export default class ShowHook extends Component {
  render() {
    return (
      <SayHello>
        {({ changeVisible, jsx }) => {
          return (
            <React.Fragment>
              <button onClick={() => changeVisible(true)}>
                showChild
              </button>
              {jsx}
            </React.Fragment>
          );
        }}
      </SayHello>
    );
  }
}
```



