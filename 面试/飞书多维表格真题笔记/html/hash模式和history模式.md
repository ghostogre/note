# hash模式和 history模式

单页面应用利用了JavaScript动态变换网页内容，避免了页面重载；路由则提供了浏览器地址变化，网页内容也跟随变化，两者结合起来则为我们提供了体验良好的单页面web应用。

路由需要实现三个功能：

1. 当浏览器地址变化时，切换页面；
2. 点击浏览器【后退】、【前进】按钮，网页内容跟随变化；
3. 刷新浏览器，网页加载当前路由对应内容；

两种实现方式：

- hash模式：监听浏览器地址hash值变化，执行相应的js切换网页；
- history模式：利用history API实现url地址改变，网页内容改变；

## hash模式

使用`window.location.hash`属性及窗口的`onhashchange`事件，可以实现监听浏览器地址hash值变化，执行相应的js切换网页。

### 触发hashchange事件的几种情况：

- 浏览器地址栏散列值的变化（包括浏览器的前进、后退）会触发window.location.hash值的变化，从而触发onhashchange事件；
- 当只改变浏览器地址栏URL的哈希部分，这时按下回车，浏览器不会发送任何请求至服务器，这时发生的只是设置散列值新修改的哈希值，并触发onhashchange事件；
- html中`<a>`标签的属性 href 可以设置为页面的元素ID如 #top，当点击该链接时页面跳转至该id元素所在区域，同时浏览器自动设置 window.location.hash 属性，地址栏中的哈希值也会发生改变，并触发onhashchange事件；

## history模式

- window.history 属性指向 History 对象，它表示当前窗口的浏览历史。当发生改变时，只会改变页面的路径，不会刷新页面。
- History 对象保存了当前窗口访问过的所有页面网址。通过 history.length 可以得出当前窗口一共访问过几个网址。
- 由于安全原因，浏览器不允许脚本读取这些地址，但是允许在地址之间导航。
- 浏览器工具栏的“前进”和“后退”按钮，其实就是对 History 对象进行操作。

History 对象主要有两个属性。

- `History.length`：当前窗口访问过的网址数量（包括当前网页）
- `History.state`：History 堆栈最上层的状态值

还有三个主要方法：

- `History.back()`：移动到上一个网址，等同于点击浏览器的后退键。对于第一个访问的网址，该方法无效果。
- `History.forward()`：移动到下一个网址，等同于点击浏览器的前进键。对于最后一个访问的网址，该方法无效果。
- `History.go()`：接受一个整数作为参数，以当前网址为基准，移动到参数指定的网址。如果参数超过实际存在的网址范围，该方法无效果；如果不指定参数，默认参数为0，相当于刷新当前页面。

### History.pushState

该方法用于在历史中添加一条记录。`pushState()`方法不会触发页面刷新，只是导致 History 对象发生变化，地址栏会有变化。

该方法接受三个参数，依次为：

- object：是一个对象，通过 pushState 方法可以将该对象内容传递到新页面中。如果不需要这个对象，此处可以填 null。
- title：指标题，几乎没有浏览器支持该参数，传一个空字符串比较安全。
- url：新的网址，必须与当前页面处在同一个域。不指定的话则为当前的路径，如果设置了一个跨域网址，则会报错。

**注意**：如果 pushState 的 URL 参数设置了一个新的锚点值（即 hash），并不会触发 hashchange 事件。反过来，如果 URL 的锚点值变了，则会在 History 对象创建一条浏览记录。

**插入一个跨域的网址，会导致报错**。

> 移动到以前访问过的页面时，页面通常是从浏览器缓存之中加载，而不是重新要求服务器发送新的网页。

### History.replaceState()

该方法用来修改 History 对象的当前记录，用法与 pushState() 方法一样。

## popstate 事件

每当 history 对象出现变化时，就会触发 popstate 事件。

**注意**：

- 仅仅调用`pushState()`方法或`replaceState(`)方法 ，并不会触发该事件;
- 只有用户点击浏览器倒退按钮和前进按钮，或者使用 JavaScript 调用`History.back()`、`History.forward()`、`History.go()`方法时才会触发。
- 另外，该事件只针对同一个文档，如果浏览历史的切换，导致加载不同的文档，该事件也不会触发。
- 页面第一次加载的时候，浏览器不会触发popstate事件。

使用的时候，可以为`popstate`事件指定回调函数，回调函数的参数是一个 event 事件对象，它的 state 属性指向当前的 state 对象。