## 什么是Tree-shaking

通过 tree-shaking，将没有使用的模块去掉，这样来达到删除无用代码的目的。

Tree-shaking的本质是消除无用的js代码。无用代码消除在广泛存在于传统的编程语言编译器中，编译器可以判断出某些代码根本不影响输出，然后消除这些代码，这个称之为**DCE**（dead code elimination）。

Tree-shaking 是 DCE 的一种新的实现，Javascript同传统的编程语言不同的是，javascript绝大多数情况需要通过网络进行加载，然后执行，加载的文件大小越小，整体执行时间更短，所以去除无用代码以减少文件体积，对javascript来说更有意义。

Tree-shaking 和传统的 DCE的方法又不太一样，传统的DCE 消灭不可能执行的代码，而Tree-shaking **更关注消除没有用到的代码。**

**DCE消除大法**

Dead Code 一般具有以下几个特征

- 代码不会被执行，**不可到达**
- 代码执行的结果**不会被用到**
- 代码只会影响死变量（**只写不读**）

传统编译型的语言中，都是由编译器将Dead Code从AST（抽象语法树）中删除，那javascript中是由谁做DCE呢？

是著名的代码压缩优化工具 **uglify** 完成了javascript的DCE。

**注意**，uglify目前不会跨文件去做DCE。

**Tree-shaking消除大法**

tree-shaking的消除原理是依赖于**ES6的模块特性**。

ES6 module 特点：

- 只能作为模块顶层的语句出现
- import 的模块名只能是字符串常量
- import binding 是 immutable的

ES6模块依赖关系是确定的，和运行时的状态无关，**可以进行可靠的静态分析**，这就是tree-shaking的基础。所谓静态分析就是不执行代码，从字面量上对代码进行分析。

- rollup只处理 **函数** 和顶层的 `import/export` 变量，**不能把没用到的类消除掉**。
- javascript动态语言的特性使得静态分析比较困难。
- webpack 也不能消除没有用到的类。
- closure compiler 是最好的，但是需要我们添加侵入性约束，这与我们日常的基于node的开发流很难兼容。

**tree-shaking对函数效果较好**

函数的副作用相对较少，顶层函数相对来说更容易分析，加上babel默认都是"use strict"严格模式，减少顶层函数的动态访问的方式，也更容易分析。

