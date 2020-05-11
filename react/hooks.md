Hooks本质上就是一类特殊的函数，它们可以为你的**函数型组件**注入一些特殊的功能。

react都核心思想就是，将一个页面拆成一堆独立的，可复用的组件，并且用自上而下的单向数据流的形式将这些组件串联起来。但假如你在大型的工作项目中用react，你会发现你的项目中实际上很多react组件冗长且难以复用。尤其是那些写成class的组件，它们本身包含了状态（state），所以复用这类组件就变得很麻烦。

那之前，官方推荐怎么解决这个问题呢？答案是：[渲染属性（Render Props）](https://reactjs.org/docs/render-props.html)和[高阶组件（Higher-Order Components）](https://reactjs.org/docs/higher-order-components.html)。

- 渲染属性指的是使用一个值为函数的prop来传递需要动态渲染的nodes或组件。（虽然这个模式叫Render Props，但不是说非用一个叫render的props不可）
- 高阶组件这个概念就更好理解了，说白了就是一个函数接受一个组件作为参数，经过一系列加工后，最后返回一个新的组件。

但是上述方法都会增加过多的层次。

## 为什么需要hooks

1. 复用一个有状态的组件太麻烦（上述高阶组件，渲染属性等问题）
2. 生命周期钩子函数里的逻辑太乱（生命周期钩子函数里通常同时做了很多事情）
3. 用class来创建react组件时，还有一件很麻烦的事情，就是this的指向问题。

## useState

`useState`是react自带的一个hook函数，它的作用就是用来声明状态变量。`useState`这个函数接收的参数是我们的状态初始值（initial state），它返回了一个数组，这个数组的第`[0]`项是当前当前的状态值，第`[1]`项是可以改变状态值的方法函数。

之前我们的`this.setState`做的是合并状态后返回一个新状态，而`useState`是直接替换老状态后返回新状态。最后，react也给我们提供了一个useReducer的hook，如果你更喜欢redux式的状态管理方案的话。

### react是怎么保证多个useState的相互独立的？

每次我们传的参数只是一个值（如42，‘banana’），我们根本没有告诉react这些值对应的key是哪个，那react是怎么保证这三个useState找到它对应的state呢？

答案是，react是根据useState出现的顺序来定的。

react规定我们必须把hooks写在函数的最外层，不能写在ifelse等条件语句当中，来确保hooks的执行顺序一致。

## useEffect

在 React 组件中执行过数据获取、订阅或者手动修改过 DOM。我们统一把这些操作称为“副作用”，或者简称为“作用”。

`useEffect` 就是一个 Effect Hook，给函数组件增加了操作副作用的能力。它跟 class 组件中的 `componentDidMount`、`componentDidUpdate` 和 `componentWillUnmount` 具有相同的用途，只不过被合并成了一个 API。

> 有的时候，我们希望在 React 更新 DOM 之后进行一些额外的操作。在 React class 组件中， render 方法本身不应该进行副作用操作，但是我们通常是期望在 React 更新 DOM 之后执行一些有必要的副作用。这就是为什么在 React class 中，会把副作用放在 `componentDidMount` 和 `componentDidUpdate` 中。虽然也可以操作封装到一个方法中，但是还是需要在 `componentDidMount` 和 `componentDidUpdate` 中调用两次。

### `useEffect` 做了什么？

通过使用这个 Hook，通知 React 组件需要在渲染后执行什么操作。React 将记住传递的 function（把这个 function 成为 “effect”），并在执行 DOM 更新后调用这个 function。

### 为什么在组件内调用 `useEffect`？

在组件内使用 `useEffect` 是的可以直接从副作用中访问计数器的 state 或者任何的 props。

### 每次 render 之后都会执行 useEffect 吗？

当你调用 `useEffect` 时，就是在告诉 React 在完成对 DOM 的更改后运行你的“副作用”函数。由于副作用函数是在组件内声明的，所以它们可以访问到组件的 props 和 state。默认情况下，React 会在每次渲染后调用副作用函数 —— **包括**第一次渲染的时候。

副作用函数还可以通过返回一个函数来指定如何“清除”副作用。

## Hook 使用规则

Hook 就是 JavaScript 函数，但是使用它们会有两个额外的规则：

- 只能在**函数最外层**调用 Hook。不要在循环、条件判断或者子函数中调用。
- 只能在 **React 的函数组件**中调用 Hook。不要在其他 JavaScript 函数中调用。（还有一个地方可以调用 Hook —— 就是自定义的 Hook 中）

## 自定义 Hook

有时候我们会想要在组件之间重用一些状态逻辑。目前为止，有两种主流方案来解决这个问题：[高阶组件](https://zh-hans.reactjs.org/docs/higher-order-components.html)和 [render props](https://zh-hans.reactjs.org/docs/render-props.html)。自定义 Hook 可以让你在不增加组件的情况下达到同样的目的。

Hook 是一种复用*状态逻辑*的方式，它不复用 state 本身。事实上 Hook 的每次*调用*都有一个完全独立的 state —— 因此你可以在单个组件中多次调用同一个自定义 Hook。

自定义 Hook 更像是一种约定而不是功能。如果函数的名字以 “`use`” 开头并调用其他 Hook，我们就说这是一个自定义 Hook。

