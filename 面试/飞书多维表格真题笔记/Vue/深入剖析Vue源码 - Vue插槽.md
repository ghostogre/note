# 深入剖析Vue源码 - Vue插槽

Vue组件的另一个重要概念是插槽，它允许你以一种不同于严格的父子关系的方式组合组件。插槽为你提供了一个将内容放置到新位置或使组件更通用的出口。

### 普通插槽

插槽将`<slot></slot>`作为子组件承载分发的载体，简单的用法如下

```vue
var child = {
  template: `<div class="child"><slot></slot></div>`
}
var vm = new Vue({
  el: '#app',
  components: {
    child
  },
  template: `<div id="app"><child>test</child></div>`
})
// 最终渲染结果
<div class="child">test</div>
```

##### 组件挂载原理

插槽的原理，贯穿了整个组件系统编译到渲染的过程，所以首先需要回顾一下对组件相关编译渲染流程，简单总结一下几点：

1. 从根实例入手进行实例的挂载，如果有手写的`render`函数，则直接进入`$mount`挂载流程。
2. 只有`template`模板则需要对模板进行解析，这里分为两个阶段，一个是将模板解析为`AST`树，另一个是根据不同平台生成执行代码，例如`render`函数。
3. `$mount`流程也分为两步，第一步是将`render`函数生成`Vnode`树，子组件会以`vue-componet-`为`tag`标记，另一步是把`Vnode`渲染成真正的DOM节点。
4. 创建真实节点过程中，如果遇到子的占位符组件会进行子组件的实例化过程，这个过程又将回到流程的第一步。

##### 父组件处理

回到组件实例流程中，父组件会优先于子组件进行实例的挂载，模板的解析和`render`函数的生成阶段在处理上没有特殊的差异，这里就不展开分析。接下来是`render`函数生成`Vnode`的过程，在这个阶段会遇到子的占位符节点（即：child），因此会为子组件创建子的`Vnode`。`createComponent`执行了创建子占位节点`Vnode`的过程。我们把重点放在最终`Vnode`代码的生成。

```js
// 创建子Vnode过程
  function createComponent (
    Ctor, // 子类构造器
    data,
    context, // vm实例
    children, // 父组件需要分发的内容
    tag // 子组件占位符
  ){
    ···
    // 创建子vnode，其中父保留的children属性会以选项的形式传递给Vnode
    // 如同上述，子组件会以`vue-componet-`为`tag`标记
    var vnode = new VNode(
      ("vue-component-" + (Ctor.cid) + (name ? ("-" + name) : '')),
      data, undefined, undefined, undefined, context,
      { Ctor: Ctor, propsData: propsData, listeners: listeners, tag: tag, children: children },
      asyncFactory
    );
  }
// Vnode构造器
var VNode = function VNode (tag,data,children,text,elm,context,componentOptions,asyncFactory) {
  ···
  this.componentOptions = componentOptions; // 子组件的选项相关
}

```

`createComponent`函数接收的第四个参数`children`就是父组件需要分发的内容。在创建子`Vnode`过程中，会以会`componentOptions`配置传入`Vnode`构造器中。**最终`Vnode`中父组件需要分发的内容以`componentOptions`属性的形式存在，这是插槽分析的第一步**。

