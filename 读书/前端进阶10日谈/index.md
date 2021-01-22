## 1

元素的**class属性**可以用来定义元素的某种业务状态或者业务模式，然后通过CSS的类选择器根据业务需求将元素设置成对应的样式，从而避免了将这些本该由CSS完成的任务交由JS完成。（使用类名切换样式可读性更佳，一些简单的图形或者文字可以用伪元素）不过需要注意的是完全使用CSS去做，可读性可能就会很差，比如用label + checkbox实现完全使用css切换样式。

## 2

修改ul列表的样式（前面的点），可以使用 list-style 指定图片链接 - `list-style: url()`。但是这样消耗网络请求并且不能很好的设置大小。可以改用伪元素和 **border** 实现列表前面的小三角形。CSS的 border 能够实现的图案还有很多，比如可以使用上下两个三角形重叠实现六芒星团。

- 在一个项目里，通常HTML结构保持越简单，项目的JS代码也会相应简洁，代码的可维护性就会大大增强。所以，**保持HTML结构简单**，尽量不增加冗余标签，是每个前端工程师必须要思考并努力去做到的。

- 纯CSS饼图：可以使用border实现（使用border的好处就是可以很好的设置左右异色的图案，不用增加元素，但是问题是使用border一般就没有空间加入内容了，所以可以用线性渐变背景代替），使用border实现一个异色的圆，然后伪元素实现一个一半透明的圆，旋转伪元素就可以实现百分比饼图了，但是需要在旋转超过180度的时候更换伪元素的颜色。

  **技巧**：饼图中，百分比不是写死的话，需要使用内联操作伪元素的样式（当然也可以用伪元素当背景，操作的就不是伪元素了，直接修改背景渐变轴），但是伪元素是不可以被内联样式操作的，但是伪元素会继承animation属性，所以我们可以通过`animation-delay`属性的内联样式来控制它们。

- **CSS自定义属性**：`--*`来声明变量名，在需要用到的地方使用 `var(--*)`方式动态地引入这些值，这个方式现在在除了IE之外的浏览器上基本上运行良好。

## 封装性

函数体内部不应该有完全来自外部环境的变量，除非这个函数不打算复用（可以改为参数传入）

- **数据抽象就是把数据定义并聚合成能被过程处理的对象，交由特定的过程处理。**简单来说就是数据的结构化，将数据结构化传入函数进行解析然后处理。数据抽象的代码可以适应不同状态和时间的业务需求，我们只需要修改数据抽象即可。

- 改变外部状态的部分叫做代码的**副作用(side-effect)**。我们可以考虑**把函数体内部有副作用的代码剥离出来**，这往往能提升函数的通用性、稳定性和可测试性。（例如我们可以把副作用提取出，作为一个函数）

  > 没有this的情况下或者不需要this的情况下，使用bind，我们可以类似`updateState.bind(null, i + 1)`绑定一个null。

## 可读性

使用`async/await`能够把异步的递归简化为更容易让人阅读和理解的循环，用 promise 包裹 timeout 然后使用`async/await`。

## 正确性

比方说，需要获得一个随机数，需要保证取随机数时候的公平性。

> splice 的复杂度是 o(n2) ，可以用其他方法代替的情况下，不使用可以达到优化效果。

## 过程抽象

- **只执行一次**：点击移除一个DOM的时候，如果连续快速的点击可能会出现报错，因为DOM已经移除了，所以我们需要保证点击只执行一次。
  1. 可以通过`addEventListener`的`once`参数实现
  2. 在click事件处理函数中，通过`target.removeEventListener('click', f);`将处理函数本身从事件监听中移除。
  3. 也可以使用元素的`disabled`属性来实现目标元素只被点击一次的效果
- 把“只执行一次“这个需求从事件处理函数中剥离出来。这个过程我们称为**过程抽象**。将“只执行一次”的过程抽象出来后，不论是我们的事件处理函数还是表单提交函数都只需要关注业务逻辑。（只执行一次这个需求可以用闭包实现，类似防抖节流）
- `once`、`debounce`、`throttle`这些函数装饰器有一个共同点：它们的参数是函数，返回值也是函数。我们把这种参数和返回值都是函数的函数，叫做**高阶函数**。

## 函数拦截器

假设一个工具库要废弃一些API，肯定不能直接废弃，而是调用前给用户一个警告提示`console.warn`。但是我们不可能说直接在API代码里加入错误打印，如何可以不改动原来库中API，又可以在这些废弃的API调用前显示提示信息呢？我们**可以用一个高阶函数修饰原本的API，然后返回修饰后的高阶函数**。

## 纯函数

一个严格的纯函数，是具有**确定性**、**无副作用**，**幂等**的特点。也就是说，纯函数不依赖外部环境，也不改变外部环境，不管调用几次，不管什么时候调用，只要参数确定，返回值就确定。这样的函数，就是纯函数。纯函数提升了代码的可测试性和可维护性。

## 高阶函数的范式

```ts
function HOF0(fn) {
  return function(...args) {
    return fn.apply(this, args);
  }
}
```

## 异步

- 几个异步操作同时需要维护一个状态，可以使用一个全局变量，但是维护一个全局变量不仅增加了代码的复杂度，也使得模块间的耦合更高。

  > **细节：**
  >
  > :empty选择器选择每个没有任何子级的元素（包括文本节点）。使用这个选择器和伪元素（content）可以实现无文本时候的默认兜底文本，不需要JS判断是否为空然后渲染。除了ie8以下的浏览器都支持这个选择器。
  >
  > 
  >
  > slice 第二个参数如果为负数，-1 指字符串的最后一个字符的位置，-2 指倒数第二个字符，以此类推。所以使用`slice(0, -1)`可以去除最后一位字符。

- 使用循环 + async（运用条件判断break中断串行操作）可以实现串行操作

- 可以使用promise来实现异步信号处理，使用resolve来传递状态。

## 组件封装

- 设计HTML结构
- 设计API：考虑需求设计出API。
- 设计用户控制流程

> **细节**：
>
> `.parent:hover .children`可以设置父元素hover的时候子元素的样式
>
> 文章中实现的轮播图自动播放，在用户操作的时候都需要先执行停止定时器然后操作完成继续执行定时器，包括重新开始轮播的时候也需要先执行停止方法保证轮播已停止。
>
> 这里slide自定义了一个事件，好处是抽出插件的时候，我们可以通过自定义事件进行通信。

在前端UI组件中，提升可扩展性的基本思路，是**插件化**。对于图片轮播组件来说，它的插件化可以是将用户控制组件从Slider组件中剥离出来，做成插件，这样才能提高Slider组件的可扩展性。

在文章中给轮播图定义了一个注册插件方法，会将轮播图组件的实例传给插件们，然后插件获得实例上的container。这种将依赖对象传入插件初始化函数的方式，叫做**依赖注入**。**依赖注入**是一种组件/插件解耦合的基本思路，在UI设计中经常被使用。

之后定义了组件和插件的渲染和事件绑定方法，然后抽出了一个Component类，通过继承这个类可以实现规范组件。

# 设计模式

设计模式简单来说就是解决在一个特定上下文中一个问题的一种解决方案。

### 抽象行为模式

抽象行为的模式允许一个组件可以灵活的**组合或卸载**多个行为，且互不冲突。将通用的代码（例如事件绑定的代码）抽象出来，然后具体实现组合（把事件方法传入绑定的抽象方法里实现绑定）。

### 中间人模式

例如观察者订阅者模式，由一个中间人统一管理消息。

> 文章实例中，使用了防抖作为延时，说明防抖做延时是很常见的方法。



------

## 动画

两种最常用的动画模式：

- 固定轨迹的动画

  1. 设计轨迹方程，找出动画变量和时间的关系
  2. 确定动画周期和与动画变量对应的CSS属性
  3. 通过`requestAnimationFrame`API，在浏览器重绘周期中更新动画变量，以实现我们需要的动画效果（实例中🌎公转的动画，可以使用改变transform-origin到☀️中心，然后使用transform的旋转动画）

  > chrome浏览器在处理emoji文字的`transform`属性时会产生抖动的bug。要解决这个问题，我们可以将`rotate`换成`rotate3d`

  固定轨迹动画可以抽象为一个由**动画周期(T)**、**动画执行时间(t)**，以及**时间与属性值的映射函数(progress)** 共同决定的模型。

- 连续的动画

  1. 将连续的动画分解为**若干个固定轨迹的动画**
  2. 为每个阶段的动画设计轨迹方程，找出动画变量和时间的关系
  3. 确定每个阶段的**动画周期**（duration）和与动画变量对应的CSS属性
  4. 利用**异步**的方式（Promise）连接每个阶段的动画，形成一个连续的动画效果

### 弹跳小球

- `x**n` 相当于 `Math.pow(x,n)` 即x的n次方。
- 弹起动画是在自由落体动画结束之后，所以弹起动画必须等待自由落体动画执行结束后才能开始执行。这涉及到一个异步的过程，需要对动画过程进行一下简单的封装，让它实现一个`asyn/await`的过程。

### 插值

在固定轨迹动画模型里，知道T、t以及progress，我们就能唯一确定动画元素target在t时刻的属性值。其中比较复杂的是progress（**时间与属性值的映射函数**），我们可以对它进行规范：progress可以由起始值（start）、结束值（end）、以及插值函数（interpolate）确定。

* 也就是说插值函数就是描述在起始和结束之间取值的方法。

### 缓动

**缓动函数(easing)**：指定动画效果在执行时的速度，使其看起来更加真实。缓动函数可以复用，所以可以从插值方法里抽象出缓动函数。CSS里是存在缓动函数的，

在较新的浏览器环境中，提供了JavaScript原生的动画API，叫做[Web Animation API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)。这是一个目前还处在草案阶段的新特性，仅被部分较新的浏览器所支持。

Web Animation API 为DOM元素提供了原生的animate方法，它接受keyframes和options两个参数，能够用JS实现和CSS基本上一致的关键帧动画：

```js
sphere.animate([
  {top: '400px'},
  {top: '100px'},
], {
  duration: 2000,
  easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  fill: 'forwards',
});
```

上面的代码和前一个例子实现的效果一致，但是不需要依赖我们自己实现的动画方法，直接用原生的`.animate`方法即可。

## 特殊的动画效果

### 要让元素从上往下，或者从左往右渐显出来，要如何实现呢

可以用伪元素遮盖住元素内容，然后用动画改变伪元素的宽或高：

```css
#content {
  position: relative;
  display: inline-block;
  padding: 5px;
  border: solid 1px;
  font-size: 1.5rem;
}

#content::after {
  position: absolute;
  top: -1px;
  right: -1px;
  width: calc(100% + 2px);
  height: calc(100% + 2px);
  content: ' ';
  background: white;
  animation: slide 2s ease-in forwards;
}

@keyframes slide {
  to {width: 0};
}
```

#### clip-path属性

上面这个方法有点不够完美，主要是我们给`after`伪元素设置了一个白色的背景，如果父元素的背景不是白色，或者改变了，我们就需要修改对应的属性值。

`clip-path` 属性可以创建一个只有元素的部分区域可以显示的剪切区域。区域内的部分显示，区域外的隐藏。`clip-path`支持CSS动画。

#### mask属性

更复杂的渐显动画可以使用CSS遮罩：`mask`属性，不过这是一个非标准属性，目前需要加`-webkit-`前缀，只有Chorme和Safari等少数浏览器的新版本支持。

`mask`属性可以指定图片作为元素的遮罩，遮罩外的内容隐藏，而且我们可以把遮罩设置为渐变，所以我们就可以使用渐变遮罩来实现更复杂的渐显效果。在遮罩渐变里设置黑色为不可见，transparent 为可见。

#### 描边动画

描边动画可以通过改变SVG元素的`stroke-dasharray`和`stroke-dashoffset`两个属性来实现。

## 元编程

### 类的私有属性

在JavaScript中，类的私有属性是Stage3阶段的标准（处于实验性阶段），最新的一些浏览器如Chrome最新版本，支持原生的类私有属性。

在最新的浏览器中，我们可以在变量前加`#`，让变量变成私有属性。在较早的浏览器版本里，不支持使用原生的私有属性，这时，我们只能考虑用其他方式来实现类的私有属性。

#### 传统的私有属性约定

在许多代码库或模块，尤其是早期版本的代码库或模块中，私有属性基于约定，以下划线开头。这个并不是真正的“私有属性”，因为使用者其实如果想要访问`_foo`属性，任然能够随意访问。

#### 混淆变量名

如果要比较好地防止使用者使用私有属性，我们可以用混淆变量名（最简单就是使用随机数当变量名）的方式来防止使用者随意使用某个我们不想让使用者使用的属性。

````ts
const _foo = `_${Math.random().toString(36).slice(2, 10)}`;
class Foo {
  constructor() {
    this[_foo] = 10;
  }

  bar() {
    console.log(`Private foo is ${this[_foo]}`);
  }
}

const foo = new Foo();
foo.bar(); //Private foo is 10
````

使用者即使不知道随机的变量名，依然可以通过`Object.keys`或者`Object.entries`或者`for...in`等方法将这个属性枚举出来，所以仍然有使用这个属性的可能，我们可以通过将属性定义成不可枚举属性，来防止用户将它枚举出来：

```ts
const _foo = `_${Math.random().toString(36).slice(2, 10)}`;
class Foo {
  constructor() {
    Object.defineProperty(this, _foo, {
      value: 10,
      enumerable: false,
    });
  }

  bar() {
    console.log(`Private foo is ${this[_foo]}`);
  }
}

const foo = new Foo();
foo.bar(); //Private foo is 10
```

但是依然能在浏览器控制台中打印看到这个属性。

#### 使用Map和WeakMap

如果要让它在控制台上也看不到，我们可以使用ES5的Map方法：

```ts
const privates = new Map();
class Foo {
  constructor() {
    privates.set(this, {foo: 10, bar: 20});
  }

  bar() {
    const _ = privates.get(this);
    console.log(`Private foo is ${_.foo} and bar is ${_.bar}`);
  }
}

const foo = new Foo();
foo.bar(); //Private foo is 10 and bar is 20
```

使用Map，我们可以将私有属性完全封装在摸快内，在模块外不可能访问到，浏览器控制台上也看不到。

不过使用Map也有缺点，首先这个方法内部使用起来也不太方便，不像之前那样，直接通过`this[_foo]`就能读或写私有属性`_foo`；另外，如果是私有方法，也很麻烦，还要处理this。

```ts
const privates = new Map();
class Foo {
  constructor() {
    this.p = 2;
    privates.set(this, {foo: function() {return 10 * this.p}});
  }

  bar() {
    const _ = privates.get(this);
    console.log(`Private foo is ${_.foo.call(this)}`);
  }
}

const foo = new Foo();
foo.bar(); //Private foo is 20
```

必须通过`call`或者`apply`方法来调用`_.foo`方法，以保证这个方法中的`this`指向的是`Foo`这个对象（不然可能取得是最外部的this）。

如果用Map的话，对象引用被取消的时候，因为Map中还有该引用，从而导致对象不能被引擎回收。要解决这个问题，可以将Map用WeakMap替代。

#### 使用 Symbol

Symbol创建唯一的ID，可作为属性或者方法的key，同时，不会被`Object.keys`、`Object.entries`或者`for...in`枚举到。这样我们就能得到比混淆变量名更理想的方式，使用Symbol：

```ts
const _foo = Symbol('foo');
class Foo {
  constructor() {
    this.p = 2;
  }
  [_foo]() {
    return 10 * this.p;
  }
  bar() {
    console.log(`Private foo is ${this[_foo]()}`);
  }
}

const foo = new Foo();
foo.bar(); //Private foo is 20
```

在模块外部是没法访问到私有属性的，但是控制台上可以在对象的原型上看到一个`Symbol(foo)`属性。

如果使用者确实想要使用这个私有属性，可以使用`Object.getOwnPropertySymbols`方法获取对象上的Symbol（如果是私有方法，则要获取类的原型上的Symbol）。

```ts
const _privateFoo = Object.getOwnPropertySymbols(Foo.prototype)[0];

foo[_privateFoo](); // 20
```

留有这一种访问方式，也算是提供一种反射机制，给使用者留下一个后门，以便确实需要的时候进行访问。

在一般的情况下，我们使用`Symbol`来定义对象的私有属性和方法，是目前比较推荐的一种方式，直到原生的私有属性从Stage3成为正式的标准之前，我们还是使用Symbol来定义私有属性和方法吧。

### 访问器属性

一般来说，私有属性配合属性访问器使用

```ts
const _name = Symbol('bar');

class Foo {
  constructor(name) {
    this[_name] = `foo: ${name}`;
  }

  get name() {
    return this[_name];
  }
}
```

这样在外部它就是只读属性。它的值由内部的私有属性`this[_name]`决定。

#### 关联属性

设计对象模型的时候，尽量减少要维护的数据，数据越少，意味着模型越简单，代码的可维护性越强。可以通过**关联属性**简化对象模型中的数据。

```ts
const _name = Symbol('name');
const _birthYear = Symbol('birth-year');
const _birthMonth = Symbol('birth-month');

class Person {
  constructor({name, birthday}) {
    this[_name] = name;
    const date = new Date(birthday);
    this[_birthYear] = date.getFullYear(); // 出生年份
    this[_birthMonth] = date.getMonth() + 1; // 出生月份
  }
  
  get name() {
    return this[_name];
  }
  
  get birthday() {
    return {
      year: this[_birthYear],
      month: this[_birthMonth],
    };
  }
  
  get age() { // 根据出生年份计算age属性值
    return new Date().getFullYear() - this[_birthYear];
  }
  
  get portrait() { // 根据age属性计算portrait属性值
    if(this.age <= 18) return '少年';
    else return '成年';
  }
}
```

三个私有属性`[_name]`、`[_birthYear]`和`[_birthMonth]`，分别存储初始化的姓名、出生年和月的信息。我们用四个访问器属性来提供给使用者`name`、`birthday`、`age`、`portrait`四个对象属性，它们都是只读的。其中，`age`和`portrait`属性就是**关联属性**，它们的值都是根据`birthday`属性值的变化而变化。

## 监听属性改变

**数据驱动UI**或者**响应式数据绑定**

```ts
// 中间人
class PubSub {
  constructor() {
    this.subscribers = {};
  }

  /*
    @type 消息类型，如scroll
    @receiver 订阅者
    @fn 响应消息的处理函数
  */
  sub(type, receiver, fn) {
    this.subscribers[type] = this.subscribers[type] || [];
    this.subscribers[type].push(fn.bind(receiver));
  }

  /*
    @type 消息类型
    @sender 派发消息者
    @data 数据，比如状态数据
  */
  pub(type, sender, data) {
    const subscribers = this.subscribers[type];
    subscribers.forEach((subscriber) => {
      subscriber({type, sender, data});
    });
  }
}
```

其实就是 Vue 2.0 的响应式原理，使用属性访问器setter和getter设置订阅和监听。而且如果是监听数组，监听消耗会十分大，所以3.0使用了更加高效的proxy代替。

### 使用代理Proxy

Proxy是ES6之后内置的JavaScript标准对象，它可以代理一个目标对象，以拦截该目标对象的**基本操作**。

Proxy对象不能被直接继承，可以通过将原型设为代理对象。

```ts
let p = new Person({name: '张三', birthday: '1999-12'});

function watch(obj, onchange) {
  /**
   * 这个代理对象表示拦截persion对象的属性赋值操作，在属性赋值操作后，都执行一次onchange方法。
   * 这样就无需派发消息的中间人，但又实现了数据驱动UI的效果。
   */
  return new Proxy(obj, {
    set(target, name, value) {
      Reflect.set(target, name, value); // 调用person对象的原始操作(即属性赋值操作)
      onchange(target, {[name]: value});
      return true; // 表示成功
    },
  });
}

p = watch(p, (subject) => {
  updatePerson(subject); // 更新到DOM
});
```

Proxy还有很多拦截对象行为的方式，利用这些方式可以改变或扩展JavaScript代码的语义。

通常情况下，我们把改变或扩展编程语言语义的行为，叫做**元编程**(Meta-Programming)。

```ts
const text = `君喻教育。
君子之教，喻也。
http://junyux.com`;

// 这里使用字符串的装箱操作（即，将原始类型string包装成对象String），因为Proxy的第一个参数必须是一个对象。
const p = new Proxy(new String(text), {
  has: function(target, name) {
     return target.indexOf(name) >= 0;
  }
});

console.log('君喻' in p); // true
console.log('君子之教' in p); // true
console.log('junyux.com' in p); // true
console.log('foo' in p); // false
```

通过Proxy改变了对象的`in`操作符的语义，将它从判断是否是对象上的属性，变为了判断字符串是否在被代理的文本内容中。

**改变对象get访问器的语义：**

```ts
const config = {...}

// 添加新的内容

config.db = config.db || {};
config.db.mysql = config.db.mysql || {};
config.db.mysql.server = config.db.mysql.server || {};
config.db.mysql.server.connectCount = 2;

/** 使用proxy代替 */
function Configure(config = {}) {
  return new Proxy(config, {
    get(target, key, receiver) {
      if(!Reflect.has(target, key) && key !== 'toJSON') { // 如果key不存在，创建空对象并返回
        const ret = {}
        Reflect.set(target, key, ret)
        return new Configure(ret)
      } else {
        const ret = Reflect.get(target, key)
        if(ret && typeof ret === 'object') {
          // 如果key存在，且key的值是一个对象，那么执行递归
          return new Configure(ret)
        }
        return ret // 如果key存在且不是个对象，直接返回key的值
      }
    }
  })
}

let config = new Configure();
config.db.mysql.server.connectCount = 2;
```

