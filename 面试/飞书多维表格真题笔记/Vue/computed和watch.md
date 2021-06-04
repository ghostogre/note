## computed

computed是计算属性：它会根据所依赖的数据动态显示新的计算结果，计算结果会被缓存起来。computed的值在getter执行后是会被缓存的。如果所依赖的数据发生改变时候, 就会重新调用getter来计算最新的结果。

computed设计的初衷是为了使模板中的逻辑运算更简单, 比如在Vue模板中有很多复杂的数据计算的话, 我们可以把该计算逻辑放入到computed中去计算。

**computed 应用场景**

1. 适用于一些重复使用数据或复杂及费时的运算。我们可以把它放入computed中进行计算, 然后会在computed中缓存起来, 下次就可以直接获取了。
2. 如果我们需要的数据依赖于其他的数据的话, 我们可以把该数据设计为computed中。

**computed 和 methods的区别?**

其实页面中也可以直接使用 `{{method()}}` 来实现 computed 一样的效果。

**区别是:**

1. computed 是基于响应性依赖来进行**缓存**的。只有在响应式依赖发生改变时它们才会重新求值。但是methods方法中是每次调用, 都会执行函数的, methods它不是响应式的。
2. computed中的成员可以只定义一个函数作为只读属性, 也可以定义成 get/set 变成可读写属性, 但是methods中的成员没有这样的。

## watch

watch它是一个对data的数据监听回调, 当依赖的data的数据变化时, 会执行回调。在回调中会传入newVal和oldVal两个参数。

Vue实列将会在实例化时调用`$watch()`，他会遍历watch对象的每一个属性。

**watch的使用场景是：**当在data中的某个数据发生变化时, 我们需要做一些操作, 或者当需要在数据变化时执行异步或开销较大的操作时. 我们就可以使用watch来进行监听。

**watch普通监听和深度监听**

**handler方法及immediate属性**

watch有一个特点是: 第一次初始化页面的时候，是不会去执行属性监听的，只有当值发生改变的时候才会执行监听计算。

这个时候就可以使用 watch 的 immediate 和 handler 属性了。

**deep属性**

watch里面有一个属性为deep，含义是：是否深度监听某个对象的值, 该值默认为false。

受JS的限制，Vue不能检测到对象属性的添加或删除的。它只能监听到obj这个对象的变化，比如说对obj赋值操作会被监听到。

deep实现机制是: 监听器会一层层的往下遍历, 给对象的所有属性都加上这个监听器。当然性能开销会非常大的。

**watch 和 computed的区别是：**

相同点：他们两者都是观察页面数据变化的。

不同点：computed只有当依赖的数据变化时才会计算, 当数据没有变化时, 它会读取缓存数据。
watch每次都需要执行函数。**watch更适用于数据变化时的异步操作**。

## computed的基本原理及源码实现

需要理解如下几个问题:

1. computed是如何初始化的, 初始化之后做了那些事情?
2. 为什么我们改变了data中的属性值后, computed会重新计算, 它是如何实现的?
3. computed它是如何缓存值的, 当我们下次访问该属性的时候, 是怎样读取缓存数据的?

### computed初始化

```vue
<!DOCTYPE html>
<html>
<head>
  <title>vue</title>
  <meta charset="utf-8">
  <script type="text/javascript" src="https://cn.vuejs.org/js/vue.js"></script>
</head>
<body>
  <div id="app">
    <p>原来的数据: {{ msg }}</p>
    <p>反转后的数据为: {{ reversedMsg }}</p>
  </div>
  <script type="text/javascript">
    var vm = new Vue({
      el: '#app',
      data: {
        msg: 'hello'
      },
      computed: {
        reversedMsg() {
          // this 指向 vm 实例
          return this.msg.split('').reverse().join('')
        }
      }
    });
  </script>
</body>
</html>
```

如上代码，我们看到代码入口就是vue的实例化，`new Vue({})` 作为入口, 因此会调用 `vue/src/core/instance/index.js` 中的 init 函数代码, 如下所示：

```js
/** ......... 更多代码省略 */
/*
 @param {options} Object
 options = {
   el: '#app',
   data: {
     msg: 'hello'
   },
   computed: {
     reversedMsg() {
       // this 指向 vm 实例
       return this.msg.split('').reverse().join('')
     }
   }
 };
*/
import { initMixin } from './init'
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}
initMixin(Vue);

/** ..... 更多代码省略 */

export default Vue;
```

因此会调用 `vue/src/core/instance/init.js` 文件中的 _init 方法, 基本代码如下所示:

```js
import { initState } from './state';
export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    /** .... 更多代码省略 */
    initState(vm);
    /** .... 更多代码省略 */
  }
}
```

会调用 `vue/src/core/instance/state.js` 中的文件代码, 基本代码如下:

```js
import config from '../config'
import Watcher from '../observer/watcher'
import Dep, { pushTarget, popTarget } from '../observer/dep'

/** .... 更多代码省略 */
/*
 @param {vm}
 vm = {
   $attrs: {},
   $children: [],
   $listeners: {},
   $options: {
     components: {},
     computed: {
       reversedMsg() {
         // this 指向 vm 实例
         return this.msg.split('').reverse().join('')
       }
     },
     el: '#app',
     ..... 更多属性值
   },
   .... 更多属性
 };
*/
export function initState (vm: Component) {
  vm._watchers = []
  const opts = vm.$options
  if (opts.props) initProps(vm, opts.props)
  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
  if (opts.computed) initComputed(vm, opts.computed)
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}

/** .... 更多代码省略 */
```

代码内部先判断 `vm.options.props`是否有该属性，有的话就调用 `initProps()` 方法进行初始化，接着会判断`vm.options.props` 是否有该属性，有的话就调用 `initProps()` 方法进行初始化，接着会判断 `vm.options.methods`。是否有该方法, 有的话调用 `initMethods()` 方法进行初始化。我们最主要的是看 `if (opts.computed) initComputed(vm, opts.computed)` 这句代码。判断 `vm.$options.computed` 是否有, 如果有的话, 就执行 `initComputed(vm, opts.computed);` 函数。因此我们找到 initComputed 函数代码如下：

```js
/*
 @param {vm} 值如下:
 vm = {
   $attrs: {},
   $children: [],
   $listeners: {},
   $options: {
     components: {},
     computed: {
       reversedMsg() {
         // this 指向 vm 实例
         return this.msg.split('').reverse().join('')
       }
     },
     el: '#app',
     ..... 更多属性值
   },
   .... 更多属性
 };
 @param {computed} Object
 computed = {
   reversedMsg() {
     // this 指向 vm 实例
     return this.msg.split('').reverse().join('')
   }
 };
*/

const computedWatcherOptions = { lazy: true };
function initComputed (vm: Component, computed: Object) {
  // $flow-disable-line
  const watchers = vm._computedWatchers = Object.create(null);
  // computed properties are just getters during SSR
  // 服务端渲染判断
  const isSSR = isServerRendering()

  for (const key in computed) {
    const userDef = computed[key]
    const getter = typeof userDef === 'function' ? userDef : userDef.get
    if (process.env.NODE_ENV !== 'production' && getter == null) {
      warn(
        `Getter is missing for computed property "${key}".`,
        vm
      )
    }
    if (!isSSR) {
      // create internal watcher for the computed property.
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      )
    }
    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    if (!(key in vm)) {
      defineComputed(vm, key, userDef)
    } else if (process.env.NODE_ENV !== 'production') {
      if (key in vm.$data) {
        warn(`The computed property "${key}" is already defined in data.`, vm)
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(`The computed property "${key}" is already defined as a prop.`, vm)
      }
    }
  }
}
```

如上代码，首先使用 `Object.create(null);` 创建一个空对象，分别赋值给 `watchers` 和 `vm._computedWatchers`。 接着执行判断是否是服务器渲染的代码。

接着使用 for in 循环遍历 computed，接着判断 userDef 该值是否是一个函数，或者也可以是一个对象。当我们拿不到 computed 的getter的时候, vue会报出一个警告信息。

接着代码, 如下所示:

```js
if (!isSSR) {
  // create internal watcher for the computed property.
  watchers[key] = new Watcher(
    vm,
    getter || noop,
    noop,
    computedWatcherOptions
  )
}
```

如上代码，我们会根据 computed 中的 key 来实例化 watcher，因此我们可以理解为其实 computed 就是 watcher 的实现，通过一个发布订阅模式来监听的。给 Watch 方法传递了四个参数, 分别为VM实列，上面我们获取到的getter方法, noop 是一个回调函数。computedWatcherOptions 参数我们在源码初始化该值为：`const computedWatcherOptions = { lazy: true };`。 我们再来看下 Watcher函数代码, 该函数代码在 `vue/src/core/observer/watcher.js` 中:

```js
/*
 vm = {
   $attrs: {},
   $children: [],
   $listeners: {},
   $options: {
     components: {},
     computed: {
       reversedMsg() {
         // this 指向 vm 实例
         return this.msg.split('').reverse().join('')
       }
     },
     el: '#app',
     ..... 更多属性值
   },
   .... 更多属性
 };
 expOrFn = function reversedMsg() {}; expOrFn 是我们上面获取到的getter函数.
 cb的值是一个回调函数。
 options = {lazy: true};
 isRenderWatcher = undefined;
*/
export default class Watcher {
  ....
  constructor (
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: ?Object,
    isRenderWatcher?: boolean
  ) {
    this.vm = vm
    if (isRenderWatcher) {
      vm._watcher = this
    }
    /*
     当前的watcher添加到vue的实列上, 因此:
     vm._watchers = [
      Watcher 
     ];
     即 vm._watchers[0].vm = {
       $attrs: {},
       $children: [],
       $listeners: {},
       $options: {
         components: {},
         computed: {
           reversedMsg() {}
         }
       }
     }
     ....
    */
    vm._watchers.push(this);
    // options
    /*
      options = {lazy: true};
      因此：
      // 如果deep为true的话，会对getter返回的对象再做一次深度的遍历
      this.deep = !!options.deep;　即　this.deep = false; 
      // user 是用于标记这个监听是否由用户通过$watch调用的
      this.user = !!options.user;　即: this.user = false;
      
      // lazy用于标记watcher是否为懒执行,该属性是给 computed data 用的，当 data 中的值更改的时候，不会立即计算 getter 
      // 获取新的数值，而是给该 watcher 标记为dirty，当该 computed data 被引用的时候才会执行从而返回新的 computed 
      // data，从而减少计算量。
      
      this.lazy = !!options.lazy; 即: this.lazy = true;
      
      // 表示当 data 中的值更改的时候，watcher 是否同步更新数据，如果是 true，就会立即更新数值，否则在 nextTick 中更新。
      
      this.sync = !!options.sync; 即: this.sync = false;
      this.before = options.before; 即: this.before = undefined;
    */
    if (options) {
      this.deep = !!options.deep
      this.user = !!options.user
      this.lazy = !!options.lazy
      this.sync = !!options.sync
      this.before = options.before
    } else {
      this.deep = this.user = this.lazy = this.sync = false
    }
    // cb 为回调函数
    this.cb = cb
    this.id = ++uid // uid for batching 
    this.active = true
    // this.dirty = true;
    this.dirty = this.lazy // for lazy watchers
    this.deps = []
    this.newDeps = []
    this.depIds = new Set()
    this.newDepIds = new Set();
    /*
     把函数转换成字符串的形式(不是正式环境下)
     this.expression = "reversedMsg() { return this.msg.split('').reverse().join('') }"
    */
    this.expression = process.env.NODE_ENV !== 'production'
      ? expOrFn.toString()
      : ''
    // parse expression for getter
    /*
     判断expOrFn是否是一个函数, 如果是一个函数, 直接赋值给　this.getter;
     否则的话, 它是一个表达式的话, 比如 'a.b.c' 这样的，因此调用　this.getter = parsePath(expOrFn); 
     parsePath函数的代码在：vue/src/core/util/lang.js 中。
    */
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn)
      if (!this.getter) {
        this.getter = noop
        process.env.NODE_ENV !== 'production' && warn(
          `Failed watching path: "${expOrFn}" ` +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        )
      }
    }
    // 不是懒加载类型调用get
    this.value = this.lazy
      ? undefined
      : this.get()
  }
}
```

