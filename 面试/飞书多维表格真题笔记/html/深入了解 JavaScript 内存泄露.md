# 深入了解 JavaScript 内存泄露

> **针对浏览器的 JavaScript 脚本，Node.js 大同小异**

## 内存生命周期

内存也是有**生命周期**的，不管什么程序语言，一般可以按顺序分为三个周期：

- 分配期

  分配所需要的内存

- 使用期

  使用分配到的内存（读、写）

- 释放期

  不需要时将其释放和归还

内存分配 -> 内存使用 -> 内存释放。

## 什么是内存泄漏？

如果内存不需要时，没有经过生命周期的**释放期**，那么就存在**内存泄漏**。

内存泄漏简单理解：无用的内存还在占用，得不到释放和归还。比较严重时，无用的内存会持续递增，从而导致整个系统卡顿，甚至崩溃。

## JavaScript 内存管理机制

JavaScript是在创建变量（对象，字符串等）时自动进行了分配内存，并且在不使用它们时“自动”释放。 释放的过程称为垃圾回收。

JavaScript 内存管理机制和内存的**生命周期**是一一对应的。首先需要**分配内存**，然后**使用内存**，最后**释放内存**。

其中 JavaScript 语言**不需要程序员手动**分配内存，绝大部分情况下也不需要手动释放内存，对 JavaScript 程序员来说通常就是使用内存（即使用变量、函数、对象等）。

### 内存分配

JavaScript 定义变量就会自动分配内存的。**我们只需了解 JavaScript 的内存是自动分配的就足够了**。

### 内存使用

使用值的过程实际上是对分配内存进行**读取与写入**的操作。读取与写入可能是写入一个变量或者一个对象的属性值，甚至传递函数的参数。

### 内存回收

前端界一般称**垃圾内存回收**为 `GC`

**内存泄漏一般都是发生在这一步，JavaScript 的内存回收机制虽然能回收绝大部分的垃圾内存，但是还是存在回收不了的情况，如果存在这些情况，需要我们手动清理内存。**

## JavaScript 的垃圾内存的两种回收方式

#### 引用计数垃圾收集

这是最初级的垃圾收集算法。此算法把“对象是否不再需要”简化定义为“**对象有没有其他对象引用到它**”。如果没有引用指向该对象（零引用），对象将被垃圾回收机制回收。

ES6 把**引用**有区分为**强引用**和**弱引用**，这个目前只有再 Set 和 Map 中才有。

**强引用**才会有**引用计数**叠加，只有引用计数为 0 的对象的内存才会被回收，所以一般需要手动回收内存（手动回收的前提在于**标记清除法**还没执行，还处于当前执行环境）。

而**弱引用**没有触发**引用计数**叠加，只要引用计数为 0，弱引用就会自动消失，无需手动回收内存。

#### 标记清除法

当变量进入执行环境时标记为“进入环境”，当变量离开执行环境时则标记为“离开环境”，被标记为“进入环境”的变量是不能被回收的，因为它们正在被使用，而标记为“离开环境”的变量则可以被回收

环境可以理解为我们的作用域，但是全局作用域的变量只会在页面关闭才会销毁。

## JavaScript 内存泄漏的一些场景

**在执行环境中，没离开当前执行环境，还没触发标记清除法。**

### 意外的全局变量

在 eslint 帮助下，这种场景现在基本没人会犯了，eslint 会直接报错

### 被遗忘的计时器

### 被遗忘的事件监听器

### 被遗忘的 ES6 Set 成员

```ts
let map = new Set();
let value = { test: 22};
map.add(value);

value= null;

/** 不会泄露的写法 */
let map = new Set();
let value = { test: 22};
map.add(value);

map.delete(value);
value = null;

/** weakset 弱引用 */
let map = new WeakSet();
let value = { test: 22};
map.add(value);

value = null;
```

### 被遗忘的 ES6 Map 键名

类似 set。

### 被遗忘的订阅发布事件监听器

### 被遗忘的闭包

```ts
function closure() {
  const name = 'xianshannan'
  return () => {
    return name
      .split('')
      .reverse()
      .join('')
  }
}
const reverseName = closure()
// 这里调用了 reverseName
reverseName();
```

上面是没有内存泄漏的，因为`name` 变量是要用到的（非垃圾）。这也是从侧面反映了闭包的缺点，内存占用相对高，量多了会有性能影响。

```ts
function closure() {
  const name = 'xianshannan'
  return () => {
    return name
      .split('')
      .reverse()
      .join('')
  }
}
const reverseName = closure()
```

在当前执行环境未结束的情况下，严格来说，这样是有内存泄漏的，`name` 变量是被 `closure` 返回的函数调用了，但是返回的函数没被使用，这个场景下 `name` 就属于垃圾内存。`name` 不是必须的，但是还是占用了内存，也不可被回收。

这种也是极端情况，很少人会犯这种低级错误。

### 脱离 DOM 的引用

每个页面上的 DOM 都是占用内存的，假设有一个页面 A 元素，我们获取到了 A 元素 DOM 对象，然后赋值到了一个变量（内存指向是一样的），然后移除了页面的 A 元素，如果这个变量由于其他原因没有被回收，那么就存在内存泄漏。

## 如何发现内存泄漏？

内存泄漏时，内存一般都是会周期性的增长，我们可以借助谷歌浏览器的开发者工具进行判别。

### 第一步：确定是否是内存泄漏问题

访问上面的代码页面，打开谷歌开发者工具，切换至 **Performance** 选项，勾选 `Memory` 选项。

在页面上点击**运行按钮**，然后在开发者工具上面点击左上角的录制按钮，10 秒后在页面上点击**停止按钮**，5 秒后停止内存录制。

可以使用内存走势图判断当前页面是否有内存泄漏。

### 第二步：查找内存泄漏出现的位置

上一步确认是内存泄漏问题后，我们继续利用谷歌开发者工具进行问题查找。

访问上面的代码页面，打开谷歌开发者工具，切换至 **Memory** 选项。页面上点击运行按钮，然后点击开发者工具左上角录制按钮，录制完成后继续点击录制，直到录制完三个为止。然后点击页面的停止按钮，再连续录制 3 次内存（不要清理之前的录制）。

第二步的主要目的来了，记录 JavaScript 堆内存才是内存录制的主要目的，我们可以看到哪个堆占用的内存更高。

