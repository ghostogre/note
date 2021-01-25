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

