## redux-thunk

### **redux-thunk** 的使用与缺点

**thunk**是**redux**作者给出的中间件，其实就是一个延迟调用的函数，实现极为简单，10多行代码：

```js
function createThunkMiddleware(extraArgument) {
  return ({ dispatch, getState }) => next => action => {
    if (typeof action === 'function') {
      return action(dispatch, getState, extraArgument);
    }

    return next(action);
  };
}

const thunk = createThunkMiddleware();
thunk.withExtraArgument = createThunkMiddleware;

export default thunk;
```

**thunk**的缺点也是很明显的，**thunk**仅仅做了执行这个函数，并不在乎函数主体内是什么，也就是说thunk使得**redux**可以接受函数作为action，但是函数的内部可以多种多样。

action不易维护的原因：

I）action的形式不统一

II）就是异步操作太为分散，分散在了各个action中

# redux-saga

在**redux-saga**中，action是plain object（原始对象），并且集中处理了所有的异步操作。

为了运行 Saga，我们需要：

- 创建一个 Saga middleware 和要运行的 Sagas
- 将这个 Saga middleware 连接至 Redux store

```js
import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'

// 我们的saga
import { mySaga } from './sagas'
// 使用 redux-saga 模块的 createSagaMiddleware 工厂函数来创建一个 Saga middleware
const sagaMiddleware = createSageMiddle()

// 使用 applyMiddleware 将 middleware 连接至 Store
const store = createStore(
  reducer,
  applyMiddleware(sagsaMiddleware)
)

// 然后使用 sagaMiddleware.run(mySaga) 运行 Saga。
sageMiddleware.run(mySaga)
```

`sagas.js` 模块：

```javascript
import { delay } from 'redux-saga'
import { put, takeEvery } from 'redux-saga/effects'

// Our worker Saga: 将执行异步的 increment 任务
export function* incrementAsync() {
  yield delay(1000)
  yield put({ type: 'INCREMENT' })  // => { done: boolean, value: any }
}

// Our watcher Saga: 在每个 INCREMENT_ASYNC action spawn 一个新的 incrementAsync 任务
export function* watchIncrementAsync() {
  yield takeEvery('INCREMENT_ASYNC', incrementAsync)
}
```

>  工具函数 `delay`，这个函数返回一个延迟 1 秒再 resolve 的 Promise 我们将使用这个函数去 *block(阻塞)* Generator。

**Sagas** 被实现为 `Generator functions`，它会 **yield 对象到 redux-saga middleware**。 被 yield 的对象都是一类指令，指令可被 middleware 解释执行。当 middleware 取得一个 yield 后的 Promise，middleware 会暂停 Saga，直到 Promise 完成。

一旦 Promise 被 resolve，middleware 会恢复 Saga 接着执行，直到遇到下一个 yield。

`put` 我们称作 **Effects** 。Effects 是一些简单 Javascript 对象，包含了要被 middleware 执行的指令。 当 middleware 拿到一个被 Saga yield 的 Effect，它会暂停 Saga，直到 Effect 执行完成，然后 Saga 会再次被恢复。

另一个 Saga `watchIncrementAsync`。我们用了一个 `redux-saga` 提供的辅助函数 `takeEvery`，用于监听所有的 `INCREMENT_ASYNC` action，并在 action 被匹配时执行 `incrementAsync` 任务。

添加一个 `rootSaga`，负责启动其他的 Sagas。

```js
import { delay } from 'redux-saga'
import { put, takeEvery, all } from 'redux-saga/effects'

function* incrementAsync() {
  yield delay(1000)
  yield put({ type: 'INCREMENT' })
}

function* watchIncrementAsync() {
  yield takeEvery('INCREMENT_ASYNC', incrementAsync)
}

// notice how we now only export the rootSaga
// single entry point to start all Sagas at once
export default function* rootSaga() {
  yield all([
    helloSaga(),
    watchIncrementAsync()
  ])
}
```

yield 了一个数组，意思是说这两个 Generators 将会同时启动。 现在我们只有在 `main.js` 的 root Saga 中调用 `sagaMiddleware.run`。

```js
put({type: 'INCREMENT'}) // => { PUT: {type: 'INCREMENT'} }
call(delay, 1000)        // => { CALL: {fn: delay, args: [1000]}}
```

middleware 检查每个被 yield 的 Effect 的类型，然后决定如何实现哪个 Effect。如果 Effect 类型是 `put` 那 middleware 会 dispatch 一个 action 到 Store。 如果 Effect 类型是 `call` 那么它会调用给定的函数。

### takeEvery

```javascript
import { call, put, takeEvery } from 'redux-saga/effects'

export function* fetchData(action) {
   try {
      const data = yield call(Api.fetchUser, action.payload.url);
      yield put({type: "FETCH_SUCCEEDED", data});
   } catch (error) {
      yield put({type: "FETCH_FAILED", error});
   }
}

function* watchFetchData() {
  // 我们发起一个ACTION type = 'FETCH_REQUESTED'
  // yield* 组合多个 Sagas
  yield* takeEvery('FETCH_REQUESTED', fetchData)
}
```

`takeEvery` 允许多个 `fetchData` 实例同时启动。在某个特定时刻，尽管之前还有一个或多个 `fetchData` 尚未结束，我们还是可以启动一个新的 `fetchData` 任务。

如果我们只想得到最新那个请求的响应（例如，始终显示最新版本的数据）。我们可以使用 `takeLatest` 辅助函数。和 `takeEvery` 不同，在任何时刻 `takeLatest` 只允许一个 `fetchData` 任务在执行。并且这个任务是最后被启动的那个。 如果已经有一个任务在执行的时候启动另一个 `fetchData` ，那**之前的这个任务会被自动取消**。

## 声明式 Effects

在 `redux-saga` 的世界里，Sagas 都用 Generator 函数实现。我们从 Generator 里 yield **纯 JavaScript 对象**以表达 Saga 逻辑。 我们称呼那些对象为 *Effect*。**Effect 是一个简单的对象，这个对象包含了一些给 middleware 解释执行的信息。** 你可以把 Effect 看作是**发送给 middleware 的指令以执行某些操作**（例如调用某些异步函数，发起一个 action 到 store）。

你可以使用 `redux-saga/effects` 包里提供的函数来创建 Effect。

在 Generator 函数中，`yield` 右边的任何表达式都会被求值，结果会被 yield 给调用者（可能是中间件，也可能是测试代码）

### call

假设我们yield的 value 是一个 promise ，这样的话例如**测试的时候我们就很难比较promise**了。`call`**可以仅仅 yield 一条描述函数调用的信息**。 yield 后的对象作一个简单的 `deepEqual` 来检查它是否 yield 了我们期望的指令。测试 Generator 时，所有我们需要做的是，将 yield 后的对象作一个简单的 `deepEqual` 来检查它是否 yield 了我们期望的指令。

`call` 创建一个纯文本对象描述函数调用。`redux-saga` middleware 确保执行函数调用并在响应被 resolve 时恢复 generator。

`call` 同样支持调用对象方法，你可以使用以下形式，为调用的函数提供一个 `this` 上下文：

```javascript
yield call([obj, obj.method], arg1, arg2, ...) // 如同 obj.method(arg1, arg2 ...)
```

`apply` 提供了另外一种调用的方式：

```javascript
yield apply(obj, obj.method, [arg1, arg2, ...])
```

`call` 和 `apply` 非常适合返回 Promise 结果的函数。另外一个函数 `cps` 可以用来处理 Node 风格的函数 （例如，`fn(...args, callback)` 中的 `callback` 是 `(error, result) => ()` 这样的形式，`cps` 表示的是延续传递风格（Continuation Passing Style））。

```javascript
import { cps } from 'redux-saga'

const content = yield cps(readFile, '/path/to/file')
```

`call` 是一个会阻塞的 Effect。即 Generator 在调用结束之前不能执行或处理任何其他事情。

### put

如果我们想要测试接收到 AJAX 响应之后执行 dispatch， 我们还需要模拟 `dispatch` 函数。只需创建一个对象来指示 middleware 我们需要发起一些 action，然后让 middleware 执行真实的 dispatch。

`put`这个函数用于创建 dispatch Effect。

**middleware 检查每个被 yield 的 Effect 的类型，然后决定如何实现哪个 Effect。如果 Effect 类型是 `PUT` 那 middleware 会 dispatch 一个 action 到 Store。 如果 Effect 类型是 `CALL` 那么它会调用给定的函数。**

## 错误处理

可以使用熟悉的 `try/catch` 语法在 Saga 中捕获错误。也可以让你的 API 服务返回一个正常的含有错误标识的值。

## 使用

使用 `takeEvery('*')`（使用通配符 `*` 模式），我们就能**捕获**发起的所有类型的 action。

```js
import { select, takeEvery } from 'redux-saga/effects'

function* watchAndLog() {
  yield takeEvery('*', function* logger(action) {
    const state = yield select()

    console.log('action', action)
    console.log('state after', state)
  })
}
```

take 创建另一个命令对象，告诉 middleware 等待一个特定的 action。在 `take` 的情况中，它将会暂停 Generator 直到一个匹配的 action 被发起了。

如何使用 `take` Effect 来实现和上面相同的功能：

```js
import { select, take } from 'redux-saga/effects'

function* watchAndLog() {
  while (true) {
    const action = yield take('*')
    const state = yield select()

    console.log('action', action)
    console.log('state after', state)
  }
}
```

`take` 就像我们更早之前看到的 `call` 和 `put`。它创建另一个命令对象，告诉 middleware 等待一个特定的 action。在 `take` 的情况中，它将会暂停 Generator 直到一个匹配的 action 被发起了。 在以上的例子中，`watchAndLog` 处于暂停状态，直到任意的一个 action 被发起。

注意，我们运行了一个无限循环的 `while(true)`。记住这是一个 Generator 函数，它不具备 `从运行至完成` 的行为。 Generator 将在每次迭代阻塞以等待 action 发起。

在 `takeEvery` 的情况中，被调用的任务无法控制何时被调用， 它们将在每次 action 被匹配时一遍又一遍地被调用。并且它们也无法控制何时停止监听。

而在 `take` 的情况中，控制恰恰相反。与 action 被 *推向（pushed）* 任务处理函数不同，Saga 是自己主动 *拉取（pulling）* action 的。 

## 无阻塞调用

为了表示无阻塞调用，redux-saga 提供了另一个 Effect：`fork`。 当我们 fork 一个 *任务*，任务会在后台启动，调用者也可以继续它自己的流程，而不用等待被 fork 的任务结束。

`yield fork` 的返回结果是一个 Task Object。 我们将它们返回的对象赋给一个本地常量 `task`。那个 task 传入给 `cancel` Effect。 如果任务仍在运行，它会被中止。如果任务已完成，那什么也不会发生，取消操作将会是一个空操作（no-op）。如果该任务完成了但是有错误， 那我们什么也没做，因为我们知道，任务已经完成了。

`cancel` Effect 不会粗暴地结束我们的任务，相反它会给予一个机会执行清理的逻辑。 在 `finally` 区块可以处理任何的取消逻辑（以及其他类型的完成逻辑）。由于 finally 区块执行在任何类型的完成上（正常的 return, 错误, 或强制取消），如果你想要为取消作特殊处理，有一个 `cancelled` Effect。

可使用 `yield cancelled()` 来检查 Generator 是否已经被取消。

```js
import { take, call, put, cancelled } from 'redux-saga/effects'
import Api from '...'

function* authorize(user, password) {
  try {
    const token = yield call(Api.authorize, user, password)
    yield put({type: 'LOGIN_SUCCESS', token})
    yield call(Api.storeItem, {token})
    return token
  } catch(error) {
    yield put({type: 'LOGIN_ERROR', error})
  } finally {
    if (yield cancelled()) {
      // ... put special cancellation handling code here
    }
  }
}
```

## 同时执行多个任务

```js
import { call } from 'redux-saga/effects'

// 正确写法, effects 将会同步执行
const [users, repos] = yield [
  call(fetch, '/users'),
  call(fetch, '/repos')
]
```

## race

`race` Effect 提供了一个方法，在多个 Effects 之间触发一个竞赛（race）。`race` 的另一个有用的功能是，它会**自动取消那些失败的 Effects**。

```js
import { race, take, call } from 'redux-saga/effects'

function* backgroundTask() {
  while (true) { /* 关闭时抛出关闭错误消息 */ }
}

function* watchStartBackgroundTask() {
  while (true) {
    yield take('START_BACKGROUND_TASK')
    yield race({
      task: call(backgroundTask),
      cancel: take('CANCEL_TASK')
    })
  }
}
```

## 取消任务

一旦任务被 fork，可以使用 `yield cancel(task)` 来中止任务执行。取消正在运行的任务。

取消 `bgSyncTask` 将会导致 Generator 跳进 finally 区块。可使用 `yield cancelled()` 来检查 Generator 是否已经被取消。

取消正在执行的任务，也将同时取消被阻塞在当前 Effect 中的任务。也就是说，取消可以不断的往下传播。

**自动取消**：并行的 Effect (`yield [...]`)。一旦其中任何一个任务被拒绝，并行的 Effect 将会被拒绝（受 `Promise.all` 启发）。在这种情况中，所有其他的 Effect 将被自动取消。

## 对 Sagas 进行排序

可以使用内置的 `yield*` 操作符来组合多个 Sagas，使得它们保持顺序。注意，使用 `yield*` 将导致该 Javascript 运行环境 *漫延* 至整个序列。 由此产生的迭代器将 yield 所有来自于嵌套迭代器里的值。一个更强大的替代方案是使用更通用的中间件组合机制。

## 组合 Sagas

使用 `yield*` 是提供组合 Sagas 的惯用方式，但这个方法也有一些局限性：

- `yield*` 只允许任务的顺序组合，所以一次你只能 `yield*` 一个 Generator。
- 你可能会想要单独测试嵌套的 Generator。这导致了一些重复的测试代码及重复执行的开销。 

yield 一个队列的嵌套的 Generators，将同时启动这些子 Generators（sub-generators），并等待它们完成。 然后以所有返回的结果恢复执行：

```ts
function* mainSaga(getState) {
  const results = yield [call(task1), call(task2), ...]
  yield put(showResults(results))
}
```

## actionChannel

比如有 4 个 action，我们想要一个一个处理，处理完第一个 action 之后再处理第二个，如此等等...

想要的是 *queue（队列）* 所有没被处理的 action，一旦我们处理完当前的 request，就可以从队列中获取下一个的信息。

`actionChannel` 可以处理这些东西。

```ts
import { take, actionChannel, call, ... } from 'redux-saga/effects'

function* watchRequests() {
  // 1- 为 REQUEST actions 创建一个 channel
  const requestChan = yield actionChannel('REQUEST')
  while (true) {
    // 2- take from the channel
    const {payload} = yield take(requestChan)
    // 3- 注意这里我们用了一个阻塞调用
    yield call(handleRequest, payload)
  }
}

function* handleRequest(payload) { ... }
```

`call(handleRequest)` 返回之前，Saga 将保持阻塞。但与此同时，如果其他的 `REQUEST` action 在 Saga 仍被阻塞的情况下被 dispatch， 它们将被 `requestChan` 队列在内部。当 Saga 从 `call(handleRequest)` 恢复并执行下一个 `yield take(requestChan)` 时，`take` 将 resolve 被队列的消息。

默认情况下，`actionChannel` 会无限制缓存所有传入的消息。如果你想要更多地控制缓存，你可以提供一个 Buffer 参数给 effect creator。 Redux-Saga 提供了一些常用的 buffers（none, dropping, sliding）

```ts
import { buffers } from 'redux-saga'
import { actionChannel } from 'redux-saga/effects'

function* watchRequests() {
  const requestChan = yield actionChannel('REQUEST', buffers.sliding(5))
  ...
}
```

## eventChannel

`eventChannel`（一个 factory function, 不是一个 Effect）为 Redux Store 以外的事件来源创建一个 Channel。

```ts
import { eventChannel, END } from 'redux-saga'

function countdown(secs) {
  return eventChannel(emitter => {
      const iv = setInterval(() => {
        secs -= 1
        if (secs > 0) {
          // 通过调用提供的 emitter，将事件来源传入的所有事件路由到 channel
          emitter(secs)
        } else {
          // 这里将导致 channel 关闭
          emitter(END)
        }
      }, 1000);
      // subscriber 必须回传一个 unsubscribe 函数
      return () => {
        clearInterval(iv)
      }
    }
  )
}
```

- 第一个参数是一个 *subscriber* 函数，subscriber 的职责是初始化外部的事件来源（上面使用 `setInterval`。
- 调用 `emitter(END)`，来通知 channel 消费者：channel 已经关闭了，意味着没有其他消息能够通过这个 channel 了。
- 如果我们想要在事件来源完成之前*提前离开*（比如 Saga 被取消了），你可以从来源调用 `chan.close()` 关闭 channel 并取消订阅。
- eventChannel 上的消息默认不会被缓存。为了给 channel 指定缓存策略（例如 `eventChannel(subscriber, buffer)`），你必须提供一个缓存给 eventChannel factory。

watch-and-fork 模式允许同时处理多个请求，并且不限制同时执行的任务的数量。

假设我们的要求是在**同一时间内最多执行三次任务**。当我们收到一个请求并且执行的任务少于三个时，我们会立即处理请求，否则我们将任务放入队列，并等待其中一个 *slots* 完成。

```ts
import { channel } from 'redux-saga'
import { take, fork, ... } from 'redux-saga/effects'

function* watchRequests() {
  // 创建一个 channel 来队列传入的请求
  const chan = yield call(channel)

  // 创建 3 个 worker 'threads'
  for (var i = 0; i < 3; i++) {
    yield fork(handleRequest, chan)
  }

  while (true) {
    const {payload} = yield take('REQUEST')
    yield put(chan, payload)
  }
}

function* handleRequest(chan) {
  while (true) {
    const payload = yield take(chan)
    // process the request
  }
}
```

`watchRequests` saga fork 了 3 个 worker saga。注意，创建的 channel 将提供给所有被 fork 的 saga。 `watchRequests` 将使用这个 channel 来 *dispatch* 工作到那三个 worker saga。每一个 `REQUEST` action，Saga 只简单地在 channel 上放入 payload。 payload 然后会被任何 *空闲* 的 worker 接收。否则它将被 channel 放入队列，直到一个 worker saga 空闲下来准备接收它。

这三个 worker 都执行一个典型的 while 循环。每次迭代时 worker 将 take 下一次的请求，或者阻塞直到有可用的消息。 注意，这个机制为 3 个 worker 提供了一个自动的负载均衡。快的 worker 不会被慢的 worker 拖慢。

