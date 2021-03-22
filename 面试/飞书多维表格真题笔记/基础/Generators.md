Generator 在 C#中使用，编译器会生成一个内部类来保存上下文信息，然后将 yield return 表达式转换成 switch case，通过状态机模式实现 yield 关键字的特性。

### yield 关键字在 Javascript 中如何实现呢？

Javascript 执行引擎仍然是一个基于事件循环的单线程环境，当 Generator 运行的时候，它会在叫做 caller 的同一个线程中运行。执行的顺序是有序、确定的，并且永远不会产生并发。不同于系统的线程，Generator 只会在其内部用到 yield 的时候才会被挂起。

Generator 并非由引擎从底层提供额外的支持。所以我们将 Generator 视为一个语法糖，用一个辅助工具将生成器函数转换为普通的 Javascript 代码，在经过转换的代码中，有两个关键点，一是要保存函数的上下文信息，二是实现一个完善的迭代方法，使得多个 yield 表达式按序执行，从而实现 Generator 的特性。

Regenerator 工具已经实现了上述思路，借助 Regenerator 工具，我们已经可以在原生 ES5 中使用 Generator 函数。

```ts
function* example() {
  yield 1;
  yield 2;
  yield 3;
}
var iter=example();
iter.next();
```

经过转换后为

```ts
var marked0$0 = [example].map(regeneratorRuntime.mark); // regeneratorRuntime.mark(example)
function example() {
  // 返回被 regeneratorRuntime.wrap 包装的迭代器对象。
  return regeneratorRuntime.wrap(function example$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) { // next 赋值给 prev 后传给switch case
      case 0:
        context$1$0.next = 2;
        return 1;
 
      case 2:
        context$1$0.next = 4;
        return 2;
 
      case 4:
        context$1$0.next = 6;
        return 3;
 
      case 6:
      case "end":
        return context$1$0.stop();
    }
  }, marked0$0[0], this);
}
var iter = example();
iter.next();
```

上面代码 yield 表达式重写为 switch case，同时，在每个 case 中使用 context$1$0 来保存函数当前的上下文状态。

switch case 之外，迭代器函数 example 被 regeneratorRuntime.mark 包装，返回一个被 regeneratorRuntime.wrap 包装的迭代器对象。

```ts
runtime.mark = function(genFun) {
  if (Object.setPrototypeOf) {
    Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
  } else {
    genFun.__proto__ = GeneratorFunctionPrototype;
  }
  genFun.prototype = Object.create(Gp);
  return genFun;
};

// 给 example 函数设置 GeneratorFunctionPrototype 为原型。
// GeneratorFunctionPrototype 携带了 next, return, throw 等方法添加到原型上。
```

当调用 Generator 函数 example() 时，返回一个被 wrap 函数包装后的迭代器对象

```ts
runtime.wrap=function (innerFn, outerFn, self, tryLocsList) {
  // If outerFn provided, then outerFn.prototype instanceof Generator.
  var generator = Object.create((outerFn || Generator).prototype);
  var context = new Context(tryLocsList || []);
 
  // ._invoke方法统一实现了.next, .throw, .return 方法。
  generator._invoke = makeInvokeMethod(innerFn, self, context);
 
  return generator;
}
```

当调用迭代器对象 iter.next() 方法时，所以会执行_invoke 方法，而根据前面 wrap 方法代码可知，最终是调用了迭代器对象的 makeInvokeMethod 方法。

```ts
// Helper for defining the .next, .throw, and .return methods of the
// Iterator interface in terms of a single ._invoke method.
function defineIteratorMethods(prototype) {
  ["next", "throw", "return"].forEach(function(method) {
    prototype[method] = function(arg) {
      return this._invoke(method, arg);
    };
  });
}
```

makeInvokeMethod 方法内容较多，选取部分分析。首先，我们发现 Generator 将自身状态初始化为`Suspended Start`。

```ts
function makeInvokeMethod(innerFn, self, context) {
  var state = GenStateSuspendedStart;
  // 返回 invoke 函数
  return function invoke(method, arg) {
    // 当我们执行.next 方法时，实际调用的是 invoke 方法中的下面语句
		var record = tryCatch(innerFn, self, context);
    if (record.type === "normal") {
      // If an exception is thrown from innerFn, we leave state ===
      // GenStateExecuting and loop back for another invocation.
      state = context.done
        ? GenStateCompleted
        : GenStateSuspendedYield;
 
      var info = {
        value: record.arg,
        done: context.done
      };
    }
  }
}
```

tryCatch 方法中 fn 为经过转换后的 example$ 方法，arg 为上下文对象 context, 因为 invoke 函数内部对 context 的引用形成**闭包引用**，所以 context 上下文得以在迭代期间一直保持。

```ts
function tryCatch(fn, obj, arg) {
  try {
    return { type: "normal", arg: fn.call(obj, arg) };
  } catch (err) {
    return { type: "throw", arg: err };
  }
}
```

tryCatch 方法会实际调用 example$方法，进入转换后的 switch case, 执行代码逻辑。如果得到的结果是一个普通类型的值，我们将它包装成一个可迭代对象格式，并且更新 Generator 状态至 GenStateCompleted 或者 GenStateSuspendedYield。

### 总结

Regenerator 通过工具函数将 Generator 函数包装，为其添加如 next/return 等方法。同时也对返回的 Generator 对象进行包装，使得对 next 等方法的调用，最终进入由 switch case 组成的状态机模型中。除此之外，利用闭包技巧，保存 Generator 函数上下文信息。

