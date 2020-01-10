# Function

在 JavaScript 中有三种函数定义的方式：

```javascript
// 定义1. 函数声明
function add(a, b){
    return a + b
}

// 定义2. 函数表达式
const add = function(a, b){
    return a + b
}

// 定义3. new Function
const add = new Function('a', 'b', 'return a + b')
```

前两种函数定义方式是”静态“的，之所谓是”静态“的是函数定义之时，它的功能就确定下来了。而第三种函数定义方式则是”动态“，所谓”动态“是函数功能可以在程序运行过程中变化。

> 定义1 与 定义2也是有区别的，最关键的区别在于 JavaScript 函数和变量声明的提升行为

比如，我需要动态构造一个 n 个数相加的函数：

```javascript
let nums = [1,2,3,4]
let len = nums.length
let params = Array(len).fill('x').map((item, idx)=>{
    return '' + item + idx
})
const add = new Function(params.join(','), `
    return ${params.join('+')};
`)
console.log(add.toString())
console.log(add.apply(null, nums))

// 打印函数字符串add.toString()，可以得到：
function anonymous(x0,x1,x2,x3) {
    return x0+x1+x2+x3;
}
```

函数`add`的函数入参和函数体会根据`nums`的长度而动态生成，这样你可以根据实际情况来控制传入参数的个数，并且函数也只处理这几个入参。

`new Function`的函数声明方式较前两者首先性能上会有点吃亏，每次实例化都会消耗性能。其次，`new Function`声明的函数不支持”闭包“

```javascript
function bar(){
    let name = 'bar'
    let func = function(){return name}
    return func
}
bar()()  // "bar", func中name读取到bar词法作用域中的name变量

function foo(){
    let name = 'foo'
    let func = new Function('return name')
    return func
}
foo()()  // ReferenceError: name is not defined
```

### Source(../webpack/webpack插件 - tapable.md) 关于webpack中的 new Function

`factory.create`的主要逻辑是根据钩子类型`type`，拼接回调时序控制字符串，如下：

```javascript
fn = new Function(
  this.args(),
  '"use strict";\n' +
    this.header() +
    this.content({
      onError: err => `throw ${err};\n`,
      onResult: result => `return ${result};\n`,
      resultReturns: true,
      onDone: () => "",
      rethrowIfPossible: true
    })
);
```

我们以`SyncHook`为例：

```javascript
let sh = new SyncHook(["name"]);
sh.tap("A", (name) => {
    console.log("A");
});
sh.tap('B', (name) => {
    console.log("B");
});
sh.tap("C", (name) => {
    console.log("C");
});
sh.call();

// 结果
function anonymous(name) {
    "use strict";
    var _context;
    var _x = this._x;
    var _fn0 = _x[0];
    _fn0(name);
    var _fn1 = _x[1];
    _fn1(name);
    var _fn2 = _x[2];
    _fn2(name);
}
```

其中`_x`则指向`this.taps`数组，按序访问到每个`handler`，并执行`handler`。