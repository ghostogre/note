> new 运算符创建一个用户定义的对象类型的实例或具有构造函数的内置对象类型之一

在使用new操作符来调用一个构造函数的时候，发生了什么呢？其实很简单，就发生了四件事：

1. 创建一个空对象obj。
2. 将这个空对象的proto成员指向了构造函数对象的prototype成员对象，这是最关键的一步。
3. 将构造函数的作用域赋给新对象。
4. 返回新对象obj。这一步就是我们需要注意的地方，构造器中如果包含返回值。

因为 new 是关键字，所以无法像 bind 函数一样直接覆盖，所以我们写一个函数，命名为 objectFactory，来模拟 new 的效果。

因为 new 的结果是一个新对象，所以在模拟实现的时候，我们也要建立一个新对象，假设这个对象叫 obj，因为 obj 会具有构造函数里的属性，可以使用 `apply(obj, arguments)` 来给 obj 添加新的属性。。

实例的 __proto__ 属性会指向构造函数的 prototype，也正是因为建立起这样的关系，实例可以访问原型上的属性。

```ts
function objectFactory() {
		// 新建了一个对象 obj
    const obj = new Object(),
		// 取出第一个参数，就是我们要传入的构造函数。此外因为 shift 会修改原数组，所以 arguments 会被去除第一个参数
    Constructor = [].shift.call(arguments);
		// 将 obj 的原型指向构造函数，这样 obj 就可以访问到构造函数原型中的属性
    obj.__proto__ = Constructor.prototype;
		// 使用 apply，改变构造函数 this 的指向到新建的对象，这样 obj 就可以访问到构造函数中的属性
    const ret = Constructor.apply(obj, arguments);

    return typeof ret === 'object' ? ret : obj;

}
```

## 返回值

**在JavaScript构造函数中：如果return值类型，那么对构造函数没有影响，实例化对象返回空对象；如果return引用类型（数组，函数，对象），那么实例化对象就会返回该引用类型；**

