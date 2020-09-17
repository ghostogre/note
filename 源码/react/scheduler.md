JS 是单线程的，浏览器同一时间只能做一件事情，而肉眼能识别的刷新频率在 60FPS 左右，这意味着我们需要在 16ms 之内完成 Demo 中的三件事：响应用户输入，动画，Dom 渲染。

然而目前几乎所有框架都使用同步渲染模式，这意味着如果一个渲染函数执行时间超过了 16ms，则不可避免的发生卡顿。

总结一下有两个主要问题：

1. 长时间运行的任务造成页面卡顿，我们需要保证所有任务能在几毫秒内完成，这样才能保证页面的流畅。
2. 不同任务优先级不同，比如响应用户输入的任务优先级就高于动画。

>JS 是单线程的，浏览器是多线程的，除了 JS 线程以外，还包括 UI 渲染线程、事件线程、定时器触发线程、HTTP 请求线程等等。JS 线程是可以操作 DOM 的，如果在操作 DOM 的同时 UI 线程也在进行渲染的话，就会发生不可预期的展示结果，因此 JS 线程与 UI 渲染线程是互斥的，每当 JS 线程执行时，UI 渲染线程会挂起，UI 更新会被保存在队列中，等待 JS 线程空闲后立即被执行。对于事件线程而言，当一个事件被触发时该线程会把事件添加到队列末尾，等待 JS 线程空闲后处理。因此，长时间的 JS 持续执行，就会造成 UI 渲染线程长时间地挂起，触发的事件也得不到响应，用户层面就会感知到页面卡顿甚至卡死了，Sync 模式下的问题就由此引起。
>
>注意：我们这里把卡顿问题都归结于 JS 长时间执行，这针对 Concurrent 模式所解决的问题而言，卡顿也有可能是大量 Layout 或是 Paint 造成的。

## React 调度机制

为了解决这个问题，React16 通过 Concurrent（并行渲染） 与 Scheduler（调度）两个角度解决问题：

- **Concurrent：** 将同步的渲染变成可拆解为多步的异步渲染，这样可以将超过 16ms 的渲染代码分几次执行。
- **Scheduler：** 调度系统，支持不同渲染优先级，对 Concurrent 进行调度。当然，调度系统对低优先级任务会不断提高优先级，所以不会出现低优先级任务总得不到执行的情况。

为了保证不产生阻塞的感觉，调度系统会将所有待执行的回调函数存在一份清单中，在每次浏览器渲染时间分片间**尽可能的执行**，并将没有执行完的内容 Hold 住留到**下个分片处理**。

React最内部实现调度其实是使用了`scheduler`这个npm包 (这个包也在React库下面，`/packages/scheduler`这个位置) ，一些这个包的范例代码如下：

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

## 依赖的API和原理

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

`requestIdleCallback` 是在 **Layout 与 Paint 之后执行的，**这也就意味着 `requestIdleCallback `里适合做 JS 计算，如果再进行 DOM 的变更，会重新触发 Layout 与 Paint，帧的时间也会因此不可控，`requestIdleCallback` 的兼容性也比较差。在 React 内部采用 `requestAnimationFrame` 作为 [ployfill](https://github.com/facebook/react/blob/v16.8.0/packages/scheduler/src/Scheduler.js%23L455)，通过 [帧率动态调整](https://github.com/facebook/react/blob/v16.8.0/packages/scheduler/src/Scheduler.js%23L649)，计算 `timeRemaining`，模拟` requestIdleCallback`，从而实现时间分片（Time Slicing），一个时间片就是一个渲染帧内 JS 能获得的最大执行时间。**`requestAnimationFrame` 触发在 Layout 与 Paint 之前，方便做 DOM 变更**。

> 帧的生命周期：输入事件（input event）=> js => 开始一个frame（滚动，缩放，动画等） => 副作用（observer intersection回调，requestAnimationFrame回调）=> Layout (布局) => Paint (绘制)

在 Concurrent 模式下，我们需要思考如下几个问题：

1. 任务如何按时间片拆分、时间片间如何中断与恢复？
2. 任务是怎样设定优先级的？
3. 如何让高优先级任务后生成而先执行，低优先级任务如又何恢复？

在代码中写的 JSX，通过 Babel 或 TS 的处理后，会转化为 `React.createElement`，进一步转化为 Fiber 树，Fiber 树是链表结构。

无论是类组件、函数组件还是宿主组件（HostComponent，在 DOM 环境中就是 DOM 节点，例如 div），在底层都会统一抽象为 **Fiber 节点** ，拥有父节点（parent）、子节点（child）或者兄弟节点（sibling）的引用，方便对于 Fiber 树的遍历，同时组件与 Fiber 节点会建立唯一映射关系。

在组件中通过 [setState](https://github.com/facebook/react/blob/v16.8.0/packages/react-reconciler/src/ReactFiberClassComponent.js%23L184) 来进行更新，根据先前建立好的映射关系找到组件对应 Fiber，在 Fiber 的 updateQueue 中插入一个 update 对象，updateQueue 也是一个链表结构，会记录所属 Fiber 节点上收集到的更新。然后，我们会从触发 setState 的 Fiber 节点，不断 [向上回溯](https://github.com/facebook/react/blob/v16.8.0/packages/react-reconciler/src/ReactFiberScheduler.js%23L1731)，通知沿途上的 Fiber 节点，你有子孙节点被更新了，直至最顶端的 HostRoot。

接着，我们从 HostRoot 开始对 Fiber 树进行**深度优先遍历**。每个 Fiber 节点在遍历到时，若自身存在变更，会根据 Fiber 类型对节点执行创建/更新，其中包含了执行部分生命周期，给 Fiber 节点打上 [effectTag](https://github.com/facebook/react/blob/v16.8.0/packages/shared/ReactSideEffectTags.js) 等操作。effectTag 代表了 Fiber 节点做了怎样的变更，具有 effectTag 的 Fiber 会成为 effect。每个 Fiber 中带有自身子节点的信息，据此来判断是否需要继续向下深度遍历，这个过程被称为 [beginWork](https://github.com/facebook/react/blob/v16.6.0/packages/react-reconciler/src/ReactFiberBeginWork.js%23L1489)。

若不需要再向下遍历，Fiber 节点会开始回溯，判断是否存在兄弟节点需要进行遍历，如果没有，则回溯到父节点，并将自身及自身子树上的 effect 形成 **effect list** 向父节点传递，以此往复，直至 HostRoot，这个过程被称为 [completeUnitOfWork](https://github.com/facebook/react/blob/v16.8.0/packages/react-reconciler/src/ReactFiberScheduler.js%23L947)。

合在一起，就是 [render](https://github.com/facebook/react/blob/v16.8.0/packages/react-reconciler/src/ReactFiberScheduler.js%23L1209) 过程，它是纯粹的 JS 计算，不（应）带有任何“副作用”。

![](/Users/apple/projects/note/源码/react/images/render.jpg)

在 render 过程中，effect 会随着 **completeUnitOfWork** 的过程，不断被 [向上收集](https://github.com/facebook/react/blob/v16.8.0/packages/react-reconciler/src/ReactFiberScheduler.js%23L1007)，最终在 HostRoot 完成所有 effect 收集。它代表着，对于本次更新，我们需要做哪些具体变更。之后我们进入 **[commit](https://github.com/facebook/react/blob/v16.8.0/packages/react-reconciler/src/ReactFiberScheduler.js%23L598) 阶段**，把 effect list 变更到真实的宿主环境中，在浏览器中就是操作 DOM。

## **Concurrent 运行机制**

了解 Fiber 的基本概念和整体流程后，我们再回到那三个与 Concurrent 相关的问题，看看 Concurrent 具体是如何实现的。

**任务如何按时间片拆分、时间片间如何中断与恢复？**

Fiber 树的更新流程**分为 render 阶段与 commit 阶段**，render 阶段的纯粹意味着可以被拆分，在 Sync 模式下，render 阶段一次性执行完成，而在 Concurrent 模式下，render 阶段可以被拆解，每个时间片内分别运行一部分，直至完成，commit 模式由于带有 DOM 更新，不可能 DOM 变更到一半中断，因此必须一次性执行完成。

```
while (当前还有空闲时间 && 下一个节点不为空) {
  下一个节点 = 子节点 = beginWork(当前节点);
  if (子节点为空) {
    下一个节点 = 兄弟节点 = completeUnitOfWork(当前节点);
  }
  当前节点 = 下一个节点;
}
```

Concurrent 模式下，render 阶段遍历 Fiber 树的过程会在上述 while 循环中进行，每结束一次循环就会进行一次时间片的检查，如果时间片到了，while 循环将被 break，相当于 render 过程暂时被中断，当前处理到的节点会被保留下来，等待下一个时间分片到来时，继续处理。

### **任务是怎样划分优先级的（expiration time）？**

**expiration time** 顾名思义是过期时间，在 Fiber 中有两层不同的含义，注意区分：

- 解决调度中经典的**饥饿**（Starvation）问题，假设高优先级任务一直执行，低优先级任务将无法得到执行，我们给低优先级任务设定一个过期时间，**一旦过期后，就需要被当做同步任务，立即执行**，这与 requestIdleCallback 中的 didTimeout 是异曲同工的。
- 代表 update 优先级，**expiration time 越大，优先级越高** ，如果你在其它资料中阅读到 expiration time 越小优先级越高，不要感到诧异，因为这块有过 [变更](https://github.com/facebook/react/pull/13912)。

时间线（time）在 Concurrent 模式下是一个非常重要的概念，当前时间（current time）一方面会与时间片的截止时间（frameDeadline）比较，**告诉当前运行的 JS，是否需要暂停**。另一方面，与 Fiber 的 expiration time 比较，来决定是否需要更新与向下遍历。

上文中 setState 后更新 Fiber 节点会向上回溯到 HostRoot，在此过程中，会更新 Fiber 的 expirationTime，与其祖先节点上的 **childExpirationTime**。

在之后节点遍历过程中：

- 如果 Fiber props 没有变化且 Fiber.expirationTime < currentExpirationTime，说明当前 Fiber 节点本身低优先级或没有变更，不需要执行更新的操作，比如打 effectTag。
- 如果 Fiber.childExpirationTime < currentExpirationTime，说明当前 Fiber 的子孙均为低优先级节点或没有变更，不需要向下继续遍历。

![](/Users/apple/projects/note/源码/react/images/expirationTime.jpg)

具体 expirationTime 的 [设定](https://github.com/facebook/react/blob/v16.8.0/packages/react-reconciler/src/ReactFiberExpirationTime.js)，在 React 内部是这样划分的：

- **Sync** 具有最高优先级
- 异步方面，优先级分为 **InteractiveExpiration** 与 **AsyncExpiration**，同等时刻触发的 InteractiveExpiration 的优先级大于 AsyncExpiration
- **InteractiveExpiration** 一般指在 InteractiveEvent 中触发的更新，例如：`blur`,`click` 等等

React 对外暴露了 `unstable_scheduleCallback` 与 `flushSync` 两个 API，通过它们包裹的 setState 将具有不同的优先级，给开发者手动控制的能力。

```js
unstable_scheduleCallback(() => {
  // 异步低优先级任务，AsyncExpiration
  this.setState();
});
flushSync(() => {
  // 同步任务，最高优先级
  this.setState();
});
onClick={() => {
  // 异步高优先级任务，InteractiveExpiration
  this.setState();
}}
```

### **如何让高优先级任务后生成而先执行，低优先级任务如何恢复？**

高优先级任务在 render 阶段、commit 阶段、时间片间隙均有可能生成，一旦生成，低优先级任务会按**问题 1** 中断，跳出循环，变更全局 currentExpirationTime，从 HostRoot 重新开始遍历。

```js
while (当前还有空闲时间 
  // 不等于说明有更高优先级任务发生
  && 当前 currentExpirationTime === 当前最高优先级任务 expirationTime
  && 下一个节点不为空) {
  ...
}
```

Fiber 节点在变更后会形成 update 对象，带有 expirationTime，插入 updateQueue 中，updateQueue 中所有 update 对象均按照变更（插入）顺序排列，若高优先级 update 与低优先级 update 同处一个队列，对于低优先级的 update 会采用跳过方式处理，来保证 Sync 模式与 Concurrent 模式下，最终变更结果是一致的

当我们优先完成高优先级任务后，还能继续低优先级任务么？不行，高优先级任务的变更可能对低优先级任务产生影响，低优先级任务必须重新来过，之前收集的 effectList 会被重置为 null，updateQueue 会从 current tree 中恢复回来。

React 16 中 componentWillMount 可能被调用多次，原因就在这里，低优先级任务的 render 阶段可能被重复执行，而 componentWillMount 包含在 render 阶段中 (因为每个时间片都会触发render渲染的) 。

> ### [精读《Scheduling in *React*》](https://github.com/dt-fe/weekly/blob/master/99.%E7%B2%BE%E8%AF%BB%E3%80%8AScheduling%20in%20React%E3%80%8B.md)
>
> ### [深入剖析 React Concurrent](https://zhuanlan.zhihu.com/p/60307571)



