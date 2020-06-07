## 链式调用

直接在 `then` 里面返回一个 `Promise` 的对象

## 终止链式调用

```javascript
throw new Error('error message')
```

一旦抛出错误，则会跳过之后所有的then链直接跳转到catch。

## 并发

通常，我们在需要保证代码在多个异步处理之后执行，会用到：

```javascript
Promise.all(promises: []).then(fun: function);
```

`Promise.all`可以保证，`promises`数组中所有promise对象都达到resolve状态，才执行`then`回调。

```javascript
function asyncPool(poolLimit, array, iteratorFn) {
    let i = 0;
    const ret = [];
    const executing = [];
    const enqueue = function () {
        // 边界处理，array为空数组
        if (i === array.length) {
            return Promise.resolve();
        }
        // 每调一次enqueue，初始化一个promise
        const item = array[i++];
        const p = Promise.resolve().then(() => iteratorFn(item, array));
        // 放入promises数组
        ret.push(p);
        // promise执行完毕，从executing数组中删除
        const e = p.then(() => executing.splice(executing.indexOf(e), 1));
        // 插入executing数字，表示正在执行的promise
        executing.push(e);
        // 使用Promise.rece，每当executing数组中promise数量低于poolLimit，就实例化新的promise并执行
        let r = Promise.resolve();
        if (executing.length >= poolLimit) {
            r = Promise.race(executing);
        }
        // 递归，直到遍历完array
        return r.then(() => enqueue());
    };
    return enqueue().then(() => Promise.all(ret));
}
```

promise并不是因为调用`Promise.all`才执行，而是在实例化promise对象的时候就执行了，在理解这一点的基础上，要实现并发限制，只能从promise实例化上下手。

就是把生成`promises`数组的控制权，交给并发控制逻辑。

1. 从`array`第1个元素开始，初始化`promise`对象，同时用一个`executing`数组保存正在执行的promise
2. 不断初始化promise，直到达到`poolLimt`
3. 使用`Promise.race`，获得`executing`中promise的执行情况，当有一个promise执行完毕，继续初始化promise并放入`executing`中
4. 所有promise都执行完了，调用`Promise.all`返回