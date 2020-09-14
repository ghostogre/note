JS 是单线程的，浏览器同一时间只能做一件事情，而肉眼能识别的刷新频率在 60FPS 左右，这意味着我们需要在 16ms 之内完成 Demo 中的三件事：响应用户输入，动画，Dom 渲染。

然而目前几乎所有框架都使用同步渲染模式，这意味着如果一个渲染函数执行时间超过了 16ms，则不可避免的发生卡顿。

总结一下有两个主要问题：

1. 长时间运行的任务造成页面卡顿，我们需要保证所有任务能在几毫秒内完成，这样才能保证页面的流畅。
2. 不同任务优先级不同，比如响应用户输入的任务优先级就高于动画。

>JS 是单线程的，浏览器是多线程的，除了 JS 线程以外，还包括 UI 渲染线程、事件线程、定时器触发线程、HTTP 请求线程等等。JS 线程是可以操作 DOM 的，如果在操作 DOM 的同时 UI 线程也在进行渲染的话，就会发生不可预期的展示结果，因此 JS 线程与 UI 渲染线程是互斥的，每当 JS 线程执行时，UI 渲染线程会挂起，UI 更新会被保存在队列中，等待 JS 线程空闲后立即被执行。对于事件线程而言，当一个事件被触发时该线程会把事件添加到队列末尾，等待 JS 线程空闲后处理。因此，长时间的 JS 持续执行，就会造成 UI 渲染线程长时间地挂起，触发的事件也得不到响应，用户层面就会感知到页面卡顿甚至卡死了，Sync 模式下的问题就由此引起。

## React 调度机制

为了解决这个问题，React16 通过 Concurrent（并行渲染） 与 Scheduler（调度）两个角度解决问题：

- **Concurrent：** 将同步的渲染变成可拆解为多步的异步渲染，这样可以将超过 16ms 的渲染代码分几次执行。
- **Scheduler：** 调度系统，支持不同渲染优先级，对 Concurrent 进行调度。当然，调度系统对低优先级任务会不断提高优先级，所以不会出现低优先级任务总得不到执行的情况。

为了保证不产生阻塞的感觉，调度系统会将所有待执行的回调函数存在一份清单中，在每次浏览器渲染时间分片间**尽可能的执行**，并将没有执行完的内容 Hold 住留到**下个分片处理**。

React最内部实现调度其实是使用了`scheduler`这个npm包，一些这个包的范例代码如下：

```jsx
import { unstable_next } from "scheduler";

function SearchBox(props) {
  const [inputValue, setInputValue] = React.useState();

  function handleChange(event) {
    const value = event.target.value;

    setInputValue(value);
    unstable_next(function() {
      props.onChange(value);
      sendAnalyticsNotification(value);
    });
  }

  return <input type="text" value={inputValue} onChange={handleChange} />;
}
```

在 `unstable_next()` 作用域下的代码优先级是 `Normal`，那么产生的效果是：

1. 如果 `props.onChange(value)` 可以在 16ms 内执行完，则与不使用 `unstable_next` 没有区别。
2. 如果 `props.onChange(value)` 的执行时间过长，可能这个函数会在下次几次的 Render 中陆续执行，不会阻塞后续的高优先级任务。

## 调度带来的限制

调度系统也存在两个问题。

1. 调度系统只能有一个，如果同时存在两个调度系统，就无法保证调度正确性。
2. 调度系统能力有限，只能在浏览器提供的能力范围内进行调度，而无法影响比如 Html 的渲染、回收周期。

**一次 Render 一般涉及到许多子节点，而 Fiber 架构在 Render 阶段可以暂停，一个一个节点的执行，从而实现了调度的能力。**

## 为什么会有 Function Component和hooks

为了配合 React Schedule 的实现，使用 Function Component 模式编写组件是很重要的，因为：

1. Class Component 的生命周期概念阻碍了 React 调度系统对任务的拆分。
2. 调度系统可能对 `componentWillMount` 重复调用，使得 Class Component 模式下很容易写出错误的代码。
3. Function Component 遵循了更严格的副作用分离，这使得 Concurrent 执行过程不会引发意外效果。

## React.lazy

与 Concurrent 一起发布的，还有 React 组件动态 import 与载入方案。

如果使用了 `import()` 动态载入，可以使用 `React.lazy` 让动态引入的组件像普通组件一样被使用：

```jsx
const OtherComponent = React.lazy(() => import("./OtherComponent"));

function MyComponent() {
  return (
    <div>
      <OtherComponent />
    </div>
  );
}
```

如果要加入 Loading，就可以配合 `Suspense` 一起使用：

```jsx
import React, { lazy, Suspense } from "react";
// Suspense实现所谓的延迟加载效果
const OtherComponent = lazy(() => import("./OtherComponent"));

function MyComponent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OtherComponent />
    </Suspense>
  );
}
```

和 Concurrent 类似，React.lazy 方案也是一种对性能有益的组件加载方案。

## 调度分类

调度分 4 个等级：

- **Immediate**：立即执行，最高优先级。
- **render-blocking**：会阻塞渲染的优先级，优先级类似 `requestAnimationFrame`。如果这种优先级任务不能被执行，就可能导致 UI 渲染被 block。
- **default**：默认优先级，普通的优先级。优先级可以理解为 `setTimeout(0)` 的优先级。
- **idle**：比如通知等任务，用户看不到或者不在意的。

目前建议的 API 类似如下：

```js
function mytask() {
  ...
}

myQueue = TaskQueue.default("render-blocking")
```

先创建一个执行队列，并设置队列的优先级。

```js
taskId = myQueue.postTask(myTask, <list of args>);
```

再提交队列，拿到当前队列的执行 id，通过这个 id 可以判断队列何时执行完毕。

```js
myQueue.cancelTask(taskId);
```

必要的时候可以取消某个函数的执行。

## 实现的API

requestIdleCallback 就能够充分利用帧与帧之间的空闲时间来执行 JS，可以根据 callback 传入的 dealine 判断当前是否还有空闲时间（timeRemaining）用于执行。由于浏览器可能始终处于繁忙的状态，导致 callback 一直无法执行，它还能够设置超时时间（timeout），一旦超过时间（didTimeout）能使任务被强制执行。

```js
// 浏览器执行线程空闲时间调用 myWork，超过 2000ms 后立即必须执行
requestIdleCallback(myWork, { timeout: 2000 });

function myWork(deadline) {
  // 如果有剩余时间，或者任务已经超时，并且存在任务就需要执行
  while ((deadline.timeRemaining() > 0 || deadline.didTimeout)
    && tasks.length > 0) {
    doWorkIfNeeded(); // 执行需要做的任务
  }
  // 当前存在任务，再次调用 requestIdleCallback，会在空闲时间执行 myWork
  if (tasks.length > 0) {
    requestIdleCallback(myWork, { timeout: 2000 });
  }
}
```

`requestIdleCallback` 是在 **Layout 与 Paint 之后执行的，**这也就意味着 `requestIdleCallback `里适合做 JS 计算，如果再进行 DOM 的变更，会重新触发 Layout 与 Paint，帧的时间也会因此不可控，`requestIdleCallback` 的兼容性也比较差。在 React 内部采用 `requestAnimationFrame` 作为 [ployfill](https://link.zhihu.com/?target=https%3A//github.com/facebook/react/blob/v16.8.0/packages/scheduler/src/Scheduler.js%23L455)，通过 [帧率动态调整](https://link.zhihu.com/?target=https%3A//github.com/facebook/react/blob/v16.8.0/packages/scheduler/src/Scheduler.js%23L649)，计算 `timeRemaining`，模拟` requestIdleCallback`，从而实现时间分片（Time Slicing），一个时间片就是一个渲染帧内 JS 能获得的最大执行时间。**`requestAnimationFrame` 触发在 Layout 与 Paint 之前，方便做 DOM 变更**。

注意：我们这里把卡顿问题都归结于 JS 长时间执行，这针对 Concurrent 模式所解决的问题而言，卡顿也有可能是大量 Layout 或是 Paint 造成的。

在 Concurrent 模式下，我们需要思考如下几个问题：

1. 任务如何按时间片拆分、时间片间如何中断与恢复？
2. 任务是怎样设定优先级的？
3. 如何让高优先级任务后生成而先执行，低优先级任务如又何恢复？

在代码中写的 JSX，通过 Babel 或 TS 的处理后，会转化为 `React.createElement`，进一步转化为 Fiber 树，Fiber 树是链表结构。



> ### [精读《Scheduling in *React*》](https://github.com/dt-fe/weekly/blob/master/99.%E7%B2%BE%E8%AF%BB%E3%80%8AScheduling%20in%20React%E3%80%8B.md)
>
> ### [深入剖析 React Concurrent](https://zhuanlan.zhihu.com/p/60307571)



