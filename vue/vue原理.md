### 流程

1. `core/index.js`: 在 Vue 的 prototype 上添加判断是否服务器渲染的属性，真正的Vue来自于`./instance/index.js`

2. `./instance/index.js`: 定义Vue的function，调用_init方法，混入生命周期等。

   ```javascript
   import { initMixin } from './init'
   import { stateMixin } from './state'
   import { renderMixin } from './render'
   import { eventsMixin } from './events'
   import { lifecycleMixin } from './lifecycle'
   import { warn } from '../util/index'
   
   function Vue (options) {
     if (process.env.NODE_ENV !== 'production' &&
       !(this instanceof Vue)
     ) {
       warn('Vue is a constructor and should be called with the `new` keyword')
     }
     // 调用_init
     this._init(options)
   }
   // 添加vue.prototype._init方法，里面初始化生命周期等，调用beforeCreate和created，最终会调用mount
   initMixin(Vue)
   // 添加代理到原型链上，添加原型链上的$data, $props, $set, $del, $watch等属性和方法
   stateMixin(Vue)
   // 事件监听和触发的实现
   eventsMixin(Vue)
   // 添加prototype上的_update, $destory, $forceUpdate等方法
   lifecycleMixin(Vue)
   // $nextTick, 设置父节点
   renderMixin(Vue)
   
   export default Vue
   ```

   

3. `initMixin:./init.js`: 在Vue的prototype上添加_init方法。

   ```javascript
   	const vm: Component = this
       // a uid
       vm._uid = uid++	
   	// ...
   	// ./lifecycle.js
   	// 添加生命周期的标志，将当前实例添加到parent的children中
       initLifecycle(vm)
   	// ./events.js
       initEvents(vm)
   	// ./render.js
       initRender(vm)
       callHook(vm, 'beforeCreate')
       initInjections(vm) // resolve injections before data/props
   	// ./state.js
       initState(vm)
   	// ./provide.js
       initProvide(vm) // resolve provide after data/props
       callHook(vm, 'created')
   
       // ...
   
       if (vm.$options.el) {
         vm.$mount(vm.$options.el) // 调用lifecycle.js中的mountComponent来挂载并且new Watcher()
       }
   ```

4. `stateMixin:./state.js`: 处理options上的props，methods，computed等。添加data，props和computed里面的双向绑定。

   ```javascript
     const opts = vm.$options
     if (opts.props) initProps(vm, opts.props)
     if (opts.methods) initMethods(vm, opts.methods)
     if (opts.data) {
       initData(vm) // 对data是否是function进行检查，处理props和methods是有同名的，最终调用的是../observer/index.js中的observe方法
     } else {
       observe(vm._data = {}, true /* asRootData */)
     }
     if (opts.computed) initComputed(vm, opts.computed)
     // 调用$watch来实现watch option里的观察
     if (opts.watch && opts.watch !== nativeWatch) {
       initWatch(vm, opts.watch)
     }
   ```

5. `eventMixin:./events.js`: 实现原型链中的$on和$emit等事件API

   ```javascript
   export function eventsMixin (Vue: Class<Component>) {
     const hookRE = /^hook:/
     Vue.prototype.$on = function (event: string | Array<string>, fn: Function): Component {
       const vm: Component = this
       if (Array.isArray(event)) {
         for (let i = 0, l = event.length; i < l; i++) {
           vm.$on(event[i], fn)
         }
       } else {
         // 添加到事件数组里去
         (vm._events[event] || (vm._events[event] = [])).push(fn)
         if (hookRE.test(event)) {
           vm._hasHookEvent = true
         }
       }
       return vm
     }
   ```

6. `lifeCycleMixin:./lifecycle.js`: 

   ```javascript
   export function lifecycleMixin (Vue: Class<Component>) {
     Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {
       const vm: Component = this
       const prevEl = vm.$el
       const prevVnode = vm._vnode
       const restoreActiveInstance = setActiveInstance(vm)
       vm._vnode = vnode
       // Vue.prototype.__patch__ is injected in entry points
       // based on the rendering backend used.
       if (!prevVnode) {
         // initial render
         vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)
       } else {
         // updates
         vm.$el = vm.__patch__(prevVnode, vnode)
       }
       restoreActiveInstance()
       // update __vue__ reference
       if (prevEl) {
         prevEl.__vue__ = null
       }
       if (vm.$el) {
         vm.$el.__vue__ = vm
       }
       // if parent is an HOC, update its $el as well
       if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
         vm.$parent.$el = vm.$el
       }
       // updated hook is called by the scheduler to ensure that children are
       // updated in a parent's updated hook.
     }
   ```

7. `renderMixin:./render.js`: 添加`Vue.prototype.$nextTick`和设置父级元素

8. `observer/index.js`: 最重要的是Observer类和observe方法。observe在initState里被调用，里面主要是返回一个Observer实例。

   ```javascript
   export class Observer {
     value: any;
     dep: Dep;
     vmCount: number; // number of vms that have this object as root $data
   
     constructor (value: any) {
       this.value = value
       this.dep = new Dep()
       this.vmCount = 0
       def(value, '__ob__', this)
       if (Array.isArray(value)) {
         if (hasProto) {
           protoAugment(value, arrayMethods)
         } else {
           copyAugment(value, arrayMethods, arrayKeys)
         }
         this.observeArray(value)
       } else {
         this.walk(value)
       }
     }
   
     /**
      * 当value是对象类型的时候把每个key值都进行双向绑定处理（getter和setter）
      */
     walk (obj: Object) {
       const keys = Object.keys(obj)
       for (let i = 0; i < keys.length; i++) {
         defineReactive(obj, keys[i])
       }
     }
   
     /**
      * 处理数组的值的双向绑定
      */
     observeArray (items: Array<any>) {
       for (let i = 0, l = items.length; i < l; i++) {
         observe(items[i])
       }
     }
   }
   
   export function defineReactive (
     obj: Object,
     key: string,
     val: any,
     customSetter?: ?Function,
     shallow?: boolean // 浅层
   ) {
     // 每一个响应式属性都会有一个 Dep对象实例， 该对象实例会存储订阅它的Watcher对象实例
     const dep = new Dep()
   
     const property = Object.getOwnPropertyDescriptor(obj, key)
     if (property && property.configurable === false) {
       return
     }
   
     // cater for pre-defined getter/setters
     const getter = property && property.get
     const setter = property && property.set
     if ((!getter || setter) && arguments.length === 2) {
       val = obj[key]
     }
   
     // 如果属性值是一个对象，递归观察属性值
     let childOb = !shallow && observe(val)
     Object.defineProperty(obj, key, {
       enumerable: true,
       configurable: true,
       get: function reactiveGetter () {
         const value = getter ? getter.call(obj) : val
         if (Dep.target) {
           dep.depend() // Dep.target.addDep(this)
           if (childOb) {
             childOb.dep.depend()
             if (Array.isArray(value)) {
               dependArray(value)
             }
           }
         }
         return value
       },
       set: function reactiveSetter (newVal) {
         const value = getter ? getter.call(obj) : val
         /* eslint-disable no-self-compare */
         if (newVal === value || (newVal !== newVal && value !== value)) {
           return
         }
         /* eslint-enable no-self-compare */
         if (process.env.NODE_ENV !== 'production' && customSetter) {
           customSetter()
         }
         // #7981: for accessor properties without setter
         if (getter && !setter) return
         if (setter) {
           setter.call(obj, newVal)
         } else {
           val = newVal
         }
         // 如果是对象，递归处理新的值的getter和setter
         childOb = !shallow && observe(newVal)
         dep.notify()
       }
     })
   }
   ```

9. `observer/dep.js`: 定义了Dep类，初始化全局Dep.target为null，设置全局的targetStack为空数组，提供了pushTarget和popTarget设置`Dep.target`并且出入栈。在钩子函数和vue内部获取data的时候回调用`pushTarget()`和`popTarget()`，使依赖收集失效。

10. `observer/watcher.js`: 构造器参数包括了vm实例，在构造器初始化的时候，设置到vm._watchers上去。在get方法上，设置当前Dep.target

    ```javascript
    // 构造器
    constructor (
    	vm: Component,
        expOrFn: string | Function,
        cb: Function,
        options?: ?Object,
        isRenderWatcher?: boolean
    ) {
        // ...
        this.vm = vm
        if (isRenderWatcher) {
          vm._watcher = this
        }
        vm._watchers.push(this)
       	// ...
        // parse expression for getter
        if (typeof expOrFn === 'function') {
          this.getter = expOrFn
        } else {
          this.getter = parsePath(expOrFn)
          if (!this.getter) {
            this.getter = noop
          }
        }
        // ...
        this.value = this.lazy
          ? undefined
          : this.get()
    }
    
    get () { // get只在这个文件里有使用过
        pushTarget(this)
        let value
        const vm = this.vm
        try {
          value = this.getter.call(vm, vm)
        } catch (e) {
          // 错误处理
        } finally {
          // "touch" every property so they are all tracked as
          // dependencies for deep watching
          if (this.deep) {
            traverse(value)
          }
          popTarget()
          this.cleanupDeps()
        }
        return value
    }
    ```

    在 lifecycle.js/mountComponent 中，

    ```javascript
      // updateComponent 里面调用vm._render 返回 vnode，传入 vm._update 方法。
      let updateComponent
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        updateComponent = () => {
          const name = vm._name
          const id = vm._uid
          const startTag = `vue-perf-start:${id}`
          const endTag = `vue-perf-end:${id}`
    
          mark(startTag)
          const vnode = vm._render()
          mark(endTag)
          measure(`vue ${name} render`, startTag, endTag)
    
          mark(startTag)
          vm._update(vnode, hydrating)
          mark(endTag)
          measure(`vue ${name} patch`, startTag, endTag)
        }
      } else {
        updateComponent = () => {
          vm._update(vm._render(), hydrating)
        }
      }
    
      // noop: util/index.js: export function noop (a?: any, b?: any, c?: any) {} 就是没有任何操作的意思
      new Watcher(vm, updateComponent, noop, {
        before () {
          if (vm._isMounted && !vm._isDestroyed) {
            callHook(vm, 'beforeUpdate')
          }
        }
      }, true /* isRenderWatcher */)
    ```

    



## with

with 语句用于设置代码在特定对象中的作用域。

