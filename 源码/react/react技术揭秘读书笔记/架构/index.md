# react理念

### 速度快

相比于使用模版语言的`Vue`、`Angular`，使用原生js（`JSX`仅仅是js的语法糖）开发UI的`React`在语法层面有更多灵活性。

然而，高灵活性意味着高不确定性。考虑如下`Vue`模版语句：

```vue
<template>
    <ul>
        <li>0</li>
        <li>{{ name }}</li>
        <li>2</li>
        <li>3</li>
    </ul>
</template>
```

当编译时，由于模版语法的约束，`Vue`可以明确知道在`li`中，只有`name`是变量，这可以提供一些优化线索。

而在`React`中，以上代码可以写成如下`JSX`：

```js
function App({name}) {
    const children = [];
    for (let i = 0; i < 4; i++) {
        children.push(<li>{i === 1 ? name : i}</li>)
    }
    return <ul>{children}</ul>
}
```

由于语法的灵活，在编译时无法区分可能变化的部分。所以在运行时，`React`需要遍历每个`li`，判断其数据是否更新。

基于以上原因，相比于`Vue`、`Angular`，缺少编译时优化手段的`React`为了**速度快**需要在运行时做出更多努力。

比如

- 使用`PureComponent`或`React.memo`构建组件
- 使用`shouldComponentUpdate`生命周期钩子
- 渲染列表时使用`key`
- 使用`useCallback`和`useMemo`缓存函数和变量

由开发者来显式的告诉`React`哪些组件不需要重复计算、可以复用。

### 响应自然

例如地址搜索框，在输入字符时会实时显示地址匹配结果。

当用户输入过快时可能输入变得不是那么流畅。这是由于下拉列表的更新会阻塞线程。我们一般是通过`debounce`或 `throttle`来减少输入内容时触发回调的次数来解决这个问题。

但这只是治标不治本。只要组件的更新操作是同步的，那么当更新开始直到渲染完毕前，组件中总会有一定数量的工作占用线程，浏览器没有空闲时间绘制UI，造成卡顿。

让我们从“响应自然”的角度考虑：当输入字符时，用户是否在意下拉框能在一瞬间就更新？事实是：并不在意。

如果我们能稍稍延迟下拉框更新的时间，为浏览器留出时间渲染UI，让输入不卡顿。这样的体验是更**自然**的。

为了实现这个目标，需要将**同步的更新**变为**可中断的异步更新**。

在浏览器每一帧的时间中，预留一些时间给JS线程，`React`利用这部分时间更新组件（可以看到，在[源码 (opens new window)](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/scheduler/src/forks/SchedulerHostConfig.default.js#L119)中，预留的初始时间是5ms）。

当预留的时间不够用时，`React`将线程控制权交还给浏览器使其有时间渲染UI，`React`则等待下一帧时间到来继续被中断的工作。

> 
>
>  https://react.iamkasong.com