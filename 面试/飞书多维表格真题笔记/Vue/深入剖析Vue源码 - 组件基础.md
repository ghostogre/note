# 深入剖析Vue源码 - 组件基础

### 组件两种注册方式

##### 全局注册

```js
Vue.component('my-test', {
    template: '<div>{{test}}</div>',
    data () {
        return {
            test: 1212
        }
    }
})
var vm = new Vue({
    el: '#app',
    template: '<div id="app"><my-test><my-test/></div>'
})
```

**其中组件的全局注册需要在全局实例化Vue前调用**，注册之后可以用在任何新创建的`Vue`实例中调用。

##### 局部注册

```js
var myTest = {
    template: '<div>{{test}}</div>',
    data () {
        return {
            test: 1212
        }
    }
}
var vm = new Vue({
    el: '#app',
    component: {
        myTest
    }
})
```

当只需要在某个局部用到某个组件时，可以使用局部注册的方式进行组件注册，此时局部注册的组件只能在注册该组件内部使用。

