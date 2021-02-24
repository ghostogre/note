当JavaScript代码执行一段可执行代码(executable code)时，会创建对应的执行上下文(execution context)。

对于每个执行上下文，都有三个重要属性：

- 变量对象(Variable object，VO)
- 作用域链(Scope chain)
- this

## 作用域链

当查找变量的时候，会先从当前上下文的变量对象中查找，如果没有找到，就会从父级(词法层面上的父级)执行上下文的变量对象中查找，一直找到全局上下文的变量对象，也就是全局对象。这样由多个执行上下文的变量对象构成的链表就叫做作用域链。

### 函数创建

函数的作用域在函数定义的时候就决定了。

这是因为函数有一个**内部属性 [[scope]]**，当函数创建的时候，就会**保存所有父变量对象到其中**，你可以理解 [[scope]] 就是所有父变量对象的层级链，但是注意：[[scope]] 并不代表完整的作用域链！

```ts
function foo() {
    function bar() {
        ...
    }
}
```

函数创建时，各自的[[scope]]为：

```
foo.[[scope]] = [
  globalContext.VO 全局作用域
];

bar.[[scope]] = [
    fooContext.AO,
    globalContext.VO 全局作用域
];
```

### 函数激活

当函数激活时，进入函数上下文，创建 VO/AO 后，就会将活动对象添加到作用链的前端。

这时候执行上下文的作用域链，我们命名为 Scope：

```
Scope = [AO].concat([[Scope]]);
```

至此，作用域链创建完毕。

总结一下函数执行上下文中作用域链和变量对象的创建过程：

```ts
var scope = "global scope";
function checkscope(){
    var scope2 = 'local scope';
    return scope2;
}
checkscope();
```

1. checkscope 函数被创建，保存作用域链到 内部属性[[scope]]

```ts
checkscope.[[scope]] = [
    globalContext.VO
];
```

2. 执行 checkscope 函数，创建 checkscope 函数执行上下文，checkscope 函数执行上下文被压入执行上下文栈

```ts
ECStack = [
    checkscopeContext,
    globalContext
];
```

3. checkscope 函数并不立刻执行，开始做准备工作，第一步：复制函数[[scope]]属性创建作用域链

```ts
checkscopeContext = {
    Scope: checkscope.[[scope]],
}
```

4. 第二步：用 arguments 创建活动对象，随后初始化活动对象，加入形参、函数声明、变量声明

```ts
checkscopeContext = {
    AO: {
        arguments: {
            length: 0
        },
        scope2: undefined // 内部创建的变量 scope2
    }，
    Scope: checkscope.[[scope]],
}
```

5. 第三步：将活动对象压入 checkscope 作用域链顶端

```ts
checkscopeContext = {
    AO: {
        arguments: {
            length: 0
        },
        scope2: undefined
    },
    Scope: [AO, [[Scope]]]
}
```

6. 准备工作做完，开始执行函数，随着函数的执行，修改 AO 的属性值

```ts
checkscopeContext = {
    AO: {
        arguments: {
            length: 0
        },
        scope2: 'local scope'
    },
    Scope: [AO, [[Scope]]]
}
```

7. 查找到 scope2 的值，返回后函数执行完毕，函数上下文从执行上下文栈中弹出

```ts
ECStack = [
    globalContext
];
```

## 闭包

## 定义

MDN 对闭包的定义为：

> 闭包是指那些能够访问自由变量的函数。

那什么是自由变量呢？

> 自由变量是指在函数中使用的，但既不是函数参数也不是函数的局部变量的变量。

由此，我们可以看出闭包共有两部分组成：

> 闭包 = 函数 + 函数能够访问的自由变量

ECMAScript中，闭包指的是：

1. 从理论角度：所有的函数。因为它们都在创建的时候就将上层上下文的数据保存起来了。哪怕是简单的全局变量也是如此，因为函数中访问全局变量就相当于是在访问自由变量，这个时候使用最外层的作用域。
2. 从实践角度：以下函数才算是闭包：
   1. 即使创建它的**上下文已经销毁，它仍然存在**（比如，内部函数从父函数中返回）
   2. 在代码中引用了自由变量

```ts
var scope = "global scope";
function checkscope(){
    var scope = "local scope";
    function f(){
        return scope;
    }
    return f;
}

var foo = checkscope();
foo();
```

执行过程：

1. 进入全局代码，创建全局执行上下文，全局执行上下文压入执行上下文栈
2. 全局执行上下文初始化
3. 执行 checkscope 函数，创建 checkscope 函数执行上下文，checkscope 执行上下文被压入执行上下文栈
4. checkscope 执行上下文初始化，创建变量对象、作用域链、this等
5. checkscope 函数执行完毕，checkscope 执行上下文从执行上下文栈中弹出
6. 执行 f 函数，创建 f 函数执行上下文，f 执行上下文被压入执行上下文栈
7. f 执行上下文初始化，创建变量对象、作用域链、this等
8. f 函数执行完毕，f 函数上下文从执行上下文栈中弹出

f 执行上下文维护了一个作用域链：

```
fContext = {
    Scope: [AO, checkscopeContext.AO, globalContext.VO],
}
```

对的，就是因为这个作用域链，f 函数依然可以读取到 checkscopeContext.AO 的值，说明当 f 函数引用了 checkscopeContext.AO 中的值的时候，即使 checkscopeContext 被销毁了，但是 JavaScript 依然会让 checkscopeContext.AO 活在内存中，f 函数依然可以通过 f 函数的作用域链找到它，正是因为 JavaScript 做到了这一点，从而实现了闭包这个概念。

## 变量对象

变量对象是与执行上下文相关的数据作用域，存储了在上下文中定义的变量和函数声明。

### 全局上下文

全局对象:

1. 可以用关键字 this 引用全局对象，在客户端 JavaScript 中，全局对象就是 Window 对象。
2. 全局对象是由 Object 构造函数实例化的一个对象。
3. 客户端 JavaScript 中，全局对象有 window 属性指向自身。
4. 作为全局变量的宿主。
5. 预定义了一大堆函数和属性（Math等）。

全局上下文中的变量对象就是全局对象。

### 函数上下文

在函数上下文中，我们用活动对象(activation object, AO)来表示变量对象。活动对象是在进入函数上下文时刻被创建的，它通过函数的 arguments 属性初始化。arguments 属性值是 Arguments 对象。

### 执行过程

执行上下文的代码会分成两个阶段进行处理：

1. 进入执行上下文
2. 代码执行

### 进入执行上下文

当进入执行上下文时，这时候还没有执行代码，

变量对象会包括：

1. 函数的所有形参 (如果是函数上下文)
   - 由名称和对应值组成的一个变量对象的属性被创建
   - 没有实参，属性值设为 undefined
2. 函数声明
   - 由名称和对应值（函数对象）组成一个变量对象的属性被创建
   - 如果变量对象已经存在相同名称的属性，则完全替换这个属性（函数覆写）
3. 变量声明
   - 由名称和对应值（undefined）组成一个变量对象的属性被创建；
   - 在进入执行上下文时，首先会处理函数声明，其次会处理变量声明，如果如果变量名称跟已经声明的形式参数或函数相同，则变量声明不会干扰已经存在的这类属性。

### 代码执行

在代码执行阶段，会顺序执行代码，根据代码，修改变量对象的值

1. 全局上下文的变量对象初始化是全局对象
2. 函数上下文的变量对象初始化只包括 Arguments 对象
3. 在进入执行上下文时会给变量对象添加形参、函数声明、变量声明等初始的属性值
4. 在代码执行阶段，会再次修改变量对象的属性值

>没有通过 var 关键字声明，不会被存放在 AO 中。

## this

> 他这篇文章是根据规范来思考this，属于扩展内容

ECMAScript 的类型分为语言类型和规范类型。

语言类型就是我们常说的Undefined, Null, Boolean, String, Number, 和 Object。

在 ECMAScript 规范中还有一种只存在于规范中的类型，它们的作用是用来描述语言底层行为逻辑。

重点是便是其中的 Reference 类型（引用类型）。

### Reference

Reference 类型就是用来解释诸如 delete、typeof 以及赋值等操作行为的。

Reference 的构成，由三个组成部分，分别是：

- base value：属性所在的对象或者就是 EnvironmentRecord，他类型只能是语言类型（除了null以外）或者 EnvironmentRecord之一
- referenced name：就是属性的名称
- strict reference

```ts
var foo = 1;

// 对应的Reference是：
var fooReference = {
    base: EnvironmentRecord,
    name: 'foo',
    strict: false
};

GetValue(fooReference) // 1;
```

#### 规范中还提供了获取 Reference 组成部分的方法

1. **GetBase**：返回 reference 的 base value。
2. **IsPropertyReference**：如果 base value 是一个对象，就返回 true 。
3. **GetValue**：GetValue 返回对象属性真正的值，但是要注意：**调用 GetValue，返回的将是具体的值，而不再是一个 Reference**

> 以上方法都属于浏览器底层的实现，我们无法使用

### 如何确定this的值

1. 计算 **MemberExpression（属性访问表达式）** 的结果赋值给 ref

   ```ts
   function foo() {
       console.log(this)
   }
   
   foo(); // MemberExpression 是 foo
   
   function foo() {
       return function() {
           console.log(this)
       }
   }
   
   foo()(); // MemberExpression 是 foo()
   
   var foo = {
       bar: function () {
           return this;
       }
   }
   
   foo.bar(); // MemberExpression 是 foo.bar
   ```

   

2. 判断 ref 是不是一个 Reference 类型。

   关键就在于看规范是如何处理各种 MemberExpression，返回的结果是不是一个Reference类型。

