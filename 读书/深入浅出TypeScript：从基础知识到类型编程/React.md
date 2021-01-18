## Props

无状态组件：`React.SFC`和`React.FC`之中定义好了很多React的props类型，可以用泛型传入我们自定义的props.

有状态组件：除了 props 之外还需要 state ，对于 class 写法的组件要泛型的支持，即 `Component<P, S>` ，因此需要传入传入 state 和 props 的类型。

`React.ComponentType<P>` 是 `React.FunctionComponent<P> | React.ClassComponent<P>` 的别名，表示传递到HOC的组件可以是类组件或者是函数组件。

## 事件

React 内部的事件其实都是合成事件，也就是说都是经过 React 处理过的，所以并不是原生事件，因此通常情况下我们这个时候需要定义 React 中的事件类型。

```ts
private updateValue(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ itemText: e.target.value })
}

private handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // ...
}
```

## 默认属性

**默认属性**的小技巧：就是利用 class 来同时声明类型和创建初始值。

```ts
// props.type.ts

interface InputSetting {
    placeholder?: string
    maxlength?: number
}

export class TodoInputProps {
    public handleSubmit: (value: string) => void
    public inputSetting?: InputSetting = {
        maxlength: 20,
        placeholder: '请输入todo',
    }
}

export class TodoInput extends React.Component<TodoInputProps, State>{
  public static defaultProps = new TodoInputProps()
}
```

用 class 作为 props 类型以及生产默认属性实例有以下好处：

- 代码量少：一次编写，既可以作为类型也可以实例化作为值使用
- 避免错误：分开编写一旦有一方造成书写错误不易察觉

# Redux

定义 `constants`

```ts
// constants/todo.ts
export enum ActionTodoConstants {
    ADD_TODO = 'todo/add',
    TOGGLE_TODO = 'todo/toggle'
}
```

