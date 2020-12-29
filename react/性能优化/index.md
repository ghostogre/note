## 优化babel配置，webpack配置为项

简单写了一个`webpack，plugin` `ConsolePlugin` ,记录了`webpack`在一次`compilation`所用的时间。

```ts
const chalk = require('chalk') /* console 颜色 */
var slog = require('single-line-log'); /* 单行打印 console */

class ConsolePlugin {
    constructor(options){
       this.options = options
    }
    apply(compiler){
        /**
         * Monitor file change 记录当前改动文件
         */
        compiler.hooks.watchRun.tap('ConsolePlugin', (watching) => {
            const changeFiles = watching.watchFileSystem.watcher.mtimes
            for(let file in changeFiles){
                console.log(chalk.green('当前改动文件：'+ file))
            }
        })
        /**
         *  before a new compilation is created. 开始 compilation 编译 。
         */
        compiler.hooks.compile.tap('ConsolePlugin',()=>{
            this.beginCompile()
        })
        /**
         * Executed when the compilation has completed. 一次 compilation 完成。
         */
        compiler.hooks.done.tap('ConsolePlugin',()=>{
            this.timer && clearInterval( this.timer )
            const endTime =  new Date().getTime()
            const time = (endTime - this.starTime) / 1000
            console.log( chalk.yellow(' 编译完成') )
            console.log( chalk.yellow('编译用时：' + time + '秒' ) )
        })
    }
    beginCompile(){
       const lineSlog = slog.stdout
       let text  = '开始编译：'
       /* 记录开始时间 */
       this.starTime =  new Date().getTime()
       this.timer = setInterval(()=>{
          text +=  '█'
          lineSlog( chalk.green(text))
       },50)
    }
}

```

#### ① include 或 exclude 限制 loader 范围。

```js
{
    test: /\.jsx?$/,
    exclude: /node_modules/,
    include: path.resolve(__dirname, '../src'),
    use:['happypack/loader?id=babel']
    // loader: 'babel-loader'
}
```

#### ② happypack多进程编译

除了上述改动之外，在plugin中

```js
/* 多线程编译 */
new HappyPack({
    id:'babel',
    loaders:['babel-loader?cacheDirectory=true']
})
```

> Happypack 的作用就是将文件解析任务分解成多个子进程并发执行。子进程处理完任务后再将结果发送给主进程。所以可以大大提升 Webpack 的项目构件速度

#### ③ 缓存babel编译过的文件

```js
loaders: ['babel-loader?cacheDirectory=true']
```

#### ④ tree Shaking 删除冗余代码

#### ⑤ 按需加载，按需引入。

### 关于类似antd UI库的瘦身思考

我们在做`react`项目的时候，会用到`antd`之类的ui库，值得思考的一件事是，如果我们只是用到了`antd`中的个别组件，比如`<Button />  `,就要把整个样式库引进来，打包就会发现，体积因为引入了整个样式大了很多。我们可以通过`.babelrc`实现**按需引入**。

## 路由懒加载，路由监听器

> 看完`dva`源码中的 `dynamic`异步加载组件

针对大型项目有很多页面，在配置路由的时候，如果没有对路由进行处理，一次性会加载大量路由，这对页面初始化很不友好，会延长页面初始化时间，所以我们想这用`asyncRouter`来按需加载页面路由。

### asyncRouter懒加载路由，并实现路由监听

这种`react`路由懒加载是基于`import` 函数路由懒加载， 众所周知 ，`import` 执行会返回一个`Promise`作为异步加载的手段。我们可以利用这点来实现`react`异步加载路由。

```jsx
const routerObserveQueue = [] /* 存放路由卫视钩子 */
/* 懒加载路由卫士钩子 */
export const RouterHooks = {
  /* 路由组件加载之前 */
  beforeRouterComponentLoad: function(callback) {
    routerObserveQueue.push({
      type: 'before',
      callback
    })
  },
  /* 路由组件加载之后 */
  afterRouterComponentDidLoaded(callback) {
    routerObserveQueue.push({
      type: 'after',
      callback
    })
  }
}
/* 路由懒加载HOC */
export default function AsyncRouter(loadRouter) {
  return class Content extends React.Component {
    constructor(props) {
      super(props)
      /* 触发每个路由加载之前钩子函数 */
      this.dispatchRouterQueue('before')
    }
    state = {Component: null}
    dispatchRouterQueue(type) {
      const {history} = this.props
      routerObserveQueue.forEach(item => {
        if (item.type === type) item.callback(history)
      })
    }
    componentDidMount() {
      if (this.state.Component) return
      loadRouter()
        .then(module => module.default)
        .then(Component => this.setState({Component},
          () => {
            /* 触发每个路由加载之后钩子函数 */
            this.dispatchRouterQueue('after')
          }))
    }
    render() {
      const {Component} = this.state
      return Component ? <Component {
      ...this.props
      }
      /> : null
    }
  }
}

```

`asyncRouter`实际就是一个高级组件,将`()=>import()`作为加载函数传进来，然后当外部`Route`加载当前组件的时候，在`componentDidMount`生命周期函数，加载真实的组件，并渲染组件，我们还可以写针对路由懒加载状态定制属于自己的路由监听器`beforeRouterComponentLoad`和`afterRouterComponentDidLoaded`。

```tsx
import AsyncRouter ,{ RouterHooks }  from './asyncRouter.js'
const { beforeRouterComponentLoad} = RouterHooks
const Index = AsyncRouter(()=>import('../src/page/home/index'))
const List = AsyncRouter(()=>import('../src/page/list'))
const Detail = AsyncRouter(()=>import('../src/page/detail'))
const index = () => {
  useEffect(()=>{
    /* 增加监听函数 */  
    beforeRouterComponentLoad((history)=>{
      console.log('当前激活的路由是',history.location.pathname)
    })
  },[])
  return <div >
    <div >
      <Router  >
      <Meuns/>
      <Switch>
          <Route path={'/index'} component={Index} ></Route>
          <Route path={'/list'} component={List} ></Route>
          <Route path={'/detail'} component={ Detail } ></Route>
          <Redirect from='/*' to='/index' />
       </Switch>
      </Router>
    </div>
  </div>
}

```

## 受控性组件颗粒化 ，独立请求服务渲染单元

### 颗粒化控制可控性组件

可控性组件和非可控性的区别就是`dom`元素值是否与受到`react`数据状态`state`控制。一旦由`react的state`控制数据状态，比如`input`输入框的值，就会造成这样一个场景，为了使`input`值实时变化，会不断`setState`，就会不断触发`render`函数，如果父组件内容简单还好，如果父组件比较复杂，会造成牵一发动全身，如果其他的子组件中`componentWillReceiveProps`这种带有副作用的钩子，那么引发的蝴蝶效应不敢想象。

```tsx
class index extends React.Component<any,any>{
    constructor(props){
        super(props)
        this.state={
            inputValue:''
        }
    }
    handerChange=(e)=> this.setState({ inputValue:e.target.value  })
    render(){
        const { inputValue } = this.state
        return <div>
            { /*  我们增加三个子组件 */ }
            <ComA />
            <ComB />
            <ComC />
            <div className="box" >
                <Input  value={inputValue}  onChange={ (e)=> this.handerChange(e) } />
            </div>
            {/* 我们首先来一个列表循环 */}
            {
                new Array(10).fill(0).map((item,index)=>{
                    console.log('列表循环了' )
                    return <div key={index} >{item}</div>
                })
            }
            {
              /* 这里可能是更复杂的结构 */
              /* ------------------ */
            }
        </div>
    }
}

```

上述代码里，Input输入也会造成兄弟组件更新，考虑将这种受控性组件颗粒化，让自己更新 -> 渲染过程由自身调度。

### 建立独立的请求渲染单元

建立独立的请求渲染单元，直接理解就是，如果我们把页面分为请求数据展示部分(通过调用后端接口，获取数据)，和基础部分(不需要请求数据，已经直接写好的)，对于一些逻辑交互不是很复杂的数据展示部分，推荐用一种独立组件，独立请求数据，独立控制渲染的模式。

假设页面有三个展示区域分别，做了三次请求，触发了三次`setState`,渲染三次页面，即使用`Promise.all`等方法，但是也不保证接下来交互中，会有部分展示区重新拉取数据的可能。一旦有一个区域重新拉取数据，另外两个区域也会说、受到牵连，这种效应是不可避免的，即便react有很好的`diff`算法去调协相同的节点，但是比如长列表等情况，循环在所难免。

把每一部分抽取出来，形成独立的渲染单元，每个组件都独立数据请求到独立渲染。这样一来，彼此的数据更新都不会相互影响。

#### 总结

拆分需要单独调用后端接口的细小组件，建立独立的数据请求和渲染，这种依赖数据更新 -> 视图渲染的组件，能从整个体系中抽离出来 ，好处我总结有以下几个方面。

**1** 可以避免父组件的冗余渲染 ，`react`的数据驱动，依赖于 `state` 和 `props` 的改变，改变`state `必然会对组件 `render` 函数调用，如果父组件中的子组件过于复杂，一个自组件的 `state` 改变，就会牵一发动全身，必然影响性能，所以如果把很多依赖请求的组件抽离出来，可以直接减少渲染次数。

**2**  可以优化组件自身性能，无论从`class`声明的有状态组件还是`fun`声明的无状态，都有一套自身优化机制，无论是用`shouldupdate` 还是用 `hooks`中  `useMemo` `useCallback` ，都可以根据自身情况，定制符合场景的渲条 件，使得依赖数据请求组件形成自己一个小的，适合自身的渲染环境。

**3** 能够和`redux` ,以及`redux`衍生出来 `redux-action` , `dva`,更加契合的工作，用 `connect` 包裹的组件，就能通过制定好的契约，根据所需求的数据更新，而更新自身，而把这种模式用在这种小的，需要数据驱动的组件上，就会起到物尽其用的效果。

## shouldComponentUpdate ，PureComponent 和 React.memo ，immetable.js 助力性能调优

### PureComponent 和 React.memo

`React.PureComponent  `与 `React.Component` 用法差不多 ,但` React.PureComponent` 通过props和state的浅对比来实现 `shouldComponentUpate()`。如果对象包含复杂的数据结构(比如对象和数组)，他会浅比较，如果深层次的改变，是无法作出判断的，`React.PureComponent` 认为没有变化，而没有渲染试图。

`react.memo` 和 `PureComponent` 功能类似 ，`react.memo` 作为第一个高阶组件，第二个参数 可以对`props` 进行比较 ，和`shouldComponentUpdate`不同的, 当第二个参数返回 `true` 的时候，证明`props`没有改变，不渲染组件，反之渲染组件。

### shouldComponentUpdate

使用 `shouldComponentUpdate()  `以让`React`知道当`state或props`的改变是否影响组件的重新`render`，默认返回`ture`，返回`false`时不会重新渲染更新，而且该方法并不会在初始化渲染或当使用 `forceUpdate()` 时被调用

### immetable.js

`immetable.js` 是Facebook 开发的一个`js`库。

## 规范写法，合理处理细节问题

### ① 绑定事件尽量不要使用箭头函数

每次渲染时都会创建一个新的事件处理器，这会导致传入组件每次都会被渲染。用箭头函数绑定给`dom`元素，每次`react`合成事件事件的时候，也都会重新声明一个新事件。

**解决**：使用 useMemo 或者 useCallback

### ② 循环正确使用key

### ③ 无状态组件`useMemo` 避免重复声明。

对于无状态组件，数据更新就等于函数上下文的重复执行。那么函数里面的变量，方法就会重新声明。可以使用useMemo进行缓存。

### ④ 懒加载 Suspense 和 lazy

`Suspense` 和 `lazy` 可以实现 `dynamic import` 懒加载效果，原理和上述的路由懒加载差不多。在 `React` 中的使用方法是在 `Suspense` 组件中使用 `<LazyComponent> ` 组件。

```tsx
const LazyComponent = React.lazy(() => import('./LazyComponent'));

function demo () {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <LazyComponent />
      </Suspense>
    </div>
  )
}
```

`LazyComponent` 是通过懒加载加载进来的，所以渲染页面的时候可能会有延迟，但使用了 `Suspense` 之后，在加载状态下，可以用`<div>Loading...</div>`作为`loading`效果。

`Suspense` 可以包裹多个懒加载组件。

## 多种方式避免重复渲染

### ① 学会使用的批量更新

`class`有状态组件中的`this.setState`已经做了批量更新的处理。

`hooks`中每个`useState`保存了一个状态，并不是让`class`声明组件中，可以通过`this.state`统一协调状态，再一次异步函数中，比如说一次`ajax`请求后，想通过多个`useState`改变状态，会造成多次渲染页面，为了解决这个问题，我们可以手动批量更新。

#### 手动批量更新

`react-dom` 中提供了`unstable_batchedUpdates`方法进行手动批量更新。这个`api`更契合`react-hooks`，我们可以这样做

```ts
 const handerClick = () => {
    Promise.resolve().then(()=>{
        unstable_batchedUpdates(()=>{
            setB( { ...b } ) 
            setC( c+1 ) 
            setA( a+1 )
        })
    })
}
```

### ② 合并state

学会合并setState（也就是多次setState合并到一次里进行执行）

在hooks里，可以通过一个`useState`保存多个状态，没有必要每一个状态都用一个`useState`。

### ③ useMemo React.memo隔离单元

`react`正常的更新流，就像利剑一下，从父组件项子组件穿透，为了避免这些重复的更新渲染，`shouldComponentUpdate` , `React.memo`等`api`也应运而生。但是有的情况下，多余的更新在所难免。

```jsx
function ChildrenComponent(){
    console.log(2222) // 每次点击按钮，这里也会打印，说明更新还是传递到这里了
    return <div>hello,world</div>
}
function Index (){
    const [ list  ] = useState([ { id:1 , name: 'xixi' } ,{ id:2 , name: 'haha' },{ id:3 , name: 'heihei' } ])
    const [ number , setNumber ] = useState(0)
    return <div>
       <span>{ number }</span>
       <button onClick={ ()=> setNumber(number + 1) } >点击</button>
           <ul>
               {
                list.map(item=>{
                    console.log(1111)
                    return <li key={ item.id }  >{ item.name }</li>
                })
               }
           </ul>
           <ChildrenComponent />
    </div>
}
```

针对这一现象，我们可以通过使用`useMemo`进行隔离，形成独立的渲染单元，每次更新上一个状态会被缓存，循环不会再执行，子组件也不会再次被渲染。

```tsx
function Index (){
    const [ list  ] = useState([ { id:1 , name: 'xixi' } ,{ id:2 , name: 'haha' },{ id:3 , name: 'heihei' } ])
    const [ number , setNumber ] = useState(0)
    return <div>
       <span>{ number }</span>
       <button onClick={ ()=> setNumber(number + 1) } >点击</button>
           <ul>
               {
                useMemo(()=>(list.map(item=>{
                    console.log(1111)
                    return <li key={ item.id }  >{ item.name }</li>
                })),[ list ])
               }
           </ul>
        { useMemo(()=> <ChildrenComponent />,[]) }
    </div>
}
```

在`class`声明的组件中，没有像 `useMemo` 的`API` ，但是也并不等于束手无策，我们可以通过 `react.memo` 来阻拦来自组件本身的更新。我们可以写一个组件，来控制`react` 组件更新的方向。我们通过一个 `<NotUpdate>` 组件来阻断更新流。

```tsx
/* 控制更新 ,第二个参数可以作为组件更新的依赖 ， 这里设置为 ()=> true 只渲染一次 */
const NotUpdate = React.memo(({ children }:any)=> typeof children === 'function' ? children() : children ,()=>true)
```

### ④ 善于使用`state`，知道什么时候使用

### ⑤ useCallback回调

# 时间分片

时间分片的概念，就是一次性渲染大量数据，初始化的时候会出现卡顿等现象。我们必须要明白的一个道理，**js执行永远要比dom渲染快的多。**所以对于大量的数据，一次性渲染，容易造成卡顿，卡死的情况。

时间分片的概念，就是用`setTimeout`把任务分割，分成若干次来渲染。`setTimeout` 可以用 `window.requestAnimationFrame()` 代替，会有更好的渲染效果。

实际对于列表来说，最佳方案是虚拟列表，而时间分片，更适合**热力图，地图点位比较多的情况**。

# 虚拟列表

无论是小程序，或者是`h5` ，随着 `dom`元素越来越多，页面会越来越卡顿,这种情况在小程序更加明显 。

虚拟列表是按需显示的一种技术，可以根据用户的滚动，不必渲染所有列表项，而只是渲染可视区域内的一部分列表元素的技术。正常的虚拟列表分为 **渲染区，缓冲区 ，虚拟列表区**。

为了防止大量`dom`存在影响性能，我们只对，渲染区和缓冲区的数据做渲染，虚拟列表区 没有真实的dom存在。 缓冲区的作用就是防止快速下滑或者上滑过程中，会有空白的现象。

#### react-tiny-virtual-list

react-tiny-virtual-list 是一个较为轻量的实现虚拟列表的组件。

**具体思路**

① 初始化计算容器的高度。截取初始化列表长度。这里我们需要div占位,撑起滚动条。

② 通过监听滚动容器的 `onScroll`事件,根据 `scrollTop` 来计算渲染区域向上偏移量, 我们要注意的是，当我们向下滑动的时候，为了渲染区域，能在可视区域内，可视区域要向上的滚动; 我们向上滑动的时候，可视区域要向下的滚动。

③ 通过重新计算的 `end` 和 `start` 来重新渲染列表。

**性能优化点**

① 对于移动视图区域，我们可以用 `transform` 来代替改变 `top`值。

② 虚拟列表实际情况，是有 `start` 或者 `end` 改变的时候，在重新渲染列表，所以我们可以用之前 `shouldComponentUpdate` 来调优，避免重复渲染。

