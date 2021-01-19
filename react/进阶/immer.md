Immer 是一个不可变数据的 Javascript 库，让你更方便的处理不可变数据。

不可变数据概念来源于函数式编程。函数式编程中，对已初始化的“变量”是不可以更改的，**每次更改都要创建一个新的“变量”。**

当处理深层嵌套对象时，以 **immutable（不可变）的方式**（只要是每次更改返回新的变量都是不可变的方法）更新它们令人费解。比如可能写出这样的代码：

```ts
handleClick() {
  this.setState(state => ({
    objA: {
      ...state.objA,
      objB: {
        ...state.objA.objB,
        objC: {
          ...state.objA.objB.objC,
          stringA: 'string',
        }
      },
    },
  }));
};
```

## 为什么不使用深拷贝/深比较？

深拷贝会让所有组件都接收到新的数据，让 `shouldComponentUpdate` 失效。深比较每次都比较所有值，当数据层次很深且只有一个值变化时，这些比较是对性能的浪费。

### 对比immutable和immer

### immutable.js

- 自己维护了一套数据结构，Javascript 的数据类型和 `immutable.js` 的类型需要相互转换，对数据有侵入性。
- 库的体积比较大（63KB），不太适合包体积紧张的移动端。
- API 极其丰富，学习成本较高。
- 兼容性非常好，支持 IE 较老的版本。

### immer

- 使用 Proxy 实现，兼容性差。
- 体积很小（12KB），移动端友好。
- API 简洁，使用 Javascript 自己的数据类型，几乎没有理解成本。

## Immer 概览

Immer 基于 copy-on-write 机制。

Immer 的基本思想是，所有更改都应用于临时的 *draftState*，它是 *currentState* 的代理。一旦完成所有变更，Immer 将基于草稿状态的变更生成 *nextState*。这意味着可以通过简单地修改数据而与数据进行交互，同时保留不可变数据的所有优点。

```ts
// 第一种用法
produce(currentState, recipe: (draftState) => void | draftState, ?PatchListener): nextState
// 第二种用法
produce(recipe: (draftState) => void | draftState, ?PatchListener)(currentState): nextState
```



对 `draftState` 的修改都会反映到 `nextState` 上，并且不会修改 `currentState`。而 immer 使用的结构是共享的，`nextState` 在结构上与 `currentState` 共享未修改的部分。

```jsx
import produce from "immer"
/** 等价于 **/
import { produce } from 'immer'

const baseState = [
    {
        todo: "Learn typescript",
        done: true
    },
    {
        todo: "Try immer",
        done: false
    }
]

const nextState = produce(currentState, draftState => {
    draftState.push({todo: "Tweet about it"})
    draftState[1].done = true
})
```

#### 柯理化 produce

给 `produce` 第一个参数传递函数时将会进行柯理化。它会返回一个函数，该函数接收的参数会被传递给 `produce` 柯理化时接收的函数。 示例：

```js
// mapper will be of signature (state, index) => state
const mapper = produce((draft, index) => {
    draft.index = index
})

// example usage
console.dir([{}, {}, {}].map(mapper))
// [{index: 0}, {index: 1}, {index: 2}])
```

可以很好的利用这种机制简化 `reducer`：

```ts
import produce from "immer"

const byId = produce((draft, action) => {
    switch (action.type) {
        case RECEIVE_PRODUCTS:
            action.products.forEach(product => {
                draft[product.id] = product
            })
            return
    }
})
```

#### recipe 的返回值

recipe：用来操作 draftState 的函数

通常，`recipe` 不需要显示的返回任何东西，`draftState` 会自动作为返回值反映到 `nextState`。你也可以返回任意数据作为 `nextState`，前提是 `draftState` 没有被修改。

在 Javascript 中，不返回任何值和返回 `undefined` 是一样的，函数的返回值都是 `undefined` 。如果你希望 immer 知道你确实想要返回 `undefined` 怎么办？ 使用 immer 内置的变量 `nothing`。

recipe 函数内部的`this`指向 draftState ，也就是修改`this`与修改 recipe 的参数 draftState ，效果是一样的。**注意：此处的 recipe 函数不能是箭头函数，如果是箭头函数，`this`就无法指向 draftState 了**

```ts
import produce, {nothing} from "immer"

const state = {
    hello: "world"
}

produce(state, draft => {})
produce(state, draft => undefined)
// Both return the original state: { hello: "world"}

produce(state, draft => nothing)
// Produces a new state, 'undefined'
```

#### Patch

可以方便进行详细的代码调试和跟踪，可以知道 recipe 内的做的每次修改，还可以实现时间旅行。

 patch 对象是这样的:

```ts
interface Patch {
  op: "replace" | "remove" | "add" // 一次更改的动作类型
  path: (string | number)[] // 此属性指从树根到被更改树杈的路径
  value?: any // op为 replace、add 时，才有此属性，表示新的赋值
}
```

语法：

```ts
produce(
  currentState, 
  recipe,
  // 通过 patchListener 函数，暴露正向和反向的补丁数组
  patchListener: (patches: Patch[], inversePatches: Patch[]) => void
)

applyPatches(currentState, changes: (patches | inversePatches)[]): nextState

import produce, { applyPatches } from "immer"

let state = {
  x: 1
}

let replaces = [];
let inverseReplaces = [];

state = produce(
  state,
  draft => {
    draft.x = 2;
    draft.y = 2;
  },
  (patches, inversePatches) => {
    replaces = patches.filter(patch => patch.op === 'replace');
    inverseReplaces = inversePatches.filter(patch => patch.op === 'replace');
  }
)

state = produce(state, draft => {
  draft.x = 3;
})
console.log('state1', state); // { x: 3, y: 2 }

state = applyPatches(state, replaces);
console.log('state2', state); // { x: 2, y: 2 }
```

#### Auto freezing（自动冻结）

Immer 会自动冻结使用 `produce` 修改过的状态树，这样可以防止在变更函数外部修改状态树。这个特性会带来性能影响，所以需要在生产环境中关闭。可以使用 `setAutoFreeze(true / false)` 打开或者关闭。在开发环境中建议打开，可以避免不可预测的状态树更改。

#### 在 setState 中使用 immer

使用 immer 进行深层状态更新很简单：

```ts
this.setState(
  produce(draft => {
    draft.user.age += 1
  })
)

// ====================

this.setState(prevState => ({
  user: {
    ...prevState.user,
    age: prevState.user.age + 1
  }
}))
```

## immer和use-immer

Immer 同时提供了一个 React hook 库 `use-immer` 用于以 hook 方式使用 immer。

#### useImmer

`useImmer` 和 `useState` 非常像。它接收一个初始状态，返回一个数组。数组第一个值为当前状态，第二个值为状态更新函数。状态更新函数和 `produce` 中的 `recipe` 一样运作。

```jsx
import React from "react";
import { useImmer } from "use-immer";


function App() {
  const [person, updatePerson] = useImmer({
    name: "Michel",
    age: 33
  });

  function updateName(name) {
    updatePerson(draft => {
      draft.name = name;
    });
  }

  function becomeOlder() {
    updatePerson(draft => {
      draft.age++;
    });
  }

  return (
    <div className="App">
      <h1>
        Hello {person.name} ({person.age})
      </h1>
      <input
        onChange={e => {
          updateName(e.target.value);
        }}
        value={person.name}
      />
      <br />
      <button onClick={becomeOlder}>Older</button>
    </div>
  );
}

```

#### useImmerReducer

对 `useReducer` 的封装：

```jsx
import React from "react";
import { useImmerReducer } from "use-immer";

const initialState = { count: 0 };

function reducer(draft, action) {
  switch (action.type) {
    case "reset":
      return initialState;
    case "increment":
      return void draft.count++;
    case "decrement":
      return void draft.count--;
  }
}

function Counter() {
  const [state, dispatch] = useImmerReducer(reducer, initialState);
  return (
    <>
      Count: {state.count}
      <button onClick={() => dispatch({ type: "reset" })}>Reset</button>
      <button onClick={() => dispatch({ type: "increment" })}>+</button>
      <button onClick={() => dispatch({ type: "decrement" })}>-</button>
    </>
  );
}
```



> immer内部会使用`object.freeze`，无法扩展增加property。