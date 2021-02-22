# diff

2.0

```js
new Vue({
  el: '#app-2',
  data: {
    message: '页面加载于 ' + new Date().toLocaleString()
  }
})
```

3.0

```js
Vue.createApp(Counter).mount('#counter')

// 定义名为 todo-item 的新组件
app.component('todo-item', {
  template: `<li>This is a todo</li>`
})

// 挂载 Vue 应用
app.mount(...)
```

为什么发生这样的变化？原因是：如果我们在 Vue2 中创建多个 Vue 实例，那么所有应用（#app）都会共享全局相同的配置。

```ts
// 全局共享、相互影响
Vue.mixin({
  /* ... */
})

Vue.directive('...', {
  ...
})
const app1 = new Vue({ el: '#app-1' })
const app2 = new Vue({ el: '#app-2' })

/** 在 Vue3 中，你可以创建多个实例，且每个实例都可以拥有单独的配置 */
import { createApp } from 'vue'
import App1 from './App1.vue'
import App2 from './App2.vue'

const app1 = createApp(App1)
const app2 = createApp(App2)

app1.mount('#app-1')
app2.mount('#app-2')

app1.directive('...', {
  ...
})
app2.directive('...', {
  ...
})
```

**设置共享全局配置**可以通过工厂函数方式实现：

```ts
import { createApp } from 'vue';
import App1 from './App1.vue';
import App2 from './App2.vue';

const createApp = (Instance) => {
    const App = createApp(Instance);
  App.directive('i-am-cool', {
      inserted: () => {
      console.log('I am cool!');
    },
  });
}

createIdolApp(App1).mount('#app-1');
createIdolApp(App2).mount('#app-2');
```

## Composition API

受到 React 的启发，Vue3 引入 **Composition API 和 “hook”** 函数。有了它，Vue 组件的使用变得更加灵活，也变得更加强大。

```ts
import { ref, onMounted, computed } from 'vue'
import { fetchResources } from '@/actions'

/**
* 这是一个非常简单的 Composition function ，实现了获取 resources 数据的功能。
*/
export default function useResources() {
  // ref 会创建一个动态对象。如果你要从 ref 获取原始值，则需要取 “value” 属性。
  const resources = ref([])
  // getResources 函数用于获取数据
  const getResources = async () => resources.value = await fetchResources()
	// 生命周期函数会在组件添加到 Dom 时调用
  onMounted(getResources); // 以前我们是返回一个对象里写声明周期函数的，现在变成钩子函数了。

  // 计算属性
  const resourceCount = computed(() => resources.value.length)
  const hasResources = computed(() => resourceCount.value > 0 )

  return {
    resources,
    resourceCount,
    hasResources
  }
}
```

Composition 函数通常用 **use** 开头作为关键字（类似react hook里的自定义钩子）

```vue
<script>
import ResourceDetail from '@/components/ResourceDetail'
import ResourceList from '@/components/ResourceList'
import useResources from '@/composition/useResources';
export default {
  components: {
    ResourceDetail,
    ResourceList,
  },
  data() { // data 在 Vue3 中将只能是函数
    return {
      title: 'Your resources',
      selectedResource: null
    }
  },
  // setup 钩子函数执行在组件实例创建（created）之前
  setup() {
    // 在组件创建前 setup 中 hook 被执行，只要 props 被解析，服务就会以 composition API 作为入口。
    // 因为此时当 setup 执行时，组件实例还未生成，没有 this 对象。
    return {
      ...useResources() // 在 setup 里调用，返回值都可以再通过 this 进行调用
    }
  },
  computed: {
    activeResource() {
      return this.selectedResource || (this.hasResources && this.resources[0]) || null
    }
  },
  methods: {
    selectResource(resource) {
      this.selectedResource = {...resource}
    }
  }
}
</script>
```

## Filters 被移除

不会再出现这样的写法：

```vue
<h1>{{title | capitalized }} </h1>
```

这样的表达式不是合法有效的 Javascript，在 Vue 中实现这样的写法需要额外的成本。它可以很容易被转化为计算属性或函数。

## 多个根标签

在 Vue3 中将不再有单个根标签的限制

## Suspense

Suspense 是一种特殊的 Vue 组件，用于解析有异步数据的组件。

使用新的 Composition API，setup 可设置异步函数。Suspense 可以展示异步的模板直到 setup 被解析完。

```vue
<!-- UserPanel组件 -->
<template>
  Welcome, {{user.name}}
</template>
<script>
  import { fetchUser } from '@/actions';
  export default {
    async setup() {
      const user = await fetchUser();
      return { user }
    }
  }
</script>

<Suspense>
  <template #default>
    <UserPanel/>
  </template>
  <template #fallback>
    Loading user ...
  </template>
</Suspense>
```

## 响应式

妇孺皆知，Vue3 的响应式也有很大变化（proxy），不再需要使用 Vue.set 或 Vue.delete。你可以使用简单的原生函数来操作数组或对象。

在 composition API 中，所有的更改都是响应式的。

## 多个 v-model

在 Vue3 中，你可以使用多个 v-model，比如这样：

```vue
<ChildComponent v-model:prop1="prop1" v-model:prop2="prop2"/>
```

## Teleport

```vue
<teleport to="#teleportContent">
  <div class="teleport-body">I am Teleported!</div>
</teleport>
```

此内容将被传送到 id 为 teleportContent 的节点中

唯一的条件是：在定义传送内容之前，传送到的目标节点需已经存在。

可以绑定 id，类，[data-xx]。

## Vue Router

在 Vue3 中：

```ts
import { createRouter, createWebHistory } from 'vue-router'
import SomePage1 from './pages/SomePage1'
import SomePage2 from './pages/SomePage2'

const routes = [
  { path: '/', redirect: {name: 'HomePage'}},
  { path: '/path', name: 'HomePage', component: SomePage1 },
  { path: '/some/path', component: SomePage2 }
]

const router = createRouter({
  history: createWebHistory(),
  linkExactActiveClass: 'active',
  routes
})

export default router;
```

main.js

```ts
import router from './router'
const app = createApp(App)
app.use(router)
app.mount('#app')
```



## Vue 3.0 性能提升主要是通过哪几方面体现的？

#### 响应式系统提升

vue2在**初始化**的时候，对data中的每个属性使用 defineproperty 调用getter和setter使之变为响应式对象。如果属性值为对象，还会**递归调用defineproperty**使之变为响应式对象。

> 使用 Object.defineProperty 修改数组的length时，会报错 - `Uncaught TypeError: Cannot redefine property: length at A.defineProperty (<anonymous>)`。vue用defineproperty下的setter和getter方法做依赖跟踪的。并不是所有的浏览器都允许 Array.length 的重定义。简单来说length的命名访问器属性set和get你不能动它，也就无法设置setter和getter。
>
> Object.defineProperty 也可以实现监听数组下标，但是 Object.defineProperty 监听数组索引性能支出和用户收益不成正比（by 尤）。虽然现代浏览器对于几千长度的数组添加setter和getter也问题不大，但是性价比太低了。我的想法是，用户很少会有批量更改的操作，绝大多数时候我们都是单独更改其中一个元素，这时候我们批量循环遍历给数组增加监听就没有什么必要（更何况如果是长列表的话）。而且数组可以随时增加长度，我们不知道是中间插入还是后面插入，后续也需要很多性能支出去增加监听。
>
> 而且因为length = 5的数组，未必索引就有4，这个索引(属性)不存在，就没法setter了。

vue3使用proxy对象重写响应式。proxy的性能本来比defineproperty好，proxy可以拦截属性的访问、赋值、删除等操作，不需要初始化的时候遍历所有属性，另外有多层属性嵌套的话，只有访问某个属性的时候，才会递归处理下一级的属性。

#### 优势：

- 可以监听动态新增的属性；
- 可以监听删除的属性 ；
- 可以监听数组的索引和 length 属性

#### 编译优化

优化编译和重写虚拟dom，让首次渲染和更新dom性能有更大的提升 vue2 通过标记静态根节点,优化 diff 算法 vue3 标记和提升所有静态根节点,diff 的时候只比较动态节点内容

模板里面**不用创建唯一根节点**,可以直接放同级标签和文本内容

#### 静态提升

跳过静态节点,直接对比动态节点,缓存事件处理函数

## Composition Api 与 Vue 2.x使用的Options Api 有什么区别？

#### Options Api

包含一个描述组件选项（data、methods、props等）的对象 options；

API开发复杂组件，同一个功能逻辑的代码被拆分到不同选项 ；

使用mixin重用公用代码，也有问题：命名冲突，数据来源不清晰；

#### composition Api

vue3 新增的一组 api，它是基于函数的 api，可以更灵活的组织组件的逻辑。

解决options api在大型项目中，options api不好拆分和重用的问题。

#### composition Api

vue3 新增的一组 api，它是基于函数的 api，可以更灵活的组织组件的逻辑。

解决options api在大型项目中，options api不好拆分和重用的问题。

## Proxy 对比 Object.defineProperty

proxy的性能本来比defineproperty好，proxy可以拦截属性的访问、赋值、删除等操作，不需要初始化的时候遍历所有属性，另外有多层属性嵌套的话，只有访问某个属性的时候，才会递归处理下一级的属性。

- 可以* 监听数组变化
- 可以劫持整个对象
- 操作时不是对原对象操作,是 new Proxy 返回的一个新对象
- 可以劫持的操作有 13 种

## Vue 3.0 在编译方面有哪些优化？

vue.js 3.x中标记和提升所有的静态节点，diff的时候只需要对比动态节点内容；

#### Fragments（升级vetur插件):

template中不需要唯一根节点，可以直接放文本或者同级标签

静态提升(hoistStatic),当使用 hoistStatic 时,所有静态的节点都被提升到 render 方法之外.只会在应用启动的时候被创建一次,之后使用只需要应用提取的静态节点，随着每次的渲染被不停的复用。

patch flag, 在动态标签末尾加上相应的标记,只能带 patchFlag 的节点才被认为是动态的元素,会被追踪属性的修改,能快速的找到动态节点,而不用逐个逐层遍历，提高了虚拟dom diff的性能。

缓存事件处理函数cacheHandler,避免每次触发都要重新生成全新的function去更新之前的函数 tree shaking 通过摇树优化核心库体积,减少不必要的代码量

## Vue.js 3.0 响应式系统的实现原理？

#### reactive

设置对象为响应式对象。接收一个参数，判断这参数是否是对象。不是对象则直接返回这个参数，不做响应式处理。创建拦截器handerler，设置get/set/deleteproperty。

#### get

- 收集依赖（track）；
- 如果当前 key 的值是对象，则为当前 key 的对
- 象创建拦截器 handler, 设置 get/set/deleteProperty；

如果当前的 key 的值不是对象，则返回当前 key 的值。

#### set

设置的新值和老值不相等时，更新为新值，并触发更新（trigger）。

deleteProperty 当前对象有这个 key 的时候，删除这个 key 并触发更新（trigger）

#### effect

接收一个函数作为参数。作用是：访问响应式对象属性时去收集依赖

#### track

#### 接收两个参数：target 和 key

－如果没有 activeEffect，则说明没有创建 effect 依赖

－如果有 activeEffect，则去判断 WeakMap 集合中是否有 target 属性

－WeakMap 集合中没有 target 属性，则 set(target, (depsMap = new Map()))

－WeakMap 集合中有 target 属性，则判断 target 属性的 map 值的 depsMap 中是否有 key 属性

－depsMap 中没有 key 属性，则 set(key, (dep = new Set())) －depsMap 中有 key 属性，则添加这个 activeEffect

#### trigger

判断 WeakMap 中是否有 target 属性，WeakMap 中有 target 属性，则判断 target 属性的 map 值中是否有 key 属性，有的话循环触发收集的 effect()。