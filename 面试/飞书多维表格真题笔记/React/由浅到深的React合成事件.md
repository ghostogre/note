# 由浅到深的React合成事件

> 文章是2019年11月的，和现在版本可能不同

## 后续需要的几个功能函数

```js
// 作用：如果只是单个next，则直接返回，如果有数组，返回合成的数组，里面有个
// current.push.apply(current, next)可以学习一下，这样组合数组比concat效率更高

// 栗子：input accumulateInto([],[]）

function accumulateInto(current, next) {
  if (current == null) {
    return next;
  }

  // Both are not empty. Warning: Never call x.concat(y) when you are not
  // certain that x is an Array (x could be a string with concat method).
  if (Array.isArray(current)) {
    if (Array.isArray(next)) {
      current.push.apply(current, next);
      return current;
    }
    current.push(next);
    return current;
  }

  if (Array.isArray(next)) {
    // A bit too dangerous to mutate `next`.
    return [current].concat(next);
  }

  return [current, next];
}

// 这个其实就是用来执行函数的，当arr时数组的时候，arr里的每一个项都作为回调函数cb的参数执行;
// 如果不是数组，直接执行回调函数cb,参数为arr
// 例如：
// arr为数组：forEachAccumulated（[1,2,3], (item) => {console.log(item), this}）
// 此时会打印出 1，2，3
// arr不为数组，forEachAccumulated（1, (item) => {console.log(item), this}）
// 此时会打印出 1
function forEachAccumulated(arr, cb, scope) {
  if (Array.isArray(arr)) {
    arr.forEach(cb, scope);
  } else if (arr) {
    cb.call(scope, arr);
  }
}
```



## 从需求开始

需要做一个弹窗`打开/关闭` 的功能，当点击 `button` 的时候打开，此时打开的情况下，点击弹窗区域外，就需要关闭（其实大多数情况是点击遮罩关闭，这里就没有遮罩了）。

直接在 `button` 上注册一个点击事件，同时在 `document.body` 注册一个点击事件，然后在弹窗 `container` 里阻止冒泡。

```jsx
class FuckEvent extends React.PureComponent {
  state = {
    showBox: false
  }
  componentDidMount() {
    document.body.addEventListener('click', this.handleClickBody, false)
  }
  componentWillUnmount() {
    document.body.removeEventListener('click', this.handleClickBody, false)
  }
  handleClickBody = () => {
    this.setState({
      showBox: false
    })
  }
  handleClickButton = () => {
    this.setState({
      showBox: true
    })
  }

  render() {
    return (
      <div>
        <button onClick={this.handleClickButton}>点击我显示弹窗</button>

        {this.state.showBox && (
          <div onClick={e => e.stopPropagation()}>我是弹窗</div>
        )}
      </div>
    )
  }
}
```

但是这样点击弹窗区域，弹窗也被关闭了。

## 事件委托

事件委托解决了庞大的数据列表时，无需为每个列表项绑定事件监听。同时可以动态挂载元素无需作额外的事件监听处理。

react使用了事件委托，它接管了浏览器事件的优化策略，然后自身实现了一套自己的事件机制，并且抹平了各个浏览器的差异。

React 实现了一个**合成事件层**，就是这个事件层，把 IE 和 W3C 标准之间的兼容问题给消除了。

**什么是合成事件与原生事件????**

- **原生事件**：在 `componentDidMount生命周期`里边进行`addEventListener`绑定的事件
- **合成事件**：通过 JSX 方式绑定的事件，比如 `onClick={() => this.handle()}`

**合成事件的触发是基于浏览器的事件机制来实现的，通过冒泡机制冒泡到最顶层元素，然后再由 dispatchEvent 统一去处理**

此时对于合成事件进行阻止，原生事件会执行吗？答案是: 会！所以上面的点击弹窗区域也会关闭弹窗。

因为原生事件先于合成事件执行 (一种说法是: 注册的原生事件已经执行，而合成事件处于目标阶段，它阻止的冒泡只是阻止合成的事件冒泡，但是原生事件在捕获阶段就已经执行了)

## 合成事件特点

React 自己实现了这么一套事件机制，它在 DOM 事件体系基础上做了改进，减少了内存的消耗，并且最大程度上解决了 IE 等浏览器的不兼容问题。

那它有什么特点？

- React 上注册的事件最终会绑定在`document`这个 DOM 上，而不是 React 组件对应的 DOM(减少内存开销就是因为所有的事件都绑定在 document 上，其他节点没有绑定事件)
- React 自身实现了一套事件冒泡机制，所以这也就是为什么我们 `event.stopPropagation()` 无效的原因。
- React 通过队列的形式，从触发的组件向父组件回溯，然后调用他们 JSX 中定义的 callback
- React 有一套自己的合成事件 `SyntheticEvent`，不是原生的，这个可以自己去看官网
- React 通过对象池的形式管理合成事件对象的创建和销毁，减少了垃圾的生成和新对象内存的分配，提高了性能

## React 事件系统

在源码中的 `ReactBrowserEventEmitter.js` 文件中可以看到，React 合成系统框架图

```
/**
 * React和事件系统概述:
 *
 * +------------+    .
 * |    DOM     |    .
 * +------------+    .
 *       |           .
 *       v           .
 * +------------+    .
 * | ReactEvent |    .
 * |  Listener  |    .
 * +------------+    .                         +-----------+
 *       |           .               +--------+|SimpleEvent|
 *       |           .               |         |Plugin     |
 * +-----|------+    .               v         +-----------+
 * |     |      |    .    +--------------+                    +------------+
 * |     +-----------.--->|EventPluginHub|                    |    Event   |
 * |            |    .    |              |     +-----------+  | Propagators|
 * | ReactEvent |    .    |              |     |TapEvent   |  |------------|
 * |  Emitter   |    .    |              |<---+|Plugin     |  |other plugin|
 * |            |    .    |              |     +-----------+  |  utilities |
 * |     +-----------.--->|              |                    +------------+
 * |     |      |    .    +--------------+
 * +-----|------+    .                ^        +-----------+
 *       |           .                |        |Enter/Leave|
 *       +           .                +-------+|Plugin     |
 * +-------------+   .                         +-----------+
 * | application |   .
 * |-------------|   .
 * |             |   .
 * |             |   .
 * +-------------+   .
 *                   .
 */
```

- **ReactEventListener**：负责事件的注册。
- **ReactEventEmitter**：负责事件的分发。
- **EventPluginHub**：负责事件的存储及分发。
- **Plugin**：根据不同的事件类型构造不同的合成事件。

源码里的英文注释：

- **Top-level delegation** 用于捕获最原始的浏览器事件，它主要由 ReactEventListener 负责，ReactEventListener 被注入后可以支持插件化的事件源，这一过程发生在主线程。
- React 对事件进行规范化和重复数据删除，以解决浏览器的差异和版本问题。这可以在工作线程中完成。
- 将这些本地事件（具有关联的顶级类型用来捕获它）转发到`EventPluginHub`，后者将询问插件是否要提取任何合成事件。
- 然后，EventPluginHub 将通过为每个事件添加“dispatches”（关心该事件的侦听器和 ID 的序列）来对其进行注释来进行处理。
- 再接着，EventPluginHub 会调度分派事件.

## 事件注册

```jsx
onClick={() => {
  console.log('我是注册事件')
}}
```

它是如何被注册到 React 事件系统中的？

### enqueuePutListener()

组件在创建 mountComponent 和更新 updateComponent 的时候，都会调用 `_updateDOMProperties()` 方法

> react 15.6.1 的源码

```js
/** mountComponent */
mountComponent: function(transaction, hostParent, hostContainerInfo, context) {
  // ...
  var props = this._currentElement.props;
  // ...
  this._updateDOMProperties(null, props, transaction);
  // ...
}
```

```js
_updateDOMProperties: function (lastProps, nextProps, transaction) {
  	// 如同函数名称，我们可以很清楚的知道这是更新DOM的props
    // ...
  	// 遍历nextProps
    for (propKey in nextProps) {
      var nextProp = nextProps[propKey];
      // lastProp是更新前的prop的值，对于style特殊处理
      var lastProp = propKey === STYLE ? this._previousStyleCopy : lastProps != null ? lastProps[propKey] : undefined;
      if (!nextProps.hasOwnProperty(propKey) || nextProp === lastProp || nextProp == null && lastProp == null) {
        // PS：x || y && z 等价于 x || ( y && z )，因为前面 || 的条件为 true 会终止后面的判断。
        // 如果propKey来自于nextProps的继承链上而不是nextProps本身（这里防止了获取到的是继承链上的属性），或者没有改变props，或者nextProp和lastProp为null，跳过后续更新步骤
        continue;
      }
      if (propKey === STYLE) {
        // ...
      } else if (registrationNameModules.hasOwnProperty(propKey)) {
        // 如果是props这个对象直接声明的属性，而不是从原型链中继承而来的，则处理它
        // 对于mountComponent，lastProp为null
        // updateComponent二者都不为null
        // unmountComponent则nextProp为null
        if (nextProp) { // nextProp 不为 null，也就是说不是卸载删除
          // mountComponent和updateComponent中，enqueuePutListener注册事件
          enqueuePutListener(this, propKey, nextProp, transaction);
        } else if (lastProp) { // 没有nextProp，卸载删除
          // unmountComponent中，删除注册的listener，防止内存泄漏
          deleteListener(this, propKey);
        }
      }
    }
}
```

通过 `enqueuePutListener()` 方法进行注册事件：

```js
function enqueuePutListener(inst, registrationName, listener, transaction) {
  if (transaction instanceof ReactServerRenderingTransaction) {
    /** 服务器渲染直接返回 */
    return
  }
  var containerInfo = inst._hostContainerInfo
  /* 判断是否是 documentFragment */
  var isDocumentFragment =
    containerInfo._node && containerInfo._node.nodeType === DOC_FRAGMENT_TYPE
  // 找到document
  var doc = isDocumentFragment
    ? containerInfo._node
    : containerInfo._ownerDocument
  // 注册事件，将事件注册到document上，同一个事件类型只会被注册一次
  // registrationName 就是 propKey
  listenTo(registrationName, doc)
  // 存储事件,放入事务队列中
  // mountReady之后将回调函数存在ListernBank中
  transaction.getReactMountReady().enqueue(putListener, {
    inst: inst,
    registrationName: registrationName,
    listener: listener
  })
}
```

- 通过调用 `listenTo` 把事件注册到 document 上 (这就是前边说的 React 上注册的事件最终会绑定在`document`这个 DOM 上)
- 事务方式调用 `putListener` 存储事件 (就是把 React 组件内的所有事件统一的存放到一个对象里，缓存起来，为了在触发事件的时候可以查找到对应的方法去执行)

### listenTo()

```js
export function listenTo(
  registrationName: string,
  mountAt: Document | Element | Node
): void {
  // 顾名思义，就是从元素上获取到监听事件和属性的集合
  const listeningSet = getListeningSetForElement(mountAt)
  // dependencies 是对应事件的依赖事件，比如onChange会依赖TOP_INPUT、TOP_FOCUS等一系列事件
  const dependencies = registrationNameDependencies[registrationName]

  for (let i = 0; i < dependencies.length; i++) {
    const dependency = dependencies[i] // 往下看知道是topLevelType的数组
    // 调用该方法进行注册
    listenToTopLevel(dependency, mountAt, listeningSet)
  }
}
```

registrationName 就是传过来的 `'onClick'`，而变量 registrationNameDependencies 是一个存储了 React 事件名与浏览器原生事件名对应的一个 Map，可以通过这个 map 拿到相应的**浏览器原生事件名**。

```js
export function listenToTopLevel(
  topLevelType: DOMTopLevelEventType,
  mountAt: Document | Element | Node,
  listeningSet: Set<DOMTopLevelEventType | string>
): void {
  if (!listeningSet.has(topLevelType)) {
    switch (topLevelType) {
      //...
      case TOP_CANCEL:
      case TOP_CLOSE:
      	// getRawEventName会返回真实的事件名称，比如onChange => onchange
        if (isEventSupported(getRawEventName(topLevelType))) {
          trapCapturedEvent(topLevelType, mountAt) // 捕获阶段
        }
        break
      default:
      	// 默认将除了媒体事件之外的所有事件都注册冒泡事件
        // 因为媒体事件不会冒泡，所以注册冒泡事件毫无意义
        const isMediaEvent = mediaEventTypes.indexOf(topLevelType) !== -1
        if (!isMediaEvent) {
          trapBubbledEvent(topLevelType, mountAt) // 冒泡阶段
        }
        break
    }
		// 表示目标容器已经注册了该事件
    listeningSet.add(topLevelType)
  }
}
```

注册事件的入口是 listenTo 方法, 通过对`dependencies`循环调用`listenToTopLevel()`方法，在该方法中调用 **trapCapturedEvent** 和 **trapBubbledEvent** 来注册捕获和冒泡事件。

### trapCapturedEvent 与 trapBubbledEvent

```js
// 捕获阶段
export function trapCapturedEvent(
  topLevelType: DOMTopLevelEventType,
  element: Document | Element | Node
): void {
  trapEventForPluginEventSystem(element, topLevelType, true)
}

// 冒泡阶段
export function trapBubbledEvent(
  topLevelType: DOMTopLevelEventType,
  element: Document | Element | Node
): void {
  trapEventForPluginEventSystem(element, topLevelType, false)
}
```

```js
function trapEventForPluginEventSystem(
  element: Document | Element | Node,
  topLevelType: DOMTopLevelEventType,
  capture: boolean // 决定捕获还是冒泡阶段
): void {
  let listener
  switch (getEventPriority(topLevelType)) {
  }
	// 获取真实的事件名称
  const rawEventName = getRawEventName(topLevelType)
  if (capture) {
    addEventCaptureListener(element, rawEventName, listener)
  } else {
    addEventBubbleListener(element, rawEventName, listener)
  }
}
```

捕获事件通过`addEventCaptureListener()`，而冒泡事件通过`addEventBubbleListener()`

```js
// 捕获
export function addEventCaptureListener(
  element: Document | Element | Node,
  eventType: string,
  listener: Function
): void {
  element.addEventListener(eventType, listener, true)
}

// 冒泡
export function addEventBubbleListener(
  element: Document | Element | Node,
  eventType: string,
  listener: Function
): void {
  element.addEventListener(eventType, listener, false)
}
```

## 事件存储

```js
function enqueuePutListener(inst, registrationName, listener, transaction) {
  //...
  // 注册事件，将事件注册到document上
  listenTo(registrationName, doc)
  // 存储事件,放入事务队列中
  transaction.getReactMountReady().enqueue(putListener, {
    inst: inst,
    registrationName: registrationName,
    listener: listener
  })
}
```

```js
putListener: function (inst, registrationName, listener) {
  // 用来标识注册了事件,比如onClick的React对象。key的格式为'.nodeId', 只用知道它可以标示哪个React对象就可以了
  // step1: 得到组件唯一标识
  var key = getDictionaryKey(inst);

  // step2: 得到listenerBank对象中指定事件类型的对象
  var bankForRegistrationName = listenerBank[registrationName] || (listenerBank[registrationName] = {});

  // step3: 将listener事件回调方法存入listenerBank[registrationName][key]中,比如listenerBank['onclick'][nodeId]
  // 所有React组件对象定义的所有React事件都会存储在listenerBank中
  bankForRegistrationName[key] = listener;

  // ...
}

// 拿到组件唯一标识
var getDictionaryKey = function (inst) {
  return '.' + inst._rootNodeID;
};
```

## 事件分发

事件已经委托注册到 `document` 上了，那么事件触发的时候，肯定需要一个事件分发的过程，流程也很简单，既然事件存储在 `listenrBank` 中，那么只需要找到对应的事件类型，然后执行事件回调就 ok 了。

> 注意: 由于元素本身并没有注册任何事件，而是委托到了 document 上，所以这个将被触发的事件是 React 自带的合成事件，而非浏览器原生事件

首先找到事件触发的`DOM`和`React Component`：

**getEventTarget 源码**

```js
// 源码看这里: https://github.com/facebook/react/blob/master/packages/react-dom/src/events/ReactDOMEventListener.js#L419
// 获取事件源对象
const nativeEventTarget = getEventTarget(nativeEvent)
// getClosestInstanceFromNode
let targetInst = getClosestInstanceFromNode(nativeEventTarget)
```

```js
function getEventTarget(nativeEvent) {
  let target = nativeEvent.target || nativeEvent.srcElement || window

  // Normalize SVG <use> element events
  // 处理 svg 的 use 元素
  if (target.correspondingUseElement) {
    target = target.correspondingUseElement
  }
	// 如果是文本节点，返回他的父节点
  return target.nodeType === TEXT_NODE ? target.parentNode : target
}
```

`getClosestInstanceFromNode`函数中不得不提的就是查找事件源对象的Fiber节点是如何实现的。在React开始执行的时候，会注册两个变量。

```js
var randomKey = Math.random().toString(36).slice(2);
var internalInstanceKey = '__reactInternalInstance$' + randomKey;
var internalEventHandlersKey = '__reactEventHandlers$' + randomKey;
```

而在React的commit阶段的时候，会在元素对象上添加了两个属性，分别是`__reactInternalInstance$<id>`和`__reactEventHandlers$<id>`两个属性。

`nativeEventTarget` 对象上挂载一个以 `__reactInternalInstance` 开头的属性，这个属性就是 `internalInstanceKey` ，其值就是当前 React 实例对应的 React Component。

继续看源码：`dispatchEventForPluginEventSystem()`：

```js
function dispatchEventForPluginEventSystem(
  topLevelType: DOMTopLevelEventType,
  eventSystemFlags: EventSystemFlags,
  nativeEvent: AnyNativeEvent,
  targetInst: null | Fiber
): void {
  // 组装了一个bookKeeping变量（包含事件类型，顶级元素document，事件源对象Fiber节点）
  //  bookKeeping对象除了我们现有的topLevelType、nativeEvent、targetInst以外，多了一个ancestor属性，为一个空数组，它用来存储targetInst的祖先节点
  const bookKeeping = getTopLevelCallbackBookKeeping(
    topLevelType,
    nativeEvent,
    targetInst,
    eventSystemFlags
  )

  try {
    // Event queue being processed in the same cycle allows
    // `preventDefault`.
    // 这个方法内部就是调用了handleTopLevel(bookKeeping)，只不过里面通过一个isBatching标志位来标志是否当前正在批量处理，如果为true，后续触发的需要等待前面的处理完再执行。
    batchedEventUpdates(handleTopLevel, bookKeeping)
  } finally {
    // 将bookKeeping对象的所有属性置空，可以简单的理解为用完之后就把它“释放”掉了。
    releaseTopLevelCallbackBookKeeping(bookKeeping)
  }
}
```

`batchedEventUpdates()`批量更新，它的工作是把当前触发的事件放到了批处理队列中。**handleTopLevel 是事件分发的核心所在**：

```js
// 主要作用就是在触发任何事件处理方法前先将祖先节点保存起来，防止后续的事件处理方法修改了DOM节点后导致与缓存的矛盾
function handleTopLevel(bookKeeping: BookKeepingInstance) {
  let targetInst = bookKeeping.targetInst

  // Loop through the hierarchy, in case there's any nested components.
  // It's important that we build the array of ancestors before calling any
  // event handlers, because event handlers can modify the DOM, leading to
  // inconsistencies with ReactMount's node cache. See #1105.
  // 循环遍历组件树，获取祖先节点，在触发任何事件处理方法之前先获取祖先节点非常重要，
  // 因为事件处理方法很可能会对DOM进行修改，导致跟React缓存的节点不一致
  // 为什么要通过 do...while来多次寻找 root，其实也是为了应对特殊情况
  // 一般情况下，每个应用只有一个 React实例，如果是这样，那么这里是不需要 do...while循环的，但是有些情况下，一个应用中不止存在一个 React应用
  // 比如我在一个 React实例应用中，再次加入了一个 React实例应用，内层事件需要冒泡到外层根节点。
  
  let ancestor = targetInst
  do {
    if (!ancestor) {
      // 没有祖先节点说明已经到达了顶部
      const ancestors = bookKeeping.ancestors
      // 把 null 添加到ancestors末尾
      // ((ancestors as any) as Array<Fiber | null>).push(ancestor)
      ;((ancestors: any): Array<Fiber | null>).push(ancestor)
      break
    }
    // 通过Fiber的 return 指针一直向上查找根节点，直到 reutrn 为 null
    const root = findRootContainerNode(ancestor)
    if (!root) {
      break
    }
    const tag = ancestor.tag
    // 将祖先节点的 hostComponent 和 HostText 依次加入到 ancestors 数组里去
    if (tag === HostComponent || tag === HostText) {
      bookKeeping.ancestors.push(ancestor)
    }
    // 根据一个dom节点，返回最近的 hostComponent 或者 hostText fiber 祖先
    ancestor = getClosestInstanceFromNode(root)
  } while (ancestor)
}

function findRootContainerNode(inst) {
  // TODO: It may be a good idea to cache this to prevent unnecessary DOM
  // traversal, but caching is difficult to do correctly without using a
  // mutation observer to listen for all DOM changes.
  while (inst.return) {
    inst = inst.return;
  }
  if (inst.tag !== HostRoot) {
    // This can happen if we're in a detached tree.
    return null;
  }
  return inst.stateNode.containerInfo;
}
```

英文注释讲的很清楚，主要就是**事件回调可能会改变 DOM 结构，所以要先遍历层次结构，以防存在任何嵌套的组件，然后缓存起来**。

> 因为不是所有的DOM节点都有Fiber实例，所以有一些特殊情况无法直接通过 `Fiber return`指针直接寻找到根节点，所以当 `reutrn`为 `null`的时候，React会继续通过原生的 `node.parentNode`继续向上寻找，直到找到有 `Fiber`实例的节点，然后重复上述步骤，直到找到根节点

然后继续这个方法

```js
// react-dom/src/events/ReactDOMEventListener.js
for (let i = 0; i < bookKeeping.ancestors.length; i++) {
  targetInst = bookKeeping.ancestors[i]
  // getEventTarget上边有讲到
  const eventTarget = getEventTarget(bookKeeping.nativeEvent)
  const topLevelType = ((bookKeeping.topLevelType: any): DOMTopLevelEventType)
  const nativeEvent = ((bookKeeping.nativeEvent: any): AnyNativeEvent)

  runExtractedPluginEventsInBatch(
    topLevelType,
    targetInst,
    nativeEvent,
    eventTarget,
    bookKeeping.eventSystemFlags
  )
}
```

一个 for 循环来遍历这个 React Component 及其所有的父组件，然后执行`runExtractedPluginEventsInBatch()`方法

## 事件执行

上边讲到的 `runExtractedPluginEventsInBatch()`方法就是事件执行的入口了，通过源码，我们可以知道，它干了两件事

- 构造合成事件
- 批处理构造出的合成事件

```js
export function runExtractedPluginEventsInBatch(
  topLevelType: TopLevelType,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: EventTarget,
  eventSystemFlags: EventSystemFlags
) {
  // step1 : 构造合成事件
  const events = extractPluginEvents(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags
  )

  // step2 : 批处理
  runEventsInBatch(events)
}
```

### 构造合成事件

相关的代码 `extractPluginEvents()` 和 `runEventsInBatch()`

```js
function extractPluginEvents(
  topLevelType: TopLevelType,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: EventTarget,
  eventSystemFlags: EventSystemFlags
): Array<ReactSyntheticEvent> | ReactSyntheticEvent | null {
  let events = null
  // 遍历插件
  for (let i = 0; i < plugins.length; i++) {
    // Not every plugin in the ordering may be loaded at runtime.
    const possiblePlugin: PluginModule<AnyNativeEvent> = plugins[i]
    if (possiblePlugin) {
      const extractedEvents = possiblePlugin.extractEvents(
        topLevelType,
        targetInst,
        nativeEvent,
        nativeEventTarget,
        eventSystemFlags
      )
      if (extractedEvents) {
        events = accumulateInto(events, extractedEvents)
      }
    }
  }
  return events
}
```

首先会去遍历 `plugins`，相关代码在: [plugins 源码](https://github.com/facebook/react/blob/master/packages/legacy-events/EventPluginRegistry.js#L163)，这个 plugins 就是所有**事件合成 plugin** 的集合数组，这些 plugins 是在 `EventPluginHub` 初始化时候注入的：

```js
// 源码地址 : https://github.com/facebook/react/blob/master/packages/legacy-events/EventPluginHub.js#L80

export const injection = {
  injectEventPluginOrder,
  injectEventPluginsByName
}
```

```js
// 源码地址 : https://github.com/facebook/react/blob/master/packages/react-dom/src/client/ReactDOMClientInjection.js#L26
EventPluginHubInjection.injectEventPluginOrder(DOMEventPluginOrder)

EventPluginHubInjection.injectEventPluginsByName({
  SimpleEventPlugin: SimpleEventPlugin,
  EnterLeaveEventPlugin: EnterLeaveEventPlugin,
  ChangeEventPlugin: ChangeEventPlugin,
  SelectEventPlugin: SelectEventPlugin,
  BeforeInputEventPlugin: BeforeInputEventPlugin
})
```

**extractEvents**

```js
const extractedEvents = possiblePlugin.extractEvents(
  topLevelType,
  targetInst,
  nativeEvent,
  nativeEventTarget,
  eventSystemFlags
)
if (extractedEvents) {
  events = accumulateInto(events, extractedEvents)
}
```

因为 `const possiblePlugin: PluginModule = plugins[i]`, 类型是 PluginModule，我们可以去 👉[SimpleEventPlugin 源码](https://github.com/facebook/react/blob/master/packages/react-dom/src/events/SimpleEventPlugin.js#L249)去看一下 `extractEvents` 到底干了啥：

```js
extractEvents: function() {
  const dispatchConfig = topLevelEventsToDispatchConfig[topLevelType]
  if (!dispatchConfig) {
    return null
  }
  //...
}
```

首先，看下 `topLevelEventsToDispatchConfig` 这个对象中有没有 topLevelType 这个属性，只要有，那么说明当前事件可以使用 `SimpleEventPlugin` 构造合成事件

函数里边定义了 `EventConstructor`，然后通过 `switch...case` 语句进行赋值

```js
extractEvents: function() {
  //...
  let EventConstructor
  switch (topLevelType) {
    // ...
    case DOMTopLevelEventTypes.TOP_POINTER_UP:
      EventConstructor = SyntheticPointerEvent
      break
    default:
      EventConstructor = SyntheticEvent
      break
  }
}
```

总之就是赋值给 `EventConstructor`，如果你想更加了解`SyntheticEvent`，[请点击这里](https://github.com/facebook/react/blob/master/packages/legacy-events/SyntheticEvent.js)

设置好了`EventConstructor`之后，这个方法继续执行

```js
extractEvents: function() {
  //...
  const event = EventConstructor.getPooled(
    dispatchConfig,
    targetInst,
    nativeEvent,
    nativeEventTarget
  )
  accumulateTwoPhaseDispatches(event)
  return event
}
```

这一段代码的意思就是，从 event 对象池中取出合成事件，这里的 `getPooled()` 方法其实在在 `SyntheticEvent` 初始化的时候就被设置好了：

```js
function addEventPoolingTo(EventConstructor) {
  // 初始化事件池
  EventConstructor.eventPool = []
  // 就是这里设置了getPooled
  EventConstructor.getPooled = getPooledEvent
  EventConstructor.release = releasePooledEvent
}

SyntheticEvent.extend = function(Interface) {
  //...
  addEventPoolingTo(Class)

  return Class
}

addEventPoolingTo(SyntheticEvent)
```

可以看到 `getPooled` 就是 `getPooledEvent`，那我们去看看`getPooledEvent`做了啥玩意

```js
function getPooledEvent(dispatchConfig, targetInst, nativeEvent, nativeInst) {
  const EventConstructor = this
  if (EventConstructor.eventPool.length) {
    const instance = EventConstructor.eventPool.pop()
    EventConstructor.call(
      instance,
      dispatchConfig,
      targetInst,
      nativeEvent,
      nativeInst
    )
    return instance
  }
  return new EventConstructor(
    dispatchConfig,
    targetInst,
    nativeEvent,
    nativeInst
  )
}
```

首先呢，会先去对象池中，看一下 length 是否为 0，如果是第一次事件触发，那不好意思，你需要 `new EventConstructor` 了，如果后续再次触发事件的时候，直接从对象池中取，也就是直接 `instance = EventConstructor.eventPool.pop()` 出来的完事了

### 批处理

批处理主要是通过 `runEventQueueInBatch(events)` 进行操作，我们来看看源码: 👉 [runEventQueueInBatch 源码](https://github.com/facebook/react/blob/master/packages/legacy-events/EventBatching.js#L42)

```js
export function runEventsInBatch(
  events: Array<ReactSyntheticEvent> | ReactSyntheticEvent | null
) {
  if (events !== null) {
    // accumulateInto(a,b) 用于合并a,b两元素，构成新的数组项后返回
    eventQueue = accumulateInto(eventQueue, events)
  }

  // Set `eventQueue` to null before processing it so that we can tell if more
  // events get enqueued while processing.
  const processingEventQueue = eventQueue
  eventQueue = null

  if (!processingEventQueue) {
    return
  }

  forEachAccumulated(processingEventQueue, executeDispatchesAndReleaseTopLevel)
  invariant(
    !eventQueue,
    'processEventQueue(): Additional events were enqueued while processing ' +
      'an event queue. Support for this has not yet been implemented.'
  )
  // This would be a good time to rethrow if any of the event handlers threw.
  rethrowCaughtError()
}
```

这个方法首先会将当前需要处理的 events 事件与之前没有处理完毕的队列，调用 `accumulateInto` 方法按照顺序进行合并，组合成一个新的队列

如果`processingEventQueue`这个为空，没有处理的事件，退出，否则调用 `forEachAccumulated()`，源码看这里: [forEachAccumulated 源码](https://github.com/facebook/react/blob/master/packages/legacy-events/forEachAccumulated.js#L19)

```js
function forEachAccumulated<T>(
  arr: ?(Array<T> | T),
  cb: (elem: T) => void,
  scope: ?any
) {
  if (Array.isArray(arr)) {
    arr.forEach(cb, scope)
  } else if (arr) {
    cb.call(scope, arr)
  }
}
```

这个方法就是先判断事件队列 `processingEventQueue` 是不是个数组，如果是数组，说明队列中不止一个事件，则遍历队列，调用 `executeDispatchesAndReleaseTopLevel`，否则说明队列中只有一个事件，则无需遍历直接调用即可

📢 [executeDispatchesAndReleaseTopLevel 源码](https://github.com/facebook/react/blob/master/packages/legacy-events/EventBatching.js#L38)

```js
const executeDispatchesAndReleaseTopLevel = function(e) {
  return executeDispatchesAndRelease(e)
}
const executeDispatchesAndRelease = function(event: ReactSyntheticEvent) {
  if (event) {
    // 在这里dispatch事件
    executeDispatchesInOrder(event)
		// 查看这个合成事件是否需要被持久化，如果不需要就会释放这个合成事件
    if (!event.isPersistent()) {
      event.constructor.release(event)
    }
  }
}
```

```js
export function executeDispatchesInOrder(event) {
  const dispatchListeners = event._dispatchListeners
  const dispatchInstances = event._dispatchInstances
  if (__DEV__) {
    validateEventDispatches(event)
  }
  if (Array.isArray(dispatchListeners)) {
    for (let i = 0; i < dispatchListeners.length; i++) {
      if (event.isPropagationStopped()) {
        break
      }
      // Listeners and Instances are two parallel arrays that are always in sync.
      executeDispatch(event, dispatchListeners[i], dispatchInstances[i])
    }
  } else if (dispatchListeners) {
    executeDispatch(event, dispatchListeners, dispatchInstances)
  }
  event._dispatchListeners = null
  event._dispatchInstances = null
}
```

首先对拿到的事件上挂载的 `dispatchListeners`，就是所有注册事件回调函数的集合，遍历这个集合，如果`event.isPropagationStopped() = ture`，break 就好了，因为说明在此之前触发的事件已经调用 `event.stopPropagation()`，isPropagationStopped 的值被置为 true，当前事件以及后面的事件作为父级事件就不应该再被执行了

这里当 event.isPropagationStopped()为 true 时，中断合成事件的向上遍历执行，也就起到了和原生事件调用 stopPropagation 相同的效果 如果循环没有被中断，则继续执行 `executeDispatch` 方法：

```js
function executeDispatch(event, simulated, listener, inst) {
  var type = event.type || 'unknown-event';
  // 注意这里将事件对应的dom元素绑定到了currentTarget上
  event.currentTarget = EventPluginUtils.getNodeFromInstance(inst);
  if (simulated) {
    ReactErrorUtils.invokeGuardedCallbackWithCatch(type, listener, event);
  } else {
    // 一般都是非模拟的情况，执行invokeGuardedCallback
    ReactErrorUtils.invokeGuardedCallback(type, listener, event);
  }
  event.currentTarget = null;
}

var fakeNode = document.createElement('react');
ReactErrorUtils.invokeGuardedCallback = function (name, func, a) {
  var boundFunc = function () {
    func(a);
  };
  var evtType = 'react-' + name;
  fakeNode.addEventListener(evtType, boundFunc, false);
  var evt = document.createEvent('Event');
  evt.initEvent(evtType, false, false);
  fakeNode.dispatchEvent(evt);
  fakeNode.removeEventListener(evtType, boundFunc, false);
};
```

由`invokeGuardedCallback`可知，最后react调用了faked元素的`dispatchEvent`方法来触发事件，并且触发完毕之后立即移除监听事件。

