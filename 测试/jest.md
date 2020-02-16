# jest

优势： 速度快、API简单、配置简单

前置： Jest 不支持 ES Module 语法，需要安装 babel

```
yarn add @babel/core @babel/preset-env
```

jest 在运行前会检查是否安装 babel，如果安装了会去取 .babelrc 文件，结合 babel 将代码进行转化，运行转化后的代码。

```json
{
  "presets": [
    [
      "@babel/preset-env", {
        "targets": {
          "node": "current"
        }
      }
    ]
  ]
}
```



## Jest的配置文件

自动生成jest.config.js：

```
npx jest --init
```

配置解析：

**testMatch**：匹配测试用例的文件

```json
testMatch: [
  "**/__tests__/**/*.[jt]s?(x)",
  "**/?(*.)+(spec|test).[tj]s?(x)"
]
```

**transform**：用 `vue-jest` 处理 `*.vue` 文件，用`babel-jest` 处理 `*.js` 文件

```json
transform: {
  '^.+\\.js$': 'babel-jest',
  '.*\\.(vue)$': 'vue-jest',
}
```

**moduleNameMapper** ：支持源代码中相同的 `@` -> `src` 别名。

**coverageDirectory** ：覆盖率报告的目录，测试报告所存放的位置

**collectCoverageFrom**：测试报告想要覆盖那些文件，目录，前面加！是避开这些文件



### 启动测试

**--watchAll**: 当发现测试文件变动，重新跑一遍所有测试文件。

**--watch**: 只测试差异文件(和git中commit的文件比较)

```
yarn jest --watchAll
yarn jest --watch
```

Jest会自动找到项目中所有使用`.spec.js`或`.test.js`文件命名的测试文件并执行，通常我们在编写测试文件时遵循的命名规范：**测试文件的文件名 = 被测试模块名 + `.test.js`**，例如被测试模块为`functions.js`，那么对应的测试文件命名为`functions.test.js`。

- **test** 函数用来运行测试。它包含三个参数：测试的名称，包含期望值的函数和超时（以毫秒为单位）。超时默认为 5 秒，并指定如果测试花费的时间太长，则中止测试之前要等待多长时间。

- **expect** 函数用于测试值。

### 断言库

- assert（TDD）：`assert(name === 'xxx')`
- expect.js（BDD）：expect() 风格的断言，`expect(foo).to.be('aa')`
- should.js（BDD）：`foo.should.be('aa')`
- chai（BDD/TDD）：集成了expect，should和chai风格的断言。

## 匹配器

#### 常见匹配器

- toBe
- toEqual：判断**对象**内容是否相等
- toMatchObject：`expect(obj).toMatchObject(o)`，期望 o 中包含 obj
- toBeNull
- toBeUndefined
- toBeDefinded
- toBeTruthy
- toBeFalsy
- not：用于否定，比如 `.not.toBeTruthy()`

#### Number 相关

- toBeGreaterThan（大于） / toBeGreaterThanOrEqual（大于等于）
- toBeCloseTo：用于比较浮点数，近似相等时断言成立
- toBeLessThan / toBeLessThanOrEqual

#### String 相关

- toMatch：参数可以传字符串或正则

#### Array Set 相关

- toContain

#### 异常匹配器

- toThrow：`expect(throwError).toThrow('error')`，判断throw函数可以抛出异常，异常信息为 "error"。也可以写正则

当我们想**忽略掉单个文件中的其他测试用例，只针对一个测试用例**做调试的时候，可以加上 `.only`



## 对于异步代码测试

时机很重要，**必须保证我们的测试用例在异步代码走完之后才结束**。有以下几种办法：

1. done，控制测试用例结束的时机
2. 如果函数执行的返回值是 Promise，将这个 Promise return 出去
3. async + await

```javascript
import {getData1, getData2, get404} from './fetchData/fetchData'

it('getData1 方法1', (done) => {
  getData1().then(res => {
    expect(res.data).toEqual({
      success: true
    })
    done()  // 如果不加 done，还没执行到 .then 方法，测试用例已经结束了
  })
})

it('getData1 方法2', () => {
  return getData1().then(res => {
    expect(res.data).toEqual({
      success: true
    })
  })
})

it('getData2 方法2', (done) => {
  getData2((res) => {
    expect(res.data).toEqual({
      success: true
    })
    done()
  })
})

it('getData1 方法3', async () => {
  const res = await getData1()
  expect(res.data).toEqual({
    success: true
  })
})

/*********** 重点关注 ***********/
it('get404', (done) => {
  expect.assertions(1) // 表示下面一定会执行一个expect，使得下面即使不返回404也会执行expect
  get404().catch(r => {
    expect(r.toString()).toMatch('404')
    done()
  })
})
```



## 钩子函数

- beforeAll：所有用例开始执行前
- beforeEach：每个用例执行前
- afterEach
- afterAll
- describe

如果测试前后要做一些处理，**尽可能写在这些钩子函数中，他能保证一定的执行顺序。**

```javascript
beforeAll(()=>{
  console.log('before all')
});
afterAll(()=>{
  console.log('after all')
});
beforeEach(() => {
  console.log('each')
  counter = new Counter();
});
afterEach(()=>{
  console.log('after');
});
```



describe 可以用来进行**分组测试**，为了让我们的测试输出结果更好看，更有层次。 同时，在每个 describe 中都有上面 4 个钩子函数的存在。

> 一般describe里面用 **it** 函数而不是 **test** 函数。它是常用的别名。运行 `it === test` 会返回 *true*。



## MOCK

- Mock 函数允许你测试代码之间的连接

在项目中，一个模块的方法内常常会去调用另外一个模块的方法。在单元测试中，我们可能并不需要关心内部调用的方法的执行过程和结果，只想知道它是否被正确调用即可，甚至会指定该函数的返回值。此时，使用Mock函数是十分有必要。



### jest.fn()

**创建一个Mock 函数**最简单的方法就是调用`jest.fn() `方法，如果没有定义函数内部的实现，jest.fn()会返回undefined作为返回值。函数的调用捕获指的是这个函数有没有被调用，调用的参数是什么，返回值是什么，通常用于测试回调函数，mock 真实的回调函数。

**例子1**，假设我们要测试函数 `forEach` 的内部实现，这个函数为传入的数组中的每个元素调用一次回调函数。

```javascript
function forEach(items, callback) {
  for (let index = 0; index < items.length; index++) {
    callback(items[index]);
  }
}
```

为了测试此函数，我们可以使用一个 mock 函数，然后检查 mock 函数的状态来确保回调函数如期调用。

```javascript
const mockCallback = jest.fn(x => 42 + x);
forEach([0, 1], mockCallback);

// 此 mock 函数被调用了两次
expect(mockCallback.mock.calls.length).toBe(2);

// 第一次调用函数时的第一个参数是 0
expect(mockCallback.mock.calls[0][0]).toBe(0);

// 第二次调用函数时的第一个参数是 1
expect(mockCallback.mock.calls[1][0]).toBe(1);

// 第一次函数调用的返回值是 42
expect(mockCallback.mock.results[0].value).toBe(42);
```

**例子2**

```javascript
// functions.test.js

test('测试jest.fn()调用', () => {
  let mockFn = jest.fn();
  let result = mockFn(1, 2, 3);

  // 断言mockFn的执行后返回undefined
  expect(result).toBeUndefined();
  // 断言mockFn被调用
  expect(mockFn).toBeCalled();
  // 断言mockFn被调用了一次
  expect(mockFn).toBeCalledTimes(1);
  // 断言mockFn传入的参数为1, 2, 3
  expect(mockFn).toHaveBeenCalledWith(1, 2, 3);
})
```



### .mock 属性

所有的 mock 函数都有这个特殊的 `.mock`属性，它保存了关于此函数如何被调用、调用时的返回值的信息。 `.mock` 属性还追踪每次调用时 `this`的值。

### mock 的返回值

Mock 函数也可以用于在测试期间将测试值注入代码︰

```javascript
const myMock = jest.fn();
console.log(myMock());
// > undefined

myMock
  .mockReturnValueOnce(10)
  .mockReturnValueOnce('x')
  .mockReturnValue(true);

console.log(myMock(), myMock(), myMock(), myMock());
// > 10, 'x', true, true
```

### 模拟模块 (jest.mock)

 jest.mock 会自动根据被 mock 的模块组织 mock 对象，mock 对象将具有原模块的字段和方法。可以直接在`__mocks__`目录下创建同名文件，将整个文件mock掉，例如当前文件叫`api.js`

```javascript
import axios from "axios";

export const fetchUser = ()=>{
    return axios.get('/user')
}
export const fetchList = ()=>{
    return axios.get('/list')
}
```

创建`__mocks__/api.js`

```javascript
export const fetchUser = ()=>{
    return new Promise((resolve,reject)=> resolve({user:'webyouxuan'}))
}
export const fetchList = ()=>{
    return new Promise((resolve,reject)=>resolve(['香蕉','苹果']))
}
```

开始测试

```javascript
jest.mock('./api.js'); // 使用__mocks__ 下的api.js
import {fetchList,fetchUser} from './api'; // 引入mock的方法
it('fetchUser测试',async ()=>{
    let data = await fetchUser();
    expect(data).toEqual({user:'webyouxuan'})
})

it('fetchList测试',async ()=>{
    let data = await fetchList();
    expect(data).toEqual(['香蕉','苹果'])
})
```

需要注意的是，如果mock的`api.js`方法不全，在测试时可能还需要引入原文件的方法，那么需要使用`jest.requireActual('./api.js')` 引入真实的文件。

其实只是想将`真正的请求`mock掉而已，我们可以直接`mock axios`方法

在`__mocks__`下创建 `axios.js`，重写get方法

```javascript
export default {
    get(url){
        return new Promise((resolve,reject)=>{
            if(url === '/user'){
                resolve({user:'webyouxuan'});
            }else if(url === '/list'){
                resolve(['香蕉','苹果']);
            }
        })
    }
}
```

当方法中调用`axios`时默认会找`__mocks__/axios.js`

```javascript
jest.mock('axios'); // mock axios方法
import {fetchList,fetchUser} from './api';
it('fetchUser测试',async ()=>{
    let data = await fetchUser();
    expect(data).toEqual({user:'webyouxuan'})
})

it('fetchList测试',async ()=>{
    let data = await fetchList();
    expect(data).toEqual(['香蕉','苹果'])
})
```

## jest.spyOn()

`jest.spyOn()`方法同样创建一个mock函数，但是该mock函数不仅能够捕获函数的调用情况，还可以正常的执行被spy的函数。实际上，`jest.spyOn()`是`jest.fn()`的语法糖，它创建了一个和被spy的函数具有相同内部代码的mock函数。

## mock timer

假如我们想测试一个定时器内的callback，那么我们需要设置一个相同timeout的定时器在回调里执行断言。这样很不友好，我们可以mock 定时器。

```javascript
import {timer} from './timer';
jest.useFakeTimers(); // 启用假定时器
it('callback 是否会执行',()=>{
    let fn = jest.fn();
    timer(fn);
    // 运行所有定时器，等待所有的定时器都被执行，但是如果是定时结束启动另一个定时器的话这样就不行了
    // jest.runAllTimers();
    // 所有计时器都按x毫秒提前。
    // jest.advanceTimersByTime(2500);

    // 只运行当前等待定时器
    jest.runOnlyPendingTimers();
    expect(fn).toHaveBeenCalled();
    // 清除所有定时器
    // jest.clearAllTimers()
});
```



## 覆盖率

在运行时，可以直接增加 `--coverage`参数。我们当前项目下就会产生`coverage`报表来查看当前项目的覆盖率，命令行下也会有报表的提示。

- Stmts（statement）表示语句的覆盖率
- Branch 表示分支的覆盖率(if、else)
- Funcs（function）函数的覆盖率
- Lines 代码行数的覆盖率

package.json

```json
"jest": {
  "collectCoverage": true, // 每次测试的时候，都要做代码覆盖率检查
  "coverageReporters": ["html"] // 如何展示覆盖率报告 - HTML页面
}
```



# vue

安装 `Jest` 和 `Vue Test Utils`

```
npm install --save-dev jest @vue/test-utils
```

安装 `babel-jest` 、 `vue-jest` 和 `7.0.0-bridge.0` 版本的 `babel-core`

```
npm install --save-dev babel-jest vue-jest babel-core@7.0.0-bridge.0
```

安装 `jest-serializer-vue`

```
npm install --save-dev jest-serializer-vue
```

> 默认情况下，`babel-jest` 会在其安装完毕后自动进行配置。尽管如此，因为我们已经显性的添加了对 `*.vue` 文件的转换，所以现在我们也需要显性的配置 `babel-jest`。

我们假设 webpack 使用了 `babel-preset-env`，这时默认的 Babel 配置会关闭 ES modules 的转译，因为 webpack 已经可以处理 ES modules 了。然而，我们还是需要为我们的测试而开启它，因为 Jest 的测试用例会直接运行在 Node 上。

同样的，我们可以告诉 `babel-preset-env` 面向我们使用的 Node 版本。这样做会跳过转译不必要的特性使得测试启动更快。为了仅在测试时应用这些选项，可以在.babelrc文件里把它们放到一个独立的 `env.test` 配置项中 (这会被 `babel-jest` 自动获取)。

```json
{
  "presets": [["env", { "modules": false }]],
  "env": {
    "test": {
      "presets": [["env", { "targets": { "node": "current" } }]]
    }
  }
}
```

Jest 推荐你在被测试代码的所在目录下创建一个 `__tests__` 目录，但你也可以为你的测试文件随意设计自己习惯的文件结构。不过要当心 Jest 会为快照测试在临近测试文件的地方创建一个 `__snapshots__` 目录。

`Jest` 的配置可以在 `package.json` 里配置；也可以新建一个文件 `jest.config.js`:

```javascript
module.exports = {
    moduleFileExtensions: [
        'js',
        'vue'
    ],
    transform: {
        '^.+\\.vue$': '<rootDir>/node_modules/vue-jest',
        '^.+\\.js$': '<rootDir>/node_modules/babel-jest'
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    snapshotSerializers: [
        'jest-serializer-vue'
    ],
    testMatch: ['**/__tests__/**/*.spec.js'],
    transformIgnorePatterns: ['<rootDir>/node_modules/']
}
 
```

- `moduleFileExtensions` 告诉 `Jest` 需要匹配的文件后缀
- `transform` 匹配到 `.vue` 文件的时候用 `vue-jest` 处理， 匹配到 `.js` 文件的时候用 `babel-jest` 处理
- `moduleNameMapper` 处理 `webpack` 的别名，比如：将 `@` 表示 `/src` 目录
- `snapshotSerializers` 将保存的快照测试结果进行序列化，使得其更美观
- `testMatch` 匹配哪些文件进行测试
- `transformIgnorePatterns` 不进行匹配的目录

### 编写测试文件

在 `__tests__/unit/` 目录下新建文件 `todolist.spec.js`，我们约定测试某个 `vue` 文件，那么它的单元测试文件习惯命名成 `*.spec.js` 或 `*.test.js`。

```javascript
import { shallowMount } from '@vue/test-utils'
import ToDoList from '@/components/ToDoList'

describe('test ToDoList', () => {
    it('输入框初始值为空字符串', () => {
        const wrapper = shallowMount(ToDoList, {
            propsData: { text: 'test' }
        })
        expect(wrapper.vm.toDoText).toBe('')
    })
})
```

上面这个测试文件简要说明：

- `shallowMount` 将会创建一个包含被挂载和渲染的 `Vue` 组件的 `Wrapper`，只存根当前组件，不包含子组件。
- `describe(name, fn)` 这边是定义一个测试套件，`test ToDoList` 是测试套件的名字，`fn` 是具体的可执行的函数
- `it(name, fn)` 是一个测试用例，`输入框初始值为空字符串` 是测试用例的名字，`fn` 是具体的可执行函数；一个测试套件里可以保护多个测试用例。
- `expect` 是 `Jest` 内置的断言风格，业界还存在别的断言风格比如 `Should`、`Assert` 等。

`wrapper.vm` 是一个 `Vue` 实例，只有 `Vue` 组件的包裹器才有 `vm` 这个属性；通过 `wrapper.vm` 可以访问所有 `Vue` 实例的属性和方法。比如：`wrapper.vm.$data`、`wrapper.vm.$nextTick()`。

**trigger**：在该 `Wrapper` DOM 节点上触发一个事件，`trigger` 带有一个可选的 `options` 对象。`options` 对象内的属性会被添加到事件上：

```javascript
import { mount } from '@vue/test-utils'
import sinon from 'sinon'
import Foo from './Foo'

test('trigger demo', async () => {
  const clickHandler = sinon.stub()
  // 通过 mount 生成了一个包裹器，包括了一个挂载组件或 vnode，以及测试该组件或 vnode 的方法
  const wrapper = mount(Foo, {
    propsData: { clickHandler },
    slots: {
       title: '<div></div>'
    }
  })
  // .vm 可以获取当前实例对象，相当于拿到了 vue组件里的 this 对象
  // find()可以匹配各种类型的选择器，类似于选中 DOM, text() 就是获取其中的内容
  // classes() 方法，返回 class 名称的数组。或在提供 class 名的时候返回一个布尔值

  wrapper.trigger('click')

  wrapper.trigger('click', {
    button: 0
  })

  wrapper.trigger('click', {
    ctrlKey: true // 用于测试 @click.ctrl 处理函数
  })

  await wrapper.vm.$nextTick() // Wait until trigger events have been handled

  expect(clickHandler.called).toBe(true)
})
```

## API

### find

返回匹配选择器的第一个 DOM 节点或 Vue 组件的 `Wrapper`。获取多个使用 findAll

### contains(String |  Component)

判断 `Wrapper` 是否包含了一个匹配选择器的元素或组件。

### emitted

返回一个包含由 `Wrapper` `vm` 触发的自定义事件的对象。