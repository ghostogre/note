# react-router

现在的`React Router`版本中已不需要路由配置，现在一切皆组件。

`React Router`中提供了以下三大组件：

- `Router`是所有路由组件共用的底层接口组件，它是路由规则制定的最外层的容器。
- `Route`路由规则匹配，并显示当前的规则对应的组件。
- `Link`路由跳转的组件

当然每个组件下又会有几种不同的子类组件实现。比如： Router组件就针对不同功能和平台对应用：

- `BrowserRouter` 浏览器的路由组件
- `HashRouter` URL格式为Hash路由组件
- `MemoryRouter` 内存路由组件
- `NativeRouter` Native的路由组件
- `StaticRouter` 地址不改变的静态路由组件

## BrowserRouter

`BrowserRouter`主要使用在浏览器中，也就是WEB应用中。它利用`HTML5` 的`history API`来同步 URL 和 UI 的变化。当我们点击了程序中的一个链接之后,`BrowserRouter`就会找出与这个`URL`匹配的`Route`，并将他们对应的组件渲染出来。 `BrowserRouter`是用来管理我们的组件的，那么它当然要被放在最顶级的位置，而我们的应用程序的组件就作为它的一个子组件而存在。

`BrowserRouter`组件提供了四个属性。

- `basename`: 字符串类型，路由器的默认根路径
- `forceRefresh`: 布尔类型，在导航的过程中整个页面是否刷新
- `getUserConfirmation`: 函数类型，当导航需要确认时执行的函数。默认是：`window.confirm`
- `keyLength`: 数字类型`location.key` 的长度。默认是 6

```jsx
<BrowserRouter basename="/calendar" />
<Link to="/today"/> // renders <a href="/calendar/today">

<BrowserRouter
  getUserConfirmation={(message, callback) => {
    // this is the default behavior
    const allowTransition = window.confirm(message);
    callback(allowTransition);
  }}
/>

// 当设置为 true 时，在导航的过程中整个页面将会刷新。
// 只有当浏览器不支持 HTML5 的 history API 时，才设置为 true。
<BrowserRouter forceRefresh={true} />

<BrowserRouter keyLength={12} />
```

## HashRouter

`HashRouter` 使用 URL 的 hash (例如：`window.location.hash`) 来保持 UI 和 URL 的同步。

>**注意：** 使用 hash 的方式记录导航历史不支持 `location.key` 和`location.state`。在以前的版本中，我们为这种行为提供了 shim，但是仍有一些问题我们无法解决。任何依赖此行为的代码或插件都将无法正常使用。由于该技术仅用于支持传统的浏览器，因此在用于浏览器时可以使用 `` 代替。

跟`BrowserRouter`类似，它也有：`basename`、`getUserConfirmation`、`children`属性，而且是一样的。

### [hashType: string](https://reacttraining.com/react-router/web/api/HashRouter/hashtype-string)

`window.location.hash` 使用的 hash 类型。有如下几种：

- `"slash"` - 后面跟一个斜杠，例如 `#/` 和 `#/sunshine/lollipops`，默认值。
- `"noslash"` - 后面没有斜杠，例如 `#` 和 `#sunshine/lollipops`
- `"hashbang"` - Google 风格的 ["ajax crawlable"](https://developers.google.com/webmasters/ajax-crawling/docs/learn-more)，例如 `#!/` 和 `#!/sunshine/lollipops`

### [MemoryRouter](https://malun666.github.io/aicoder_vip_doc/#/pages/Vip3_react_router?id=memoryrouter)

主要用在`ReactNative`这种非浏览器的环境中，因此直接将URL的history保存在了内存中。 `StaticRouter` 主要用于服务端渲染。

## [Link](https://reacttraining.com/react-router/web/api/Link)

### to

可以是string，function和object。

````jsx
<Link to="/courses?sort=name" />

<Link
  to={{
    pathname: "/courses",
    search: "?sort=name",
    hash: "#the-hash",
    state: { fromDashboard: true }
  }}
/>

<Link to={location => ({ ...location, pathname: "/courses" })} />
<Link to={location => `${location.pathname}?sort=name`} />
````

### replace

默认为 `false`。

```jsx
<Link to="/courses" replace />
```

## [NavLink](https://reacttraining.com/react-router/web/api/NavLink)

NavLink是一个特殊版本的Link，可以使用activeClassName来设置Link被选中时被附加的class，使用activeStyle来配置被选中时应用的样式。此外，还有一个exact属性,此属性要求location完全匹配才会附加class和style。这里说的匹配是指地址栏中的URl和这个Link的to指定的location相匹配。

```jsx
// 选中后被添加class selected
<NavLink to={'/'} exact activeClassName='selected'>Home</NavLink>
// 选中后被附加样式 color:red
<NavLink to={'/gallery'} activeStyle={{color:red}}>Gallery</NavLink>
```

> `activeClassName`默认值为 `active`

### 属性

1. `to` 可以是字符串或者对象，同Link组件
2. `exact` 布尔类型，完全匹配时才会被附件class和style
3. `activeStyle` Object类型
4. `activeClassName` 字符串类型
5. `strict` boolean类型，当值为 `true` 时，在确定位置是否与当前 URL 匹配时，将考虑位置 `pathname` 后的斜线。
6.  `isActive`: function类型，一个函数用于区分是否链接处于活跃状态。
7. `location`: object类型，`isActive`比较当前的历史位置（通常是当前的浏览器URL）。要与其他位置进行比较，可以传递一个location。

```jsx
<NavLink
  to="/events/123"
  isActive={(match, location) => {
    if (!match) {
      return false;
    }

    // only consider an event active if its event id is an odd number
    const eventID = parseInt(match.params.eventID);
    return !isNaN(eventID) && eventID % 2 === 1;
  }}
>
  Event 123
</NavLink>
```

## MemoryRouter

将“URL”的历史记录保存在内存中（不读取或写入地址栏）的<路由器>。在测试和非浏览器环境（如React Native）中很有用

```jsx
<MemoryRouter
  initialEntries={optionalArray}
  initialIndex={optionalNumber}
  getUserConfirmation={optionalFunc}
  keyLength={optionalNumber}
>
  <App />
</MemoryRouter>
```

### initialEntries（array）

历史堆栈中location的数组。这些可能是`{pathname，search，hash，state}`或简单字符串URL的位置对象。

### initialIndex（number）

初始location在`initialEntries`中的index。

```jsx
<MemoryRouter
  initialEntries={["/one", "/two", { pathname: "/three" }]}
  initialIndex={1}
>
  <App />
</MemoryRouter>
```

## Redirect

渲染`<Redirect/>`会导航到一个新的位置。这个新的location会替换当前历史记录在历史堆栈里的位置。

### to

```jsx
<Route exact path="/">
  {loggedIn ? <Redirect to="/dashboard" /> : <PublicHomePage />}
</Route>

<Redirect
  to={{
    pathname: "/login",
    search: "?utm=your+face",
    state: { referrer: currentLocation }
  }}
/>
```

这个state可以在重定向的目标组件中通过`this.props.location.state`获取到。其他属性和`Route`相同。

### push

Boolean，是否将当前路径存到history中。

### from

重定向来源的pathname。

## Router

### history

```jsx
import React from "react";
import ReactDOM from "react-dom";
import { createBrowserHistory } from "history";

const customHistory = createBrowserHistory();

ReactDOM.render(<Router history={customHistory} />, node);
```

一个history对象被用于导航。

## Prompt

Prompt是用来提示用户是否要跳转，给用户提示信息默认使用`window.confirm`，可以结合`getUserConfirmation`构建自定义提示信息。

```jsx
<Prompt message={location => {
  console.log(location);
  return true // 表示可以直接跳转，无需验证
  // 返回字符串表示给用户的提示信息
 }}/>
```

**message**： 传递字符串，用于提示用户的展示信息。传递函数，可以接受location对象作为参数

**when**：接受一个布尔值，表示是否执行prompt

## Route

所有的渲染方式都会传递这三个props：`match`，`history`，`location`。

## history

`browser history`：DOM特定的实现，可用于支持 HTML5历史记录API 的Web浏览器。

`hash history`：遗留网络浏览器的DOM**特定实现**。

`memory history`：内存中的历史记录实现，可用于测试和非DOM环境（如React Native）

history 对象通常具有以下属性和方法：

* `length`: number 浏览历史堆栈中的条目数

* `action`: string 路由跳转到当前页面执行的动作，分为 **PUSH**, **REPLACE**, **POP**

* `location`: object 当前访问地址信息组成的对象，具有如下属性：

  >  pathname: string URL路径
  >  search: string URL中的查询字符串
  >  hash: string URL的 hash 片段
  >  state: string 例如执行 push(path, state) 操作时，location 的 state 将被提供到堆栈信息里，state 只有在 browser 和 memory history 有效。

* `push(path, [state])` 在历史堆栈信息里加入一个新条目
* `replace(path, [state])` 在历史堆栈信息里替换掉当前的条目
* `go(n)` 将 history 堆栈中的指针向前移动 n
* `goBack()` 等同于 go(-1)
* `goForward` 等同于 go(1)
* `block(prompt)` 阻止跳转

### history是可变的

因为history是可变的，所以要求从`<Route>`的渲染的props获取location，而不是`props.history.location`。你需要确保在正确的生命周期钩子里获取：

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

表示了应用当前的位置，以后和之前的位置：

```jsx
{
  key: 'ac3df4', // not with HashHistory!
  pathname: '/somewhere',
  search: '?some=search-string',
  hash: '#howdy',
  state: {
    [userDefined]: true
  }
}
```

路由在以下几个地方，提供给你location对象：

1. 在 Route 的 component 中，用`this.props.location`方式获取

2. 在 Route的 render 属性 中，以 `({location}) => ()` 方式获取

3. 在 Route的 children 属性 中，以 `({location}) => ()` 方式获取

4. 在 withRouter 中，以 `this.props.location` 的方式获取

   

虽然也可以通过`history.location`获取，但是不应该这么使用，因为history是可变的。

一个location对象永远都是不可变的，所以你才能使用在生命周期里使用他去决定什么时候导航发生，这对动画和fetch十分有用。

```jsx
componentWillReceiveProps(nextProps) {
  if (nextProps.location !== this.props.location) {
    // navigated!
  }
}
```

你可以替换字符串使用location进行导航在以下地点：

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

- Web [Link to](https://reacttraining.com/react-router/web/api/Link/to)
- Native [Link to](https://reacttraining.com/react-router/native/api/Link/to)
- [Redirect to](https://reacttraining.com/react-router/web/api/Redirect/to)
- [history.push](https://reacttraining.com/react-router/web/api/history/push)
- [history.replace](https://reacttraining.com/react-router/web/api/history/push)

通常您只需使用一个字符串，但如果您需要添加一些“位置状态”，只要应用程序返回到该特定位置，就可以使用位置对象。如果您想基于导航历史而不仅仅是路径（如模态）分支UI，这很有用。

## match

匹配对象包含有关`<Route path>`如何匹配URL的信息。匹配对象包含以下属性：

1. `params` - （object）从对应于路径的动态段的URL解析的键/值对
2. `isExact` - （boolean）true如果整个URL匹配（没有尾随字符
3. `path` - （string）用于匹配的路径模式。作用于构建嵌套的`<Route>`
4. `url` - （string）URL的匹配部分。作用于构建嵌套的`<Link> `

可以在以下地方访问匹配对象：

1. Route的component 中使用`this.props.match`
2. Route的render方式  `({ match }) => ()`
3. Route的children方式 `({ match }) => ()`
4. withRouter as `this.props.match`
5. matchPath方法中作为返回值

如果路由没有路径，因此始终匹配，您将获得最接近的父级匹配。与Router一样。

## matchPath

这允许您使用`<Route>`相同的匹配代码（除了正常渲染循环以外），例如在服务器上渲染之前收集数据依赖关系。

```jsx
import { matchPath } from 'react-router'

const match = matchPath('/users/123', {
  path: '/users/:id',
  exact: true,
  strict: false
})
```

返回值：

```jsx
matchPath("/users/2", {
  path: "/users/:id",
  exact: true,
  strict: true
});

//  {
//    isExact: true
//    params: {
//        id: "2"
//    }
//    path: "/users/:id"
//    url: "/users/2"
//  }

// 不匹配的时候返回null
```

**withRouter**

您可以通过`withRouter`高阶组件访问历史对象的属性和最近的`<Route>`的匹配。当重新渲染的时候，`withRouter`会传递更新后的match，location，history给被包裹的组件的props。

默认情况下必须是经过路由匹配渲染的组件才存在`this.props`，才拥有路由参数，才能使用编程式导航的写法，执行`this.props.history.push('/detail')`跳转到对应路由的页面。然而不是所有组件都直接与路由相连（通过路由跳转到此组件）的，当这些组件需要路由参数时，使用`withRouter`就可以给此组件传入路由参数，此时就可以使用`this.props`。

在使用`withRouter`解决更新问题的时候，一定要保证`withRouter`在最外层。

```jsx
import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router";

// A simple component that shows the pathname of the current location
class ShowTheLocation extends React.Component {
  static propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
  };

  render() {
    const { match, location, history } = this.props;

    return <div>You are now at {location.pathname}</div>;
  }
}

// Create a new component that is "connected" (to borrow redux
// terminology) to the router.
const ShowTheLocationWithRouter = withRouter(ShowTheLocation);
```

> `withRouter`不订阅location改变，就像`React Redux`的`connect`对state更改做的那样。相反，location改变以后从`<Router>`发出重新渲染。这意味着`withRouter`在route转换的时候不会重新渲染，除非他的父组件重新渲染。

> 被包裹的组件所有非react专有的静态方法和属性自动被拷贝到这个“connected”组件。

### Component.WrappedComponent

被包裹的组件在返回的组件中作为静态属性`WrappedComponent`暴露，可以用于单独测试组件。

```jsx
// MyComponent.js
export default withRouter(MyComponent)

// MyComponent.test.js
import MyComponent from './MyComponent'
render(<MyComponent.WrappedComponent location={{...}} ... />)
```

### wrappedComponentRef

一个方法将作为`ref props`传给被包裹的组件

```jsx
class Container extends React.Component {
  componentDidMount() {
    this.component.doSomething();
  }

  render() {
    return (
      <MyComponent wrappedComponentRef={c => (this.component = c)} />
    );
  }
}
```

