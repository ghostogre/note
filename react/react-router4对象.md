# 对象

### history

引用了history包，它提供了几种不同的实现来管理各种环境中JavaScript的会话历史。

- “browser history”-特定于DOM的实现，在支持HTML5历史记录API的Web浏览器中很有用
- “hash history”-遗留Web浏览器的DOM特定实现
- “memory history”-内存历史记录实现，可用于测试和像React Native这样的非DOM环境

history对象包含以下对象和属性：

1. `length`：历史记录堆栈的长度
2. `action`：当前的action（PUSH，REPLACE或者POP）
3. `location`：当前路由对象，包含以下属性：
   * `pathname`：URL的路径
   * `search`：请求字符串
   * `hash`：URL的哈希字符串
   * `state`：特定于location的状态，例如`push(path, state)`在将该位置推入堆栈时所提供的状态。仅在浏览器和内存历史记录中可用。
4. `push(path, [state])` - (function) 压入历史记录堆栈一条记录
5. `replace(path, [state])` - (function) 替换历史记录堆栈里的记录
6. `go(n)` - (function) 移动n个条目，在记录堆栈中
7. `goBack()` - (function) 等于`go(-1)`
8. `goForward()` - (function) 等于 `go(1)`
9. `block(prompt)` - (function) 停止导航

### 历史记录是可变的

history对象是可变的，因此最好从`<Route>`组件传递给渲染组件的props中获取，而不是从`history.location`中。

```jsx
class Comp extends React.Component {
  componentDidUpdate(prevProps) {
    // will be true
    const locationChanged =
      this.props.location !== prevProps.location;

    // INCORRECT, will *always* be false because history is mutable.
    const locationChanged =
      this.props.history.location !== prevProps.history.location;
  }
}

<Route component={Comp} />;
```



## location

表示现在应用所在的位置。

路由在以下这些地方提供这个对象：

	1. `Route`的component属性里，通过`this.props.location`获取
 	2. `Route`的Render里，在`({ location }) => {}`中
 	3. `Route`的children里，在`({ location }) => {}`中
 	4. `withRouter`里的`this.props.location`

location永远不会发生变化，因此您可以在生命周期钩子函数中使用它来确定何时进行导航，这对于数据获取和动画处理非常有用。

可以使用location代替字符串进行导航：

```jsx
// usually all you need
<Link to="/somewhere"/>

// but you can use a location instead
const location = {
  pathname: '/somewhere',
  state: { fromDashboard: true }
}

<Link to={location}/>
<Redirect to={location}/>
history.push(location)
history.replace(location)
```



## match

包含了`<Route path>`如何匹配路由的信息。

包括以下属性：

* `params` - (object) 对应于路径动态段的URL解析的键/值对
* `isExact` - (boolean) `true` 是否匹配完整的路径
* `path` - (string) 用于匹配的路径
* `url` - (string) URL的匹配部分

能在以下地方获取match：

- Route component  `this.props.match`
- Route render `({ match }) => ()`
- Route children `({ match }) => ()`
- withRouter `this.props.match`
- matchPath  的返回值

如果Route没有`path`，因此将会始终匹配，则将获得最接近的父匹配。同样适用`withRouter`。

### null match

即使路由不匹配，依然会调用children子函数。这种情况下，match返回的是null。

```jsx
// location.pathname = '/matches'
<Route path="/does-not-match"
  children={({ match }) => (
    // match === null
    <Route
      render={({ match: pathlessMatch }) => (
        // pathlessMatch === ???
      )}
    />
  )}
/>
```

解析URL的默认方法是将`match.url`字符串连接到“相对”路径。

```javascript
let path = `${match.url}/relative-path`;
```

未匹配的Route继承他们父组件的match。如果父组件的match是null，他们的match也是null。这意味着，任意的子Route和link必须是绝对路径，因为没有父组件的去解决路径前缀问题。一个不匹配的Route需要使用children prop去渲染。

## matchPath





