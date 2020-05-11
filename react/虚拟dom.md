## 开发中的常见问题

- 为何必须引用`React`
- 自定义的`React`组件为何必须大写
- `React`如何防止`XSS`
- `React`的`Diff`算法和其他的`Diff`算法有何区别
- `key`在`React`中的作用
- 如何写出高性能的`React`组件

`React`会先将你的代码转换成一个`JavaScript`对象，然后这个`JavaScript`对象再转换成真实`DOM`。这个`JavaScript`对象就是所谓的虚拟`DOM`。

当我们需要创建或更新元素时，`React`首先会让这个`VitrualDom`对象进行创建和更改，然后再将`VitrualDom`对象渲染成真实`DOM`；

当我们需要对`DOM`进行事件监听时，首先对`VitrualDom`进行事件监听，`VitrualDom`会代理原生的`DOM`事件从而做出响应。

## 为何使用虚拟DOM

1. 提高开发效率，关注业务逻辑而不是 DOM。
2. `VitrualDom`的优势在于`React`的`Diff`算法和批处理策略，`React`在页面更新之前，提前计算好了如何进行更新和渲染`DOM`。
3. 跨浏览器兼容
4. 跨平台兼容

## 虚拟DOM实现原理

### JSX和createElement

`JSX`只是为 `React.createElement(component, props, ...children)`方法提供的语法糖。也就是说所有的`JSX`代码最后都会转换成`React.createElement(...)`，`Babel`帮助我们完成了这个转换的过程。

注意，`babel`在编译时会判断`JSX`中组件的首字母，当首字母为小写时，其被认定为原生`DOM`标签，`createElement`的第一个变量被编译为字符串；当首字母为大写时，其被认定为自定义组件，`createElement`的第一个变量被编译为对象；

另外，由于`JSX`提前要被`Babel`编译，所以`JSX`是不能在运行时动态选择类型

```jsx
function Story(props) {
  // Wrong! JSX type can't be an expression.
  return <components[props.storyType] story={props.story} />;
}
// 需要变成下面的写法：
function Story(props) {
  // Correct! JSX type can be a capitalized variable.
  const SpecificStory = components[props.storyType];
  return <SpecificStory story={props.story} />;
}
```



使用`JSX`你需要安装`Babel`插件`babel-plugin-transform-react-jsx`。

```json
{
    "plugins": [
        ["transform-react-jsx", {
            "pragma": "React.createElement"
        }]
    ]
}
```

### 创建虚拟DOM

`createElement`函数的具体实现（源码经过精简）

```js
const hasOwnProperty = Object.prototype.hasOwnProperty;

const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true,
};
ReactElement.createElement = function (type, config, children) {
    var propName;
    var props = {};
    var key = null;
    var ref = null;
    var self = null;
    var source = null;
    
    if (config !== null) {
        // 1.处理props
    }
    // 2.获取子元素
    if (type && type.defaultProps) {
        // 3.处理默认props
    }
    return ReactElement(type, key, ref, self, source, ReactCurrentOwner.current, props);
}
```

`createElement`函数内部做的操作很简单，将`props`和子元素进行处理后返回一个`ReactElement`对象

**处理props：**

```js
if (config !== null) {
    if (hasValidRef(conifg)) {
        ref = config.ref;
    }
    if (hasValidKey(config)) {
        key = '' + config.key;
    }
    self = config.__self === undefined ? null : config.__self;
    source = config.__source === undefined ? null : config.__source;
    
    for (propName in config) { // in 会遍历出原型链上的属性
        if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
            // 只处理传入的，而且不处理ref，key等、
            props[propName] = config[propName];
        }
    }
}
```

1. 将特殊属性`ref`、`key`从`config`中取出并赋值
2. 将特殊属性`self`、`source`从`config`中取出并赋值
3. 将除特殊属性的其他属性取出并赋值给`props`

**获取子元素**

```js
var childrenLength = arguments.length - 2;
if (childrenLength === 1) {
    props.children = children;
} else if (childrenLength > 1) {
    var childArray = new Array(childrenLength);
    for (var i = 0; i < childrenLength; i++) {
        childArray[i] = arguments[i + 2];
    }
    props.children = childArray;
}
```

1. 获取子元素的个数 —— 第二个参数后面的所有参数

2. 若只有一个子元素，赋值给`props.children`

3. 若有多个子元素，将子元素填充为一个数组赋值给`props.children`

**处理默认props**

```js
if (type && type.defaultProps) {
    var defaultProps = type.defaultProps;
    for (propName in defaultProps) {
        if (props[propName] === undefined) {
            props[propName] = defaultProps[propName];
        }
    }
}
```

将组件的静态属性`defaultProps`定义的默认`props`进行赋值

**ReactElement**

`ReactElement`将传入的几个属性进行组合，并返回。

ReactElement 包含以下的属性：

- `type`：元素的类型，可以是原生html类型（字符串），或者自定义组件（函数或`class`）
- `key`：组件的唯一标识，用于`Diff`算法
- `ref`：用于访问原生`dom`节点
- `props`：传入组件的`props`
- `owner`：当前正在构建的`Component`所属的`Component`

- `$$typeof`：一个我们不常见到的属性，它被赋值为`REACT_ELEMENT_TYPE`：

  ```js
  var REACT_ELEMENT_TYPE =
    (typeof Symbol === 'function' && Symbol.for && Symbol.for('react.element')) ||
    0xeac7;
  ```

  `$$typeof`是一个`Symbol`类型的变量，这个变量可以防止`XSS`。如果你的服务器有一个漏洞，允许用户存储任意`JSON`对象， 而客户端代码需要一个字符串，这可能会成为一个问题，`JSON`中不能存储`Symbol`类型的变量。

`ReactElement.isValidElement`函数用来判断一个`React`组件是否是有效的，下面是它的具体实现：

```js
ReactElement.isValidElement = function (object) {
  return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
};
```

`React`渲染时会把没有`$$typeof`标识，以及规则校验不通过的组件过滤掉。

当你的环境不支持`Symbol`时，`$$typeof`被赋值为`0xeac7`，至于为什么：`0xeac7`看起来有点像`React`。

`self`、`source`只有在非生产环境才会被加入对象中。

- `self`指定当前位于哪个组件实例。
- `_source`指定调试代码来自的文件(`fileName`)和代码行数(`lineNumber`)。

### 虚拟DOM转换为真实DOM

**过程1：初始参数处理**

在编写好我们的`React`组件后，我们需要调用`ReactDOM.render(element, container[, callback])`将组件进行渲染。

```jsx
ReactDOM.render(
	(
    	<div>
            {/** container */}
        </div>
    ),
    document.getElementById('#app')
)
```



`render`函数内部实际调用了`_renderSubtreeIntoContainer`，我们来看看它的具体实现：

```js
render: function (nextElement, container, callback) {
    return ReactMount._renderSubtreeIntoContainer(null, nextElement, container, callback);
}
```

```js
function _renderSubtreeIntoContainer (parentComponent, nextElement, container, callbackj) {
    ReactUpdateQueue.validateCallback(callbakc, 'ReactDOM.render');
    // 包裹TopLevelWrapper
    var nextTopLevelWrapper = React.createElement(TopLevelWrapper, { child: nextElement });
    
    var prevComponent = getTopLevelWrapperIntoContainer(container);
    
    if (prevComponent) {
        // 更新操作...
    }
    
    // 处理shouldReuseMarkup变量
    var reactRootElement = getReactRootElementInContainer(container);
    var containerHasReactMarkup = reactRoorElement && !!internalGetID(reactRootElement);
    var containerHasNonRootReactChild = hasNonRootReactChild(container);
    var shouldReuseMarkup = containerHasReactMarkup && !prevComponent && !containerHasNonRootReactChild;
    
    var component = ReactMount._renderNewRootComponent(nextWrappedElement, container, shouldReuseMarkup, nextContext)._renderedComponent.getPublicInstance();
    if (callback) {
        callback.call(component);
    }
    return component;
}
```

1. 将当前组件使用`TopLevelWrapper`进行包裹。`TopLevelWrapper`只一个空壳，它为你需要挂载的组件提供了一个`rootID`属性，并在`render`函数中返回该组件。

   ```js
   TopLevelWrapper.prototype.render = function () {
   	return this.props.child;
   }
   ```

   `ReactDOM.render`函数的第一个参数可以是原生`DOM`也可以是`React`组件，包裹一层`TopLevelWrapper`可以在后面的渲染中将它们进行统一处理，而不用关心是否原生。

2. 判断根结点下是否已经渲染过元素，如果已经渲染过，判断执行更新或者卸载操作

3. 处理`shouldReuseMarkup`变量，该变量表示是否需要重新标记元素

4. 调用将上面处理好的参数传入`_renderNewRootComponent`，渲染完成后调用`callback`。

在`_renderNewRootComponent`中调用`instantiateReactComponent`对我们传入的组件进行分类包装：

```js
function instantiateReactComponent (node, shouldHaveDebugID) {
    var instance;
	if (node === null || null === false) {
        // 空组件
        instance = ReactEmptyComponent.create(instantiateReactComponent);
    } else if (typeof node === 'object') {
        var element = node;
        if (typeof element.type === 'string') {
            // 原生DOM
            instance = ReactHostComponent.createInternalComponent(element);
        } else if (isInternalComponentType(element.type)) {
            instance = new element.type(element);
        } else {
            // React组件
            instance = new ReactCompositeComponentWrapper(element);
        }
    } else if (typeof node === 'string' || typeof node === 'number') {
        // 文本
        instance = ReactHostComponent.crateInstanceForText(node);
    }
    return instance;
}
```

根据组件的类型，`React`根据原组件创建了下面四大类组件，对组件进行分类渲染：

- `ReactDOMEmptyComponent`:空组件
- `ReactDOMTextComponent`:文本
- `ReactDOMComponent`:原生`DOM`
- `ReactCompositeComponent`:自定义`React`组件

他们都具备以下三个方法：

- `construct`:用来接收`ReactElement`进行初始化。
- `mountComponent`:用来生成`ReactElement`对应的真实`DOM`或`DOMLazyTree`。
- `unmountComponent`:卸载`DOM`节点，解绑事件。

**批处理、事务调用**

在`_renderNewRootComponent`中使用`ReactUpdates.batchedUpdates`调用`batchedMountComponentIntoNode`进行批处理。

```js
ReactUpdates.batchedUpdates(batchedMountComponentIntoNode, componentInstance, container, shouldReuseMarkup, context);
```

在`batchedMountComponentIntoNode`中，使用`transaction.perform`调用`mountComponentIntoNode`让其基于事务机制进行调用。

```js
transaction.perform(mountComponentIntoNode, null, componentInstance, container, transaction, shouldReuseMarkup, context);
```

**生成html**

在`mountComponentIntoNode`函数中调用`ReactReconciler.mountComponent`生成原生`DOM`节点。

`mountComponent`内部实际上是调用了过程1生成的四种对象的`mountComponent`方法。首先来看一下`ReactDOMComponent`：

```js
function mountComponent (transaction, hostParent, hostContainerInfo, context) {
    var props = this._currentElement.props;
    // 处理特殊标签
    switch (this._tag) {
        case 'audio':
        case 'form':
        case 'iframe':
        case '...':
            // ...
            break;
    }
    // 对于特殊props进行处理
    assertValidProps(this, props);
    // 创建标签
    var mountImage;
    var ownerDocument = hostContainerInfo._ownerDocument;
    var el;
    if (this._tag === 'script') {
        var div = ownerDocument.createElement('div');
        var type = this._currentElement.type;
        div.innerHTML = '<' + type + '></' + type + '>';
        el = div.removeChild(div.firstChild);
    } else if (props.is) {
        el = ownerDocument.createElement(this._currentElement.type, props.is);
    } else {
        el = ownerDocument.createElement(this._currentElement.type);
    }
    // 将props插入dom节点
    this._updateDOMProperties(null, props, transaction);
    // 生成DOMLazyTree对象
    var lazyTree = DOMLazyTree(el);
    // 处理孩子节点
    this._createIntitalChildren(transaction, props, context, lazyTree);
    return mountImage;
}
```

1. 对特殊`DOM`标签、`props`进行处理。
2. 根据标签类型创建`DOM`节点。
3. 调用`_updateDOMProperties`将`props`插入到`DOM`节点，`_updateDOMProperties`也可用于`props Diff`，第一个参数为上次渲染的`props`，第二个参数为当前`props`，若第一个参数为空，则为首次创建。
4. 生成一个`DOMLazyTree`对象并调用`_createInitialChildren`将孩子节点渲染到上面。

为什么不直接生成一个`DOM`节点而是要创建一个`DOMLazyTree`呢？我们先来看看`_createInitialChildren`做了什么：

```js
function _createIntialChildren (transaction, props, context, lazyTree) {
    var innerHTML = props.dangerouslySetInnerHTML;
    if (innerHTML !== null) { // 存在dangerouslySetInnerHTML
        if (innerHTML.__html !== null) {
            DOMLazyTree.queueHTML(lazyTree, innerHTML.__html);
        }
    } else {
        var contentToUse = CONTENT_TYPES[typeof props.children] ? props.children : null; // 是允许的内容类型
        var childrenToUse = contentToUse !== null ? null : props.children;
        if (contentToUse !== null) {
            if (contentToUse !== '') {
                DOMLazyTree.queueText(lazyTree, contentToUse); // 文本节点
            }
        } else if (childrenToUse !== null) {
            var mountImages = this.mountChildren(childrenToUse, transaction, context);
            if (var i = 0; i < mountImages.length; i++) {
                DOMLazyTree.queueChild(lazyTree, mountImages[i]);
            }
        }
    }
}
```

判断当前节点的`dangerouslySetInnerHTML`属性、孩子节点是否为文本和其他节点分别调用`DOMLazyTree`的`queueHTML`、`queueText`、`queueChild`。

```js
function DOMLazyTree (node) {
    return {
        node: node,
        children: [],
        html: null,
        text: null,
        toString: toString
    };
}

function queueChild(parentTree, childTree) {
    if (enableLazy) {
        parentTree.children.push(childTree);
    } else {
        parentTree.node.appendChild(childTree.node);
    }
}

function queueHTML (tree, html) {
    if (enableLazy) {
        this.html = html;
    } else {
        setInnerHTML(tree.node, html);
    }
}

function queueText (tree, text) {
    if (enableLazy) {
        this.text = text;
    } else {
        setTextContent(tree.node, text);
    }
}
```

可以发现：`DOMLazyTree`实际上是一个包裹对象，`node`属性中存储了真实的`DOM`节点，`children`、`html`、`text`分别存储孩子、html节点和文本节点。

它提供了几个方法用于插入孩子、`html`以及文本节点，这些插入都是有条件限制的，当`enableLazy`属性为`true`时，这些孩子、`html`以及文本节点会被插入到`DOMLazyTree`对象中，当其为`false`时会插入到真实`DOM`节点中。

```js
var enableLazy = typeof document !== 'undefined' &&
  typeof document.documentMode === 'number' ||
  typeof navigator !== 'undefined' &&
  typeof navigator.userAgent === 'string' &&
  /\bEdge\/\d/.test(navigator.userAgent);
```

可见：`enableLazy`是一个变量，当前浏览器是`IE`或`Edge`时为`true`。

在`IE（8-11）`和`Edge`浏览器中，一个一个插入无子孙的节点，效率要远高于插入一整个序列化完整的节点树。

所以`lazyTree`主要解决的是在`IE（8-11）`和`Edge`浏览器中插入节点的效率问题，在后面的过程4我们会分析到：若当前是`IE`或`Edge`，则需要递归插入`DOMLazyTree`中缓存的子节点，其他浏览器只需要插入一次当前节点，因为他们的孩子已经被渲染好了，而不用担心效率问题。

`ReactCompositeComponent`，其内部主要做了以下几步：

- 处理`props`、`context`等变量，调用构造函数创建组件实例
- 判断是否为无状态组件，处理`state`
- 调用`performInitialMount`生命周期，处理子节点，获取`markup`。
- 调用`componentDidMount`生命周期

在`performInitialMount`函数中，首先调用了`componentWillMount`生命周期，由于自定义的`React`组件并不是一个真实的DOM，所以在函数中又调用了孩子节点的`mountComponent`。这也是一个递归的过程，当所有孩子节点渲染完成后，返回`markup`并调用`componentDidMount`。

**过程4：渲染html**

在`mountComponentIntoNode`函数中调用将上一步生成的`markup`插入`container`容器。

在首次渲染时，`_mountImageIntoNode`会清空`container`的子节点后调用`DOMLazyTree.insertTreeBefore`：

```js
var insertTreeBefore = function (parentNode, tree, referenceNode) {
    // 判断是否为fragment或者<object>插件
    if (tree.node.nodeType === DOCUMENT_FRAGMENT_NODE_TYPE ||
       tree.node.nodeType === ELEMENT_NODE_TYPE &&
       tree.node.nodeName.toLowerCase() === 'object' &&
       (tree.node.namespaceURI == null || tree.node.namespaceURI === DOMNamespace.html)) {
        insertTreeChildren(tree);
        parentNode.insertBefore(tree.node, referenceNode);
    } else {
        parentNode.insertBefore(tree.node, referenceNode);
        insertTreeChildren(tree);
    }
}
```

判断是否为`fragment`节点或者`<object>`插件：

- 如果是以上两种，首先调用`insertTreeChildren`将此节点的孩子节点渲染到当前节点上，再将渲染完的节点插入到`html`
- 如果是其他节点，先将节点插入到插入到`html`，再调用`insertTreeChildren`将孩子节点插入到`html`。
- 若当前不是`IE`或`Edge`，则不需要再递归插入子节点，只需要插入一次当前节点。

因为类似`fragment`这种节点是不会渲染的。

```js
function insertTreeChildren (tree) {
    if (!enableLazy) {
        // 不是IE或者EDGE
        return;
    }
    var node = tree.node;
    var children = tree.children;
    if (children.length) {
        // 递归渲染子节点
        for (var i = 0; i < children.length; i++) {
            insertTreeBefore(node, children[i], null);
        }
    } else if (tree.html != null) {
        // 渲染html节点
        setInnerHTML(node, tree.html);
    } else if (tree.text != null) {
        // 渲染文本节点
        setTextContent(node, tree.text);
    }
}
```

- 判断不是`IE`或`bEdge`时`return`
- 若`children`不为空，递归`insertTreeBefore`进行插入
- 渲染html节点
- 渲染文本节点

## 虚拟DOM原理、特性总结

### React组件的渲染流程

- 使用`React.createElement`或`JSX`编写`React`组件，实际上所有的`JSX`代码最后都会转换成`React.createElement(...)`，`Babel`帮助我们完成了这个转换的过程。
- `createElement`函数对`key`和`ref`等特殊的`props`进行处理，并获取`defaultProps`对默认`props`进行赋值，并且对传入的孩子节点进行处理，最终构造成一个`ReactElement`对象（所谓的虚拟`DOM`）。
- `ReactDOM.render`将生成好的虚拟`DOM`渲染到指定容器上，其中采用了批处理、事务等机制并且对特定浏览器进行了性能优化，最终转换为真实`DOM`。

### 虚拟DOM的组成

即`ReactElement`element对象，我们的组件最终会被渲染成下面的结构：

- `type`：元素的类型，可以是原生html类型（字符串），或者自定义组件（函数或`class`）
- `key`：组件的唯一标识，用于`Diff`算法，下面会详细介绍
- `ref`：用于访问原生`dom`节点
- `props`：传入组件的`props`，`chidren`是`props`中的一个属性，它存储了当前组件的孩子节点，可以是数组（多个孩子节点）或对象（只有一个孩子节点）
- `owner`：当前正在构建的`Component`所属的`Component`
- `self`：（非生产环境）指定当前位于哪个组件实例
- `_source`：（非生产环境）指定调试代码来自的文件(`fileName`)和代码行数(`lineNumber`)

### 防止XSS

`ReactElement`对象还有一个`$$typeof`属性，它是一个`Symbol`类型的变量`Symbol.for('react.element')`，当环境不支持`Symbol`时，`$$typeof`被赋值为`0xeac7`。

这个变量可以防止`XSS`。如果你的服务器有一个漏洞，允许用户存储任意`JSON`对象， 而客户端代码需要一个字符串，这可能为你的应用程序带来风险。`JSON`中不能存储`Symbol`类型的变量，而`React`渲染时会把没有`$$typeof`标识的组件过滤掉。

### 批处理和事务

`React`在渲染虚拟`DOM`时应用了批处理以及事务机制，以提高渲染性能。

### 针对性的性能优化

在`IE（8-11）`和`Edge`浏览器中，一个一个插入无子孙的节点，效率要远高于插入一整个序列化完整的节点树。

`React`通过`lazyTree`，在`IE（8-11）`和`Edge`中进行单个节点依次渲染节点，而在其他浏览器中则首先将整个大的`DOM`结构构建好，然后再整体插入容器。

并且，在单独渲染节点时，`React`还考虑了`fragment`等特殊节点，这些节点则不会一个一个插入渲染。

### 虚拟DOM事件机制

`React`自己实现了一套事件机制，其将所有绑定在虚拟`DOM`上的事件映射到真正的`DOM`事件，并将所有的事件都代理到`document`上，自己模拟了事件冒泡和捕获的过程，并且进行统一的事件分发。

`React`自己构造了合成事件对象`SyntheticEvent`，这是一个跨浏览器原生事件包装器。 它具有与浏览器原生事件相同的接口，包括`stopPropagation()`和`preventDefault()`等等，在所有浏览器中他们工作方式都相同。这抹平了各个浏览器的事件兼容性问题。

上面只分析虚拟`DOM`首次渲染的原理和过程，当然这并不包括虚拟 `DOM`

