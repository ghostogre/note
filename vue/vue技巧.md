### 「全局组件注册」

组件是我们非常常用的东西，很多人使用组件都是通过一个一个文件去引用和注册。如果一个组件在整个项目里面的使用次数较多，每一次使用都需要引用并注册，就会显得特别麻烦

当我们在项目需要重复多次使用该组件，会导致出现很多重复的引入和注册代码，既繁琐又不雅观。因此我们可以通过一个全局的`Js`文件来管理，将需要**多次使用**的组件进行全局注册

```javascript
// 1 - globalComponent.js

import Vue from 'vue' // 引入vue

// 处理首字母大写 abc => Abc
function changeStr(str){
    return str.charAt(0).toUpperCase() + str.slice(1)
}

/* require.context(arg1,arg2,arg3)
   arg1 - 读取文件的路径
   arg2 - 是否遍历文件的子目录
   arg3 - 匹配文件的正则
   关于这个Api的用法，建议小伙伴们去查阅一下，用途也比较广泛
*/
const requireComponent = require.context('.', false, /\.vue$/)
console.log('requireComponent.keys():',requireComponent.keys())  // 打印
requireComponent.keys().forEach(fileName => {
    const config = requireComponent(fileName)
    console.log('config:',config)  // 打印
    const componentName = changeStr(
        fileName.replace(/^\.\//, '').replace(/\.\w+$/, '')   // ./child1.vue => child1
    )
    
    Vue.component(componentName, config.default || config) // 动态注册该目录下的所有.vue文件
})

// 2 - 将globalComponent.js引入main.js

import global from './components/globalComponent'

// 3 - 使用这类组件不再需要引入和注册，直接标签使用即可
```

#### 路由分区以及动态添加路由

> 假设我们有很多路由，每一个路由都通过傻瓜式的引入方式，会导致整个项目代码量增多，繁琐，更重要的一点是增加后期维护的难度。因此我们也可以通过上面类似的方式，对路由的引入和使用进行管理，实现分区引入路由，将不同功能下的路由进行区分，通过动态的方式进行引入，即方便快捷又增加可维护

##### 创建专门的路由`.js`文件管理所有的路由

```markdown
总路由管理文件 - index.js

分区路由
    - index.routes.js
    - login.routes.js

在大型项目中，往往会有很多互不关联的模块，例如电商平台中的商城，个人信息，这种情况下就可以对路由进行分区
```

```javascript
// 分区路由文件写法

export default {
    path:'/index',
    name:'Index',
    component: () => import('../views/Index.vue'),  // 懒加载式引入，当跳转到时才进行引入chunk
    children: [...]
}

// 总路由管理文件 index.js 写法
import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routerList = []  // 路由数组 - 存放所有路由
function importAll(routerArr){
    // 该函数用于将所有分区路由中的路由添加到路由数组
    routerArr.keys().forEach( key => {
        console.log(key)
        routerList.push(routerArr(key).default)
    })
}
importAll(require.context('.',true,/\.routes\.js/))

const routes = [
    ...routerList
]

const router = new VueRouter({
    routes
})

export default router
```

### 「拯救繁乱的template」

很多人在写组件的时候，会依赖脚手架中的``标签，其实`template`也存在一定的缺陷，例如：

- `template`里存在一值多判断
- 过多使用`template`会使代码冗余，杂乱

`VUE`给我们提供了一个`render`函数，我们可以通过这个函数巧妙的解决`template`造成的问题。当逻辑判断较多的时候我们可以考虑使用render函数