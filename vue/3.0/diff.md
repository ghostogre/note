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

