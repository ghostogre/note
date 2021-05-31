# 深入理解 React 高阶组件

### **什么是高阶组件？**

> 高阶组件就是一个 React 组件包裹着另外一个 React 组件

这种模式通常使用函数来实现，基本上是一个类工厂（是的，一个类工厂！），它的函数签名可以用类似 haskell 的伪代码表示

```text
hocFactory:: W: React.Component => E: React.Component
```

其中 W (WrappedComponent) 指被包裹的 React.Component，E (EnhancedComponent) 指返回类型为 React.Component 的新的 HOC。

"包裹"可能会有以下两种不同的含义之一：

1. Props Proxy： HOC 对传给 WrappedComponent W 的 porps 进行操作，
2. Inheritance Inversion： HOC 继承 WrappedComponent W。

## **HOC 工厂的实现方法**

### **Props Proxy**

Props Proxy (PP) 的最简实现：

```jsx
function ppHOC(WrappedComponent) {  
  return class PP extends React.Component {    
    render() {      
      return <WrappedComponent {...this.props}/>    
    }  
  } 
}
```

这里主要是 HOC 在 render 方法中 **返回** 了一个 *WrappedComponent* 类型的 React Element。我们还传入了 HOC 接收到的 props，这就是名字 **Props Proxy** 的由来。

```jsx
<WrappedComponent {...this.props}/>
// 等价于
React.createElement(WrappedComponent, this.props, null)
```

在 React 内部的一致化处理（reconciliation process）中，两者都创建了一个 React Element 用于渲染。

（注：**一致化处理**可理解为 React 内部将虚拟 DOM 同步更新到真实 DOM 的过程，包括新旧虚拟 DOM 的比较及计算最小 DOM 操作）

**使用 Props Proxy 可以做什么？**

- 操作 props
- 通过 Refs 访问到组件实例
- 提取 state
- 用其他元素包裹 *WrappedComponent*

**操作 props**

你可以读取、添加、编辑、删除传给 *WrappedComponent* 的 props。

当删除或者编辑重要的 props 时要小心，你可能应该通过命名空间确保高阶组件的 props 不会破坏 *WrappedComponent*。

例如：添加新的 props。

**通过 Refs 访问到组件实例**

你可以通过*引用*（*ref*）访问到 *this* （*WrappedComponent* 的实例），但为了得到引用，*WrappedComponent* 还需要一个初始渲染，意味着你需要在 HOC 的 render 方法中返回 *WrappedComponent* 元素，让 React 开始它的一致化处理，你就可以得到 *WrappedComponent* 的实例的引用。

例子：如何通过 [refs](https://link.zhihu.com/?target=https%3A//facebook.github.io/react/docs/more-about-refs.html) 访问到实例的方法和实例本身：

```jsx
function refsHOC(WrappedComponent) {
  return class RefsHOC extends React.Component {
    proc(wrappedComponentInstance) {
      wrappedComponentInstance.method()
    }

    render() {
      const props = Object.assign({}, this.props, {ref: this.proc.bind(this)})
      return <WrappedComponent {...props}/>
    }
  }
}
```

**提取 state**

你可以通过传入 props 和回调函数把 state 提取出来，类似于 聪明组件 与 木偶组件。其实就是由外部组件控制 state，内部组件只负责根据传入的 props 展示。

提取 state 的例子：提取了 input 的 *value* 和 *onChange* 方法。这个简单的例子不是很常规，但足够说明问题。

```jsx
function ppHOC(WrappedComponent) {
  return class PP extends React.Component {
    constructor(props) {
      super(props)
      this.state = {
        name: ''
      }

      this.onNameChange = this.onNameChange.bind(this)
    }
    onNameChange(event) {
      this.setState({
        name: event.target.value
      })
    }
    render() {
      const newProps = {
        name: {
          value: this.state.name,
          onChange: this.onNameChange
        }
      }
      return <WrappedComponent {...this.props} {...newProps}/>
    }
  }
}
```

你可以这样用：

```jsx
@ppHOC
class Example extends React.Component {
  render() {
    return <input name="name" {...this.props.name}/>
  }
}
```

这个 input 会自动成为[受控input](https://link.zhihu.com/?target=https%3A//facebook.github.io/react/docs/forms.html)。

**用其他元素包裹 WrappedComponent**

为了封装样式、布局或别的目的，你可以用其它组件和元素包裹 *WrappedComponent*。基本方法是使用父组件实现，但通过 HOC 你可以得到更多灵活性（还有更好的复用性）。

### Inheritance Inversion

```jsx
function iiHOC(WrappedComponent) {
  return class Enhancer extends WrappedComponent {
    render() {
      return super.render()
    }
  }
}
```

返回的 HOC 类（Enhancer）**继承**了 *WrappedComponent*。之所以被称为 Inheritance Inversion 是因为 *WrappedComponent* 被 *Enhancer* 继承了，而不是 *WrappedComponent* 继承了 *Enhancer*。在这种方式中，它们的关系看上去被**反转（inverse）**了。

Inheritance Inversion 允许 HOC 通过 *this* 访问到 *WrappedComponent*，意味着**它可以访问到 state、props、组件生命周期方法和 render 方法**。

请注意通过这种方法你可以创建新的生命周期方法，为了不破坏 `WrappedComponent` 内部的生命周期，记得调用 `super.[lifecycleHook]`。

**一致化处理（Reconciliation process）**

React 元素决定描述了在 React 执行[一致化](https://link.zhihu.com/?target=https%3A//facebook.github.io/react/docs/reconciliation.html)处理时它要渲染什么。

React 元素有两种类型：字符串和函数。字符串类型的 React 元素代表 DOM 节点，函数类型的 React 元素代表继承 React.Component 的组件。

函数类型的 React 元素会在一致化处理中被解析成一个完全由字符串类型 React 组件组成的树（而最后的结果永远是 DOM 元素）。

这很重要，意味着 **Inheritance Inversion 的高阶组件不一定会解析完整子树**。因为函数内部可能存在条件渲染，或者一定工作后进行具体的渲染。

**你可以用 Inheritance Inversion 做什么？**

- 渲染劫持（Render Highjacking）
- 操作 state

**渲染劫持**

之所以被称为渲染劫持是因为 HOC 控制着 *WrappedComponent* 的渲染输出，可以用它做各种各样的事。

通过渲染劫持你可以：

- 在由 render **输出**的任何 React 元素中读取、添加、编辑、删除 props
- 读取和修改由 *render* 输出的 React 元素树
- 有条件地渲染元素树
- 把样式包裹进元素树（就像在 Props Proxy 中的那样）

render 指 `WrappedComponent.render` 方法。

> 你**不能**编辑或添加 WrappedComponent 实例的 props，因为 React 组件不能编辑它接收到的 props，但你**可以**修改由 **render** 方法返回的组件的 props。

就像我们刚才学到的，II 类型的 HOC 不一定会解析完整子树，意味着渲染劫持有一些限制。根据经验，使用渲染劫持你可以完全操作 *WrappedComponent* 的 render 方法返回的元素树。但是如果元素树包括一个函数类型的 React 组件，你就不能操作它的子组件了。（被 React 的一致化处理推迟到了真正渲染到屏幕时）

**例1：条件渲染**

```js
function iiHOC(WrappedComponent) {
  return class Enhancer extends WrappedComponent {
    render() {
      if (this.props.loggedIn) {
        return super.render()
      } else {
        return null
      }
    }
  }
}
```

**例2：修改由 render 方法输出的 React 组件树。**

```js
function iiHOC(WrappedComponent) {
  return class Enhancer extends WrappedComponent {
    render() {
      const elementsTree = super.render()
      let newProps = {};
      if (elementsTree && elementsTree.type === 'input') {
        newProps = {value: 'may the force be with you'}
      }
      const props = Object.assign({}, elementsTree.props, newProps)
      const newElementsTree = React.cloneElement(elementsTree, props, elementsTree.props.children)
      return newElementsTree
    }
  }
}
```

在这个例子中，如果 *WrappedComponent* 的输出在最顶层有一个 input，那么就把它的 value 设为 *“may the force be with you”*。

> **注**：在 Props Proxy 中**不能**做到渲染劫持。
>
> 虽然通过 WrappedComponent.prototype.render 你可以访问到 render 方法，不过还需要模拟 WrappedComponent 的实例和它的 props，还可能亲自处理组件的生命周期，而不是交给 React。根据我的实验，这么做不值，你要是想做到渲染劫持你应该用 Inheritance Inversion 而不是 Props Proxy。记住，React 在内部处理了组件实例，你处理实例的唯一方法是通过 **this** 或者 refs。

**操作 state**

HOC 可以读取、编辑和删除 *WrappedComponent* 实例的 state，如果你需要，你也可以给它添加更多的 state。记住，这会搞乱 *WrappedComponent* 的 state，导致你可能会破坏某些东西。要限制 HOC 读取或添加 state，添加 state 时应该放在单独的命名空间里，而不是和 *WrappedComponent* 的 state 混在一起。

例子：通过访问 *WrappedComponent* 的 props 和 state 来做调试。

```jsx
function replacer(key, value) { // 遍历每个成员的属性
  if (typeof value === 'function') {
    return `function ${value.name}() {...}`
  }

  return value
}

export function stringify(value) {
  return JSON.stringify(value, replacer, 2)
}

export function IIHOCDEBUGGER(WrappedComponent) {
  return class II extends WrappedComponent {
    render() {
      return (
        <div>
          <h2>HOC Debugger Component</h2>
          <p>Props</p> <pre>{stringify(this.props)}</pre>
          <p>State</p><pre>{stringify(this.state)}</pre>
          {super.render()}
        </div>
      )
    }
  }
}
```

这里 HOC 用其他元素包裹着 *WrappedComponent*，还输出了 *WrappedComponent* 实例的 props 和 state。

### **命名**

用 HOC 包裹了一个组件会使它失去原本 *WrappedComponent* 的名字，可能会影响开发和调试。

通常会用 *WrappedComponent* 的名字加上一些 前缀作为 HOC 的名字。下面的代码来自 React-Redux：

```jsx
HOC.displayName = `HOC(${getDisplayName(WrappedComponent)})`

//或

class HOC extends ... {
  static displayName = `HOC(${getDisplayName(WrappedComponent)})`
  // ...
}
```

*getDisplayName* 函数：

```js
function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName ||
         WrappedComponent.name ||
         ‘Component’
}
```

实际上你不用自己写，[recompose](https://link.zhihu.com/?target=https%3A//github.com/acdlite/recompose) 提供了这个函数。

### HOC 和参数

有时，在你的 HOC 上使用参数是很有用的。

例子：Props Proxy 模式 的 HOC 最简参数使用方法。关键在于 HOCFactoryFactory 函数。

```js
function HOCFactoryFactory(...params){
  // do something with params
  return function HOCFactory(WrappedComponent) {
    return class HOC extends React.Component {
      render() {
        return <WrappedComponent {...this.props}/>
      }
    }
  }
}
```

### **与父组件的不同**

父组件可以通过 `this.children` 访问子组件。

总结一下他们的区别：

- 渲染劫持
- 操作内部 props
- 提取 state。但也有它的不足。只有在显式地为它创建钩子函数后，你才能从父组件外面访问到它的 props。这给它增添了一些不必要的限制。
- 用新的 React 组件包裹。这可能是唯一一种父组件比 HOC 好用的情况。HOC 也可以做到。
- 操作子组件会有一些陷阱。例如，当子组件没有单一的根节点时，你得添加一个额外的元素包裹所有的子组件，这让你的代码有些繁琐。在 HOC 中单一的根节点会由 React/JSX语法来确保。
- 父组件可以自由应用到组件树中，不像 HOC 那样需要给每个组件创建一个类。

