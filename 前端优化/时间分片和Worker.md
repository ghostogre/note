当延迟超过100ms，用户就会察觉到轻微的延迟。

为了避免这种情况，我们可以使用两种方案，一种是Web Worker，另一种是时间切片

## Worker

Web Worker为Web内容在后台线程中运行脚本提供了一种简单的方法。线程可以执行任务而不干扰用户界面。此外，他们可以使用XMLHttpRequest执行 I/O  (尽管responseXML和channel属性总是为空)。一旦创建， **一个worker 可以将消息发送到创建它的JavaScript代码, 通过将消息发布到该代码指定的事件处理程序（反之亦然）**

Web Worker 的作用，就是为 JavaScript 创造多线程环境，允许主线程创建 Worker 线程，将一些任务分配给后者运行。在主线程运行的同时，Worker 线程在后台运行，两者互不干扰。等到 Worker 线程完成计算任务，再把结果返回给主线程。这样的好处是，一些计算密集型或高延迟的任务，被 Worker 线程负担了，主线程（通常负责 UI 交互）就会很流畅，不会被阻塞或拖慢。

Worker 线程一旦新建成功，就会始终运行，不会被主线程上的活动（比如用户点击按钮、提交表单）打断。这样有利于随时响应主线程的通信。但是，这也造成了 Worker 比较耗费资源，不应该过度使用，而且一旦使用完毕，就应该关闭。

Web Worker 有以下几个使用注意点。

1. 同源限制
   分配给 Worker 线程运行的脚本文件，必须与主线程的脚本文件同源。
2. DOM 限制
   Worker 线程所在的全局对象，与主线程不一样，无法读取主线程所在网页的 DOM 对象，也无法使用document、window、parent这些对象。但是，Worker 线程可以navigator对象和location对象。
3. 通信联系
   Worker 线程和主线程不在同一个上下文环境，它们不能直接通信，必须通过消息完成。
4. 脚本限制
   Worker 线程不能执行alert()方法和confirm()方法，但可以使用 XMLHttpRequest 对象发出 AJAX 请求。
5. 文件限制
   Worker 线程无法读取本地文件，即不能打开本机的文件系统（file://），它所加载的脚本，必须来自网络。

### 基本用法

主线程采用`new`命令，调用`Worker()`构造函数，新建一个 Worker 线程。Worker()构造函数的参数是一个脚本文件，该文件就是 Worker 线程所要执行的任务。由于 Worker 不能读取本地文件，所以这个脚本必须来自网络。如果下载没有成功（比如404错误），Worker 就会默默地失败。

```javascript
new Worker(URL, options) // options里可以指定worker的name
```

然后，主线程调用`worker.postMessage()`方法，向 Worker 发消息。

- `worker.postMessage()`方法的参数，就是主线程传给 Worker 的数据。它可以是各种数据类型，包括二进制数据。
- `worker.terminate();`：主线程关闭worker

```javascript
worker.onmessage = function (event) {
  console.log('Received message ' + event.data);
  doSomething();
}

function doSomething() {
  // 执行任务
  worker.postMessage('Work done!');
}
```

**worker 线程**：Worker 线程内部需要有一个监听函数，监听message事件。

```javascript
// 写法一
this.addEventListener('message', function (e) {
  this.postMessage('You said: ' + e.data);
}, false);

// 写法二
addEventListener('message', function (e) {
  postMessage('You said: ' + e.data);
}, false);
```

除了使用`addEventListener()`指定监听函数，也可以使用`onmessage`指定。监听函数的参数是一个事件对象，它的data属性包含主线程发来的数据。`postMessage()`方法用来向主线程发送消息。

`this.close()`用来在线程内部关闭自身。

Worker 内部如果要加载其他脚本，有一个专门的方法`importScripts()`，该方法可以同时加载多个脚本。

```javascript
importScripts('script1.js', 'script2.js');
```

主线程可以监听 Worker 是否发生错误。如果发生错误，Worker 会触发主线程的error事件。

```javascript
worker.onerror(function (event) {
  console.log([
    'ERROR: Line ', e.lineno, ' in ', e.filename, ': ', e.message
  ].join(''));
});

// 或者
worker.addEventListener('error', function (event) {
  // ...
});
```

### 使用

有时，浏览器需要轮询服务器状态，以便第一时间得知状态改变。这个工作可以放在 Worker 里面。

## 时间切片（Time Slicing）

时间切片是一项使用得比较广的技术方案，它的本质就是将长任务分割为一个个执行时间很短的任务，然后再一个个地执行。

例如当我们需要在页面中一次性插入一个长列表时（当然，通常这种情况，我们会使用分页去做）。

如果利用时间分片的概念来实现这个功能，我们可以使用`requestAnimationFrame`+`DocumentFragment`

代码如下：

1. 未使用时间切片

```html
<style>
    * {
        margin: 0;
        padding: 0;
    }
    .list {
        width: 60vw;
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
    }
</style>
<ul class="list"></ul>
<script>
    'use strict'
    let list = document.querySelector('.list')
    let total = 100000
    for (let i = 0; i < total; ++i) {
        let item = document.createElement('li')
        item.innerText = `我是${i}`
        list.appendChild(item)
    }
</script>
```

2. 使用了时间切片
```html
<style>
    * {
        margin: 0;
        padding: 0;
    }
    .list {
        width: 60vw;
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
    }
</style>
<ul class="list"></ul>
<script>
    'use strict'
    let list = document.querySelector('.list')
    let total = 100000
    let size = 20
    let index = 0
    const render = (total, index) => {
        if (total <= 0) {
            return
        }
        let curPage = Math.min(total, size)
        // window.requestAnimationFrame() 告诉浏览器——你希望执行一个动画，并且要求浏览器在下次重绘之前调用指定的回调函数更新动画。该方法需要传入一个回调函数作为参数，该回调函数会在浏览器下一次重绘之前执行
        window.requestAnimationFrame(() => {
            // 最大的区别是因为 DocumentFragment 不是真实 DOM 树的一部分，它的变化不会触发 DOM 树的重新渲染，且不会导致性能等问题。
            let fragment = document.createDocumentFragment()
            for (let i = 0; i < curPage; ++i) {
                let item = document.createElement('li')
                item.innerText = `我是${index + i}`
                fragment.appendChild(item)
            }
            list.appendChild(fragment)
            render(total - curPage, index + curPage) // 递归调用
        })
    }
    render(total, index)
</script>
```

除了上述的生成DOM的方案，我们同样可以利用`requestIdleCallback` 以及ES6的`Generator`来实现。

```html
<style>
    * {
        margin: 0;
        padding: 0;
    }
    .list {
        width: 60vw;
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
    }
</style>
<ul class="list"></ul>
<script>
    'use strict'
    function gen(task) {
      requestIdleCallback(deadline => {
        let next = task.next()
        while (!next.done) {
          if (deadline.timeRemaining() <= 0) {
            gen(task)
            return
          }
          next = task.next()
        }
      })
    }
    let list = document.querySelector('.list')
    let total = 100000
    function* loop() {
      for (let i = 0; i < total; ++i) {
        let item = document.createElement('li')
        item.innerText = `我是${i}`
        list.appendChild(item)
        yield
      }
    }
    gen(loop())
</script>
```
