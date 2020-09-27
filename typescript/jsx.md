想要使用JSX必须做两件事：

1. 给文件一个`.tsx`扩展名
2. 启用`jsx`选项

TypeScript具有三种JSX模式：`preserve`，`react`和`react-native`。 

| 模式           | 输入      | 输出                         | 输出文件扩展名 |
| -------------- | --------- | ---------------------------- | -------------- |
| `preserve`     | `<div />` | `<div />`                    | `.jsx`         |
| `react`        | `<div />` | `React.createElement("div")` | `.js`          |
| `react-native` | `<div />` | `<div />`                    | `.js`          |

## `as`操作符

TypeScript在`.tsx`文件里禁用了使用尖括号的类型断言。因为jsx的写法也需要用到尖括号，所以我们必须使用`as`进行类型断言

### 固有元素

固有元素（`div`，`span`等）使用特殊的接口`JSX.IntrinsicElements`来查找。 默认地，如果这个接口没有指定，会全部通过，不对固有元素进行类型检查。

```tsx
declare namespace JSX {
    interface IntrinsicElements {
        foo: any
    }
}

<foo />; // 正确
<bar />; // 错误
```

> 注意：你也可以在`JSX.IntrinsicElements`上指定一个用来捕获所有字符串索引：

```tsx
declare namespace JSX {
    interface IntrinsicElements {
        [elemName: string]: any;
    }
}
```

### 组件

#### 函数组件

第一个参数是`props`对象。 TypeScript会强制它的返回值可以赋值给`JSX.Element`。

```tsx
interface FooProp {
  name: string;
  X: number;
  Y: number;
}

declare function AnotherComponent(prop: {name: string});
function ComponentFoo(prop: FooProp) {
  return <AnotherComponent name={prop.name} />;
}

const Button = (prop: {value: string}, context: { color: string }) => <button>
```

函数组件是简单的JavaScript函数，所以我们还可以利用函数重载。

#### 类组件

分为**类类型**和**实例类型**。

在ES6类的情况下，实例类型为这个类的实例的类型。

元素的实例类型很有趣，因为它必须赋值给`JSX.ElementClass`或抛出一个错误。 默认的`JSX.ElementClass`为`{}`，但是它可以被扩展用来限制JSX的类型以符合相应的接口。

```tsx
declare namespace JSX {
  interface ElementClass {
    render: any;
  }
}

class MyComponent {
  render() {}
}
function MyFactoryFunction() {
  return { render: () => {} }
}

<MyComponent />; // 正确
<MyFactoryFunction />; // 正确

class NotAValidComponent {}
function NotAValidFactoryFunction() {
  return {};
}

<NotAValidComponent />; // 错误
<NotAValidFactoryFunction />; // 错误
```

### 属性类型检查

对于固有元素，这是`JSX.IntrinsicElements`属性的类型。

对于组件，它取决于先前确定的在元素实例类型上的某个属性的类型。 至于该使用哪个属性来确定类型取决于`JSX.ElementAttributesProperty`。 它应该使用单一的属性来定义。 这个属性名之后会被使用。 TypeScript 2.8，如果未指定`JSX.ElementAttributesProperty`，那么将使用类元素构造函数或函数组件调用的第一个参数的类型。

```tsx
declare namespace JSX {
  interface ElementAttributesProperty {
    props; // 指定用来使用的属性名
  }
}

class MyComponent {
  // 在元素实例类型上指定属性
  props: {
    foo?: string;
  }
}

// `MyComponent`的元素属性类型为`{foo?: string}`
<MyComponent foo="bar" />
```

