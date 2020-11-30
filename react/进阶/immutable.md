如果数据变更，节点类型不相同的时候，React 的做法非常简单粗暴，直接将原 VDOM 树上该节点以及该节点下所有的后代节点 全部删除，然后替换为新 VDOM 树上同一位置的节点，当然这个节点的后代节点也全都跟着过来了。所以react中提供了`React.memo`和`React.pureComponent`，这样就可以浅比较数据了。但是浅比较会导致页面不更新，所以这时候就需要用到不可变对象每次返回都不同来进行更新了。

意味着当你需要考虑性能并且想知道数据何时发生了变更，你可以使用三个等号来做严格的全等检查以及证明数据的确发生了变更。

## Imutable

不可变对象，每次操作返回的都是新的引用，方法有深拷贝，immutable.js，immer.js等。

## immer

它的核心思想就是利用Proxy代理，几乎以最小的成本实现了JS的不可变数据结构。

```js
import produce from 'immer';

const array = [{value: 0}, {value: 1}, {value: 2}];
const arr = produce(array, draft => {
  draft[0].value = 10;
});

console.log(arr === array);
//false
```

注意：如果你什么也不返回或者并没有操作数据的话，并不会返回一个新的对象！

```js
const array = [{value: 0}, {value: 1}, {value: 2}];
const arr = produce(array, draft => {});

console.log(array === arr);
// true
```

1. produce的第一个参数可以省略。效果相同复用性增加了。

   ```js
   const array = [{value: 0}, {value: 1}, {value: 2}];
   const producer = produce((draft) => {
     draft[0].value = 10;
   });
   const arr = producer(array);
   
   console.log(array === arr);
   // false
   ```

2. 在没有返回值时数据是根据函数体内对draft参数的操作生成的。有返回值的话返回值就会被当做新数据来返回。

   ```js
   const array = [{value: 0}, {value: 1}, {value: 2}];
   const producer = (state, fn) => produce(fn)(state);
   const arr = producer(array, draft => [666, ...draft]);
   
   console.log(array, arr);
   // [{…}, {…}, {…}]
   // [666, {…}, {…}, {…}]
   ```

immer 的做法就是维护一份 state 在内部，劫持所有操作，内部来判断是否有变化从而最终决定如何返回。

```js
class  Store  {

  constructor(state) {

    this.modified = false

    this.source = state

    this.copy = null

  }

  get(key) {

    if (!this.modified) return  this.source[key]

    return  this.copy[key]

  }

  set(key, value) {

    if (!this.modified) this.modifing()

    return  this.copy[key] = value

  }

  modifing() {

    if (this.modified) return

    this.modified = true

    // 这里使用原生的 API 实现一层 immutable，

    // 数组使用 slice 则会创建一个新数组。对象则使用解构

    this.copy = Array.isArray(this.source)

      ? this.source.slice()

      : { ...this.source }

  }

}
```

```js
const PROXY_FLAG = '@@SYMBOL_PROXY_FLAG'

const handler = {

  get(target, key) {

    // 如果遇到了这个 flag 我们直接返回我们操作的 target

    if (key === PROXY_FLAG) return target

    return target.get(key)

  },

 set(target, key, value) {

    return target.set(key, value)

  },

}
```

**加一个 flag 的目的就在于将来从 proxy 对象中获取 store 实例更加方便。**

```js
function  produce(state, producer) {

  const store = new Store(state)

  const proxy = new  Proxy(store, handler)

  // 执行我们传入的 producer 函数，我们实际操作的都是 proxy 实例，所有有副作用的操作都会在 proxy 内部进行判断，是否最终要对 store 进行改动

  producer(proxy)

  // 处理完成之后，通过 flag 拿到 store 实例

  const newState = proxy[PROXY_FLAG]
 
  if (newState.modified) return newState.copy

  return newState.source

}
```



## 使用use-immer来替代useState

由于React Hooks的异军突起，导致现在很多组件都使用函数来进行编写，数据就直接写在useState中，有了useImmer，你以后就可以用它来代替useState啦！

