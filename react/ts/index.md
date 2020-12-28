## 工具

- [TypeScript Playground with React](https://www.typescriptlang.org/play?#code/JYWwDg9gTgLgBAKjgQwM5wEoFNkGN4BmUEIcA5FDvmQNwCwAUKJLHAN5wCuqWAyjMhhYANFx4BRAgSz44AXzhES5Snhi1GjLAA8W8XBAB2qeAGEInQ0KjjtycABsscALxwAFAEpXAPnaM4OANjeABtA0sYUR4Yc0iAXVcxPgEhdwAGT3oGAOTJaXx3L19-BkDAgBMIXE4QLCsAOhhgGCckgAMATQsgh2BcAGssCrgAEjYIqwVmutR27MC5LM0yuEoYTihDD1zAgB4K4AA3H13yvbAfbs5e-qGRiYspuBmsVD2Aekuz-YAjThgMCMcCMpj6gxcbGKLj8MTiVnck3gAGo4ABGTxyU6rcrlMF3OB1H5wT7-QFGbG4z6HE65ZYMOSMIA)：可以在线调试 React + TypeScript，只能调试类型，并不能运行代码
- [Stackblitz](https://stackblitz.com/edit/react-typescript-base)：云开发工具，可以直接运行 React 代码并且预览
- [Create React App TypeScript](https://create-react-app.dev/docs/adding-typescript/): 本地用脚手架生成 React + TS 的项目

### React 相关类型

```ts
export declare interface AppProps {
  children1: JSX.Element; // ❌ 不推荐 没有考虑数组
  children2: JSX.Element | JSX.Element[]; // ❌ 不推荐 没有考虑字符串 children
  children4: React.ReactChild[]; // 稍微好点 但是没考虑 null
  children: React.ReactNode; // ✅ 包含所有 children 情况
  functionChildren: (name: string) => React.ReactNode; // ✅ 返回 React 节点的函数
  style?: React.CSSProperties; // ✅ 推荐 在内联 style 时使用
  // ✅ 推荐原生 button 标签自带的所有 props 类型
  // 也可以在泛型的位置传入组件 提取组件的 Props 类型
  props: React.ComponentProps<"button">;
  // ✅ 推荐 利用上一步的做法 再进一步的提取出原生的 onClick 函数类型 
  // 此时函数的第一个参数会自动推断为 React 的点击事件类型
  onClickButton：React.ComponentProps<"button">["onClick"]
}
```

## 函数式组件

利用 `React.FC` 内置类型的话，不光会包含你定义的 `AppProps` 还会自动加上一个 children 类型，以及其他组件上会出现的类型：

```tsx
// 等同于
AppProps & { 
  children: React.ReactNode 
  propTypes?: WeakValidationMap<P>;
  contextTypes?: ValidationMap<any>;
  defaultProps?: Partial<P>;
  displayName?: string;
}

// 使用
interface AppProps = { message: string };

const App: React.FC<AppProps> = ({ message, children }) => {
  return (
    <>
     {children}
     <div>{message}</div>
    </>
  )
};
```

## Hooks

`@types/react` 包在 16.8 以上的版本开始对 Hooks 的支持。

### useState

如果你的默认值已经可以说明类型，那么不用手动声明类型，交给 TS 自动推断即可

如果初始值是 null 或 undefined，那就要通过泛型手动传入你期望的类型。

### useReducer

需要用 [Discriminated Unions](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html#discriminated-unions) 来标注 Action 的类型。

```tsx
const initialState = { count: 0 };

type ACTIONTYPE =
  | { type: "increment"; payload: number }
  | { type: "decrement"; payload: string };

function reducer(state: typeof initialState, action: ACTIONTYPE) {
  switch (action.type) {
    case "increment":
      return { count: state.count + action.payload };
    case "decrement":
      return { count: state.count - Number(action.payload) };
    default:
      throw new Error();
  }
}

function Counter() {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  return (
    <>
      Count: {state.count}
      <button onClick={() => dispatch({ type: "decrement", payload: "5" })}>
        -
      </button>
      <button onClick={() => dispatch({ type: "increment", payload: 5 })}>
        +
      </button>
    </>
  );
}
复制代码
```

「Discriminated Unions」一般是一个联合类型，其中每一个类型都需要通过类似 `type` 这种特定的字段来区分，当你传入特定的 `type` 时，剩下的类型 `payload` 就会自动匹配推断。

这样：

- 当你写入的 `type` 匹配到 `decrement` 的时候，TS 会自动推断出相应的 `payload` 应该是 `string` 类型。
- 当你写入的 `type` 匹配到 `increment` 的时候，则 `payload` 应该是 `number` 类型。

这样在你 `dispatch` 的时候，输入对应的 `type`，就自动提示你剩余的参数类型啦。

### useEffect

需要注意的是，useEffect 传入的函数，它的返回值要么是一个**方法**（清理函数），要么就是**undefined**，其他情况都会报错。也就是说async函数不能传入到 useEffect 里

### useRef

这个 Hook 在很多时候是没有初始值的，这样可以声明返回对象中 `current` 属性的类型：

```ts
const ref2 = useRef<HTMLElement>(null);
```

例：

```tsx
function TextInputWithFocusButton() {
  const inputEl = React.useRef<HTMLInputElement>(null);
  const onButtonClick = () => {
    if (inputEl && inputEl.current) {
      inputEl.current.focus();
    }
  };
  return (
    <>
      <input ref={inputEl} type="text" />
      <button onClick={onButtonClick}>Focus the input</button>
    </>
  );
}
复制代码
```

当 `onButtonClick` 事件触发时，可以肯定 `inputEl` 也是有值的，因为组件是同级别渲染的，但是还是依然要做冗余的非空判断。

有一种办法可以绕过去。

```ts
const ref1 = useRef<HTMLElement>(null!);
```

`null!` 这种语法是非空断言，跟在一个值后面表示你断定它是有值的，所以在你使用 `inputEl.current.focus()` 的时候，TS 不会给出报错。

但是这种语法比较危险，需要尽量减少使用。

### useImperativeHandle

推荐使用一个自定义的 `innerRef` 来代替原生的 `ref`，否则要用到 `forwardRef` 会搞的类型很复杂。

```ts
type ListProps = {
  innerRef?: React.Ref<{ scrollToTop(): void }>
}

function List(props: ListProps) {
  useImperativeHandle(props.innerRef, () => ({
    scrollToTop() { }
  }))
  return null
}
复制代码
```

结合刚刚 `useRef` 的知识，使用是这样的：

```tsx
function Use() {
  const listRef = useRef<{ scrollToTop(): void }>(null!)

  useEffect(() => {
    listRef.current.scrollToTop()
  }, [])

  return (
    <List innerRef={listRef} />
  )
}
```

### 自定义 Hook

如果你想仿照 useState 的形式，返回一个数组给用户使用，一定要记得在适当的时候使用 `as const`，标记这个返回值是个常量，告诉 TS 数组里的值不会删除，改变顺序等等……

否则，你的每一项都会被推断成是「所有类型可能性的联合类型」，这会影响用户使用。

```ts
export function useLoading() {
  const [isLoading, setState] = React.useState(false);
  const load = (aPromise: Promise<any>) => {
    setState(true);
    return aPromise.finally(() => setState(false));
  };
  // ✅ 加了 as const 会推断出 [boolean, typeof load]
  // ❌ 否则会是 (boolean | typeof load)[]
  return [isLoading, load] as const;[]
}
```

### forwardRef

函数式组件默认不可以加 ref，它不像类组件那样有自己的实例。这个 API 一般是函数式组件用来接收父组件传来的 ref。

所以需要标注好实例类型，也就是父组件通过 ref 可以拿到什么样类型的值。

```tsx
type Props = { };
export type Ref = HTMLButtonElement;
export const FancyButton = React.forwardRef<Ref, Props>((props, ref) => (
  <button ref={ref} className="MyClassName">
    {props.children}
  </button>
));
```

