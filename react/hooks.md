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

状态变更时，应该通过 setState 的函数形式来代替直接获取当前状态。

- `setCount(c => c + 1);`

## useEffect

在 React 组件中执行过数据获取、订阅或者手动修改过 DOM。我们统一把这些操作称为“副作用”，或者简称为“作用”。

`useEffect` 就是一个 Effect Hook，给函数组件增加了操作副作用的能力。它跟 class 组件中的 `componentDidMount`、`componentDidUpdate` 和 `componentWillUnmount` 具有相同的用途，只不过被合并成了一个 API。

> 有的时候，我们希望在 React 更新 DOM 之后进行一些额外的操作。在 React class 组件中， render 方法本身不应该进行副作用操作，但是我们通常是期望在 React 更新 DOM 之后执行一些有必要的副作用。这就是为什么在 React class 中，会把副作用放在 `componentDidMount` 和 `componentDidUpdate` 中。虽然也可以操作封装到一个方法中，但是还是需要在 `componentDidMount` 和 `componentDidUpdate` 中调用两次。

### `useEffect` 做了什么？

通过使用这个 Hook，通知 React 组件需要在渲染后执行什么操作。React 将记住传递的 function（把这个 function 成为 “effect”），并在执行 DOM 更新后调用这个 function。

### 为什么在组件内调用 `useEffect`？

在组件内使用 `useEffect` 是的可以直接从副作用中访问计数器的 state 或者任何的 props。

### 每次 render 之后都会执行 useEffect 吗？

当你调用 `useEffect` 时，就是在告诉 React 在**完成对 DOM 的更改后**运行你的“副作用”函数。由于副作用函数是在组件内声明的，所以它们可以访问到组件的 props 和 state。默认情况下，React 会在每次渲染后调用副作用函数 —— **包括**第一次渲染的时候。

**每个 effect 函数中捕获的 props 或 state 都来自于那一次的 render 函数。**

副作用函数还可以通过返回一个函数来指定如何“清除”副作用。每个 effect 都可以返回一个**在它之后**清理的 function。这使得我们能够保持添加订阅和删除订阅彼此接近的订阅的逻辑。**在执行下一个 effect 之前，上一个 effect 就已被清除**。

### 第二个参数

第二个参数是个数组，作为依赖数组，指定当前 Effect 依赖了哪些变量。如果使用到useState的变量，但是不想触发effect的render，这时候我们可以把他放到ref上面去。

```jsx
const [count, setCount] = useState(0);
const countRef = useRef();
countRef.current = count; // 放到ref

useEffect(() => {
    const id = setInterval(() => {
        console.log(countRef.current);
    }, 1000);
    return () => clearInterval(id);
}, []);
```

## useRef

与 class 组件进行比较，`useRef` 的作用相对于让你在 class 组件的 `this` 上追加属性。

```jsx
const components = () => {
    const ref = useRef() // 每次都返回同一个引用
    useEffect(() => {
        ref.current = state // ref相当于this
    })
}
```

## useReducer

```jssx
const [state, dispatch] = useReducer(reducer, initialArg, init);
```

`useState` 的替代方案。它接收一个形如 `(state, action) => newState` 的 reducer，并返回当前的 state 以及与其配套的 `dispatch` 方法。

## useCallback

把内联回调函数及依赖项数组作为参数传入 `useCallback`，它将返回该回调函数的 memoized 版本，该回调函数仅在某个依赖项改变时才会更新。当你把回调函数传递给经过优化的并使用引用相等性去避免非必要渲染（例如 `shouldComponentUpdate`）的子组件时，它将非常有用。

`useCallback(fn, deps)` 相当于 `useMemo(() => fn, deps)`。

## Hook 使用规则

Hook 就是 JavaScript 函数，但是使用它们会有两个额外的规则：

- 只能在**函数最外层**调用 Hook。不要在循环、条件判断或者子函数中调用。
- 只能在 **React 的函数组件**中调用 Hook。不要在其他 JavaScript 函数中调用。（还有一个地方可以调用 Hook —— 就是自定义的 Hook 中）

## 自定义 Hook

有时候我们会想要在组件之间重用一些状态逻辑。目前为止，有两种主流方案来解决这个问题：[高阶组件](https://zh-hans.reactjs.org/docs/higher-order-components.html)和 [render props](https://zh-hans.reactjs.org/docs/render-props.html)。自定义 Hook 可以让你在不增加组件的情况下达到同样的目的。

Hook 是一种复用*状态逻辑*的方式，它不复用 state 本身。事实上 Hook 的每次*调用*都有一个完全独立的 state —— 因此你可以在单个组件中多次调用同一个自定义 Hook。

自定义 Hook 更像是一种约定而不是功能。如果函数的名字以 “`use`” 开头并调用其他 Hook，我们就说这是一个自定义 Hook。

## 使用 ESLint 插件

使用 ESLint 插件 `eslint-plugin-react-hooks@>=2.4.0`。

## 使用 useMemo/useCallback

useMemo 的含义是，通过一些变量计算得到新的值。通过把这些变量加入依赖 deps（useEffect的第二个参数），当 deps 中的值均未发生变化时，跳过这次计算。useMemo 中传入的函数，将在 render 函数调用过程被同步调用。

可以使用 useMemo 缓存一些相对耗时的计算。

除此以外，useMemo 也非常适合用于存储引用类型的数据，可以传入对象字面量，匿名函数等。

```jsx
const data = useMemo(() => ({
    a,
    b,
    c,
    d: 'xxx'
}), [a, b, c]);

// 可以用 useCallback 代替
const fn = useMemo(() => () => {
    // do something
}, [a, b]);

const memoComponentsA = useMemo(() => (
    <ComponentsA {...someProps} />
), [someProps]);
```

useMemo 的目的其实是尽量使用缓存的值。

对于函数，其作为另外一个 useEffect 的 deps 时，减少函数的重新生成，就能减少该 Effect 的调用，甚至避免一些死循环的产生;

对于对象和数组，如果某个子组件使用了它作为 props，减少它的重新生成，就能避免子组件不必要的重复渲染，提升性能。

```jsx
const data = useMemo(() => ({ id }), [id]);

return <Child data={data}>;
```

当父组件 render 时，只要满足 id 不变，data 的值也不会发生变化，子组件也将避免 render。

对于组件返回的 React Elements，我们可以选择性地提取其中一部分 elements，通过 useMemo 进行缓存，也能避免这一部分的重复渲染。

```jsx
function Example(props) {
    const [count, setCount] = useState(0);
    const [foo] = useState("foo");

    const main = useMemo(() => (
        <div>
            <Item key={1} x={1} foo={foo} />
            <Item key={2} x={2} foo={foo} />
            <Item key={3} x={3} foo={foo} />
            <Item key={4} x={4} foo={foo} />
            <Item key={5} x={5} foo={foo} />
        </div>
    ), [foo]);

    return (
        <div>
            <p>{count}</p>
            <button onClick={() => setCount(count + 1)}>setCount</button>
            {main}
        </div>
    );
}
```

## 惰性初始值

#### 惰性初始 state

`initialState` 参数只会在组件的初始渲染中起作用，后续渲染时会被忽略。如果初始 state 需要通过复杂计算获得，则可以传入一个函数，在函数中计算并返回初始的 state，此函数只在初始渲染时被调用：

```jsx
const [state, setState] = useState(() => {
  const initialState = someExpensiveComputation(props); // 复杂耗时计算，直接在函数里每一帧都会调用，在initialState里只会使用一次
  return initialState;
});
```

## 受控与非受控

外部传入的属性发生了变化默认不会更新，因为 useState 参数代表的是初始值，仅在初始时赋值给了state。后续 `count` 的状态将与props无关。这种外部无法直接控制 state 的方式，我们称为非受控。

如果想被外部传入的 props 始终控制，需要这样写：

```jsx
useSomething = (inputCount) => {
    const [ count, setCount ] = setState(inputCount);
    setCount(inputCount);
};
```

`setCount`后，React 会立即退出当前的 render 并用更新后的 state 重新运行 render 函数。建议将当前值与上一次的值进行比较，只有确定发生变化时执行 `setCount` 。