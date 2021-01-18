Hooks本质上就是一类特殊的函数，它们可以为你的**函数型组件**注入一些特殊的功能。

react都核心思想就是，将一个页面拆成一堆独立的，可复用的组件，并且用自上而下的单向数据流的形式将这些组件串联起来。但假如你在大型的工作项目中用react，你会发现你的项目中实际上很多react组件冗长且难以复用。尤其是那些写成class的组件，它们本身包含了状态（state），所以复用这类组件就变得很麻烦。

那之前，官方推荐怎么解决这个问题呢？答案是：[渲染属性（Render Props）](https://reactjs.org/docs/render-props.html)和[高阶组件（Higher-Order Components）](https://reactjs.org/docs/higher-order-components.html)。

- 渲染属性指的是使用一个值为函数的prop来传递需要动态渲染的nodes或组件。（虽然这个模式叫Render Props，但不是说非用一个叫render的props不可）
- 高阶组件这个概念就更好理解了，说白了就是一个函数接受一个组件作为参数，经过一系列加工后，最后返回一个新的组件。

但是上述方法都会增加过多的层次。

## 为什么需要hooks

1. 复用一个有状态的组件太麻烦（上述高阶组件，渲染属性等问题），使用高阶组件会使组件树层级变深。
2. 生命周期钩子函数里的逻辑太乱（生命周期钩子函数里通常同时做了很多事情），hooks代码可读性更强。
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

### Hook state粒度

把所有 state 都放在同一个 `useState` 调用中，或是每一个字段都对应一个 `useState` 调用，这两方式都能跑通。当你在这两个极端之间找到平衡，然后把相关 state 组合到几个独立的 state 变量时，组件就会更加的可读。

**当创建初始 state 很昂贵时：**

```js
function Table(props) {
  // ⚠️ createRows() 每次渲染都会被调用
  const [rows, setRows] = useState(createRows(props.count));
  // ...
}
```

为避免重新创建被忽略的初始 state，我们可以传一个 **函数** 给 `useState`：

```js
function Table(props) {
  // ✅ createRows() 只会被调用一次
  const [rows, setRows] = useState(() => createRows(props.count));
  // ...
}
```

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

**尽量将函数写在 `useEffect` 内部**

为了避免遗漏依赖，必须将函数写在 `useEffect` 内部，这样 [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks) 才能通过静态分析补齐依赖项：

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function getFetchUrl() {
      return "https://v?query=" + count;
    }

    getFetchUrl();
  }, [count]);

  return <h1>{count}</h1>;
}
```

`getFetchUrl` 这个函数依赖了 `count`，而如果将这个函数定义在 `useEffect` 外部，无论是机器还是人眼都难以看出 `useEffect` 的依赖项包含 `count`。

`useEffect` 对业务的抽象非常方便：

1. 依赖项是查询参数，那么 `useEffect` 内可以进行取数请求，那么只要查询参数变化了，列表就会自动取数刷新。注意我们将取数时机从触发端改成了接收端。
2. 当列表更新后，重新注册一遍拖拽响应事件。也是同理，依赖参数是列表，只要列表变化，拖拽响应就会重新初始化，这样我们可以放心的修改列表，而不用担心拖拽事件失效。
3. 只要数据流某个数据变化，页面标题就同步修改。同理，也不需要在每次数据变化时修改标题，而是通过 `useEffect` “监听” 数据的变化，这是一种 **“控制反转”** 的思维。

### 实现组件销毁和组件创建生命周期

```js
// 依赖数组为空数组，只会调用一次useEffect
useEffect(() => {
  console.log('mount') // 会在第一次渲染的时候打印
  return () => {
    console.log('unmount') // 在组件卸载的时候调用
  }
}, [])
```

每次 Render 的内容都会形成一个快照并保留下来，因此当状态变更而 Rerender 时，就形成了 N 个 Render 状态，而每个 Render 状态都拥有自己固定不变的 Props 与 State。其实不仅是对象，函数在每次渲染时也是独立的，这就是 **Capture Value** 特性。

## useRef

**可以认为 `ref` 在所有 Render 过程中保持着唯一引用，因此所有对 `ref` 的赋值或取值，拿到的都只有一个最终状态**，而不会在每个 Render 间存在隔离。

与 class 组件进行比较，`useRef` 的作用相对于让你在 class 组件的 `this` 上追加属性（实例变量）。用于保存与渲染无关的变量（例如点击一个商品列表弹窗，需要保持一个index或者id，弹框只有在确定按钮点击的时候才用这个变量去进行请求操作，官方例子用它来保存定时器ID进行定时器的清除）

避免在渲染过程中设置引用 - 这可能会导致令人惊讶的行为。只在事件处理程序和 effects 中修改引用。

```jsx
const components = () => {
    const ref = useRef() // 每次都返回同一个引用
    useEffect(() => {
        ref.current = state // ref相当于this
    })
}

// 或者
export default function HookDemo() {
  const [count] = useState({ count: 1 });
  
  const countRef = useRef(count);
  // countRef.current被初始化成count

  return (
    <div>
      {count.count}
      <button onClick={() => { countRef.current.count = 10; }}>
        改变ref
      </button>
    </div>
  );
}
```

**`useRef` 保存的变量不会随着每次数据的变化重新生成，而是保持在我们最后一次赋值时的状态，依靠这种特性，再配合 `useCabllback` 和 `useEffect` 我们可以实现 `preProps/preState`的功能。**

`useRef` 尽量少用，大量 Mutable 的数据会影响代码的可维护性。

但对于不需重复初始化的对象推荐使用 `useRef` 存储

## useReducer

```jssx
const [state, dispatch] = useReducer(reducer, initialArg, init);
```

`useState` 的替代方案。它接收一个形如 `(state, action) => newState` 的 reducer，并返回当前的 state 以及与其配套的 `dispatch` 方法。

其本质是让函数与数据解耦，**函数只管发出指令，而不需要关心使用的数据被更新时，需要重新初始化自身。**

局部状态不推荐使用 `useReducer` ，会导致函数内部状态过于复杂，难以阅读。 `useReducer` 建议在多组件间通信时，结合 `useContext` 一起使用。

## useCallback

把内联回调函数及依赖项数组作为参数传入 `useCallback`，它将返回该回调函数的 memoized 版本，该回调函数仅在某个依赖项改变时才会更新。当你把回调函数传递给经过优化的并使用引用相等性去避免非必要渲染（例如 `shouldComponentUpdate`）的子组件时，它将非常有用。

`useCallback(fn, deps)` 相当于 `useMemo(() => fn, deps)`。

**内联函数**很“便宜”，所以在每次渲染时重新创建函数不是问题，每个组件有几个内联函数是可以接受的。

在某些情况下，你需要保留一个函数的一个实例:

- 包装在 `React.memo()`（或 `shouldComponentUpdate` ）中的组件接受回调prop。
- 当函数用作其他hooks的依赖项时 `useEffect(...，[callback])`

有种说法是，**只有 inline 函数需要，另外要必须配合 memo 使用才可能会优化性能，否则可能造成负优化**。

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

## 使用 useMemo

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

// 用 React.useMemo 优化渲染性能
// 跳过一次子节点的昂贵的重新渲染
// 注意这种方式在循环中是无效的，因为 Hook 调用 不能 被放在循环中。
// 这种方式在Taro中使用会报错
const memoComponentsA = useMemo(() => (
    <ComponentsA {...someProps} />
), [someProps]);
```

> 推荐使用 `React.useMemo` 而不是 `React.memo`，因为在组件通信时存在 `React.useContext` 的用法，这种用法会使所有用到的组件重渲染，只有 `React.useMemo` 能处理这种场景的按需渲染。

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

记住，传给 `useMemo` 的函数是在渲染期间运行的。不要在其中做任何你通常不会在渲染期间做的事。

适用的场景：

- 有些计算开销很大，我们就需要「记住」它的返回值，避免每次 render 都去重新计算。
- 由于值的引用发生变化，导致下游组件重新渲染，我们也需要「记住」这个值。

假如计算开销不是很大，我们可以去掉useMemo

```ts
const [count, setCount] = useState<number>(0)
const [score, setScore] = useState<number>(1)

const sum = count + score // 每次重新渲染都会执行，state改变就会触发重新渲染
```

### `useMemo` 能做的难道不能用 `useEffect` 来做吗？

传入 `useMemo` 的函数会在**渲染期间执行**。请不要在这个函数内部执行与渲染无关的操作，诸如副作用这类的操作属于 `useEffect` 的适用范畴，而不是 `useMemo。 在此不得不提 `React.memo` ，它的作用是实现整个组件的 `Pure` 功能：

```text
const Show:React.FC<Data> = React.memo(({ time, children }) => {...}
```

所以简单用一句话来概括 `useMemo` 和 `React.memo` 的区别就是：前者在某些情况下不希望组件对所有 `props` 做浅比较，只想实现局部 `Pure` 功能，即只想对特定的 `props` 做比较，并决定是否局部更新。

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

> StrictMode 在 development mode 下一些 hooks 的回调会调用两次以确保没有副作用。

### `getDerivedStateFromProps`

把 prop 上一轮的值存在一个 state 变量中以便比较。

### 依赖列表

**只有** 当函数（以及它所调用的函数）不引用 props、state 以及由它们衍生而来的值时，你才能放心地把它们从依赖列表中省略。

**推荐把使用到的函数移动到你的 effect \*内部\***。这样就能很容易的看出来你的 effect 使用了哪些 props 和 state，并确保它们都被声明了

**如果处于某些原因你 \*无法\* 把一个函数移动到 effect 内部，还有一些其他办法：**

1. **可以尝试把那个函数移动到你的组件之外**。
2. 如果你所调用的方法是一个纯计算，并且可以在渲染时调用，你可以 **转而在 effect 之外调用它，**并让 effect 依赖于它的返回值。
3. 万不得已的情况下，你可以 **把函数加入 effect 的依赖但 \*把它的定义包裹\*** 进 [`useCallback`](https://zh-hans.reactjs.org/docs/hooks-reference.html#usecallback) Hook。这就确保了它不随渲染而改变

传入空的依赖数组 `[]`，意味着该 hook 只在组件挂载时运行一次，并非重新渲染时。

当 effect 执行时，我们会创建一个闭包，并将 state 的值被保存在该闭包当中。每次执行都是在这个初始值上面进行，假如我们需要设置一个定时器肯定是需要在第一次渲染执行而不是每一次（空的依赖数组），但是如果定时器里面修改state的话，我们就需要在上一次state的值上面进行操作。**函数式更新**就能解决这个问题，当然我们还可以使用`useRef`来处理。

#### 总结

- 依赖数组依赖的值最好不要超过 3 个，否则会导致代码会难以维护。
- 如果发现依赖数组依赖的值过多，我们应该采取一些方法来减少它。
  - 去掉不必要的依赖。
  - 将 Hook 拆分为更小的单元，每个 Hook 依赖于各自的依赖数组。
  - 通过合并相关的 state，将多个依赖值聚合为一个。
  - 通过 `setState` 回调函数获取最新的 state，以减少外部依赖。
  - 通过 `ref` 来读取可变变量的值，不过需要注意控制修改它的途径。

### Hook 会因为在渲染时创建函数而变慢吗？ 

不会。在现代浏览器中，闭包和类的原始性能只有在极端场景下才会有明显的差别。

传统上认为，在 React 中使用内联函数对性能的影响，与每次渲染都传递新的回调会如何破坏子组件的 `shouldComponentUpdate` 优化有关。

- [`useCallback`](https://zh-hans.reactjs.org/docs/hooks-reference.html#usecallback) Hook 允许你在重新渲染之间保持对相同的回调引用以使得 `shouldComponentUpdate` 继续工作
- [`useMemo`](https://zh-hans.reactjs.org/docs/hooks-faq.html#how-to-memoize-calculations) Hook 使得控制具体子节点何时更新变得更容易，减少了对纯组件的需要。
- [`useReducer`](https://zh-hans.reactjs.org/docs/hooks-reference.html#usereducer) Hook 减少了对深层传递回调的依赖

### 如何避免向下传递回调？

在大型的组件树中，我们推荐的替代方案是通过 context 用 [`useReducer`](https://zh-hans.reactjs.org/docs/hooks-reference.html#usereducer) 往下传一个 `dispatch` 函数

```jsx
const TodosDispatch = React.createContext(null);

function TodosApp() {
  // 提示：`dispatch` 不会在重新渲染之间变化
  const [todos, dispatch] = useReducer(todosReducer);

  return (
    <TodosDispatch.Provider value={dispatch}>
      <DeepTree todos={todos} />
    </TodosDispatch.Provider>
  );
}
```

## 底层原理 

### React 是如何把对 Hook 的调用和组件联系起来的？ 

React 保持对当先渲染中的组件的追踪。多亏了 [Hook 规范](https://zh-hans.reactjs.org/docs/hooks-rules.html)，我们得知 Hook 只会在 React 组件中被调用（或自定义 Hook —— 同样只会在 React 组件中被调用）。

每个组件内部都有一个「记忆单元格」列表。它们只不过是我们用来存储一些数据的 JavaScript 对象。当你用 `useState()` 调用一个 Hook 的时候，它会读取当前的单元格（或在首次渲染时将其初始化），然后把指针移动到下一个。这就是多个 `useState()` 调用会得到各自独立的本地 state 的原因。



> StrictMode 在 development mode 下一些 hooks 的回调会调用两次以确保没有副作用。





