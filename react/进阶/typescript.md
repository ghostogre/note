# 基本用法

想要使用JSX必须做两件事：

1. 给文件一个`.tsx`扩展名
2. 启用`jsx`选项

TypeScript具有三种JSX模式：`preserve`，`react`和`react-native`。 这些模式只在代码生成阶段起作用 - 类型检查并不受影响。 在`preserve`模式下生成代码中会保留JSX以供后续的转换操作使用（比如：[Babel](https://babeljs.io/)）。 另外，输出文件会带有`.jsx`扩展名。 `react`模式会生成`React.createElement`，在使用前不需要再进行转换操作了，输出文件的扩展名为`.js`。 `react-native`相当于`preserve`，它也保留了所有的JSX，但是输出文件的扩展名是`.js`。

| 模式           | 输入     | 输出                         | 输出文件扩展名 |
| :------------- | :------- | :--------------------------- | :------------- |
| `preserve`     | `<div/>` | `<div/>`                     | `.jsx`         |
| `react`        | `<div/>` | `React.createElement("div")` | `.js`          |
| `react-native` | `<div/>` | `<div/>`                     | `.js`          |

### `as`操作符

TypeScript在`.tsx`文件里禁用了使用尖括号的类型断言。尖括号和jsx本身的语法冲突，所以我们要使用`as`。

### 类型检查

dom元素使用小写开头，组件使用大写开头。

### 在 react 中使用 ts 的几点原则和变化

- 所有用到`jsx`语法的文件都需要以`tsx`后缀命名
- 使用组件声明时的`Component`泛型参数声明，来代替PropTypes！
- 全局变量或者自定义的window对象属性，统一在项目根下的`global.d.ts`中进行声明定义
- 对于项目中常用到的接口数据对象，在`types/`目录下定义好其结构化类型声明

### 有类型约束的函数组件

```tsx
// 没有使用React.FC
const HelloOld = (props: Greeting) => <Button>你好{props.name}</Button>;
 
// 使用React.FC泛型类型
const Hello: React.FC<Greeting> = (props) => {
   return (
      <Button>Hello {props.name}</Button>
   )
};
```

定义函数组件时，使用React.FC与不使用没有太多区别，没有为我们带来明显的好处，建议使用常规定义方式。

### 有类型约束的类组件

```tsx
import React,{Fragment} from "react";
import { Button } from "antd";
 
interface Greeting {
   name: string;
   firstName?: string;
   lastName?: string;
}
interface State {
   count: number
}
 
// 泛型类型，第一个传入参数约束属性props，第二个约束状态state(内部数据)
class HelloClass extends React.Component<Greeting, State> {
   state: State = {
      count: 0
   };
   static defaultProps = {  // 属性默认值
      firstName: "",
      lastName: "",
   };
 
   render() {
      return (
         <Fragment>
            <p>点击了{this.state.count}次</p>
            <Button onClick={()=>{this.setState({count: this.state.count+1})}}>Hello{this.props.name}Class</Button>
         </Fragment>
      );
   }
}
 
export default HelloClass;
```

### 约束高阶组件

```tsx
import React from "react";
import HelloClass from "./HelloClass";
 
interface Loading {
   loading: boolean;
}
 
function HelloHoc<P>(params?: any) {
   return function<P>(WrappedComponent: React.ComponentType<P>) { // P表示被包装组件的属性的类型
      return class NewComponent extends React.Component<P & Loading>{ // 这里使用交叉类型，为新组件增加一些属性,接口Loading定义了新增的属性声明
         render(){
            return this.props.loading ? <div>Loading</div> : <WrappedComponent {...this.props as P}/>
 
         }
      }
   }
}
 
export default HelloHoc()(HelloClass);
```

高阶组件在ts中使用会有比较多的类型问题，解决这些问题通常不会很顺利，而且会存在一些已知的bug，这不是高阶组件本身的问题，而是React声明文件还没有很好地兼容高阶组件的类型检查，更好的方式是使用Hooks

### 有类型约束的Hooks

```tsx
import React, { useState, useEffect } from "react";
import { Button } from "antd";
 
interface Greeting {
   name: string;
   firstName?: string;
   lastName?: string;
}
 
const HelloHooks = (props: Greeting) => {
   const [ count, setCount ] = useState(0); // 设了初值，所以不用定义类型
   const [ text, setText ] = useState<string | null>(null);
 
   useEffect(()=>{
      count > 5 && setText("休息一下");
   },[count]); // 第二个参数的作用是，只有当count改变的时候，函数内的逻辑才会执行。
 
   return (
      <>
         <p>你点击了Hooks {count} 次 {text}</p>
         <Button onClick={()=>{setCount(count+1)}}>{props.name}</Button>
      </>
   );
};
 
export default HelloHooks;
```

### 事件绑定

```tsx
class HelloClass extends React.Component<Greeting, State> {
   state: State = {
      count: 0
   };
 
   clickHandle = (e: React.MouseEvent) => { // 事件对象e的类型使用内置的合成事件。在回调函数中，e的属性都会无效
      e.persist(); // 将该事件从池中删除合成事件，可以正常使用
      console.log(e);
      // this.setState({count: this.state.count+1})
   };
 
   inputHandle = (e: React.FormEvent<HTMLInputElement>) => {
      // e.persist();
      console.log(e.currentTarget.value); // 此时编译器报错，认为没有value属性，需要指定<HTMLInputElement>泛型类型
      // console.log(e.target.value); // 仍然不行
   };
 
   render() {
      return (
         <Fragment>
            <p>点击了{this.state.count}次</p>
            <Button onClick={this.clickHandle}>Hello{this.props.name}Class</Button>
            <input onChange={this.inputHandle}/>
         </Fragment>
      );
   }
}
```

