# Promise 原理

Promise 必须为以下三种状态之一：等待态（Pending）、执行态（Fulfilled）和拒绝态（Rejected）。一旦Promise 被 resolve 或 reject，不能再迁移至其他任何状态（即状态 immutable）。

基本过程：

1. 初始化 Promise 状态（pending）
2. 立即执行 Promise 中传入的 fn 函数，将Promise 内部 resolve、reject 函数作为参数传递给 fn ，按事件机制时机处理
3. 执行 then(..) 注册回调处理数组（then 方法可被同一个 promise 调用多次）
4. Promise里的关键是要保证，then方法传入的参数 onFulfilled 和 onRejected，必须在then方法被调用的那一轮事件循环之后的新执行栈中执行。

**真正的链式Promise是指在当前promise达到fulfilled状态后，即开始进行下一个promise.**

```ts
    function Promise(fn){ 
        let state = 'pending';
        let value = null;
        const callbacks = [];

        this.then = function (onFulfilled){
            return new Promise((resolve, reject)=>{
                handle({
                    onFulfilled, 
                    resolve
                })
            })
        }

      	// 桥梁，将新 Promise 的 resolve 方法，放到前一个 promise 的回调对象中
        function handle(callback){
            if(state === 'pending'){
                callbacks.push(callback)
                return;
            }
            
            if(state === 'fulfilled'){
                if(!callback.onFulfilled){
                    callback.resolve(value)
                    return;
                }
                const ret = callback.onFulfilled(value) //处理回调
                callback.resolve(ret) //处理下一个 promise 的resolve
            }
        }
        function resolve(newValue){
            const fn = ()=>{
              	// 状态一旦改变不能继续改变
                if(state !== 'pending')return

                state = 'fulfilled';
                value = newValue
                handelCb()
            }
            
            setTimeout(fn,0) //基于 PromiseA+ 规范
        }
        // 批量处理callback
        function handelCb(){
            while(callbacks.length) {
                const fulfiledFn = callbacks.shift();
                handle(fulfiledFn);
            };
        }
        
        fn(resolve)
    }
```

假如 resolve 不是一个基本类型（返回一个promise）的情况下：

```ts
    function Promise(fn){ 
        // ...
        function resolve(newValue){
            const fn = ()=>{
                if(state !== 'pending')return

                if (
                   newValue &&
                   (typeof newValue === 'object' || typeof newValue === 'function')
                ) {
                    const {then} = newValue
                    if(typeof then === 'function'){
                        // newValue 为新产生的 Promise, 此时resolve为上个 promise 的resolve
                        // 相当于调用了新产生 Promise 的then方法，注入了上个 promise 的resolve 为其回调
                        // 当 resolve 入参为 Promise 的时候，调用其 then 方法为其注入回调函数
                        // 而注入的是前一个 Promise 的 resolve 方法，所以要用 call 来绑定 this 的指向。
                        then.call(newValue,resolve)
                        return
                    }
                }
                state = 'fulfilled';
                value = newValue
                handelCb()
            }
            
            setTimeout(fn,0)
        }
        // ...
    }
```

### reject

```ts
    function Promise(fn){ 
        let state = 'pending';
        let value = null;
        const callbacks = [];

        this.then = function (onFulfilled,onRejected){
            return new Promise((resolve, reject)=>{
                handle({
                    onFulfilled, 
                    onRejected,
                    resolve, 
                    reject
                })
            })
        }
        this.catch = function (onError){
            // 错误也好，异常也罢，实际上都是通过reject实现的
            this.then(null, onError)
        }
      	// finally 注册的函数是与 Promise 的状态无关的，不依赖 Promise 的执行结果
        this.finally = function (onDone){
            this.then(onDone,onDone)
        }

        function handle(callback){
            if(state === 'pending'){
                callbacks.push(callback)
                return;
            }
            
            const cb = state === 'fulfilled' ? callback.onFulfilled : callback.onRejected;
            const next = state === 'fulfilled'? callback.resolve : callback.reject;

            if(!cb){
                // 假如是rejected，但是then里面只传了 onFulfilled 这一个回调函数，那么cb就是undefined。
                next(value)
                return;
            }
          
          	// 使用 try-catch 来捕获错误，并将 Promise 设为 rejected 状态即可。
            try {
            		const ret = cb(value)
                next(ret)
            } catch (e) {
                callback.reject(e);
            }
        }
        function resolve(newValue){
            const fn = ()=>{
                if(state !== 'pending')return

                if(newValue && (typeof newValue === 'object' || typeof newValue === 'function')){
                    const {then} = newValue
                    if(typeof then === 'function'){
                        // newValue 为新产生的 Promise,此时resolve为上个 promise 的resolve
                        //相当于调用了新产生 Promise 的then方法，注入了上个 promise 的resolve 为其回调
                        then.call(newValue,resolve, reject)
                        return
                    }
                }
                state = 'fulfilled';
                value = newValue
                handelCb()
            }
            
            setTimeout(fn,0)
        }
        function reject(error){

            const fn = ()=>{
                if(state !== 'pending')return

                if(error && (typeof error === 'object' || typeof error === 'function')){
                    const {then} = error
                    if(typeof then === 'function'){
                        then.call(error,resolve, reject)
                        return
                    }
                }
                state = 'rejected';
                value = error
                handelCb()
            }
            setTimeout(fn,0)
        }
        function handelCb(){
            while(callbacks.length) {
                const fn = callbacks.shift();
                handle(fn);
            };
        }
        fn(resolve, reject)
    }
```

异常通常是指在执行成功 / 失败回调时代码出错产生的错误，对于这类异常，我们使用 try-catch 来捕获错误，并将 Promise 设为 rejected 状态即可。

### resolve 方法和 reject 方法

```ts
Promise.resolve({name:'winty'})
Promise.reject({name:'winty'})
// 等价于
new Promise(resolve => resolve({name:'winty'}))
new Promise((resolve,reject) => reject({name:'winty'}))
```

Promise.resolve 的入参可能有以下几种情况：

- **无参数** [直接返回一个resolved状态的 Promise 对象]
- **普通数据对象** [直接返回一个resolved状态的 Promise 对象]
- 一个**Promise实例** [直接返回当前实例]
- 一个**thenable**对象(thenable对象指的是具有then方法的对象) [转为 Promise 对象，并立即执行thenable对象的then方法。]

```ts
Promise.resolve = function (value){
  if (value && value instanceof Promise) {
    return value;
  } else if (value && typeof value === 'object' && typeof value.then === 'function'){
    let then = value.then;
    return new Promise(resolve => {
      then(resolve);
    });
  } else if (value) {
    return new Promise(resolve => resolve(value));
  } else {
    return new Promise(resolve => resolve());
  }
}

Promise.reject = function (value){
  return new Promise(function(resolve, reject) {
		reject(value);
	});
}
```

### Promise.all

入参是一个 Promise 的实例数组，然后注册一个 then 方法，然后是数组中的 Promise 实例的状态都转为 fulfilled 之后则执行 then 方法。这里主要就是一个计数逻辑，每当一个 Promise 的状态变为 fulfilled 之后就保存该实例返回的数据，然后将计数减一，当计数器变为 0 时，代表数组中所有 Promise 实例都执行完毕。

```ts
Promise.all = function (arr){
  var args = Array.prototype.slice.call(arr);
  return new Promise(function(resolve, reject) {
    // resolve 后传递一个结果的数组，只要列表有一个promise 进入 reject，就直接整个Promise 进入 reject。
    if(args.length === 0) return resolve([]);
    var remaining = args.length;

    function res(i, val) {
      try {
        if(val && (typeof val === 'object' || typeof val === 'function')) {
          var then = val.then;
          if(typeof then === 'function') {
            then.call(val, function(val) {
              res(i, val);
            }, reject);
            return;
          }
        }
        args[i] = val;
        if(--remaining === 0) {
          resolve(args);
        }
      } catch(ex) {
        reject(ex);
      }
    }
    for(var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
}

Promise.race = function(values) {
  return new Promise(function(resolve, reject) {
    for(var i = 0, len = values.length; i < len; i++) {
      values[i].then(resolve, reject);
    }
  });
}

```

