> https://pomb.us/build-your-own-react/

## JSX代码

```jsx
/**
 * const element = React.createElement(
 *  "h1",
 *  { title: "foo" },
 *  "Hello"
 * )
 * 最终返回的react元素形式是：
 * const element = {
 *  type: "h1",
 *  props: {
 *    title: "foo",
 *    children: "Hello",
 *  },
 * }
 */
const element = <h1 title="foo">Hello</h1>
const container = document.getElementById("root")
/**
 * PS: 这里的node指的是DOM
 * const node = document.createElement(element.type)
 * node["title"] = element.props.title
 * const text = document.createTextNode("")
 * text["nodeValue"] = element.props.children
 * node.appendChild(text)
 * container.appendChild(node)
 */
ReactDOM.render(element, container)
```

> 文中提到的**vanilla js**其实就是原生JS，Vanilla JS is a joke

## createElement

createElement唯一需要做的就是创建如上element一样的react元素对象

```ts
function createElement(type, props, ...children) {
  // children是rest parameter 格式，因为通常children都是一个数组。
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === "object"
          ? child
          : createTextElement(child)
      )
    },
  }
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  }
}
```

children也可能是字符串或者数字类型，我们用一个特殊的节点类型包裹他们：TEXT_ELEMENT。react在没有children的情形下不是直接包裹原始值或者空数组，而是这么做是因为这么做代码更加简洁，而不是为了追求更高性能的代码。

我们自定义一个Didact代替React：

```tsx
const Didact = {
  createElement,
}

const element = Didact.createElement(
  "div",
  { id: "foo" },
  Didact.createElement("a", null, "bar"),
  Didact.createElement("b")
)


/** @jsx Didact.createElement */
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)
// 如上给jsx添加这种注释，babel在编译JSX的时候就会使用我们的函数
```

> **@babel/plugin-transform-react-jsx**
>
> 运行时启动的时候，将会自动引入JSX编译的方法。
>
> **react-script**：会根据参数去判断执行哪种构建脚本

## render Function

```tsx
function render(element, container) {
  // TODO create dom nodes
}

const Didact = {
  createElement,
  render,
}

/** ..... */
Didact.render(element, container)

/** 首先关注添加元素，根据element.type添加元素到容器 */
function render(element, container) {
  // 注意处理文本节点
  const dom =
    element.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type)

  // 将element的props添加到DOM node上面去
  const isProperty = key => key !== "children"
  Object.keys(element.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = element.props[name]
    })
  
  /** 递归调用render每一个子节点 */
  element.props.children.forEach(child =>
    render(child, dom)
  )
  
  container.appendChild(dom)
}
```

## Concurrent Mode

在上述递归回调里有一个问题：一旦我们开始渲染，我们无法中断他的渲染。假如渲染树很大的话，我们需要等待很久。对于浏览器这样优先用户输入和平滑的动画效果的情况，是很不合适的。

因此，我们将把工作分成几个小单元，完成每个小单元后，如果还有其他需要完成的事情，我们将让浏览器中断渲染。

```jsx
let nextUnitOfWork = null

function workLoop(deadline) { // deadline参数我们用它来检测还有多少时间能够执行，在浏览器重新控制之前。
  let shouldYield = false // 剩余时间是否不足
  
  // 要开始使用循环，我们需要设置第一个工作单元
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    // timeRemaining()返回一个时间DOMHighResTimeStamp, 并且是浮点类型的数值
    // 它用来表示当前闲置周期的预估剩余毫秒数。
    shouldYield = deadline.timeRemaining() < 1
  }
  // 使用requestIdleCallback进行循环，会在浏览器空闲的时候执行
  // workLoop函数会接收到一个名为 IdleDeadline 的参数
  // 可以让你判断用户代理(浏览器)还剩余多少闲置时间可以用来执行耗时任务
  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performUnitOfWork(nextUnitOfWork) {
  // 编写一个performUnitOfWork函数，该函数不仅执行工作，还返回下一个工作单元。
}
```

react`React`不再使用`requestIdleCallback`。**现在，它使用Scheduler程序包**。

## Fibers

要组织工作单元，我们需要一个数据结构：一棵 fiber 树(`fiber tree`)。

我们将为每个元素分配一根`fiber`，并且每根`fiber`将成为一个工作单元。（fiber英文是纤维的意思）

```tsx
Didact.render(
  <div>
    <h1>
      <p />
      <a />
    </h1>
    <h2 />
  </div>,
  container
);
```

在渲染中，我们将创建`root fiber`并将其设置为`nextUnitOfWork`。剩下的工作将在`performUnitOfWork`函数上进行，我们将为每根`fiber`做三件事：

1. 将元素`element`添加到`DOM`
2. 为元素`element`的子代`children`创建`fiber`
3. 选择下一个工作单元(the next unit of work)

![](../images/articlex.png)

该数据结构的目标之一是使查找下一个工作单元变得容易。这就是为什么每个`fiber`都链接到其第一个子节点，下一个兄弟姐妹和父节点。当我们在一个`fiber`上完成了工作，如果这个`fiber`有一个`child`，那么这个`fiber`将会是下一个工作单元（the next unit of work）。如果这个`fiber`没有`child`， 用 `sibling`(兄弟) 作为下一个工作单元。

如果`fiber`既没有孩子`child`也没有兄弟姐妹`sibling`，那么我们去“叔叔”：父母的兄弟姐妹。如果父母没有兄弟姐妹，我们会不断检查父母，直到找到有兄弟姐妹的父母，或者直到找到根。如果到达根目录，则意味着我们已经完成了此渲染的所有工作。

### 修改代码

```ts
// 将render函数内创建DOM节点部分提取到这个函数里
function createDom(fiber) {
  const dom =
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type)

  const isProperty = key => key !== "children"
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = fiber.props[name]
    })

  return dom
}

function render(element, container) {
  // TODO set next unit of work
  // 在 render 函数中，我们将nextUnitOfWork设置为 fiber tree 的根。
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  }
}

let nextUnitOfWork = null
```

然后，当浏览器准备就绪时，它将调用我们的`workLoop`，我们将开始在root上工作。

```ts
function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    shouldYield = deadline.timeRemaining() < 1
  }
  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performUnitOfWork(fiber) {
  // TODO add dom node
  // TODO create new fibers
  // TODO return next unit of work
}
```

### performUnitOfWork

首先，我们创建一个新节点 `node` 并将其添加到 `DOM`。

我们在 `fibre.dom` 属性中跟踪 `DOM` 节点。然后，为每个孩子 `child` 创建一个新的 `fiber` 。

```ts
function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    // 根据fiber
    fiber.dom = createDom(fiber)
  }

  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom)
  }

  // TODO create new fibers
  // 然后，为每个孩子 child 创建一个新的 fiber 。
  const elements = fiber.props.children
  let index = 0
  let prevSibling = null
  while (index < elements.length) {
    const element = elements[index]
    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    }
    
    // 然后将其添加到 fiber tree 中，将其设置为子代 child 或者兄弟 sibling 
    // 具体取决于它是否是第一个子代 child 。
    if (index === 0) {
      fiber.child = newFiber
    } else {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    index++
  }
  // TODO return next unit of work
  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}
```

## Render and Commit Phase 渲染和提交阶段

还有另一个问题。

每次处理元素时，我们都会向 `DOM` 添加一个新节点。 而且，请记住，在完成渲染整个树之前，浏览器可能会中断我们的工作。 在这种情况下，用户将看到不完整的 `UI` 。 这不是我们想要的。

因此我们需要删除此处更改 DOM 的部分：

```diff
function performUnitOfWork(fiber) {

--  if (fiber.parent) {
--    fiber.parent.dom.appendChild(fiber.dom)
--  }

}
```

相反，我们将跟踪 `fiber tree` 的根 `root` 。我们称其为进行中的根或 `wipRoot` 。

```ts
function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
  }
  nextUnitOfWork = wipRoot
}

let nextUnitOfWork = null
let wipRoot = null
```

一旦完成所有工作（因为没有下一个工作单元），我们便将整个 `fiber tree` 提交给 `DOM` 。

```diff
++ function commitRoot() {
++  // TODO add nodes to dom
++ }

function workLoop(deadline) {

++ if (!nextUnitOfWork && wipRoot) {
++  commitRoot()
++ }
	
}
```

我们在 `commitRoot` 函数中这么做。在这里，我们将所有节点递归附加到 `Dom` 。

```ts
function commitRoot() {
  commitWork(wipRoot.child)
  wipRoot = null
}

function commitWork(fiber) {
  if (!fiber) {
    return
  }
  const domParent = fiber.parent.dom
  domParent.appendChild(fiber.dom)
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}
```

## Reconciliation

更新或删除节点又如何呢？

现在要做的是将在 `render` 函数上得到的元素与我们提交给 `DOM` 的最后一棵 `fiber tree` 进行比较。

因此，在完成提交之后，我们需要保存对“我们提交给 `DOM` 的最后一棵 `fiber tree` ”的引用。 我们称它为 `currentRoot` 。

[
![img](https://avatar-static.segmentfault.com/155/290/1552901191-5ca6003063729_big64)**MandyShen**](https://segmentfault.com/u/mandyshen)

-  **127**
- 

**2**





# [创建一个自己的 React 版本](https://segmentfault.com/a/1190000021464737)

[javascript](https://segmentfault.com/t/javascript)[react.js](https://segmentfault.com/t/react.js)[前端](https://segmentfault.com/t/前端)

发布于 2020-01-02

![img](https://sponsor.segmentfault.com/lg.php?bannerid=0&campaignid=0&zoneid=25&loc=https%3A%2F%2Fsegmentfault.com%2Fa%2F1190000021464737&referer=https%3A%2F%2Fwww.baidu.com%2Flink%3Furl%3DvKh4oyRaTt-9QarqgAcIie7L6QkQBfVonx-eMqDVmS9nif-6VJKePy-BNGe9fWPB3FcSbMvAwN5k58UI0oAjVq%26wd%3D%26eqid%3Dab1fcd3600092b51000000046007e19e&cb=a72dbe6f1a)

本文翻译自：[https://pomb.us/build-your-ow...](https://pomb.us/build-your-own-react/)

## 创建一个自己的 React 版本

从头开始，下面这些是我们将要添加到我们的 React 版本中的内容。

- Step 1: `createElement` 函数
- Step 2: `render`函数
- Step 3: `Concurrent Mode` 并发模式
- Step 4: `Fibers`
- Step 5: `Render and Commit Phases` 渲染和提交阶段
- Step 6: `Reconciliation` 协调
- Step 7: `Function Components` 函数组件
- Step 8: `Hooks`

### Step 0 : 回顾

首先让我们回顾一些基本概念。如果您已经对 `React` ，`JSX` 和 `DOM` 元素的工作方式有了很好的了解，则可以跳过此步骤。

#### 我们将使用此 React 应用程序

只需三行代码。第一行定义一个 `React` 元素。第二行从 `DOM` 获取一个节点。最后一行将 `React` 元素渲染到容器中。

让我们删除所有 `React` 特定的代码，然后将其替换为原始 `JavaScript` 。

```
// 第一行定义一个React元素
const element = <h1 title="foo">Hello</h1>;
// 第二行从DOM获取一个节点
const container = document.getElementById("root");
// 最后一行将React元素渲染到容器中
ReactDOM.render(element, container);
```

> 在第一行中，我们具有用
>
> ```
> JSX
> ```
>
> 定义的元素。它甚至不是有效的
>
> ```
> JavaScript
> ```
>
> ，因此要用标准
>
> ```
> JS
> ```
>
> 取代它，首先我们需要用有效
>
> ```
> JS
> ```
>
> 取代它。
>
> `JSX`通过`Babel`等构建工具转换为`JS`。转换通常很简单：使用对`createElement`的调用来替换标签内的代码，并将标签名称，道具和子代作为参数传递。

`React.createElement`根据其参数创建一个对象。除了进行一些验证之外，这就是它所做全部工作。因此，我们可以安全地将函数调用替换为其输出。

```
const element = React.createElement("h1", { title: "foo" }, "Hello");
```

这就是一个元素，一个具有两个属性的对象：`type` 和 `props`（它有更多的属性，但是我们只关心这两个属性）:

```
const element = {
  type: "h1",
  props: {
    title: "foo",
    children: "Hello"
  }
};
```

类型`type`是一个字符串，用于指定我们要创建的`DOM`节点的类型，它是您要创建 `HTML` 元素时传递给`document.createElement`的`tagName`。它也可以是一个函数，但我们将其留给步骤 7。

`props`是另一个对象，它具有`JSX`属性中的所有键和值。它还有一个特殊的属性：`children`。

在这种情况下，`children`是字符串，但通常是包含更多元素的数组。这就是为什么元素也是树的原因。

#### 我们需要替换的另一部分`React`代码是对`ReactDOM.render`的调用。

`render`是`React`更改`DOM`的地方，所以让我们自己进行更新。

首先，我们使用元素类型（在本例中为`h1`）创建一个`node` *。

然后，我们将所有元素`props`分配给该节点。这里只是标题。

*为避免混淆，我将使用“`element`”来指代`React elements`，并使用“`node`”来指代`DOM elements`。

```
// 首先，我们使用元素类型（在本例中为`h1`）创建一个`node` *。
const node = document.createElement(element.type);
// 然后，我们将所有元素`props`分配给该节点。这里只是标题。
node["title"] = element.props.title;
```

然后，我们为孩子创建节点。我们只有一个字符串作为孩子，所以我们创建一个文本节点。

```
const text = document.createTextNode("");
text["nodeValue"] = element.props.children;
```

使用`textNode`而不是设置`innerText`将使我们以后以相同的方式对待所有元素。还请注意我们是如何像设置`h1`标题一样设置`nodeValue`，就像字符串中带有`props`一样：`{nodeValue：“ hello”}`。

最后，我们将`textNode`附加到`h1`并将`h1`附加到`container`。

```
node.appendChild(text);
container.appendChild(node);
```

现在，我们拥有与以前相同的应用程序，但是没有使用`React`。

```
// 1. 创建一个元素，这个元素是具有两个属性的对象：type和props（它有更多的属性，但是我们只关心这两个属性）
const element = {
  type: "h1",
  props: {
    title: "foo",
    children: "Hello"
  }
};

// 2. 从DOM获取一个节点
const container = document.getElementById("root");

// 3. 使用 type 创建一个`node` 。然后，我们将所有元素`props`分配给该节点。这里只是标题。
const node = document.createElement(element.type);
node["title"] = elememt.props.title;

// 4. 创建子节点(使用`textNode`而不是设置`innerText`将使我们以后以相同的方式对待所有元素)
const text = document.createTextNode("");
text["nodeValue"] = element.props.children;

// 5. 将`textNode`附加到`h1`并将`h1`附加到`container`
node.appendChild(text);
container.appendChild(node);
```

### Step 1: `createElement` 函数

让我们从另一个应用程序开始。这次，我们将用自己的`React`版本替换`React`代码。

我们将从编写自己的`createElement`开始。

让我们将`JSX`转换为`JS`，以便可以看到`createElement`的调用。

```
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
);
const container = document.getElementById("root");
ReactDOM.render(element, container);
```

正如我们在上一步`Step 0`中看到的，元素是具有`type`和`props`的对象。我们的函数唯一需要做的就是创建该对象。

```
const element = React.createElement(
  "div",
  { id: "foo" },
  React.createElement("a", null, "bar"),
  React.createElement("b")
);
```

我们对`props`使用`spread operator`，对`children`使用`rest parameter`语法，这样`children`属性将始终是数组。

> 扩展运算符回顾：

```
// 此处使用扩展运算符可以直接将数组作为参数传入
function foo(name, ...arr) {
  return {
    name,
    arr
  };
}

const testArr = [1, 3, 5, 6, 2, 5];
foo("Bob", ...testArr);
/*
结果：
{
  name: "Bob",
  arr: [1,3,5,6,2,5]
}
*/
```

例如：
`createElement("div")` 返回:

```
{
  "type": "div",
  "props": { "children": [] }
}
```

`createElement("div", null, a)` 返回:

```
{
  "type": "div",
  "props": { "children": [a] }
}
```

`createElement("div", null, a, b)` 返回:

```
{
  "type": "div",
  "props": { "children": [a, b] }
}
```

那么：

```
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children
    }
  };
}
```

`children`组也可以包含原始值，例如字符串或数字。因此，我们会将**不是对象**的所有内容包装在其自己的元素中，并为其创建特殊类型：`TEXT_ELEMENT`。

当没有`children`时，`React`不会包装原始值或创建空数组，但是我们这样做是因为它可以简化我们的代码，对于我们的库，我们更喜欢简单代码而不是高性能代码。

```
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === "object" ? child : createTextElement(child)
      )
    }
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: []
    }
  };
}
```

我们仍然在使用`React`的`createElement`。

为了代替它，我们给我们自己的库取一个名字。我们需要一个听起来像`React`，但又不同的名字。

我们叫它`Didact`。

但是我们仍然想在这里使用 `JSX`。我们如何告诉`babel` 使用 `Didact` 的 `createElement` 代替 `React` 的？

```
const Didact = {
  createElement
};

const element = Didact.createElement(
  "div",
  { id: "foo" },
  Didact.createElement("a", null, "bar"),
  Didact.createElement("b")
);
```

如果我们有这样的***注解\***，当`babel`转译`JSX`时，它将使用我们定义的函数。

```
/** @jsx Didact.createElement */

// 得到：
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
);
```

### Step 2: `render` 函数

接下来，我们需要编写我们的`ReactDOM.render`函数版本。

```
ReactDOM.render(element, container);
```

目前，我们只关心向 `DOM` 添加内容。我们稍后将处理更新和删除。

```
function render(element, container) {
  // TODO create dom nodes
}

const Didact = {
  createElement,
  render,
}

/** @jsx Didact.createElement */
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)

const container = document.getElementById("root")
Didact.render(element, container)
```

我们首先使用元素类型创建`DOM`节点，然后将新节点附加到容器`container`中。

```
function render(element, container) {
  const dom = document.createElement(element.type)

  container.appendChild(dom)
}
```

我们递归地为每个`children`做同样的事情。

```
function render(element, container) {
  const dom = document.createElement(element.type)

  element.props.children.forEach(child =>
    render(child, dom)
  )

  container.appendChild(dom)
}
```

我们还需要处理文本元素，如果元素类型为`TEXT_ELEMENT`，我们将创建文本节点而不是常规节点。

```
function render(element, container) {
  const dom =
    element.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type)

  element.props.children.forEach(child =>
    render(child, dom)
  )

  container.appendChild(dom)
}
```

我们在这里要做的最后一件事是将元素`props`分配给节点。

```
function render(element, container) {
  const dom =
    element.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type)

  const isProperty = key => key !== "children"
  Object.keys(element.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = element.props[name]
    })

  element.props.children.forEach(child =>
    render(child, dom)
  )

  container.appendChild(dom)
}
```

就是这样。现在，我们有了一个可以将`JSX`呈现到`DOM`的库。

```
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === "object"
          ? child
          : createTextElement(child)
      ),
    },
  }
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  }
}

function render(element, container) {
  const dom =
    element.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type)

  const isProperty = key => key !== "children"
  Object.keys(element.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = element.props[name]
    })

  element.props.children.forEach(child =>
    render(child, dom)
  )

  container.appendChild(dom)
}

const Didact = {
  createElement,
  render,
}

/** @jsx Didact.createElement */
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)
const container = document.getElementById("root")
Didact.render(element, container)
```

### Step 3: Concurrent Mode(并发模式)

但是……在开始添加更多代码之前，我们需要重构。

此递归调用存在问题。

```
function render(element, container) {
  element.props.children.forEach(child => render(child, dom));
}
```

> 一旦开始渲染后，直到渲染完完整的元素树后，我们才会停止。 如果元素树很大，则可能会阻塞主线程太长时间。 而且，如果浏览器需要执行诸如处理用户输入或使动画保持平滑等高优先级的工作，则它必须等到渲染完成为止。

因此，我们将工作分成几个小单元，在完成每个单元后，如果需要执行其他任何操作，我们将让浏览器中断渲染。

```
let nextUnitOfWork = null

function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    shouldYield = deadline.timeRemaining() < 1
  }
  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performUnitOfWork(nextUnitOfWork) {
  // TODO
}
```

我们使用`requestIdleCallback`进行循环。您可以将`requestIdleCallback`视为`setTimeout`，但浏览器将在主线程空闲时运行回调，而不是告诉我们何时运行。

> `React`不再使用`requestIdleCallback`。***现在，它使用调度程序包\***。但是对于此用例，它在概念上是相同的。

`requestIdleCallback`还为我们提供了截止日期参数。我们可以使用它来检查我们有多少时间，直到浏览器需要再次控制。

截至 2019 年 11 月，并发模式在`React`中还不稳定。循环的稳定版本看起来像这样：

```
while (nextUnitOfWork) {
  nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
}
```

要开始使用循环，我们需要设置第一个工作单元，然后编写一个`performUnitOfWork`函数，该函数不仅执行工作，还返回下一个工作单元。

### Step 4: `Fibers`

要组织工作单元，我们需要一个数据结构：一棵构造树(`fiber tree`)。

我们将为每个元素分配一根`fiber`，并且每根`fiber`将成为一个工作单元。

举一个例子:

假设我们要渲染一个像这样的元素树：

```
Didact.render(
  <div>
    <h1>
      <p />
      <a />
    </h1>
    <h2 />
  </div>,
  container
);
```

在渲染中，我们将创建`root fiber`并将其设置为`nextUnitOfWork`。剩下的工作将在`performUnitOfWork`函数上进行，我们将为每根`fiber`做三件事：

1. 将元素`element`添加到`DOM`
2. 为元素`element`的子代`children`创建`fiber`
3. 选择下一个工作单元(the next unit of work)
   ![fiber1.png](https://segmentfault.com/img/bVbCd7m)

该数据结构的目标之一是使查找下一个工作单元变得容易。这就是为什么每个`fiber`都链接到其第一个子节点，下一个兄弟姐妹和父节点。

当我们在一个`fiber`上完成了工作，如果这个`fiber`有一个`child`，那么这个`fiber`将会是下一个工作单元（the next unit of work）。

在我们的示例中，当完成 `div` fiber 上的工作，下一个工作单元将是`h1` fiber。

如果这个`fiber`没有`child`， 用 `sibling`(兄弟) 作为下一个工作单元。

比如，`p` fiber 没有子节点·，那么在`p` fiber 完成后，移动到`a` fiber。

如果`fiber`既没有孩子`child`也没有兄弟姐妹`sibling`，那么我们去“叔叔”：父母的兄弟姐妹。就像示例中的`a`和`h2` fiber 一样。

另外，如果父母没有兄弟姐妹，我们会不断检查父母，直到找到有兄弟姐妹的父母，或者直到找到根。如果到达根目录，则意味着我们已经完成了此渲染的所有工作。

现在，将其放入代码中。

首先，让我们从 `render` 函数中删除此代码。

```
function render(element, container) {
  const dom =
    element.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type)

  const isProperty = key => key !== "children"
  Object.keys(element.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = element.props[name]
    })

  element.props.children.forEach(child =>
    render(child, dom)
  )

  container.appendChild(dom)
}

let nextUnitOfWork = null
```

我们将创建`DOM`节点的部分保留在其自身的功能中，稍后我们将使用它。

```
function createDom(fiber) {
  const dom =
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type)

  const isProperty = key => key !== "children"
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = fiber.props[name]
    })

  return dom
}

function render(element, container) {
  // TODO set next unit of work
}

let nextUnitOfWork = null
```

在 `render` 函数中，我们将`nextUnitOfWork`设置为 `fiber tree` 的根。

```
function render(element, container) {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  }
}

let nextUnitOfWork = null
```

然后，当浏览器准备就绪时，它将调用我们的`workLoop`，我们将开始在根上工作。

```
function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    shouldYield = deadline.timeRemaining() < 1
  }
  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performUnitOfWork(fiber) {
  // TODO add dom node
  // TODO create new fibers
  // TODO return next unit of work
}
```

首先，我们创建一个新节点 `node` 并将其添加到 `DOM`。

我们在 `fibre.dom` 属性中跟踪 `DOM` 节点。

```
function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom)
  }

  // TODO create new fibers
  // TODO return next unit of work
}
```

然后，为每个孩子 `child` 创建一个新的 `fiber` 。

```
const elements = fiber.props.children
  let index = 0
  let prevSibling = null

  while (index < elements.length) {
    const element = elements[index]

    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    }
  }
```

然后将其添加到 `fiber tree` 中，将其设置为子代 `child` 或者兄弟 `sibling` ，具体取决于它是否是第一个子代 `child` 。

```
if (index === 0) {
  fiber.child = newFiber
} else {
  prevSibling.sibling = newFiber
}

prevSibling = newFiber
index++
```

最后，我们搜索下一个工作单元。我们首先尝试与孩子，然后与兄弟姐妹，然后与叔叔，依此类推。

```
if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
```

这就是我们的 `performUnitOfWork` 。

```
function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom)
  }

  const elements = fiber.props.children
  let index = 0
  let prevSibling = null

  while (index < elements.length) {
    const element = elements[index]

    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    }

    if (index === 0) {
      fiber.child = newFiber
    } else {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    index++
  }

  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}
```

### Step 5: `Render and Commit Phases` 渲染和提交阶段

我们这里还有另一个问题。

每次处理元素时，我们都会向 `DOM` 添加一个新节点。 而且，请记住，在完成渲染整个树之前，浏览器可能会中断我们的工作。 在这种情况下，用户将看到不完整的 `UI` 。 我们不想要那样。

```
function performUnitOfWork(fiber) {
  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom)
  }
}
```

因此，我们需要从此处删除更改 `DOM` 的部分。

```
function performUnitOfWork(fiber) {
  
}
```

相反，我们将跟踪 `fiber tree` 的根 `root` 。我们称其为进行中的根或 `wipRoot` 。

```
function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
  }
  nextUnitOfWork = wipRoot
}

let nextUnitOfWork = null
let wipRoot = null
```

一旦完成所有工作（因为没有下一个工作单元），我们便将整个 `fiber tree` 提交给 `DOM` 。

```
function commitRoot() {
  // TODO add nodes to dom
}

function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
  }
  nextUnitOfWork = wipRoot
}

let nextUnitOfWork = null
let wipRoot = null

function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    shouldYield = deadline.timeRemaining() < 1
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }

  requestIdleCallback(workLoop)
}
requestIdleCallback(workLoop)
```

我们在 `commitRoot` 函数中做到这一点。在这里，我们将所有节点递归附加到 `Dom` 。

```
function commitRoot() {
  commitWork(wipRoot.child)
  wipRoot = null
}

function commitWork(fiber) {
  if (!fiber) {
    return
  }
  const domParent = fiber.parent.dom
  domParent.appendChild(fiber.dom)
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}
```

### Step 6: Reconciliation

到目前为止，我们仅向 `DOM` 添加了内容，但是更新或删除节点又如何呢？

这就是我们现在要做的，我们需要将在 `render` 函数上得到的元素与我们提交给 `DOM` 的最后一棵 `fiber tree` 进行比较。

因此，在完成提交之后，我们需要保存对“我们提交给 `DOM` 的最后一棵 `fiber tree` ”的引用。 我们称它为 `currentRoot` 。

我们还将 `alternate` 属性添加到每根 `fiber` 。 此属性是到旧 `fiber` 的链接，旧 `fiber` 是我们在上一个提交阶段向 `DOM` 提交的 `fiber` 

```diff
function commitRoot() {
   commitWork(wipRoot.child)
++ currentRoot = wipRoot
   wipRoot = null
}


function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
++  alternate: currentRoot,
  }
  nextUnitOfWork = wipRoot
}

let nextUnitOfWork = null
++ let currentRoot = null
let wipRoot = null
```

现在，让我们从 `performUnitOfWork` 中提取创建新的 `fibers`的代码到一个新的reconcileChildren函数

```diff
function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

++  const elements = fiber.props.children
++  reconcileChildren(fiber, elements)

  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}

++ function reconcileChildren(wipFiber, elements) {
  let index = 0
  let prevSibling = null

  while (index < elements.length) {
    const element = elements[index]

    const newFiber = {
      type: element.type,
      props: element.props,
      parent: wipFiber,
      dom: null,
    }

    if (index === 0) {
      wipFiber.child = newFiber
    } else {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    index++
  }
++ }
```

我们同时遍历 `old fiber` 的 `children`（`wipFiber.alternate`）和要协调（reconcile）的 element 数组。

如果我们忽略了同时迭代数组和链接列表所需的所有模板。那么在此期间，我们剩下的最重要的是： `oldFiber` 和 `element` 。 `element` 是我们要渲染到 `DOM` 的东西，而 `oldFiber` 是我们上次渲染的东西。

我们需要对它们进行比较，以了解那些部分需要 `DOM` 进行更改。`React` 也使用keys，这样可以实现更好的协调。例如，它检测子元素何时更改元素数组中的位置。

```ts
function reconcileChildren(wipFiber, elements) {
  let index = 0
  let oldFiber =
    wipFiber.alternate && wipFiber.alternate.child
  let prevSibling = null

  while (
    index < elements.length ||
    oldFiber != null
  ) {
    const element = elements[index]
    let newFiber = null

    // TODO compare oldFiber to element
    const sameType =
      oldFiber &&
      element &&
      element.type == oldFiber.type

    if (sameType) {
      // TODO update the node
      // 老fiber和新element具有相同type，不修改DOM只更新props
      // 当 old fiber 和 new element 具有相同的类型 type时
      // 我们使用老fiber的type和element的props创建新的 
      // 还向 fiber 添加了一个新属性：effectTag。 稍后我们将在提交阶段使用此属性。
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      }
    }
    if (element && !sameType) {
      // TODO add this node
      // 不同的type并且存在新的element，直接创建新的DOM节点
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      }
    }
    if (oldFiber && !sameType) {
      // TODO delete the oldFiber's node
      // 不同的type并且存在老fiber，需要删除DOM节点
      oldFiber.effectTag = "DELETION"
      deletions.push(oldFiber)
    }

    // ......
}
```

上述对于需要删除节点的情况，我们没有新的 fiber ，因此我们将效果标签 effectTag 添加到oldFiber。但是，当我们将 fiber tree 提交给 DOM 时，我们是从正在进行的根 root 开始的，它没有 oldFiber，需要一个数组来跟踪要删除的节点。然后，当我们将更改提交到 `DOM` 时，我们也使用该数组中的 `fiber`。

```diff
function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  }
++  deletions = []
  nextUnitOfWork = wipRoot
}

let nextUnitOfWork = null
let currentRoot = null
let wipRoot = null
++  let deletions = null

function commitRoot() {
++  deletions.forEach(commitWork)
  commitWork(wipRoot.child)
  currentRoot = wipRoot
  wipRoot = null
}
```

更改 `commitWork` 函数以处理新的 `effectTags` 。如果 `fiber` 具有 `PLACEMENT` 效果标签，则与之前相同，将 `DOM` 节点附加到父 `fiber` 的节点上。如果是 `DELETION` ，则执行相反的操作，删除该子项。如果是 `UPDATE` ，我们需要使用更改的 `props` 来更新现有的 `DOM` 节点。

```ts
function commitWork(fiber) {
  if (!fiber) {
    return
  }
  const domParent = fiber.parent.dom
  domParent.appendChild(fiber.dom)
  
  /** +++ */
  if (
    fiber.effectTag === "PLACEMENT" &&
    fiber.dom != null
  ) {
    domParent.appendChild(fiber.dom)
  } else if (
    fiber.effectTag === "UPDATE" &&
    fiber.dom != null
  ) {
    updateDom(
      fiber.dom,
      fiber.alternate.props,
      fiber.props
    )
  } else if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom)
  }
  /** +++ */
  
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

/** 新增updateDom函数 */
/**
* 将 oldFiber 中的 props 与 newFiber 中的 props 进行比较，删除不再使用的 props
* 并设置新的或更改的 props 。
*/
/**
* 有种特殊情况是需要更新的是事件监听器，假设key有“on”前缀我们需要单独处理
*/
const isEvent = key => key.startsWith("on")
const isProperty = key =>
  key !== "children" && !isEvent(key)
const isNew = (prev, next) => key =>
  prev[key] !== next[key]
const isGone = (prev, next) => key => !(key in next)
function updateDom(dom, prevProps, nextProps) {
  // TODO
  //Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      key =>
        !(key in nextProps) ||
        isNew(prevProps, nextProps)(key)
    )
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2)
      dom.removeEventListener(
        eventType,
        prevProps[name]
      )
    })

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = ""
    })

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name]
    })
  
  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2)
      dom.addEventListener(
        eventType,
        nextProps[name]
      )
    })
}
```

## Function Components 函数组件

添加对函数组件的支持

```tsx
/** @jsx Didact.createElement */
function App(props) {
  return <h1>Hi {props.name}</h1>
}
const element = <App name="foo" />
const container = document.getElementById("root")
Didact.render(element, container)

/** jsx转换后 */
function App(props) {
  return Didact.createElement(
    "h1",
    null,
    "Hi ",
    props.name
  )
}
const element = Didact.createElement(App, {
  name: "foo",
})
```

函数组件有两个不同：

- 函数组件的 fiber 没有 DOM 节点。
- `children` 来自于函数的调用，而不是直接来自于 `props`

我们检查 `fiber` 类型是否为函数，并根据结果使用其他更新函数。

在 `updateHostComponent` 中，我们执行与以前相同的操作。

```ts
function performUnitOfWork(fiber) {
  /** +++ */
  const isFunctionComponent =
    fiber.type instanceof Function
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }
  /** +++ */
  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}

function updateFunctionComponent(fiber) {
  // TODO
  const children = [fiber.type(fiber.props)]
  reconcileChildren(fiber, children)
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  reconcileChildren(fiber, fiber.props.children)
}
```

需要更改的是 `commitWork` 函数，现在我们有了没有 `DOM` 节点的 `fiber` ，我们需要更改两件事：

1. 首先，要找到带有 `DOM` 节点的父节点，我们需要沿着 `fiber tree` 向上移动，直到找到带有 `DOM` 节点的 `fiber` 。
2. 在删除节点时，我们还需要继续操作，直到找到具有 `DOM` 节点的子节点为止。

```diff
function commitWork(fiber) {
  if (!fiber) {
    return
  }

++	let domParentFiber = fiber.parent
++  while (!domParentFiber.dom) {
++    domParentFiber = domParentFiber.parent
++  }

  const domParent = fiber.parent.dom
  if (
    fiber.effectTag === "PLACEMENT" &&
    fiber.dom != null
  ) {
    domParent.appendChild(fiber.dom)
  } else if (
    fiber.effectTag === "UPDATE" &&
    fiber.dom != null
  ) {
    updateDom(
      fiber.dom,
      fiber.alternate.props,
      fiber.props
    )
  } else if (fiber.effectTag === "DELETION") {
--  domParent.removeChild(fiber.dom)
++  commitDeletion(fiber, domParent)
  }

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}
```

```ts
function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber.child, domParent)
  }
}
```

## Hooks

最后一步，现在我们有了函数组件，我们还要添加状态 `state` 。

```tsx
/** @jsx Didact.createElement */
function Counter() {
  const [state, setState] = Didact.useState(1)
  return (
    <h1 onClick={() => setState(c => c + 1)}>
      Count: {state}
    </h1>
  )
}
const element = <Counter />


function useState(initial) {
  // TODO
}
```

请注意，我们正在使用 `Didact.useState` 获取和更新计数器值。

在调用函数组件之前，我们需要初始化一些全局变量，为了能在 useState 函数里使用他们。

首先，我们将 `work` 设置在进行中的 `fiber` 。

我们还向 `fiber` 添加了一个 `hooks` 数组，以支持在同一组件中多次调用 `useState` 。并且我们跟踪当前的钩子索引。

```ts
let wipFiber = null
let hookIndex = null

function updateFunctionComponent(fiber) {
  wipFiber = fiber
  hookIndex = 0
  wipFiber.hooks = []
  const children = [fiber.type(fiber.props)]
  reconcileChildren(fiber, children)
}

function useState(initial) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex]
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  }

  const actions = oldHook ? oldHook.queue : []
  actions.forEach(action => {
    hook.state = action(hook.state)
  })
  
  const setState = action => {
    hook.queue.push(action)
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    }
    nextUnitOfWork = wipRoot
    deletions = []
  }
  
  wipFiber.hooks.push(hook)
  hookIndex++
  return [hook.state, setState]
}
```

当函数组件调用 useState 的时候，我们检查是否有老的hook。我们使用hook 索引在fiber的 alternate 上检查。

如果我们有旧的 `hook` ，则将状态从旧的 `hook` 复制到新的 `hook` ，否则，我们将初始化状态。然后，将新的 `hook` 添加到 `fiber` ，将 `hook` 索引加1，然后返回状态。

`useState` 还应该返回一个更新状态的函数，因此我们定义了一个 `setState` 函数，该函数接收一个action。我们将该 action 推送到添加到hook中的队列中。

然后和我们在render函数里做的一样，在当前root上设置一个新的work，以当前root作为下一个工作单元，以便工作循环可以开始新的渲染阶段。

但是我们不会立刻执行这些action。下次渲染组件时，我们会从旧的hook队列中获取所有action，然后将它们逐一应用于新的hook state。当我们返回这个state后，state已经被更新了。

