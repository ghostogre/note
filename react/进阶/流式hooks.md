Hooks 适合通过「**基于变更**」的声明风格来书写，而非「**基于回调**」的命令式方式来书写。这会让一个组件更易于拆分和复用逻辑并拥有更清晰的逻辑依赖关系。

### 一：通过 useEffect 声明请求

**基于回调的写法（仿类写法）**

```ts
const Demo: React.FC = () => {
    const [state, setState] = useState({
        keyword: '',
    });
    const query = useCallback((queryState: typeof state) => {
        // ...
    }, []);
    const handleKeywordChange = useCallback((e: React.InputEvent) => {
        const latestState = { ...state, keyword: e.target.value };
        setState(latestState);
        query(latestState);
    }, [state, query]);
    return // view
}
```

有几个问题：

- handleKeywordChange 若在两次渲染中被多次调用（比如多次连续点击按钮，几次点击 useCallback 里面state可能还是旧的值），会出现 state 过旧的问题，从而得到的 latestState 将不是最新的，会产生bug。
- query 方法每次都需要在 handler 中被命令式地调用，如果需要调用它的 handler 变多，则依赖关系语法复杂（难以理清依赖），且容易疏忽忘记手动调用。
- query 使用的 queryState 就是最新的 state，却每次需要由 handler 将 state 计算好交给 query 函数，方法间职责分割得不明确。

**基于变更的写法**

```ts
const Demo: React.FC = () => {
    const [state, setState] = useState({
        keyword: '',
    });
    const handleKeywordChange = useCallback((e: React.InputEvent) => 
        {
            const nextKeyword = e.target.value;
            setState(prev => ({ ...prev, keyword: nextKeyword }))
        }, []);
    useEffect(() => {
        // query
    }, [state]);
    return // view
}
```

把 state 作为了 useEffect 的依赖，只要 state 发生变更，effect 里的 query 代码就会自动执行，且执行时机一定是在 state 变更以后。我们没有命令式地调用 query，而是声明了在什么情况下它应当被调用。

handleKeywordChange 修改 state => 触发 effect 执行 query。

> 万一需求场景要求我们在 state 的某些特定字段变更的时候不触发 query，上面的写法就失效了

### 二：注册对 window size 的监听

需求场景：在 window resize 时触发 callback 函数

**基于回调的写法（仿类写法）**

```ts
const Demo: FC = () => {
    const callback = // ...
    useEffect(() => {
        window.addEventListener('resize', callback);
        return () => window.removeEventListener('resize', callback);
    }, []);
    return // view
}
```

这样 window 对象上挂载的监听将会是组件第一次执行产生的 callback，之后所有执行轮次中产生的 callback 都将不会被挂载到 window 的订阅者中

##### **基于回调的写法2**

```javascript
const Demo: FC = () => {
    const callback = // ...
    useEffect(() => {
        window.addEventListener('resize', callback);
        return () => window.removeEventListener('resize', callback);
    }, [callback]);
    return // view
}
```

疯狂地在 window 对象上注册注销注册注销，听起来就不太合理

##### **基于变更的写法**

```javascript
const Demo: FC = () => {
    const [windowSize, setWindowSize] = useState([
        window.innerWidth,
        window.innerHeight
    ] as const);
    useEffect(() => {
        const handleResize = () => {
            setWindowSize([window.innerWidth, window.innerHeight]);
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const callback = // ...
    useEffect(callback, [windowSize]);
    return // view
};
```

把 window resize 从一个回调的注册注销过程转换成了一个表示 window size 的 state。之后依赖这个 state 的变更实现了对 callback 的调用。

```ts
const useWindowSize = () => {
    const [windowSize, setWindowSize] = useState([window.innerWidth, window.innerHeight] as const);
    useEffect(() => {
        const handleResize = () => {
            setWindowSize([window.innerWidth, window.innerHeight]);
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return windowSize
}
```

## 不可变数据流与「执行帧」

基于变更的 Hooks coding 其实弱化了 callback，把 callback 包装起来成为流或操作符。

### 不可变数据流

为了完全地体现「变更」，所有的状态更新都要做到 **immutable** 简而言之：**让引用的变化与值的变化完全一致**

为了实现这一点，你可以：

1. 每次 setState 的时候注意
2. 自己实现一些 immutable utils
3. 借助第三方的数据结构库

### 执行帧

在 Hooks-based 编程中，我们还要有所谓「执行帧」的概念。

在组件上下文中的 state 或 props 一旦发生变更，就会触发组件的执行。每次执行就相当于一帧渲染的绘制。

## 变更的源头

对一个组件来说，能触发它重新渲染的变更称为「源」source。 一个组件的变更源一般有以下几种：

- **props 变更**：即父组件传递给组件的 props 发生变更
- **事件 event**：如点击，如上文的 window resize 事件。对事件，需要将事件回调包装成 state
- **调度器**：即 animationFrame / interval / timeout

## 流式操作符

「流式 Hook」是由基本 Hooks 复合而成的更高阶的 Hooks，可以具有高度的复用性，使得代码逻辑更简练。在流式编程中的 operator（操作） 几乎都可以在 Hooks 中通过自定义 Hooks 写出同构的表示。

### 映射(map)

通过 useMemo 就可以直接实现把一些变更整合到一起得到一个「computed」状态

```ts
const [state1, setState1] = useState(initalState1);
const [state2, setState2] = useState(initialState2);
const computedState = useMemo(() => {
    return Array(state2).fill(state1).join('');
}, [state1, state2]);
```

### 跳过前几次(skip) / 只在前几次响应(take)

有时候我们不想在第一次的时候执行 effect 里的函数，或进行 computed 映射。可以实现自己实现的 useCountEffect / useCountMemo 来实现

```ts
const useCountMemo = <T>(callback: (count: number) => T, deps: any[]): T => {
    const countRef = useRef(0);
    return useMemo(() => {
        const returnValue = callback(countRef.current);
        countRef.current++;
        return returnValue;
    }, deps);
};
export const useCountEffect = (cb: (index: number) => any, deps?: any[]) => {
    const countRef = useRef(0);
    useEffect(() => {
        const returnValue = cb(countRef.current);
        currentRef.current++;
        return returnValue;        
    }, deps);
};
```

### 流程与调度(debounce / throttle / delay)

在基于变更的 Hooks 组件中，debounce / throttle / delay 等操作变得非常简单。debounce / throttle / delay 的对象将不再是 callback 函数本身，而是变更的状态

```ts
const useDebounce = <T>(value: T, time = 250) => {
    const [debouncedState, setDebouncedState] = useState(null);
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedState(value);
        }, time);
        return () => clearTimeout(timer);
    }, [value]);
    return debouncedState;
};
const useThrottle = <T>(value: T, time = 250) => {
    const [throttledState, setThrottledState] = useState(null);
    const lastStamp = useRef(0);
    useEffect(() => {
        const currentStamp = Date.now();
        if (currentStamp - lastStamp > time) {
            setThrottledState(value);
            lastStamp.current = currentStamp;
        }
    }, [value]);
    return throttledState
}
```

### action / reducer 模式的异步流程

Redux 的核心架构 action / reducer 模式在 Hooks 中的实现非常简单，React 甚至专门提供了一个经过封装的语法糖钩子 useReducer 来实现这种模式。

## 单例的 Hooks——全局状态管理

通过 Hooks 管理全局状态可以与传统方式一样，例如借助 context 配合 redux 通过 Provider 来下发全局状态。这里推荐更 Hooks 更方便的一种方式——单例 Hooks：[Hox](https://github.com/umijs/hox)

## 流式 Hooks 局限性

「基于变更」的 Hooks 组件书写由于与流式编程非常相似，我也把他称作「流式 Hooks」。

通过合适的逻辑拆分和复用，流式 Hooks 可以实现非常细粒度且高内聚的代码逻辑。在长期实践中也证明了它是比较易于维护的。

### 「过频繁」的变更

在 React 中，存在三种不同「帧率」或「频繁度」的东西：

- **调和 reconcile**：把 virtualDOM 的变更同步到真实的 DOM 上去
- **执行帧 rendering**：即 React 组件的执行频率
- **事件 event**：即事件 dispatch 的频率

这三者的触发频率是从上至下越来越高的

由于 React Hooks 的变更传播的最小粒度是「执行帧」粒度，故一旦事件的发生频率高过它（一般来说只会是同步的多次事件的触发），这种风格的 Hooks 就需要一些较为 Hack 的逻辑来兜底处理。

