### 小程序的架构

微信小程序主要分为 **逻辑层** 和 **视图层**，以及在他们之下的原生部分。逻辑层主要负责 JS 运行，视图层主要负责页面的渲染，它们之间主要通过 `Event` 和 `Data` 进行通信，同时通过 `JSBridge` 调用原生的 API。

### Taro

**Taro 当前架构只是在开发时遵循了 React 的语法，在代码编译之后实际运行时，和 React 并没有关系**。

## bug收集

### taro 的 scrollView 组件

在使用 ScrollView 实现点击 tab选项 自动滚动 tab栏 的时候，出现了一个问题。ScrollView 水平滚动，使用 scrollIntoView 滚动到指定位置后，修改页面上其他的 state 使页面刷新，会导致 ScrollView 滚动回最左侧。

当前使用 3.1.14 版本，截止到2021年七月底3.x以上版本都有此问题。

> https://github.com/NervJS/taro/issues/8466
>
> **基于组件的 template，动态 “递归” 渲染整棵树** 这可能就是问题的关键了，所有组件的状态无法保留。

据说issue提到的，使用原生组件不会有问题。

引发这个问题是由于同级组件更新会导致 `ScrollView` 组件销毁，需要记录组件的实际滚动值 `scrollTop` 或者 `scrollLeft`

**解决方法**

利用 **useRef** ，监听滑动事件，实时记录滑动的位置。然后 `scrollLeft={scrollLeftRef.current}`。必须使用ref，如果使用state会出现更新滚动前后抖动。

对于我们的需求，自动滚动的 tabbar ，tab 的文字长度只有2个字和4个字的类型名称，相当于只有两种长度，点击选择后我们可以遍历数组算出 scrollLeft 。
