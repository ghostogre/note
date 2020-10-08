`never` 类型是 TypeScript 中的底层类型。它自然被分配的一些例子：

- 一个从来不会有返回值的函数（如：如果函数内含有 `while(true) {}`）；
- 一个总是会抛出错误的函数（如：`function foo() { throw new Error('Not Implemented') }`，`foo` 的返回类型是 `never`）；

`never` 类型仅能被赋值给另外一个 `never`

## 与 `void` 的差异

一旦有人告诉你，`never` 表示一个从来不会优雅的返回的函数时，你可能马上就会想到与此类似的 `void`，然而实际上，`void` 表示没有任何类型，`never` 表示永远不存在的值的类型。

当一个函数没有返回值时，它返回了一个 `void` 类型，但是，当一个函数根本就没有返回值时（或者总是抛出错误），它返回了一个 `never`，`void` 指可以被赋值的类型（在 `strictNullChecking` 为 false 时），其他任何类型不能赋值给 `never`，除了 `never` 本身以外。