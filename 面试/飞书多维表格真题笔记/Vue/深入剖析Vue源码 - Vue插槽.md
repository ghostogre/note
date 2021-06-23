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

##### 子组件流程

父组件的最后一个阶段是将`Vnode`渲染为真正的DOM节点，在这个过程中如果遇到子`Vnode`会优先实例化子组件并进行一系列子组件的渲染流程。子组件初始化会先调用`init`方法，并且和父组件不同的是，子组件会调用`initInternalComponent`方法拿到父组件拥有的相关配置信息，并赋值给子组件自身的配置选项。

```js
// 子组件的初始化
Vue.prototype._init = function(options) {
  if (options && options._isComponent) {
    initInternalComponent(vm, options);
  }
  initRender(vm)
}
function initInternalComponent (vm, options) {
    var opts = vm.$options = Object.create(vm.constructor.options);
    var parentVnode = options._parentVnode;
    opts.parent = options.parent;
    opts._parentVnode = parentVnode;
    // componentOptions为子vnode记录的相关信息
    var vnodeComponentOptions = parentVnode.componentOptions;
    opts.propsData = vnodeComponentOptions.propsData;
    opts._parentListeners = vnodeComponentOptions.listeners;
    // 父组件需要分发的内容赋值给子选项配置的_renderChildren
    opts._renderChildren = vnodeComponentOptions.children;
    opts._componentTag = vnodeComponentOptions.tag;

    if (options.render) {
      opts.render = options.render;
      opts.staticRenderFns = options.staticRenderFns;
    }
}
```

最终在**子组件实例的配置中拿到了父组件保存的分发内容，记录在组件实例`$options._renderChildren`中，这是第二步的重点**。

接下来是`initRender`阶段，在这个过程会**将配置的`_renderChildren`属性做规范化处理，并将他赋值给子实例上的`$slot`属性，这是第三步的重点**。

```js
function initRender(vm) {
  ···
  vm.$slots = resolveSlots(options._renderChildren, renderContext);// $slots拿到了子占位符节点的_renderchildren(即需要分发的内容)，保留作为子实例的属性
}

function resolveSlots (children, context) {
    // children是父组件需要分发到子组件的Vnode节点，如果不存在，则没有分发内容
    if (!children || !children.length) {
      return {}
    }
    var slots = {};
    for (var i = 0, l = children.length; i < l; i++) {
      var child = children[i];
      var data = child.data;
      // remove slot attribute if the node is resolved as a Vue slot node
      // 如果这个节点被当做Vue slot节点处理的话，移除slot属性
      if (data && data.attrs && data.attrs.slot) {
        delete data.attrs.slot;
      }
      // named slots should only be respected if the vnode was rendered in the
      // same context.
      // 分支1为具名插槽的逻辑，放后分析
      if ((child.context === context || child.fnContext === context) &&
        data && data.slot != null
      ) {
        var name = data.slot;
        var slot = (slots[name] || (slots[name] = []));
        if (child.tag === 'template') {
          slot.push.apply(slot, child.children || []);
        } else {
          slot.push(child);
        }
      } else {
      	// 普通插槽的重点，核心逻辑是构造{ default: [children] }对象返回
        // 不指定名称也就是默认插槽 default
        (slots.default || (slots.default = [])).push(child);
      }
    }
    return slots
  }
```

其中普通插槽的处理逻辑核心在`(slots.default || (slots.default = [])).push(child);`，即以数组的形式赋值给`default`属性，并以`$slot`属性的形式保存在子组件的实例中。

随后子组件也会走挂载的流程，同样会经历`template`模板到`render`函数，再到`Vnode`,最后渲染真实`DOM`的过程。解析`AST`阶段，`slot`标签和其他普通标签处理相同，**不同之处在于`AST`生成`render`函数阶段，对`slot`标签的处理，会使用`_t函数`进行包裹。这是关键步骤的第四步**

子组件渲染的大致流程简单梳理如下：

```js
// ast 生成 render函数
var code = generate(ast, options);
// generate实现
function generate(ast, options) {
  var state = new CodegenState(options);
  var code = ast ? genElement(ast, state) : '_c("div")';
  return {
    render: ("with(this){return " + code + "}"),
    staticRenderFns: state.staticRenderFns
  }
}

// genElement实现
function genElement(el, state) {
  // ...
  
  // 针对slot标签的处理走```genSlot```分支
  if (el.tag === 'slot') {
    return genSlot(el, state)
  }
  
  // ...
}

// 核心genSlot原理
function genSlot (el, state) {
    // slotName记录着插槽的唯一标志名，默认为default
    var slotName = el.slotName || '"default"';
    // 如果子组件的插槽还有子元素，则会递归调执行子元素的创建过程（slot后备内容等）
    var children = genChildren(el, state);
    // 通过_t函数包裹
    var res = "_t(" + slotName + (children ? ("," + children) : '');
    // 省略具名插槽的其他处理
    // ···
    return res + ')'
}
```

最终子组件的`render`函数为： `"with(this){return _c('div',{staticClass:"child"},[_t("default")],2)}"`

**第五步到了子组件渲染为`Vnode`的过程。`render`函数执行阶段会执行`_t()`函数，`_t`函数是`renderSlot`函数简写，它会在Vnode树中进行分发内容的替换**，具体看看实现逻辑。

```js
// target._t = renderSlot;

export function renderMixin (Vue: Class<Component>) {
  // ...
	// render函数渲染Vnode函数
	Vue.prototype._render = function() {
    var _parentVnode = ref._parentVnode;
    if (_parentVnode) {
      // slots的规范化处理并赋值给$scopedSlots属性。
      vm.$scopedSlots = normalizeScopedSlots(
        _parentVnode.data.scopedSlots,
        vm.$slots, // 记录父组件的插槽内容
        vm.$scopedSlots
      );
    }
    // ...
	}
  // ...
}
```

`normalizeScopedSlots`的逻辑较长，但并不是本节的重点。拿到`$scopedSlots`属性后（renderSlot里面会执行`this.$scopedSlots`）会执行真正的`render`函数，其中`_t`的执行逻辑如下：

```js
  // 渲染slot组件内容
  function renderSlot (
    name,
    fallback, // slot插槽后备内容(针对后备内容)
    props, // 子传给父的值(作用域插槽)
    bindObject
  ) {
    // scopedSlotFn拿到父组件插槽的执行函数，默认slotname为default
    var scopedSlotFn = this.$scopedSlots[name];
    var nodes;
    // 具名插槽分支(暂时忽略)
    if (scopedSlotFn) { // scoped slot
      props = props || {};
      if (bindObject) {
        if (!isObject(bindObject)) {
          warn(
            'slot v-bind without argument expects an Object',
            this
          );
        }
        props = extend(extend({}, bindObject), props);
      }
      // 执行时将子组件传递给父组件的值传入fn
      nodes = scopedSlotFn(props) || fallback;
    } else {
      // 如果父占位符组件没有插槽内容，this.$slots不会有值，此时vnode节点为后备内容节点。
      // 这里的 $slots 就是之前 initRender 里初始化的 $slots
      nodes = this.$slots[name] || fallback;
    }

    var target = props && props.slot;
    if (target) {
      return this.$createElement('template', { slot: target }, nodes)
    } else {
      return nodes
    }
  }
```

`renderSlot`执行过程会拿到父组件需要分发的内容，最终`Vnode`树将父元素的插槽替换掉子组件的`slot`组件。

至此，一个完整且简单的插槽流程分析完毕。接下来看插槽深层次的用法。

### 具有后备内容的插槽

有时为一个插槽设置具体的后备 (也就是默认的) 内容是很有用的，它只会在没有提供内容的时候被渲染。

```vue
var child = {
  template: `<div class="child"><slot>后备内容</slot></div>`
}

var vm = new Vue({
  el: '#app',
  components: {
    child
  },
  template: `<div id="app"><child></child></div>`
})

// 父没有插槽内容，子的slot会渲染后备内容
<div class="child">后备内容</div>
```

父组件没有需要分发的内容，子组件会默认显示插槽里面的内容。源码中的不同体现在下面的几点。

1. 父组件渲染过程由于没有需要分发的子节点，所以不再需要拥有`componentOptions.children`属性来记录内容。
2. 因此子组件也拿不到`$slot`属性的内容.
3. 子组件的`render`函数最后在`_t`函数参数会携带第二个参数，该参数以数组的形式传入`slot`插槽的后备内容。例`with(this){return _c('div',{staticClass:"child"},[_t("default",[_v("test")])],2)}`
4. 渲染子`Vnode`会执行`renderSlot(_t)`函数时，第二个参数`fallback`有值，且`this.$slots`没值，`vnode`会直接返回后备内容作为渲染对象。

```js
function renderSlot (
    name,
    fallback, // slot插槽后备内容(针对后备内容)
    props, // 子传给父的值(作用域插槽)
    bindObject
){
    if() {
      // ···
    }else{
      //fallback为后备内容
      // 如果父占位符组件没有插槽内容，this.$slots不会有值，此时vnode节点为后备内容节点。
      nodes = this.$slots[name] || fallback;
    }
}
```

最终，在父组件没有提供内容时，`slot`的后备内容被渲染。

有了这些基础，我们再来看官网给的一条规则：

- 父级模板里的所有内容都是在父级作用域中编译的；子模板里的所有内容都是在子作用域中编译的。

父组件模板的内容在父组件编译阶段就确定了，并且保存在`componentOptions`属性中，而子组件有自身初始化`init`的过程，这个过程同样会进行子作用域的模板编译，因此两部分内容是相对独立的。

### 具名插槽

往往我们需要灵活的使用插槽进行通用组件的开发，要求父组件每个模板对应子组件中每个插槽，这时我们可以使用`<slot>`的`name`属性

##### 模板编译的差别

父组件在编译`AST`阶段和普通节点的过程不同，具名插槽一般会在`template`模板中用`v-slot:`来标注指定插槽，这一阶段会在编译阶段特殊处理。最终的`AST`树会携带`scopedSlots`用来记录具名插槽的内容

```js
{
  scopedSlots： {
    footer: { ··· },
    header: { ··· }
  }
}
```

`AST`生成`render`函数的过程也不详细分析了，我们只分析父组件最终返回的结果：

```js
with(this){return _c('div',{attrs:{"id":"app"}},[_c('child',{scopedSlots:_u([{key:"header",fn:function(){return [_c('span',[_v("头部")])]},proxy:true},{key:"footer",fn:function(){return [_c('span',[_v("底部")])]},proxy:true}])})],1)}
```

> 上面 child 便是子组件，header 和 footer 是 child 里面的 slot 名称

父组件的插槽内容用`_u`函数封装成数组的形式，并赋值到`scopedSlots`属性中，而每一个插槽以对象形式描述，`key`代表插槽名，`fn`是一个返回执行结果的函数。

##### 父组件vnode生成阶段

进入父组件生成`Vnode`阶段，其中`_u`函数的原形是`resolveScopedSlots`,其中第一个参数就是插槽数组。

```js
	// vnode生成阶段针对具名插槽的处理 _u
	// (target._u = resolveScopedSlots)
  function resolveScopedSlots (fns,res,hasDynamicKeys,contentHashKey) {
    res = res || { $stable: !hasDynamicKeys };
    for (var i = 0; i < fns.length; i++) {
      var slot = fns[i];
      // fn是数组需要递归处理。
      if (Array.isArray(slot)) {
        resolveScopedSlots(slot, res, hasDynamicKeys);
      } else if (slot) {
        // marker for reverse proxying v-slot without scope on this.$slots
        if (slot.proxy) { //  针对proxy的处理
          slot.fn.proxy = true;
        }
        // 最终返回一个对象，对象以slotname作为属性，以fn作为值
        res[slot.key] = slot.fn;
      }
    }
    if (contentHashKey) {
      (res).$key = contentHashKey;
    }
    return res
  }
```

