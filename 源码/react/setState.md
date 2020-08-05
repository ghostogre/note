## setState

在 src/ReactBaseClasses.js 这个文件里打断点，然后页面触发`setState`。

进入 `this.updater.enqueueSetState` ，实际上调用的是`ReactFiberClassComponent`里定义的`classComponentUpdater`。

```js
 var fiber = get(inst); // inst
```



