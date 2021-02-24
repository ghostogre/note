# call 和 apply

## 共同点

共同点是，都能够**改变函数执行时的上下文**，将一个对象的方法交给另一个对象来执行，并且是立即执行的。

**调用 call 和 apply 的对象，必须是一个函数 Function**。

## 区别

主要体现在参数的写法上:

- 第二个参数开始，可以接收任意个参数。

- apply 第二个参数，必须是数组或者类数组，它们会被转换成类数组，传入 Function 中，并且会被映射到 Function 对应的参数上。

> 类数组 arrayLike 可以通过角标进行调用，具有length属性，同时也可以通过 for 循环进行遍历。**类数组无法使用 forEach、splice、push 等数组原型链上的方法**，毕竟它不是真正的数组。

## 使用场景

### call

1. **对象的继承**。
2. **借用方法**，使用原型链上的方法。

### apply

**1、Math.max**。用它来获取数组中最大的一项。

```ts
let max = Math.max.apply(null, array);
```

同理，要获取数组中最小的一项，可以这样：

```ts
let min = Math.min.apply(null, array);
```

**2、实现两个数组合并**。在 ES6 的扩展运算符出现之前，我们可以用 Array.prototype.push来实现。

```ts
let arr1 = [1, 2, 3];
let arr2 = [4, 5, 6];

Array.prototype.push.apply(arr1, arr2);
console.log(arr1); // [1, 2, 3, 4, 5, 6]
```

# bind

bind() 方法会**创建一个新函数**。当这个新函数被调用时，bind() 的第一个参数将作为它运行时的 this，之后的一序列参数将会在传递的实参前传入作为它的参数。

当 bind 返回的函数作为构造函数的时候，bind 时指定的 this 值会失效，但传入的参数依然生效。

实现：

- 使用 apply 和 call 改变 this 的指向。
- 使用 arguments 传参。
- 

```ts
Function.prototype.bind = function (context) {
    var self = this;
    var args = Array.prototype.slice.call(arguments, 1);

  	var fNOP = function () {}; // 中转的空函数
  
    var fBound = function () {
        var bindArgs = Array.prototype.slice.call(arguments);
        // 当作为构造函数时，this 指向实例，此时结果为 true，将绑定函数的 this 指向该实例，可以让实例获得来自绑定函数的值
        // 当作为普通函数时，this 指向 window，此时结果为 false，将绑定函数的 this 指向 context
        return self.apply(this instanceof fBound ? this : context, args.concat(bindArgs));
    }
    // 修改返回函数的 prototype 为绑定函数的 prototype，实例就可以继承绑定函数的原型中的值
    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP(); // 直接 fBound.prototype = this.prototype ，修改 fBound.prototype 的时候会修改绑定函数的原型
    return fBound;
}
```

**调用 bind 的不是函数咋办？**

```ts
if (typeof this !== "function") {
  throw new Error("Function.prototype.bind - what is trying to be bound is not callable");
}
```

**线上用**

兼容：

```ts
Function.prototype.bind = Function.prototype.bind || function () {
    ……
};
```

bind 方法 与 apply 和 call 比较类似，也能改变函数体内的 this 指向。不同的是，**bind 方法的返回值是函数，并且需要稍后调用，才会执行**。而 apply 和 call 则是立即调用。

**如果 bind 的第一个参数是 null 或者 undefined，this 就指向全局对象 window。**

