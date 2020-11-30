## 对比redux-thunk

**redux-thunk** 的使用与缺点

**thunk**是**redux**作者给出的中间件，实现极为简单，10多行代码：

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

工具函数 `delay`，这个函数返回一个延迟 1 秒再 resolve 的 Promise 我们将使用这个函数去 *block(阻塞)* Generator。

Sagas 被实现为 `Generator functions`，它会 yield 对象到 redux-saga middleware。 被 yield 的对象都是一类指令，指令可被 middleware 解释执行。当 middleware 取得一个 yield 后的 Promise，middleware 会暂停 Saga，直到 Promise 完成。

一旦 Promise 被 resolve，middleware 会恢复 Saga 接着执行，直到遇到下一个 yield。

`put` 就是我们称作 *Effect* 的一个例子。Effects 是一些简单 Javascript 对象，包含了要被 middleware 执行的指令。 当 middleware 拿到一个被 Saga yield 的 Effect，它会暂停 Saga，直到 Effect 执行完成，然后 Saga 会再次被恢复。

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

middleware 检查每个被 yield 的 Effect 的类型，然后决定如何实现哪个 Effect。如果 Effect 类型是 `PUT` 那 middleware 会 dispatch 一个 action 到 Store。 如果 Effect 类型是 `CALL` 那么它会调用给定的函数。

`takeEvery`：

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

# 声明式 Effects

在 `redux-saga` 的世界里，Sagas 都用 Generator 函数实现。我们从 Generator 里 yield 纯 JavaScript 对象以表达 Saga 逻辑。 我们称呼那些对象为 *Effect*。Effect 是一个简单的对象，这个对象包含了一些给 middleware 解释执行的信息。 你可以把 Effect 看作是**发送给 middleware 的指令以执行某些操作**（例如调用某些异步函数，发起一个 action 到 store）。

你可以使用 `redux-saga/effects` 包里提供的函数来创建 Effect。

### call

假设我们yield的value是一个promise，这样的话例如测试的时候我们就很难比较promise了。`call`**可以仅仅 yield 一条描述函数调用的信息**。 yield 后的对象作一个简单的 `deepEqual` 来检查它是否 yield 了我们期望的指令。

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

`put`这个函数用于创建 dispatch Effect。

## 使用

使用 `takeEvery('*')`（使用通配符 `*` 模式），我们就能捕获发起的所有类型的 action。

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

### 无阻塞调用

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

# 同时执行多个任务

```js
import { call } from 'redux-saga/effects'

// 正确写法, effects 将会同步执行
const [users, repos] = yield [
  call(fetch, '/users'),
  call(fetch, '/repos')
]
```

## race

`race` Effect 提供了一个方法，在多个 Effects 之间触发一个竞赛（race）。`race` 的另一个有用的功能是，它会自动取消那些失败的 Effects。

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

# 取消任务

一旦任务被 fork，可以使用 `yield cancel(task)` 来中止任务执行。取消正在运行的任务。

取消 `bgSyncTask` 将会导致 Generator 跳进 finally 区块。可使用 `yield cancelled()` 来检查 Generator 是否已经被取消。

取消正在执行的任务，也将同时取消被阻塞在当前 Effect 中的任务。也就是说，取消可以不断的往下传播。