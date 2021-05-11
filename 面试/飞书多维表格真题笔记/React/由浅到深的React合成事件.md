# 由浅到深的React合成事件

> 文章是2019年11月的，和现在版本可能不同

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
    for (propKey in nextProps) {
      var nextProp = nextProps[propKey];
      // lastProp是更新前的prop的值，对于style特殊处理
      var lastProp = propKey === STYLE ? this._previousStyleCopy : lastProps != null ? lastProps[propKey] : undefined;
      if (!nextProps.hasOwnProperty(propKey) || nextProp === lastProp || nextProp == null && lastProp == null) {
        // 如果propKey不存在于nextProps，或者没有改变props，或者nextProp和lastProp为null，跳过后续更新步骤
        continue;
      }
      if (propKey === STYLE) {
        // ...
      } else if (registrationNameModules.hasOwnProperty(propKey)) {
        // 如果是props这个对象直接声明的属性，而不是从原型链中继承而来的，则处理它
        // 对于mountComponent，lastProp为null。
        // updateComponent二者都不为null
        // unmountComponent则nextProp为null
        if (nextProp) {
          // mountComponent和updateComponent中，enqueuePutListener注册事件
          enqueuePutListener(this, propKey, nextProp, transaction);
        } else if (lastProp) {
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
    return
  }
  var containerInfo = inst._hostContainerInfo
  var isDocumentFragment =
    containerInfo._node && containerInfo._node.nodeType === DOC_FRAGMENT_TYPE
  // 找到document
  var doc = isDocumentFragment
    ? containerInfo._node
    : containerInfo._ownerDocument
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

- 通过调用 `listenTo` 把事件注册到 document 上 (这就是前边说的 React 上注册的事件最终会绑定在`document`这个 DOM 上)
- 事务方式调用 `putListener` 存储事件 (就是把 React 组件内的所有事件统一的存放到一个对象里，缓存起来，为了在触发事件的时候可以查找到对应的方法去执行)

### listenTo()

```js
export function listenTo(
  registrationName: string,
  mountAt: Document | Element | Node
): void {
  const listeningSet = getListeningSetForElement(mountAt)
  const dependencies = registrationNameDependencies[registrationName]

  for (let i = 0; i < dependencies.length; i++) {
    const dependency = dependencies[i]
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
        if (isEventSupported(getRawEventName(topLevelType))) {
          trapCapturedEvent(topLevelType, mountAt) // 捕获阶段
        }
        break
      default:
        const isMediaEvent = mediaEventTypes.indexOf(topLevelType) !== -1
        if (!isMediaEvent) {
          trapBubbledEvent(topLevelType, mountAt) // 冒泡阶段
        }
        break
    }
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

