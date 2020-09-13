## setState

在 src/ReactBaseClasses.js 这个文件里打断点，然后页面触发`setState`。

除了报错处理就是运行了 `this.updater.enqueueSetState()` ，运行了updater上面的`enqueueSetState`方法。

向下查找我们找到了`ReactFiberClassComponent`里定义的`classComponentUpdater`对象。

## enqueueSetState方法

在`classComponentUpdater`对象上的`enqueueSetState`方法如下：

```js
 var fiber = get(inst); // inst
```

第一句返回一个fiber对象，get很简单就是返回`inst._reactInternals`

几个变量用于创建Update的参数：

1. eventTime：底层使用的是`scheduler`这个库，

传入构造函数得到一个update对象：

```js
const update = createUpdate(eventTime, lane, suspenseConfig);
// payload 就是我们在setState的时候传入的第一个参数，可以是对象或者方法
update.payload = payload;
// ...
// 省略了包裹的判断
update.callback = callback // callback也就是setState的第二参数，也就是完成更新后的调用方法。
```



### react-reconclier/ReactUpdateQueue.new.js

`enqueueUpdate`做了一件事就是将update加入到fiber对象上的pending链表的头部（准确来说是，fiber对象上的shared对象上的pending，加入pending为空也就是第一次更新的话，将update.next指向update自己）

