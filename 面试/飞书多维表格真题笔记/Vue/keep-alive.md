# keep-alive

它是我们日常开发中经常使用的组件，我们在不同组件间切换时，经常要求保持组件的状态，以避免重复渲染组件造成的性能损耗。

### 从模板编译到生成vnode

第一个疑问便是：内置组件和普通组件在编译过程有区别吗？答案是没有的，不管是内置的还是用户定义组件，本质上组件在模板编译成`render`函数的处理方式是一致的。

最终针对`keep-alive`的`render`函数的结果如下：

```js
with(this){···_c('keep-alive',{attrs:{"include":"child2"}},[_c(chooseTabs,{tag:"component"})],1)}
```

有了`render`函数，接下来从子开始到父会执行生成`Vnode`对象的过程，`_c('keep-alive'···)`的处理，会执行`createElement`生成组件`Vnode`,其中由于`keep-alive`是组件，所以会调用`createComponent`函数去创建子组件`Vnode`。

这个环节和创建普通组件`Vnode`不同之处在于，`keep-alive`的`Vnode`会剔除多余的属性内容，**由于`keep-alive`除了`slot`属性之外，其他属性在组件内部并没有意义，例如`class`样式，`<keep-alive clas="test"></keep-alive>`等，所以在`Vnode`层剔除掉多余的属性是有意义的。而`<keep-alive slot="test">`的写法在2.6以上的版本也已经被废弃。**

```js
// 创建子组件Vnode过程
function createComponent(Ctordata,context,children,tag) {
    // abstract是内置组件(抽象组件)的标志
    if (isTrue(Ctor.options.abstract)) {
        // 只保留slot属性，其他标签属性都被移除，在vnode对象上不再存在
        var slot = data.slot;
        data = {};
        if (slot) {
            data.slot = slot;
        }
    }
}
```

### 初次渲染

`keep-alive`之所以特别，是因为它不会重复渲染相同的组件，只会利用初次渲染保留的缓存去更新节点。所以为了全面了解它的实现原理，我们需要从`keep-alive`的首次渲染开始说起。

##### 流程图

![](./images/keep-alive.png)

和渲染普通组件相同的是，`Vue`会拿到前面生成的`Vnode`对象执行真实节点创建的过程，也就是熟悉的`patch`过程，`patch`执行阶段会调用`createElm`创建真实`dom`，在创建节点途中，`keep-alive`的`vnode`对象会被认定是一个组件`Vnode`，因此针对组件`Vnode`又会执行`createComponent`函数，它会对`keep-alive`组件进行初始化和实例化。

```js
function createComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
      var i = vnode.data;
      if (isDef(i)) {
        // isReactivated用来判断组件是否缓存。
        // 存在组件实例，并且keepAlive返回为truthy
        var isReactivated = isDef(vnode.componentInstance) && i.keepAlive;
        if (isDef(i = i.hook) && isDef(i = i.init)) {
            // 执行组件初始化的内部钩子 init
          i(vnode, false /* hydrating */);
        }
        if (isDef(vnode.componentInstance)) {
          // 其中一个作用是保留真实dom到vnode中
          initComponent(vnode, insertedVnodeQueue);
          insert(parentElm, vnode.elm, refElm);
          // 如果存在缓存
          if (isTrue(isReactivated)) {
            reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm);
          }
          return true
        }
      }
    }
```

`keep-alive`组件会先调用内部钩子`init`方法进行初始化操作，我们先看看`init`过程做了什么操作。

```js
// 组件内部钩子
var componentVNodeHooks = {
    init: function init (vnode, hydrating) {
      if (
        vnode.componentInstance &&
        !vnode.componentInstance._isDestroyed &&
        vnode.data.keepAlive
      ) {
        // keep-alive components, treat as a patch
        var mountedNode = vnode; // work around flow
        componentVNodeHooks.prepatch(mountedNode, mountedNode);
      } else {
        // 将组件实例赋值给vnode的componentInstance属性
        var child = vnode.componentInstance = createComponentInstanceForVnode(
          vnode,
          activeInstance
        );
        child.$mount(hydrating ? vnode.elm : undefined, hydrating);
      }
    },
    // 后面分析
    prepatch： function() {}
}
```

第一次执行，很明显组件`vnode`没有`componentInstance`属性，`vnode.data.keepAlive`也没有值，所以会**调用`createComponentInstanceForVnode`方法进行组件实例化并将组件实例赋值给`vnode`的`componentInstance`属性，** 最终执行组件实例的`$mount`方法进行实例挂载。

`createComponentInstanceForVnode`就是组件实例化的过程，而组件实例化从系列的第一篇就开始说了，无非就是一系列选项合并，初始化事件，生命周期等初始化操作。

```js
function createComponentInstanceForVnode (vnode, parent) {
    var options = {
      _isComponent: true,
      _parentVnode: vnode,
      parent: parent
    };
    // 内联模板的处理，忽略这部分代码
    ···
    // 执行vue子组件实例化
    return new vnode.componentOptions.Ctor(options)
}
```

##### 内置组件选项

我们在使用组件的时候经常利用对象的形式定义组件选项，包括`data,method,computed`等，并在父组件或根组件中注册。`keep-alive`同样遵循这个道理，内置两字也说明了`keep-alive`是在`Vue`源码中内置好的选项配置，并且也已经注册到全局。

```js
// keepalive组件选项
  var KeepAlive = {
    name: 'keep-alive',
    // 抽象组件的标志
    abstract: true,
    // keep-alive允许使用的props
    props: {
      include: patternTypes,
      exclude: patternTypes,
      max: [String, Number]
    },

    created: function created () {
      // 缓存组件vnode
      this.cache = Object.create(null);
      // 缓存组件名
      this.keys = [];
    },

    destroyed: function destroyed () {
      for (var key in this.cache) {
        pruneCacheEntry(this.cache, key, this.keys);
      }
    },

    mounted: function mounted () {
      var this$1 = this;
      // 动态include和exclude
      // 对include exclue的监听
      this.$watch('include', function (val) {
        pruneCache(this$1, function (name) { return matches(val, name); });
      });
      this.$watch('exclude', function (val) {
        pruneCache(this$1, function (name) { return !matches(val, name); });
      });
    },
    // keep-alive的渲染函数
    render: function render () {
      // 拿到keep-alive下插槽的值
      var slot = this.$slots.default;
      // 第一个vnode节点
      var vnode = getFirstComponentChild(slot);
      // 拿到第一个组件实例
      var componentOptions = vnode && vnode.componentOptions;
      // keep-alive的第一个子组件实例存在
      if (componentOptions) {
        // check pattern
        //拿到第一个vnode节点的name
        var name = getComponentName(componentOptions);
        var ref = this;
        var include = ref.include;
        var exclude = ref.exclude;
        // 通过判断子组件是否满足缓存匹配
        if (
          // not included
          (include && (!name || !matches(include, name))) ||
          // excluded
          (exclude && name && matches(exclude, name))
        ) {
          return vnode
        }

        var ref$1 = this;
        var cache = ref$1.cache;
        var keys = ref$1.keys;
        var key = vnode.key == null
          ? componentOptions.Ctor.cid + (componentOptions.tag ? ("::" + (componentOptions.tag)) : '')
          : vnode.key;
          // 再次命中缓存
        if (cache[key]) {
          vnode.componentInstance = cache[key].componentInstance;
          // make current key freshest
          remove(keys, key);
          keys.push(key);
        } else {
        // 初次渲染时，将vnode缓存
          cache[key] = vnode;
          keys.push(key);
          // prune oldest entry
          if (this.max && keys.length > parseInt(this.max)) {
            pruneCacheEntry(cache, keys[0], keys, this._vnode);
          }
        }
        // 为缓存组件打上标志
        vnode.data.keepAlive = true;
      }
      // 将渲染的vnode返回
      return vnode || (slot && slot[0])
    }
  };
```

`keep-alive`选项跟我们平时写的组件选项还是基本类似的，唯一的不同是`keep-ailve`组件没有用`template`而是使用`render`函数。`keep-alive`本质上只是存缓存和拿缓存的过程，并没有实际的节点渲染，所以使用`render`处理是最优的选择。

##### 缓存vnode

`keep-alive`在执行组件实例化之后会进行组件的挂载。而挂载`$mount`又回到`vm._render()`，`vm._update()`的过程。由于`keep-alive`拥有`render`函数，所以我们可以直接将焦点放在`render`函数的实现上。

首先是获取`keep-alive`下插槽的内容，也就是`keep-alive`需要渲染的子组件,例子中是`chil1 Vnode`对象，源码中对应`getFirstComponentChild`函数

```js
  function getFirstComponentChild (children) {
    if (Array.isArray(children)) {
      for (var i = 0; i < children.length; i++) {
        var c = children[i];
        // 组件实例存在，则返回，理论上返回第一个组件vnode
        if (isDef(c) && (isDef(c.componentOptions) || isAsyncPlaceholder(c))) {
          return c
        }
      }
    }
  }
```

判断组件满足缓存的匹配条件，在`keep-alive`组件的使用过程中，`Vue`源码允许我们是用`include, exclude`来定义匹配条件，`include`规定了只有名称匹配的组件才会被缓存，`exclude`规定了任何名称匹配的组件都不会被缓存。

拿到子组件的实例后，我们需要先进行是否满足匹配条件的判断,**其中匹配的规则允许使用数组，字符串，正则的形式。**

```js
var include = ref.include;
var exclude = ref.exclude;
// 通过判断子组件是否满足缓存匹配
if (
    // not included
    (include && (!name || !matches(include, name))) ||
    // excluded
    (exclude && name && matches(exclude, name))
) {
    return vnode
}

// matches include和exclude支持数组，字符串和正则
function matches (pattern, name) {
    // 允许使用数组['child1', 'child2']
    if (Array.isArray(pattern)) {
        return pattern.indexOf(name) > -1
    } else if (typeof pattern === 'string') {
        // 允许使用字符串 child1,child2
        return pattern.split(',').indexOf(name) > -1
    } else if (isRegExp(pattern)) {
        // 允许使用正则 /^child{1,2}$/g
        return pattern.test(name)
    }
    /* istanbul ignore next */
    return false
}
```

如果组件不满足缓存的要求，则直接返回组件的`vnode`,不做任何处理，此时组件会进入正常的挂载环节。

